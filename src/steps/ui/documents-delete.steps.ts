import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentDeletePage } from "../../pages/document-delete.page";
import { DocumentsPage } from "../../pages/documents.page";
import { ESTADO_PRUEBA_UI, createDocumentFixture, randomFolio } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("creo un documento pendiente para eliminar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.runId, "No existe un runId para aislar la prueba");
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const fixture = createDocumentFixture(randomFolio(), this.rutReceptor);
  const form = new DocumentFormPage(this.page);
  const documents = new DocumentsPage(this.page);

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
    estado: ESTADO_PRUEBA_UI
  });
});

When("elimino el documento desde la interfaz", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const fixture = this.documentFixture;
  assert.ok(fixture, "No existen datos del documento");

  const deletePage = new DocumentDeletePage(this.page);
  const documents = new DocumentsPage(this.page);

  // Espera el DELETE y, sobre todo, la recarga final del listado: el paso siguiente
  // comprueba la desaparición recién cuando la tabla ya refleja esa recarga.
  await documents.runAndWaitForListRefresh(() => deletePage.deleteDocument(fixture.folio, fixture.rutReceptor));
});

Then("el documento eliminado no debe aparecer en el listado", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const fixture = this.documentFixture;
  assert.ok(fixture, "No existen datos esperados");

  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${fixture.folio} eliminado correctamente.`);

  // El listado ya terminó de recargar (esperado en el paso anterior): la desaparición
  // se comprueba sobre datos reales, no sobre la tabla vacía del inicio de carga.
  await documents.waitForListIdle();
  await documents.expectDocumentAbsent(fixture.folio);
  await documents.expectEmptyResults();

  // Persistencia: recarga completa del portal y filtro por el RUT exacto.
  await documents.reloadWithListLoaded();
  await documents.searchByRut(fixture.rutReceptor);
  await documents.expectDocumentAbsent(fixture.folio);
  await documents.expectEmptyResults();

  await this.attach(
    JSON.stringify(
      {
        avisoEsperado: `Documento folio ${fixture.folio} eliminado correctamente.`,
        filtroRut: fixture.rutReceptor,
        folioEliminado: fixture.folio,
        estadoTabla: "0 documentos encontrados"
      },
      null,
      2
    ),
    "application/json"
  );
});
