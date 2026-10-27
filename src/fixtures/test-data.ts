// Fuente única de datos de prueba de los documentos.
//
// Todo valor fijo que más de un escenario o page object necesite vive aquí: los
// pasos y los page objects solo importan estas constantes. El RUT NO es una
// constante: cada escenario genera el suyo en el hook `Before` (ver
// chilean-rut.ts) y lo pasa a las fábricas de esta sección.

import { randomInt } from "node:crypto";
import type { DocumentFixture, DocumentInput, DocumentStatus, DteType } from "../types/documents";

// Rango de folios: por encima de los ~14.300 folios de los datos semilla y dentro
// de los límites del laboratorio (1..9.999.999), de modo que un folio generado
// nunca colisiona con un sembrado ni con otro escenario (aislado además por runId).
const FOLIO_MIN = 1_000_000;
const FOLIO_MAX = 9_999_999;

/** Tipo de DTE que emiten los escenarios (opción del formulario y filtro). */
export const TIPO_DTE_PRUEBA: DteType = "DTE 33";

/** Monto de los documentos creados por los escenarios. */
export const MONTO_PRUEBA = 150_000;

/** Estado que el API devuelve para un documento recién emitido. */
export const ESTADO_PRUEBA_API: DocumentStatus = "PENDIENTE";

/** Etiqueta visible en la interfaz para ESTADO_PRUEBA_API. */
export const ESTADO_PRUEBA_UI = "Pendiente";

/** Observaciones que el formulario emite junto al documento. */
export const OBSERVACIONES_PRUEBA = "Documento creado mediante automatización QA";

/**
 * Valores que el API devuelve para un documento creado sin contacto ni adjuntos.
 * Los escenarios API los exigen en la respuesta de creación y de actualización.
 */
export const EXPECTED_API_SIN_ADJUNTOS = {
  estado: ESTADO_PRUEBA_API,
  contactEmail: null,
  observaciones: null,
  attachmentName: null,
} as const;

/** Folio único dentro del rango seguro; ver comentario de FOLIO_MIN/FOLIO_MAX. */
export function randomFolio(): number {
  return randomInt(FOLIO_MIN, FOLIO_MAX + 1);
}

/**
 * Datos del documento que un escenario UI crea y verifica.
 * `rutReceptor` es el RUT único del escenario: todos los documentos que cree
 * comparten este valor.
 */
export function createDocumentFixture(folio: number, rutReceptor: string): DocumentFixture {
  return {
    folio,
    rutReceptor,
    monto: MONTO_PRUEBA,
    tipoDte: TIPO_DTE_PRUEBA,
  };
}

/** Cuerpo que los escenarios API envían a POST /api/documents. */
export function createDocumentInput(folio: number, rutReceptor: string): DocumentInput {
  return {
    tipoDte: TIPO_DTE_PRUEBA,
    folio,
    rutReceptor,
    monto: MONTO_PRUEBA,
    fechaEmision: new Date().toISOString().slice(0, 10),
    deliveryChannel: "PORTAL",
    sendCopy: false,
  };
}
