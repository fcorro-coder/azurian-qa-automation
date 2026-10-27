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

import type { DocumentFixture, DocumentInput } from "../types/documents";

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
  /**
   * RUT del receptor propio de este escenario, generado en el hook `Before`.
   * Todos los documentos que el escenario cree comparten este RUT; ningún otro
   * escenario de la corrida lo reutiliza.
   */
  rutReceptor?: string;
  /** Cuerpo que los pasos API envían a POST/PUT /api/documents. */
  documentData?: DocumentInput;
  /** Documento principal que un escenario UI crea y verifica. */
  documentFixture?: DocumentFixture;
  /** Segundo documento del mismo RUT: solo lo crea el escenario de consulta. */
  secondaryDocumentFixture?: DocumentFixture;
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

      if (this.documentData && (method === "POST" || method === "PUT" || method === "PATCH")) {
        await this.attach(
          JSON.stringify(sanitize({ method, request: this.documentData }), null, 2),
          { mediaType: "application/json", fileName: "Solicitud API.json" }
        );
      }
      await this.attach(
        JSON.stringify(evidence, null, 2),
        { mediaType: "application/json", fileName: `Obtenido API ${method} ${response.status()}.json` }
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

