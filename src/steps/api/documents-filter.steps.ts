import { Given, When, Then } from "@cucumber/cucumber";
import { randomInt } from "node:crypto";
import assert from "node:assert/strict";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument, assertList } from "../../validators/document-contract";
import type { CustomWorld } from "../../fixtures/custom-world";

function client(world: CustomWorld): DocumentsClient {
  assert.ok(world.apiContext && world.authToken && world.runId);
  return new DocumentsClient(world.apiContext, world.authToken, world.runId);
}
Given("existen documentos propios para consultar por filtros", async function (this: CustomWorld) {
  const data = { tipoDte: "DTE 33", folio: randomInt(100000, 9999999), rutReceptor: "76.086.428-5", monto: 150000, fechaEmision: new Date().toISOString().slice(0, 10), deliveryChannel: "PORTAL", sendCopy: false };
  const response = await client(this).create(data);
  assert.equal(response.status(), 201, await response.text());
  const body: unknown = await response.json();
  assertDocument(body, { ...data, estado: "PENDIENTE", contactEmail: null, observaciones: null, attachmentName: null });
  this.documentData = data;
  this.documentId = String((body as Record<string, unknown>).id);
  await this.attachApiEvidence(response, "POST");
});
When("filtro documentos por RUT y tipo DTE", async function (this: CustomWorld) {
  this.responseMethod = "GET";
  this.response = await client(this).list({ rut: "76086428-5", tipoDte: "DTE 33" });
});
Then("el listado filtrado contiene el folio esperado y su detalle completo", async function (this: CustomWorld) {
  assert.ok(this.response && this.documentData && this.documentId);
  assert.equal(this.response.status(), 200, await this.response.text());
  const data: unknown = await this.response.json();
  assertList(data);
  const total = this.response.headers()["x-total-count"];
  assert.match(total ?? "", /^\d+$/, "x-total-count debe ser numérico");
  const items = data as Record<string, unknown>[];
  assert.equal(Number(total), items.length, "Total de resultados inconsistente");
  const matches = items.filter(item => item.folio === this.documentData?.folio && item.rutReceptor === this.documentData?.rutReceptor);
  assert.equal(matches.length, 1, "El folio y RUT deben identificar exactamente un documento");
  assertDocument(matches[0], { ...this.documentData, id: this.documentId, estado: "PENDIENTE" });
  const detail = await client(this).getById(this.documentId);
  assert.equal(detail.status(), 200, await detail.text());
  const detailBody: unknown = await detail.json();
  assertDocument(detailBody, matches[0]);
  await this.attachApiEvidence(detail, "GET");
});
