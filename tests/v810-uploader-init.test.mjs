import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');

const helperPos=html.indexOf("$=i=>document.getElementById(i)");
if(helperPos<0) throw new Error('DOM helper declaration not found');

const engineInitPos=html.indexOf("const btn=document.getElementById('engineDetailsBtn')");
if(engineInitPos<0) throw new Error('Engine Details safe initialization not found');

// Regression: there must not be a top-level `$()` Engine Details call before `$` initialization.
const unsafeEngineCall=html.indexOf("$('engineDetailsBtn')?.addEventListener");
if(unsafeEngineCall>=0 && unsafeEngineCall<helperPos){
  throw new Error('Engine Details still touches $ before initialization');
}

for(const required of [
  "drop.addEventListener('click'",
  "drop.addEventListener('dragover'",
  "drop.addEventListener('dragleave'",
  "drop.addEventListener('drop'",
  "input.addEventListener('change'",
  'wireUploader();'
]){
  if(!html.includes(required)) throw new Error(`Uploader wiring missing: ${required}`);
}

const finalWirePos=html.lastIndexOf('wireUploader();');
if(finalWirePos<helperPos) throw new Error('Uploader is initialized before DOM helper setup');

if(!html.includes("const APP_VERSION='8.10'")) throw new Error('wrong app version');
console.log('PASS v8.10 uploader initialization regression test');
