import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../api/reshape.js',import.meta.url),'utf8');
const required=[
  'function ensureStructuredDesignState',
  'structuredDesignState={version:2',
  'function applyTextGeometryInstruction',
  'preferOriginalSubjectAsset=true',
  "Current design state</b><span>${escapeHtml(currentState)}",
  'The original reusable subject-group asset is available'
];
for(const s of required) if(!html.includes(s)) throw new Error('Missing frontend structured-state feature: '+s);
if(!api.includes('function isDeterministicStructuredPatch')) throw new Error('Missing deterministic patch classifier');
if(!api.includes('structuredStateMode:true')) throw new Error('Missing structured state response flag');
if(!api.includes("filename:im.filename||'original-source.png'")) throw new Error('Original source reference not supplied to patch editor');
if(!api.includes('candidateRejected:true')) throw new Error('Lower-cost deterministic rejection policy missing');
console.log('PASS v8.11 structured design state tests');
