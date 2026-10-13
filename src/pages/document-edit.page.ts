import { expect, type Page } from "@playwright/test";

export class DocumentEditPage {
  constructor(private readonly page: Page) {}

  private dialog() {
    return this.page.getByRole("dialog", {
      name: /Editar documento\s*-\s*Folio\s*#/
    });
  }

  async openEditForm(folio: number): Promise<void> {
    await this.page.getByRole("button", {
      name: `Editar folio ${folio}`,
      exact: true
    }).click();

    await expect(this.dialog()).toBeVisible();
  }

  async updateAmount(monto: number): Promise<void> {
    await this.dialog().getByRole("spinbutton", {
      name: "Monto total (CLP) *"
    }).fill(String(monto));

    await this.dialog().getByRole("button", {
      name: "Guardar cambios"
    }).click();

    await expect(this.dialog()).toBeHidden();
  }
}
