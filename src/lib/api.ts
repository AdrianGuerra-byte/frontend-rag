import type {
  ClinicalAnalysis,
  ClinicalFormValues,
  DifferentialDiagnosis,
  FindingConfidence,
  HealthResponse,
  ImageQuality,
  ImageQualityStatus,
  MedicalSource,
  PossibleFinding,
  Referral,
  ReferralPriority,
  ScopeState,
} from "../types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";
const HEALTH_TIMEOUT_MS = 10_000;
// Backend multimodal p90 is ~51.42 s; this leaves room for normal network
// variance without keeping a request open indefinitely.
export const ANALYSIS_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 15_000;

const NETWORK_ERROR_MESSAGE =
  "No fue posible conectar con el servicio de análisis. Verifica la conexión e inténtalo de nuevo.";
const HEALTH_TIMEOUT_MESSAGE =
  "No fue posible verificar la conexión con el servicio de análisis.";
const ANALYSIS_TIMEOUT_MESSAGE =
  "La respuesta tardó más de lo esperado. Intenta nuevamente de forma manual.";
const CONFIGURATION_ERROR_MESSAGE =
  "El servicio de análisis no está configurado para este entorno.";
const INVALID_RESPONSE_MESSAGE = "El servicio devolvió un resultado no válido.";

export type ApiErrorKind =
  | "configuration"
  | "network"
  | "timeout"
  | "busy"
  | "validation"
  | "invalid_file"
  | "unsupported_file"
  | "file_too_large"
  | "image_unavailable"
  | "invalid_response"
  | "backend";

const backendErrorMessages: Record<string, string> = {
  ANALYSIS_BUSY:
    "Hay otro análisis en proceso. Espera a que termine antes de iniciar uno nuevo.",
  INVALID_IMAGE: "La imagen seleccionada no es válida.",
  IMAGE_TOO_LARGE: "La imagen supera el tamaño permitido.",
  UNSUPPORTED_IMAGE: "El formato de la imagen no es compatible.",
  VALIDATION_ERROR: "Revisa los datos del caso antes de continuar.",
  VISION_UNAVAILABLE:
    "El análisis de imagen no estuvo disponible. Revisa las limitaciones del resultado o intenta nuevamente.",
  VISION_MODEL_UNAVAILABLE:
    "El análisis de imagen no estuvo disponible. Revisa las limitaciones del resultado o intenta nuevamente.",
  VISION_INVALID_RESPONSE: "No fue posible validar la respuesta del análisis de imagen.",
  VISION_TIMEOUT: "El análisis de la imagen tardó más de lo esperado.",
  RAG_UNAVAILABLE: "No fue posible consultar la evidencia médica en este momento.",
  SYNTHESIS_UNAVAILABLE: "No fue posible completar la síntesis del análisis.",
  SYNTHESIS_MODEL_UNAVAILABLE:
    "El servicio de síntesis no está disponible temporalmente.",
  SYNTHESIS_INVALID_RESPONSE: "No fue posible validar el resultado del análisis.",
  SYNTHESIS_TIMEOUT: "La síntesis del análisis tardó más de lo esperado.",
  INTERNAL_ERROR: "No fue posible completar el análisis.",
  NOT_FOUND: "No se encontró el recurso solicitado.",
};

const knownErrorTranslations: Record<string, string> = {
  "Unsupported image format. Use JPEG, JPG, PNG, or WEBP.":
    "Formato de imagen no compatible. Use JPEG, JPG, PNG o WEBP.",
  "Image file does not exist.": "La imagen seleccionada no es válida.",
  "Image file cannot be read.": "La imagen seleccionada no es válida.",
  "Image exceeds the 10 MB upload limit.": "La imagen supera el tamaño permitido.",
  "Uploaded image is empty.": "La imagen seleccionada está vacía.",
  "Unable to generate clinical-support analysis.":
    "El servicio no pudo generar el análisis de apoyo clínico.",
  "Analysis not found.": "No se encontró el análisis solicitado.",
};

