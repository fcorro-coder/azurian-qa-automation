# Auditoría contra rúbrica Azurian (10 páginas)

## Implementado en esta entrega
- Se conservan los 12 escenarios originales; se agrega un escenario API de consulta con filtros combinados y lectura exacta por ID (13 escenarios previstos).
- Validador de documentos con **14 campos exactos**, UUID, fechas ISO parseables, estados y campos opcionales tipados; comparación de valores esperados y recibidos.
- Creación: validación integral de POST y GET; actualización: PUT y GET; eliminación: GET 404 y ausencia del listado.
- Consulta: comprobación del encabezado `x-total-count`, contrato de cada elemento, RUT y tipo DTE.
- UI creación: validación adicional de tipo, RUT, monto y estado de la fila exacta.
- Se conservan los Page Objects, Gherkin, Cucumber, TypeScript y Allure.

## Pendientes de comprobación con el laboratorio real
- El cuerpo de error 404 se modeló con `error` y `code`; verificar si el backend devuelve además `details` u otra propiedad. **No se debe suavizar la validación**: ajustar al contrato real y documentarlo.
- Verificar comportamiento de filtros y `x-total-count` con múltiples páginas; el escenario usa un runId aislado.
- La UI de lectura todavía requiere filtrar, abrir el diálogo `Ver detalle` y comprobar los datos completos. Se requiere inspeccionar el DOM real para elegir selectores semánticos correctos.
- La UI de eliminación debe demostrar tabla vacía para el filtro y no solamente ausencia del folio.
- Agregar pruebas extras de 400, 401, 409 y flujo híbrido una vez confirmado el contrato del laboratorio.
- Validar y ejecutar el proyecto en Windows/WSL; este entorno no tiene el laboratorio Docker ni dependencias instaladas correctamente.

## Rúbrica oficial
Cobertura CRUD 16; aserciones 16; localizadores 10; estabilidad 10; datos independientes 6; arquitectura 12; BDD 10; TypeScript 6; Allure 10; documentación 4. Hasta 10 puntos extra. **No se puede afirmar una nota de 100/100 sin ejecución y revisión del evaluador.**

## Comandos Windows PowerShell
```powershell
npm ci
npm run typecheck
$env:HEADLESS = "true"
npm test
npm run report:generate
npm run report:open
```
