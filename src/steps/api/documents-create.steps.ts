import { When, Then, type DataTable } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument } from "../../validators/document-contract";
import { EXPECTED_API_SIN_ADJUNTOS, createDocumentInput, randomFolio } from "../../fixtures/test-data";
import { DTE_TYPE_VALUES, type DteType } from "../../types/documents";
import type { CustomWorld } from "../../fixtures/custom-world";

/** Toma el tipo DTE de la tabla del escenario; falla si la tabla declara uno desconocido. */
function parseTipoDte(value: string): DteType {
  const tipo = DTE_TYPE_VALUES.find((option) => option === value);
  assert.ok(tipo, `Tipo de DTE no soportado en la tabla del escenario: ${value}`);
  return tipo;
}

// Gherkin conserva los dos puntos finales del paso cuando viene acompañado de tabla.
When("creo un documento electrónico con los siguientes datos:", async function (this: CustomWorld, table: DataTable) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un JWT");
  assert.ok(this.runId, "No existe un runId");
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

  const rows = table.hashes();
  assert.equal(rows.length, 1, "La tabla debe declarar exactamente una fila de datos");

  const monto = Number(rows[0].monto);
  assert.ok(Number.isInteger(monto), "El monto de la tabla debe ser un entero en CLP");

  // Folio y RUT son datos de aislamiento (generados); tipo y monto vienen de Gherkin.
  this.documentData = {
    ...createDocumentInput(randomFolio(), this.rutReceptor),
    tipoDte: parseTipoDte(rows[0].tipoDte),
    monto
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

  assertDocument(body, { ...this.documentData, ...EXPECTED_API_SIN_ADJUNTOS });
  const created = body;

  assert.equal(created.tipoDte, this.documentData.tipoDte);
  assert.equal(created.folio, this.documentData.folio);
  assert.equal(created.rutReceptor, this.documentData.rutReceptor);
  assert.equal(created.monto, this.documentData.monto);
  assert.equal(created.fechaEmision, this.documentData.fechaEmision);
  assert.equal(created.deliveryChannel, this.documentData.deliveryChannel);
  assert.equal(created.sendCopy, this.documentData.sendCopy);
  // Aserción histórica del ID, conservada textualmente sobre una vista no tipada.
  const idValue: unknown = created.id;
  assert.ok(typeof idValue === "string" || typeof idValue === "number", "El ID debe ser texto o número");
  assert.ok(String(idValue).trim().length > 0, "El ID no puede estar vacío");

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

  assertDocument(document, { ...this.documentData, id: this.documentId, ...EXPECTED_API_SIN_ADJUNTOS });
  assert.equal(String(document.id), this.documentId);
  for (const key of ["tipoDte", "folio", "rutReceptor", "monto", "fechaEmision", "deliveryChannel", "sendCopy"] as const) {
    assert.equal(document[key], this.documentData[key], `El campo ${key} no coincide tras GET`);
  }
  await this.attachApiEvidence(response, "GET");
});
