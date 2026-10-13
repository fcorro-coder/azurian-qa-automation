import { Given, When, Then } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "../../config/env";
import { AuthClient } from "../../api/clients/auth.client";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertDocument, assertList, assertNotFound } from "../../validators/document-contract";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que tengo una sesión API autenticada", async function (this: CustomWorld) {
  assert.ok(this.runId, "No se generó el identificador del escenario");

  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    timeout: 15000,
  });

  this.authToken = await new AuthClient(this.apiContext).login();
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

When("consulto un documento con identificador inexistente", async function (this: CustomWorld) {
  assert.ok(this.apiContext && this.authToken && this.runId);
  const client = new DocumentsClient(this.apiContext, this.authToken, this.runId);
  this.responseMethod = "GET";
  this.response = await client.getById(randomUUID());
});

Then("la consulta individual debe responder con código {int}", async function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe respuesta HTTP");
  assert.equal(this.response.status(), status, `HTTP esperado ${status}; obtenido ${this.response.status()}: ${await this.response.text()}`);
  if (status === 404) assertNotFound(await this.response.json() as unknown);
});
