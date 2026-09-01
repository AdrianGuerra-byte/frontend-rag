# Clinical Support

Frontend Next.js del prototipo académico de apoyo a la decisión clínica. Permite registrar un caso, adjuntar opcionalmente una radiografía y mostrar el informe estructurado que devuelve el backend FastAPI. No realiza diagnósticos ni sustituye el criterio de un profesional de la salud.

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
NEXT_PUBLIC_API_URL=https://su-tunel-https-del-backend.example
```

El frontend no incluye un proxy ni una ruta API propia. `NEXT_PUBLIC_API_URL` es la única configuración del servicio y queda incorporada en el build; debe definirse antes de compilar. Si falta en desarrollo, la interfaz lo muestra como configuración pendiente. El backend debe permitir el origen del frontend mediante CORS.

## API utilizada

El módulo `src/lib/api.ts` centraliza las llamadas a:

- `GET /health`
- `POST /api/analyze` con `multipart/form-data` y los campos `age`, `sex`, `chief_complaint`, `symptoms`, `signs`, `medical_history` e `image`

El backend también publica `POST /api/analyze/text`, `GET /api/analyses` y
`GET /api/analyses/{id}`. No forman parte del flujo visible actual; el cliente
solo conserva las lecturas de análisis existentes por compatibilidad.

El resultado se valida contra el contrato real del backend: `analysisId`, `imageQuality`, `possibleFindings`, `differentialDiagnoses`, `redFlags`, `missingInformation`, `referral`, `sources` y `limitations`.

El análisis tiene un timeout de frontend de 120 segundos. Es superior al p90
multimodal medido (~51.42 s) y evita dejar solicitudes abiertas
indefinidamente. La pantalla de procesamiento permanece estable durante toda
la solicitud; no simula etapas internas ni porcentajes.

## Verificación

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

`pnpm build` usa el compilador Webpack integrado de Next.js para mantener un build reproducible en el entorno actual. No se requiere un servidor Node personalizado.

`pnpm test` ejecuta pruebas de contrato con el runner nativo de Node y fixtures
de respuestas reales/clases de error. No persiste el contenido clínico en
`localStorage`, `sessionStorage` ni parámetros de URL.

## Despliegue

El proyecto puede desplegarse en cualquier entorno compatible con una aplicación Next.js administrada por Node.js:

1. Configure `NEXT_PUBLIC_API_URL` con la URL HTTPS pública vigente de FastAPI antes del build.
2. Ejecute `pnpm build`.
3. Inicie el servidor con `pnpm start`.
4. En FastAPI, agregue el origen público del frontend a `CORS_ORIGINS`.
5. Pruebe el flujo desde un teléfono y un escritorio.

No exponga Ollama directamente. Si aparece un error CORS, el origen que falta debe agregarse en la configuración CORS del backend; el navegador no se puede corregir de forma segura desde este frontend.

## Alcance actual

- El flujo principal está conectado al backend real; no queda un mock local en el flujo normal.
- No se implementaron autenticación, persistencia frontend, exportación PDF ni dashboard.
- Se omitió “Análisis recientes” porque `GET /api/analyses` actualmente devuelve solamente una lista de resultados `ClinicalAnalysis`, sin fecha, motivo de consulta ni estado. Agregar esa sección requeriría ampliar el contrato del backend.
- `scopeState` está disponible en respuestas debug del backend, pero no forma parte del `AnalysisResult` público estable. El frontend no lo infiere; si no llega, comunica esa ausencia.
- El backend es la autoridad de contenido clínico, orden de diferenciales, evidencia y limitaciones. El navegador no genera diagnósticos, probabilidades, citas ni filtros de fuentes.

La auditoría completa BEFORE/AFTER está en
[`docs/frontend-ux-v2-audit.md`](docs/frontend-ux-v2-audit.md).
