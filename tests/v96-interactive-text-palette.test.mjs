import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
assert.match(html,/id=\"ieAddTextLayer\"/);
assert.match(html,/function ieAddTextLayer\(/);
assert.match(html,/function ieAugmentPaletteFromVisuals\(/);
assert.match(html,/function ieExtractPaletteFromImage\(/);
assert.match(html,/Interactive Extreme V9\.7/);
console.log('v96 interactive text + palette checks passed');
