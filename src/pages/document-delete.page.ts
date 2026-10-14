import { expect, type Locator, type Page } from "@playwright/test";

const DOCUMENTS_PREFIX = "/api/documents/";
const NETWORK_TIMEOUT_MS = 15_000;

/** Confirmación de eliminación con localizadores y esperas centralizados. */
export class DocumentDeletePage {
  constructor(private readonly page: Page) {}

  private confirmDialog(): Locator {
    return this.page.getByRole("alertdialog");
  }

  /**
   * Elimina el documento y espera la respuesta del DELETE antes de comprobar que la
   * confirmación se cerró. La espera de red se registra antes del clic, de modo que
   * nunca se puede dar por hecho una eliminación que aún no terminó.
   */
  async deleteDocument(folio: number, rutReceptor: string): Promise<void> {
    const pendingDelete = this.page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "DELETE" &&
        new URL(candidate.url()).pathname.startsWith(DOCUMENTS_PREFIX),
      { timeout: NETWORK_TIMEOUT_MS }
    );
    pendingDelete.catch(() => undefined);

    await this.page.getByRole("button", { name: `Eliminar folio ${folio}`, exact: true }).click();

    const dialog = this.confirmDialog();
    await expect(dialog, "La confirmación de eliminación debió abrirse").toBeVisible();
    await expect(dialog).toContainText("¿Confirmas que deseas eliminar el documento");
    await expect(dialog).toContainText(`folio #${folio} del RUT ${rutReceptor}`);
    await expect(dialog).toContainText("Esta acción no se puede deshacer");

    await dialog.getByRole("button", { name: "Eliminar documento", exact: true }).click();

    const response = await pendingDelete;
    expect(response.status(), "La eliminación del documento debió responder 204").toBe(204);

    await expect(dialog, "La confirmación debió cerrarse tras eliminar").toBeHidden();
  }
}
