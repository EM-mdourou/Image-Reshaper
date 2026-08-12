import assert from 'node:assert/strict';
import { canvasProfile, operationStrategy, spec } from '../api/reshape.js';

const cases = [
  {size:[728,90], profile:'EXTREME_HORIZONTAL', exact:true},
  {size:[320,100], profile:'EXTREME_HORIZONTAL', exact:true},
  {size:[200,100], profile:'COMPACT_HORIZONTAL', exact:true},
  {size:[320,50], profile:'MICRO_HORIZONTAL', exact:true},
  {size:[880,460], profile:'STANDARD_LANDSCAPE', exact:false},
  {size:[300,250], profile:'STANDARD_LANDSCAPE', exact:false},
  {size:[1080,1080], profile:'SQUARE', exact:false},
  {size:[1080,1350], profile:'PORTRAIT', exact:false},
];

for (const c of cases) {
  const [w,h] = c.size;
  const p = canvasProfile(w,h);
  assert.equal(p.id,c.profile,`${w}x${h} profile`);
  assert.equal(p.exactCanvas,c.exact,`${w}x${h} exactCanvas`);
}

for (const mode of ['generate','regenerate','modify','edit_text']) {
  const s = operationStrategy(mode,728,90);
  assert.equal(s.renderer,'exact-canvas');
  if (mode==='regenerate'||mode==='generate') assert.equal(s.behavior,'new-layout');
  if (mode==='modify') assert.equal(s.behavior,'patch-current');
  if (mode==='edit_text') assert.equal(s.behavior,'text-current');
}

for (const mode of ['generate','regenerate','modify','edit_text']) {
  const s = operationStrategy(mode,880,460);
  assert.equal(s.renderer,'ai-safe-crop');
  if (mode==='modify') assert.equal(s.behavior,'patch-current');
  if (mode==='edit_text') assert.equal(s.behavior,'text-current');
}

// For AI-sized canvases, the computed safe crop must have the requested aspect ratio.
for (const [w,h] of [[880,460],[300,250],[1080,1080],[1080,1350]]) {
  const s = spec(w,h);
  const target = w/h;
  const safe = s.safe.w/s.safe.h;
  assert.ok(Math.abs(target-safe) < 0.005,`${w}x${h} safe crop ratio ${safe} should match ${target}`);
  assert.ok(s.safe.w>0 && s.safe.h>0);
}

console.log('PASS v8.1 routing/profile tests');

const presetExpectations=[
  ['News',850,638,'ai-safe-crop'],
  ['Opportunities',850,350,'ai-safe-crop'],
  ['Action Alerts',850,500,'ai-safe-crop'],
  ['Events',880,460,'ai-safe-crop'],
  ['Social Media',1080,1350,'ai-safe-crop'],
  ['Front Page',900,500,'ai-safe-crop'],
  ['Mobile Ad',320,50,'exact-canvas'],
  ['Large Ad',300,600,'ai-safe-crop'],
  ['Side Ad',300,250,'ai-safe-crop'],
  ['Leaderboard Ad',728,90,'exact-canvas'],
  ['Mobile Directory',200,100,'exact-canvas'],
  ['Desktop Directory',320,100,'exact-canvas'],
];
for(const [name,w,h,renderer] of presetExpectations){
  const got=operationStrategy('generate',w,h).renderer;
  assert.equal(got,renderer,`${name} ${w}x${h} renderer`);
}
console.log('PASS v8.1 preset routing matrix');
