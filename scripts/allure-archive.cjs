const fs = require("node:fs");
const path = require("node:path");
const source = path.resolve("allure-results");
if (!fs.existsSync(source)) { console.log("Sin resultados que archivar"); process.exit(0); }
const files = fs.readdirSync(source);
if (!files.length) { console.log("Resultados vacíos"); process.exit(0); }
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.resolve("allure-results-historico", `run_${stamp}`);
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true, force: false, errorOnExist: true });
const copied = fs.readdirSync(destination);
if (copied.length !== files.length) throw new Error("Archivado incompleto; no limpiar resultados");
console.log(`Respaldo verificado: ${destination} (${copied.length} entradas)`);
