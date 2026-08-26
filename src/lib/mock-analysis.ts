import type { ClinicalAnalysis, ClinicalFormValues } from "@/src/types/analysis";

export const MOCK_ANALYSIS: ClinicalAnalysis = {
  analysisId: "mock-2026-001",
  imageQuality: {
    status: "adequate",
    message: "La imagen puede ser evaluada por el prototipo.",
  },
  possibleFindings: [
    {
      finding: "Posible alteración traumática en la región de la muñeca; correlacionar con la exploración física.",
      confidence: "moderate",
    },
  ],
  differentialDiagnoses: [
    {
      diagnosis: "Posible fractura distal de radio",
      reasoning: [
        "Antecedente de traumatismo o caída",
        "Dolor, inflamación y limitación del movimiento",
        "El análisis visual del prototipo no confirma una fractura",
      ],
    },
    {
      diagnosis: "Esguince de muñeca u otra lesión de tejidos blandos",
      reasoning: [
        "Los síntomas pueden presentarse sin una fractura confirmada",
        "Se requiere valoración física y revisión de la imagen",
      ],
    },
  ],
  redFlags: [
    "Valorar pulso distal",
    "Valorar sensibilidad y función motora",
    "Descartar compromiso neurovascular",
  ],
  missingInformation: ["Proyección lateral de la radiografía"],
  referral: {
    recommended: true,
    priority: "urgent",
    reason: "Se recomienda valoración médica oportuna ante una posible lesión traumática.",
  },
  sources: [],
  limitations: [
    "Este resultado proviene de un prototipo académico en modo de demostración.",
    "El modelo visual y el resultado generado no han sido validados clínicamente.",
  ],
};

export async function analyzeMockCase(values: ClinicalFormValues) {
  void values;
  return MOCK_ANALYSIS;
}
