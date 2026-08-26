# Clinical Support

Frontend Next.js del prototipo académico de apoyo a la decisión clínica. Permite registrar un caso, adjuntar una radiografía y mostrar el resultado estructurado que devuelve el backend FastAPI. No realiza diagnósticos ni sustituye el criterio de un profesional de la salud.

## Requisitos

- Node.js 20 o superior
- pnpm 11
- Backend FastAPI disponible por HTTP/HTTPS

## Instalación y desarrollo local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). El archivo `.env.local` debe apuntar al backend:

```env
NEXT_PUBLIC_API_URL=https://hoyt-uncautious-jonnie.ngrok-free.dev
```

El frontend no incluye un proxy ni una ruta API propia. La URL pública anterior también queda como respaldo en `src/lib/api.ts`; `NEXT_PUBLIC_API_URL` puede sobrescribirla. El backend debe permitir el origen del frontend mediante CORS.

## API utilizada

El módulo `src/lib/api.ts` centraliza las llamadas a:

- `GET /health`
- `POST /api/analyze` con `multipart/form-data` y los campos `age`, `sex`, `chief_complaint`, `symptoms`, `signs`, `medical_history` e `image`
- `GET /api/analyses`
- `GET /api/analyses/{id}`

El resultado se valida contra el contrato real del backend: `analysisId`, `imageQuality`, `possibleFindings`, `differentialDiagnoses`, `redFlags`, `missingInformation`, `referral`, `sources` y `limitations`.

El análisis tarda hasta 120 segundos antes de mostrar un error de timeout. La ausencia de Ollama no bloquea el formulario: el indicador informa el estado y deja que FastAPI aplique su modo de respaldo.

## Verificación

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

`pnpm build` usa el compilador Webpack integrado de Next.js para mantener un build reproducible en el entorno actual. No se requiere un servidor Node personalizado.

## Despliegue en Vercel

1. Importe este proyecto en Vercel.
2. Mantenga el framework como Next.js y el comando de build estándar (`pnpm build`).
3. Configure `NEXT_PUBLIC_API_URL` con la URL HTTPS pública de FastAPI. Si se omite, se usará `https://hoyt-uncautious-jonnie.ngrok-free.dev`.
4. En FastAPI, agregue el dominio de Vercel a `CORS_ORIGINS`.
5. Despliegue y pruebe el flujo desde un teléfono y un escritorio.

No exponga Ollama directamente. Si aparece un error CORS, el origen que falta debe agregarse en la configuración CORS del backend; el navegador no se puede corregir de forma segura desde este frontend.

## Alcance actual

- El flujo principal está conectado al backend real; no queda un mock local en el flujo normal.
- No se implementaron autenticación, persistencia frontend, exportación PDF ni dashboard.
- Se omitió “Análisis recientes” porque `GET /api/analyses` actualmente devuelve solamente una lista de resultados `ClinicalAnalysis`, sin fecha, motivo de consulta ni estado. Agregar esa sección requeriría ampliar el contrato del backend.
- El backend inspeccionado devuelve algunos mensajes y contenido generado en inglés; las etiquetas y la navegación del frontend están en español y no se traducen automáticamente los textos clínicos devueltos para evitar alterar su significado.