function errorKindFor(status: number, code: string | null): ApiErrorKind {
  switch (code) {
    case "ANALYSIS_BUSY":
      return "busy";
    case "VALIDATION_ERROR":
      return "validation";
    case "INVALID_IMAGE":
      return "invalid_file";
    case "UNSUPPORTED_IMAGE":
      return "unsupported_file";
    case "IMAGE_TOO_LARGE":
      return "file_too_large";
    case "VISION_UNAVAILABLE":
    case "VISION_MODEL_UNAVAILABLE":
    case "VISION_INVALID_RESPONSE":
    case "VISION_TIMEOUT":
      return "image_unavailable";
    case "SYNTHESIS_INVALID_RESPONSE":
    case "INVALID_RESPONSE":
      return "invalid_response";
    case "RAG_UNAVAILABLE":
    case "SYNTHESIS_UNAVAILABLE":
    case "SYNTHESIS_MODEL_UNAVAILABLE":
    case "INTERNAL_ERROR":
    case "NOT_FOUND":
      return "backend";
    case "SYNTHESIS_TIMEOUT":
      return "timeout";
    default:
      if (status === 413) return "file_too_large";
      if (status === 415) return "unsupported_file";
      if (status === 422) return "validation";
      if (status === 429) return "busy";
      if (status === 408) return "timeout";
      if (status === 504) return "timeout";
      if (status >= 500) return "backend";
      return "network";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code: string | null = null,
    public readonly kind: ApiErrorKind = errorKindFor(status, code),
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

function isKnownValue<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

const imageQualityStatuses: readonly ImageQualityStatus[] = [
  "adequate",
  "acceptable",
  "limited",
  "insufficient",
  "not_provided",
];
const findingConfidences: readonly FindingConfidence[] = ["low", "moderate", "high"];
const referralPriorities: readonly ReferralPriority[] = [
  "urgent",
  "soon",
  "routine",
  "not_assessed",
];
const scopeStates: readonly ScopeState[] = [
  "supported",
  "supported_but_insufficient",
  "unsupported",
];

function isImageQuality(value: unknown): value is ImageQuality {
  return (
    isRecord(value) &&
    isKnownValue(value.status, imageQualityStatuses) &&
    typeof value.message === "string"
  );
}

function isScopeState(value: unknown): value is ScopeState | null | undefined {
  return value == null || isKnownValue(value, scopeStates);
}

function isPossibleFinding(value: unknown): value is PossibleFinding {
  return (
    isRecord(value) &&
    typeof value.finding === "string" &&
    isKnownValue(value.confidence, findingConfidences) &&
    (value.origin === undefined || value.origin === "reported" || value.origin === "image")
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
    isKnownValue(value.priority, referralPriorities) &&
    typeof value.reason === "string"
  );
}

function isOptionalString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalYear(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    typeof value === "string" ||
    typeof value === "number"
  );
}

function isOptionalPage(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 1)
  );
}

function isMedicalSource(value: unknown): value is MedicalSource {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.source === "string" &&
    typeof value.document === "string" &&
    isOptionalPage(value.page) &&
    isOptionalString(value.institution) &&
    isOptionalString(value.category) &&
    isOptionalYear(value.year) &&
    isOptionalString(value.documentType) &&
    isOptionalString(value.chunk) &&
    isOptionalString(value.context) &&
    isOptionalString(value.url)
  );
}

function invalidResponse(message = INVALID_RESPONSE_MESSAGE): never {
  throw new ApiError(message, 502, "INVALID_RESPONSE", "invalid_response");
}

/** Runtime validation at the trust boundary for the public analysis response. */
export function parseAnalysisResponse(value: unknown): ClinicalAnalysis {
  if (
    !isRecord(value) ||
    typeof value.analysisId !== "string" ||
    !value.analysisId.trim() ||
    !isImageQuality(value.imageQuality) ||
    (value.clinicalSummary !== undefined &&
      value.clinicalSummary !== null &&
      typeof value.clinicalSummary !== "string") ||
    !isScopeState(value.scopeState) ||
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
    return invalidResponse();
  }

  const result: ClinicalAnalysis = {
    analysisId: value.analysisId,
    clinicalSummary: value.clinicalSummary == null ? null : value.clinicalSummary,
    imageQuality: {
      status: value.imageQuality.status,
      message: value.imageQuality.message,
    },
    scopeState: value.scopeState ?? null,
    possibleFindings: value.possibleFindings.map((finding) => ({
      finding: finding.finding,
      confidence: finding.confidence,
      ...(finding.origin ? { origin: finding.origin } : {}),
    })),
    differentialDiagnoses: value.differentialDiagnoses.map((item) => ({
      diagnosis: item.diagnosis,
      reasoning: [...item.reasoning],
    })),
    redFlags: [...value.redFlags],
    missingInformation: [...value.missingInformation],
    referral: {
      recommended: value.referral.recommended,
      priority: value.referral.priority,
      reason: value.referral.reason,
    },
    sources: value.sources.map((source) => ({
      title: source.title,
      source: source.source,
      document: source.document,
      page: source.page ?? null,
      ...(source.institution != null ? { institution: source.institution } : {}),
      ...(source.category != null ? { category: source.category } : {}),
      ...(source.year != null ? { year: source.year } : {}),
      ...(source.documentType != null ? { documentType: source.documentType } : {}),
      ...(source.chunk != null ? { chunk: source.chunk } : {}),
      ...(source.context != null ? { context: source.context } : {}),
      ...(source.url != null ? { url: source.url } : {}),
    })),
    limitations: [...value.limitations],
  };

  return result;
}

