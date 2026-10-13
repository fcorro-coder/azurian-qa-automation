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

## Ejecución

```bash
npm run typecheck
npm run test:api
HEADLESS=true npm run test:ui
npm test
npm run report:generate
npm run report:open
```

En PowerShell, usar `$env:HEADLESS="true"; npm run test:ui` para ejecutar UI sin interfaz. `HEADLESS=false` mantiene el navegador visible.

**Importante:** no usar `--format progress` en la CLI, porque puede reemplazar los reporters configurados en `cucumber.cjs` e impedir que Allure reciba resultados.

## Arquitectura

- `features/api` y `features/ui`: escenarios BDD.
- `src/steps`: implementación de pasos.
- `src/api/clients`: acceso a API con Playwright.
- `src/pages`: Page Object Model.
- `src/hooks`: ciclo de vida, aislamiento y capturas.
- `src/fixtures/custom-world.ts`: contexto por escenario y evidencia HTTP saneada.
- `allure-results`: resultados crudos; `allure-report`: reporte HTML generado.

## Aislamiento y seguridad

Cada escenario genera `runId` único. Las llamadas API usan `x-lab-run-id` y la UI inicializa `localStorage`. Los adjuntos API enmascaran claves sensibles conocidas. No adjuntar credenciales en texto plano ni subir `.env` al repositorio. Las pruebas de creación, actualización y eliminación **modifican datos del laboratorio**.

## Alcance y limitaciones

Las pruebas validan operaciones CRUD API/UI, autenticación y salud del laboratorio. El resultado de ejecución depende de que la aplicación y los contratos estén disponibles. No se garantiza una calificación específica ni se afirma que las pruebas hayan sido ejecutadas en el entorno de entrega. Revisar `QA-COBERTURA-PENDIENTE.md`.
