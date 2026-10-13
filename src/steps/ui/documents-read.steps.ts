import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DocumentsPage } from "../../pages/documents.page";
import { DocumentFormPage } from "../../pages/document-form.page";
import type { CustomWorld } from "../../fixtures/custom-world";

const rut = "76.086.428-5";

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
  for (const numero of [folio, otroFolio]) {
    await form.openCreateForm();
    await form.fillValidDocument(numero);
    await form.saveDocument();
  }
  this.documentData = { folio, otroFolio, rutReceptor: rut, monto: 150000, tipoDte: "DTE 33" };
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
  const documents = new DocumentsPage(this.page);
  const row = documents.rowByFolioText(folio);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(rut);
  await expect(row).toContainText("DTE 33");
  await expect(row).toContainText("150.000");
  await expect(documents.rowByFolioText(otroFolio)).toBeVisible();
});

When("abro el detalle del folio exacto", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData);
  const dialog = await new DocumentsPage(this.page).openDetail(Number(this.documentData.folio));
  await this.attach(`Detalle abierto para folio ${this.documentData.folio}`, "text/plain");
  await expect(dialog).toBeVisible();
});

Then("el detalle debe mostrar el folio, RUT, tipo y monto correctos", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData);
  const dialog = this.page.getByRole("dialog");
  const expected = {
    folio: String(this.documentData.folio),
    rut: String(this.documentData.rutReceptor),
    tipo: "DTE 33",
    monto: "150.000"
  };
  await this.attach(JSON.stringify({ expected }, null, 2), "application/json");
  for (const value of Object.values(expected)) {
    await expect(dialog).toContainText(value);
  }
  await this.attach(JSON.stringify({ expected, observedText: await dialog.innerText() }, null, 2), "application/json");
});
