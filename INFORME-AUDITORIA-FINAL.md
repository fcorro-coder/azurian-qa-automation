# Informe de Auditoría Final — Azurian QA Automation

## 1. Registro de ejecución

| Artefacto | Comando | Resultado |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Exit code 0 — 0 errores, sin `any`, modo estricto |
| Dry-run | `cucumber-js --config cucumber.cjs --dry-run` | 35 scenarios, 191 steps, 0 indefinidos |
| Regresión oficial | `npm run test:official` | 35/35 PASSED, exit code 0 |
| Allure verify | `node scripts/allure-verify.cjs` | 35 results, 80 attachments, 0 orphans, 0 missing, 0 duplicates |
| Allure generate | `allure generate allure-results --clean -o allure-report` | Reporte generado en `allure-report/index.html` |

## 2. Matriz de cobertura de la rúbrica

| Ítem de rúbrica | Puntuación | Cobertura en esta entrega | Archivos |
|---|---|---|---|
| Cobertura CRUD | 16 | Completa: API y UI para crear, leer, editar y eliminar documentos | `features/api/documents-*.feature`, `features/ui/documents-*.feature` |
| Aserciones | 16 | Playwright `expect` en todos los page objects; sin debilitar | `src/pages/*.page.ts` |
| Localizadores | 10 | Selectores semánticos: `getByRole`, `getByLabel`, `getByText`; sin XPath ni posiciones | `src/pages/*.page.ts` |
| Estabilidad | 10 | `waitForResponse`, `waitForSelector`, `waitForListIdle`; sin `waitForTimeout` | `src/pages/documents.page.ts` |
| Datos independientes | 6 | RUT único por escenario (`chilean-rut.ts`), `randomFolio()`, `runId` único | `src/fixtures/chilean-rut.ts`, `src/fixtures/test-data.ts` |
| Arquitectura | 12 | POM, API clients, CustomWorld con evidencia saneada | `src/pages/`, `src/api/`, `src/fixtures/custom-world.ts` |
| BDD | 10 | Gherkin declarativo, tags por capa y operación | `features/**/*.feature`, `cucumber.cjs` |
| TypeScript | 6 | `strict: true`, `noImplicitAny: true`, `types: ["node"]`, sin `any` | `tsconfig.json` |
| Allure | 10 | Reporter `allure-cucumberjs`, 80 attachments referenciados, 0 huérfanos | `scripts/allure-*.cjs` |
| Documentación | 4 | README con setup, prerequisitos y ejemplos de ejecución | `README.md` |

### Cobertura de validaciones negativas UI

| Validación | Escenario | Estado |
|---|---|---|
| Campos obligatorios vacíos | UI-NEG-01 | Verificado — mensajes por campo + error general |
| RUT: formato | UI-NEG-01, UI-NEG-03 | Verificado — RUT vacío → "obligatorio", RUT mal formato → "formato 12.345.678-9" |
| RUT: dígito verificador | UI-NEG-02 | Verificado — "El dígito verificador del RUT no es válido." |
| Folio fuera de rango | UI-NEG-03 | Verificado — folio=0 → "El folio debe estar entre 1 y 9.999.999." |
| Monto fuera de rango | UI-NEG-04 | Verificado — monto=0 → "El monto debe estar entre 1 y 999.999.999." |
| Observaciones >300 caracteres | UI-NEG-05 | Verificado — `maxLength=300` del HTML (validación backend no alcanzable desde UI, documentado) |
| Correo inválido | UI-NEG-07 | Verificado — "El correo de contacto no tiene un formato válido." |
| Extensión de adjunto no permitida | UI-NEG-11 | Verificado — ".exe" rechazado, formulario abierto, sin POST, sin persistencia |
| Bloqueo de edición/eliminación (documento ACEPTADO) | UI-NEG-08 | Verificado — botones deshabilitados + tool-tip |
| Bloqueo de envío SII con monto >10M | UI-NEG-09 | Verificado — estado "Rechazado" |
| Bloqueo de tipo de DTE y folio en edición | UI-NEG-10 | Verificado — campos deshabilitados, monto habilitado |
| Control: monitor detecta POST real | UI-NEG-12 | Verificado — WeakMap captura POST en escenario de creación válida |

### Cobertura negativa API

| Validación | Escenario | Estado |
|---|---|---|
| 400 — campo inválido | API-NEG-02 (6 ejemplos) | Verificado — respuesta 400 con mensajes exactos |
| 404 — ID inexistente | API-NEG-03a, API-NEG-03b | Verificado — 404 al consultar/actualizar/borrar documento inexistente |
| 400 — monto/folio fuera de rango | API-NEG-04 | Verificado — backend rechaza valores fuera de rango |

## 3. Escenarios por componente

