import { expect, type Locator, type Page } from "@playwright/test";

const NETWORK_TIMEOUT_MS = 15_000;

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
        { timeout: NETWORK_TIMEOUT_MS }
      ),
      dialog.getByRole("button", { name: "Guardar cambios" }).click()
    ]);

    expect(response.status(), "La actualización del documento debió responder 200").toBe(200);
    await expect(dialog).toBeHidden();
  }
}
