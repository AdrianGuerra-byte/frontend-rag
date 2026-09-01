"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";

import { getApiErrorKind, getHealth } from "@/src/lib/api";

type Status = "checking" | "available" | "limited" | "offline" | "configuration";

const statusContent: Record<
  Exclude<Status, "checking">,
  { label: string; mobileLabel: string; tone: string; dot: string }
> = {
  available: {
    label: "Servicio disponible",
    mobileLabel: "Disponible",
    tone: "text-success",
    dot: "bg-success",
  },
  limited: {
    label: "Servicio parcialmente disponible",
    mobileLabel: "Servicio limitado",
    tone: "text-warning",
    dot: "bg-warning",
  },
  offline: {
    label: "Servicio no disponible",
    mobileLabel: "No disponible",
    tone: "text-danger",
    dot: "bg-danger",
  },
  configuration: {
    label: "Configuración pendiente",
    mobileLabel: "Config. pendiente",
    tone: "text-warning",
    dot: "bg-warning",
  },
};

function statusFromError(error: unknown): Status {
  return getApiErrorKind(error) === "configuration" ? "configuration" : "offline";
}

function statusFromHealth(health: { status: string; ollama: boolean }): Status {
  if (health.status.toLowerCase() !== "ok") {
    return "offline";
  }

  return health.ollama ? "available" : "limited";
}

export function SystemStatus() {
  const [status, setStatus] = useState<Status>("checking");

  const checkHealth = useCallback(async () => {
    try {
      setStatus(statusFromHealth(await getHealth()));
    } catch (error) {
      setStatus(statusFromError(error));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getHealth()
      .then((health) => {
        if (isMounted) {
          setStatus(statusFromHealth(health));
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus(statusFromError(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div
        aria-live="polite"
        className="flex items-center gap-2 text-xs font-medium text-muted"
        role="status"
      >
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        Verificando conexión
      </div>
    );
  }

  const content = statusContent[status];

  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-2 text-xs font-medium ${content.tone}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${content.dot}`} />
      <span className="sm:hidden">{content.mobileLabel}</span>
      <span className="hidden sm:inline">{content.label}</span>
      {status === "offline" ? <CircleAlert aria-hidden="true" className="size-3.5" /> : null}
      <button
        aria-label="Verificar conexión nuevamente"
        className="-mr-2 flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        type="button"
        onClick={() => {
          setStatus("checking");
          void checkHealth();
        }}
      >
        <RefreshCw aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}
