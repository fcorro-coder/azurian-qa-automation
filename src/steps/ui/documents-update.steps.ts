import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentEditPage } from "../../pages/document-edit.page";
import { DocumentsPage } from "../../pages/documents.page";
import type { CustomWorld } from "../../fixtures/custom-world";

const RUT_RECEPTOR = "76.086.428-5";
const TIPO_DTE = "DTE 33";
const ESTADO_PENDIENTE = "Pendiente";
const MONTO_INICIAL = 150000;

Given("creo un documento pendiente para actualizar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const folio = randomInt(1000000, 9999999);
  const form = new DocumentFormPage(this.page);
  const documents = new DocumentsPage(this.page);

  await documents.runAndWaitForListRefresh(async () => {
    await form.openCreateForm();
    await form.fillValidDocument(folio);
    await form.saveDocument();
  });

  this.documentData = {
    folio,
    monto: MONTO_INICIAL,
    rutReceptor: RUT_RECEPTOR,
    tipoDte: TIPO_DTE
  };

  await documents.searchByRut(RUT_RECEPTOR);
  await documents.expectResultsCount(1);
  await documents.expectDocumentRow(folio, {
    rut: RUT_RECEPTOR,
    tipoDte: TIPO_DTE,
    monto: MONTO_INICIAL,
    estado: ESTADO_PENDIENTE
  });
});

When("modifico su monto a {int} desde la interfaz", async function (
  this: CustomWorld,
  monto: number
) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const editPage = new DocumentEditPage(this.page);
  const documents = new DocumentsPage(this.page);

  await editPage.openEditForm(folio);
  // Espera el PUT y la recarga del listado que confirma que el cambio quedó persistido.
  await documents.runAndWaitForListRefresh(() => editPage.updateAmount(monto));

  this.documentData.monto = monto;
});

Then("debo visualizar el monto actualizado en el listado", async function (
  this: CustomWorld
) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos esperados");

  const folio = this.documentData.folio;
  const monto = this.documentData.monto;

  assert.ok(typeof folio === "number", "El folio debe ser numérico");
  assert.ok(typeof monto === "number", "El monto debe ser numérico");

  const rut = String(this.documentData.rutReceptor);
  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${folio} actualizado correctamente.`);
  await documents.expectDocumentRow(folio, {
    rut,
    tipoDte: TIPO_DTE,
    monto,
    estado: ESTADO_PENDIENTE
  });

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
        avisoEsperado: `Documento folio ${folio} actualizado correctamente.`,
        filtroRut: rut,
        montoEsperado: monto,
        filaObservada: await row.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});
