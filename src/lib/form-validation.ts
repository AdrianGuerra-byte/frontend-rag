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
  }

  if (!values.symptoms.trim()) {
    errors.symptoms = "Describa los síntomas disponibles.";
  }

  if (currentErrors.image) {
    errors.image = currentErrors.image;
  }

  return errors;
}
