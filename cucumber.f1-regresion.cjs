/**
 * [CONFIG NO USADO] Configuración Cucumber alternativa para ejecutar
 * la suite de regresión en un directorio de resultados separado.
 * NO está referenciado por ningún script de package.json.
 * El pipeline principal (npm test) ya cubre la regresión completa.
 * Pendiente de revisión y limpieza.
 */
module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    requireModule: ["tsx/cjs"],
    require: [
      "src/fixtures/custom-world.ts",
      "src/steps/**/*.ts",
      "src/hooks/**/*.ts",
    ],
    format: ["progress", "allure-cucumberjs/reporter"],
    formatOptions: {
      resultsDir: "reports/allure-results-f1-regresion",
    },
    publish: false,
  },
};
