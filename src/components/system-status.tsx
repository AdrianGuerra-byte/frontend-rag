"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { getHealth } from "@/src/lib/api";

type Status = "checking" | "available" | "ai-unavailable" | "offline";

const statusContent: Record<Exclude<Status, "checking">, { label: string; mobileLabel: string; tone: string; dot: string }> = {
  available: { label: "Sistema disponible", mobileLabel: "Disponible", tone: "text-success", dot: "bg-success" },
  "ai-unavailable": {
    label: "Servicio de IA no disponible",
    mobileLabel: "IA no disponible",
    tone: "text-warning",
    dot: "bg-warning",
  },
  offline: { label: "Servicio no disponible", mobileLabel: "No disponible", tone: "text-danger", dot: "bg-danger" },
};

export function SystemStatus() {
  const [status, setStatus] = useState<Status>("checking");

  const checkHealth = useCallback(async () => {
    try {
      const health = await getHealth();
      if (health.status.toLowerCase() !== "ok") {
        setStatus("offline");
      } else {
        setStatus(health.ollama ? "available" : "ai-unavailable");
      }
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getHealth()
      .then((health) => {
        if (!isMounted) {
          return;
        }

        if (health.status.toLowerCase() !== "ok") {
          setStatus("offline");
        } else {
          setStatus(health.ollama ? "available" : "ai-unavailable");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("offline");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div aria-live="polite" className="flex items-center gap-2 text-xs font-medium text-muted" role="status">
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        Verificando conexión
      </div>
    );
  }

  const content = statusContent[status];

  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${content.tone}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${content.dot}`} />
      <span className="sm:hidden">{content.mobileLabel}</span>
      <span className="hidden sm:inline">{content.label}</span>
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
