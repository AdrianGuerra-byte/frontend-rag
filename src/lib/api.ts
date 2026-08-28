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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";
const HEALTH_TIMEOUT_MS = 10_000;
const ANALYSIS_TIMEOUT_MS = 180_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const NETWORK_ERROR_MESSAGE = "No fue posible conectar con el servicio de análisis.";
const ANALYSIS_TIMEOUT_MESSAGE =
  "El análisis está tardando más de lo esperado. Intenta nuevamente.";
const CONFIGURATION_ERROR_MESSAGE = "El servicio de análisis no está configurado.";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 0,
    public readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const backendErrorMessages: Record<string, string> = {
  ANALYSIS_BUSY: "El sistema está procesando otro análisis. Intenta nuevamente en unos momentos.",
  INVALID_IMAGE: "La imagen seleccionada no es válida.",
  IMAGE_TOO_LARGE: "La imagen supera el tamaño permitido.",
  UNSUPPORTED_IMAGE: "El formato de la imagen no es compatible.",
  VALIDATION_ERROR: "Revisa los datos del caso antes de continuar.",
  VISION_ERROR: "No fue posible procesar la imagen en este momento.",
  VISION_INVALID_IMAGE: "La imagen seleccionada no es válida.",
  VISION_UNAVAILABLE: "No fue posible procesar la imagen en este momento.",
  VISION_MODEL_NOT_CONFIGURED: "El análisis de imagen no está disponible temporalmente.",
  VISION_MODEL_UNAVAILABLE: "El análisis de imagen no está disponible temporalmente.",
  VISION_INVALID_RESPONSE: "El análisis de imagen devolvió una respuesta no válida.",
  VISION_TIMEOUT: "El análisis de la imagen tardó más de lo esperado.",
  RAG_UNAVAILABLE: "No fue posible consultar la base médica en este momento.",
  SYNTHESIS_ERROR: "No fue posible completar el análisis.",
  SYNTHESIS_MODEL_NOT_CONFIGURED: "El servicio de análisis no está disponible temporalmente.",
  SYNTHESIS_UNAVAILABLE: "No fue posible completar el análisis en este momento.",
  SYNTHESIS_MODEL_UNAVAILABLE: "El servicio de análisis no está disponible temporalmente.",
  SYNTHESIS_INVALID_RESPONSE: "No fue posible validar el resultado del análisis.",
  SYNTHESIS_TIMEOUT: "El análisis tardó más de lo esperado.",
  INTERNAL_ERROR: "No fue posible completar el análisis.",
};

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

function isOptionalImageQuality(value: unknown): value is ImageQuality | null | undefined {
  return value == null || isImageQuality(value);
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
    typeof value.reason === "string" &&
    (value.escalation === undefined || value.escalation === null || typeof value.escalation === "string")
  );
}

function isMedicalSource(value: unknown): value is MedicalSource {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    (value.source === undefined || value.source === null || typeof value.source === "string") &&
    (value.institution === undefined ||
      value.institution === null ||
      typeof value.institution === "string") &&
    (value.category === undefined || value.category === null || typeof value.category === "string") &&
    typeof value.document === "string" &&
    (value.page === undefined || value.page === null ||
      (typeof value.page === "number" && Number.isInteger(value.page) && value.page >= 1))
  );
}

function parseAnalysis(value: unknown): ClinicalAnalysis {
  if (
    !isRecord(value) ||
    typeof value.analysisId !== "string" ||
    !isOptionalImageQuality(value.imageQuality) ||
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

function extractErrorCode(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const candidates: unknown[] = [
    payload.code,
    payload.errorCode,
    payload.error_code,
    payload.detail,
    payload.message,
  ];

  if (isRecord(payload.error)) {
    candidates.push(payload.error.code, payload.error.errorCode, payload.error.error_code);
  }

  if (isRecord(payload.detail)) {
    candidates.push(payload.detail.code, payload.detail.errorCode, payload.detail.error_code);
  }

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" &&
      Object.prototype.hasOwnProperty.call(backendErrorMessages, candidate),
  ) ?? null;
}

const knownErrorTranslations: Record<string, string> = {
  "Unsupported image format. Use JPEG, JPG, PNG, or WEBP.":
    "Formato de imagen no compatible. Use JPEG, JPG, PNG o WEBP.",
  "Image file does not exist.": "La imagen seleccionada no es válida.",
  "Image file cannot be read.": "La imagen seleccionada no es válida.",
  "Image exceeds the 10 MB upload limit.": "La imagen supera el tamaño permitido.",
  "Uploaded image is empty.": "La imagen seleccionada no es válida.",
  "Unable to generate clinical-support analysis.":
    "El servicio no pudo generar el análisis de apoyo clínico.",
  "Analysis not found.": "No se encontró el análisis solicitado.",
};

function getHttpErrorMessage(status: number, code: string | null, detail: string | null) {
  if (code && Object.prototype.hasOwnProperty.call(backendErrorMessages, code)) {
    return backendErrorMessages[code];
  }

  if (detail && Object.prototype.hasOwnProperty.call(knownErrorTranslations, detail)) {
    return knownErrorTranslations[detail];
  }

  if (status === 413) {
    return backendErrorMessages.IMAGE_TOO_LARGE;
  }

  if (status === 422) {
    return backendErrorMessages.VALIDATION_ERROR;
  }

  if (status === 429) {
    return backendErrorMessages.ANALYSIS_BUSY;
  }

  if (status === 408) {
    return ANALYSIS_TIMEOUT_MESSAGE;
  }

  if (status === 503) {
    return "El servicio de análisis no está disponible temporalmente.";
  }

  if (status >= 500) {
    return backendErrorMessages.INTERNAL_ERROR;
  }

  return "El servicio no pudo completar la solicitud.";
}

async function requestJson(
  path: string,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage = NETWORK_ERROR_MESSAGE,
) {
  const apiUrl = getApiUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);

  if (apiUrl.includes("ngrok")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers,
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

      const code = extractErrorCode(payload);
      const detail = extractDetail(payload);
      const safeDetail = detail && !/traceback|stack trace|exception|file "/i.test(detail)
        ? detail.slice(0, 240)
        : null;

      throw new ApiError(
        getHttpErrorMessage(response.status, code, safeDetail),
        response.status,
        code,
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
      throw new ApiError(timeoutMessage, 408);
    }

    throw new ApiError(NETWORK_ERROR_MESSAGE);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getApiUrl() {
  if (!API_URL) {
    throw new ApiError(CONFIGURATION_ERROR_MESSAGE);
  }

  try {
    const parsedUrl = new URL(API_URL);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Unsupported API URL protocol");
    }
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE);
  }

  return API_URL;
}

export async function getHealth() {
  const payload = await requestJson("/health", { method: "GET" }, HEALTH_TIMEOUT_MS);
  return parseHealth(payload);
}

export async function analyzeCase(values: ClinicalFormValues) {
  const formData = new FormData();
  formData.append("age", values.age.trim());
  formData.append("sex", values.sex.trim());
  formData.append("chief_complaint", values.chiefComplaint.trim());
  formData.append("symptoms", values.symptoms.trim());
  formData.append("signs", values.signs.trim());
  formData.append("medical_history", values.medicalHistory.trim());

  if (values.image) {
    formData.append("image", values.image, values.image.name);
  }

  const payload = await requestJson(
    "/api/analyze",
    { body: formData, method: "POST" },
    ANALYSIS_TIMEOUT_MS,
    ANALYSIS_TIMEOUT_MESSAGE,
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

  return NETWORK_ERROR_MESSAGE;
}
