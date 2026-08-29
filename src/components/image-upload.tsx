"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
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
const DROP_ERROR_MESSAGE = "Suelte una imagen JPEG, JPG, PNG o WEBP.";

interface ImageUploadProps {
  file: File | null;
  error?: string;
  onFileSelect: (file: File | null, error: string | null) => void;
  onRemove: () => void;
}

export function getImageValidationError(file: File) {
  if (file.size === 0) {
    return "La imagen seleccionada está vacía. Elija otro archivo.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen no puede superar los 10 MB.";
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const hasAcceptedType = ACCEPTED_IMAGE_TYPES.includes(
    file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );

  if (!hasAcceptedType && !ACCEPTED_IMAGE_EXTENSIONS.has(extension)) {
    return "Seleccione una imagen JPEG, JPG, PNG o WEBP.";
  }

  return null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getImageFormat(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") {
    return "JPEG";
  }

  if (type === "image/png") {
    return "PNG";
  }

  if (type === "image/webp") {
    return "WEBP";
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (extension === ".jpeg" || extension === ".jpg") {
    return "JPEG";
  }

  if (extension === ".png") {
    return "PNG";
  }

  if (extension === ".webp") {
    return "WEBP";
  }

  return "Imagen";
}

interface ImageDimensions {
  width: number;
  height: number;
}

function getImageMetadata(file: File, dimensions: ImageDimensions | null) {
  return [
    dimensions ? `${dimensions.width} × ${dimensions.height} px` : null,
    formatFileSize(file.size),
    getImageFormat(file),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

function revokePreviewUrl(previewUrlRef: { current: string | null }) {
  const currentUrl = previewUrlRef.current;

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    previewUrlRef.current = null;
  }
}

interface PreviewState {
  file: File;
  url: string;
}

function FileMetadata({
  file,
  dimensions,
}: {
  file: File;
  dimensions: ImageDimensions | null;
}) {
  return (
    <>
      <p className="mt-3 truncate text-sm font-semibold text-ink">
        {file.name || "Imagen pegada"}
      </p>
      <p className="mt-1 text-xs text-muted">{getImageMetadata(file, dimensions)}</p>
    </>
  );
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
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (!file) {
      revokePreviewUrl(previewUrlRef);
    }
  }, [file]);

  useEffect(() => () => revokePreviewUrl(previewUrlRef), []);

  function clearPreview() {
    revokePreviewUrl(previewUrlRef);
    setPreview(null);
    setDimensions(null);
    setPreviewUnavailable(false);
  }

  function handlePreviewError() {
    clearPreview();
    setPreviewUnavailable(true);
  }

  function handleSelectedFile(selectedFile: File | undefined) {
    if (!selectedFile) {
      return;
    }

    const validationError = getImageValidationError(selectedFile);
    if (validationError) {
      clearPreview();
      onFileSelect(null, validationError);
      return;
    }

    clearPreview();

    let nextPreviewUrl: string;

    try {
      nextPreviewUrl = URL.createObjectURL(selectedFile);
    } catch {
      setPreview(null);
      setDimensions(null);
      setPreviewUnavailable(true);
      onFileSelect(selectedFile, null);
      return;
    }

    previewUrlRef.current = nextPreviewUrl;
    setPreview({ file: selectedFile, url: nextPreviewUrl });
    setPreviewUnavailable(false);
    onFileSelect(selectedFile, null);
  }

  function handleInputChange(input: HTMLInputElement) {
    const selectedFile = input.files?.[0];
    input.value = "";
    handleSelectedFile(selectedFile);
  }

  function handleRemove() {
    clearPreview();
    onRemove();
  }

  function hasDraggedFiles(event: DragEvent<HTMLDivElement>) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      clearPreview();
      onFileSelect(null, DROP_ERROR_MESSAGE);
      return;
    }

    handleSelectedFile(droppedFile);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("input, textarea, [contenteditable='true']")) {
      return;
    }

    const clipboardItem = Array.from(event.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    const pastedFile = clipboardItem?.getAsFile() ?? event.clipboardData.files?.[0];

    if (!pastedFile) {
      return;
    }

    event.preventDefault();
    handleSelectedFile(pastedFile);
  }

  function handleUploadZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border p-2 transition-colors duration-150 sm:p-3",
        error
          ? "border-danger/45 bg-danger-soft"
          : isDragging
            ? "border-primary bg-primary-soft/40 ring-2 ring-primary/10"
            : "border-line",
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        ref={fileInputRef}
        accept=".jpeg,.jpg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
        aria-label="Seleccionar archivo de radiografía"
        className="sr-only"
        type="file"
        onChange={(event) => handleInputChange(event.currentTarget)}
      />
      <input
        ref={cameraInputRef}
        accept=".jpeg,.jpg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
        aria-label="Tomar una fotografía de la radiografía"
        capture="environment"
        className="sr-only"
        type="file"
        onChange={(event) => handleInputChange(event.currentTarget)}
      />

      {file && preview && preview.file === file ? (
        <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-control)] border border-line bg-ink sm:size-36 sm:shrink-0">
            <ScanCorners />
            <Image
              alt={`Vista previa de ${file.name}`}
              className="size-full object-contain"
              fill
              onError={handlePreviewError}
              onLoad={(event) => {
                const { naturalHeight, naturalWidth } = event.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setDimensions({ height: naturalHeight, width: naturalWidth });
                }
              }}
              src={preview.url}
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileImage aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <p aria-live="polite" className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Estudio adjunto
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-success">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                Listo
              </span>
            </div>
            <FileMetadata dimensions={dimensions} file={file} />
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
                onClick={handleRemove}
              >
                <X aria-hidden="true" className="size-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      ) : file ? (
        <div className="flex items-start gap-4 px-2 py-4 sm:px-3 sm:py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
            <FileImage aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Estudio radiográfico seleccionado</p>
            <FileMetadata dimensions={dimensions} file={file} />
            <p aria-live="polite" className="mt-2 text-xs leading-5 text-muted">
              {previewUnavailable
                ? "La vista previa no está disponible. Puede continuar con el archivo original."
                : "El archivo original está listo para enviar."}
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
                onClick={handleRemove}
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
          <div
            aria-label="Adjuntar radiografía"
            className="relative flex w-full cursor-pointer flex-col items-center rounded-[var(--radius-control)] px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={handleUploadZoneKeyDown}
          >
            <div className="relative flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
              <ImagePlus aria-hidden="true" className="size-5" />
            </div>
            <p className="relative mt-4 text-sm font-semibold text-ink">Adjuntar radiografía</p>
            <p className="relative mt-1 text-sm leading-5 text-muted">
              JPEG, JPG, PNG o WEBP · máximo 10 MB
            </p>
            <p className="relative mt-1 text-xs text-muted">
              También puede tomar una fotografía desde este dispositivo.
            </p>
          </div>
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
        <p aria-live="assertive" className="mt-2 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
