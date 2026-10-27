import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument, assertList } from "../../validators/document-contract";
import {
  ESTADO_PRUEBA_API,
  EXPECTED_API_SIN_ADJUNTOS,
  TIPO_DTE_PRUEBA,
  createDocumentInput,
  randomFolio
} from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

function client(world: CustomWorld): DocumentsClient {
  assert.ok(world.apiContext && world.authToken && world.runId);
  return new DocumentsClient(world.apiContext, world.authToken, world.runId);
}
Given("existen documentos propios para consultar por filtros", async function (this: CustomWorld) {
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const data = createDocumentInput(randomFolio(), this.rutReceptor);
  const response = await client(this).create(data);
  assert.equal(response.status(), 201, await response.text());
  const body: unknown = await response.json();
  assertDocument(body, { ...data, ...EXPECTED_API_SIN_ADJUNTOS });
  this.documentData = data;
  this.documentId = body.id;
  await this.attachApiEvidence(response, "POST");
});
When("filtro documentos por RUT y tipo DTE", async function (this: CustomWorld) {
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  this.responseMethod = "GET";
  // El laboratorio normaliza el filtro (sin puntos ni guion) y compara con el RUT almacenado.
  this.response = await client(this).list({ rut: this.rutReceptor, tipoDte: TIPO_DTE_PRUEBA });
});
Then("el listado filtrado contiene el folio esperado y su detalle completo", async function (this: CustomWorld) {
  assert.ok(this.response && this.documentData && this.documentId);
  assert.equal(this.response.status(), 200, await this.response.text());
  const data: unknown = await this.response.json();
  assertList(data);
  const total = this.response.headers()["x-total-count"];
  assert.match(total ?? "", /^\d+$/, "x-total-count debe ser numérico");
  const items = data;
  assert.equal(Number(total), items.length, "Total de resultados inconsistente");
  const matches = items.filter(item => item.folio === this.documentData?.folio && item.rutReceptor === this.documentData?.rutReceptor);
  assert.equal(matches.length, 1, "El folio y RUT deben identificar exactamente un documento");
  assertDocument(matches[0], { ...this.documentData, id: this.documentId, estado: ESTADO_PRUEBA_API });
  const detail = await client(this).getById(this.documentId);
  assert.equal(detail.status(), 200, await detail.text());
  const detailBody: unknown = await detail.json();
  assertDocument(detailBody, matches[0]);
  await this.attachApiEvidence(detail, "GET");
});
