"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Printer,
  TriangleAlert,
} from "lucide-react";

import { ProductMark } from "@/src/components/product-mark";
import { Button } from "@/src/components/ui/button";
import {
  ABSTENTION_MESSAGE,
  getImageQualityPresentation,
  getRedFlagPresentation,
  getScopePresentation,
  isImageObservation,
  isSafeExternalUrl,
} from "@/src/lib/analysis-contract";
import { cn } from "@/src/lib/utils";
import type {
  ClinicalAnalysis,
  DifferentialDiagnosis,
  ImageQualityStatus,
  MedicalSource,
  PossibleFinding,
  ReferralPriority,
} from "@/src/types/analysis";

interface AnalysisResultProps {
  analysis: ClinicalAnalysis;
  onNewAnalysis: () => void;
}

const priorityLabels: Record<ReferralPriority, string> = {
  urgent: "Urgente",
  soon: "Prioritaria",
  routine: "Ordinaria",
  not_assessed: "No determinada",
};

const toneStyles = {
  neutral: "border-line bg-surface-subtle text-muted",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
} as const;

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
        <span aria-hidden="true" className="text-muted/60">
          /
        </span>
        <span>{eyebrow}</span>
      </p>
      <h2 className="text-base font-semibold tracking-tight text-ink" id={id}>
        {children}
      </h2>
    </div>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm leading-6 text-muted">{children}</p>;
}

