/**
 * [CONFIG NO USADO] Configuración Cucumber alternativa para ejecutar
 * únicamente escenarios negativos en un directorio de resultados
 * separado. NO está referenciado por ningún script de package.json.
 * Para ejecutar negativos, usar: npm test -- --tags @negativo
 * el cual reutiliza cucumber.cjs. Pendiente de revisión y limpieza.
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
      resultsDir: "reports/allure-results-f1-negativos",
    },
    publish: false,
  },
};
