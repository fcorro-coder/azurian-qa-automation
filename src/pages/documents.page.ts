import { expect, type Locator, type Page } from "@playwright/test";

/** Localizadores semánticos centralizados para el listado. */
export class DocumentsPage {
  constructor(private readonly page: Page) {}

  rowByFolio(folio: number): Locator {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("button", { name: `Ver detalle folio ${folio}`, exact: true })
    });
  }

  /** Para pantallas que no muestran botón de detalle (crear/editar/eliminar). */
  rowByFolioText(folio: number): Locator {
    return this.page.getByRole("row").filter({ hasText: `#${folio}` });
  }

  async searchByRut(rut: string): Promise<void> {
    await this.page.getByRole("textbox", { name: /Buscar por RUT Receptor/i }).fill(rut);
    await this.page.getByRole("button", { name: "Buscar", exact: true }).click();
    // No asumir que una fila ausente implica que terminó la carga.
    await expect(this.page.getByRole("columnheader", { name: "Folio", exact: true })).toBeVisible();
  }

  async openDetail(folio: number): Promise<Locator> {
    const row = this.rowByFolioText(folio);
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Ver detalle/i }).click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    return dialog;
  }

  async validateList(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Documentos Tributarios Electrónicos" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Nuevo documento" })).toBeVisible();
    for (const column of ["Folio", "Tipo DTE", "RUT Receptor", "Monto Total", "Fecha Emisión", "Estado", "Acciones"]) {
      await expect(this.page.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
  }
}
