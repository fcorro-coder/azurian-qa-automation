# Entrega Etapa 4.3 — Corrección controlada

## Cambios
- Etiquetas de severidad, epic y story en las 12 features, interpretadas por Allure.
- Verificador de integridad de resultados y adjuntos que incluye contenedores de hooks, no solo resultados de test.
- Comando `test:official` con archivo histórico y limpieza protegida.
- Metadata de entorno sin credenciales, tokens ni URLs.
- Health-check usa timeout configurable de API.
- Corrección de indentación en hook API; archivos temporales excluidos.

## Precaución sobre auditoría Hermes
Hermes contó como huérfanos los adjuntos que no están en `*-result.json`. Allure puede vincular adjuntos de hooks en `*-container.json`. El nuevo verificador revisa ambas estructuras; no se debe asumir un defecto del reporter sin ese análisis.

## Evidencia pendiente
No se ejecutó Docker en este entorno. Ejecutar `npm ci`, `npm run test:official` en Windows, y compartir la salida de `npm run report:verify`. Si detecta adjuntos huérfanos, investigar y corregir antes de entregar.
