# Entrega técnica — Etapa 4.2 (para validación local)

## Estado
- Código base F1 incluido en el ZIP original: 6 ejemplos HTTP 400, 2 escenarios HTTP 401, 1 escenario HTTP 409.
- Se añadió HYB-01: API crea → UI verifica → UI edita → API verifica → API elimina → API verifica ausencia.
- Se añadió health-check global de laboratorio, timeouts configurables, archivado/limpieza de Allure con respaldo comprobado, y adjuntos API con nombres y solicitud saneada.
- Se actualizó README y .env.example.
- Se preservaron los escenarios existentes y las configuraciones F1.

## Validación efectuada aquí
- `tsc --noEmit`: PASS (sin errores).
- No se ejecutaron escenarios contra Docker; este entorno no tiene acceso al laboratorio local de Windows.
- El intento de dry-run de Cucumber quedó bloqueado por la dependencia nativa `esbuild` de Windows dentro del ZIP, incompatible con Linux. No representa un fallo demostrado del código.

## Antes de integrar
1. Conserva copia del repositorio original y sus evidencias.
2. Extrae el ZIP en una carpeta distinta; no reemplaces a ciegas `.env`, `.git` ni resultados históricos.
3. En Windows, ejecuta `npm ci` para instalar dependencias de la plataforma.
4. Con Docker activo, ejecuta `npm run typecheck`, `npm run test:hybrid`, `npm run test:api`, `npm run test:ui` y finalmente `npm run test:check`.
5. Para reporte limpio, usa `npm run report:archive` seguido de `npm run report:clean` y solo entonces la corrida oficial; no hay limpieza automática.
6. Verifica conteos de escenarios reales: los outlines cuentan por fila de Examples.
7. Revisa Allure y comparte fallos para ajustes puntuales antes de solicitar certificación a Hermes.

## Pendientes para aspirar al máximo puntaje
- Evidencias esperado/obtenido en todos los contratos y metadatos Allure enriquecidos.
- Ampliar Examples de CRUD-03 con particiones de negocio justificadas, si aporta cobertura real.
- Ejecutar 2–3 regresiones consecutivas sin retries y auditar contra la rúbrica oficial.
- No declarar F1/F2 PASS hasta ejecutar en laboratorio real.
