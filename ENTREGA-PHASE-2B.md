# Informe de Fase 2B — Pruebas Negativas UI

## 1. Reglas del examen verificadas

Se inspeccionaron las validaciones reales del formulario de documentos extraídas del
código compilado en el contenedor Docker (`com-azurian-qa-evaluacion-app-1`), en
`/.next/static/chunks/`. Para verificar el comportamiento exacto de la aplicación, se
inyectó una evaluación de Node dentro del contenedor para determinar los mensajes
de error construidos dinámicamente por la función `m()` (formateador de miles con
puntos):

| Validación | Mensaje exacto verificado |
|---|---|
| Folio vacío | `El folio es obligatorio.` |
| Folio fuera de rango | `El folio debe estar entre 1 y 9.999.999.` |
| RUT vacío | `El RUT del receptor es obligatorio.` |
| RUT formato incorrecto | `El RUT debe tener formato 12.345.678-9.` |
| RUT dígito verificador inválido | `El dígito verificador del RUT no es válido.` |
| Monto vacío | `El monto es obligatorio.` |
| Monto fuera de rango | `El monto debe estar entre 1 y 999.999.999.` |
| Observaciones excesivo | `Las observaciones no pueden superar 300 caracteres.` |
| Correo inválido | `El correo de contacto no tiene un formato válido.` |
| Adjunto extensión | `El documento de respaldo debe ser un archivo .pdf, .xml o .txt.` |
| Error general de formulario | `Corrige los campos indicados antes de continuar.` |
| Documento aceptado bloqueado | `Un documento aceptado no puede modificarse ni eliminarse.` |

**Descubrimiento clave durante la ejecución:** el rango real del folio es
`1` a `9.999.999` (no `1.000.000` como se documentó inicialmente). El mensaje
formatea `m(1) = "1"` (sin puntos) y `m(9999999) = "9.999.999"`. Los tests
se ajustaron a este valor exacto.

## 2. Escenarios negativos implementados

| No. | Escenario | Verificación | Tipo | Severidad |
|---|---|---|---|---|
| UI-NEG-01 | Campos obligatorios vacíos al intentar guardar | Mensajes de error por campo + error general + formulario permanece abierto | Funcional | Alta |
| UI-NEG-02 | RUT con dígito verificador incorrecto | Mensaje de error "El dígito verificador del RUT no es válido." | Funcional | Alta |
| UI-NEG-03 | Folio fuera de rango (0) | Mensaje de error "El folio debe estar entre 1 y 9.999.999." + formulario abierto | Funcional | Alta |
| UI-NEG-04 | Monto fuera de rango (0) | Mensaje de error "El monto debe estar entre 1 y 999.999.999." + formulario abierto | Funcional | Alta |
| UI-NEG-05 | Observaciones limitadas a 300 caracteres | Atributo `maxlength="300"` verificado + valor truncado (ver nota brecha) | Funcional | Media |
| UI-NEG-06 | Correo de contacto habilitación condicional | Deshabilitado por defecto → habilitado al seleccionar EMAIL → deshabilitado al volver a PORTAL | Funcional | Media |
| UI-NEG-07 | Correo inválido con sendCopy activado | Mensaje "El correo de contacto no tiene un formato válido." + formulario abierto | Funcional | Alta |
| UI-NEG-08 | Documento ACEPTADO bloqueado para editar/eliminar | Botones deshabilitados + título "Un documento aceptado no puede modificarse ni eliminarse." | Funcional | Alta |
| UI-NEG-09 | Envío SII con monto > 10M → RECHAZADO | Aviso "Resultado: Rechazado." + estado "Rechazado" en fila | Funcional | Media |
| UI-NEG-10 | tipo de DTE / folio bloqueados en edición | Campos deshabilitados + monto habilitado | Funcional | Media |
| UI-NEG-11 | Adjuntar archivo con extensión no permitida | Mensaje "El documento de respaldo debe ser un archivo .pdf, .xml o .txt." + formulario abierto + sin POST + folio no persistido en listado | Funcional | Alta |
| UI-NEG-12 | Control: el monitor detecta una solicitud POST real al crear un documento válido | POST detectado por el monitor + aviso de éxito del documento creado | Control | Baja |

## 3. Archivos creados o modificados

### Creados
| Archivo | Descripción |
|---|---|
| `features/ui/documents-negative.feature` | 11 escenarios Gherkin declarativo con tags `@ui @negativo`, IDs únicos `UI-NEG-01` a `UI-NEG-11` |
| `src/steps/ui/documents-negative.steps.ts` | 28 definiciones de pasos en TypeScript estricto, incluye verificación de ausencia de POST y persistencia en listado |

