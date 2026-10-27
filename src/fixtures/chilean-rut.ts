// Generación de RUT chilenos válidos para los escenarios.
//
// El laboratorio valida el RUT del receptor con el formato estricto
// `^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$` (puntos y guion obligatorios) y con el dígito
// verificador módulo 11, tanto en POST/PUT como en el formulario de la interfaz.
// Por eso el generador produce siempre un cuerpo de 8 dígitos con puntos.

import { randomInt } from "node:crypto";

const RUT_BODY_MIN = 10_000_000;
const RUT_BODY_MAX = 100_000_000;
const MAX_ATTEMPTS = 100;

/** RUT ya emitidos por este proceso: garantiza unicidad dentro de la misma corrida. */
const generatedRuts = new Set<string>();

/** Dígito verificador módulo 11 (SII de Chile) de un cuerpo de dígitos. */
export function computeRutCheckDigit(body: string): string {
  let sum = 0;
  let factor = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/** Da formato `12.345.678-9` a un cuerpo de 7 u 8 dígitos, con su verificador. */
export function formatRut(body: string): string {
  const formatted = `${body.slice(0, body.length - 6)}.${body.slice(-6, -3)}.${body.slice(-3)}`;
  return `${formatted}-${computeRutCheckDigit(body)}`;
}

/** Formato estricto del laboratorio y dígito verificador correcto. */
export function isValidRut(rut: string): boolean {
  if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(rut)) return false;

  // Los puntos son decorativos: el módulo 11 se calcula solo sobre los dígitos.
  const [body, checkDigit] = rut.replace(/\./g, "").split("-");
  return computeRutCheckDigit(body) === checkDigit.toUpperCase();
}

/**
 * RUT único de un escenario, con formato y verificador válidos.
 *
 * Un RUT mal formado se reporta de inmediato: es un defecto del generador, no una
 * condición transitoria, y debe fallar con mensaje claro en el hook en lugar de un
 * 400 del laboratorio durante la prueba. Solo la colisión con un RUT ya emitido en
 * esta corrida se resuelve sorteando otro valor.
 */
export function generateRut(): string {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const rut = formatRut(String(randomInt(RUT_BODY_MIN, RUT_BODY_MAX)));

    if (!isValidRut(rut)) {
      throw new Error(`El generador produjo un RUT inválido: ${rut}`);
    }

    if (generatedRuts.has(rut)) continue;

    generatedRuts.add(rut);
    return rut;
  }

  throw new Error(`No fue posible generar un RUT chileno único tras ${MAX_ATTEMPTS} intentos`);
}
