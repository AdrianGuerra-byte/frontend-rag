import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { ProductMark } from "@/src/components/product-mark";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col px-4 py-8 sm:px-6 sm:py-14">
      <header className="flex items-center gap-3 border-b border-line pb-6">
        <ProductMark className="size-12" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            RADIA
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-ink">
            Estado de la aplicación
          </p>
        </div>
      </header>

      <div className="flex-1 py-12 sm:py-20">
        <CircleAlert aria-hidden="true" className="size-8 text-warning" />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Página no disponible
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          No encontramos esta pantalla
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          La dirección solicitada no corresponde a una sección disponible del prototipo.
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-white transition-[background-color,box-shadow] duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a la evaluación
        </Link>
      </div>
    </main>
  );
}
