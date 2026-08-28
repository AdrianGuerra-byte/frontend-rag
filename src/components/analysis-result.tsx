import { AlertCircle, ArrowLeft, CheckCircle2, Info, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { ProductMark } from "@/src/components/product-mark";
import { cn } from "@/src/lib/utils";
import type {
  ClinicalAnalysis,
  DifferentialDiagnosis,
  ImageQuality,
  ImageQualityStatus,
  MedicalSource,
  ReferralPriority,
} from "@/src/types/analysis";

interface AnalysisResultProps {
  analysis: ClinicalAnalysis;
  onNewAnalysis: () => void;
}

const NO_IMAGE_TITLE = "Sin estudio radiográfico";
const NO_IMAGE_MESSAGE = "El análisis se realizó con la información clínica proporcionada.";

const priorityLabels: Record<ReferralPriority, string> = {
  urgent: "Urgente",
  soon: "Prioritaria",
  routine: "Ordinaria",
  not_assessed: "No determinada",
};

const imageQualityLabels: Record<ImageQualityStatus, string> = {
  adequate: "Adecuada",
  insufficient: "Insuficiente",
  not_provided: "No proporcionada",
};

const knownImageMessages: Record<string, string> = {
  "Image can be evaluated by the prototype.": "La imagen puede ser evaluada.",
  "The image quality is insufficient for visual analysis.":
    "La calidad de la imagen es insuficiente para su interpretación.",
  "No image was provided; text-only analysis is being used.": NO_IMAGE_MESSAGE,
};

function getImageQualityLabel(analysis: ImageQuality) {
  if (analysis.message.startsWith("Image quality is limited:")) {
    return "Limitada";
  }

  return imageQualityLabels[analysis.status];
}

function getImageQualityMessage(analysis: ImageQuality) {
  if (analysis.status === "not_provided") {
    return NO_IMAGE_MESSAGE;
  }

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
  const reasoning = item.reasoning.map((reason) => reason.trim()).filter(Boolean).join(" ");

  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0">
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

interface SourceGroup {
  document: string;
  title: string;
  source?: string;
  institution?: string;
  category?: string;
  pages: number[];
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function groupSources(sources: MedicalSource[]) {
  const groups = new Map<string, SourceGroup>();

  for (const source of sources) {
    const document = source.document.trim();
    if (!document) {
      continue;
    }

    const current = groups.get(document);
    if (current) {
      if (!current.source) current.source = cleanOptional(source.source);
      if (!current.institution) current.institution = cleanOptional(source.institution);
      if (!current.category) current.category = cleanOptional(source.category);
      if (source.page != null && !current.pages.includes(source.page)) {
        current.pages.push(source.page);
        current.pages.sort((left, right) => left - right);
      }
      continue;
    }

    groups.set(document, {
      document,
      title: source.title.trim() || document,
      source: cleanOptional(source.source),
      institution: cleanOptional(source.institution),
      category: cleanOptional(source.category),
      pages: source.page == null ? [] : [source.page],
    });
  }

  return Array.from(groups.values());
}

function formatPages(pages: number[]) {
  if (!pages.length) {
    return null;
  }

  if (pages.length === 1) {
    return `Página ${pages[0]}`;
  }

  const lastPage = pages[pages.length - 1];
  return `Páginas ${pages.slice(0, -1).join(", ")} y ${lastPage}`;
}

export function AnalysisResult({ analysis, onNewAnalysis }: AnalysisResultProps) {
  const isTextOnly =
    !analysis.imageQuality || analysis.imageQuality.status === "not_provided";
  const qualityIsAdequate = analysis.imageQuality?.status === "adequate";
  const hasUsableImage = qualityIsAdequate;
  const imageQualityMessage = isTextOnly
    ? NO_IMAGE_MESSAGE
    : analysis.imageQuality
      ? getImageQualityMessage(analysis.imageQuality)
      : NO_IMAGE_MESSAGE;
  const imageQualityLabel = analysis.imageQuality
    ? getImageQualityLabel(analysis.imageQuality)
    : null;
  const hasRedFlags = analysis.redFlags.length > 0;
  const referralNeedsAttention = analysis.referral.recommended;
  const referralTitle = referralNeedsAttention
    ? "Valoración especializada recomendada"
    : analysis.referral.priority === "not_assessed"
      ? "Siguiente paso por definir en valoración clínica"
      : "No se identificó una necesidad inmediata de valoración especializada";
  const referralEscalation = cleanOptional(analysis.referral.escalation);
  const groupedSources = groupSources(analysis.sources);

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

      <section aria-labelledby="overview-title" className="border-y border-line bg-surface">
        <div className="px-5 py-5 sm:px-6">
          <SectionHeading eyebrow="Resumen" id="overview-title" index="01">
            Evaluación inicial
          </SectionHeading>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                {isTextOnly ? NO_IMAGE_TITLE : "Estudio radiográfico"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {imageQualityMessage}
              </p>
            </div>
            {!isTextOnly && imageQualityLabel ? (
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
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="findings-title" className="mt-10">
        <SectionHeading eyebrow={hasUsableImage ? "Datos clínicos e imagen" : "Datos clínicos"} id="findings-title" index="02">
          Hallazgos relevantes
        </SectionHeading>
        {analysis.possibleFindings.length ? (
          <ul className="mt-5 space-y-4">
            {analysis.possibleFindings.map((finding, index) => (
              <li className="border-l-2 border-primary/30 py-1 pl-4" key={`${finding.finding}-${index}`}>
                <p className="text-sm font-semibold leading-6 text-ink">{finding.finding}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyMessage>No se registraron hallazgos relevantes con la información disponible.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="differentials-title" className="mt-10">
        <SectionHeading eyebrow="Correlación clínica" id="differentials-title" index="03">
          Posibilidades diagnósticas
        </SectionHeading>
        <p className="mt-3 text-sm leading-6 text-muted">
          Son posibilidades para correlacionar con la valoración clínica; no son diagnósticos confirmados.
        </p>
        {analysis.differentialDiagnoses.length ? (
          <ul className="mt-5">
            {analysis.differentialDiagnoses.map((item, index) => (
              <DifferentialItem index={index + 1} item={item} key={`${item.diagnosis}-${index}`} />
            ))}
          </ul>
        ) : (
          <EmptyMessage>No se registraron posibilidades diagnósticas con la información disponible.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="red-flags-title" className="mt-10">
        <SectionHeading eyebrow="Prioridad clínica" id="red-flags-title" index="04">
          Signos de alarma
        </SectionHeading>
        <div
          className={cn(
            "mt-4 rounded-[var(--radius-panel)] border p-4 sm:p-5",
            hasRedFlags ? "border-danger/25 bg-danger-soft" : "border-line bg-surface-subtle",
          )}
        >
          <div className="flex items-start gap-3">
            {hasRedFlags ? (
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
            ) : (
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
            )}
            <p className={cn("text-sm leading-6", hasRedFlags ? "text-danger/85" : "text-muted")}>
              {hasRedFlags
                ? "Revise estos puntos durante la valoración clínica."
                : "No se identificaron signos de alarma con la información disponible."}
            </p>
          </div>
          {hasRedFlags ? (
            <ul className="mt-5 space-y-3 border-t border-danger/15 pt-4">
              {analysis.redFlags.map((flag, index) => (
                <li className="flex gap-2 text-sm leading-6 text-danger" key={`${flag}-${index}`}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="missing-information-title" className="mt-10">
        <SectionHeading eyebrow="Completitud clínica" id="missing-information-title" index="05">
          Información que ayudaría a precisar el caso
        </SectionHeading>
        {analysis.missingInformation.length ? (
          <ul className="mt-5 space-y-3">
            {analysis.missingInformation.map((item, index) => (
              <li className="flex gap-2 text-sm leading-6 text-muted" key={`${item}-${index}`}>
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyMessage>No se señalaron datos faltantes en este análisis.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="referral-title" className="mt-10">
        <SectionHeading eyebrow="Plan de atención" id="referral-title" index="06">
          Siguiente paso clínico
        </SectionHeading>
        <div
          className={cn(
            "mt-4 border-l-2 px-4 py-1",
            referralNeedsAttention ? "border-warning bg-warning-soft" : "border-line-strong bg-surface-subtle",
          )}
        >
          <h3 className="text-sm font-semibold leading-6 text-ink">{referralTitle}</h3>
          <dl className="mt-4 space-y-3 text-sm leading-6">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Prioridad</dt>
              <dd className="mt-1 font-semibold text-ink">{priorityLabels[analysis.referral.priority]}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Acción sugerida</dt>
              <dd className="mt-1 text-muted">{analysis.referral.reason}</dd>
            </div>
            {referralEscalation ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Escalamiento</dt>
                <dd className="mt-1 text-muted">{referralEscalation}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <section aria-labelledby="sources-title" className="mt-11 border-t border-line pt-8">
        <SectionHeading eyebrow="Proveniencia" id="sources-title" index="07">
          Evidencia consultada
        </SectionHeading>
        {groupedSources.length ? (
          <ol className="mt-5 divide-y divide-line">
            {groupedSources.map((source, index) => {
              const pageLabel = formatPages(source.pages);

              return (
                <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-5 first:pt-0 last:pb-0" key={source.document}>
                  <span className="pt-0.5 font-mono text-xs font-medium text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-6 text-ink">{source.title}</p>
                    {pageLabel ? <p className="mt-2 text-sm text-muted">{pageLabel}</p> : null}
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm leading-5 text-muted sm:grid-cols-2">
                      {source.source ? (
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Fuente</dt>
                          <dd className="mt-1 break-words">{source.source}</dd>
                        </div>
                      ) : null}
                      {source.institution ? (
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Institución</dt>
                          <dd className="mt-1 break-words">{source.institution}</dd>
                        </div>
                      ) : null}
                      {source.category ? (
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Categoría</dt>
                          <dd className="mt-1 break-words">{source.category}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Documento</dt>
                        <dd className="mt-1 break-words">{source.document}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyMessage>No se recuperó evidencia documental para este análisis.</EmptyMessage>
        )}
      </section>

      <section aria-labelledby="limitations-title" className="mt-11 border-t border-line pt-8">
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface-subtle p-5 sm:p-6">
          <SectionHeading eyebrow="Transparencia" id="limitations-title" index="08">
            Limitaciones del análisis
          </SectionHeading>
          {analysis.limitations.length ? (
            <ul className="mt-5 space-y-3">
              {analysis.limitations.map((limitation, index) => (
                <li className="flex gap-2 text-sm leading-6 text-muted" key={`${limitation}-${index}`}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage>No se registraron limitaciones adicionales.</EmptyMessage>
          )}
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
