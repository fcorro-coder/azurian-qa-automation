import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentDeletePage } from "../../pages/document-delete.page";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("creo un documento pendiente para eliminar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.runId, "No existe un runId para aislar la prueba");

  const folio = randomInt(1000000, 9999999);
  const form = new DocumentFormPage(this.page);

  await form.openCreateForm();
  await form.fillValidDocument(folio);
  await form.saveDocument();

  this.documentData = {
    folio,
    monto: 150000,
    rutReceptor: "76.086.428-5"
  };

  const searchInput = this.page.getByRole("textbox", {
    name: /Buscar por RUT Receptor/i
  });

  await searchInput.fill("76.086.428-5");

  await this.page.getByRole("button", {
    name: "Buscar",
    exact: true
  }).click();

  const row = this.page.getByRole("row").filter({
    hasText: `#${folio}`
  });

  await expect(row).toBeVisible();
  await expect(row).toContainText("Pendiente");
});

When("elimino el documento desde la interfaz", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const deletePage = new DocumentDeletePage(this.page);
  await deletePage.deleteDocument(folio);
});

Then("el documento eliminado no debe aparecer en el listado", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos esperados");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const row = this.page.getByRole("row").filter({
    hasText: `#${folio}`
  });

  await expect(row).toHaveCount(0);

  await this.page.reload();

  const searchInput = this.page.getByRole("textbox", {
    name: /Buscar por RUT Receptor/i
  });

  await searchInput.fill("76.086.428-5");

  await this.page.getByRole("button", {
    name: "Buscar",
    exact: true
  }).click();

  await expect(row).toHaveCount(0);
});
