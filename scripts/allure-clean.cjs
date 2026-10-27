const fs = require("node:fs");
const path = require("node:path");
const dir = path.resolve("allure-results");
if (!fs.existsSync(dir)) { fs.mkdirSync(dir); process.exit(0); }
const files = fs.readdirSync(dir);
if (!files.length) process.exit(0);
const archive = path.resolve("allure-results-historico");
if (!fs.existsSync(archive)) throw new Error("No hay respaldo; ejecuta npm run report:archive");
const runs = fs.readdirSync(archive).filter(x => x.startsWith("run_"));
if (!runs.some(run => files.every(f => fs.existsSync(path.join(archive, run, f))))) {
  throw new Error("No se encontró un respaldo completo de los resultados actuales. No se limpió nada.");
}
for (const file of files) fs.rmSync(path.join(dir, file), { recursive: true, force: false });
console.log(`Limpieza segura: ${files.length} entradas (respaldo conservado)`);
