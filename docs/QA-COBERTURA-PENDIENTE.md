# Cobertura pendiente para la evaluación

## Pendiente de validar contra la rúbrica oficial

1. Filtrado GET por RUT, tipo DTE y folio: confirmar parámetros y formato de respuesta antes de implementar.
2. Contrato completo de respuestas: confirmar campos obligatorios, campos opcionales, formato de ID, fechas, estado y rechazo de campos extra.
3. Negativos de validación/autorización (400, 401, 403, 409): confirmar reglas y datos permitidos del laboratorio.
4. UI: comprobar persistencia exacta y mensajes de confirmación con la especificación original.
5. Allure: valorar agrupación por épica/feature/severidad y trazabilidad de requisitos.

## Cambios introducidos

- Comparación de los siete campos enviados al crear y recuperar un documento.
- Verificación de los siete campos tras actualizar y consultar.
- Comprobación de ausencia en listado después de DELETE.
- Comprobación de persistencia UI después de recargar en UPDATE.
- Nuevo escenario API negativo de ID inexistente (12 escenarios en total).
- Scripts, documentación, plantilla de entorno y configuración HEADLESS.

**Nota:** estas aserciones deben verificarse con el contrato real: una API que normalice fechas, tipos o campos podría requerir ajustar las expectativas según especificación, no simplemente debilitarlas.