function FindingList({
  items,
  title,
  visual = false,
}: {
  items: PossibleFinding[];
  title: string;
  visual?: boolean;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className={cn("mt-6", visual && "border-t border-line pt-6")}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {visual ? (
        <p className="mt-1.5 text-xs leading-5 text-muted">
          Son observaciones comunicadas a partir de la imagen; no equivalen a hechos clínicos confirmados.
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {items.map((finding, index) => (
          <li
            className={cn(
              "print-avoid-break flex gap-3 border-l-2 py-1 pl-4 text-sm leading-6",
              visual ? "border-warning/50 text-ink" : "border-primary/30 text-ink",
            )}
            key={`${finding.finding}-${index}`}
          >
            <span>{finding.finding}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DifferentialItem({
  index,
  item,
}: {
  index: number;
  item: DifferentialDiagnosis;
}) {
  const reasoning = item.reasoning.map((reason) => reason.trim()).filter(Boolean).join(" ");

  return (
    <li className="print-avoid-break grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0">
      <span className="pt-0.5 font-mono text-xs font-medium text-primary">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-6 text-ink">{item.diagnosis}</h3>
        {reasoning ? <p className="mt-2 text-sm leading-6 text-muted">{reasoning}</p> : null}
      </div>
    </li>
  );
}

function getSourceMetadataEntries(source: MedicalSource) {
  return [
    source.source ? { label: "Fuente", value: source.source } : null,
    source.institution ? { label: "Institución", value: source.institution } : null,
    source.category ? { label: "Categoría", value: source.category } : null,
    source.year != null ? { label: "Año", value: String(source.year) } : null,
    source.documentType ? { label: "Tipo de documento", value: source.documentType } : null,
    source.chunk ? { label: "Fragmento", value: source.chunk } : null,
    source.context ? { label: "Contexto", value: source.context } : null,
    { label: "Documento", value: source.document },
    source.page != null ? { label: "Página", value: String(source.page) } : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));
}

function SourceMetadata({ source }: { source: MedicalSource }) {
  const entries = getSourceMetadataEntries(source);

  return (
    <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm leading-5 text-muted sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={`${entry.label}-${entry.value}`}>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {entry.label}
          </dt>
          <dd className="mt-1 break-words">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SourceItem({ source, index }: { source: MedicalSource; index: number }) {
  const sourceUrl = isSafeExternalUrl(source.url) ? source.url?.trim() : null;

  return (
    <li className="print-avoid-break grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0">
      <span className="pt-0.5 font-mono text-xs font-medium text-primary">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-6 text-ink">{source.title}</p>
        <SourceMetadata source={source} />
        {sourceUrl ? (
          <a
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            href={sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Abrir fuente externa
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        ) : null}
      </div>
    </li>
  );
}

function buildCopySummary({
  analysis,
  imageQuality,
  reportedFindings,
  visualFindings,
  redFlags,
}: {
  analysis: ClinicalAnalysis;
  imageQuality: ReturnType<typeof getImageQualityPresentation>;
  reportedFindings: PossibleFinding[];
  visualFindings: PossibleFinding[];
  redFlags: string[];
}) {
  const scope = getScopePresentation(analysis.scopeState);
  const lines = [
    "Informe de apoyo clínico",
    "",
    "Evaluación inicial",
    ...(scope ? [scope.label, scope.description] : [
      "El servicio no proporcionó un estado de alcance separado en esta respuesta.",
    ]),
    imageQuality.label,
    imageQuality.description,
    ...(analysis.clinicalSummary?.trim()
      ? ["", "Resumen del servicio", analysis.clinicalSummary.trim()]
      : []),
    "",
    "Hallazgos relevantes",
    ...(reportedFindings.length
      ? ["Datos clínicos comunicados", ...reportedFindings.map((finding) => `• ${finding.finding}`)]
      : []),
    ...(visualFindings.length
      ? [
          "Observaciones de la imagen",
          ...visualFindings.map((finding) => `• ${finding.finding}`),
        ]
      : []),
    ...(!reportedFindings.length && !visualFindings.length
      ? ["No se registraron hallazgos relevantes con la información disponible."]
      : []),
    "",
    "Posibilidades diagnósticas",
    ...(analysis.differentialDiagnoses.length
      ? analysis.differentialDiagnoses.flatMap((item) => [
          `• ${item.diagnosis}`,
          ...item.reasoning.map((reason) => `  ${reason}`),
        ])
      : [ABSTENTION_MESSAGE]),
    "",
    "Signos de alarma",
    ...(redFlags.length
      ? redFlags.map((flag) => `• ${flag}`)
      : ["No se identificaron signos de alarma con la información disponible."]),
    "",
    "Información que ayudaría a precisar el caso",
    ...(analysis.missingInformation.length
      ? analysis.missingInformation.map((item) => `• ${item}`)
      : ["No se señalaron datos faltantes en este análisis."]),
    "",
    "Siguiente paso clínico",
    `Prioridad: ${priorityLabels[analysis.referral.priority]}`,
    `Orientación del servicio: ${analysis.referral.reason}`,
    "",
    "Evidencia consultada",
    ...(analysis.sources.length
      ? analysis.sources.flatMap((source) => [
          `• ${source.title}`,
          ...getSourceMetadataEntries(source).map((entry) => `  ${entry.label}: ${entry.value}`),
          ...(isSafeExternalUrl(source.url) ? [`  URL: ${source.url?.trim()}`] : []),
        ])
      : ["No se recuperó evidencia documental para este análisis."]),
    "",
    "Limitaciones del análisis",
    ...(analysis.limitations.length
      ? analysis.limitations.map((limitation) => `• ${limitation}`)
      : ["El servicio no reportó limitaciones adicionales."]),
    "",
    "Este prototipo es apoyo a la decisión clínica y no sustituye el juicio profesional ni la valoración clínica.",
  ];

  return lines.join("\n");
}

function copyTextWithFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) {
    throw new Error("Copy failed");
  }
}

function QualityBadge({
  status,
  label,
  tone,
}: {
  status: ImageQualityStatus;
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-2 rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold", toneStyles[tone])}>
      {status === "adequate" || status === "acceptable" ? (
        <CheckCircle2 aria-hidden="true" className="size-4" />
      ) : status === "insufficient" ? (
        <TriangleAlert aria-hidden="true" className="size-4" />
      ) : status === "limited" ? (
        <AlertCircle aria-hidden="true" className="size-4" />
      ) : (
        <Info aria-hidden="true" className="size-4" />
      )}
      {label}
    </span>
  );
}

export function AnalysisResult({ analysis, onNewAnalysis }: AnalysisResultProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const imageQuality = getImageQualityPresentation(
    analysis.imageQuality.status,
    analysis.imageQuality.message,
  );
  const reportedFindings = analysis.possibleFindings.filter((finding) => !isImageObservation(finding));
  const visualFindings = analysis.possibleFindings.filter(isImageObservation);
  const redFlagPresentation = getRedFlagPresentation(analysis.redFlags);
  const scopePresentation = getScopePresentation(analysis.scopeState);
  const copySummary = buildCopySummary({
    analysis,
    imageQuality,
    redFlags: redFlagPresentation.flags,
    reportedFindings,
    visualFindings,
  });

  async function handleCopySummary() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copySummary);
      } else {
        copyTextWithFallback(copySummary);
      }
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section aria-labelledby="analysis-result-title" className="print-result mx-auto w-full max-w-[760px]">
      <header className="print-avoid-break mb-7 border-b border-line pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProductMark className="size-10" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Apoyo clínico / informe
              </p>
              <p className="mt-1 text-xs font-medium text-muted">Respuesta estructurada del servicio</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-primary/15 bg-primary-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary sm:inline-flex">
            No diagnóstico
          </span>
        </div>
        <h1
          className="mt-7 text-[clamp(1.8rem,4vw,2.3rem)] font-semibold tracking-[-0.03em] text-ink"
          id="analysis-result-title"
        >
          Informe de apoyo clínico
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          La información siguiente organiza lo comunicado por el servicio para apoyar la valoración clínica. No presenta diagnósticos confirmados.
        </p>
        <p aria-live="polite" className="sr-only" role="status">
          El informe de apoyo clínico está disponible.
        </p>
        <div className="print-hide mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button className="w-full sm:w-auto" onClick={onNewAnalysis} variant="secondary">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Nueva evaluación
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => void handleCopySummary()} variant="secondary">
            {copyState === "copied" ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copyState === "copied"
              ? "Informe copiado"
              : copyState === "failed"
                ? "No se pudo copiar"
                : "Copiar informe"}
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => window.print()} variant="secondary">
            <Printer aria-hidden="true" className="size-4" />
            Imprimir
          </Button>
        </div>
        <span aria-live="polite" className="sr-only">
          {copyState === "copied"
            ? "Informe copiado al portapapeles."
            : copyState === "failed"
              ? "No fue posible copiar el informe."
              : null}
        </span>
      </header>

      <section aria-labelledby="overview-title" className="print-section border-y border-line bg-surface">
        <div className="px-5 py-5 sm:px-6">
          <SectionHeading eyebrow="Resumen" id="overview-title" index="01">
            Evaluación inicial
          </SectionHeading>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)]">
            <div>
              {scopePresentation ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-ink">Estado del caso</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{scopePresentation.description}</p>
                  </div>
                  <span className={cn("inline-flex w-fit shrink-0 rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold", toneStyles[scopePresentation.tone])}>
                    {scopePresentation.label}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-ink">Resumen del caso</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    El servicio no proporcionó un estado de alcance separado en esta respuesta.
                  </p>
                </div>
              )}
              {analysis.clinicalSummary?.trim() ? (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Resumen del servicio</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{analysis.clinicalSummary.trim()}</p>
                </div>
              ) : null}
            </div>
            <div className="rounded-[var(--radius-panel)] border border-line bg-surface-subtle p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Apoyo visual</p>
              <div className="mt-3">
                <QualityBadge
                  label={imageQuality.label}
                  status={analysis.imageQuality.status}
                  tone={imageQuality.tone}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{imageQuality.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="findings-title" className="print-section mt-10">
        <SectionHeading eyebrow="Observaciones" id="findings-title" index="02">
          Hallazgos relevantes
        </SectionHeading>
        <FindingList items={reportedFindings} title="Datos clínicos comunicados" />
        <FindingList items={visualFindings} title="Observaciones de la imagen" visual />
        {!reportedFindings.length && !visualFindings.length ? (
          <EmptyMessage>No se registraron hallazgos relevantes con la información disponible.</EmptyMessage>
        ) : null}
      </section>

      <section aria-labelledby="differentials-title" className="print-section mt-10">
        <SectionHeading eyebrow="Correlación clínica" id="differentials-title" index="03">
          Posibilidades diagnósticas
        </SectionHeading>
        <p className="mt-3 text-sm leading-6 text-muted">
          Son posibilidades para correlacionar con la valoración clínica; no son diagnósticos confirmados ni probabilidades calculadas.
        </p>
        {analysis.differentialDiagnoses.length ? (
          <ul className="mt-5">
            {analysis.differentialDiagnoses.map((item, index) => (
              <DifferentialItem index={index + 1} item={item} key={`${item.diagnosis}-${index}`} />
            ))}
          </ul>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-panel)] border border-warning/25 bg-warning-soft p-4 sm:p-5">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold leading-6 text-ink">El servicio se abstuvo de presentar posibilidades.</p>
              <p className="mt-1 text-sm leading-6 text-muted">{ABSTENTION_MESSAGE}</p>
              <p className="mt-3 text-xs leading-5 text-muted">
                Revise la información faltante, las limitaciones y el siguiente paso clínico comunicados abajo.
              </p>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="red-flags-title" className="print-section mt-10">
        <SectionHeading eyebrow="Prioridad clínica" id="red-flags-title" index="04">
          Signos de alarma
        </SectionHeading>
        <div
          className={cn(
            "mt-4 rounded-[var(--radius-panel)] border p-4 sm:p-5",
            redFlagPresentation.hasFlags ? "border-danger/25 bg-danger-soft" : "border-success/20 bg-success-soft",
          )}
        >
          <div className="flex items-start gap-3">
            {redFlagPresentation.hasFlags ? (
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            )}
            <p className={cn("text-sm leading-6", redFlagPresentation.hasFlags ? "text-danger/90" : "text-success")}>
              {redFlagPresentation.hasFlags
                ? "El servicio reportó estos signos para revisión durante la valoración clínica."
                : "No se identificaron signos de alarma con la información disponible."}
            </p>
          </div>
          {redFlagPresentation.hasFlags ? (
            <ul className="mt-5 space-y-3 border-t border-danger/15 pt-4">
              {redFlagPresentation.flags.map((flag, index) => (
                <li className="print-avoid-break flex gap-2 text-sm leading-6 text-danger" key={`${flag}-${index}`}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="missing-information-title" className="print-section mt-10">
        <SectionHeading eyebrow="Completitud clínica" id="missing-information-title" index="05">
          Información que ayudaría a precisar el caso
        </SectionHeading>
        <p className="mt-3 text-sm leading-6 text-muted">
          Son datos faltantes o discriminantes señalados por el servicio; no representan hechos confirmados del paciente.
        </p>
        {analysis.missingInformation.length ? (
          <ul className="mt-5 space-y-3">
            {analysis.missingInformation.map((item, index) => (
              <li className="print-avoid-break flex gap-2 text-sm leading-6 text-muted" key={`${item}-${index}`}>
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyMessage>No se señalaron datos faltantes en este análisis.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="referral-title" className="print-section mt-10">
        <SectionHeading eyebrow="Orientación" id="referral-title" index="06">
          Siguiente paso clínico
        </SectionHeading>
        <div
          className={cn(
            "mt-4 rounded-[var(--radius-panel)] border p-4 sm:p-5",
            analysis.referral.recommended ? "border-warning/25 bg-warning-soft" : "border-line bg-surface-subtle",
          )}
        >
          <p className="text-sm font-semibold leading-6 text-ink">
            {analysis.referral.recommended
              ? "El servicio sugiere considerar valoración especializada."
              : analysis.referral.priority === "not_assessed"
                ? "El siguiente paso no fue determinado por el servicio."
                : "El servicio no indicó una recomendación especializada."}
          </p>
          <dl className="mt-4 space-y-3 text-sm leading-6">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Prioridad comunicada</dt>
              <dd className="mt-1 font-semibold text-ink">{priorityLabels[analysis.referral.priority]}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Orientación del servicio</dt>
              <dd className="mt-1 text-muted">{analysis.referral.reason}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="sources-title" className="print-section mt-11 border-t border-line pt-8">
        <SectionHeading eyebrow="Proveniencia" id="sources-title" index="07">
          Evidencia consultada
        </SectionHeading>
        <p className="mt-3 text-sm leading-6 text-muted">
          Estas fuentes fueron proporcionadas por el servicio. La interfaz no genera ni completa citas.
        </p>
        {analysis.sources.length ? (
          <ol className="mt-5">
            {analysis.sources.map((source, index) => (
              <SourceItem index={index} key={`${source.document}-${source.page ?? "sin-página"}-${index}`} source={source} />
            ))}
          </ol>
        ) : (
          <EmptyMessage>No se recuperó evidencia documental para este análisis.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="limitations-title" className="print-section mt-11 border-t border-line pt-8">
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface-subtle p-5 sm:p-6">
          <SectionHeading eyebrow="Transparencia" id="limitations-title" index="08">
            Limitaciones del análisis
          </SectionHeading>
          {analysis.limitations.length ? (
            <ul className="mt-5 space-y-3">
              {analysis.limitations.map((limitation, index) => (
                <li className="print-avoid-break flex gap-2 text-sm leading-6 text-muted" key={`${limitation}-${index}`}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage>El servicio no reportó limitaciones adicionales.</EmptyMessage>
          )}
          <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 py-3 text-sm leading-6 text-ink">
            <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            <p>
              Este prototipo funciona como apoyo a la decisión clínica. No sustituye el juicio profesional ni la valoración clínica.
            </p>
          </div>
        </div>
      </section>

      <div className="print-hide flex justify-center py-8 sm:py-10">
        <Button onClick={onNewAnalysis} variant="secondary">
          <Plus aria-hidden="true" className="size-4" />
          Nueva evaluación
        </Button>
      </div>
    </section>
  );
}
