import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { DocumentFormPage } from "../../pages/document-form.page";
import { DocumentEditPage } from "../../pages/document-edit.page";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("creo un documento pendiente para actualizar", async function (this: CustomWorld) {
  assert.ok(this.page, "No existe una página de navegador");

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

When("modifico su monto a {int} desde la interfaz", async function (
  this: CustomWorld,
  monto: number
) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos del documento");

  const folio = this.documentData.folio;
  assert.ok(typeof folio === "number", "El folio debe ser numérico");

  const editPage = new DocumentEditPage(this.page);

  await editPage.openEditForm(folio);
  await editPage.updateAmount(monto);

  this.documentData.monto = monto;
});

Then("debo visualizar el monto actualizado en el listado", async function (
  this: CustomWorld
) {
  assert.ok(this.page, "No existe una página de navegador");
  assert.ok(this.documentData, "No existen datos esperados");

  const folio = this.documentData.folio;
  const monto = this.documentData.monto;

  assert.ok(typeof folio === "number");
  assert.ok(typeof monto === "number");

  const row = this.page.getByRole("row").filter({
    hasText: `#${folio}`
  });

  await expect(row).toBeVisible();

  await expect(row).toContainText(monto.toLocaleString("es-CL"));
  await expect(row).toContainText(String(this.documentData.rutReceptor));

  await this.page.reload();
  const searchInput = this.page.getByRole("textbox", { name: /Buscar por RUT Receptor/i });
  await searchInput.fill("76.086.428-5");
  await this.page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(row).toBeVisible();
  await expect(row).toContainText(monto.toLocaleString("es-CL"));
  await expect(row).toContainText(String(this.documentData.rutReceptor));
});
