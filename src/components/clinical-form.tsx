"use client";

import type { FormEvent, ReactNode } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

import { ImageUpload } from "@/src/components/image-upload";
import { ProductMark } from "@/src/components/product-mark";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import type {
  ClinicalFormErrors,
  ClinicalFormField,
  ClinicalFormValues,
} from "@/src/types/analysis";

interface ClinicalFormProps {
  values: ClinicalFormValues;
  errors: ClinicalFormErrors;
  formMessage?: string | null;
  isSubmitDisabled: boolean;
  onImageRemove: () => void;
  onImageSelect: (file: File | null, error: string | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onValueChange: (field: Exclude<ClinicalFormField, "image">, value: string) => void;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger" id={id} role="alert">
      <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
      {message}
    </p>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 text-danger">
      *
    </span>
  );
}

function FormSectionHeading({
  index,
  title,
  description,
}: {
  index: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex shrink-0 items-center gap-1 pt-0.5 font-mono text-[11px] font-medium tracking-[0.12em] text-primary">
        {index}
        <span aria-hidden="true" className="text-muted/60">
          /
        </span>
      </div>
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

export function ClinicalForm({
  values,
  errors,
  formMessage,
  isSubmitDisabled,
  onImageRemove,
  onImageSelect,
  onSubmit,
  onValueChange,
}: ClinicalFormProps) {
  return (
    <section aria-labelledby="new-analysis-title" className="mx-auto w-full max-w-[640px]">
      <div className="mb-8 max-w-xl">
        <div className="flex items-center gap-3">
          <ProductMark className="size-10" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Apoyo clínico
            </p>
            <p className="mt-1 text-xs font-medium text-muted">Captura clínica · caso sin guardar</p>
          </div>
        </div>
        <h1
          className="mt-7 text-[clamp(1.8rem,4vw,2.25rem)] font-semibold tracking-[-0.03em] text-ink"
          id="new-analysis-title"
        >
          Nuevo análisis clínico
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          Registre la información clínica disponible y adjunte la radiografía para obtener una segunda opinión asistida.
        </p>
      </div>

      {formMessage ? (
        <div
          aria-live="polite"
          className="mb-5 flex items-start gap-3 rounded-[var(--radius-control)] border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{formMessage}</span>
        </div>
      ) : null}

      <form className="relative" noValidate onSubmit={onSubmit}>
        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Complete los campos requeridos para contextualizar la imagen."
            index="01"
            title="Paciente"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="age">
                Edad<RequiredMark />
              </Label>
              <Input
                aria-describedby={errors.age ? "age-error" : undefined}
                aria-invalid={Boolean(errors.age)}
                className="mt-2"
                id="age"
                inputMode="numeric"
                max={120}
                min={1}
                placeholder="Ej. 32"
                required
                type="number"
                value={values.age}
                onChange={(event) => onValueChange("age", event.target.value)}
              />
              <FieldError id="age-error" message={errors.age} />
            </div>

            <div>
              <Label htmlFor="sex">
                Sexo<RequiredMark />
              </Label>
              <Select
                aria-describedby={errors.sex ? "sex-error" : undefined}
                aria-invalid={Boolean(errors.sex)}
                className="mt-2"
                id="sex"
                required
                value={values.sex}
                onChange={(event) => onValueChange("sex", event.target.value)}
              >
                <option disabled value="">
                  Seleccione una opción
                </option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro / No especificado</option>
              </Select>
              <FieldError id="sex-error" message={errors.sex} />
            </div>
          </div>
        </div>

        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Describa el motivo principal de la valoración."
            index="02"
            title="Motivo de consulta"
          />

          <div>
            <Label htmlFor="chiefComplaint">
              Motivo de consulta<RequiredMark />
            </Label>
            <Textarea
              aria-describedby={errors.chiefComplaint ? "chiefComplaint-error" : undefined}
              aria-invalid={Boolean(errors.chiefComplaint)}
              className="mt-2 min-h-24"
              id="chiefComplaint"
              maxLength={500}
              placeholder="Dolor intenso en muñeca posterior a una caída."
              required
              value={values.chiefComplaint}
              onChange={(event) => onValueChange("chiefComplaint", event.target.value)}
            />
            <FieldError id="chiefComplaint-error" message={errors.chiefComplaint} />
          </div>
        </div>

        <div className="grid gap-5 border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Registre los datos disponibles de la valoración actual."
            index="03"
            title="Información clínica"
          />

          <div className="grid gap-5">
            <div>
              <Label htmlFor="symptoms">
                Síntomas<RequiredMark />
              </Label>
              <Textarea
                aria-describedby={errors.symptoms ? "symptoms-error" : undefined}
                aria-invalid={Boolean(errors.symptoms)}
                className="mt-2 min-h-28"
                id="symptoms"
                maxLength={4000}
                placeholder="Dolor, inflamación y limitación del movimiento."
                required
                value={values.symptoms}
                onChange={(event) => onValueChange("symptoms", event.target.value)}
              />
              <FieldError id="symptoms-error" message={errors.symptoms} />
            </div>

            <div>
              <Label htmlFor="signs">Signos clínicos</Label>
              <Textarea
                aria-describedby={errors.signs ? "signs-error" : undefined}
                aria-invalid={Boolean(errors.signs)}
                className="mt-2 min-h-24"
                id="signs"
                maxLength={4000}
                placeholder="Sensibilidad localizada, edema visible..."
                value={values.signs}
                onChange={(event) => onValueChange("signs", event.target.value)}
              />
              <FieldError id="signs-error" message={errors.signs} />
            </div>

            <div>
              <Label htmlFor="medicalHistory">Antecedentes relevantes</Label>
              <Textarea
                aria-describedby={errors.medicalHistory ? "medicalHistory-error" : undefined}
                aria-invalid={Boolean(errors.medicalHistory)}
                className="mt-2 min-h-24"
                id="medicalHistory"
                maxLength={4000}
                placeholder="Antecedentes, medicamentos, lesiones previas u otra información relevante."
                value={values.medicalHistory}
                onChange={(event) => onValueChange("medicalHistory", event.target.value)}
              />
              <FieldError id="medicalHistory-error" message={errors.medicalHistory} />
            </div>
          </div>
        </div>

        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Suba una imagen existente o tome una fotografía desde el dispositivo."
            index="04"
            title={<>Estudio radiográfico<RequiredMark /></>}
          />
          <ImageUpload
            error={errors.image}
            file={values.image}
            onFileSelect={onImageSelect}
            onRemove={onImageRemove}
          />
          {!errors.image ? (
            <p className="mt-2 text-xs text-muted">Campo requerido para este flujo radiográfico.</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-line bg-surface/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-5 sm:backdrop-blur-none">
          <p className="text-xs leading-5 text-muted sm:order-first">
            <RequiredMark /> Campos requeridos
          </p>
          <Button className="w-full sm:order-last sm:w-auto sm:min-w-48" disabled={isSubmitDisabled} type="submit">
            Analizar caso
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </form>
    </section>
  );
}
