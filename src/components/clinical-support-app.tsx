"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Activity } from "lucide-react";

import { AnalysisLoading } from "@/src/components/analysis-loading";
import { AnalysisResult } from "@/src/components/analysis-result";
import { ClinicalForm } from "@/src/components/clinical-form";
import { ProductMark } from "@/src/components/product-mark";
import { SystemStatus } from "@/src/components/system-status";
import { Button } from "@/src/components/ui/button";
import { analyzeCase, getApiErrorMessage } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import type {
  ClinicalAnalysis,
  ClinicalFormErrors,
  ClinicalFormField,
  ClinicalFormValues,
} from "@/src/types/analysis";

type ViewState = "form" | "loading" | "result" | "error";

type DraftField =
  | "age"
  | "sex"
  | "chiefComplaint"
  | "symptoms"
  | "signs"
  | "medicalHistory";

type ClinicalDraft = Pick<ClinicalFormValues, DraftField>;

const DRAFT_STORAGE_KEY = "clinical-support-form-draft";
const DRAFT_FIELDS: readonly DraftField[] = [
  "age",
  "sex",
  "chiefComplaint",
  "symptoms",
  "signs",
  "medicalHistory",
];

const initialValues: ClinicalFormValues = {
  age: "",
  sex: "",
  chiefComplaint: "",
  symptoms: "",
  signs: "",
  medicalHistory: "",
  image: null,
};

const draftListeners = new Set<() => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getClinicalDraft(values: ClinicalFormValues): ClinicalDraft {
  return {
    age: values.age,
    sex: values.sex,
    chiefComplaint: values.chiefComplaint,
    symptoms: values.symptoms,
    signs: values.signs,
    medicalHistory: values.medicalHistory,
  };
}

