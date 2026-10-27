/** Límites configurables: esperas ligadas a eventos, nunca pausas fijas. */
function milliseconds(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1000 || value > 120000) {
    throw new Error(`${name} debe ser un entero entre 1000 y 120000 ms`);
  }
  return value;
}
export const API_TIMEOUT_MS = milliseconds("API_TIMEOUT_MS", 15000);
export const UI_NETWORK_TIMEOUT_MS = milliseconds("UI_NETWORK_TIMEOUT_MS", 25000);
export const UI_SCENARIO_TIMEOUT_MS = milliseconds("UI_SCENARIO_TIMEOUT_MS", 60000);