export function parseHealthResponse(value: unknown): HealthResponse {
  if (
    !isRecord(value) ||
    typeof value.status !== "string" ||
    typeof value.ollama !== "boolean" ||
    (value.analysisBusy !== undefined && typeof value.analysisBusy !== "boolean")
  ) {
    return invalidResponse("El servicio devolvió un estado no válido.");
  }

  return {
    status: value.status,
    ollama: value.ollama,
    analysisBusy: value.analysisBusy === true,
  };
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
      if (typeof item === "string") return [item];
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

  return (
    candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" &&
        Object.prototype.hasOwnProperty.call(backendErrorMessages, candidate),
    ) ?? null
  );
}

function getHttpErrorMessage(status: number, code: string | null, detail: string | null) {
  if (code && Object.prototype.hasOwnProperty.call(backendErrorMessages, code)) {
    return backendErrorMessages[code];
  }

  if (detail && Object.prototype.hasOwnProperty.call(knownErrorTranslations, detail)) {
    return knownErrorTranslations[detail];
  }

  if (status === 413) return backendErrorMessages.IMAGE_TOO_LARGE;
  if (status === 415) return backendErrorMessages.UNSUPPORTED_IMAGE;
  if (status === 422) return backendErrorMessages.VALIDATION_ERROR;
  if (status === 429) return backendErrorMessages.ANALYSIS_BUSY;
  if (status === 408) return ANALYSIS_TIMEOUT_MESSAGE;
  if (status === 503) return "El servicio de análisis no está disponible temporalmente.";
  if (status >= 500) return backendErrorMessages.INTERNAL_ERROR;
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
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
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
        // Use the status-based safe message below.
      }

      const code = extractErrorCode(payload);
      const detail = extractDetail(payload);
      throw new ApiError(
        getHttpErrorMessage(response.status, code, detail),
        response.status,
        code,
      );
    }

    try {
      return await response.json();
    } catch {
      return invalidResponse();
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(timeoutMessage, 408, null, "timeout");
    }

    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, null, "network");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function getApiUrl() {
  if (!API_URL) {
    throw new ApiError(CONFIGURATION_ERROR_MESSAGE, 0, "CONFIGURATION_ERROR", "configuration");
  }

  try {
    const parsedUrl = new URL(API_URL);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Unsupported API URL protocol");
    }
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, null, "network");
  }

  return API_URL;
}

export function buildAnalysisFormData(values: ClinicalFormValues) {
  const formData = new FormData();
  formData.append("age", values.age.trim());
  formData.append("sex", values.sex.trim());
  formData.append("chief_complaint", values.chiefComplaint.trim());
  formData.append("symptoms", values.symptoms.trim());
  formData.append("signs", values.signs.trim());
  formData.append("medical_history", values.medicalHistory.trim());

  if (values.image) {
    // Keep the original File. Preview memory and inference preprocessing are
    // deliberately owned by the browser/backend respectively.
    formData.append("image", values.image, values.image.name);
  }

  return formData;
}

export async function getHealth() {
  const payload = await requestJson(
    "/health",
    { method: "GET" },
    HEALTH_TIMEOUT_MS,
    HEALTH_TIMEOUT_MESSAGE,
  );
  return parseHealthResponse(payload);
}

export async function analyzeCase(values: ClinicalFormValues) {
  const payload = await requestJson(
    "/api/analyze",
    { body: buildAnalysisFormData(values), method: "POST" },
    ANALYSIS_TIMEOUT_MS,
    ANALYSIS_TIMEOUT_MESSAGE,
  );

  return parseAnalysisResponse(payload);
}

export async function getAnalyses() {
  const payload = await requestJson("/api/analyses", { method: "GET" }, DEFAULT_TIMEOUT_MS);

  if (!Array.isArray(payload)) {
    return invalidResponse("El servicio devolvió una lista de análisis no válida.");
  }

  return payload.map(parseAnalysisResponse);
}

export async function getAnalysis(id: string) {
  const payload = await requestJson(
    `/api/analyses/${encodeURIComponent(id)}`,
    { method: "GET" },
    DEFAULT_TIMEOUT_MS,
  );

  return parseAnalysisResponse(payload);
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return NETWORK_ERROR_MESSAGE;
}

export function getApiErrorKind(error: unknown): ApiErrorKind {
  if (error instanceof ApiError) {
    return error.kind;
  }

  return "network";
}
