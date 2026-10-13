import assert from "node:assert/strict";

export const DOCUMENT_KEYS = ["id", "tipoDte", "folio", "rutReceptor", "monto", "fechaEmision", "estado", "contactEmail", "sendCopy", "deliveryChannel", "observaciones", "attachmentName", "createdAt", "updatedAt"] as const;

export function record(value: unknown, label: string): Record<string, unknown> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), `${label} debe ser un objeto JSON`);
  return value as Record<string, unknown>;
}

export function assertDocument(value: unknown, expected: Record<string, unknown>): void {
  const actual = record(value, "Documento");
  assert.deepEqual(Object.keys(actual).sort(), [...DOCUMENT_KEYS].sort(), "Contrato: campos faltantes o adicionales");
  const id = actual.id;
  assert.equal(typeof id, "string", "El ID debe ser texto");
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const seedPattern = /^qa_[a-f0-9]{32}-seed-\d+(?:-\d+)?$/i;
  assert.ok(uuidPattern.test(String(id)) || seedPattern.test(String(id)), `ID con formato no reconocido: ${actual.id}`);
  for (const field of ["createdAt", "updatedAt"] as const) {
    assert.equal(typeof actual[field], "string", `${field} debe ser texto`);
    assert.ok(!Number.isNaN(Date.parse(actual[field] as string)), `${field} debe ser una fecha ISO válida`);
  }
  assert.ok(["PENDIENTE", "ACEPTADO", "RECHAZADO"].includes(String(actual.estado)), "Estado no reconocido");
  for (const field of ["contactEmail", "observaciones", "attachmentName"]) {
    assert.ok(actual[field] === null || typeof actual[field] === "string", `${field} debe ser texto o null`);
  }
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(actual[key], value, `Campo ${key} distinto`);
}

export function assertNotFound(value: unknown): void {
  const actual = record(value, "Error 404");
  assert.deepEqual(Object.keys(actual).sort(), ["error", "code"].sort(), "Contrato de error 404 inesperado");
  assert.equal(actual.code, "NOT_FOUND");
  assert.equal(typeof actual.error, "string");
  assert.ok((actual.error as string).length > 0);
}

export function assertList(value: unknown): asserts value is Record<string, unknown>[] {
  assert.ok(Array.isArray(value), "El listado debe ser un arreglo");
  for (const item of value) assertDocument(item, {});
}
