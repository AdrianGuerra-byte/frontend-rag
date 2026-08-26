"use client";

import { useState, type FormEvent } from "react";
import { Activity, ShieldCheck } from "lucide-react";

import { AnalysisLoading } from "@/src/components/analysis-loading";
import { AnalysisResult } from "@/src/components/analysis-result";
import { ClinicalForm } from "@/src/components/clinical-form";
import { SystemStatus } from "@/src/components/system-status";
import { Button } from "@/src/components/ui/button";
import { analyzeCase, getApiErrorMessage } from "@/src/lib/api";
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

function AppHeader() {
  return (
    <header className="border-b border-line bg-background/95">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="relative size-9 shrink-0 rounded-[var(--radius-control)] bg-primary"
          >
            <span className="absolute left-1/2 top-2 h-5 w-1 -translate-x-1/2 rounded-[2px] bg-white" />
            <span className="absolute left-2 top-1/2 h-1 w-5 -translate-y-1/2 rounded-[2px] bg-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight text-ink">Clinical Support</p>
            <p className="hidden truncate text-xs text-muted sm:block">Sistema de apoyo a la decisión clínica</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted">
          <SystemStatus />
        </div>
      </div>
    </header>
  );
}

function SafetyFooter() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-2 px-4 py-5 text-xs leading-5 text-muted sm:px-6 lg:px-8">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Prototipo académico. La decisión clínica final corresponde al profesional de la salud.</p>
      </div>
    </footer>
  );
}

function ErrorState({ message, onRetry, onNewAnalysis }: { message: string; onRetry: () => void; onNewAnalysis: () => void }) {
  return (
    <section aria-labelledby="analysis-error-title" className="mx-auto flex w-full max-w-xl flex-col items-center py-8 text-center sm:py-14">
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft text-danger">
        <Activity aria-hidden="true" className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl" id="analysis-error-title">
        No fue posible completar el análisis.
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">{message}</p>
      <p className="mt-2 text-sm leading-6 text-muted">Verifique la conexión con el servicio e intente nuevamente.</p>
      <div className="mt-8 w-full border-y border-line bg-surface px-5 py-5 text-left sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={onRetry}>Reintentar</Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onNewAnalysis}>Nuevo análisis</Button>
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
    setErrorMessage(null);
    setViewState("loading");

    try {
      const result = await analyzeCase(values);
      setAnalysis(result);
      setViewState("result");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setViewState("error");
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
    setValues(initialValues);
    setErrors({});
    setAnalysis(null);
    setErrorMessage(null);
    setViewState("form");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
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
            <ErrorState message={errorMessage} onNewAnalysis={resetExperience} onRetry={() => void submitAnalysis()} />
          ) : null}
        </div>
      </main>
      <SafetyFooter />
    </div>
  );
}
