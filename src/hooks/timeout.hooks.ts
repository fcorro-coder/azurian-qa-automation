import { setDefaultTimeout } from "@cucumber/cucumber";
import { UI_SCENARIO_TIMEOUT_MS } from "../config/timeouts";
// Límite de pasos suficiente para la capa UI con latencia aleatoria.
// Las esperas siguen basadas en eventos observables, sin retries artificiales.
setDefaultTimeout(UI_SCENARIO_TIMEOUT_MS);
