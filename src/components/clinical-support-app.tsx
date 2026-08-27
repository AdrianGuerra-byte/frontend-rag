"use client";

import { useRef, useState, type FormEvent } from "react";
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

const initialValues: ClinicalFormValues = {
  age: "",
  sex: "",
  chiefComplaint: "",
  symptoms: "",
  signs: "",
  medicalHistory: "",
  image: null,
};

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

  if (!values.image) {
    errors.image = currentErrors.image ?? "Adjunte una radiografía para continuar.";
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
      <p className="mt-2 text-sm leading-6 text-muted">
        Verifique la conexión con el servicio e intente nuevamente.
      </p>
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
  const isSubmittingRef = useRef(false);

  const isFormIncomplete =
    !values.age.trim() ||
    !values.sex ||
    !values.chiefComplaint.trim() ||
    !values.symptoms.trim() ||
    !values.image;

  function handleValueChange(field: Exclude<ClinicalFormField, "image">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleImageSelect(file: File | null, error: string | null) {
    setValues((current) => ({ ...current, image: file }));
    setErrors((current) => ({ ...current, image: error ?? undefined }));
  }

  function handleImageRemove() {
    setValues((current) => ({ ...current, image: null }));
    setErrors((current) => ({ ...current, image: "Adjunte una radiografía para continuar." }));
  }

  async function submitAnalysis() {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setErrorMessage(null);
    setViewState("loading");

    try {
      const result = await analyzeCase(values);
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
    const nextErrors = validateForm(values, errors);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    await submitAnalysis();
  }

  function resetExperience() {
    isSubmittingRef.current = false;
    setValues(initialValues);
    setErrors({});
    setAnalysis(null);
    setErrorMessage(null);
    setViewState("form");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col bg-surface md:border-x md:border-line">
        <main className="flex-1 pt-[env(safe-area-inset-top)]">
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
                  values={values}
                  onImageRemove={handleImageRemove}
                  onImageSelect={handleImageSelect}
                  onSubmit={handleSubmit}
                  onValueChange={handleValueChange}
                />
              ) : null}
              {viewState === "loading" ? <AnalysisLoading /> : null}
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