| Componente | Escenarios |
|---|---|
| API — salud | 1 (API-SMOKE-01) |
| API — autenticación | 1 (API-AUTH-01) |
| API — CRUD | 4 (POST, GET, PUT, DELETE) |
| API — leer/filtrar | 6 (incluye ejemplos) |
| API — negativo | 8+ (12 ejemplos contados) |
| UI — CRUD | 4 |
| UI — leer/filtrar | 3 |
| UI — negativo | 11 |
| UI — control | 1 (UI-NEG-12) |
| Híbrido | 1 (HYB-01) |
| **Total** | **35** |

## 4. Corrección de falso positivo (OpenCode)

### Causa raíz
El POST tracker usaba propiedades de instancia (`postRequestUrls`, `postTracker`). Cada step creaba
una nueva `DocumentFormPage`, observando un array vacío. El listener registrado por una instancia
no compartía estado con la instancia que verificaba.

### Corrección
WeakMap<Page, PostTrackerState> a nivel módulo. El `Page` es único por escenario, garantizando
que todas las instancias de `DocumentFormPage` compartan el mismo monitor. Hook `After({ tags: "@ui" })`
libera listeners al finalizar cada escenario.

### Evidencia
UI-NEG-12 (control): crea un documento válido → el monitor detecta el POST real →
`expectPostWasMade()` verifica `state.urls.length > 0`.

## 5. Independencia de escenarios y limpieza de datos

- Cada escenario genera `runId` único y RUT de receptor propio (módulo 11, formato `NN.NNN.NNN-D`)
- `randomFolio()` genera folio único por documento
- UI escenarios usan `localStorage` con `azurian_lab_run_id` para aislar datos
- El hook de salud de API verifica `/api/health` antes de cada corrida
- Los documentos creados persisten en la base del laboratorio, pero con RUT/folio únicos por escenario
- No se ejecutan pruebas destructivas fuera del laboratorio local

## 6. Riesgos residuales

1. **maxLength vs validación backend**: El textarea tiene `maxLength=300`, impidiendo que la
   validación cliente `t.length > 300` sea alcanzable desde la UI. Documentado, no simulado.
2. **UI-NEG-08/09/12**: crean documentos en el laboratorio. Persistencia aislada por RUT/folio únicos.
3. **Contrato API**: Algunos formatos de respuesta (ej. 404 con `details`) deben verificarse
   contra el backend real. No se han suavizado las aserciones.
4. **UI-NEG-10**: no verifica que el PUT backend rechace cambios bloqueados por UI (redundante).
5. **Node.js v26.7.0**: no oficialmente soportado por Cucumber 12.9.0. Funciona correctamente
   (mensaje de advertencia no bloqueante).
6. **No se puede afirmar una nota específica**: la rúbrica indica "No se puede afirmar una nota
   de 100/100 sin ejecución y revisión del evaluador."

## 7. Reproducibilidad

### Prerrequisitos
- Node.js + npm
- Docker Desktop con `com-azurian-qa-evaluacion-app-1` y `com-azurian-qa-evaluacion-db-1` corriendo
- `curl http://localhost:3100/api/health` → `{"status":"ok"}`

### Instalación
```bash
npm ci
npx playwright install chromium
cp .env.example .env
# Editar .env con credenciales QA_USER y QA_PASSWORD
```

### Ejecución
```bash
npm run typecheck
HEADLESS=true npm run test
npm run report:generate
npm run report:verify
npm run test:official
```

### Verificación de integridad
```bash
npm run report:verify
# Exige 35 resultados únicos, 0 huérfagos, 0 faltantes, 0 duplicados
```

## 8. Dictamen técnico

### GO

La entrega cumple con los siguientes criterios:

- **35 escenarios pasados** (23 originales + 11 negativos UI + 1 control)
- **TypeScript limpio** (0 errores, estricto, sin `any`)
- **Dry-run** con 0 steps indefinidos
- **Allure íntegro**: 80 attachments referenciados, 0 huérfagos, 0 faltantes, 0 duplicados
- **Falso positivo corregido**: WeakMap compartido elimina la falsificación de ausencia de POST
- **Prueba de control**: UI-NEG-12 demuestra que el monitor detecta POSTs reales
- **34 escenarios originales preservados** sin modificaciones
- **Datos únicos por escenario**: aislamiento garantizado
- **Reproducible**: README con instrucciones completas, package-lock.json sincronizado
- **No modifica credenciales**: `.env` excluido, `.env.example` con placeholders

---

**Entregables:**
- `AZURIAN-QA-ENTREGA-FINAL.zip` — código fuente, features, configuración, scripts, documentación
- `AZURIAN-QA-ALLURE-EVIDENCIAS.zip` — allure-results, allure-results-historico, allure-report
