import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(name){
  const re=new RegExp(`function\\s+${name}\\s*\\(`);
  const m=re.exec(html); if(!m)throw new Error(`missing ${name}`);
  const start=m.index, parenClose=html.indexOf(')',m.index+m[0].length), brace=html.indexOf('{',parenClose); let d=0;
  for(let i=brace;i<html.length;i++){
    if(html[i]==='{')d++; else if(html[i]==='}')d--;
    if(d===0)return html.slice(start,i+1);
  }
  throw new Error(`unclosed ${name}`);
}
const code=[extract('defaultTextStyleForRole'),extract('applyVisualInstructionToPlan')].join('\n');
const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);

let p={subjectX:.72,subjectAnchor:'right-third',textStyles:{headline:{color:'#123456'}}};
p=ctx.applyVisualInstructionToPlan(p,'move person further right');
assert.ok(p.subjectX>.72,'follow-up move should increment from current position');
const after=p.subjectX;
p=ctx.applyVisualInstructionToPlan(p,'move person further right');
assert.ok(p.subjectX>after,'second follow-up should build on modified state');
assert.ok(p.subjectX<=.90,'position must remain bounded');

let c=ctx.applyVisualInstructionToPlan({textStyles:{}},'change colour of heading to black');
assert.equal(c.textStyles.headline.color,'#000000');
assert.equal(c.textColor,'#000000');

c=ctx.applyVisualInstructionToPlan({textStyles:{}},'change colour of text to white');
for(const role of ['headline','dateTime','venue','address','cta','extra','manual']){
  assert.equal(c.textStyles[role].color,'#ffffff',`${role} explicit text color`);
}

console.log('PASS v8.1 frontend state/color tests');
