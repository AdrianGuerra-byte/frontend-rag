import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NEXT_PUBLIC_API_URL = "https://backend.test";

const buildDirectory = process.env.FRONTEND_CONTRACT_BUILD;
if (!buildDirectory) {
  throw new Error("FRONTEND_CONTRACT_BUILD no está definido.");
}

const {
  ANALYSIS_TIMEOUT_MS,
  ApiError,
  analyzeCase,
  buildAnalysisFormData,
  getApiErrorKind,
  parseAnalysisResponse,
  parseHealthResponse,
} = require(path.join(buildDirectory, "src/lib/api.js"));
const {
  ABSTENTION_MESSAGE,
  getImageQualityPresentation,
  getRedFlagPresentation,
  getScopePresentation,
  isSafeExternalUrl,
} = require(path.join(buildDirectory, "src/lib/analysis-contract.js"));
const {
  createInitialClinicalFormValues,
  validateClinicalForm,
} = require(path.join(buildDirectory, "src/lib/form-validation.js"));
const {
  getImageValidationError,
  MAX_IMAGE_BYTES,
} = require(path.join(buildDirectory, "src/lib/image-validation.js"));
const { SubmissionGate } = require(path.join(buildDirectory, "src/lib/submission-gate.js"));

const fixturesDirectory = path.resolve(__dirname, "fixtures");

function fixture(name) {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesDirectory, name), "utf8"),
  );
}

function validValues(overrides = {}) {
  return {
    age: "32",
    sex: "male",
    chiefComplaint: "Motivo de ejemplo",
    symptoms: "Síntoma de ejemplo",
    signs: "",
    medicalHistory: "",
    image: null,
    ...overrides,
  };
}

for (const name of [
  "normal-text-only.json",
  "normal-multimodal.json",
  "image-quality-limited.json",
  "image-quality-insufficient.json",
  "supported-but-insufficient.json",
  "zero-differential-abstention.json",
  "red-flags-present.json",
  "no-red-flags.json",
  "multiple-sources.json",
  "source-with-url.json",
]) {
  test(`parsea fixture válida: ${name}`, () => {
    const parsed = parseAnalysisResponse(fixture(name));
    assert.ok(parsed.analysisId);
    assert.ok(Array.isArray(parsed.differentialDiagnoses));
    assert.ok(Array.isArray(parsed.sources));
  });
}

test("parsea health incluyendo el estado de concurrencia", () => {
  assert.deepEqual(parseHealthResponse({ status: "ok", ollama: true, analysisBusy: true }), {
    status: "ok",
    ollama: true,
    analysisBusy: true,
  });
});

test("distingue calidad limitada de insuficiente y de ausencia de imagen", () => {
  assert.equal(getImageQualityPresentation("limited", "").tone, "warning");
  assert.equal(getImageQualityPresentation("insufficient", "").tone, "danger");
  assert.equal(getImageQualityPresentation("not_provided", "").tone, "neutral");
  assert.equal(getImageQualityPresentation("acceptable", "").tone, "success");
});

test("mapea estados de alcance solo cuando el backend los proporciona", () => {
  assert.equal(getScopePresentation("supported").label, "Caso dentro del alcance");
  assert.equal(
    getScopePresentation("supported_but_insufficient").label,
    "Información insuficiente para un análisis completo",
  );
  assert.equal(getScopePresentation("unsupported").label, "Caso fuera del alcance actual");
  assert.equal(getScopePresentation(undefined), null);
});

test("trata la frase negativa del backend como ausencia de signos de alarma", () => {
  assert.deepEqual(
    getRedFlagPresentation(fixture("no-red-flags.json").redFlags),
    { hasFlags: false, flags: [] },
  );
  assert.equal(
    getRedFlagPresentation(fixture("red-flags-present.json").redFlags).hasFlags,
    true,
  );
});

test("expone una abstención semántica cuando no hay diferenciales", () => {
  const parsed = parseAnalysisResponse(fixture("zero-differential-abstention.json"));
  assert.equal(parsed.differentialDiagnoses.length, 0);
  assert.match(ABSTENTION_MESSAGE, /elementos suficientes/);
});

test("conserva la procedencia y solo habilita URLs HTTP(S) seguras", () => {
  const parsed = parseAnalysisResponse(fixture("multiple-sources.json"));
  assert.equal(parsed.sources[0].title, "Primera fuente de ejemplo");
  assert.equal(parsed.sources[0].document, "fuente-a.pdf");
  assert.equal(parsed.sources[0].page, 3);
  assert.equal(isSafeExternalUrl("https://example.org/documento"), true);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl(undefined), false);
});