function getDraftSnapshot() {
  try {
    return window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerDraftSnapshot() {
  return "";
}

function subscribeToDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => draftListeners.delete(listener);
}

function notifyDraftListeners() {
  for (const listener of draftListeners) {
    listener();
  }
}

function parseClinicalDraft(snapshot: string) {
  if (!snapshot) {
    return {};
  }

  try {
    const parsedDraft: unknown = JSON.parse(snapshot);
    if (!isRecord(parsedDraft)) {
      return {};
    }

    const draft: Partial<ClinicalDraft> = {};
    for (const field of DRAFT_FIELDS) {
      if (typeof parsedDraft[field] === "string") {
        draft[field] = parsedDraft[field];
      }
    }

    return draft;
  } catch {
    return {};
  }
}

function mergeDraftValues(
  values: ClinicalFormValues,
  draft: Partial<ClinicalDraft>,
  dirtyFields: Partial<Record<DraftField, boolean>>,
) {
  const mergedValues = { ...values };

  for (const field of DRAFT_FIELDS) {
    if (!dirtyFields[field] && draft[field] !== undefined) {
      mergedValues[field] = draft[field];
    }
  }

  return mergedValues;
}

function writeClinicalDraft(values: ClinicalFormValues) {
  const draft = getClinicalDraft(values);
  const hasDraftContent = DRAFT_FIELDS.some((field) => draft[field].trim().length > 0);

  try {
    if (hasDraftContent) {
      const serializedDraft = JSON.stringify(draft);
      if (window.sessionStorage.getItem(DRAFT_STORAGE_KEY) === serializedDraft) {
        return;
      }
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, serializedDraft);
    } else {
      if (!window.sessionStorage.getItem(DRAFT_STORAGE_KEY)) {
        return;
      }
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    notifyDraftListeners();
  } catch {
    // Ignore unavailable or full session storage.
  }
}

function clearClinicalDraft() {
  try {
    if (!window.sessionStorage.getItem(DRAFT_STORAGE_KEY)) {
      return;
    }
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    notifyDraftListeners();
  } catch {
    // Ignore unavailable session storage.
  }
}

function validateForm(values: ClinicalFormValues, currentErrors: ClinicalFormErrors) {
  const errors: ClinicalFormErrors = {};
  const age = Number(values.age);

  if (!values.age.trim()) {
    errors.age = "Indique la edad del paciente.";
  } else if (!Number.isInteger(age) || age < 1 || age > 120) {
    errors.age = "Ingrese una edad entre 1 y 120 años.";
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

function ErrorState({
  message,
  onRetry,
  onNewAnalysis,
}: {
  message: string;
  onRetry: () => void;
  onNewAnalysis: () => void;
}) {
  return (
    <section
      aria-labelledby="analysis-error-title"
      className="mx-auto flex w-full max-w-xl flex-col items-center py-8 text-center sm:py-14"
    >
      <div className="mb-8 flex w-full items-center gap-3 text-left">
        <ProductMark />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Apoyo clínico / estado
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-ink">
            Análisis no completado
          </p>
        </div>
      </div>
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft text-danger">
        <Activity aria-hidden="true" className="size-8" />
      </div>
      <h1
        className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        id="analysis-error-title"
      >
        No fue posible completar el análisis.
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">{message}</p>
      <div className="mt-8 w-full border-y border-line bg-surface px-5 py-5 text-left sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={onRetry}>
            Reintentar
          </Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onNewAnalysis}>
            Nuevo análisis
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ClinicalSupportApp() {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [values, setValues] = useState<ClinicalFormValues>(initialValues);
  const [errors, setErrors] = useState<ClinicalFormErrors>({});
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dirtyDraftFields, setDirtyDraftFields] = useState<Partial<Record<DraftField, boolean>>>({});
  const isSubmittingRef = useRef(false);
  const draftSnapshot = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const storedDraft = parseClinicalDraft(draftSnapshot);
  const formValues = mergeDraftValues(values, storedDraft, dirtyDraftFields);

  const isFormIncomplete =
    !formValues.age.trim() ||
    !formValues.sex ||
    !formValues.chiefComplaint.trim() ||
    !formValues.symptoms.trim() ||
    Boolean(errors.image);

  function handleValueChange(field: Exclude<ClinicalFormField, "image">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setDirtyDraftFields((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    writeClinicalDraft({ ...formValues, [field]: value });
  }

  function handleImageSelect(file: File | null, error: string | null) {
    setValues((current) => ({ ...current, image: file }));
    setErrors((current) => ({ ...current, image: error ?? undefined }));
  }

  function handleImageRemove() {
    setValues((current) => ({ ...current, image: null }));
    setErrors((current) => ({ ...current, image: undefined }));
  }

  async function submitAnalysis() {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setErrorMessage(null);
    setViewState("loading");

    try {
      const result = await analyzeCase(formValues);
      clearClinicalDraft();
      setAnalysis(result);
      setViewState("result");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setViewState("error");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(formValues, errors);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    await submitAnalysis();
  }

  function resetExperience() {
    isSubmittingRef.current = false;
    clearClinicalDraft();
    setValues(initialValues);
    setDirtyDraftFields({});
    setErrors({});
    setAnalysis(null);
    setErrorMessage(null);
    setViewState("form");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col bg-surface md:border-x md:border-line">
        <main aria-busy={viewState === "loading"} className="flex-1 pt-[env(safe-area-inset-top)]">
          <div
            className={cn(
              "mx-auto w-full px-4 py-6 pb-8 sm:px-6 sm:py-8 sm:pb-10",
              viewState === "result" ? "max-w-[780px]" : "max-w-[680px]",
            )}
          >
            <div aria-hidden="true" className="hidden">
              <SystemStatus />
            </div>
            <div
              className={cn(
                "screen-transition",
                viewState === "form" && "screen-transition-back",
              )}
              key={viewState}
            >
              {viewState === "form" ? (
                <ClinicalForm
                  errors={errors}
                  formMessage={errorMessage}
                  isSubmitDisabled={isFormIncomplete}
                  values={formValues}
                  onImageRemove={handleImageRemove}
                  onImageSelect={handleImageSelect}
                  onSubmit={handleSubmit}
                  onValueChange={handleValueChange}
                />
              ) : null}
              {viewState === "loading" ? <AnalysisLoading hasImage={Boolean(values.image)} /> : null}
              {viewState === "result" && analysis ? (
                <AnalysisResult analysis={analysis} onNewAnalysis={resetExperience} />
              ) : null}
              {viewState === "error" && errorMessage ? (
                <ErrorState
                  message={errorMessage}
                  onNewAnalysis={resetExperience}
                  onRetry={() => void submitAnalysis()}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
