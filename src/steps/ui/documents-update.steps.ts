import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentEditPage } from "../../pages/document-edit.page";
import { DocumentsPage } from "../../pages/documents.page";
import { ESTADO_PRUEBA_UI, createDocumentFixture, randomFolio } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("creo un documento pendiente para actualizar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
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

When("modifico su monto a {int} desde la interfaz", async function (
  this: CustomWorld,
  monto: number
) {
  assert.ok(this.page, "No existe una página de navegador");

  const fixture = this.documentFixture;
  assert.ok(fixture, "No existen datos del documento");

  const editPage = new DocumentEditPage(this.page);
  const documents = new DocumentsPage(this.page);

  await editPage.openEditForm(fixture.folio);
  // Espera el PUT y la recarga del listado que confirma que el cambio quedó persistido.
  await documents.runAndWaitForListRefresh(() => editPage.updateAmount(monto));

  fixture.monto = monto;
});

Then("debo visualizar el monto actualizado en el listado", async function (
  this: CustomWorld
) {
  assert.ok(this.page, "No existe una página de navegador");

  const fixture = this.documentFixture;
  assert.ok(fixture, "No existen datos esperados");

  const documents = new DocumentsPage(this.page);

  await documents.expectSuccessNotice(`Documento folio ${fixture.folio} actualizado correctamente.`);
  await documents.expectDocumentRow(fixture.folio, {
    rut: fixture.rutReceptor,
    tipoDte: fixture.tipoDte,
    monto: fixture.monto,
    estado: ESTADO_PRUEBA_UI
  });

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
        avisoEsperado: `Documento folio ${fixture.folio} actualizado correctamente.`,
        filtroRut: fixture.rutReceptor,
        montoEsperado: fixture.monto,
        filaObservada: await row.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});
