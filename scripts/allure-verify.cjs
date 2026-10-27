const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve('allure-results');
if (!fs.existsSync(dir)) { console.error('No existe allure-results'); process.exit(2); }
const files = fs.readdirSync(dir);
const results = files.filter(f => f.endsWith('-result.json'));
const containers = files.filter(f => f.endsWith('-container.json'));
const attachments = files.filter(f => f.includes('-attachment.'));
const references = new Set();
function visit(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach(visit);
  if (typeof value.source === 'string') references.add(value.source);
  Object.values(value).forEach(visit);
}
const records = results.map(f => JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
for (const f of [...results,...containers]) visit(JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
// UUID es el identificador único de cada resultado de Allure: nunca se repite,
// incluso para ejemplos de Scenario Outline que comparten el mismo fullName.
const keys = records.map(r => r.uuid);
const duplicates = keys.filter((key,i) => keys.indexOf(key) !== i);
const orphan = attachments.filter(f => !references.has(f));
const missing = [...references].filter(f => !fs.existsSync(path.join(dir,f)));
const counts = records.reduce((a,r) => (a[r.status]=(a[r.status]||0)+1,a),{});
const severities = records.filter(r => (r.labels||[]).some(l=>l.name==='severity')).length;
const epics = records.filter(r => (r.labels||[]).some(l=>l.name==='epic')).length;

// Reporte informativo de nombres compartidos (legitimado por Scenario Outline)
// sin afectar la evaluación: los UUIDs son únicos, por eso no se consideran duplicados.
const nameCounts = {};
for (const r of records) {
  const name = r.fullName || r.name;
  nameCounts[name] = (nameCounts[name] || 0) + 1;
}
const outlineNames = Object.entries(nameCounts)
  .filter(([,count]) => count > 1)
  .map(([name,count]) => `${name} (${count} ejemplos)`);

console.log(JSON.stringify({
  results: results.length,
  unique: new Set(keys).size,
  status: counts,
  containers: containers.length,
  attachments: attachments.length,
  referenced: attachments.length - orphan.length,
  orphan: orphan.length,
  missing: missing.length,
  severityLabels: severities,
  epicLabels: epics,
  duplicateScenarios: duplicates,
  outlineExamples: outlineNames
}, null, 2));
if (results.length !== 23 || duplicates.length || orphan.length || missing.length || counts.passed !== 23 || severities !== 23 || epics !== 23) process.exitCode=1;
