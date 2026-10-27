import { API_TIMEOUT_MS } from "../../config/timeouts";
import { Given, When, Then } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "../../config/env";
import { AuthClient } from "../../api/clients/auth.client";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument, assertList, assertNotFound } from "../../validators/document-contract";
import { ESTADO_PRUEBA_API, EXPECTED_API_SIN_ADJUNTOS, createDocumentInput, randomFolio } from "../../fixtures/test-data";
import type { DocumentDto } from "../../types/documents";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que tengo una sesión API autenticada", async function (this: CustomWorld) {
  assert.ok(this.runId, "No se generó el identificador del escenario");

  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    timeout: API_TIMEOUT_MS,
  });

  this.authToken = (await new AuthClient(this.apiContext).login()).token;
});

Given("existen documentos propios para consultar el listado", async function (this: CustomWorld) {
  assert.ok(this.runId, "No se generó el runId del escenario");
  assert.ok(this.rutReceptor, "No se generó el RUT del escenario");
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un JWT");

  const data = createDocumentInput(randomFolio(), this.rutReceptor);
  const documentsClient = new DocumentsClient(
    this.apiContext,
    this.authToken,
    this.runId
  );
  this.responseMethod = "POST";
  this.response = await documentsClient.create(data);
  await this.attachApiEvidence(this.response, "POST");
  assert.equal(this.response.status(), 201, `HTTP ${this.response.status()}: ${await this.response.text()}`);
  const body: unknown = await this.response.json();
  assertDocument(body, { ...data, ...EXPECTED_API_SIN_ADJUNTOS });
  this.documentData = data;
  this.documentId = (body as { id: string }).id;
});

When("consulto el listado de documentos", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un JWT");
  assert.ok(this.runId, "No existe un runId");

  const documentsClient = new DocumentsClient(
    this.apiContext,
    this.authToken,
    this.runId
  );
  // Registrar el método HTTP para las evidencias de Allure
  this.responseMethod = "GET";
  this.response = await documentsClient.list();
  await this.attachApiEvidence(this.response, "GET");
});

Then(
  "la consulta de documentos debe responder con código {int}",
  function (this: CustomWorld, status: number) {
    assert.ok(this.response, "No existe una respuesta HTTP");
    assert.equal(
      this.response.status(),
      status,
      `HTTP esperado: ${status}; obtenido: ${this.response.status()}`
    );
  }
);

Then("debo recibir un listado de documentos", async function (this: CustomWorld) {
  assert.ok(this.response, "No existe una respuesta HTTP");

  this.responseBody = await this.response.json();

  assertList(this.responseBody);
  const total = this.response.headers()["x-total-count"];
  assert.match(total ?? "", /^\d+$/, "Falta x-total-count numérico");
});

Then("el listado contiene mi documento con los datos correctos", async function (this: CustomWorld) {
  assert.ok(this.response, "No existe una respuesta HTTP del listado");
  assert.ok(this.documentData, "No existen datos de prueba");
  assert.ok(this.documentId, "No se capturó el ID del documento creado");
  assert.ok(this.responseBody, "No se almacenó el listado");

  // Validar únicamente los registros propios del escenario,
  // sin depender de documentos creados por otras ejecuciones.
  const items = this.responseBody as DocumentDto[];
  const matches = items.filter(
    (item) =>
      item.id === this.documentId &&
      item.folio === this.documentData?.folio &&
      item.rutReceptor === this.documentData?.rutReceptor
  );
  assert.equal(
    matches.length,
    1,
    "El documento creado no aparece exactamente una vez en el listado"
  );
  assertDocument(matches[0], {
    ...this.documentData,
    id: this.documentId,
    estado: ESTADO_PRUEBA_API,
  });
});

When("consulto un documento con identificador inexistente", async function (this: CustomWorld) {
  assert.ok(this.apiContext && this.authToken && this.runId);
  const client = new DocumentsClient(this.apiContext, this.authToken, this.runId);
  this.responseMethod = "GET";
  this.response = await client.getById(randomUUID());
  await this.attachApiEvidence(this.response, "GET");
});

Then("la consulta individual debe responder con código {int}", async function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe respuesta HTTP");
  assert.equal(this.response.status(), status, `HTTP esperado ${status}; obtenido ${this.response.status()}: ${await this.response.text()}`);
  if (status === 404) assertNotFound(await this.response.json() as unknown);
});
