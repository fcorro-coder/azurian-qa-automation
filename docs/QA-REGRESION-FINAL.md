# Plan de regresión de la versión actualizada

1. Ejecutar `npm ci` y `npm run typecheck`.
2. Ejecutar `npx cucumber-js --config cucumber.cjs --tags "@ui and @leer"` para verificar el nuevo detalle UI.
3. Ejecutar `npm test` con el laboratorio disponible.
4. Regenerar Allure con `npm run report:generate` y abrir con `npm run report:open`.
5. Confirmar 13 escenarios, incluidos los 12 originales (se modificaron nombres de escenarios para hacerlos únicos).
6. Si falla UI Leer, capturar el DOM accesible de la vista de detalle y corregir exclusivamente el Page Object; no debilitar aserciones.

No se ejecutaron pruebas contra el laboratorio en este entorno. El `tsc --noEmit` global completó sin errores; las dependencias extraídas procedían de Windows, por lo que no se ejecutó Cucumber localmente.
