import { CircleDashed, FileText, ImageIcon, Search } from "lucide-react";

import { ProductMark } from "@/src/components/product-mark";

const stages = [
  { icon: FileText, label: "Información clínica" },
  { icon: ImageIcon, label: "Imagen radiográfica" },
  { icon: Search, label: "Evidencia documental" },
  { icon: CircleDashed, label: "Preparación del resultado" },
];

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

export function AnalysisLoading() {
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
        Analizando caso
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-6 text-muted">
        Procesando información clínica y consultando la base de conocimiento médico.
      </p>

      <div className="mt-9 flex items-center justify-center">
        <ScanMotif />
      </div>

      <div className="mt-8 w-full text-left">
        <div className="border-y border-line">
          {stages.map(({ icon: Icon, label }) => (
            <div className="flex items-center gap-3 border-b border-line px-1 py-3.5 last:border-b-0" key={label}>
              <Icon aria-hidden="true" className="size-4 shrink-0 text-primary/70" />
              <span className="text-sm text-ink/75">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">
          El proceso puede tardar unos minutos según la disponibilidad del servicio.
        </p>
      </div>
    </section>
  );
}
