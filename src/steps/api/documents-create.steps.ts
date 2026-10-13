import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument } from "../../validators/document-contract";
import type { CustomWorld } from "../../fixtures/custom-world";

When("creo un documento electrónico con datos válidos", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un JWT");
  assert.ok(this.runId, "No existe un runId");

  this.documentData = {
    tipoDte: "DTE 33",
    folio: randomInt(100000, 9999999),
    rutReceptor: "76.086.428-5",
    monto: 150000,
    fechaEmision: new Date().toISOString().slice(0, 10),
    deliveryChannel: "PORTAL",
    sendCopy: false,
  };

  const client = new DocumentsClient(
    this.apiContext,
    this.authToken,
    this.runId
  );

  // Registrar el método HTTP para las evidencias de Allure
this.responseMethod = "POST";

  this.response = await client.create(this.documentData);
});

Then("la creación debe responder con código {int}", async function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe una respuesta HTTP");

  const responseBody = await this.response.text();

  assert.equal(
    this.response.status(),
    status,
    `HTTP esperado: ${status}; obtenido: ${this.response.status()}; respuesta: ${responseBody}`
  );
});

Then("el documento creado debe conservar sus datos", async function (this: CustomWorld) {
  assert.ok(this.response, "No existe una respuesta HTTP");
  assert.ok(this.documentData, "No existen datos de prueba");

  const body: unknown = await this.response.json();

  assert.ok(
    typeof body === "object" && body !== null,
    "La respuesta debe ser un objeto JSON"
  );

  assert.ok("id" in body, "La respuesta no contiene el identificador");

  const created = body as Record<string, unknown>;

  assertDocument(body, { ...this.documentData, estado: "PENDIENTE", contactEmail: null, observaciones: null, attachmentName: null });
  assert.equal(created.tipoDte, this.documentData.tipoDte);
  assert.equal(created.folio, this.documentData.folio);
  assert.equal(created.rutReceptor, this.documentData.rutReceptor);
  assert.equal(created.monto, this.documentData.monto);
  assert.equal(created.fechaEmision, this.documentData.fechaEmision);
  assert.equal(created.deliveryChannel, this.documentData.deliveryChannel);
  assert.equal(created.sendCopy, this.documentData.sendCopy);
  assert.ok(typeof created.id === "string" || typeof created.id === "number", "El ID debe ser texto o número");
  assert.ok(String(created.id).trim().length > 0, "El ID no puede estar vacío");

  this.documentId = String(created.id);
});



Then("puedo recuperar el documento creado por su identificador", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un JWT");
  assert.ok(this.runId, "No existe un runId");
  assert.ok(this.documentId, "No existe el ID del documento creado");
  assert.ok(this.documentData, "No existen datos de prueba");

  const client = new DocumentsClient(
    this.apiContext,
    this.authToken,
    this.runId
  );

  const response = await client.getById(this.documentId);
  const responseText = await response.text();

  assert.equal(
    response.status(),
    200,
    `No se pudo recuperar el documento. HTTP ${response.status()}: ${responseText}`
  );

  const document: unknown = JSON.parse(responseText);

  assert.ok(
    typeof document === "object" && document !== null,
    "El documento recuperado debe ser un objeto JSON"
  );

  assert.ok("id" in document, "El documento no contiene ID");
  assert.ok("folio" in document, "El documento no contiene folio");

  assertDocument(document, { ...this.documentData, id: this.documentId, estado: "PENDIENTE", contactEmail: null, observaciones: null, attachmentName: null });
  assert.equal(String(document.id), this.documentId);
  for (const key of ["tipoDte", "folio", "rutReceptor", "monto", "fechaEmision", "deliveryChannel", "sendCopy"]) {
    assert.equal((document as Record<string, unknown>)[key], this.documentData[key], `El campo ${key} no coincide tras GET`);
  }
  await this.attachApiEvidence(response, "GET");
});
