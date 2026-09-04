"use client";

import { CircleAlert } from "lucide-react";

import { ProductMark } from "@/src/components/product-mark";
import { Button } from "@/src/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  void error;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col px-4 py-8 sm:px-6 sm:py-14">
      <header className="flex items-center gap-3 border-b border-line pb-6">
        <ProductMark className="size-10" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Apoyo clínico
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight text-ink">
            Estado de la aplicación
          </p>
        </div>
      </header>

      <div className="flex-1 py-12 sm:py-20">
        <CircleAlert aria-hidden="true" className="size-8 text-warning" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          No fue posible mostrar esta pantalla
        </h1>
        <p aria-live="assertive" className="mt-3 max-w-xl text-base leading-7 text-muted" role="alert">
          Ocurrió un problema inesperado en la interfaz. El contenido clínico no se ha modificado.
        </p>
        <Button className="mt-8" onClick={reset}>
          Intentar nuevamente
        </Button>
      </div>
    </main>
  );
}
