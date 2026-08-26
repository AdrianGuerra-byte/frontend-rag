import type {
  ClinicalAnalysis,
  ClinicalFormValues,
  DifferentialDiagnosis,
  HealthResponse,
  ImageQuality,
  MedicalSource,
  PossibleFinding,
  Referral,
} from "@/src/types/analysis";

const DEFAULT_API_URL = "https://hoyt-uncautious-jonnie.ngrok-free.dev";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || DEFAULT_API_URL;
const HEALTH_TIMEOUT_MS = 10_000;
const ANALYSIS_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isImageQuality(value: unknown): value is ImageQuality {
  return (
    isRecord(value) &&
    (value.status === "adequate" ||
      value.status === "insufficient" ||
      value.status === "not_provided") &&
    typeof value.message === "string"
  );
}

function isPossibleFinding(value: unknown): value is PossibleFinding {
  return (
    isRecord(value) &&
    typeof value.finding === "string" &&
    (value.confidence === "low" ||
      value.confidence === "moderate" ||
      value.confidence === "high")
  );
}

function isDifferentialDiagnosis(value: unknown): value is DifferentialDiagnosis {
  return (
    isRecord(value) &&
    typeof value.diagnosis === "string" &&
    isStringArray(value.reasoning)
  );
}

function isReferral(value: unknown): value is Referral {
  return (
    isRecord(value) &&
    typeof value.recommended === "boolean" &&
    (value.priority === "urgent" ||
      value.priority === "soon" ||
      value.priority === "routine" ||
      value.priority === "not_assessed") &&
    typeof value.reason === "string"
  );
}

function isMedicalSource(value: unknown): value is MedicalSource {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.source === "string" &&
    typeof value.document === "string" &&
    (value.page === undefined || value.page === null ||
      (typeof value.page === "number" && Number.isInteger(value.page) && value.page >= 1))
  );
}

function parseAnalysis(value: unknown): ClinicalAnalysis {
  if (
    !isRecord(value) ||
    typeof value.analysisId !== "string" ||
    !isImageQuality(value.imageQuality) ||
    !Array.isArray(value.possibleFindings) ||
    !value.possibleFindings.every(isPossibleFinding) ||
    !Array.isArray(value.differentialDiagnoses) ||
    !value.differentialDiagnoses.every(isDifferentialDiagnosis) ||
    !isStringArray(value.redFlags) ||
    !isStringArray(value.missingInformation) ||
    !isReferral(value.referral) ||
    !Array.isArray(value.sources) ||
    !value.sources.every(isMedicalSource) ||
    !isStringArray(value.limitations)
  ) {
    throw new ApiError("El servicio devolvió un resultado no válido.", 502);
  }

  return value as unknown as ClinicalAnalysis;
}

function parseHealth(value: unknown): HealthResponse {
  if (!isRecord(value) || typeof value.status !== "string" || typeof value.ollama !== "boolean") {
    throw new ApiError("El servicio devolvió un estado no válido.", 502);
  }

  return value as unknown as HealthResponse;
}

function extractDetail(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    const messages = payload.detail.flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }

      return isRecord(item) && typeof item.msg === "string" ? [item.msg] : [];
    });

    return messages.length ? messages.join(" ") : null;
  }

  return typeof payload.message === "string" ? payload.message : null;
}

const knownErrorTranslations: Record<string, string> = {
  "Unsupported image format. Use JPEG, JPG, PNG, or WEBP.":
    "Formato de imagen no compatible. Use JPEG, JPG, PNG o WEBP.",
  "Image exceeds the 10 MB upload limit.": "La imagen supera el límite de carga de 10 MB.",
  "Uploaded image is empty.": "La imagen enviada está vacía.",
  "Unable to generate clinical-support analysis.":
    "El servicio no pudo generar el análisis de apoyo clínico.",
  "Analysis not found.": "No se encontró el análisis solicitado.",
};

function translateKnownMessage(message: string) {
  return knownErrorTranslations[message] ?? message;
}

async function requestJson(path: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // Use the status-based message below when the response is not JSON.
      }

      const detail = extractDetail(payload);
      const safeDetail = detail && !/traceback|stack trace|exception|file "/i.test(detail)
        ? translateKnownMessage(detail.slice(0, 240))
        : null;

      throw new ApiError(
        safeDetail ?? `El servicio no pudo completar la solicitud (${response.status}).`,
        response.status,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new ApiError("El servicio devolvió una respuesta no válida.", 502);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("El análisis tardó demasiado. Intente nuevamente.", 408);
    }

    throw new ApiError("No fue posible conectar con el servicio. Verifique su conexión e intente nuevamente.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getApiUrl() {
  if (!API_URL) {
    throw new ApiError("El servicio de análisis no está configurado.");
  }

  return API_URL;
}

export async function getHealth() {
  const payload = await requestJson("/health", { method: "GET" }, HEALTH_TIMEOUT_MS);
  return parseHealth(payload);
}

export async function analyzeCase(values: ClinicalFormValues) {
  if (!values.image) {
    throw new ApiError("Adjunte una radiografía para continuar.", 400);
  }

  const formData = new FormData();
  formData.append("age", values.age);
  formData.append("sex", values.sex);
  formData.append("chief_complaint", values.chiefComplaint.trim());
  formData.append("symptoms", values.symptoms.trim());

  if (values.signs.trim()) {
    formData.append("signs", values.signs.trim());
  }

  if (values.medicalHistory.trim()) {
    formData.append("medical_history", values.medicalHistory.trim());
  }

  formData.append("image", values.image, values.image.name);

  const payload = await requestJson(
    "/api/analyze",
    { body: formData, method: "POST" },
    ANALYSIS_TIMEOUT_MS,
  );

  return parseAnalysis(payload);
}

export async function getAnalyses() {
  const payload = await requestJson("/api/analyses", { method: "GET" }, DEFAULT_TIMEOUT_MS);

  if (!Array.isArray(payload)) {
    throw new ApiError("El servicio devolvió una lista de análisis no válida.", 502);
  }

  return payload.map(parseAnalysis);
}

export async function getAnalysis(id: string) {
  const payload = await requestJson(
    `/api/analyses/${encodeURIComponent(id)}`,
    { method: "GET" },
    DEFAULT_TIMEOUT_MS,
  );

  return parseAnalysis(payload);
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "No fue posible completar el análisis. Verifique la conexión con el servicio e intente nuevamente.";
}
