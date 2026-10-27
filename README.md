# Azurian QA Automation Engineer — Playwright + Cucumber + Allure

Proyecto de automatización API/UI con TypeScript estricto, Page Objects, API clients y evidencias Allure.

## Requisitos

- Node.js compatible con las dependencias del proyecto y npm.
- Laboratorio Azurian iniciado en `http://localhost:3100` (o configurar URLs alternativas).
- Navegador Chromium de Playwright instalado.
- Credenciales válidas del laboratorio (no incluidas).

## Preparación

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

Editar `.env` con las credenciales locales `QA_USER` y `QA_PASSWORD`. **Nunca compartir ni versionar `.env`.** En Windows PowerShell, copiar con `Copy-Item .env.example .env`.

## Laboratorio Docker

El laboratorio Azurian debe estar activo en contenedores Docker antes de ejecutar las pruebas.

Verificar contenedores activos:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Contenedores esperados:
- `com-azurian-qa-evaluacion-app-1` — aplicación (puerto host `3100` → contenedor `3000`)
- `com-azurian-qa-evaluacion-db-1` — base de datos PostgreSQL

Verificar salud del laboratorio:
```bash
curl http://localhost:3100/api/health
```

Respuesta esperada: `{"status":"ok"}`

> **Advertencia — Las pruebas CRUD modifican datos del laboratorio**
>
> Los escenarios `@crear`, `@editar` y `@eliminar` envían peticiones POST, PUT y DELETE al API que crean, actualizan y eliminan documentos en la base de datos del laboratorio. Cada escenario utiliza runId y RUT únicos para aislamiento, pero los documentos persisten después de la ejecución. No ejecutar la suite contra un laboratorio de producción.

## Ejecución

```bash
npm run typecheck
npm run test:check
npm run test:api
HEADLESS=true npm run test:ui
npm test
npm run test:hybrid
npm run test:official
npm run report:generate
npm run report:open
npm run report:verify
npm run report:environment
```

En PowerShell, usar `$env:HEADLESS="true"; npm run test:ui` para ejecutar UI sin interfaz. `HEADLESS=false` mantiene el navegador visible.

**Importante:** no usar `--format progress` en la CLI, porque puede reemplazar los reporters configurados en `cucumber.cjs` e impedir que Allure reciba resultados.

### Ejecución filtrada por tag de operación

Los `.feature` declaran un tag de capa (`@api`, `@ui`) y un tag de operación. Se filtran con `--tags`, que se pasa a Cucumber a través de `npm test --`:

```bash
npm test -- --tags '@crear'
npm test -- --tags '@ui'
npm test -- --tags '@api and not @negativo'
npm test -- --tags '@leer,@filtros'
```

| Tag | Escenarios |
| --- | --- |
| `@api` / `@ui` | toda la suite de la capa correspondiente |
| `@smoke` | API-SMOKE-01 salud del laboratorio |
| `@auth` | API-AUTH-01 autenticación |
| `@crear` | API-CRUD-01, UI-CRUD-01, UI-CRUD-01-2 |
| `@leer` | API-CRUD-02, API-NEG-01, API-FILTER-01, UI-CRUD-02 |
| `@editar` | API-CRUD-03, UI-CRUD-03 |
| `@eliminar` | API-CRUD-04, UI-CRUD-04 |
| `@filtros` | API-FILTER-01 |
| `@negativo` | API-NEG-01, API-NEG-02 (6 ejemplos), API-NEG-03a, API-NEG-03b, API-NEG-04 |
| `@hibrido` | HYB-01 |

### Ejecución filtrada por nombre de escenario

`--name` recibe una expresión regular sobre el título del escenario (coincide con el ID `API-CRUD-01`, etc.):

```bash
npm test -- --name "API-CRUD-01"
npm test -- --name "^UI-CRUD-03"
npm test -- --name "API-.*-04"
npm test -- --tags '@api' --name "FILTRO"
```

