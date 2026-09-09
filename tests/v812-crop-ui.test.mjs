import fs from 'node:fs';import assert from 'node:assert/strict';
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(idx,/id="cropBtn"/);
assert.match(idx,/Crop to size/);
assert.match(idx,/id="cropModal"/);
assert.match(idx,/Manual crop completed at exact/);
assert.match(idx,/recordPersistentHistory\('CROP'/);
assert.match(idx,/progressCrop/);
console.log('V8.12 crop UI tests passed');
