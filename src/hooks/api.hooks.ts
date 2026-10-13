import { Before, After } from "@cucumber/cucumber";
import { randomUUID } from "node:crypto";
import type { CustomWorld } from "../fixtures/custom-world";

Before(function (this: CustomWorld) {
  this.runId = `qa_${randomUUID().replace(/-/g, "")}`;
});

After(async function (this: CustomWorld) {
  try {
    if (this.response) {
      await this.attachApiEvidence(
  this.response,
  this.responseMethod ?? "NO_REGISTRADO"
);
    }
  } finally {
    if (this.apiContext) {
      await this.apiContext.dispose();
      this.apiContext = undefined;
    }
  }
});
