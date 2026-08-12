import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../api/reshape.js',import.meta.url),'utf8');
const html = fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(api,/\(UNIFIED_ENGINE && exactCanvasProfile\)/,'unified engine must route shallow banners to exact canvas');
assert.match(api,/CURRENT DESIGN PATCH — THIS IS NOT A REGENERATE REQUEST/,'patch modes need strict current-design prompt');
assert.match(api,/visionCompare\(/,'current/baseline comparison must be available');
assert.match(api,/safeCrop:sp\.safe/,'AI results must expose exact target safe crop');
assert.match(api,/Current-design preservation check rejected/,'bad redesign patches must be rejected');
assert.match(api,/requestMode==="regenerate" && currentIm/,'regenerate should compare against current design when supplied');

assert.match(html,/data\.image && data\.safeCrop\)base=await cropSafeZone/,'frontend must crop safe target region, not letterbox it');
assert.match(html,/const ex=await renderUniversalDesignState\(j,\[s\[0\],s\[1\],s\[2\]\]\)/,'initial rendering must use centralized exact finalizer');
assert.match(html,/const ex=await renderUniversalDesignState\(nextRenderData,target\)/,'modify rendering must use centralized exact finalizer');
assert.match(html,/Could not attach current design for regeneration-difference QA/,'regenerate must attach current design for difference QA');
assert.match(html,/const APP_VERSION='8\.1'/);
assert.match(html,/Version 8\.1/);


assert.equal(api.includes('\x08'),false,'backend source should not contain control-character regex boundaries');
assert.equal(html.includes('\x08'),false,'frontend source should not contain control-character regex boundaries');
assert.match(html,/neutral black is the fallback|fallback\. Never invent lime green|return pick\(\[styles\.headline/i);
console.log('PASS v8.1 static architecture tests');
