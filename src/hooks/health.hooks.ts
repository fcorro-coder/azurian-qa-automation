import { BeforeAll } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import { config } from "../config/env";
import { API_TIMEOUT_MS } from "../config/timeouts";

BeforeAll(async function () {
  const api = await request.newContext({ timeout: API_TIMEOUT_MS });
  try {
    const response = await api.get(`${config.apiBaseUrl}/health`);
    if (response.status() !== 200) {
      throw new Error(`Health-check: HTTP ${response.status()} en ${config.apiBaseUrl}/health`);
    }
  } catch (error) {
    throw new Error(`Laboratorio Azurian no disponible en ${config.apiBaseUrl}: ${String(error)}`);
  } finally {
    await api.dispose();
  }
});
