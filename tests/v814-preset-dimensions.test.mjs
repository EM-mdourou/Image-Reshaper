import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const name of ['Articles','Events','Front Page']){
  const re=new RegExp(`data-name=\"${name}\" data-width=\"1600\" data-height=\"800\"`);
  assert.match(html,re,`${name} should be 1600x800`);
}
assert.match(html,/minimum 1200 × 600/);
assert.doesNotMatch(html,/data-name=\"News\"/);
assert.match(html,/const P=\[\['Articles',1600,800\]/);
assert.match(html,/\['Events',1600,800\]/);
assert.match(html,/\['Front Page',1600,800\]/);
console.log('V8.14 preset dimension tests passed');
