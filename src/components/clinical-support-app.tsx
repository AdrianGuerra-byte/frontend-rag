"use client";

import { useRef, useState, type FormEvent } from "react";
import { CircleAlert, Clock3, Info, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";

import { AnalysisLoading } from "@/src/components/analysis-loading";
import { AnalysisResult } from "@/src/components/analysis-result";
import { ClinicalForm } from "@/src/components/clinical-form";
import { ProductMark } from "@/src/components/product-mark";
import { Button } from "@/src/components/ui/button";
import {
  analyzeCase,
  getApiErrorKind,
  getApiErrorMessage,
  type ApiErrorKind,
} from "@/src/lib/api";
import {
  createInitialClinicalFormValues,
  validateClinicalForm,
} from "@/src/lib/form-validation";
import { SubmissionGate } from "@/src/lib/submission-gate";
import { cn } from "@/src/lib/utils";
import type {
  ClinicalAnalysis,
  ClinicalFormErrors,
  ClinicalFormField,
  ClinicalFormValues,
} from "@/src/types/analysis";

type ViewState = "form" | "loading" | "result" | "error";

interface ErrorDetails {
  kind: ApiErrorKind;
  message: string;
}

const fallbackError: ErrorDetails = {
  kind: "backend",
  message: "No fue posible completar la solicitud.",
};

function getErrorPresentation(kind: ApiErrorKind) {
  switch (kind) {
    case "busy":
      return {
        title: "Análisis en espera",
        eyebrow: "Servicio ocupado",
        description:
          "Hay otro análisis en proceso. Espera a que termine antes de iniciar uno nuevo.",
        icon: Clock3,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Intentar de nuevo",
        showRetry: true,
        showEdit: false,
      };
    case "network":
      return {
        title: "Servicio no disponible",
        eyebrow: "Conexión",
        description:
          "La solicitud no llegó al servicio de análisis. Verifica la conexión e inténtalo de nuevo.",
        icon: WifiOff,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Reintentar conexión",
        showRetry: true,
        showEdit: false,
      };
    case "timeout":
      return {
        title: "La respuesta está tardando",
        eyebrow: "Tiempo de espera",
        description:
          "La respuesta tardó más de lo esperado. Puedes esperar unos instantes y reintentar manualmente.",
        icon: Clock3,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Reintentar",
        showRetry: true,
        showEdit: false,
      };
    case "validation":
      return {
        title: "Revisa la información del caso",
        eyebrow: "Datos no aceptados",
        description: "El servicio no pudo validar los datos enviados.",
        icon: CircleAlert,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Revisar información",
        showRetry: false,
        showEdit: true,
      };
    case "invalid_file":
      return {
        title: "Imagen no válida",
        eyebrow: "Archivo rechazado",
        description: "Seleccione otra imagen que se pueda leer correctamente.",
        icon: TriangleAlert,
        tone: "border-danger/20 bg-danger-soft text-danger",
        retryLabel: "Revisar archivo",
        showRetry: false,
        showEdit: true,
      };
    case "unsupported_file":
      return {
        title: "Formato no compatible",
        eyebrow: "Archivo rechazado",
        description: "Use una imagen JPEG, JPG, PNG o WEBP.",
        icon: TriangleAlert,
        tone: "border-danger/20 bg-danger-soft text-danger",
        retryLabel: "Revisar archivo",
        showRetry: false,
        showEdit: true,
      };
    case "file_too_large":
      return {
        title: "Imagen demasiado grande",
        eyebrow: "Archivo rechazado",
        description: "Seleccione una imagen de 10 MB o menos.",
        icon: TriangleAlert,
        tone: "border-danger/20 bg-danger-soft text-danger",
        retryLabel: "Revisar archivo",
        showRetry: false,
        showEdit: true,
      };
    case "image_unavailable":
      return {
        title: "Análisis de imagen no disponible",
        eyebrow: "Apoyo visual",
        description:
          "No fue posible procesar la imagen en esta solicitud. Puedes intentar nuevamente de forma manual.",
        icon: TriangleAlert,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Intentar de nuevo",
        showRetry: true,
        showEdit: true,
      };
    case "invalid_response":
      return {
        title: "Respuesta no válida",
        eyebrow: "Validación del servicio",
        description:
          "El servicio devolvió una respuesta que no se pudo validar de forma segura.",
        icon: CircleAlert,
        tone: "border-danger/20 bg-danger-soft text-danger",
        retryLabel: "Reintentar",
        showRetry: true,
        showEdit: false,
      };
    case "configuration":
      return {
        title: "Servicio no configurado",
        eyebrow: "Configuración",
        description:
          "Este entorno no tiene configurada la conexión con el servicio de análisis.",
        icon: Info,
        tone: "border-warning/25 bg-warning-soft text-warning",
        retryLabel: "Reintentar",
        showRetry: true,
        showEdit: false,
      };
    case "backend":
    default:
      return {
        title: "No fue posible completar la solicitud",
        eyebrow: "Servicio de análisis",
        description: "El servicio no pudo completar el análisis en este momento.",
        icon: CircleAlert,
        tone: "border-danger/20 bg-danger-soft text-danger",
        retryLabel: "Reintentar",
        showRetry: true,
        showEdit: false,
      };
  }
}

function ErrorState({
  details,
  onRetry,
  onEditCase,
  onNewAnalysis,
}: {
  details: ErrorDetails;
  onRetry: () => void;
  onEditCase: () => void;
  onNewAnalysis: () => void;
}) {
  const presentation = getErrorPresentation(details.kind);
  const Icon = presentation.icon;

  return (
    <section
      aria-labelledby="analysis-error-title"
      className="mx-auto flex w-full max-w-xl flex-col py-8 sm:py-14"
    >
      <header className="flex items-center gap-3 border-b border-line pb-6">
        <ProductMark />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Apoyo clínico / estado
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-ink">
            Solicitud no completada
          </p>
        </div>
      </header>

      <div className="pt-10">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-[var(--radius-panel)] border",
            presentation.tone,
          )}
        >
          <Icon aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {presentation.eyebrow}
        </p>
        <h1
          className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          id="analysis-error-title"
        >
          {presentation.title}
        </h1>
        <p aria-live="assertive" className="mt-3 text-base leading-7 text-muted" role="alert">
          {presentation.description}
        </p>
        {details.message !== presentation.description ? (
          <p className="mt-3 text-sm leading-6 text-muted">{details.message}</p>
        ) : null}
      </div>

      <div className="mt-8 border-y border-line bg-surface px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {presentation.showRetry ? (
            <Button className="w-full sm:w-auto" onClick={onRetry}>
              <RefreshCw aria-hidden="true" className="size-4" />
              {presentation.retryLabel}
            </Button>
          ) : null}
          {presentation.showEdit ? (
            <Button className="w-full sm:w-auto" onClick={onEditCase} variant="secondary">
              {presentation.retryLabel}
            </Button>
          ) : null}
          <Button className="w-full sm:w-auto" onClick={onNewAnalysis} variant="secondary">
            Nueva evaluación
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ClinicalSupportApp() {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [values, setValues] = useState<ClinicalFormValues>(createInitialClinicalFormValues);
  const [errors, setErrors] = useState<ClinicalFormErrors>({});
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const submissionGateRef = useRef(new SubmissionGate());

  function handleValueChange(field: Exclude<ClinicalFormField, "image">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setErrorDetails(null);
    setFormMessage(null);
  }

  function handleImageSelect(file: File | null, error: string | null) {
    setValues((current) => ({ ...current, image: file }));
    setErrors((current) => ({ ...current, image: error ?? undefined }));
    setErrorDetails(null);
    setFormMessage(null);
  }

  function handleImageRemove() {
    setValues((current) => ({ ...current, image: null }));
    setErrors((current) => ({ ...current, image: undefined }));
    setFormMessage(null);
  }

  async function submitAnalysis() {
    if (!submissionGateRef.current.acquire()) {
      return;
    }

    setErrorDetails(null);
    setFormMessage(null);
    setAnalysis(null);
    setViewState("loading");

    try {
      const result = await analyzeCase(values);
      setAnalysis(result);
      setViewState("result");
    } catch (error) {
      setErrorDetails({
        kind: getApiErrorKind(error),
        message: getApiErrorMessage(error),
      });
      setViewState("error");
    } finally {
      submissionGateRef.current.release();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClinicalForm(values, errors);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setErrorDetails(null);
      return;
    }

    await submitAnalysis();
  }

  function resetExperience() {
    submissionGateRef.current.reset();
    setValues(createInitialClinicalFormValues());
    setErrors({});
    setAnalysis(null);
    setErrorDetails(null);
    setFormMessage(null);
    setViewState("form");
  }

  function editCase() {
    setFormMessage(errorDetails?.message ?? null);
    setErrorDetails(null);
    setViewState("form");
  }

  const isSubmitting = viewState === "loading";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col bg-surface md:border-x md:border-line">
        <a
          className="sr-only z-50 rounded-md bg-surface px-4 py-3 text-sm font-semibold text-primary shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          href="#main-content"
        >
          Saltar al contenido principal
        </a>
        <main
          id="main-content"
          aria-busy={viewState === "loading"}
          className="flex-1 pt-[env(safe-area-inset-top)] focus:outline-none"
          tabIndex={-1}
        >
          <div
            className={cn(
              "mx-auto w-full px-4 py-6 pb-8 sm:px-6 sm:py-8 sm:pb-10",
              viewState === "result" ? "max-w-[780px]" : "max-w-[680px]",
            )}
          >
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
                  formMessage={formMessage}
                  isSubmitDisabled={isSubmitting}
                  values={values}
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
              {viewState === "error" ? (
                <ErrorState
                  details={errorDetails ?? fallbackError}
                  onEditCase={editCase}
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
