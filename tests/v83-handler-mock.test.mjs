import assert from 'node:assert/strict';
import { Readable } from 'node:stream';

process.env.OPENAI_API_KEY='test-key';
const { default: handler } = await import('../api/reshape.js');

const manifest=`CRITICAL FACTS:\n- TEST EVENT\n- AUG 12 7 PM\nVISUAL ASSETS:\n- one person\nSTYLE:\n- dark blue background\nMANIFEST_HEADLINE: TEST EVENT\nMANIFEST_DATE_TIME: AUG 12 · 7 PM\nMANIFEST_VENUE: BAYVIEW YARDS\nMANIFEST_ADDRESS: 7 Station Rd\nMANIFEST_LOCATION: NONE\nMANIFEST_CTA: REGISTER NOW\nMANIFEST_PRICES: NONE\nMANIFEST_PEOPLE: Person 1\nMANIFEST_LOGOS: Test Logo\nMANIFEST_BACKGROUND: dark blue artwork\nBANNER_HEADLINE: TEST EVENT\nBANNER_DETAIL: AUG 12 · 7 PM\nBANNER_CTA: REGISTER NOW\nBANNER_VISUAL: person\nBANNER_CROP: 0.6,0.1,0.25,0.8\nBANNER_SUBJECT_FIT: upper_body\nBANNER_SUBJECT_SIDE: right\nBANNER_ACCENT: #B8860B\nBANNER_TEXT: #111111`;

// Mock OpenAI calls used by non-exact patch/regenerate paths.
let sourceAnalysisCalls=0;
global.fetch=async(url,opts={})=>{
  if(String(url).includes('/v1/images/edits')){
    return {ok:true,status:200,json:async()=>({data:[{b64_json:Buffer.from('fake-png').toString('base64')}]}),text:async()=>''};
  }
  if(String(url).includes('/v1/responses')){
    let text='PASS: requested behavior verified';
    try{
      const body=JSON.parse(opts.body||'{}');
      const prompt=body?.input?.[0]?.content?.find(x=>x.type==='input_text')?.text||'';
      if(/SOURCE FACT MANIFEST/i.test(prompt) && /MANIFEST_HEADLINE/i.test(prompt)){sourceAnalysisCalls++;text=manifest;}
      else if(/OPTIONAL-INSTRUCTIONS INTERPRETER/i.test(prompt)) text=`HEADLINE_OVERRIDE:
HEADLINE_COMPLETION_PHRASE:
DETAIL_OVERRIDE:
SECONDARY_OVERRIDE:
CTA_OVERRIDE:
REQUESTED_SOURCE_ELEMENTS:
SOURCE_ELEMENT_PLACEMENT:
REQUIRED_VISIBLE_FACTS:
REQUIRED_FACTS_PLACEMENT:
LAYOUT_DIRECTIVES:
DESIGN_DIRECTIVES:
PRESERVE_EXACT_PHRASES:`;
      else if(/SOURCE FACT EXTRACTOR/i.test(prompt)) text=`DISPLAY_HEADLINE: TEST EVENT
DISPLAY_DETAIL: AUG 12 · 7 PM
DISPLAY_SECONDARY: BAYVIEW YARDS · 7 Station Rd
DISPLAY_CTA: REGISTER NOW`;
      else if(/Return exactly these lines:/i.test(prompt) && /SUBJECT_COUNT:/i.test(prompt)) text=`HEADLINE: TEST EVENT
DETAIL: AUG 12 · 7 PM
SECONDARY: BAYVIEW YARDS · 7 Station Rd
CTA: REGISTER NOW
VISUAL: person
SUBJECT_COUNT: 1
SUBJECT_DESCRIPTION: main person
SUBJECT_SIDE: right
LAYOUT_INTENT: subject-right
SUBJECT_ZONE_PCT: 32
SUBJECT_ANCHOR: right-third
SUBJECT_EDGE_PADDING_PCT: 5
TEXT_ALIGN: left
STYLE: dark blue and gold
ACCENT: #B8860B
TEXT: #111111`;
      else if(/SECOND-PASS ART DIRECTOR/i.test(prompt)) text=`SUBJECT_ANCHOR: right-third
SUBJECT_HEIGHT_PCT: 96
SUBJECT_ZONE_PCT: 34
SUBJECT_EDGE_PADDING_PCT: 5
TEXT_SIDE: left
TEXT_WIDTH_PCT: 58
BACKGROUND_RICHNESS: rich
VEIL_STRENGTH: 68
ALLOW_SUBJECT_TEXT_OVERLAP: no`;
      else if(/selecting ONE meaningful visual subject/i.test(prompt)) text=`VISUAL: person
CROP: 0.60,0.10,0.25,0.80
FIT: upper_body
SIDE: right
FACE_CENTER: 0.72,0.25
ZOOM: medium`;
      else if(/Compare IMAGE 1 \(baseline current design\)/i.test(prompt)) text='PASS: same composition with localized requested change';
      else if(/Compare IMAGE 1 \(previous design\)/i.test(prompt)) text='PASS: materially different layout';
      else text='PASS: source QA okay';
    }catch{}
    return {ok:true,status:200,json:async()=>({output:[{type:'message',content:[{type:'output_text',text}]}]})};
  }
  throw new Error('Unexpected mocked fetch '+url);
};

