/**
 * Public image-quality values returned by the backend.
 *
 * `acceptable` is kept as a forward-compatible spelling used by some V2
 * fixtures. The current stable API returns `adequate`.
 */
export type ImageQualityStatus =
  | "adequate"
  | "acceptable"
  | "limited"
  | "insufficient"
  | "not_provided";

export type ScopeState = "supported" | "supported_but_insufficient" | "unsupported";

export type FindingConfidence = "low" | "moderate" | "high";

export type ReferralPriority =
  | "urgent"
  | "soon"
  | "routine"
  | "not_assessed";

export interface ImageQuality {
  status: ImageQualityStatus;
  message: string;
}

export interface PossibleFinding {
  finding: string;
  confidence: FindingConfidence;
  /** Optional additive field; the stable API currently encodes this in text. */
  origin?: "reported" | "image";
}

export interface DifferentialDiagnosis {
  diagnosis: string;
  reasoning: string[];
}

export interface Referral {
  recommended: boolean;
  priority: ReferralPriority;
  reason: string;
}

export interface MedicalSource {
  title: string;
  source: string;
  document: string;
  page?: number | null;
  /** Optional metadata is rendered only when it is actually supplied. */
  institution?: string | null;
  category?: string | null;
  year?: string | number | null;
  documentType?: string | null;
  chunk?: string | null;
  context?: string | null;
  url?: string | null;
}

export interface ClinicalAnalysis {
  analysisId: string;
  clinicalSummary?: string | null;
  imageQuality: ImageQuality;
  /** Scope is supported if a newer backend exposes it; never inferred here. */
  scopeState?: ScopeState | null;
  possibleFindings: PossibleFinding[];
  differentialDiagnoses: DifferentialDiagnosis[];
  redFlags: string[];
  missingInformation: string[];
  referral: Referral;
  sources: MedicalSource[];
  limitations: string[];
}

export interface ClinicalFormValues {
  age: string;
  sex: string;
  chiefComplaint: string;
  symptoms: string;
  signs: string;
  medicalHistory: string;
  image: File | null;
}

export type ClinicalFormField = keyof ClinicalFormValues;

export type ClinicalFormErrors = Partial<Record<ClinicalFormField, string>>;

export interface HealthResponse {
  status: string;
  ollama: boolean;
  analysisBusy?: boolean;
}
