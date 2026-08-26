"use client";

import { useState, type FormEvent } from "react";
import { Activity, ShieldCheck, Stethoscope } from "lucide-react";

import { AnalysisLoading } from "@/src/components/analysis-loading";
import { AnalysisResult } from "@/src/components/analysis-result";
import { ClinicalForm } from "@/src/components/clinical-form";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { analyzeMockCase } from "@/src/lib/mock-analysis";
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
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Stethoscope aria-hidden="true" className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-950">Clinical Support</p>
            <p className="hidden truncate text-xs text-slate-500 sm:block">Sistema de apoyo a la decisión clínica</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
          <Activity aria-hidden="true" className="size-3.5 text-teal-700" />
          Prototipo académico
        </div>
      </div>
    </header>
  );
}

function SafetyFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-start gap-2 px-4 py-5 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>Prototipo académico. La decisión clínica final corresponde al profesional de la salud.</p>
      </div>
    </footer>
  );
}

function ErrorState({ message, onRetry, onNewAnalysis }: { message: string; onRetry: () => void; onNewAnalysis: () => void }) {
  return (
    <section aria-labelledby="analysis-error-title" className="mx-auto flex w-full max-w-xl flex-col items-center py-8 text-center sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
        <Activity aria-hidden="true" className="size-8" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950" id="analysis-error-title">
        No fue posible completar el análisis.
      </h1>
      <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">Verifique la conexión con el servicio e intente nuevamente.</p>
      <Card className="mt-8 w-full p-5 text-left sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={onRetry}>Reintentar</Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onNewAnalysis}>Nuevo análisis</Button>
        </div>
      </Card>
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values, errors);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setErrorMessage(null);
    setViewState("loading");

    try {
      const result = await analyzeMockCase(values);
      setAnalysis(result);
      setViewState("result");
    } catch {
      setErrorMessage("El servicio no pudo generar un resultado para este caso.");
      setViewState("error");
    }
  }

  function resetExperience() {
    setValues(initialValues);
    setErrors({});
    setAnalysis(null);
    setErrorMessage(null);
    setViewState("form");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7fafb]">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
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
            <ErrorState message={errorMessage} onNewAnalysis={resetExperience} onRetry={() => setViewState("form")} />
          ) : null}
        </div>
      </main>
      <SafetyFooter />
    </div>
  );
}
