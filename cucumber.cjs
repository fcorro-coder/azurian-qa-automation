module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    requireModule: ["tsx/cjs"],
    require: [
      "src/fixtures/custom-world.ts",
      "src/steps/**/*.ts",
      "src/hooks/**/*.ts"
    ],
    format: [
      "progress",
      "allure-cucumberjs/reporter"
    ],
    formatOptions: {
      resultsDir: "allure-results"
    },
    publish: false
  }
};