### Modificados en Fase 2B (audit)
| Archivo | Cambio de Fase 2B (audit) |
|---|---|
| `src/pages/document-form.page.ts` | +`setupPostTracking()` — registra `page.on("request")` **antes** del click en Guardar; +`expectNoCreationRequest()` — verifica listener + 500 ms backstop; +`closeForm()` — cierra diálogo con "Cancelar"; `attemptSubmit` ahora llama `setupPostTracking()` antes de click; +WeakMap<Page, PostTrackerState> para compartir estado entre instancias de DocumentFormPage dentro del mismo escenario; +`expectPostWasMade()` y `cleanupPostTracking()` para la prueba de control |
| `src/pages/documents.page.ts` | Removido `expectNoCreationRequest()` (trasladado a DocumentFormPage con listener); `expectDocumentAbsent` ya tenía `waitForListIdle()` interno |

## 4. Evidencia de validaciones

Cada escenario verifica el rechazo/bloqueo esperado Y la ausencia de creación/modificación indebida.

**Estrategia de sincronización de ausencia de creación (Fase 2B + auditoría OpenCode):**

- **POST absence tracking (WeakMap compartido)**: El método `DocumentFormPage.setupPostTracking()` registra un
  listener `page.on("request")` **antes** de que se haga clic en Guardar (o antes de cualquier
  acción que podría desencadenar un POST). El estado del monitor se almacena en un `WeakMap<Page, PostTrackerState>`
  a nivel módulo, keyed por el objeto `Page` de Playwright. Esto garantiza que todas las instancias de
  `DocumentFormPage` creadas durante un escenario (que comparten el mismo `Page`) observan el mismo monitor.
  El listener captura solicitudes POST a `/api/documents` incluso si el request se resuelve antes de que
  se consulte el resultado. Luego, `expectNoCreationRequest()` verifica:
  1. Que el listener no capturó ningún POST.
  2. Una ventana de 500 ms con `waitForResponse` como respaldo para detectar respuestas tardías.
  3. Limpia el listener tras la verificación (método `cleanupPostTracking()` — idempotente).
- **Hook After de limpieza**: Un hook `After({ tags: "@ui" })` llama a `DocumentFormPage.cleanupPostTrackingForPage(page)`
  al finalizar cada escenario, garantizando que los listeners se liberen incluso si una aserción falla.
- **Persistencia verificada con datos únicos**: El paso `no se crea el documento en el listado`
  (usado por UI-NEG-11) exige un fixture con folio único (`assert.ok`), cierra el formulario,
  recarga el listado, busca por RUT y usa `expectDocumentAbsent(folio)` — que sincroniza
  internamente con `waitForListIdle()` antes de afirmar la ausencia de la fila.

**Escenarios que verifican ausencia de creación:**

- **UI-NEG-01** (campos vacíos), **UI-NEG-02** (RUT inválido), **UI-NEG-03** (folio=0),
  **UI-NEG-04** (monto=0), **UI-NEG-07** (email inválido): usan `el formulario permanece abierto`,
  que ahora incluye `expectNoCreationRequest()` — formulario sigue abierto + sin POST.
- **UI-NEG-11** (adjunto .exe): usa `no se crea el documento en el listado` — formulario abierto +
  sin POST + absencia de persistencia del folio único en la tabla.
- `Given que ingreso al portal Azurian con credenciales válidas` (auth)
- `When abro el formulario de nuevo documento` (create.steps)
- `And completo los datos válidos del documento` (create.steps)
- `Given creo un documento pendiente para actualizar` (update.steps)

## 5. Escenarios no implementados y justificación

| Caso no implementado | Justificación |
|---|---|
| `Las observaciones no pueden superar 300 caracteres.` como error visible al enviar | El textarea tiene `maxLength: 300` (atributo HTML del laboratorio). El navegador rechaza caracteres en exceso, por lo que el valor nunca supera 300 y la validación cliente nunca se dispara. UI-NEG-05 verifica el `maxLength` como comportamiento observable, y se documenta esta brecha. |
| `Corrige los campos indicados antes de continuar.` como verificación independiente del error general | Ya verificado implícitamente en UI-NEG-01 (error general visible). No se agrega un escenario redundante. |

## 6. Resultado de TypeScript

```
npx tsc --noEmit
```
**Exit code: 0** — Sin errores. TypeScript estricto, sin uso de `any`.