test("rechaza un estado de respuesta desconocido sin romper la interfaz", () => {
  assert.throws(
    () => parseAnalysisResponse(fixture("malformed-unknown-response.json")),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 502);
      assert.equal(error.kind, "invalid_response");
      return true;
    },
  );
});

test("valida campos mínimos del formulario con los límites del backend", () => {
  const errors = validateClinicalForm(createInitialClinicalFormValues());
  assert.deepEqual(Object.keys(errors).sort(), ["age", "chiefComplaint", "sex", "symptoms"]);
  assert.deepEqual(validateClinicalForm(validValues({ age: "0" })), {});
  assert.notDeepEqual(validateClinicalForm(validValues({ age: "131" })), {});
});

test("valida archivo vacío, tamaño, formato y archivo aceptable", () => {
  assert.equal(getImageValidationError(new File([], "empty.png", { type: "image/png" })) !== null, true);
  assert.equal(
    getImageValidationError(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })),
    "La imagen no puede superar los 10 MB.",
  );
  assert.equal(
    getImageValidationError(new File(["data"], "study.gif", { type: "image/gif" })),
    "Seleccione una imagen JPEG, JPG, PNG o WEBP.",
  );
  assert.equal(
    getImageValidationError(new File(["data"], "study.png", { type: "text/plain" })),
    "Seleccione una imagen JPEG, JPG, PNG o WEBP.",
  );
  assert.equal(getImageValidationError(new File(["data"], "study.png")), null);
  assert.equal(getImageValidationError(new File(["data"], "study.png", { type: "image/png" })), null);
});

test("la barrera de envío impide duplicados y se puede liberar al reiniciar", () => {
  const gate = new SubmissionGate();
  assert.equal(gate.acquire(), true);
  assert.equal(gate.acquire(), false);
  gate.reset();
  assert.equal(gate.acquire(), true);
});

test("el reinicio crea un caso limpio sin conservar datos clínicos", () => {
  const values = createInitialClinicalFormValues();
  assert.deepEqual(values, {
    age: "",
    sex: "",
    chiefComplaint: "",
    symptoms: "",
    signs: "",
    medicalHistory: "",
    image: null,
  });
});

test("envía los nombres multipart exactos y conserva la imagen como archivo", async () => {
  const image = new File(["image-bytes"], "study.png", { type: "image/png" });
  const values = validValues({ image });
  const formData = buildAnalysisFormData(values);
  assert.equal(formData.get("age"), "32");
  assert.equal(formData.get("chief_complaint"), "Motivo de ejemplo");
  assert.equal(formData.get("medical_history"), "");
  const receivedImage = formData.get("image");
  assert.equal(receivedImage.name, image.name);
  assert.equal(receivedImage.type, image.type);

  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify(fixture("normal-multimodal.json")), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  };

  try {
    const parsed = await analyzeCase(values);
    assert.equal(parsed.analysisId, "fixture-multimodal-001");
    assert.equal(request.url, "https://backend.test/api/analyze");
    assert.equal(request.init.method, "POST");
    assert.equal(request.init.body.get("image").name, "study.png");
  } finally {
    global.fetch = originalFetch;
  }
});

test("mapea 429 ANALYSIS_BUSY sin reintento automático", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify(fixture("errors/analysis-busy.json")), {
      headers: { "content-type": "application/json" },
      status: 429,
    });

  try {
    await assert.rejects(
      () => analyzeCase(validValues()),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 429);
        assert.equal(error.code, "ANALYSIS_BUSY");
        assert.equal(getApiErrorKind(error), "busy");
        assert.match(error.message, /otro análisis en proceso/);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("mapea una falla de red sin afirmar que falló el análisis clínico", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  try {
    await assert.rejects(
      () => analyzeCase(validValues()),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(getApiErrorKind(error), "network");
        assert.match(error.message, /No fue posible conectar/);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("conserva la categoría de configuración para mostrar un estado claro en desarrollo", () => {
  assert.equal(
    getApiErrorKind(new ApiError("Configuración pendiente", 0, "CONFIGURATION_ERROR", "configuration")),
    "configuration",
  );
});

test("mantiene un timeout de frontend por encima del p90 multimodal medido", () => {
  assert.equal(ANALYSIS_TIMEOUT_MS, 120000);
  assert.ok(ANALYSIS_TIMEOUT_MS > 51420);
});

test("clasifica una respuesta 504 como timeout sin mostrar internals", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ code: "UNKNOWN_TIMEOUT" }), {
      headers: { "content-type": "application/json" },
      status: 504,
    });

  try {
    await assert.rejects(
      () => analyzeCase(validValues()),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(getApiErrorKind(error), "timeout");
        assert.match(error.message, /no fue posible completar el análisis/i);
        assert.doesNotMatch(error.message, /UNKNOWN_TIMEOUT/);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});
