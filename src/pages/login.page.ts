import { expect, type Page } from "@playwright/test";
import { config } from "../config/env";

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
  }
}
