import type {
  ClinicalFormErrors,
  ClinicalFormValues,
} from "../types/analysis";

export const initialClinicalFormValues: ClinicalFormValues = {
  age: "",
  sex: "",
  chiefComplaint: "",
  symptoms: "",
  signs: "",
  medicalHistory: "",
  image: null,
};

const MAX_CHIEF_COMPLAINT_LENGTH = 500;
const MAX_CLINICAL_TEXT_LENGTH = 4000;

export function createInitialClinicalFormValues(): ClinicalFormValues {
  return { ...initialClinicalFormValues };
}

export function validateClinicalForm(
  values: ClinicalFormValues,
  currentErrors: ClinicalFormErrors = {},
) {
  const errors: ClinicalFormErrors = {};
  const age = Number(values.age);

  if (!values.age.trim()) {
    errors.age = "Indique la edad del paciente.";
  } else if (!Number.isInteger(age) || age < 0 || age > 130) {
    errors.age = "Ingrese una edad entera entre 0 y 130 años.";
  }

  if (!values.sex) {
    errors.sex = "Seleccione una opción.";
  }

  if (!values.chiefComplaint.trim()) {
    errors.chiefComplaint = "Describa el motivo de consulta.";
  } else if (values.chiefComplaint.length > MAX_CHIEF_COMPLAINT_LENGTH) {
    errors.chiefComplaint = "El motivo de consulta no puede superar 500 caracteres.";
  }

  if (!values.symptoms.trim()) {
    errors.symptoms = "Describa los síntomas disponibles.";
  } else if (values.symptoms.length > MAX_CLINICAL_TEXT_LENGTH) {
    errors.symptoms = "Los síntomas no pueden superar 4000 caracteres.";
  }

  if (values.signs.length > MAX_CLINICAL_TEXT_LENGTH) {
    errors.signs = "Los signos clínicos no pueden superar 4000 caracteres.";
  }

  if (values.medicalHistory.length > MAX_CLINICAL_TEXT_LENGTH) {
    errors.medicalHistory = "Los antecedentes relevantes no pueden superar 4000 caracteres.";
  }

  if (currentErrors.image) {
    errors.image = currentErrors.image;
  }

  return errors;
}
