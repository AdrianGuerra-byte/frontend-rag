export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);

export function getImageValidationError(file: File) {
  if (file.size === 0) {
    return "La imagen seleccionada está vacía. Elija otro archivo.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen no puede superar los 10 MB.";
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const normalizedType = file.type.toLowerCase();
  const hasAcceptedType = ACCEPTED_IMAGE_TYPES.includes(
    normalizedType as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );
  const hasNoType = normalizedType === "";

  if (!hasAcceptedType && !(hasNoType && ACCEPTED_IMAGE_EXTENSIONS.has(extension))) {
    return "Seleccione una imagen JPEG, JPG, PNG o WEBP.";
  }

  return null;
}
