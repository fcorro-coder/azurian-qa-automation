import { expect, type Locator, type Page } from "@playwright/test";

import { UI_NETWORK_TIMEOUT_MS } from "../config/timeouts";

/** Formulario de edición de documentos con localizadores y esperas centralizados. */
export class DocumentEditPage {
  constructor(private readonly page: Page) {}

  private dialog(): Locator {
    // El nombre completo con folio solo aparece cuando el documento ya se cargó,
    // por eso se localiza por el prefijo y el fin de la carga se comprueba aparte.
    return this.page.getByRole("dialog", { name: /^Editar documento/ });
  }

  async openEditForm(folio: number): Promise<void> {
    await this.page.getByRole("button", { name: `Editar folio ${folio}`, exact: true }).click();

    // El título completo ("Editar documento - Folio #X") solo se renderiza cuando el
    // documento ya se cargó, por lo que espera explícitamente el fin de esa carga.
    await expect(this.dialog(), "El diálogo de edición debió abrirse").toBeVisible();
    await expect(
      this.dialog().getByRole("status", { name: "Cargando documento" }),
      "El formulario de edición debió terminar de cargar"
    ).toBeHidden();
    await expect(this.dialog().getByRole("heading", { name: /Editar documento - Folio #/ })).toBeVisible();
  }

  /**
   * Guarda los cambios y espera la respuesta del PUT antes de comprobar que el
   * diálogo se cerró, de modo que la comprobación nunca corre contra un envío en curso.
   */
  async updateAmount(monto: number): Promise<void> {
    const dialog = this.dialog();

    await dialog.getByRole("spinbutton", { name: "Monto total (CLP) *" }).fill(String(monto));

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          candidate.request().method() === "PUT" &&
          new URL(candidate.url()).pathname.startsWith("/api/documents/"),
        { timeout: UI_NETWORK_TIMEOUT_MS }
      ),
      dialog.getByRole("button", { name: "Guardar cambios" }).click()
    ]);

    expect(response.status(), "La actualización del documento debió responder 200").toBe(200);
    await expect(dialog).toBeHidden();
  }

  /** Verifica que el tipo de DTE está deshabilitado en edición (no modificable después de la creación). */
  async expectTipoDteDisabled(): Promise<void> {
    await expect(
      this.dialog().getByLabel("Tipo de documento tributario"),
      "El tipo de DTE debe estar deshabilitado en edición"
    ).toBeDisabled();
  }

  /** Verifica que el folio está deshabilitado en edición. */
  async expectFolioDisabled(): Promise<void> {
    await expect(
      this.dialog().getByRole("spinbutton", { name: "Número de folio *" }),
      "El folio debe estar deshabilitado en edición"
    ).toBeDisabled();
  }

  /** Verifica que el monto sigue habilitado para edición. */
  async expectMontoEnabled(): Promise<void> {
    await expect(
      this.dialog().getByRole("spinbutton", { name: "Monto total (CLP) *" }),
      "El monto debe estar habilitado para editar"
    ).toBeEnabled();
  }
}
