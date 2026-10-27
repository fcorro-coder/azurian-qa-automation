import { When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "../../config/env";
import { DocumentsClient } from "../../api/clients/documents.client";
import {
  assertValidationError,
  assertUnauthorized,
  assertConflict,
} from "../../validators/document-contract";
import { createDocumentInput, randomFolio } from "../../fixtures/test-data";
import type { DocumentInput } from "../../types/documents";
import type { CustomWorld } from "../../fixtures/custom-world";

When(
  "intento crear un documento con el campo {string} y el valor {string}",
  async function (this: CustomWorld, field: string, value: string) {
    assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
    assert.ok(this.authToken, "No existe un JWT");
    assert.ok(this.runId, "No existe un runId");
    assert.ok(this.rutReceptor, "No se generó el RUT del escenario");

    const numericFields = new Set(["folio", "monto"]);
    const coerced = numericFields.has(field) ? Number(value) : value;
    const payload: DocumentInput = {
      ...createDocumentInput(randomFolio(), this.rutReceptor),
      ...({ [field]: coerced } as Partial<DocumentInput>),
    };
    this.documentData = payload;

    const client = new DocumentsClient(
      this.apiContext,
      this.authToken,
      this.runId
    );
    this.responseMethod = "POST";
    this.response = await client.create(payload);
  }
);

Then(
  "la respuesta de validación debe detallar el campo {string} con el mensaje {string}",
  async function (this: CustomWorld, field: string, message: string) {
    assert.ok(this.response, "No existe una respuesta HTTP");

    const body: unknown = await this.response.json();
    assertValidationError(body, field, message);
  }
);

When(
  "consulto el listado de documentos con la autenticación {string}",
  async function (this: CustomWorld, mode: string) {
    assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
    assert.ok(this.runId, "No existe un runId");

    this.responseMethod = "GET";

    if (mode === "sin-encabezado") {
      this.response = await this.apiContext.get(
        `${config.apiBaseUrl}/documents`,
        { headers: { "x-lab-run-id": this.runId } }
      );
      return;
    }

    assert.equal(
      mode,
      "token-invalido",
      `Modo de autenticación no reconocido: ${mode}`
    );
    const client = new DocumentsClient(
      this.apiContext,
      "token-invalido-qa",
      this.runId
    );
    this.response = await client.list();
  }
);

Then(
  "la respuesta de autorización debe detallar el mensaje {string}",
  async function (this: CustomWorld, message: string) {
    assert.ok(this.response, "No existe una respuesta HTTP");

    const body: unknown = await this.response.json();
    assertUnauthorized(body, message);
  }
);

When(
  "vuelvo a crear un documento con el mismo folio y el mismo runId",
  async function (this: CustomWorld) {
    assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
    assert.ok(this.authToken, "No existe un JWT");
    assert.ok(this.runId, "No existe un runId");
    assert.ok(this.documentData, "No existen datos de prueba");

    const client = new DocumentsClient(
      this.apiContext,
      this.authToken,
      this.runId
    );
    this.responseMethod = "POST";
    this.response = await client.create(this.documentData);
  }
);

Then(
  "la respuesta de conflicto debe detallar el mensaje {string}",
  async function (this: CustomWorld, message: string) {
    assert.ok(this.response, "No existe una respuesta HTTP");

    const body: unknown = await this.response.json();
    assertConflict(body, "DUPLICATE_FOLIO", message);
    await this.attachApiEvidence(this.response, "POST");
  }
);

When(
  "creo el mismo folio con un runId distinto",
  async function (this: CustomWorld) {
    assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
    assert.ok(this.authToken, "No existe un JWT");
    assert.ok(this.documentData, "No existen datos de prueba");

    const otherRunId = `qa_${randomUUID().replace(/-/g, "")}`;
    const client = new DocumentsClient(
      this.apiContext,
      this.authToken,
      otherRunId
    );
    this.responseMethod = "POST";
    this.response = await client.create(this.documentData);
  }
);
