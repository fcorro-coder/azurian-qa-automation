import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { DocumentFormPage } from "../../pages/document-form.page";
import type { CustomWorld } from "../../fixtures/custom-world";

When("abro el formulario de nuevo documento", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const form = new DocumentFormPage(this.page);
  await form.openCreateForm();
});

Then("debo visualizar los campos obligatorios de creación", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const form = new DocumentFormPage(this.page);
  await form.validateCreateForm();
});

When("completo los datos válidos del documento", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const folio = Math.floor(Math.random() * 9000000) + 1000000;

  this.documentData = {
    folio,
    rutReceptor: "76.086.428-5",
    monto: 150000
  };

  const form = new DocumentFormPage(this.page);
  await form.fillValidDocument(folio);
});

When("guardo el documento desde la interfaz", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

  const form = new DocumentFormPage(this.page);
  await form.saveDocument();
});

Then("debo encontrar el documento creado en el listado", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento creado");

  const folio = this.documentData.folio;

  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const searchInput = this.page.getByRole("textbox", {
    name: /Buscar por RUT Receptor/i
  });

  await searchInput.fill(String(this.documentData.rutReceptor));

  await this.page.getByRole("button", {
    name: "Buscar",
    exact: true
  }).click();

  const row = this.page.getByRole("row").filter({
    hasText: `#${folio}`
  });

  await expect(row).toBeVisible();
  await expect(row).toContainText("DTE 33");
  await expect(row).toContainText(String(this.documentData.rutReceptor));
  await expect(row).toContainText(Number(this.documentData.monto).toLocaleString("es-CL"));
  await expect(row).toContainText("Pendiente");
});

