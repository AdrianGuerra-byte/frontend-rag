import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
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
  routine: "Programable",
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

function SectionHeading({
  children,
  icon: Icon,
  id,
}: {
  children: string;
  icon: typeof FileText;
  id: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950" id={id}>
          {children}
        </h2>
      </div>
    </div>
  );
}

function EmptyMessage({ children }: { children: string }) {
  return <p className="mt-5 text-sm leading-6 text-slate-500">{children}</p>;
}

function DifferentialItem({ item }: { item: DifferentialDiagnosis }) {
  return (
    <li className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <h3 className="text-sm font-semibold leading-6 text-slate-900">{item.diagnosis}</h3>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Elementos relacionados</p>
      <ul className="mt-2 space-y-2">
        {item.reasoning.map((reason) => (
          <li className="flex gap-2 text-sm leading-6 text-slate-600" key={reason}>
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function AnalysisResult({ analysis, onNewAnalysis }: AnalysisResultProps) {
  const qualityIsAdequate = analysis.imageQuality.status === "adequate";
  const hasRedFlags = analysis.redFlags.length > 0;
  const referralNeedsAttention = analysis.referral.recommended;
  const referralTitle = referralNeedsAttention
    ? "Valoración especializada recomendada"
    : analysis.referral.priority === "not_assessed"
      ? "Canalización no valorada"
      : "No se determinó una necesidad inmediata de canalización";

  return (
    <section aria-labelledby="analysis-result-title" className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Apoyo a la decisión clínica</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl" id="analysis-result-title">
            Resultado del análisis
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Análisis <span className="font-mono text-xs text-slate-600">#{analysis.analysisId.slice(0, 8)}</span>
          </p>
        </div>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={onNewAnalysis}>
          Nuevo análisis
        </Button>
      </header>

      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Evaluación inicial</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Calidad de la imagen</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {knownImageMessages[analysis.imageQuality.message] ?? analysis.imageQuality.message}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                  qualityIsAdequate ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800",
                )}
              >
                {qualityIsAdequate ? (
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                ) : (
                  <AlertCircle aria-hidden="true" className="size-4" />
                )}
                {imageQualityLabels[analysis.imageQuality.status]}
              </span>
            </div>
          </div>

          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:gap-12">
            <section aria-labelledby="findings-title">
              <SectionHeading icon={Stethoscope} id="findings-title">
                Posibles hallazgos
              </SectionHeading>
              {analysis.possibleFindings.length ? (
                <ul className="mt-5 space-y-3">
                  {analysis.possibleFindings.map((finding) => (
                    <li className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" key={`${finding.finding}-${finding.confidence}`}>
                      <p className="text-sm font-medium leading-6 text-slate-900">{finding.finding}</p>
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        Confianza del análisis visual: <span className="font-semibold text-slate-700">{confidenceLabels[finding.confidence]}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyMessage>El análisis no registró posibles hallazgos.</EmptyMessage>
              )}
            </section>

            <section aria-labelledby="differentials-title">
              <SectionHeading icon={FileText} id="differentials-title">
                Diagnósticos diferenciales
              </SectionHeading>
              {analysis.differentialDiagnoses.length ? (
                <ul className="mt-5">
                  {analysis.differentialDiagnoses.map((item) => (
                    <DifferentialItem item={item} key={item.diagnosis} />
                  ))}
                </ul>
              ) : (
                <EmptyMessage>El análisis no registró diagnósticos diferenciales.</EmptyMessage>
              )}
            </section>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className={hasRedFlags ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    hasRedFlags ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600",
                  )}
                >
                  <TriangleAlert aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <h2 className={cn("text-lg font-semibold tracking-tight", hasRedFlags ? "text-rose-950" : "text-slate-950")}>Signos de alarma</h2>
                  <p className={cn("mt-1 text-sm leading-6", hasRedFlags ? "text-rose-900/70" : "text-slate-500")}>
                    {hasRedFlags ? "Revise estos puntos durante la valoración clínica." : "No se identificaron alertas adicionales dentro de la información procesada."}
                  </p>
                </div>
              </div>
              {hasRedFlags ? (
                <ul className="mt-5 space-y-3">
                  {analysis.redFlags.map((flag) => (
                    <li className="flex gap-2 text-sm leading-6 text-rose-950" key={flag}>
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-600" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="p-5 sm:p-6">
              <SectionHeading icon={Info} id="missing-information-title">
                Información que sería útil complementar
              </SectionHeading>
              {analysis.missingInformation.length ? (
                <ul className="mt-5 space-y-3">
                  {analysis.missingInformation.map((item) => (
                    <li className="flex gap-2 text-sm leading-6 text-slate-600" key={item}>
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyMessage>No se señalaron datos faltantes en este análisis.</EmptyMessage>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-5 sm:p-6">
            <SectionHeading icon={Stethoscope} id="referral-title">
              Canalización
            </SectionHeading>
            <div
              className={cn(
                "mt-5 rounded-xl border p-4",
                referralNeedsAttention ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50/70",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">{referralTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.referral.reason}</p>
                </div>
                <span className="inline-flex w-fit shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                  Prioridad: {priorityLabels[analysis.referral.priority]}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5 sm:p-6">
            <SectionHeading icon={BookOpen} id="sources-title">
              Fuentes consultadas
            </SectionHeading>
            {analysis.sources.length ? (
              <ul className="mt-5 divide-y divide-slate-100">
                {analysis.sources.map((source) => (
                  <li className="py-4 first:pt-0 last:pb-0" key={`${source.document}-${source.page ?? "none"}`}>
                    <p className="text-sm font-semibold leading-6 text-slate-900">{source.title}</p>
                    <dl className="mt-2 grid gap-1 text-sm leading-6 text-slate-600 sm:grid-cols-3 sm:gap-x-4">
                      <div>
                        <dt className="inline text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Institución: </dt>
                        <dd className="inline">{source.source}</dd>
                      </div>
                      <div>
                        <dt className="inline text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Documento: </dt>
                        <dd className="inline">{source.document}</dd>
                      </div>
                      {source.page ? (
                        <div>
                          <dt className="inline text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Página: </dt>
                          <dd className="inline">{source.page}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyMessage>No se recuperaron fuentes documentales para este análisis.</EmptyMessage>
            )}
          </div>
        </Card>

        <Card className="border-slate-300 bg-slate-50/80">
          <div className="p-5 sm:p-6">
            <SectionHeading icon={Info} id="limitations-title">
              Alcance del resultado
            </SectionHeading>
            <ul className="mt-5 space-y-3">
              {analysis.limitations.map((limitation) => (
                <li className="flex gap-2 text-sm leading-6 text-slate-600" key={limitation}>
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal-700" />
              <p>
                Este prototipo funciona como apoyo a la decisión clínica. No sustituye la valoración, el diagnóstico ni el criterio de un profesional de la salud.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center py-8 sm:py-10">
        <Button variant="secondary" onClick={onNewAnalysis}>
          Nuevo análisis
        </Button>
      </div>
    </section>
  );
}
