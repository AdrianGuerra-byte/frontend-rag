import { CircleDashed, FileText, ImageIcon, LoaderCircle, Search } from "lucide-react";

import { Card } from "@/src/components/ui/card";

const stages = [
  { icon: FileText, label: "Información clínica recibida" },
  { icon: ImageIcon, label: "Analizando imagen" },
  { icon: Search, label: "Consultando evidencia médica" },
  { icon: CircleDashed, label: "Preparando resultado" },
];

export function AnalysisLoading() {
  return (
    <section
      aria-labelledby="analysis-loading-title"
      aria-live="polite"
      className="mx-auto flex w-full max-w-2xl flex-col items-center py-8 text-center sm:py-16"
      role="status"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <LoaderCircle aria-hidden="true" className="size-8 animate-spin" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Procesamiento en curso</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950" id="analysis-loading-title">
        Analizando caso
      </h1>
      <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
        Procesando información clínica y consultando la base de conocimiento médico.
      </p>

      <Card className="mt-8 w-full p-4 text-left sm:p-5">
        <div className="space-y-1">
          {stages.map(({ icon: Icon, label }) => (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3" key={label}>
              <Icon aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
              <span className="text-sm text-slate-600">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
          El proceso puede tardar unos minutos según la disponibilidad del servicio.
        </p>
      </Card>
    </section>
  );
}
