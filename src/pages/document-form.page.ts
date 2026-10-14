import { expect, type Locator, type Page } from "@playwright/test";

const CREATE_PATH = "/api/documents";
const NETWORK_TIMEOUT_MS = 15_000;

/** Formulario de emisión de documentos con localizadores y esperas centralizados. */
export class DocumentFormPage {
  readonly createDialog: Locator;

  constructor(private readonly page: Page) {
    this.createDialog = page.getByRole("dialog", { name: "Emitir nuevo documento" });
  }

  async openCreateForm(): Promise<void> {
    await this.page.getByRole("button", { name: "Nuevo documento" }).click();

    await expect(this.createDialog).toBeVisible();
    await expect(
      this.createDialog.getByRole("heading", { name: "Emitir nuevo documento" })
    ).toBeVisible();
  }

  async validateCreateForm(): Promise<void> {
    const dialog = this.createDialog;

    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Tipo de documento tributario")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Fecha de emisión *" })).toBeVisible();
    await expect(dialog.getByRole("spinbutton", { name: "Número de folio *" })).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "RUT receptor *" })).toBeVisible();
    await expect(dialog.getByRole("spinbutton", { name: "Monto total (CLP) *" })).toBeVisible();
    await expect(dialog.getByRole("group", { name: "Canal de entrega" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Guardar y emitir" })).toBeVisible();
  }

  async fillValidDocument(folio: number): Promise<void> {
    const dialog = this.createDialog;

    await dialog.getByLabel("Tipo de documento tributario").selectOption({ label: "DTE 33 - Factura Electrónica" });

    await dialog.getByRole("spinbutton", { name: "Número de folio *" }).fill(String(folio));

    await dialog.getByRole("textbox", { name: "RUT receptor *" }).fill("76.086.428-5");

    await dialog.getByRole("spinbutton", { name: "Monto total (CLP) *" }).fill("150000");

    await dialog.getByRole("textbox", { name: "Observaciones" }).fill("Documento creado mediante automatización QA");
  }

  /**
   * Guarda el documento y espera la respuesta del POST antes de comprobar que el
   * diálogo se cerró, de modo que la comprobación nunca corre contra un envío en curso.
   */
  async saveDocument(): Promise<void> {
    const dialog = this.createDialog;

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          candidate.request().method() === "POST" && new URL(candidate.url()).pathname === CREATE_PATH,
        { timeout: NETWORK_TIMEOUT_MS }
      ),
      dialog.getByRole("button", { name: "Guardar y emitir" }).click()
    ]);

    expect(response.status(), "La creación del documento debió responder 201").toBe(201);
    await expect(dialog).toBeHidden();
  }
}
