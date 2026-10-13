import { chromium } from "@playwright/test";
import { config } from "./src/config/env";

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.goto(`${config.baseUrl}/login`);

    await page.getByRole("textbox", {
      name: "Usuario o Correo Electrónico"
    }).fill(config.qaUser);

    await page.getByRole("textbox", {
      name: "Contraseña"
    }).fill(config.qaPassword);

    await page.getByRole("button", {
      name: "Iniciar Sesión"
    }).click();

    await page.getByRole("heading", {
      name: "Documentos Tributarios Electrónicos"
    }).waitFor();

    console.log("URL:", page.url());
    console.log("TABLAS:", await page.locator("table").count());
    console.log("ENCABEZADOS TH:", await page.locator("th").allTextContents());
    console.log("COLUMNHEADERS:", await page.getByRole("columnheader").allTextContents());
    console.log("TEXTO FOLIO:", await page.getByText("FOLIO", { exact: true }).count());
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
