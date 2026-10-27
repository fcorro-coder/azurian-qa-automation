import { Given, When, Then, After } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentEditPage } from "../../pages/document-edit.page";
import { DocumentsPage } from "../../pages/documents.page";
import {
  ESTADO_PRUEBA_UI,
  createDocumentFixture,
  randomFolio,
  TIPO_DTE_PRUEBA,
} from "../../fixtures/test-data";
import type { DocumentFixture } from "../../types/documents";
import type { CustomWorld } from "../../fixtures/custom-world";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function ensureWorld(this: CustomWorld): Promise<void> {
  assert.ok(this.page, "No existe una página de navegador");
}

// ── Hooks ───────────────────────────────────────────────────────────────────

After({ tags: "@ui" }, async function (this: CustomWorld) {
  if (this.page) {
    DocumentFormPage.cleanupPostTrackingForPage(this.page);
  }
});

// ── UI-NEG-01: Campos obligatorios vacíos ─────────────────────────────────

When("intento guardar el formulario", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).attemptSubmit();
});

Then("debo ver el mensaje de error {string}", async function (this: CustomWorld, message: string) {
  const form = new DocumentFormPage(this.page!);
  await expect(form.createDialog.getByText(message)).toBeVisible();
});

Then("debo ver el mensaje de error general {string}", async function (this: CustomWorld, message: string) {
  const form = new DocumentFormPage(this.page!);
  await expect(form.createDialog.getByText(message)).toBeVisible();
});

Then("el formulario permanece abierto", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  const form = new DocumentFormPage(this.page!);
  await form.expectFormOpen();
  // Verifica además que la validación fallida no desencadenó una solicitud POST
  await form.expectNoCreationRequest();
});

// ── UI-NEG-02: RUT con dígito verificador incorrecto ───────────────────────

When("cambio el RUT receptor a {string}", async function (this: CustomWorld, rut: string) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).fillRut(rut);
});

// ── UI-NEG-03 / UI-NEG-04: Folio / monto fuera de rango ─────────────────────

When("cambio el folio a {int}", async function (this: CustomWorld, folio: number) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).fillFolio(String(folio));
});

When("cambio el monto a {int}", async function (this: CustomWorld, monto: number) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).fillMonto(String(monto));
});

// ── UI-NEG-05: Observaciones limitadas a 300 caracteres por maxLength ──────────

When("lleno las observaciones con {int} caracteres", async function (this: CustomWorld, count: number) {
  await ensureWorld.call(this);
  const form = new DocumentFormPage(this.page!);
  await form.fillObservaciones("A".repeat(count));
});

Then("el campo de observaciones contiene como máximo {int} caracteres", async function (
  this: CustomWorld,
  max: number
) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).expectObservacionesMaxLength(max);
});

// ── UI-NEG-06: Habilitación condicional del correo de contacto ─────────────

Then("el campo de correo de contacto debe estar deshabilitado", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).expectContactEmailState(true);
});

Then("el campo de correo de contacto debe estar habilitado", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).expectContactEmailState(false);
});

Then("el campo de correo de contacto debe estar deshabilitado nuevamente", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).expectContactEmailState(true);
});

When("selecciono el canal de entrega {string}", async function (this: CustomWorld, canal: string) {
  await ensureWorld.call(this);
  if (canal === "Correo electrónico") {
    await new DocumentFormPage(this.page!).selectDeliveryChannel("EMAIL");
  } else if (canal === "Portal") {
    await new DocumentFormPage(this.page!).selectDeliveryChannel("PORTAL");
  } else {
    throw new Error(`Canal de entrega desconocido: ${canal}`);
  }
});

// ── UI-NEG-07: Correo de contacto inválido con sendCopy activado ───────────

When("marco enviar copia al contacto", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).toggleSendCopy();
});

When("completo el correo de contacto con un valor inválido", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentFormPage(this.page!).fillContactEmail("not-an-email");
});

// ── UI-NEG-08 / UI-NEG-09: Envío al SII y estado resultante ─────────────────

Given("creo y envío un documento pendiente al SII", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const fixture = createDocumentFixture(randomFolio(), this.rutReceptor);
  const form = new DocumentFormPage(this.page!);
  const documents = new DocumentsPage(this.page!);

  await documents.runAndWaitForListRefresh(async () => {
    await form.openCreateForm();
    await form.fillValidDocument(fixture);
    await form.saveDocument();
  });

  this.documentFixture = fixture;
  await documents.searchByRut(fixture.rutReceptor);
  await documents.expectResultsCount(1);
  await documents.expectDocumentRow(fixture.folio, {
    rut: fixture.rutReceptor,
    tipoDte: fixture.tipoDte,
    monto: fixture.monto,
    estado: ESTADO_PRUEBA_UI,
  });

  // MONTO_PRUEBA = 150_000 ≤ 10 M → el SII lo ACEPTA.
  await documents.sendToSii(fixture.folio);
});

Given(
  "creo un documento con monto {int} para enviar al SII",
  async function (this: CustomWorld, monto: number) {
    await ensureWorld.call(this);
    assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

    const fixture: DocumentFixture = {
      folio: randomFolio(),
      rutReceptor: this.rutReceptor,
      monto,
      tipoDte: TIPO_DTE_PRUEBA,
    };
    const form = new DocumentFormPage(this.page!);
    const documents = new DocumentsPage(this.page!);

    await documents.runAndWaitForListRefresh(async () => {
      await form.openCreateForm();
      await form.fillValidDocument(fixture);
      await form.saveDocument();
    });

    this.documentFixture = fixture;
    await documents.searchByRut(fixture.rutReceptor);
    await documents.expectResultsCount(1);
    await documents.expectDocumentRow(fixture.folio, {
      rut: fixture.rutReceptor,
      tipoDte: fixture.tipoDte,
      monto: fixture.monto,
      estado: ESTADO_PRUEBA_UI,
    });
  }
);

