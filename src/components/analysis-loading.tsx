"use client";

import { LoaderCircle } from "lucide-react";

import { ProductMark } from "@/src/components/product-mark";

interface AnalysisLoadingProps {
  hasImage?: boolean;
}

const waitingNotes = [
  "La solicitud está en curso.",
  "La respuesta se mostrará cuando el servicio termine de procesarla.",
  "No es necesario iniciar otra solicitud mientras esta pantalla esté activa.",
] as const;

function IndeterminateBar() {
  return (
    <div aria-hidden="true" className="mt-7 h-1 overflow-hidden rounded-full bg-primary-soft">
      <div className="analysis-indeterminate h-full w-2/5 rounded-full bg-primary" />
    </div>
  );
}

export function AnalysisLoading({ hasImage = false }: AnalysisLoadingProps) {
  return (
    <section
      aria-labelledby="analysis-loading-title"
      className="mx-auto flex w-full max-w-[640px] flex-col py-8 sm:py-12"
      role="status"
    >
      <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <ProductMark className="size-10" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Apoyo clínico
            </p>
            <p className="mt-1 text-xs font-medium text-muted">Solicitud en curso</p>
          </div>
        </div>
        <LoaderCircle aria-hidden="true" className="mt-1 size-5 shrink-0 animate-spin text-primary" />
      </header>

      <div className="pt-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Procesamiento
        </p>
        <h1
          className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          id="analysis-loading-title"
        >
          Analizando el caso clínico
        </h1>
        <p
          aria-live="polite"
          className="mt-3 max-w-xl text-[15px] leading-6 text-muted"
        >
          El análisis puede tardar alrededor de un minuto cuando incluye una imagen.
          La pantalla permanecerá activa hasta recibir la respuesta.
        </p>
        <IndeterminateBar />
      </div>

      <div className="mt-8 border-y border-line bg-surface py-5 sm:py-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Estado de la solicitud
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3 text-sm leading-6 text-ink">
            <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
            <span>Información clínica incluida en la solicitud</span>
          </li>
          <li className="flex items-start gap-3 text-sm leading-6 text-ink">
            <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
            <span>
              {hasImage
                ? "Imagen adjunta incluida en la solicitud"
                : "Solicitud basada únicamente en información clínica"}
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm leading-6 text-muted">
            <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full border border-line-strong" />
            <span>Esperando la respuesta del servicio</span>
          </li>
        </ul>
      </div>

      <div className="mt-5 rounded-[var(--radius-control)] border border-line bg-surface-subtle px-4 py-4">
        <p className="text-sm font-medium leading-6 text-ink">
          El servicio procesa una sola evaluación pesada a la vez.
        </p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
          {waitingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
