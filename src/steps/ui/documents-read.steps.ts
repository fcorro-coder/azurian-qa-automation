import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DocumentsPage } from "../../pages/documents.page";
import { DocumentFormPage } from "../../pages/document-form.page";
import { ESTADO_PRUEBA_UI, createDocumentFixture, randomFolio } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que ingreso al portal Azurian con credenciales válidas", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  await new LoginPage(this.page).login();
});

Given("que existen dos documentos propios con el mismo RUT para consultar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const fixture = createDocumentFixture(randomFolio(), this.rutReceptor);
  const secondary = createDocumentFixture(randomFolio(), this.rutReceptor);
  assert.notEqual(fixture.folio, secondary.folio);
  // Los dos documentos de la consulta comparten el RUT del escenario.
  assert.equal(fixture.rutReceptor, secondary.rutReceptor);

  const form = new DocumentFormPage(this.page);
  const documents = new DocumentsPage(this.page);

  for (const item of [fixture, secondary]) {
    await documents.runAndWaitForListRefresh(async () => {
      await form.openCreateForm();
      await form.fillValidDocument(item);
      await form.saveDocument();
    });
  }

  this.documentFixture = fixture;
  this.secondaryDocumentFixture = secondary;
});

When("consulto el módulo de documentos electrónicos", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  await new DocumentsPage(this.page).validateList();
});

Then("debo visualizar el listado de documentos", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  await new DocumentsPage(this.page).validateList();
});

When("filtro por el RUT del documento propio", async function (this: CustomWorld) {
  const fixture = this.documentFixture;
  assert.ok(this.page && fixture);
  await new DocumentsPage(this.page).searchByRut(fixture.rutReceptor);
});

Then("identifico el folio exacto entre varios documentos del mismo RUT", async function (this: CustomWorld) {
  const fixture = this.documentFixture;
  const secondary = this.secondaryDocumentFixture;
  assert.ok(this.page && fixture && secondary);

  const documents = new DocumentsPage(this.page);

  // El filtro devolvió exactamente los dos documentos propios del escenario.
  await documents.expectResultsCount(2);

  const filaObjetivo = await documents.expectDocumentRow(fixture.folio, {
    rut: fixture.rutReceptor,
    tipoDte: fixture.tipoDte,
    monto: fixture.monto,
    estado: ESTADO_PRUEBA_UI
  });

  const otraFila = await documents.expectDocumentRow(secondary.folio, {
    rut: fixture.rutReceptor,
    tipoDte: secondary.tipoDte,
    monto: secondary.monto,
    estado: ESTADO_PRUEBA_UI
  });

  await documents.expectNoErrors();

  await this.attach(
    JSON.stringify(
      {
        filtroRut: fixture.rutReceptor,
        foliosEsperados: [fixture.folio, secondary.folio],
        totalEsperado: 2,
        filaObjetivo: await filaObjetivo.innerText(),
        filaCompuesta: await otraFila.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});

When("abro el detalle del folio exacto", async function (this: CustomWorld) {
  const fixture = this.documentFixture;
  assert.ok(this.page && fixture);

  const dialog = await new DocumentsPage(this.page).openDetail(fixture.folio);
  await this.attach(`Detalle abierto para folio ${fixture.folio}`, "text/plain");
  await expect(dialog).toBeVisible();
});

Then("el detalle debe mostrar el folio, RUT, tipo y monto correctos", async function (this: CustomWorld) {
  const fixture = this.documentFixture;
  assert.ok(this.page && fixture);

  const documents = new DocumentsPage(this.page);
  const dialog = await documents.expectDetailDialog();

  const expected = {
    titulo: `Detalle DTE - Folio #${fixture.folio}`,
    tipo: `Tipo: ${fixture.tipoDte}`,
    rut: `RUT Receptor: ${fixture.rutReceptor}`,
    monto: `Monto: $ ${fixture.monto.toLocaleString("es-CL")} CLP`,
    estado: ESTADO_PRUEBA_UI
  };

  await this.attach(JSON.stringify({ expected }, null, 2), "application/json");

  for (const value of Object.values(expected)) {
    await expect(dialog, `El detalle debió contener "${value}"`).toContainText(value);
  }

  await this.attach(
    JSON.stringify({ expected, observedText: await dialog.innerText() }, null, 2),
    "application/json"
  );
});
