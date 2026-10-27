import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentsPage } from "../../pages/documents.page";
import { ESTADO_PRUEBA_UI, createDocumentFixture, randomFolio } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

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
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const fixture = createDocumentFixture(randomFolio(), this.rutReceptor);
  this.documentFixture = fixture;

  await new DocumentFormPage(this.page).fillValidDocument(fixture);
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

  const fixture = this.documentFixture;
  assert.ok(fixture, "No existen datos del documento creado");

  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${fixture.folio} emitido correctamente.`);

  // Persistencia: recarga completa del portal y verificación por folio y RUT exactos.
  await documents.reloadWithListLoaded();
  await documents.searchByRut(fixture.rutReceptor);
  await documents.expectResultsCount(1);

  const row = await documents.expectDocumentRow(fixture.folio, {
    rut: fixture.rutReceptor,
    tipoDte: fixture.tipoDte,
    monto: fixture.monto,
    estado: ESTADO_PRUEBA_UI
  });

  await this.attach(
    JSON.stringify(
      {
        avisoEsperado: `Documento folio ${fixture.folio} emitido correctamente.`,
        filtroRut: fixture.rutReceptor,
        filaObservada: await row.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});
