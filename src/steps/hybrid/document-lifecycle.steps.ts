import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentsPage } from "../../pages/documents.page";
import { DocumentEditPage } from "../../pages/document-edit.page";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument } from "../../validators/document-contract";
import { ESTADO_PRUEBA_UI, EXPECTED_API_SIN_ADJUNTOS } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

function client(world: CustomWorld): DocumentsClient {
  assert.ok(world.apiContext && world.authToken && world.runId, "Falta sesión API autenticada");
  return new DocumentsClient(world.apiContext, world.authToken, world.runId);
}

When("consulto desde la interfaz el documento creado por API", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData, "Faltan página o datos del documento");
  await new DocumentsPage(this.page).searchByRut(this.documentData.rutReceptor);
});

Then("la interfaz debe mostrar los datos exactos del documento", async function (this: CustomWorld) {
  assert.ok(this.page && this.documentData, "Faltan página o datos del documento");
  const data = this.documentData;
  const documents = new DocumentsPage(this.page);
  await documents.expectResultsCount(1);
  await documents.expectDocumentRow(data.folio, {
    rut: data.rutReceptor, tipoDte: data.tipoDte, monto: data.monto, estado: ESTADO_PRUEBA_UI
  });
});

When("actualizo desde la interfaz el monto del documento híbrido a {int}", async function (this: CustomWorld, monto: number) {
  assert.ok(this.page && this.documentData, "Faltan página o datos del documento");
  const edit = new DocumentEditPage(this.page);
  const documents = new DocumentsPage(this.page);
  await edit.openEditForm(this.documentData.folio);
  await documents.runAndWaitForListRefresh(() => edit.updateAmount(monto));
  this.documentData = { ...this.documentData, monto };
  await documents.expectDocumentRow(this.documentData.folio, {
    rut: this.documentData.rutReceptor, tipoDte: this.documentData.tipoDte,
    monto, estado: ESTADO_PRUEBA_UI
  });
});

Then("el API debe reflejar el nuevo monto del documento híbrido", async function (this: CustomWorld) {
  assert.ok(this.documentId && this.documentData, "Faltan identificador o datos del documento");
  const response = await client(this).getById(this.documentId);
  assert.equal(response.status(), 200, `GET posterior a edición: ${await response.text()}`);
  const body: unknown = await response.json();
  assertDocument(body, { ...this.documentData, ...EXPECTED_API_SIN_ADJUNTOS, id: this.documentId });
  await this.attachApiEvidence(response, "GET");
});
