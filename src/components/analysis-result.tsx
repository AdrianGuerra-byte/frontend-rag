import { AlertCircle, ArrowLeft, CheckCircle2, Info, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { ProductMark } from "@/src/components/product-mark";
import { cn } from "@/src/lib/utils";
import type {
  ClinicalAnalysis,
  DifferentialDiagnosis,
  FindingConfidence,
  ImageQualityStatus,
  ReferralPriority,
} from "@/src/types/analysis";

interface AnalysisResultProps {
  analysis: ClinicalAnalysis;
  onNewAnalysis: () => void;
}

const confidenceLabels: Record<FindingConfidence, string> = {
  low: "baja",
  moderate: "moderada",
  high: "alta",
};

const priorityLabels: Record<ReferralPriority, string> = {
  urgent: "Urgente",
  soon: "Prioritaria",
  routine: "Ordinaria",
  not_assessed: "No valorada",
};

const imageQualityLabels: Record<ImageQualityStatus, string> = {
  adequate: "Adecuada",
  insufficient: "Insuficiente",
  not_provided: "No proporcionada",
};

const knownImageMessages: Record<string, string> = {
  "Image can be evaluated by the prototype.": "La imagen puede ser evaluada por el prototipo.",
  "The image quality is insufficient for visual analysis.":
    "La calidad de la imagen es insuficiente para el análisis visual.",
  "No image was provided; text-only analysis is being used.":
    "No se proporcionó una imagen; se está utilizando un análisis basado solo en texto.",
};

function getImageQualityLabel(analysis: ClinicalAnalysis["imageQuality"]) {
  if (analysis.message.startsWith("Image quality is limited:")) {
    return "Limitada";
  }

  return imageQualityLabels[analysis.status];
}

function getImageQualityMessage(analysis: ClinicalAnalysis["imageQuality"]) {
  const knownMessage = knownImageMessages[analysis.message];
  if (knownMessage) {
    return knownMessage;
  }

  const limitedPrefix = "Image quality is limited:";
  if (analysis.message.startsWith(limitedPrefix)) {
    return `La calidad de la imagen es limitada: ${analysis.message.slice(limitedPrefix.length).trim()}`;
  }

  return analysis.message;
}

function SectionHeading({
  children,
  id,
  eyebrow,
  index,
}: {
  children: string;
  id: string;
  eyebrow: string;
  index: string;
}) {
  return (
    <div className="border-b border-line pb-3">
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        <span>{index}</span>
        <span aria-hidden="true" className="text-muted/60">/</span>
        <span>{eyebrow}</span>
      </p>
      <h2 className="text-base font-semibold tracking-tight text-ink" id={id}>
        {children}
      </h2>
    </div>
  );
}

function EmptyMessage({ children }: { children: string }) {
  return <p className="mt-4 text-sm leading-6 text-muted">{children}</p>;
}

function DifferentialItem({
  index,
  item,
}: {
  index: number;
  item: DifferentialDiagnosis;
}) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0">
      <span className="pt-0.5 font-mono text-xs font-medium text-primary">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-6 text-ink">{item.diagnosis}</h3>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Elementos relacionados
        </p>
        <ul className="mt-2 space-y-2">
          {item.reasoning.map((reason) => (
            <li className="flex gap-2 text-sm leading-6 text-muted" key={reason}>
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function AnalysisResult({ analysis, onNewAnalysis }: AnalysisResultProps) {
  const qualityIsAdequate = analysis.imageQuality.status === "adequate";
  const imageQualityLabel = getImageQualityLabel(analysis.imageQuality);
  const imageQualityMessage = getImageQualityMessage(analysis.imageQuality);
  const hasRedFlags = analysis.redFlags.length > 0;
  const referralNeedsAttention = analysis.referral.recommended;
  const referralTitle = referralNeedsAttention
    ? "Valoración especializada recomendada"
    : analysis.referral.priority === "not_assessed"
      ? "Canalización no valorada"
      : "No se determinó una necesidad inmediata de canalización";

  return (
    <section aria-labelledby="analysis-result-title" className="mx-auto w-full max-w-[760px]">
      <header className="mb-7 border-b border-line pb-6">
        <div className="flex items-start gap-3">
          <ProductMark className="size-10" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Apoyo clínico / resultado
            </p>
            <p className="mt-1 font-mono text-xs font-medium text-muted">
              Caso / {analysis.analysisId.slice(0, 8)}
            </p>
          </div>
        </div>
        <h1
          className="mt-7 text-[clamp(1.8rem,4vw,2.3rem)] font-semibold tracking-[-0.03em] text-ink"
          id="analysis-result-title"
        >
          Resultado del análisis
        </h1>
        <p className="mt-2 text-sm text-muted">
          Apoyo a la decisión clínica · resultado no diagnóstico
        </p>
        <Button className="mt-5 w-full sm:w-auto" variant="secondary" onClick={onNewAnalysis}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Nuevo análisis
        </Button>
      </header>

      <div className="border-y border-line bg-surface">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Evaluación inicial</p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-ink">Calidad de la imagen</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {imageQualityMessage}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit shrink-0 items-center gap-2 rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold",
              qualityIsAdequate
                ? "border-success/20 bg-success-soft text-success"
                : "border-warning/25 bg-warning-soft text-warning",
            )}
          >
            {qualityIsAdequate ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <AlertCircle aria-hidden="true" className="size-4" />
            )}
            {imageQualityLabel}
          </span>
        </div>
      </div>

      <section aria-labelledby="red-flags-title" className="mt-6">
        <div
          className={cn(
            "rounded-[var(--radius-panel)] border p-4 sm:p-5",
            hasRedFlags
              ? "border-danger/25 bg-danger-soft"
              : "border-line bg-surface-subtle",
          )}
        >
          <div className="flex items-start gap-3">
            <TriangleAlert
              aria-hidden="true"
              className={cn("mt-0.5 size-4 shrink-0", hasRedFlags ? "text-danger" : "text-muted")}
            />
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                <span>03</span>
                <span aria-hidden="true">/</span>
                <span>Alertas clínicas</span>
              </p>
              <h2 className={cn("mt-1 text-base font-semibold tracking-tight", hasRedFlags ? "text-danger" : "text-ink")} id="red-flags-title">
                Alertas clínicas
              </h2>
              <p className={cn("mt-2 text-sm leading-6", hasRedFlags ? "text-danger/85" : "text-muted")}>
                {hasRedFlags
                  ? "Revise estos puntos durante la valoración clínica."
                  : "No se identificaron alertas adicionales dentro de la información procesada."}
              </p>
            </div>
          </div>
          {hasRedFlags ? (
            <ul className="mt-5 space-y-3 border-t border-danger/15 pt-4">
              {analysis.redFlags.map((flag) => (
                <li className="flex gap-2 text-sm leading-6 text-danger" key={flag}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:gap-x-12">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="findings-title">
            <SectionHeading eyebrow="Lectura visual" id="findings-title" index="01">
              Posibles hallazgos
            </SectionHeading>
            {analysis.possibleFindings.length ? (
              <ul className="mt-5 space-y-4">
                {analysis.possibleFindings.map((finding) => (
                  <li className="border-l-2 border-primary/30 py-1 pl-4" key={`${finding.finding}-${finding.confidence}`}>
                    <p className="text-sm font-semibold leading-6 text-ink">{finding.finding}</p>
                    <p className="mt-2 text-xs text-muted">
                      Confianza del análisis visual:{" "}
                      <span className="font-semibold text-ink">{confidenceLabels[finding.confidence]}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMessage>El análisis no registró posibles hallazgos.</EmptyMessage>
            )}
          </section>

          <section aria-labelledby="differentials-title">
            <SectionHeading eyebrow="Correlación clínica" id="differentials-title" index="02">
              Diagnósticos diferenciales
            </SectionHeading>
            <p className="mt-3 text-sm leading-6 text-muted">
              Son posibilidades para correlacionar con la valoración clínica; no son diagnósticos confirmados.
            </p>
            {analysis.differentialDiagnoses.length ? (
              <ul className="mt-5">
                {analysis.differentialDiagnoses.map((item, index) => (
                  <DifferentialItem index={index + 1} item={item} key={item.diagnosis} />
                ))}
              </ul>
            ) : (
              <EmptyMessage>El análisis no registró diagnósticos diferenciales.</EmptyMessage>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section aria-labelledby="missing-information-title">
            <SectionHeading eyebrow="Completitud clínica" id="missing-information-title" index="04">
              Información que sería útil complementar
            </SectionHeading>
            {analysis.missingInformation.length ? (
              <ul className="mt-5 space-y-3">
                {analysis.missingInformation.map((item) => (
                  <li className="flex gap-2 text-sm leading-6 text-muted" key={item}>
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMessage>No se señalaron datos faltantes en este análisis.</EmptyMessage>
            )}
          </section>

          <section aria-labelledby="referral-title">
            <SectionHeading eyebrow="Siguiente consideración" id="referral-title" index="05">
              Canalización
            </SectionHeading>
            <div
              className={cn(
                "mt-4 border-l-2 px-4 py-1",
                referralNeedsAttention ? "border-warning bg-warning-soft" : "border-line-strong bg-surface-subtle",
              )}
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold leading-6 text-ink">{referralTitle}</h3>
                <span className="inline-flex w-fit rounded-[var(--radius-control)] border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                  Prioridad: {priorityLabels[analysis.referral.priority]}
                </span>
                <p className="text-sm leading-6 text-muted">{analysis.referral.reason}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section aria-labelledby="sources-title" className="mt-11 border-t border-line pt-8">
        <SectionHeading eyebrow="Evidencia documental" id="sources-title" index="06">
          Fuentes consultadas
        </SectionHeading>
        {analysis.sources.length ? (
          <ol className="mt-5 divide-y divide-line">
            {analysis.sources.map((source, index) => (
              <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-5 first:pt-0 last:pb-0" key={`${source.document}-${source.page ?? "none"}`}>
                <span className="pt-0.5 font-mono text-xs font-medium text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-6 text-ink">{source.title}</p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm leading-5 text-muted sm:grid-cols-3">
                    {source.source.trim() ? (
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Institución</dt>
                        <dd className="mt-1">{source.source}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Documento</dt>
                      <dd className="mt-1 break-words">{source.document}</dd>
                    </div>
                    {source.page != null ? (
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Página</dt>
                        <dd className="mt-1">{source.page}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyMessage>No se recuperaron fuentes documentales para este análisis.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="limitations-title" className="mt-11 border-t border-line pt-8">
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface-subtle p-5 sm:p-6">
          <SectionHeading eyebrow="Transparencia" id="limitations-title" index="07">
            Alcance del resultado
          </SectionHeading>
          <ul className="mt-5 space-y-3">
            {analysis.limitations.map((limitation) => (
              <li className="flex gap-2 text-sm leading-6 text-muted" key={limitation}>
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 py-3 text-sm leading-6 text-ink">
            <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            <p>
              Este prototipo funciona como apoyo a la decisión clínica. No sustituye la valoración, el diagnóstico ni el criterio de un profesional de la salud.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-center py-8 sm:py-10">
        <Button variant="secondary" onClick={onNewAnalysis}>
          <Plus aria-hidden="true" className="size-4" />
          Nuevo análisis
        </Button>
      </div>
    </section>
  );
}
