"use client";

import type { FormEvent, ReactNode } from "react";
import { AlertCircle, ArrowRight, Info } from "lucide-react";

import { ImageUpload } from "@/src/components/image-upload";
import { ProductMark } from "@/src/components/product-mark";
import { SystemStatus } from "@/src/components/system-status";
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
    <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-5 text-danger" id={id} role="alert">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
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

function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="mt-1.5 text-xs leading-5 text-muted" id={id}>
      {children}
    </p>
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
      <header className="mb-8 max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProductMark className="size-12" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                RADIA
              </p>
              <p className="mt-1 text-xs font-medium text-muted">Captura clínica · caso sin guardar</p>
            </div>
          </div>
          <SystemStatus />
        </div>
        <h1
          className="mt-7 text-[clamp(1.8rem,4vw,2.25rem)] font-semibold tracking-[-0.03em] text-ink"
          id="new-analysis-title"
        >
          Nueva evaluación clínica
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          Registre la información disponible del paciente y, si cuenta con ella, adjunte un estudio radiográfico para complementar el apoyo estructurado.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-control)] border border-primary/15 bg-primary-soft/50 px-4 py-3 text-sm leading-6 text-ink">
          <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
          <p>
            Este es un prototipo académico de apoyo a la decisión clínica. No sustituye el juicio profesional ni la valoración clínica.
          </p>
        </div>
      </header>

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

      <form autoComplete="off" className="relative" noValidate onSubmit={onSubmit}>
        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Complete los datos requeridos para contextualizar el caso del paciente."
            index="01"
            title="Paciente"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="age">
                Edad<RequiredMark />
              </Label>
              <Input
                aria-describedby={`age-help${errors.age ? " age-error" : ""}`}
                aria-invalid={Boolean(errors.age)}
                autoComplete="off"
                className="mt-2"
                id="age"
                inputMode="numeric"
                max={130}
                min={0}
                name="age"
                placeholder="Ej. 32"
                required
                step={1}
                type="number"
                value={values.age}
                onChange={(event) => onValueChange("age", event.target.value)}
              />
              <FieldHint id="age-help">Edad en años cumplidos; el servicio acepta de 0 a 130 años.</FieldHint>
              <FieldError id="age-error" message={errors.age} />
            </div>

            <div>
              <Label htmlFor="sex">
                Sexo registrado<RequiredMark />
              </Label>
              <Select
                aria-describedby={`sex-help${errors.sex ? " sex-error" : ""}`}
                aria-invalid={Boolean(errors.sex)}
                autoComplete="off"
                className="mt-2"
                id="sex"
                name="sex"
                required
                value={values.sex}
                onChange={(event) => onValueChange("sex", event.target.value)}
              >
                <option disabled value="">
                  Seleccione una opción
                </option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro
                </option>
                <option value="unspecified">No especificado</option>
              </Select>
              <FieldHint id="sex-help">Use la opción registrada o indique que no está especificada.</FieldHint>
              <FieldError id="sex-error" message={errors.sex} />
            </div>
          </div>
        </div>

        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Describa el motivo principal por el que se solicita la valoración."
            index="02"
            title="Motivo de consulta"
          />

          <div>
            <Label htmlFor="chiefComplaint">
              Motivo de consulta<RequiredMark />
            </Label>
            <Textarea
              aria-describedby={`chiefComplaint-help${errors.chiefComplaint ? " chiefComplaint-error" : ""}`}
              aria-invalid={Boolean(errors.chiefComplaint)}
              className="mt-2 min-h-24"
              id="chiefComplaint"
              maxLength={500}
              name="chief_complaint"
              placeholder="Ej. Dolor de muñeca posterior a una caída."
              required
              value={values.chiefComplaint}
              onChange={(event) => onValueChange("chiefComplaint", event.target.value)}
            />
            <FieldHint id="chiefComplaint-help">Hasta 500 caracteres. Describa el motivo sin agregar datos que no conozca.</FieldHint>
            <FieldError id="chiefComplaint-error" message={errors.chiefComplaint} />
          </div>
        </div>

        <div className="grid gap-5 border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Registre únicamente los síntomas, signos y antecedentes disponibles."
            index="03"
            title="Información clínica"
          />

          <div className="grid gap-5">
            <div>
              <Label htmlFor="symptoms">
                Síntomas disponibles<RequiredMark />
              </Label>
              <Textarea
                aria-describedby={`symptoms-help${errors.symptoms ? " symptoms-error" : ""}`}
                aria-invalid={Boolean(errors.symptoms)}
                className="mt-2 min-h-28"
                id="symptoms"
                maxLength={4000}
                name="symptoms"
                placeholder="Ej. Dolor, inflamación y limitación del movimiento."
                required
                value={values.symptoms}
                onChange={(event) => onValueChange("symptoms", event.target.value)}
              />
              <FieldHint id="symptoms-help">Describa lo que el paciente refiere; no complete información faltante.</FieldHint>
              <FieldError id="symptoms-error" message={errors.symptoms} />
            </div>

            <div>
              <Label htmlFor="signs">Signos clínicos</Label>
              <Textarea
                aria-describedby={`signs-help${errors.signs ? " signs-error" : ""}`}
                aria-invalid={Boolean(errors.signs)}
                className="mt-2 min-h-24"
                id="signs"
                maxLength={4000}
                name="signs"
                placeholder="Ej. Sensibilidad localizada, edema visible..."
                value={values.signs}
                onChange={(event) => onValueChange("signs", event.target.value)}
              />
              <FieldHint id="signs-help">Opcional. Incluya hallazgos de la exploración disponibles.</FieldHint>
              <FieldError id="signs-error" message={errors.signs} />
            </div>

            <div>
              <Label htmlFor="medicalHistory">Antecedentes relevantes</Label>
              <Textarea
                aria-describedby={`medicalHistory-help${errors.medicalHistory ? " medicalHistory-error" : ""}`}
                aria-invalid={Boolean(errors.medicalHistory)}
                className="mt-2 min-h-24"
                id="medicalHistory"
                maxLength={4000}
                name="medical_history"
                placeholder="Antecedentes, medicamentos, lesiones previas u otra información relevante."
                value={values.medicalHistory}
                onChange={(event) => onValueChange("medicalHistory", event.target.value)}
              />
              <FieldHint id="medicalHistory-help">Opcional. Registre solo los antecedentes pertinentes al caso.</FieldHint>
              <FieldError id="medicalHistory-error" message={errors.medicalHistory} />
            </div>
          </div>
        </div>

        <div className="border-t border-line py-6 sm:py-7">
          <FormSectionHeading
            description="Puede adjuntar una imagen existente o tomar una fotografía desde el dispositivo."
            index="04"
            title="Estudio radiográfico (opcional)"
          />
          <ImageUpload
            error={errors.image}
            file={values.image}
            onFileSelect={onImageSelect}
            onRemove={onImageRemove}
          />
          <p className="mt-3 text-xs leading-5 text-muted">
            Para una captura más útil: fotografíe el estudio completo, evite reflejos, mantenga la cámara aproximadamente perpendicular, asegure el enfoque e incluya todas las proyecciones relevantes. Estas medidas no garantizan una calidad suficiente.
          </p>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-line bg-surface/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-5 sm:backdrop-blur-none">
          <p className="text-xs leading-5 text-muted">
            <RequiredMark /> Campos requeridos
          </p>
          <Button
            className="w-full sm:min-w-48 sm:flex-none"
            disabled={isSubmitDisabled}
            type="submit"
          >
            Solicitar evaluación
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </form>
    </section>
  );
}
