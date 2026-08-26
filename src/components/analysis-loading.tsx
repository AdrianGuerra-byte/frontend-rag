import { CircleDashed, FileText, ImageIcon, LoaderCircle, Search } from "lucide-react";

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
      className="mx-auto flex w-full max-w-2xl flex-col items-center py-8 text-center sm:py-14"
      role="status"
    >
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-panel)] border border-primary/15 bg-primary-soft text-primary">
        <LoaderCircle aria-hidden="true" className="size-7 animate-spin" />
      </div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Procesamiento en curso</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl" id="analysis-loading-title">
        Analizando caso
      </h1>
      <p className="mt-3 max-w-lg text-base leading-7 text-muted">
        Procesando información clínica y consultando la base de conocimiento médico.
      </p>

      <div className="mt-8 w-full overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface text-left">
        <div>
          {stages.map(({ icon: Icon, label }) => (
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 sm:px-5" key={label}>
              <Icon aria-hidden="true" className="size-4 shrink-0 text-primary/70" />
              <span className="text-sm text-ink/75">{label}</span>
            </div>
          ))}
        </div>
        <p className="border-t border-line bg-surface-subtle px-4 py-3 text-xs leading-5 text-muted sm:px-5">
          El proceso puede tardar unos minutos según la disponibilidad del servicio.
        </p>
      </div>
    </section>
  );
}
