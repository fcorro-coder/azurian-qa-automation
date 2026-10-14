import { expect, type Page } from "@playwright/test";
import { config } from "../config/env";
import { DocumentsPage } from "./documents.page";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(): Promise<void> {
    await this.page.goto(`${config.baseUrl}/login`);

    await this.page
      .getByRole("textbox", {
        name: "Usuario o Correo Electrónico"
      })
      .fill(config.qaUser);

    await this.page
      .getByRole("textbox", {
        name: "Contraseña"
      })
      .fill(config.qaPassword);

    await this.page
      .getByRole("button", {
        name: "Iniciar Sesión"
      })
      .click();

    await expect(
      this.page.getByRole("heading", {
        name: "Documentos Tributarios Electrónicos"
      })
    ).toBeVisible();

    // El portal solo queda listo cuando la primera consulta del listado terminó:
    // así ningún escenario parte con una petición de listado todavía en curso.
    await new DocumentsPage(this.page).waitForListIdle();
  }
}
