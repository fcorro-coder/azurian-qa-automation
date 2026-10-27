import assert from "node:assert/strict";
import { DOCUMENT_STATUS_VALUES, type DocumentDto } from "../types/documents";

export const DOCUMENT_KEYS = ["id", "tipoDte", "folio", "rutReceptor", "monto", "fechaEmision", "estado", "contactEmail", "sendCopy", "deliveryChannel", "observaciones", "attachmentName", "createdAt", "updatedAt"] as const;

export function record(value: unknown, label: string): Record<string, unknown> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), `${label} debe ser un objeto JSON`);
  return value as Record<string, unknown>;
}

/**
 * Valida el contrato completo de un documento y estrecha el valor a DocumentDto,
 * de modo que los pasos puedan leer sus campos sin casts. El orden y los mensajes
 * de cada comprobación son los mismos que siempre tuvo.
 */
export function assertDocument(value: unknown, expected: Record<string, unknown>): asserts value is DocumentDto {
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
  assert.ok((DOCUMENT_STATUS_VALUES as readonly string[]).includes(String(actual.estado)), "Estado no reconocido");
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

export function assertList(value: unknown): asserts value is DocumentDto[] {
  assert.ok(Array.isArray(value), "El listado debe ser un arreglo");
  for (const item of value) assertDocument(item, {});
}

export function assertValidationError(value: unknown, expectedField: string, expectedMessage: string): void {
  const actual = record(value, "Error 400");
  assert.deepEqual(Object.keys(actual).sort(), ["code", "details", "error"].sort(), "Contrato de error 400 inesperado");
  assert.equal(actual.code, "VALIDATION_ERROR", "El código del error 400 debe ser VALIDATION_ERROR");
  assert.equal(actual.error, "Datos de entrada inválidos. Revisa los campos indicados.", "Mensaje general del error 400 distinto");
  assert.ok(Array.isArray(actual.details), "El error 400 debe incluir un arreglo details");
  const details = actual.details as Array<Record<string, unknown>>;
  assert.equal(details.length, 1, "El error 400 debía detallar exactamente un campo inválido");
  const detail = record(details[0], "Detalle de error 400");
  assert.deepEqual(Object.keys(detail).sort(), ["field", "message"].sort(), "Contrato del detalle de error 400 inesperado");
  assert.equal(detail.field, expectedField, "El detalle del error 400 señala otro campo");
  assert.equal(detail.message, expectedMessage, `Mensaje de validación distinto para ${expectedField}`);
}

export function assertUnauthorized(value: unknown, expectedMessage: string): void {
  const actual = record(value, "Error 401");
  assert.deepEqual(Object.keys(actual).sort(), ["code", "error"].sort(), "Contrato de error 401 inesperado");
  assert.equal(actual.code, "UNAUTHORIZED", "El código del error 401 debe ser UNAUTHORIZED");
  assert.equal(actual.error, expectedMessage, "Mensaje del error 401 distinto");
}

export function assertConflict(value: unknown, expectedCode: string, expectedMessage: string): void {
  const actual = record(value, "Error 409");
  assert.deepEqual(Object.keys(actual).sort(), ["code", "error"].sort(), "Contrato de error 409 inesperado");
  assert.equal(actual.code, expectedCode, "El código del error 409 no corresponde");
  assert.equal(actual.error, expectedMessage, "Mensaje del error 409 distinto");
}
