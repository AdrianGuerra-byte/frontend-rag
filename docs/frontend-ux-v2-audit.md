# Auditoría Frontend / UX V2

Fecha de auditoría: 2026-09-04
Frontend inicial: `342c8af`
Backend de referencia: `api-performance-v2-stable-2026-08-31` (`dbbefd2`)

## Mapa actual de arquitectura

- Next.js `16.3.3` con App Router: `app/page.tsx` monta el flujo,
  `app/layout.tsx` define idioma, metadata y viewport, y las rutas de error
  `app/error.tsx` y `app/not-found.tsx` mantienen mensajes seguros en español.
- `ClinicalSupportApp` mantiene únicamente el estado efímero del formulario,
  la solicitud, el resultado y el error. No persiste datos clínicos en el
  navegador.
- `ClinicalForm` y `ImageUpload` manejan captura, validación y vista previa.
  La imagen original pasa a `FormData`; la vista previa usa un object URL.
- `api.ts` centraliza `GET /health`, `POST /api/analyze`, el timeout, el
  mapeo seguro de errores y la validación runtime del resultado.
- `analysis-result.tsx` presenta un informe estructurado; no usa chat, JSON de
  depuración ni transformaciones clínicas en el navegador.
- El diseño usa Tailwind CSS v4, tokens locales en `app/globals.css`,
  componentes UI pequeños del proyecto y `lucide-react`. No se introdujo otro
  framework visual.
- No había una suite de pruebas frontend antes de esta fase. Se añadió un
  runner pequeño basado en `node:test` y compilación temporal de los módulos de
  contrato, sin agregar un framework E2E.

## Checklist interno

### CURRENT

- Flujo de una evaluación por pantalla: formulario → espera → informe o error.
- Campos multipart alineados con el endpoint público.
- Imagen opcional y controles para seleccionar, tomar fotografía, arrastrar,
  reemplazar y eliminar.
- Informe con las ocho secciones clínicas requeridas.
- Estados de calidad de imagen, abstención, signos de alarma, evidencia y
  limitaciones representados explícitamente.
- Errores de ruta y de renderizado con una salida segura, sin textos internos
  ni fallback en inglés.

### MISSING

- No existían validadores runtime estrictos, fixtures por clase de respuesta ni
  pruebas enfocadas a estados clínicos.
- Faltaban mensajes dedicados para `ANALYSIS_BUSY`, red, timeout y respuesta
  inválida.
- Faltaba una explicación explícita de que el estado de alcance no forma parte
  de la respuesta pública estable.
- Faltaba documentación frontend de timeout, privacidad y contrato real.
- Faltaba una pantalla 404 en español para completar la superficie de producto.

### INCORRECT

- El formulario conservaba borradores clínicos en `sessionStorage`.
- La validación de edad usaba `1..120`, mientras el backend acepta `0..130`.
- `imageQuality` se modelaba como opcional y la respuesta se aceptaba mediante
  una aserción de tipo, sin una frontera runtime completa.
- La pantalla de espera rotaba nombres de etapas internas que el frontend no
  conoce y podía presentarlos como progreso real.
- Un arreglo con la frase negativa de signos de alarma podía verse como una
  alerta roja por su posición en la sección.
- Una abstención con cero posibilidades se veía como un vacío genérico.
- `Referral.escalation` y campos de fuente que no pertenecen al contrato
  público estaban presentes en los tipos originales.

### KEEP

- App Router, identidad visual sobria, tokens existentes y componentes locales.
- `File` original en `FormData`, sin `FileReader`, `arrayBuffer` completo,
  canvas, compresión ni redimensionamiento en cliente.
- Vista previa mediante object URL con revocación en reemplazo, eliminación y
  desmontaje.
- Imagen opcional, formulario en español y flujo de resultado estructurado.
- El backend, sus modelos, Retrieval, síntesis, concurrencia y benchmarks no
  fueron modificados.

## Contrato público auditado

`POST /api/analyze` recibe `multipart/form-data` con:

| Campo | Estado frontend | Contrato backend |
|---|---|---|
| `age` | requerido, entero `0..130` | requerido para una evaluación completa |
| `sex` | requerido | requerido para una evaluación completa |
| `chief_complaint` | requerido | requerido, máximo 500 caracteres |
| `symptoms` | requerido | requerido, máximo 4000 caracteres |
| `signs` | opcional | opcional, máximo 4000 caracteres |
| `medical_history` | opcional | opcional, máximo 4000 caracteres |
| `image` | opcional, archivo original | opcional; JPEG/JPG/PNG/WEBP, máximo 10 MB |

La respuesta pública `AnalysisResult` incluye `analysisId`, `clinicalSummary`
(que puede ser `null`), `imageQuality`, `possibleFindings`,
`differentialDiagnoses`, `redFlags`, `missingInformation`, `referral`,
`sources` y `limitations`. Las fuentes estables exponen `title`, `source`,
`document` y `page`; los metadatos adicionales solo se muestran si llegan
realmente en una respuesta compatible.

La API estable devuelve `imageQuality.status` como `adequate`, `limited`,
`insufficient` o `not_provided`. El cliente conserva también `acceptable` para
fixtures/compatibilidad, con la misma presentación de `adequate`. Los valores
desconocidos no se convierten en una etiqueta clínica: la respuesta se rechaza
de forma segura y se muestra un error de validación del servicio.

