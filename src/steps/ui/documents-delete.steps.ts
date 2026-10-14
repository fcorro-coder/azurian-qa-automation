import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentDeletePage } from "../../pages/document-delete.page";
import { DocumentsPage } from "../../pages/documents.page";
import type { CustomWorld } from "../../fixtures/custom-world";

const RUT_RECEPTOR = "76.086.428-5";
const TIPO_DTE = "DTE 33";
const ESTADO_PENDIENTE = "Pendiente";
const MONTO_INICIAL = 150000;

Given("creo un documento pendiente para eliminar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.runId, "No existe un runId para aislar la prueba");

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

When("elimino el documento desde la interfaz", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento");

  const folio = this.documentData.folio;
  const rut = String(this.documentData.rutReceptor);
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const deletePage = new DocumentDeletePage(this.page);
  const documents = new DocumentsPage(this.page);

  // Espera el DELETE y, sobre todo, la recarga final del listado: el paso siguiente
  // comprueba la desaparición recién cuando la tabla ya refleja esa recarga.
  await documents.runAndWaitForListRefresh(() => deletePage.deleteDocument(folio, rut));
});

Then("el documento eliminado no debe aparecer en el listado", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos esperados");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const rut = String(this.documentData.rutReceptor);
  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${folio} eliminado correctamente.`);

  // El listado ya terminó de recargar (esperado en el paso anterior): la desaparición
  // se comprueba sobre datos reales, no sobre la tabla vacía del inicio de carga.
  await documents.waitForListIdle();
  await documents.expectDocumentAbsent(folio);
  await documents.expectEmptyResults();

  // Persistencia: recarga completa del portal y filtro por el RUT exacto.
  await documents.reloadWithListLoaded();
  await documents.searchByRut(rut);
  await documents.expectDocumentAbsent(folio);
  await documents.expectEmptyResults();

  await this.attach(
    JSON.stringify(
      {
        avisoEsperado: `Documento folio ${folio} eliminado correctamente.`,
        filtroRut: rut,
        folioEliminado: folio,
        estadoTabla: "0 documentos encontrados"
      },
      null,
      2
    ),
    "application/json"
  );
});
