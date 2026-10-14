# Fase: refuerzo de aserciones UI y sincronización

Conserva los 13 escenarios Gherkin intactos (5 UI + 8 API). Solo cambiaron Page Objects
y step definitions de UI.

## Archivos modificados

- `src/pages/documents.page.ts` — localizadores centralizados y esperas reutilizables.
- `src/pages/document-form.page.ts` — diálogo acotado, espera del `POST` al guardar.
- `src/pages/document-edit.page.ts` — espera de carga del documento y del `PUT`.
- `src/pages/document-delete.page.ts` — espera del `DELETE` y texto exacto de confirmación.
- `src/pages/login.page.ts` — el login termina cuando el listado quedó ocioso.
- `src/steps/ui/documents-create.steps.ts`
- `src/steps/ui/documents-read.steps.ts`
- `src/steps/ui/documents-update.steps.ts`
- `src/steps/ui/documents-delete.steps.ts`
- `.gitignore` — excluye los directorios de resultados acumulados.

No se modificaron `features/**`, los pasos API, los contratos API ni `com-azurian-qa-evaluacion`.

## Aserciones incorporadas

- Aviso de éxito real de la aplicación (`role="status"`) tras crear, actualizar y eliminar:
  `Documento folio <n> emitido/actualizado/eliminado correctamente.`
- Ausencia de mensajes de error de la aplicación en `<main>` (`role="alert"`) tras cada operación.
- Persistencia tras `reload` en creación, actualización y eliminación, verificando fila por
  folio exacto y RUT exacto, con tipo, monto formateado y estado.
- Total de resultados del filtro (`1 documento encontrado`, `2 documentos encontrados`,
  `0 documentos encontrados`).
- Estado de tabla vacía tras eliminar: `No se encontraron documentos DTE para los criterios
  seleccionados.` y ausencia total de filas con folio.
- Confirmación de eliminación con `folio #<n> del RUT <rut>` y la advertencia de no reversible.
- Detalle completo del diálogo: título `Detalle DTE - Folio #<n>`, `Tipo:`, `RUT Receptor:`,
  `Monto: $ <n> CLP` y estado, en lugar de textos sueltos.
- Códigos HTTP de la operación que origina el cambio: `POST 201`, `PUT 200`, `DELETE 204`,
  y `GET 200` del listado.

## Riesgos de falso positivo corregidos

1. **Tabla vacía durante la carga.** La aplicación pinta el estado vacío y oculta el contador
   de resultados mientras `isLoading` está activo: `toHaveCount(0)` pasaba antes de que la
   consulta terminara. Ahora toda comprobación de ausencia pasa por `waitForListIdle` o por
   una búsqueda sincronizada.
2. **Búsqueda sin sincronización.** `searchByRut` solo esperaba un encabezado que siempre
   existe. Ahora espera la respuesta `GET /api/documents` con el parámetro `rut` exacto y
   luego el fin de la carga.
3. **Recarga sin espera.** `page.reload()` se ejecutaba y las aserciones corrían contra la
   tabla inicial vacía. Ahora se espera el `GET` inicial posterior a la recarga.
4. **Eliminación comprobada antes de la recarga.** El `DELETE` no esperaba la recarga del
   listado que la aplicación dispara al confirmar. Ahora `runAndWaitForListRefresh` registra
   la espera antes del clic y solo devuelve con la tabla ya actualizada.
5. **Aserciones contra datos sin filtrar.** Tras pulsar «Buscar» la fila seguía siendo la
   anterior al filtro; ahora el total de resultados prueba que el filtro se aplicó.
6. **Localizador muerto.** `rowByFolio` buscaba `Ver detalle folio <n>` y el control real es
   `Ver detalle de folio <n>`; corregido y en uso en el detalle.
7. **Diálogos abiertos en carga.** El detalle y el formulario de edición montan su indicador
   de carga en el mismo render; ahora se espera a que desaparezca antes de leer o escribir.
8. **Anunciador de rutas de Next.js.** Es un `role="alert"` permanente; la comprobación de
   ausencia de errores se limita al `<main>` del portal para no fallar ni ignorar errores.

Sin `waitForTimeout`, sin esperas fijas, sin reintentos y sin selectores por clase, ID
interno o posición.

## Validación ejecutada

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | sin errores |
| `$env:HEADLESS="true"; npx cucumber-js --config cucumber.cjs --tags "@ui"` | 5 aprobados / 0 fallidos |
| `$env:HEADLESS="true"; npm test` | 13 aprobados / 0 fallidos |
| `npm run report:generate` | `allure-report` con `passed: 13`, `failed: 0`, `broken: 0` |

Evidencias: captura de pantalla por escenario UI en el hook `After`, adjuntos JSON de
esperado/observado en creación, consulta, actualización y eliminación, y los resultados
crudos en `allure-results`.

## Pendientes para la siguiente fase

- Negativos UI (400/404/409 y sesión expirada) si el enunciado los exige.
- Verificación de paginación cuando un escenario supere los 10 documentos del listado.
- Agrupación Allure por épica/severidad y trazabilidad de requisitos con tags.
- Limpieza de `diagnostico-ui.ts` y `temp-methods.txt`, residuales de fases anteriores.
