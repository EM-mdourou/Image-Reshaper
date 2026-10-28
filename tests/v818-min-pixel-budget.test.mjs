import assert from "node:assert/strict";
import {spec,canvasProfile} from "../api/reshape.js";
const MIN=655360;
for (const [w,h,label] of [[300,600,"Large Ad"],[300,250,"Side Ad"],[850,350,"Opportunities"],[1080,1350,"Social Media"]]) {
  const s=spec(w,h);
  assert.ok(s.gw*s.gh>=MIN,`${label} generation canvas must meet minimum pixel budget`);
  assert.equal(s.gw%16,0,`${label} width must be divisible by 16`);
  assert.equal(s.gh%16,0,`${label} height must be divisible by 16`);
  assert.ok(s.ratioError<=0.006,`${label} must preserve final aspect ratio closely`);
  assert.equal(s.nativeFit,true,`${label} should use proportional same-ratio resize`);
}
const large=spec(300,600);
assert.notEqual(large.size,"512x1024","Large Ad must not use the invalid under-budget canvas");
assert.equal(canvasProfile(728,90).exactCanvas,true,"Extreme leaderboard must stay on exact-canvas renderer");
assert.equal(canvasProfile(320,50).exactCanvas,true,"Extreme mobile ad must stay on exact-canvas renderer");
assert.equal(canvasProfile(200,100).exactCanvas,true,"Tiny directory format must keep compact/exact behavior");
console.log("PASS V8.18 minimum-pixel-budget and extreme-format routing tests");
