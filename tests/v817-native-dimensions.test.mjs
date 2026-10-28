import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spec,operationStrategy} from '../api/reshape.js';
for(const [w,h] of [[1600,800],[850,350],[850,500],[1080,1350],[300,600],[300,250]]){
  const s=spec(w,h);assert.equal(s.nativeFit,true,`${w}x${h} should use native/same-ratio model canvas`);assert.ok(s.ratioError<=0.006,`${w}x${h} ratio error too high: ${s.ratioError}`);
}
assert.deepEqual([spec(1600,800).gw,spec(1600,800).gh],[1600,800]);
assert.equal(operationStrategy('generate',1600,800).renderer,'ai-native-aspect');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(idx,/FINAL EXPORT QA/);assert.match(idx,/finalQa=await validateRenderedResult/);assert.match(idx,/resizeFullImageNoCrop/);
console.log('PASS V8.17 native dimensions/final QA tests');
