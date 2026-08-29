"use client";

import { useEffect, useState } from "react";

import { ProductMark } from "@/src/components/product-mark";

const textOnlyMessages = [
  "Preparando el contexto clínico",
  "Organizando la información del caso",
  "Consultando documentación médica oficial",
  "Recuperando evidencia clínica relevante",
  "Contrastando el caso con la evidencia disponible",
  "Refinando posibilidades diagnósticas",
  "Evaluando signos de alarma",
  "Preparando la síntesis clínica",
  "Organizando el resultado final",
] as const;

const multimodalMessages = [
  "Preparando el contexto clínico",
  "Preparando el estudio radiográfico",
  "Evaluando la calidad de la imagen",
  "Analizando estructuras visibles",
  "Integrando observaciones radiográficas",
  "Consultando documentación médica oficial",
  "Recuperando evidencia clínica relevante",
  "Contrastando hallazgos y evidencia",
  "Refinando posibilidades diagnósticas",
  "Evaluando signos de alarma",
  "Preparando la síntesis clínica",
  "Organizando el resultado final",
] as const;

const secondaryMessages = [
  "Conectando señales clínicas",
  "Ordenando evidencia relevante",
  "Sincronizando contexto clínico",
  "Enlazando hallazgos y documentación",
  "Filtrando coincidencias irrelevantes",
  "Priorizando evidencia útil",
  "Resolviendo contexto clínico",
  "Construyendo una lectura coherente del caso",
  "Consolidando observaciones",
  "Preparando una respuesta sustentada",
] as const;

const ACTIVITY_INTERVAL_MS = 3_200;
const HISTORY_LIMIT = 2;

interface ActivityState {
  index: number;
  history: string[];
}

function ScanMotif() {
  return (
    <div aria-hidden="true" className="relative size-44 overflow-hidden text-primary">
      <span className="absolute left-1 top-1 size-5 border-l border-t border-current" />
      <span className="absolute right-1 top-1 size-5 border-r border-t border-current" />
      <span className="absolute bottom-1 left-1 size-5 border-b border-l border-current" />
      <span className="absolute bottom-1 right-1 size-5 border-b border-r border-current" />
      <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      <span className="clinical-scan-line absolute left-5 right-5 top-1/2 h-px bg-primary/45" />
    </div>
  );
}

export function AnalysisLoading({ hasImage = false }: { hasImage?: boolean }) {
  const messages = hasImage ? multimodalMessages : textOnlyMessages;
  const [activity, setActivity] = useState<ActivityState>({ index: 0, history: [] });
  const currentMessage = messages[activity.index % messages.length];
  const secondaryMessage = secondaryMessages[activity.index % secondaryMessages.length];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActivity((current) => {
        const currentIndex = current.index % messages.length;
        const nextIndex = (currentIndex + 1) % messages.length;

        return {
          index: nextIndex,
          history: [messages[currentIndex], ...current.history].slice(0, HISTORY_LIMIT),
        };
      });
    }, ACTIVITY_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [messages]);

  return (
    <section
      aria-labelledby="analysis-loading-title"
      aria-live="polite"
      className="mx-auto flex w-full max-w-[640px] flex-col items-center py-8 text-center sm:py-12"
      role="status"
    >
      <div className="mb-8 flex w-full items-center gap-3 text-left">
        <ProductMark className="size-10" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Apoyo clínico
          </p>
          <p className="mt-1 text-xs font-medium text-muted">Análisis en curso</p>
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Proceso clínico</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl" id="analysis-loading-title">
        Analizando el caso clínico
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted">
        Procesando la información clínica y consultando la evidencia médica.
      </p>

      <div className="mt-9 flex items-center justify-center">
        <ScanMotif />
      </div>

      <div className="mt-8 w-full border-y border-line py-5 text-left sm:py-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
              Actividad del sistema
            </p>
            <div
              aria-atomic="true"
              aria-live="polite"
              className="mt-2 flex min-h-14 items-center"
            >
              <p className="analysis-activity-enter text-base font-medium leading-7 text-ink sm:text-lg" key={currentMessage}>
                {currentMessage}
              </p>
            </div>
            <p className="min-h-5 text-xs leading-5 text-muted" key={secondaryMessage}>
              {secondaryMessage}
            </p>
          </div>
        </div>

        {activity.history.length ? (
          <div aria-hidden="true" className="mt-4 border-t border-line/70 pt-3 pl-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/75">Registro reciente</p>
            <ul className="mt-1.5 space-y-1">
              {activity.history.map((message, index) => (
                <li className="flex items-start gap-2 text-xs leading-5 text-muted/75" key={`${message}-${index}`}>
                  <span aria-hidden="true">·</span>
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-5 text-muted">
          El análisis puede tardar alrededor de un minuto. Esta pantalla permanecerá activa hasta recibir el resultado.
        </p>
      </div>
    </section>
  );
}
