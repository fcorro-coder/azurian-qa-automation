import type { APIRequestContext } from "@playwright/test";
import assert from "node:assert/strict";
import { config } from "../../config/env";

interface LoginResponse {
  token: string;
}

export class AuthClient {
  constructor(private readonly api: APIRequestContext) {}

  async login(): Promise<string> {
    const response = await this.api.post(
      `${config.apiBaseUrl}/auth/login`,
      {
        data: {
          email: config.qaUser,
          password: config.qaPassword,
        },
      }
    );

    const responseText = await response.text();

    assert.equal(
      response.status(),
      200,
      `Error de autenticación. HTTP ${response.status()}: ${responseText}`
    );

    const body: unknown = JSON.parse(responseText);

    assert.ok(
      typeof body === "object" &&
        body !== null &&
        "token" in body &&
        typeof body.token === "string" &&
        body.token.length > 0,
      "La autenticación no devolvió un token JWT válido"
    );

    return (body as LoginResponse).token;
  }
}