When("envío el documento al SII", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  const fixture = this.documentFixture;
  assert.ok(fixture, "No existe un documento para enviar al SII");
  await new DocumentsPage(this.page!).sendToSii(fixture.folio);
});

Then("debo ver el resultado del envío con estado {string}", async function (
  this: CustomWorld,
  estado: string
) {
  await ensureWorld.call(this);
  const documents = new DocumentsPage(this.page!);
  await documents.expectSuccessNotice(`Resultado: ${estado}.`);
});

Then("la fila del documento muestra el estado {string}", async function (
  this: CustomWorld,
  estadoUI: string
) {
  await ensureWorld.call(this);
  const fixture = this.documentFixture;
  assert.ok(fixture, "No existe un documento para verificar el estado");
  await new DocumentsPage(this.page!).expectRowState(fixture.folio, estadoUI);
});

Then("el botón de editar está deshabilitado con el título {string}", async function (
  this: CustomWorld,
  expectedTitle: string
) {
  await ensureWorld.call(this);
  const fixture = this.documentFixture;
  assert.ok(fixture, "No existe un documento para verificar el bloqueo");
  const documents = new DocumentsPage(this.page!);
  await documents.expectRowButtonDisabled(
    fixture.folio,
    `Editar folio ${fixture.folio}`,
    expectedTitle
  );
});

Then("el botón de eliminar está deshabilitado con el título {string}", async function (
  this: CustomWorld,
  expectedTitle: string
) {
  await ensureWorld.call(this);
  const fixture = this.documentFixture;
  assert.ok(fixture, "No existe un documento para verificar el bloqueo");
  const documents = new DocumentsPage(this.page!);
  await documents.expectRowButtonDisabled(
    fixture.folio,
    `Eliminar folio ${fixture.folio}`,
    expectedTitle
  );
});

// ── UI-NEG-10: tipo de DTE / folio bloqueados en edición ───────────────────

When("abro el formulario de edición del documento pendiente", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  const fixture = this.documentFixture;
  assert.ok(fixture, "No existe un documento pendiente para editar");
  const editPage = new DocumentEditPage(this.page!);
  await editPage.openEditForm(fixture.folio);
});

Then("el campo de tipo de DTE debe estar deshabilitado", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentEditPage(this.page!).expectTipoDteDisabled();
});

Then("el campo de número de folio debe estar deshabilitado", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentEditPage(this.page!).expectFolioDisabled();
});

Then("el campo de monto total debe estar habilitado", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  await new DocumentEditPage(this.page!).expectMontoEnabled();
});

// ── UI-NEG-11: Adjunto con extensión no permitida ──────────────────────────

When("intento adjuntar un archivo con extensión no permitida", async function (this: CustomWorld) {
  await ensureWorld.call(this);
  const form = new DocumentFormPage(this.page!);
  form.setupPostTracking();
  const tempPath = join(tmpdir(), "test-upload.exe");
  writeFileSync(tempPath, Buffer.from("dummy content for testing"));
  try {
    await form.uploadFile(tempPath);
  } finally {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  }
});

// ── Shared: verificación de no-creación tras validación fallida ─────────────

Then("no se crea el documento en el listado", async function (this: CustomWorld) {
  await ensureWorld.call(this);

  const form = new DocumentFormPage(this.page!);
  const documents = new DocumentsPage(this.page!);

  // 1. El formulario sigue abierto (validación fallida → el diálogo no se cierra)
  await form.expectFormOpen();

  // 2. Ausencia de solicitud POST de creación (listener registrado antes del click)
  await form.expectNoCreationRequest();

  // 3. Sin errores de la aplicación en el área de contenido
  await documents.expectNoErrors();

  // 4. Fixture obligatorio: se requiere folio único para verificar ausencia de persistencia
  const fixture = this.documentFixture;
  assert.ok(
    fixture,
    "Se requiere un fixture con folio único para verificar ausencia de persistencia en el listado"
  );

  // 5. Cerrar el formulario, recargar el listado y confirmar que el folio no se persistió
  await form.closeForm();
  await documents.waitForListIdle();
  await documents.searchByRut(fixture.rutReceptor);
  await documents.expectDocumentAbsent(fixture.folio);
});

// ── UI-NEG-12: Control — verifica que el monitor detecta POSTs reales ─────────

Then(
  "debo ver el aviso de éxito del documento creado",
  async function (this: CustomWorld) {
    await ensureWorld.call(this);
    const fixture = this.documentFixture;
    assert.ok(fixture, "No se generó el fixture del escenario");
    const documents = new DocumentsPage(this.page!);
    await documents.expectSuccessNotice(
      `Documento folio ${fixture.folio} emitido correctamente.`
    );
  }
);

Then(
  "el monitor confirma que se realizó una solicitud POST",
  async function (this: CustomWorld) {
    await ensureWorld.call(this);
    await new DocumentFormPage(this.page!).expectPostWasMade();
  }
);
