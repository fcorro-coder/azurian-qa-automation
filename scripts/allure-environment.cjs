const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');
const output = path.resolve('allure-results');
fs.mkdirSync(output, {recursive:true});
const rows = [
  ['Proyecto','Azurian QA Automation'],
  ['Node',process.version],
  ['Playwright',pkg.devDependencies['@playwright/test']],
  ['Cucumber',pkg.devDependencies['@cucumber/cucumber']],
  ['Ejecucion','Laboratorio local'],
  ['Navegador','Chromium']
];
fs.writeFileSync(path.join(output,'environment.properties'), rows.map(([k,v]) => `${k}=${String(v).replace(/[\r\n=]/g,'_')}`).join('\n')+'\n');
console.log('Metadata de entorno escrita (sin credenciales ni URLs).');
