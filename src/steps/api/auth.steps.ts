import { Given, When, Then } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import assert from "node:assert/strict";
import { config } from "../../config/env";
import { AuthClient } from "../../api/clients/auth.client";
import type { CustomWorld } from "../../fixtures/custom-world";

Given("que el cliente de autenticación está preparado", async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    timeout: 15000,
  });
});

When("inicio sesión con las credenciales válidas", async function (this: CustomWorld) {
  assert.ok(this.apiContext, "El cliente HTTP no está inicializado");

  const authClient = new AuthClient(this.apiContext);
  this.authToken = await authClient.login();
});

Then("debo recibir un token de autenticación", function (this: CustomWorld) {
  assert.ok(this.authToken, "No se recibió un token de autenticación");
  assert.ok(this.authToken.length > 0, "El token está vacío");
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