## 7. Resultado de Cucumber y Allure

### Dry-run (sin contaminar Allure)
```
35 scenarios (35 skipped)
191 steps (191 skipped)
```
0 steps indefinidos — todos los pasos tienen definiciones.

### Ejecución focalizada (escenarios negativos + control)
```
12 scenarios (12 passed)
78 steps (78 passed)
```
Duración: ~2m52s. Todas las capturas de pantalla y evidencias se adjuntan a Allure.

### Regresión oficial completa
```
npm run test:official
```

| Métrica | Valor |
|---|---|
| Escenarios totales | 35 (23 originales + 11 nuevos + 1 control) |
| Escenarios PASSED | 35 |
| Escenarios FAILED | 0 |
| Adjuntos Allure | 80 (toda la captura de pantalla, JSON de evidencia, control POST) |
| Adjuntos huérfanos | 0 |
| Adjuntos faltantes | 0 |
| Escenarios duplicados | 0 |

## 8. Comparación de cobertura antes y después

| Métrica | Antes (Fase 2A) | Después (Fase 2B) | Delta |
|---|---|---|---|
| Escenarios totales | 23 | 35 | +12 |
| Escenarios negativos UI | 0 | 11 | +11 |
| Escenario de control | N/A | 1 (UI-NEG-12) | +1 |
| Steps | 113 | 191 | +78 |
| Adjuntos Allure | 67 | 80 | +13 |
| Tipo de pruebas | API, UI, híbrido | API, UI, híbrido, UI-negativo, control-POST | +2 categorías |

## 9. Riesgos residuales

1. **maxLength vs validación backend**: El textarea de observaciones tiene `maxLength=300`,
   lo que impide que la validación cliente `t.length > 300` sea alcanzable desde la UI.
   La validación existe en código pero no es verificable por interacción directa. Se
   documenta la brecha; no se simula.
2. **UI-NEG-08 (documento aceptado)**: El escenario crea un documento y lo envía al SII
   para obtener estado ACEPTADO. Si la SII responde lentamente o con estado diferente,
   el escenario depende de `MONTO_PRUEBA = 150_000` (≤ 10M), lo que garantiza ACEPTADO.
3. **UI-NEG-10**: Verifica que `tipoDte` y `folio` están deshabilitados en edición, pero
   no prueba que el PUT al backend rechace explícitamente los cambios (la UI ya impide el
   envío modificado). La validación backend existe pero es redundante con el bloqueo UI.
4. **UI-NEG-12 (control)**: El escenario crea un documento válido en el laboratorio local.
   Este es un escenario de control (tag `@severity:low`), no un escenario negativo. El
   documento creado persiste en la base de datos del laboratorio, pero utiliza RUT y folio
   únicos por escenario, por lo que no interfiere con otras pruebas. No modifica datos
   productivos de producción.

## 11. Auditoría de código (OpenCode) — Corrección de falso positivo

### 11.1 Causa raíz del falso positivo

El método `expectNoCreationRequest()` utilizaba las propiedades de instancia
`postRequestUrls` (array) y `postTracker` (listener callback) de `DocumentFormPage`.
Cada vez que un step creaba una nueva instancia —
`const form = new DocumentFormPage(this.page!)` — el array comenzaba vacío (`[]`),
porque el listener registrado por `setupPostTracking()` en una instancia anterior
insertaba en **ese array de la instancia anterior**, no en el de la nueva.

**Flujo del falso positivo:**

1. Step `intentar guardar el formulario` → crea `DocumentFormPage` instancia A →
   `attemptSubmit()` llama `A.setupPostTracking()` → registra `page.on("request")`
   con closure sobre `A.postRequestUrls`.
2. Step `el formulario permanece abierto` → crea `DocumentFormPage` instancia B →
   `B.expectNoCreationRequest()` verifica `B.postRequestUrls` que es `[]` →
   **siempre pasa** (falso positivo), incluso si el listener de A capturó un POST.

**Consecuencia:** La ausencia de POST de creación era verificada contra un monitor
vacío. Un POST emitido por el formulario no era detectado por la verificación.

### 11.2 Corrección implementada

Se reemplazaron las propiedades de instancia por un `WeakMap<Page, PostTrackerState>`
a nivel módulo (`POST_TRACKERS` en `document-form.page.ts`). El `Page` de Playwright
es un objeto único por escenario, por lo que todas las instancias de `DocumentFormPage`
que comparten el mismo `Page` observan el mismo estado de monitoreo.

