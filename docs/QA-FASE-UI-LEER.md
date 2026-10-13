# Fase UI Leer — QA

Se reemplazó la comprobación superficial de encabezados por una consulta completa:
- Se crean dos documentos propios con el mismo RUT y folios distintos.
- Se filtra por RUT y se localiza el folio objetivo sin usar posiciones globales.
- Se abre el detalle mediante botón semántico de la fila exacta.
- Se comparan folio, RUT, tipo y monto y se adjunta evidencia esperado/observado.

**Pendiente de validación funcional:** confirmar que la vista real utiliza un diálogo accesible y que el botón se llama «Ver detalle». Si la UI utiliza otra estructura, adaptar los localizadores semánticos al DOM real, sin relajar las aserciones.

**Riesgo:** la preparación crea dos documentos; el laboratorio debe aislar datos mediante `runId` y permitir folios independientes. No se ejecutó el laboratorio desde este entorno.
