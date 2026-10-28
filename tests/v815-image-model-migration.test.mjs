import fs from 'node:fs';import assert from 'node:assert/strict';
const api=fs.readFileSync(new URL('../api/reshape.js',import.meta.url),'utf8');
assert.match(api,/gpt-image-2\.5-sunburst/);
assert.match(api,/gpt-image-2\.5-flare/);
assert.match(api,/supportedImageModel\(process\.env\.IMAGE_MODEL/);
assert.match(api,/f\.append\('model',IMAGE_EDIT_MODEL\)/);
assert.doesNotMatch(api,/append\(['"]model['"],['"]gpt-image-1['"]\)/);
console.log('PASS v8.15 image model migration tests');
