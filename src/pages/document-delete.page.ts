import { expect, type Page } from "@playwright/test";

export class DocumentDeletePage {
  constructor(private readonly page: Page) {}

  async deleteDocument(folio: number): Promise<void> {
    await this.page.getByRole("button", {
      name: `Eliminar folio ${folio}`,
      exact: true
    }).click();

    const confirmButton = this.page.getByRole("button", {
      name: "Eliminar documento",
      exact: true
    });

    await expect(
      this.page.getByText(
        /¿Confirmas que deseas eliminar el documento/
      )
    ).toBeVisible();

    await expect(
      this.page.getByText(`folio #${folio}`, {
        exact: false
      })
    ).toBeVisible();

    await confirmButton.click();

    await expect(confirmButton).toBeHidden();
  }
}
