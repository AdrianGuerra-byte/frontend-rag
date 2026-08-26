"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { Camera, FileImage, ImagePlus, Upload, X } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const ACCEPTED_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface ImageUploadProps {
  file: File | null;
  error?: string;
  onFileSelect: (file: File | null, error: string | null) => void;
  onRemove: () => void;
}

export function getImageValidationError(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const hasAcceptedType = ACCEPTED_IMAGE_TYPES.includes(
    file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );

  if (!hasAcceptedType && !ACCEPTED_IMAGE_EXTENSIONS.has(extension)) {
    return "Seleccione una imagen JPEG, JPG, PNG o WEBP.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen no puede superar los 10 MB.";
  }

  if (file.size === 0) {
    return "La imagen seleccionada está vacía. Elija otro archivo.";
  }

  return null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ScanCorners() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-3 z-10 text-primary/60">
      <span className="absolute left-0 top-0 size-4 border-l border-t border-current" />
      <span className="absolute right-0 top-0 size-4 border-r border-t border-current" />
      <span className="absolute bottom-0 left-0 size-4 border-b border-l border-current" />
      <span className="absolute bottom-0 right-0 size-4 border-b border-r border-current" />
    </div>
  );
}

export function ImageUpload({
  file,
  error,
  onFileSelect,
  onRemove,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleInputChange(input: HTMLInputElement) {
    const selectedFile = input.files?.[0];
    input.value = "";

    if (!selectedFile) {
      return;
    }

    const validationError = getImageValidationError(selectedFile);
    if (validationError) {
      onFileSelect(null, validationError);
      return;
    }

    onFileSelect(selectedFile, null);
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border p-2 sm:p-3",
        error ? "border-danger/45 bg-danger-soft" : "border-line",
      )}
    >
      <input
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        aria-label="Seleccionar archivo de radiografía"
        className="sr-only"
        type="file"
        onChange={(event) => handleInputChange(event.currentTarget)}
      />
      <input
        ref={cameraInputRef}
        accept="image/jpeg,image/png,image/webp"
        aria-label="Tomar una fotografía de la radiografía"
        capture="environment"
        className="sr-only"
        type="file"
        onChange={(event) => handleInputChange(event.currentTarget)}
      />

      {file && previewUrl ? (
        <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-control)] border border-line bg-ink sm:size-36 sm:shrink-0">
            <ScanCorners />
            <Image
              alt={`Vista previa de ${file.name}`}
              className="size-full object-contain"
              fill
              priority
              src={previewUrl}
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileImage aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Estudio adjunto
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-success">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                Listo
              </span>
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="mt-1 text-xs text-muted">
              {formatFileSize(file.size)} · Imagen lista para enviar
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden="true" className="size-4" />
                Reemplazar
              </Button>
              <Button
                aria-label="Eliminar radiografía seleccionada"
                variant="ghost"
                onClick={onRemove}
              >
                <X aria-hidden="true" className="size-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-52 flex-col items-center justify-center rounded-[var(--radius-control)] border border-dashed border-line-strong bg-surface-subtle px-4 py-8 text-center">
          <ScanCorners />
          <div className="relative flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
            <ImagePlus aria-hidden="true" className="size-5" />
          </div>
          <p className="relative mt-4 text-sm font-semibold text-ink">Adjuntar radiografía</p>
          <p className="relative mt-1 text-sm leading-5 text-muted">
            JPG, PNG o WEBP · máximo 10 MB
          </p>
          <p className="relative mt-1 text-xs text-muted">
            También puede tomar una fotografía desde este dispositivo.
          </p>
          <div className="relative mt-5 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:flex-1"
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4" />
              Seleccionar imagen
            </Button>
            <Button
              className="w-full sm:flex-1"
              variant="secondary"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera aria-hidden="true" className="size-4" />
              Tomar fotografía
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 border-t border-line px-1 pt-3 text-xs leading-5 text-muted">
        La calidad de la imagen puede afectar el análisis del prototipo.
      </p>
      {error ? (
        <p className="mt-2 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
