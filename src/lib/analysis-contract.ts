import type {
  ImageQualityStatus,
  PossibleFinding,
  ScopeState,
} from "../types/analysis";

export const ABSTENTION_MESSAGE =
  "No hay elementos suficientes para presentar posibilidades diagnósticas con el nivel de respaldo requerido.";

export interface ImageQualityPresentation {
  label: string;
  description: string;
  tone: "neutral" | "success" | "warning" | "danger";
}

export type RedFlagState = "present" | "none_identified" | "not_assessed";

export interface RedFlagPresentation {
  state: RedFlagState;
  hasFlags: boolean;
  flags: string[];
}

const knownImageMessages: Record<string, string> = {
  "Image can be evaluated by the prototype.":
    "La calidad de la imagen permite una valoración orientativa.",
  "The image quality is insufficient for visual analysis.":
    "La calidad de la imagen es insuficiente para una valoración radiográfica orientativa.",
  "No image was provided; text-only analysis is being used.":
    "No se proporcionó una imagen; el resultado se basa únicamente en la información clínica.",
};

function localizeImageMessage(message: string) {
  const trimmed = message.trim();
  const knownMessage = knownImageMessages[trimmed];
  if (knownMessage) {
    return knownMessage;
  }

  const limitedPrefix = "Image quality is limited:";
  if (trimmed.startsWith(limitedPrefix)) {
    return `La calidad de la imagen es limitada: ${trimmed.slice(limitedPrefix.length).trim()}`;
  }

  return trimmed;
}

export function getImageQualityPresentation(
  status: ImageQualityStatus | string,
  message: string,
): ImageQualityPresentation {
  const localizedMessage = localizeImageMessage(message);

  switch (status) {
    case "adequate":
    case "acceptable":
      return {
        label: "Calidad de imagen aceptable",
        description:
          localizedMessage || "La imagen puede utilizarse como apoyo visual orientativo.",
        tone: "success",
      };
    case "limited":
      return {
        label: "Calidad de imagen limitada",
        description:
          localizedMessage ||
          "La imagen fue analizada, pero sus limitaciones técnicas reducen el respaldo visual.",
        tone: "warning",
      };
    case "insufficient":
      return {
        label: "Calidad de imagen insuficiente",
        description:
          localizedMessage ||
          "La imagen no es adecuada para aportar apoyo visual significativo.",
        tone: "danger",
      };
    case "not_provided":
      return {
        label: "Sin imagen adjunta",
        description:
          localizedMessage ||
          "El análisis se realizó únicamente con la información clínica proporcionada.",
        tone: "neutral",
      };
    default:
      return {
        label: "Calidad de imagen no determinada",
        description:
          "El servicio no comunicó un estado de imagen reconocido; interpreta el resultado con cautela.",
        tone: "warning",
      };
  }
}

const noRedFlagPattern =
  /^(?:no se identificaron|no se observan|no se reportan|no se encontraron|no se evidencian|no se documentan|sin signos de alarma|sin evidencia de signos de alarma|no red flags)\b/i;

export function getRedFlagPresentation(redFlags: string[]): RedFlagPresentation {
  const normalizedFlags = redFlags.map((flag) => flag.trim()).filter(Boolean);
  const flags = normalizedFlags
    .filter((flag) => !noRedFlagPattern.test(flag));
  const hasExplicitNegative = normalizedFlags.some((flag) => noRedFlagPattern.test(flag));

  return {
    state: flags.length > 0 ? "present" : hasExplicitNegative ? "none_identified" : "not_assessed",
    hasFlags: flags.length > 0,
    flags,
  };
}

export function getScopePresentation(scopeState: ScopeState | null | undefined) {
  switch (scopeState) {
    case "supported":
      return {
        label: "Caso dentro del alcance",
        description: "El servicio identificó el caso como compatible con su alcance actual.",
        tone: "success" as const,
      };
    case "supported_but_insufficient":
      return {
        label: "Información insuficiente para un análisis completo",
        description:
          "El caso está dentro del alcance, pero la información disponible no permite completar la orientación.",
        tone: "warning" as const,
      };
    case "unsupported":
      return {
        label: "Caso fuera del alcance actual",
        description:
          "El servicio no cuenta con evidencia pertinente para orientar este caso específico.",
        tone: "danger" as const,
      };
    default:
      return null;
  }
}

export function isImageObservation(finding: PossibleFinding) {
  return (
    finding.origin === "image" || /^observación radiográfica\s*:/i.test(finding.finding.trim())
  );
}

export function isSafeExternalUrl(value: string | null | undefined) {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
