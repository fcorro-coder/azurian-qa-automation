// Contratos tipados de los documentos DTE del laboratorio.
//
// Son un espejo de la respuesta real de /api/documents: las claves de DocumentDto
// coinciden exactamente con DOCUMENT_KEYS en validators/document-contract.ts, y los
// tipos de dominio (DteType, DocumentStatus, DeliveryChannel) replican los del
// laboratorio sin importar código de ese proyecto.
//
// Se declaran con `type` y no con `interface` porque TypeScript no otorga index
// signature implícito a las interfaces: como type son asignables a
// Record<string, unknown>, que es lo que exigen los validadores de contrato.

/** Tipos de DTE admitidos por el laboratorio: fuente única para tipos y tablas. */
export const DTE_TYPE_VALUES = ["DTE 33", "DTE 34", "DTE 39"] as const;

export type DteType = (typeof DTE_TYPE_VALUES)[number];

/** Estados posibles de un documento: fuente única para tipos y validaciones. */
export const DOCUMENT_STATUS_VALUES = ["PENDIENTE", "ACEPTADO", "RECHAZADO"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS_VALUES)[number];

/** Canal de entrega del documento. */
export type DeliveryChannel = "PORTAL" | "EMAIL";

/**
 * Respuesta real de GET/POST/PUT /api/documents.
 * Todas las propiedades son obligatorias: el contrato no admite campos ausentes.
 */
export type DocumentDto = {
  id: string;
  tipoDte: DteType;
  folio: number;
  rutReceptor: string;
  monto: number;
  fechaEmision: string;
  estado: DocumentStatus;
  contactEmail: string | null;
  sendCopy: boolean;
  deliveryChannel: DeliveryChannel;
  observaciones: string | null;
  attachmentName: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Cuerpo admitido por POST y PUT /api/documents: los campos que el API exige.
 * No incluye los opcionales (contactEmail, observaciones, attachmentName) porque
 * ninguna prueba los envía.
 */
export type DocumentInput = {
  tipoDte: DteType;
  folio: number;
  rutReceptor: string;
  monto: number;
  fechaEmision: string;
  deliveryChannel: DeliveryChannel;
  sendCopy: boolean;
};

/**
 * Datos que un escenario crea y después verifica en la interfaz o en el API.
 * Solo contiene valores que los escenarios comparan: nada de campos sin aserción.
 */
export type DocumentFixture = {
  folio: number;
  rutReceptor: string;
  monto: number;
  tipoDte: DteType;
};
