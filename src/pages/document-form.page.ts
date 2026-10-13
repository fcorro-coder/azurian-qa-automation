import { expect, type Page } from "@playwright/test";

export class DocumentFormPage {
  constructor(private readonly page: Page) {}

  async openCreateForm(): Promise<void> {
    await this.page.getByRole("button", {
      name: "Nuevo documento"
    }).click();

    await expect(
      this.page.getByText("Emitir nuevo documento")
    ).toBeVisible();
  }

  async validateCreateForm(): Promise<void> {
    await expect(
      this.page.getByLabel("Tipo de documento tributario")
    ).toBeVisible();

    await expect(
      this.page.getByRole("textbox", {
        name: "Fecha de emisión *"
      })
    ).toBeVisible();

    await expect(
      this.page.getByRole("spinbutton", {
        name: "Número de folio *"
      })
    ).toBeVisible();

    await expect(
      this.page.getByRole("textbox", {
        name: "RUT receptor *"
      })
    ).toBeVisible();

    await expect(
      this.page.getByRole("spinbutton", {
        name: "Monto total (CLP) *"
      })
    ).toBeVisible();

    await expect(
      this.page.getByRole("group", {
        name: "Canal de entrega"
      })
    ).toBeVisible();
  }

  async fillValidDocument(folio: number): Promise<void> {
    const dialog = this.page.getByRole("dialog", {
      name: "Emitir nuevo documento"
    });

    await dialog.getByLabel("Tipo de documento tributario")
      .selectOption({ label: "DTE 33 - Factura Electrónica" });

    await dialog.getByRole("spinbutton", {
      name: "Número de folio *"
    }).fill(String(folio));

    await dialog.getByRole("textbox", {
      name: "RUT receptor *"
    }).fill("76.086.428-5");

    await dialog.getByRole("spinbutton", {
      name: "Monto total (CLP) *"
    }).fill("150000");

    await dialog.getByRole("textbox", {
      name: "Observaciones"
    }).fill("Documento creado mediante automatización QA");
  }

  async saveDocument(): Promise<void> {
    const dialog = this.page.getByRole("dialog", {
      name: "Emitir nuevo documento"
    });

    await dialog.getByRole("button", {
      name: "Guardar y emitir"
    }).click();

    await expect(dialog).toBeHidden();
  }
}