Los `Scenario Outline` se filtran por el título del outline: las filas de `Examples` no alteran el nombre que ve Cucumber ni el que reporta Allure.

## Arquitectura

- `features/api` y `features/ui`: escenarios BDD.
- `src/steps`: implementación de pasos.
- `src/api/clients`: acceso a API con Playwright.
- `src/pages`: Page Object Model.
- `src/hooks`: ciclo de vida, aislamiento y capturas.
- `src/fixtures/custom-world.ts`: contexto por escenario y evidencia HTTP saneada.
- `allure-results`: resultados crudos; `allure-report`: reporte HTML generado.

## Aislamiento y seguridad

Cada escenario genera `runId` único y un **RUT de receptor propio** con dígito verificador módulo 11 y formato `NN.NNN.NNN-D` (ver `src/fixtures/chilean-rut.ts`). Todos los documentos que un escenario cree comparten ese RUT, y ningún otro escenario de la misma corrida lo reutiliza. Las llamadas API usan `x-lab-run-id` y la UI inicializa `localStorage`. Los adjuntos API enmascaran claves sensibles conocidas. No adjuntar credenciales en texto plano ni subir `.env` al repositorio. Las pruebas de creación, actualización y eliminación **modifican datos del laboratorio**.

## Alcance y limitaciones

Las pruebas validan operaciones CRUD API/UI, autenticación y salud del laboratorio. El resultado de ejecución depende de que la aplicación y los contratos estén disponibles. No se garantiza una calificación específica ni se afirma que las pruebas hayan sido ejecutadas en el entorno de entrega. Revisar `QA-COBERTURA-PENDIENTE.md`.


## Etapa 4.2 — Ejecución y evidencias

- `npm run test:hybrid`: ejecuta el escenario híbrido API + UI (requiere laboratorio Docker activo).
- `npm run report:archive`: conserva una copia fechada de `allure-results` en `allure-results-historico`.
- `npm run report:clean`: limpia únicamente resultados actuales si verifica que existe copia completa; nunca se ejecuta automáticamente.
- `npm run report:generate`: regenera HTML desde los resultados actuales.
- `API_TIMEOUT_MS`, `UI_NETWORK_TIMEOUT_MS`, `UI_SCENARIO_TIMEOUT_MS`: límites configurables para red y pasos, sin pausas fijas.
- Antes de una corrida oficial: `npm run report:archive && npm run report:clean`; si el archivado falla, no continúes con la limpieza.
- El hook global de salud consulta `/api/health` y falla de forma explícita si el laboratorio está caído.

**Validación pendiente:** los cambios de Etapa 4.2 deben ejecutarse contra el laboratorio local antes de declararlos aprobados.

## Etapa 4.3 — Evidencia oficial auditable

Para una corrida de entrega, con el laboratorio Docker activo, ejecutar `npm run test:official`. Este comando valida tipos, respalda los resultados anteriores, limpia únicamente después de verificar el respaldo, escribe metadatos no sensibles, ejecuta la suite, comprueba la integridad de Allure y genera el HTML.

`npm run report:verify` exige 23 resultados únicos aprobados, sin archivos adjuntos sin referencia ni referencias rotas; **revisa tanto `*-result.json` como `*-container.json`** porque los adjuntos de hooks Cucumber pueden estar asociados a fixtures de setup/teardown. También comprueba etiquetas de severidad y epic. Si falla, inspeccionar el diagnóstico JSON antes de alterar el reporter. No borrar resultados sin archivarlos.

Las etiquetas `@severity:...`, `@epic:...` y `@story:...` se convierten en labels Allure. Los archivos temporales de diagnóstico se excluyeron de esta entrega. Los escenarios originales y sus pasos funcionales no se modificaron.

**Validación requerida:** `npm run test:official` debe ejecutarse en Windows contra Docker. El ZIP se entrega sin resultados locales; no se declara PASS hasta recibir la salida de consola y el reporte nuevo.
