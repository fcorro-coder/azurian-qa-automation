import { Before, After, Status } from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import type { CustomWorld } from "../fixtures/custom-world";

Before({ tags: "@ui" }, async function (this: CustomWorld) {
  assert.ok(this.runId, "No se generó el runId del escenario");

  this.browser = await chromium.launch({
    headless: process.env.HEADLESS?.toLowerCase() === "true"
  });

  this.browserContext = await this.browser.newContext();

  await this.browserContext.addInitScript(
    (runId: string) => {
      window.localStorage.setItem("azurian_lab_run_id", runId);
    },
    this.runId
  );

  this.page = await this.browserContext.newPage();
});

After({ tags: "@ui" }, async function (
  this: CustomWorld,
  scenario
) {
  try {
    if (this.page && !this.page.isClosed()) {
      const failed = scenario.result?.status === Status.FAILED;

      try {
        const screenshot = await this.page.screenshot({
          fullPage: true,
          timeout: 10000
        });

        await this.attach(
          screenshot,
          "image/png"
        );

        if (failed) {
          await this.attach(
            `Escenario fallido: ${scenario.pickle.name}`,
            "text/plain"
          );
        }
      } catch (error) {
        console.warn(
          "No fue posible capturar la evidencia UI:",
          error
        );
      }
    }
  } finally {
    try {
      if (this.browserContext) {
        await this.browserContext.close();
      }
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
});
