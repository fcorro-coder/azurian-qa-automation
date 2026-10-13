import { Given, When, Then } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { config } from "../../config/env";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que el laboratorio Azurian está configurado", function () {
  assert.ok(config.apiBaseUrl, "La URL de la API es obligatoria");
});

When("consulto el estado de salud de la API", async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    timeout: 15000,
  });
  // Registrar el método HTTP para las evidencias de Allure
  this.responseMethod = "GET";
  this.response = await this.apiContext.get(`${config.apiBaseUrl}/health`);
});

Then("la API debe responder con código {int}", function (this: CustomWorld, status: number) {
  assert.ok(this.response, "No existe una respuesta HTTP");
  assert.equal(this.response.status(), status);
});

Then("el estado del laboratorio debe ser {string}", async function (this: CustomWorld, estado: string) {
  assert.ok(this.response, "No existe una respuesta HTTP");

  this.responseBody = await this.response.json();

  const body = this.responseBody;

  assert.ok(
    typeof body === "object" && body !== null && "status" in body,
    "La respuesta no contiene la propiedad status"
  );

  assert.equal(body.status, estado);
});
