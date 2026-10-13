# Plan de regresión
1. Comprobar `npm ci` y `npm run typecheck`.
2. Ejecutar `npm run test:api`, confirmar escenario de filtros y todos los CRUD.
3. Ejecutar `$env:HEADLESS = "true"; npm run test:ui` en PowerShell.
4. Ejecutar `npm test` y regenerar Allure.
5. Revisar evidencia de JSON esperado/obtenido y capturas UI.
6. Ante fallos, adjuntar error HTTP y respuesta **sin credenciales**; no cambiar aserciones para forzar PASS.
7. Confirmar que `.env`, `node_modules` y reportes históricos no están en Git.
