import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DocumentsPage } from "../../pages/documents.page";
import { DocumentFormPage } from "../../pages/document-form.page";
import type { CustomWorld } from "../../fixtures/custom-world";

const RUT_RECEPTOR = "76.086.428-5";
const TIPO_DTE = "DTE 33";
const ESTADO_PENDIENTE = "Pendiente";
const MONTO = 150000;

Given("que ingreso al portal Azurian con credenciales válidas", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  await new LoginPage(this.page).login();
});

Given("que existen dos documentos propios con el mismo RUT para consultar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const folio = randomInt(1000000, 9999999);
  const otroFolio = randomInt(1000000, 9999999);
  assert.notEqual(folio, otroFolio);

  const form = new DocumentFormPage(this.page);
  const documents = new DocumentsPage(this.page);

  for (const numero of [folio, otroFolio]) {
    await documents.runAndWaitForListRefresh(async () => {
      await form.openCreateForm();
      await form.fillValidDocument(numero);
      await form.saveDocument();
    });
  }

  this.documentData = {
    folio,
    otroFolio,
    rutReceptor: RUT_RECEPTOR,
    monto: MONTO,
    tipoDte: TIPO_DTE
  };
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
  assert.ok(this.page && this.documentData);
  await new DocumentsPage(this.page).searchByRut(String(this.documentData.rutReceptor));
});

Then("identifico el folio exacto entre varios documentos del mismo RUT", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData);

  const folio = Number(this.documentData.folio);
  const otroFolio = Number(this.documentData.otroFolio);
  const rut = String(this.documentData.rutReceptor);
  const documents = new DocumentsPage(this.page);

  // El filtro devolvió exactamente los dos documentos propios del escenario.
  await documents.expectResultsCount(2);

  await documents.expectDocumentRow(folio, {
    rut,
    tipoDte: TIPO_DTE,
    monto: MONTO,
    estado: ESTADO_PENDIENTE
  });

  const otraFila = documents.rowByFolioText(otroFolio);
  await expect(otraFila, `Debió existir exactamente una fila para el folio #${otroFolio}`).toHaveCount(1);
  await expect(otraFila).toContainText(rut);
  await expect(otraFila).toContainText(TIPO_DTE);
  await expect(otraFila).toContainText(MONTO.toLocaleString("es-CL"));

  await documents.expectNoErrors();

  await this.attach(
    JSON.stringify(
      {
        filtroRut: rut,
        foliosEsperados: [folio, otroFolio],
        totalEsperado: 2,
        filaObjetivo: await documents.rowByFolioText(folio).innerText(),
        filaCompuesta: await otraFila.innerText()
      },
      null,
      2
    ),
    "application/json"
  );
});

When("abro el detalle del folio exacto", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData);

  const dialog = await new DocumentsPage(this.page).openDetail(Number(this.documentData.folio));
  await this.attach(`Detalle abierto para folio ${this.documentData.folio}`, "text/plain");
  await expect(dialog).toBeVisible();
});

Then("el detalle debe mostrar el folio, RUT, tipo y monto correctos", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData);

  const folio = Number(this.documentData.folio);
  const rut = String(this.documentData.rutReceptor);
  const dialog = this.page.getByRole("dialog");

  const expected = {
    titulo: `Detalle DTE - Folio #${folio}`,
    tipo: `Tipo: ${TIPO_DTE}`,
    rut: `RUT Receptor: ${rut}`,
    monto: `Monto: $ ${MONTO.toLocaleString("es-CL")} CLP`,
    estado: ESTADO_PENDIENTE
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
