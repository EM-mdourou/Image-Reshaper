import fs from 'node:fs';import assert from 'node:assert/strict';
const db=fs.readFileSync(new URL('../lib/db.js',import.meta.url),'utf8');
const idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hist=fs.readFileSync(new URL('../history.html',import.meta.url),'utf8');
assert.match(db,/\['scraper','scrypt\$/);assert.match(db,/\['mdourou','scrypt\$/);
assert.match(db,/CREATE TABLE IF NOT EXISTS image_reshaper_history/);assert.match(idx,/href="\/history.html"/);assert.match(idx,/recordPersistentHistory\('MODIFY'/);assert.match(idx,/recordPersistentHistory\('EDIT_TEXT'/);assert.match(hist,/Usage History/);console.log('V8.11 history/users tests passed');