function multipart(fields){
  const boundary='----v83testboundary';
  const chunks=[];
  for(const [name,value] of Object.entries(fields)){
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    if(value && value.file){
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${value.name||'x.png'}"\r\nContent-Type: ${value.type||'image/png'}\r\n\r\n`));
      chunks.push(Buffer.isBuffer(value.data)?value.data:Buffer.from(value.data||'x'));
      chunks.push(Buffer.from('\r\n'));
    }else{
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n${String(value)}\r\n`));
    }
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body=Buffer.concat(chunks);
  return {body,boundary};
}

async function call({w,h,mode,current=true,withPrior=true}){
  const prior={
    sourceManifest:manifest,
    headline:'TEST EVENT',dateTime:'AUG 12 · 7 PM',detail:'AUG 12 · 7 PM',venue:'BAYVIEW YARDS',address:'7 Station Rd',secondary:'7 Station Rd',cta:'REGISTER NOW',
    textElements:[
      {id:'headline',label:'Headline',role:'headline',text:'TEST EVENT',visible:true,style:{color:'#111111'}},
      {id:'dateTime',label:'Date / time',role:'dateTime',text:'AUG 12 · 7 PM',visible:true,style:{color:'#111111'}},
      {id:'cta',label:'Call to action',role:'cta',text:'REGISTER NOW',visible:true,style:{color:'#111111'}}
    ],manualTextElements:[],textStyles:{headline:{color:'#111111'}},subjectX:.72,subjectAnchor:'right-third',subjectCount:1
  };
  const fields={
    image:{file:true,name:'source.png',type:'image/png',data:Buffer.from('source')},
    name:'test',width:String(w),height:String(h),mode,
    instructions:mode==='edit_text'?'Change headline only':'Move person slightly right'
  };
  if(withPrior)fields.priorPlan=JSON.stringify(prior);
  if(current)fields.currentImage={file:true,name:'current.png',type:'image/png',data:Buffer.from('current')};
  const {body,boundary}=multipart(fields);
  const req=Readable.from([body]); req.method='POST'; req.headers={'content-type':`multipart/form-data; boundary=${boundary}`,'content-length':String(body.length)};
  let statusCode=200,jsonBody=null,headers={};
  const res={status(n){statusCode=n;return this;},json(v){jsonBody=v;return v;},setHeader(k,v){headers[k]=v;}};
  await handler(req,res);
  return {statusCode,json:jsonBody,headers};
}

for(const [w,h] of [[728,90],[320,100],[200,100],[320,50]]){
  const g=await call({w,h,mode:'generate',current:false,withPrior:false});
  assert.equal(g.statusCode,200,`${w}x${h} generate status`);
  assert.equal(g.json.renderMode,'canvas-first-banner-composer',`${w}x${h} initial generate exact canvas`);
  assert.equal(g.json.width,w);assert.equal(g.json.height,h);
  assert.ok(g.json.bannerPlan.displayBudget,`${w}x${h} should include display budget`);
  if(w<=320&&h<=120)assert.equal(g.json.bannerPlan.displayBudget.tier,'TINY');
}

for(const [w,h] of [[728,90],[320,100],[200,100],[320,50]]){
  const r=await call({w,h,mode:'edit_text'});
  assert.equal(r.statusCode,200,`${w}x${h} edit_text status`);
  assert.equal(r.json.renderMode,'canvas-first-banner-composer',`${w}x${h} should use exact canvas composer`);
  assert.equal(r.json.width,w);assert.equal(r.json.height,h);
  assert.equal(r.json.reuseAssets,true);
}

{
  const before=sourceAnalysisCalls;
  const r=await call({w:728,h:90,mode:'regenerate'});
  assert.equal(r.statusCode,200);
  assert.equal(r.json.renderMode,'canvas-first-banner-composer');
  assert.equal(r.json.bannerPlan.userTextLocked,false);
  assert.equal(sourceAnalysisCalls,before,'compact regenerate with cached sourceManifest must not re-analyze source');
}


{
  const before=sourceAnalysisCalls;
  const r=await call({w:320,h:100,mode:'resize'});
  assert.equal(r.statusCode,200);
  assert.equal(r.json.renderMode,'canvas-first-banner-composer');
  assert.equal(sourceAnalysisCalls,before,'compact resize with cached sourceManifest must not re-analyze source');
}

{
  const r=await call({w:728,h:90,mode:'modify'});
  assert.equal(r.statusCode,200);
  assert.equal(r.json.renderMode,'canvas-first-banner-composer');
  assert.equal(r.json.reuseAssets,true);
}

{
  const r=await call({w:880,h:460,mode:'generate',current:false,withPrior:false});
  assert.equal(r.statusCode,200,'880x460 generate');
  assert.equal(r.json.renderMode,'unified-ai-composer');
  assert.equal(r.json.exportMode,'safe-contain');
  assert.ok(r.json.bannerPlan.displayBudget);
  assert.equal(r.json.bannerPlan.displayBudget.tier,'FULL');
}


{
  const before=sourceAnalysisCalls;
  const r=await call({w:880,h:460,mode:'resize'});
  assert.equal(r.statusCode,200,'880x460 resize');
  assert.equal(r.json.renderMode,'unified-ai-composer');
  assert.equal(sourceAnalysisCalls,before,'880x460 resize with cached sourceManifest must not re-analyze source');
}

for(const mode of ['edit_text','modify','regenerate']){
  const before=sourceAnalysisCalls;
  const r=await call({w:880,h:460,mode});
  assert.equal(r.statusCode,200,`880x460 ${mode}`);
  assert.equal(r.json.renderMode,'unified-ai-composer');
  assert.equal(r.json.exportMode,'safe-contain');
  assert.ok(r.json.bannerPlan.displayBudget);
  assert.equal(r.json.bannerPlan.displayBudget.tier,'FULL');
  assert.equal(sourceAnalysisCalls,before,`880x460 ${mode} with cached sourceManifest must not re-analyze source`);
}

console.log('PASS v8.3 mocked handler operation tests');
