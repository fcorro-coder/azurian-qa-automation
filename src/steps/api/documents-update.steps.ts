import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument } from "../../validators/document-contract";
import { ESTADO_PRUEBA_API, EXPECTED_API_SIN_ADJUNTOS, createDocumentInput, randomFolio } from "../../fixtures/test-data";
import type { CustomWorld } from "../../fixtures/custom-world";

function getClient(world: CustomWorld): DocumentsClient {
  assert.ok(world.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(world.authToken, "No existe un JWT");
  assert.ok(world.runId, "No existe un runId");

  return new DocumentsClient(
    world.apiContext,
    world.authToken,
    world.runId
  );
}

Given("existe un documento pendiente creado para la prueba", async function (this: CustomWorld) {
  const client = getClient(this);

  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");
  this.documentData = createDocumentInput(randomFolio(), this.rutReceptor);

  const response = await client.create(this.documentData);
  const responseText = await response.text();

  assert.equal(
    response.status(),
    201,
    `No se pudo preparar el documento. HTTP ${response.status()}: ${responseText}`
  );

  const body: unknown = JSON.parse(responseText);

  assert.ok(
    typeof body === "object" && body !== null && "id" in body,
    "La creación no devolvió un identificador"
  );

  assert.ok(
    "estado" in body && body.estado === ESTADO_PRUEBA_API,
    "El documento preparado debe estar PENDIENTE"
  );

  this.documentId = String(body.id);
});

When("actualizo el monto del documento a {int}", async function (this: CustomWorld, monto: number) {
  assert.ok(this.documentId, "No existe un documento para actualizar");
  assert.ok(this.documentData, "No existen datos originales");

  const client = getClient(this);

  this.documentData = {
    ...this.documentData,
    monto,
  };

  // Registrar el método HTTP para las evidencias de Allure
  this.responseMethod = "PUT";
  this.response = await client.update(this.documentId, this.documentData);
});

Then("la actualización debe responder con código {int}", async function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe respuesta de actualización");

  const responseText = await this.response.text();

  assert.equal(
    this.response.status(),
    status,
    `HTTP esperado: ${status}; obtenido: ${this.response.status()}; respuesta: ${responseText}`
  );
  if (status === 200 && this.documentData && this.documentId) {
    assertDocument(JSON.parse(responseText) as unknown, { ...this.documentData, id: this.documentId, ...EXPECTED_API_SIN_ADJUNTOS });
  }
});

Then("el documento debe conservar el monto actualizado", async function (this: CustomWorld) {
  assert.ok(this.documentId, "No existe ID del documento");
  assert.ok(this.documentData, "No existen datos esperados");

  const client = getClient(this);
  const response = await client.getById(this.documentId);
  const responseText = await response.text();

  assert.equal(
    response.status(),
    200,
    `No se pudo recuperar el documento actualizado: ${responseText}`
  );

  const body: unknown = JSON.parse(responseText);
  assertDocument(body, { ...this.documentData, id: this.documentId, ...EXPECTED_API_SIN_ADJUNTOS });

  assert.ok(
    typeof body === "object" && body !== null && "monto" in body,
    "La respuesta no contiene el monto"
  );

  for (const key of ["tipoDte", "folio", "rutReceptor", "monto", "fechaEmision", "deliveryChannel", "sendCopy"] as const) {
    assert.equal(body[key], this.documentData[key], `El campo ${key} no se conservó tras PUT`);
  }
  await this.attachApiEvidence(response, "GET");
});
