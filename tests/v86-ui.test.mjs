import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of ['costSubmit','costRegenerate','costText','costModify','progressSubmit','progressRegenerate','progressText','progressModify']){
  if(!html.includes(`id="${id}"`)) throw new Error(`missing ${id}`);
}
for(const term of ['Estimated API cost','Load cached source manifest','Resolve source element / geometry','Verify changed text']){
  if(!html.includes(term)) throw new Error(`missing UI/progress term: ${term}`);
}
if(!html.includes("const APP_VERSION='8.6'")) throw new Error('wrong app version');
console.log('PASS v8.6 cost/progress UI tests');
