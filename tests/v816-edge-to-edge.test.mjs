import fs from 'node:fs';import assert from 'node:assert/strict';
import {spec} from '../api/reshape.js';
const api=fs.readFileSync(new URL('../api/reshape.js',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const [name,w,h] of [['Articles',1600,800],['Events',1600,800],['Front Page',1600,800]]){
  const s=spec(w,h);assert.equal(s.size,'1600x800',`${name} must generate natively at 1600x800`);assert.equal(s.nativeFit,true);assert.equal(s.ratioError,0);
}
assert.match(api,/generation canvas already matches the FINAL target aspect ratio/i);
assert.match(api,/sp\.nativeFit\?'native-fit'/);
assert.match(idx,/data\.exportMode==='native-fit'/);
assert.match(idx,/resizeFullImageNoCrop/);
assert.match(idx,/FINAL EXPORT QA/);
console.log('PASS V8.17 native target-ratio tests');
