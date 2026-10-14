import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentsPage } from "../../pages/documents.page";
import type { CustomWorld } from "../../fixtures/custom-world";

const RUT_RECEPTOR = "76.086.428-5";
const TIPO_DTE = "DTE 33";
const ESTADO_PENDIENTE = "Pendiente";

When("abro el formulario de nuevo documento", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  await new DocumentFormPage(this.page).openCreateForm();
});

Then("debo visualizar los campos obligatorios de creación", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  await new DocumentFormPage(this.page).validateCreateForm();
});

When("completo los datos válidos del documento", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const folio = Math.floor(Math.random() * 9000000) + 1000000;

  this.documentData = {
    folio,
    rutReceptor: RUT_RECEPTOR,
    monto: 150000,
    tipoDte: TIPO_DTE
  };

  await new DocumentFormPage(this.page).fillValidDocument(folio);
});

When("guardo el documento desde la interfaz", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const form = new DocumentFormPage(this.page);
  const documents = new DocumentsPage(this.page);

  // Espera el POST y, además, la recarga del listado que la aplicación dispara al guardar.
  await documents.runAndWaitForListRefresh(() => form.saveDocument());
});

Then("debo encontrar el documento creado en el listado", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento creado");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const rut = String(this.documentData.rutReceptor);
  const monto = Number(this.documentData.monto);
  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${folio} emitido correctamente.`);

  // Persistencia: recarga completa del portal y verificación por folio y RUT exactos.
  await documents.reloadWithListLoaded();
  await documents.searchByRut(rut);
  await documents.expectResultsCount(1);

  const row = await documents.expectDocumentRow(folio, {
    rut,
    tipoDte: TIPO_DTE,
    monto,
    estado: ESTADO_PENDIENTE
  });

  await this.attach(
    JSON.stringify(
      {
        avisoEsperado: `Documento folio ${folio} emitido correctamente.`,
        filtroRut: rut,
        filaObservada: await row.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});
