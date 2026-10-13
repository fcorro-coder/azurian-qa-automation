import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { DocumentsClient } from "../../api/clients/documents.client";
import { assertNotFound, assertList } from "../../validators/document-contract";
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

When("elimino el documento pendiente", async function (this: CustomWorld) {
  assert.ok(this.documentId, "No existe un documento para eliminar");

  const client = getClient(this);
  // Registrar el método HTTP para las evidencias de Allure
  this.responseMethod = "DELETE";
  this.response = await client.delete(this.documentId);
});

Then("la eliminación debe responder con código {int}", async function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe respuesta de eliminación");

  const responseText = await this.response.text();

  assert.equal(
    this.response.status(),
    status,
    `HTTP esperado: ${status}; obtenido: ${this.response.status()}; respuesta: ${responseText}`
  );

  assert.equal(
    responseText,
    "",
    "La eliminación debe devolver un cuerpo vacío"
  );
});

Then("el documento eliminado ya no debe estar disponible", async function (this: CustomWorld) {
  assert.ok(this.documentId, "No existe el identificador del documento");

  const client = getClient(this);
  const response = await client.getById(this.documentId);
  const responseText = await response.text();

  assert.equal(
    response.status(),
    404,
    `El documento eliminado continúa disponible. HTTP ${response.status()}: ${responseText}`
  );

  const body: unknown = JSON.parse(responseText);

  assert.ok(
    typeof body === "object" &&
      body !== null &&
      "code" in body &&
      body.code === "NOT_FOUND",
    `Se esperaba el código NOT_FOUND. Respuesta: ${responseText}`
  );

  assertNotFound(body);
  await this.attachApiEvidence(response, "GET");

  const listResponse = await client.list();
  assert.equal(listResponse.status(), 200, "No se pudo consultar el listado después de DELETE");
  const listBody: unknown = await listResponse.json();
  assertList(listBody);
  assert.ok(!listBody.some((item: unknown) => typeof item === "object" && item !== null && "id" in item && String(item.id) === this.documentId), "El documento eliminado sigue presente en el listado");
  await this.attachApiEvidence(listResponse, "GET");
});
