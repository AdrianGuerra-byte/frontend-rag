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
        "rounded-[var(--radius-control)] border border-dashed bg-surface-subtle p-4 sm:p-5",
        error ? "border-danger/45 bg-danger-soft" : "border-line-strong",
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-control)] border border-line bg-ink sm:size-32 sm:shrink-0">
            <Image
              alt={`Vista previa de ${file.name}`}
              className="size-full object-contain"
              fill
              priority
              src={previewUrl}
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <FileImage
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatFileSize(file.size)} · Imagen lista para enviar
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden="true" className="size-4" />
                Cambiar imagen
              </Button>
              <Button
                aria-label="Eliminar radiografía seleccionada"
                size="icon"
                variant="ghost"
                onClick={onRemove}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary-soft text-primary">
              <ImagePlus aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Radiografía</p>
              <p className="mt-1 max-w-md text-sm leading-5 text-muted">
                Suba una imagen existente o tome una fotografía.
              </p>
              <p className="mt-2 text-xs text-muted">JPEG, JPG, PNG o WEBP · máximo 10 MB</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4" />
              Seleccionar imagen
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera aria-hidden="true" className="size-4" />
              Tomar fotografía
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
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
