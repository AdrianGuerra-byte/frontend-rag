export type ImageQualityStatus = "adequate" | "insufficient" | "not_provided";

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
}

export interface ClinicalAnalysis {
  analysisId: string;
  imageQuality: ImageQuality;
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
}