**Métodos afectados:**
- `setupPostTracking()` — usa `getPostTracker(this.page)` en lugar de `this.postRequestUrls`
- `expectNoCreationRequest()` — verifica `state.urls` (del WeakMap) + 500 ms backstop
- `expectPostWasMade()` — **nuevo**; verifica `state.urls.length > 0` (para la prueba de control)
- `cleanupPostTracking()` — **nuevo**; remueve el listener (idempotente)
- `static cleanupPostTrackingForPage(page)` — **nuevo**; limpieza estática para el hook `After`

**Hook After:** Se añadió `After({ tags: "@ui" })` en `documents-negative.steps.ts`
que llama `DocumentFormPage.cleanupPostTrackingForPage(page)` al finalizar cada
escenario, liberando listeners incluso si una aserción falla.

### 11.3 Evidencia de que el monitor detecta un POST real

**Escenario UI-NEG-12 (Control):**

| Paso | Resultado |
|---|---|
| `abro el formulario de nuevo documento` | Formulario visible ✓ |
| `completo los datos válidos del documento` | Fixture con RUT/folio únicos ✓ |
| `intento guardar el formulario` | `setupPostTracking()` registra listener ANTES del click; POST capturado ✓ |
| `debo ver el aviso de éxito del documento creado` | Notice "Documento folio {folio} emitido correctamente." ✓ |
| `el monitor confirma que se realizó una solicitud POST` | `state.urls.length > 0` ✓ |

El escenario crea un documento **válido** (real POST a `/api/documents`), y el monitor
lo detecta correctamente. Esto demuestra que el WeakMap comparte el estado entre
instancias y que `expectPostWasMade()` funciona.

### 11.4 Separación: ausencia de POST vs. ausencia de persistencia

| Verificación | Método | Escenario |
|---|---|---|
| Ausencia de solicitud POST | `expectNoCreationRequest()` (WeakMap + listener + 500 ms backstop) | UI-NEG-01/02/03/04/07/11 |
| Ausencia de persistencia | `expectDocumentAbsent(folio)` después de recargar y buscar por RUT | UI-NEG-11 |

El paso `no se crea el documento en el listado` (UI-NEG-11) exige un fixture válido
vía `assert.ok(fixture)` — no omite la verificación de persistencia.

### 11.5 Resultados

| Validación | Comando | Resultado |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Exit code 0 ✓ |
| Dry-run | `cucumber-js --dry-run` | 35 scenarios, 191 steps, 0 undefined ✓ |
| Focalizada | `--tags "@ui and @negativo"` | 12 scenarios, 78 steps, 12 passed ✓ |
| Regresión oficial | `npm run test:official` | 35/35 passed ✓ |
| Allure verify | `npm run report:verify` | 35 results, 80 attachments, 0 orphans, 0 missing, 0 duplicates ✓ |

### 11.6 Archivos modificados en esta auditoría

| Archivo | Cambio |
|---|---|
| `src/pages/document-form.page.ts` | WeakMap → comparte estado entre instancias; `expectPostWasMade()`, `cleanupPostTracking()`, `cleanupPostTrackingForPage()` |
| `src/steps/ui/documents-negative.steps.ts` | Hook `After({ tags: "@ui" })`; step `el monitor confirma que se realizó una solicitud POST` |
| `features/ui/documents-negative.feature` | Escenario UI-NEG-12 (control) |
| `ENTREGA-PHASE-2B.md` | Actualizado con auditoría, resultados 35/35 |

### GO

La auditoría de código corrigió el falso positivo en la detección de ausencia de POST
(WeakMap compartido entre instancias de `DocumentFormPage` dentro del mismo escenario).
La prueba de control UI-NEG-12 demuestra que el monitor detecta POSTs reales.

Todos los escenarios han sido implementados y ejecutados con éxito: 35/35 PASSED
(23 originales + 11 negativos + 1 control). TypeScript, dry-run y regresión oficial
pasan correctamente. Las brechas de validación documentadas (maxLength en observaciones)
no degradan la cobertura existente. El reporte de Allure es íntegro: 0 huérfanos,
0 faltantes, 0 duplicados.

---

**Laboratorio**: `com-azurian-qa-evaluacion-app-1` (puerto 3100), `com-azurian-qa-evaluacion-db-1` — ambos healthy.
**Health check**: `curl http://localhost:3100/api/health` → `{"status":"ok"}`
**Etiquetas**: `@ui @negativo @severity:high/@severity:medium`