`scopeState` aparece en rutas/debug internas del backend, pero no en el modelo
`AnalysisResult` público estable. El frontend puede renderizarlo si una
respuesta compatible lo entrega, pero nunca lo infiere a partir de diferenciales,
calidad de imagen o evidencia. Cuando no llega, el informe dice que no se
proporcionó un estado de alcance separado.

## Tabla BEFORE / AFTER

| AREA | BEFORE | AFTER |
|---|---|---|
| API contract | Tipos parcialmente desfasados: resumen ausente, imagen opcional en el tipo, `escalation` sobrante y fuente menos estricta. | Tipos y `FormData` alineados con el endpoint público; `clinicalSummary`, estados de salud y metadatos opcionales soportados sin inventar contenido. |
| Runtime validation | La respuesta se aceptaba como aserción de TypeScript; no había frontera runtime completa. | Parser estricto valida estructura, enums, arrays, campos anidados y falla con `ApiError` seguro. |
| Image upload | El comportamiento móvil seguro ya existía y había que conservarlo. | Se conserva `File`/object URL y se añaden picker, captura nativa, drag-and-drop, reemplazo, eliminación y validación de MIME/extensión coherente con backend. |
| Image quality | Etiqueta y estilo no diferenciaban suficientemente todos los estados. | `adequate/acceptable`, `limited`, `insufficient` y `not_provided` tienen copy y jerarquía neutral, success, warning o danger independientes. |
| Loading | Rotaba etapas de Vision/Retrieval/Synthesis como si fueran observables. | Espera indeterminada, estable y accesible; comunica el tiempo aproximado sin porcentajes ni streaming ficticio. |
| Busy state | No había una presentación dedicada del `429`. | `ANALYSIS_BUSY` tiene mensaje propio, reintento manual y no hace retries automáticos. |
| Network errors | El error de red era genérico. | Se comunica que la solicitud no llegó al servicio y se permite retry manual. |
| Scope | No había estado explícito ni explicación de su ausencia pública. | Estados soportados se traducen a español solo si el backend los entrega; no se infiere alcance. |
| Abstention | Cero diferenciales se mostraba como ausencia genérica. | Se explica la abstención del servicio y se priorizan información faltante, limitaciones y siguiente paso. |
| Differentials | Se presentaban posibilidades, pero sin copy de guardia suficiente. | Conserva el título “Posibilidades diagnósticas”, orden backend, razonamiento backend y aclara que no son confirmaciones ni probabilidades. |
| Red flags | La semántica dependía de que el arreglo tuviera elementos. | La frase negativa backend se normaliza a “sin signos identificados” neutral/success; flags reales reciben tratamiento de alta severidad. |
| Missing information | Lista visual podía confundirse con datos del paciente. | Se introduce una aclaración explícita de datos faltantes/discriminantes y estilo neutral. |
| Next step | La interfaz podía sonar a acción prescrita. | Se presenta como orientación del servicio, con prioridad y motivo, sin CTA autónomo ni reescritura clínica. |
| Evidence | La presentación no cubría el contrato ampliable ni navegación segura de URL. | Proveniencia secundaria fuerte; solo metadata recibida, URL HTTP(S) real en nueva pestaña y ningún enlace falso. |
| Limitations | La sección existía, pero no enfatizaba su función de transparencia en todos los casos. | Se mantiene siempre visible, muestra solo límites backend y añade un recordatorio único no diagnóstico. |
| Responsive | Había layout responsive base, sin validación específica de esta revisión. | Clases para 375/430/768/1280+ revisadas en campos, preview, botones, títulos largos, informe y print; no se añadió overflow intencional. |
| Accessibility | Había labels y foco base, pero faltaban estados async y asociaciones completas. | Headings semánticos, `aria-describedby`/`aria-invalid`, `role=status/alert`, `aria-live`, foco visible, targets táctiles y soporte de teclado en upload. |
| Tests | No había comando de pruebas frontend. | 25 pruebas de contrato con fixtures para respuestas normales, calidad, abstención, flags, fuentes, errores, archivo, reset y estados desconocidos. |

## Validación manual

Se intentó abrir el frontend local con el navegador integrado para verificar
375, 430, 768 y 1280 px. La superficie de navegador no estaba disponible en
este entorno, por lo que esa parte queda reportada como no ejecutada; el build,
los estilos responsive y los estados se revisaron estáticamente. No se debe
interpretar esa revisión como sustituto de una comprobación visual en un
navegador real.

El túnel configurado devolvió `ERR_NGROK_3200` (endpoint offline). Para cubrir
la integración HTTP sin depender del túnel, se levantó temporalmente el backend
local con `VISION_MODE=mock` y `SYNTHESIS_MODE=mock`, sin modificar sus
archivos. El servidor local estaba en `1a1ca41`; frente al tag estable
`dbbefd2`, la única diferencia de código es documental (`README.md`). El smoke
test obtuvo:

- `GET /health` → `200`, con `status: "ok"` y `analysisBusy: false`.
- `POST /api/analyze` text-only → `200`.
- `POST /api/analyze` multimodal con `tests/fixtures/demo_knee.jpg` del
  backend → `200`.
- Dos solicitudes simultáneas controladas → una `200` y una `429`
  `ANALYSIS_BUSY`.

No se repitió el benchmark ni se presentó el modo simulado como validación de
modelos. Los estados `limited`, `insufficient` y la abstención se cubren con
fixtures de contrato del frontend; no se ejecutó un caso real de Vision con
modelo disponible porque Ollama no estaba activo.
