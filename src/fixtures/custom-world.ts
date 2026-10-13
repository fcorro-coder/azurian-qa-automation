import type {
  Browser,
  BrowserContext,
  Page,
  APIRequestContext,
  APIResponse
} from "@playwright/test";

import {
  World,
  setWorldConstructor,
  type IWorldOptions
} from "@cucumber/cucumber";

const SENSITIVE_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "password",
  "clientsecret",
  "authorization",
  "cookie",
  "set-cookie"
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase())
          ? "[REDACTED]"
          : sanitize(item)
      ])
    );
  }

  return value;
}

export class CustomWorld extends World {
  browser?: Browser;
  browserContext?: BrowserContext;
  page?: Page;
  apiContext?: APIRequestContext;
  response?: APIResponse;
  // Método HTTP utilizado para registrar evidencias en Allure
  responseMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  responseBody?: unknown;
  authToken?: string;
  runId?: string;
  documentData?: Record<string, unknown>;
  documentId?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async attachApiEvidence(response: APIResponse, method = "NO_REGISTRADO"): Promise<void> {
    try {
      const responseText = await response.text();

      let body: unknown;

      try {
        body = sanitize(JSON.parse(responseText));
      } catch {
        body = "[Respuesta no JSON u omitida]";
      }

      const evidence = {
        method,
        endpoint: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        response: body
      };

      await this.attach(
        JSON.stringify(evidence, null, 2),
        "application/json"
      );
    } catch (error) {
      console.warn(
        "No fue posible adjuntar evidencia API:",
        error
      );
    }
  }
}

setWorldConstructor(CustomWorld);

