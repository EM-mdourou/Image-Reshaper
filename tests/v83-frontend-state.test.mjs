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
const code=[extract('defaultTextStyleForRole'),extract('themeColorForRole'),extract('inferTextStylesFromPlan'),extract('ensureStructuredDesignState'),extract('patchStructuredElement'),extract('targetTextElementId'),extract('applyTextGeometryInstruction'),extract('geometryFor'),extract('applyVisualInstructionToPlan'),extract('tinyLayoutGeometry'),extract('manifestFingerprint')].join('\n');
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

console.log('PASS v8.8 frontend state/color tests');


function intersects(a,b){
  if(!a||!b)return false;
  return !(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y);
}
for(const [w,h,mode] of [[200,100,'button'],[320,100,'button'],[320,50,'inline']]){
  const g=ctx.tinyLayoutGeometry(w,h,{side:'right',subjectPct:34,hasSubject:true,hasCta:true,ctaMode:mode});
  assert.equal(intersects(g.subjectRect,g.copyRect),false,`${w}x${h} subject/copy must not overlap`);
  assert.equal(intersects(g.subjectRect,g.ctaRect),false,`${w}x${h} subject/CTA must not overlap`);
  assert.equal(intersects(g.copyRect,g.ctaRect),false,`${w}x${h} copy/CTA must not overlap`);
  assert.ok(g.copyRect.w>0&&g.copyRect.h>0&&g.ctaRect.w>0&&g.ctaRect.h>0);
}
console.log('PASS v8.8 tiny geometry no-overlap tests');

const mf1=ctx.manifestFingerprint('same manifest');
const mf2=ctx.manifestFingerprint('same manifest');
const mf3=ctx.manifestFingerprint('different manifest');
assert.equal(mf1,mf2,'manifest fingerprint must be stable');
assert.notEqual(mf1,mf3,'different manifests should have different fingerprints in this test');
console.log('PASS v8.8 manifest fingerprint test');
