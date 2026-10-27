import { API_TIMEOUT_MS } from "../../config/timeouts";
import { Given, When, Then } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { config } from "../../config/env";
import { AuthClient } from "../../api/clients/auth.client";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que el cliente de autenticación está preparado", async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    timeout: API_TIMEOUT_MS,
  });
});

When("inicio sesión con las credenciales válidas", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");

  const authClient = new AuthClient(this.apiContext);
  const loginResult = await authClient.login();
  this.authToken = loginResult.token;

  // Evidencia de la llamada POST /auth/login: el sanitizador de CustomWorld
  // enmascara el token, password y email en los adjuntos de Allure.
  this.response = loginResult.response;
  this.responseMethod = "POST";
  await this.attachApiEvidence(loginResult.response, "POST");
});

Then("debo recibir un token de autenticación", function (this: CustomWorld) {
  assert.ok(this.authToken, "No se recibió un token de autenticación");
  assert.ok(this.authToken.length > 0, "El token está vacío");
  assert.equal(
    this.authToken.split(".").length,
    3,
    "El token debe tener formato JWT (tres partes separadas por puntos)"
  );
});

Then("puedo consultar mi información con el token recibido", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");
  assert.ok(this.authToken, "No existe un token de autenticación");

  const response = await this.apiContext.get(
    `${config.apiBaseUrl}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    }
  );

  this.response = response;
  this.responseMethod = "GET";
  await this.attachApiEvidence(response, "GET");

  const responseText = await response.text();

  assert.equal(
    response.status(),
    200,
    `El token no permitió consultar /auth/me. HTTP ${response.status()}: ${responseText}`
  );

  const body: unknown = JSON.parse(responseText);

  assert.ok(
    typeof body === "object" && body !== null,
    "La información del usuario debe ser un objeto JSON"
  );
});
