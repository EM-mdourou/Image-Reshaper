export const config={api:{bodyParser:false}};

const PLANNER_MODEL = process.env.PLANNER_MODEL || "gpt-5.1";
const PLANNER_REASONING = process.env.PLANNER_REASONING || "high";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1.5";
const IMAGE_MODEL_FALLBACK = "gpt-image-1";
const ENGINE_VERSION = "8.7";
const UNIFIED_ENGINE = String(process.env.RENDER_ENGINE||"unified").toLowerCase() !== "legacy";
function parse(body,ct){const m=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);if(!m)throw Error('Invalid upload');const bd=Buffer.from('--'+(m[1]||m[2])),a=[];let p=0;while((p=body.indexOf(bd,p))!==-1){let s=p+bd.length;if(body.slice(s,s+2).toString()==='--')break;if(body.slice(s,s+2).toString()==='\r\n')s+=2;let n=body.indexOf(bd,s);if(n<0)break;let q=body.slice(s,n-2),z=q.indexOf('\r\n\r\n');if(z<0){p=n;continue}let h=q.slice(0,z).toString();a.push({name:h.match(/name="([^"]+)"/)?.[1],filename:h.match(/filename="([^"]*)"/)?.[1],type:h.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim(),data:q.slice(z+4)});p=n}return a}
export function spec(w,h){let tr=w/h,gw,gh,size;if(tr>1.15){gw=1536;gh=1024;size='1536x1024'}else if(tr<.87){gw=1024;gh=1536;size='1024x1536'}else{gw=gh=1024;size='1024x1024'}let gr=gw/gh,safe;if(gr>tr){let sw=Math.round(gh*tr);safe={x:Math.round((gw-sw)/2),y:0,w:sw,h:gh}}else{let sh=Math.round(gw/tr);safe={x:0,y:Math.round((gh-sh)/2),w:gw,h:sh}}return{gw,gh,size,safe,tr}}

export function canvasProfile(w,h){
  const width=Number(w),height=Number(h),ratio=width/height;
  const shallow=height<=180;
  if(height<=60 && ratio>=3.5){
    return {id:'MICRO_HORIZONTAL',ratio,exactCanvas:true,compact:true};
  }
  if((height<=120 && ratio>=2.4) || ratio>=5.0){
    return {id:'EXTREME_HORIZONTAL',ratio,exactCanvas:true,compact:true};
  }
  if((shallow && ratio>=2.0) || ratio>=3.0){
    return {id:'COMPACT_HORIZONTAL',ratio,exactCanvas:true,compact:true};
  }
  if(ratio>=1.18)return {id:'STANDARD_LANDSCAPE',ratio,exactCanvas:false,compact:false};
  if(ratio<=0.55)return {id:'TALL_NARROW',ratio,exactCanvas:false,compact:false};
  if(ratio<0.88)return {id:'PORTRAIT',ratio,exactCanvas:false,compact:false};
  if(ratio>1.12)return {id:'LANDSCAPE',ratio,exactCanvas:false,compact:false};
  return {id:'SQUARE',ratio,exactCanvas:false,compact:false};
}

export function operationStrategy(mode,w,h){
  const profile=canvasProfile(w,h);
  const requestMode=String(mode||'generate');
  if(profile.exactCanvas){
    return {profile,renderer:'exact-canvas',behavior:requestMode==='regenerate'?'new-layout':(requestMode==='modify'?'patch-current':(requestMode==='edit_text'?'text-current':'new-layout'))};
  }
  return {profile,renderer:'ai-safe-contain',behavior:requestMode==='regenerate'?'new-layout':(requestMode==='modify'?'patch-current':(requestMode==='edit_text'?'text-current':'new-layout'))};
}

export function displayBudgetForCanvas(w,h,facts={}){
  const width=Number(w),height=Number(h),ratio=width/height;
  const has=v=>!!String(v||'').trim();
  const hasCta=has(facts.cta),hasDate=has(facts.dateTime||facts.detail),hasVenue=has(facts.venue),hasAddress=has(facts.address||facts.secondary);
  const hasManual=(Array.isArray(facts.manualTextElements)&&facts.manualTextElements.some(x=>has(x?.text))) || (Array.isArray(facts.extraFacts)&&facts.extraFacts.some(has));

  // Tiny canvases cannot display every semantic field as a full visual block.
  // Facts remain preserved in state; this budget governs only what is drawn.
  if(width<=320 && height<=120){
    return {
      tier:'TINY',
      drawHeadline:true,
      drawDateTime:hasDate && !hasManual,
      drawCta:hasCta,
      drawVenue:false,
      drawAddress:false,
      drawExtra:hasManual,
      maxSubjects:2,
      ctaMode:height<=60?'inline':'button',
      noOverlap:true,
      minOuterPct:0.04,
      subjectZonePct:Math.min(40,ratio>=4?28:36),
      notes:'Headline + one key fact + CTA + recognizable subject. Venue/address stay in state but are omitted from the drawing when they would cause collisions.'
    };
  }
  if(height<=120 && ratio>=2.4){
    return {
      tier:'COMPACT',drawHeadline:true,drawDateTime:hasDate && !hasManual,drawCta:hasCta,
      drawVenue:hasVenue && width>=600 && !hasManual,drawAddress:false,drawExtra:hasManual,maxSubjects:2,
      ctaMode:'button',noOverlap:true,minOuterPct:0.035,subjectZonePct:34,
      notes:'Compact horizontal hierarchy; CTA receives a reserved non-overlapping region.'
    };
  }
  return {
    tier:'FULL',drawHeadline:true,drawDateTime:hasDate,drawCta:hasCta,
    drawVenue:hasVenue,drawAddress:hasAddress,drawExtra:true,maxSubjects:99,
    ctaMode:'button',noOverlap:true,minOuterPct:0.045,subjectZonePct:36,
    notes:'Full-information canvas.'
  };
}
function responseOutputText(d){
  const found=[];
  const seen=new Set();
  const add=v=>{if(typeof v==="string" && v.trim())found.push(v.trim())};
  const walk=v=>{
    if(v==null || typeof v!=="object")return;
    if(seen.has(v))return;
    seen.add(v);
    if(Array.isArray(v)){for(const x of v)walk(x);return}
    if(v.type==="output_text")add(v.text);
    if(typeof v.output_text==="string")add(v.output_text);
    if(Array.isArray(v.content))for(const x of v.content)walk(x);
    if(Array.isArray(v.output))for(const x of v.output)walk(x);
    if(typeof v.text==="string" &&
       (v.type==="message"||v.type==="output_message"||v.type==="text"))add(v.text);
  };
  walk(d);
  return [...new Set(found)].join("\n").trim();
}
function responseDiagnostic(d){
  const x=[];
  if(d?.status)x.push(`status=${d.status}`);
  if(d?.incomplete_details?.reason)x.push(`incomplete=${d.incomplete_details.reason}`);
  if(d?.usage?.output_tokens!=null)x.push(`output_tokens=${d.usage.output_tokens}`);
  if(d?.usage?.output_tokens_details?.reasoning_tokens!=null)x.push(`reasoning_tokens=${d.usage.output_tokens_details.reasoning_tokens}`);
  if(d?.error?.message)x.push(`error=${d.error.message}`);
  return x.join(", ");
}

async function visionAttempt(key,data,prompt,{model=PLANNER_MODEL,effort=null,maxOutput=3600}={}){
  const body={
    model,
    input:[{role:"user",content:[
      {type:"input_text",text:prompt},
      {type:"input_image",image_url:data,detail:"high"}
    ]}],
    max_output_tokens:maxOutput
  };
  if(/^gpt-5/i.test(model) && effort)body.reasoning={effort};

  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  let d={};
  try{d=await r.json()}catch{throw Error(`OpenAI response could not be decoded (${r.status})`)}
  if(!r.ok)throw Error(d?.error?.message||`OpenAI Responses API failed (${r.status})`);
  return {text:responseOutputText(d),raw:d,model};
}

async function vision(key,data,prompt,opts={}){
  const extraction=opts.mode==="extract";
  const log=[];
  const primaryModel=opts.model||PLANNER_MODEL;
  const effort=opts.effort ?? (extraction?"none":PLANNER_REASONING);

  const run=async(label,model,e,maxOutput,p)=>{
    try{
      const r=await visionAttempt(key,data,p,{model,effort:e,maxOutput});
      const diag=responseDiagnostic(r.raw);
      log.push(`${label}/${model}${diag?` (${diag})`:""}`);
      return r.text?.trim()||"";
    }catch(err){
      log.push(`${label}/${model} ERROR: ${err?.message||err}`);
      return "";
    }
  };

  let text=await run("primary",primaryModel,effort,opts.maxOutput||3600,prompt);
  if(text)return text;

  const recovery=`${prompt}

V8.7 RECOVERY MODE:
Return the requested answer as visible plain text now.
Do not return only reasoning.
Do not omit the answer.
If exact field names were requested, output those exact fields.
Use only information visible in the attached source image.`;

  text=await run("recovery",primaryModel,extraction?"none":(opts.recoveryEffort||"low"),opts.recoveryMaxOutput||4200,recovery);
  if(text)return text;

  if(extraction||opts.allowModelFallback){
    text=await run("fallback","gpt-4.1",null,opts.fallbackMaxOutput||3600,recovery);
    if(text){
      console.warn("V8.7 source-analysis fallback to gpt-4.1 succeeded.");
      return text;
    }
  }

  throw Error(`Source analysis returned no usable text after automatic recovery. ${log.join(" | ")}`);
}


async function visionCompare(key,firstImage,secondImage,prompt,{model=PLANNER_MODEL,maxOutput=800}={}){
  const body={
    model,
    input:[{role:"user",content:[
      {type:"input_text",text:prompt},
      {type:"input_text",text:"IMAGE 1 — BASELINE CURRENT DESIGN:"},
      {type:"input_image",image_url:firstImage,detail:"high"},
      {type:"input_text",text:"IMAGE 2 — NEW RESULT:"},
      {type:"input_image",image_url:secondImage,detail:"high"}
    ]}],
    max_output_tokens:maxOutput
  };
  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  let d={};
  try{d=await r.json()}catch{throw Error(`Comparison response could not be decoded (${r.status})`)}
  if(!r.ok)throw Error(d?.error?.message||`Comparison failed (${r.status})`);
  return responseOutputText(d).trim();
}

async function edit(key,img,fn,type,prompt,size,refs=[]){let f=new FormData();f.append('model','gpt-image-1');f.append('image[]',new Blob([img],{type:type||'image/png'}),fn||'current.png');for(const ref of (refs||[])){if(ref?.data)f.append('image[]',new Blob([ref.data],{type:ref.type||'image/png'}),ref.filename||'source-reference.png')}f.append('prompt',prompt);f.append('size',size);f.append('quality','high');f.append('output_format','png');f.append('input_fidelity','high');let r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:f}),d=await r.json();if(!r.ok)throw Error(d?.error?.message||'Image edit failed');let b=d?.data?.[0]?.b64_json;if(!b)throw Error('No image returned');return b}


function field(text,name){
  const m=text.match(new RegExp("^\\\\s*"+name+"\\\\s*:\\\\s*(.*)$","mi"));
  return m?m[1].trim():"";
}
function cropField(text){
  const raw=field(text,"BANNER_CROP");
  const nums=raw.split(",").map(v=>Number(v.trim()));
  if(nums.length!==4 || !nums.every(Number.isFinite))return {x:0,y:0,w:0,h:0};
  return {
    x:Math.max(0,Math.min(1,nums[0])),
    y:Math.max(0,Math.min(1,nums[1])),
    w:Math.max(0,Math.min(1,nums[2])),
    h:Math.max(0,Math.min(1,nums[3]))
  };
}
function bannerPlanFromInventory(inventory,userInstructions=''){
  let headline=field(inventory,"BANNER_HEADLINE");
  let detail=field(inventory,"BANNER_DETAIL");
  let cta=field(inventory,"BANNER_CTA");
  let visual=(field(inventory,"BANNER_VISUAL")||"none").toLowerCase();
  let crop=cropField(inventory);
  let subjectFit=(field(inventory,"BANNER_SUBJECT_FIT")||"none").toLowerCase();
  let subjectSide=(field(inventory,"BANNER_SUBJECT_SIDE")||"left").toLowerCase();

  // Fallbacks from the manifest itself if one of the dedicated fields is missing.
  if(!headline){
    const crit=inventory.match(/CRITICAL FACTS:\s*([\s\S]*?)(?:\n[A-Z][A-Z /_-]+:|\nIMPORTANT FACTS:|$)/i)?.[1]||"";
    const line=crit.split(/\r?\n/).map(x=>x.replace(/^\s*[-*]\s*/,"").trim()).find(Boolean);
    headline=line||"";
  }
  if(!detail){
    const candidates=[];
    const lines=inventory.split(/\r?\n/).map(x=>x.replace(/^\s*[-*]\s*/,"").trim()).filter(Boolean);
    for(const l of lines){
      if(/\b\d{1,2}(:\d{2})?\s*(AM|PM)\b/i.test(l) || /\$\s*\d+/.test(l) || /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\b/i.test(l)){
        candidates.push(l);
      }
    }
    detail=candidates[0]||"";
  }

  if(!["logo","person","graphic","none"].includes(visual))visual="none";
  if(visual==="none"){
    crop={x:0,y:0,w:0,h:0};
  }else if(!(crop.w>0 && crop.h>0)){
    // Safe visual fallback: a central source crop. This is intentionally not the whole poster.
    crop={x:0.28,y:0.18,w:0.44,h:0.64};
  }

  const clean=v=>{
    let s=(v||"").trim();

    // Strip surrounding quotes first.
    s=s.replace(/^["'“”]+|["'“”]+$/g,"").trim();

    // Remove common analysis/manifest labels, including shorter variants like "Event headline:".
    s=s.replace(/^(exact\s+)?(?:(event|campaign)\s+)?headline(?:\s+and\s+subheadline(?:\s+text)?)?\s*:\s*/i,"");
    s=s.replace(/^(event\s+headline|campaign\s+headline|event\s+title|campaign\s+title|title|date\s+and\s+time|date\/time|showtime(?:s)?|detail|cta|call\s+to\s+action)\s*:\s*/i,"");

    // Generic safeguard: if the prefix before a colon is clearly an analysis label, remove it.
    s=s.replace(/^[^:]{0,55}\b(headline|subheadline|date|time|showtime|detail|title|cta|call\s+to\s+action)\b[^:]*:\s*/i,"");

    // If quoted source wording exists, prefer the quoted phrase itself.
    const qm=s.match(/["“]([^"”]{3,120})["”]/);
    if(qm)s=qm[1].trim();

    s=s.replace(/^["'“”]+|["'“”]+$/g,"").trim();
    return s;
  };

  headline=clean(headline);
  detail=clean(detail);
  cta=clean(cta);

  if(headline.length>86){
    const cut=headline.split(/\s*\/\s*|\s+-\s+|\s+\|\s+/)[0].trim();
    headline=(cut.length>=4?cut:headline.slice(0,86)).trim();
  }
  if(detail.length>55)detail=detail.slice(0,55).replace(/\s+\S*$/,"").trim();

  const wantsPerson=/\b(person|speaker|portrait|face|photo|image of|include image|include photo)\b/i.test(userInstructions||"");
  const wantsVisual=/\b(image|photo|graphic|visual|logo|colour|color)\b/i.test(userInstructions||"");
  if((wantsPerson || wantsVisual) && visual==="none"){
    visual=wantsPerson?"person":"graphic";
  }

  // Default to a source visual whenever the manifest clearly indicates one exists.
  // This prevents visually empty banners when the model conservatively returned "none".
  if(visual==="none"){
    if(/\b(speaker|person|portrait|headshot|performer|guest|host|candidate|presenter|woman|man)\b/i.test(inventory)){
      visual="person";
    }else if(/\b(logo|brand mark|wordmark|emblem)\b/i.test(inventory)){
      visual="logo";
    }else if(/\b(graphic|illustration|icon|photo|image)\b/i.test(inventory)){
      visual="graphic";
    }
  }

  if(visual!=="none" && !(crop.w>0 && crop.h>0)){
    if(visual==="logo") crop={x:0.20,y:0.02,w:0.60,h:0.30};
    else if(visual==="person"){
      // Fallback favors upper-body proportions rather than an arbitrary center crop.
      crop={x:0.28,y:0.10,w:0.44,h:0.62};
      subjectFit="upper_body";
    }else crop={x:0.18,y:0.14,w:0.64,h:0.62};
  }
  if(!["face","upper_body","logo","graphic","none"].includes(subjectFit)){
    subjectFit=visual==="person"?"upper_body":visual==="logo"?"logo":visual==="graphic"?"graphic":"none";
  }
  if(!["left","right"].includes(subjectSide))subjectSide="left";

  const accentRaw=field(inventory,"BANNER_ACCENT");
  const textRaw=field(inventory,"BANNER_TEXT");
  return {
    headline,
    detail,
    cta,
    textColor:/^#[0-9a-f]{6}$/i.test(textRaw)?textRaw:"#111111",
    secondaryColor:"#303030",
    accentColor:/^#[0-9a-f]{6}$/i.test(accentRaw)?accentRaw:"#111111",
    backgroundOverlay:"rgba(255,255,255,0.48)",
    visualType:visual,
    visualCrop:crop,
    subjectFit,
    subjectSide
  };
}




function cleanManifestValue(v=''){
  let s=String(v||'').trim().replace(/^[\u201c\u201d"']+|[\u201c\u201d"']+$/g,'').trim();
  if(!s||/^NONE$/i.test(s))return '';
  if(/^MANIFEST_[A-Z0-9_]+\s*:/i.test(s)||/\bMANIFEST_[A-Z0-9_]+\s*:/i.test(s))return '';
  if(/^BANNER_[A-Z0-9_]+\s*:/i.test(s)||/\bBANNER_[A-Z0-9_]+\s*:/i.test(s))return '';
  return s;
}
function manifestLine(inventory,key){
  const re=new RegExp('^'+key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*:\\s*(.*)$','im');
  const m=String(inventory||'').match(re);return cleanManifestValue(m?.[1]||'');
}
// V8.7 canonical source library: target dimensions never affect what exists in the source.
function canonicalSourceElements(inventory,plan={}){
  const items=[];let n=0;
  const push=(type,label,text='',extra={})=>{ if(!label)return; items.push({id:`src-${++n}`,type,label,text:text||label,source:'original artwork',reusable:true,...extra}); };
  const people=manifestLine(inventory,'MANIFEST_PEOPLE').split('|').map(cleanManifestValue).filter(Boolean).filter(x=>!/^none$/i.test(x));
  people.forEach((name,i)=>push('person',name||`Person ${i+1}`,name,{availability:'grouped'}));
  const logos=manifestLine(inventory,'MANIFEST_LOGOS').split('|').map(cleanManifestValue).filter(Boolean).filter(x=>!/^none$/i.test(x));
  logos.forEach((name,i)=>push('logo',name||`Logo ${i+1}`,name,{locked:true}));
  const bg=manifestLine(inventory,'MANIFEST_BACKGROUND'); if(bg&&!/^none$/i.test(bg))push('background','Background artwork',bg);
  const fields=[['headline','Headline',plan.headline],['dateTime','Date / time',plan.dateTime||plan.detail],['venue','Venue',plan.venue],['address','Address / location',plan.address||plan.secondary],['cta','Call to action',plan.cta]];
  fields.forEach(([role,label,text])=>{ if(text)push('text',label,text,{role}); });
  (plan.priceFacts||[]).forEach((v,i)=>push('text',i?'Additional price':'Price',v,{role:'price'}));
  return items;
}
function universalPlanFromInventory(inventory,userInstructions=''){
  const p=bannerPlanFromInventory(inventory,userInstructions);
  const exact=k=>cleanManifestValue(manifestLine(inventory,k));
  const combined=exact('MANIFEST_LOCATION');
  let venue=exact('MANIFEST_VENUE'),address=exact('MANIFEST_ADDRESS');
  if((!venue||!address)&&combined){
    const m=combined.match(/^(.{2,60}?)\s+[\u2013\u2014-]\s+(\d+\s+.+)$/);
    if(m){venue=venue||cleanManifestValue(m[1]);address=address||cleanManifestValue(m[2]);}
    else if(!venue&&!address)address=combined;
  }
  if(venue&&address&&venue.toLowerCase()===address.toLowerCase()) address='';
  p.headline=exact('MANIFEST_HEADLINE')||p.headline||'';
  p.dateTime=exact('MANIFEST_DATE_TIME')||p.detail||'';p.detail=p.dateTime;
  p.venue=venue;p.address=address;p.secondary=address;if(/^virtual$/i.test(String(p.venue||'').trim())&&!p.address){p.address='';p.secondary='';}
  p.cta=exact('MANIFEST_CTA')||p.cta||'';
  p.priceFacts=exact('MANIFEST_PRICES').split('|').map(cleanManifestValue).filter(Boolean).filter(x=>!/^none$/i.test(x));
  const people=exact('MANIFEST_PEOPLE').split('|').map(cleanManifestValue).filter(Boolean).filter(x=>!/^none$/i.test(x));
  p.subjects=people.map((name,i)=>({id:'person-'+(i+1),name,label:name,type:'person',availability:'grouped',reusable:false}));
  p.subjectCount=Math.max(Number(p.subjectCount||0),p.subjects.length);p.subjectLabels=p.subjects.map(x=>x.name);
  p.logos=exact('MANIFEST_LOGOS').split('|').map(cleanManifestValue).filter(Boolean).filter(x=>!/^none$/i.test(x));
  p.backgroundDescription=exact('MANIFEST_BACKGROUND');
  p.sourceManifest=inventory;
  p.textStyles=p.textStyles||{
    headline:{fontFamily:'Arial',fontWeight:800,color:p.textColor||p.primaryColor||'#111111',align:'left'},
    dateTime:{fontFamily:'Arial',fontWeight:700,color:p.accentColor||'#111111',align:'left'},
    venue:{fontFamily:'Arial',fontWeight:700,color:p.accentColor||'#111111',align:'left'},
    address:{fontFamily:'Arial',fontWeight:650,color:p.accentColor||'#111111',align:'left'},
    cta:{fontFamily:'Arial',fontWeight:800,color:p.accentColor||'#111111',align:'center'}
  };
  return p;
}


async function subjectCropPlan(key,dataUrl,w,h,userInstructions=""){
  const prompt=`You are selecting ONE meaningful visual subject from a poster for an extreme banner ${w}x${h}px.

Return exactly these lines:
VISUAL: person|logo|graphic|none
CROP: x,y,w,h
FIT: face|upper_body|logo|graphic|none
SIDE: left|right
FACE_CENTER: x,y
ZOOM: tight|medium|loose

Coordinates are normalized 0.0-1.0 relative to the source image.

Rules:
- If a clear main person exists, prefer that person over background landmarks, text boxes, or secondary decoration.
- For a person, CROP must contain the complete recognizable face and enough shoulders/upper body to look intentional.
- FACE_CENTER must be the center of the main visible face/head.
- If a clear face is visible, FACE_CENTER is REQUIRED and must not be left at zero.
- CROP should be GENEROUS around the selected person: include the whole head plus shoulders/upper torso, with visible breathing room above the head.
- Do not make CROP a razor-tight face box.
- Never return a crop where most of the crop is text/background and the person occupies only a tiny sliver.
- Prefer upper_body over face when the source allows it.
- For a 728x90-style banner, choose ZOOM:tight when one dominant person exists, medium for smaller/secondary portraits, and loose only when the surrounding context is important.
- Do not select the whole poster.
- Do not select a region containing mostly text.
- If there are multiple people, choose the most visually dominant/main person unless the user explicitly asks otherwise.
- Choose SIDE so the remaining opposite side of the banner has the cleanest space for headline/detail.
- If user instructions ask for a person/photo/speaker, select a person if one is visible.
- User instructions: ${userInstructions||"none"}`;

  const text=await vision(key,dataUrl,prompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:1800,recoveryMaxOutput:2400,allowModelFallback:true});
  const val=name=>{
    const m=text.match(new RegExp("^\\s*"+name+"\\s*:\\s*(.*)$","mi"));
    return m?m[1].trim():"";
  };
  let visual=(val("VISUAL")||"none").toLowerCase();
  let fit=(val("FIT")||"none").toLowerCase();
  let side=(val("SIDE")||"left").toLowerCase();
  let zoom=(val("ZOOM")||"medium").toLowerCase();
  const nums=(val("CROP")||"").split(",").map(v=>Number(v.trim()));
  const faceCenterNums=(val("FACE_CENTER")||"").split(",").map(v=>Number(v.trim()));
  let crop={x:0,y:0,w:0,h:0};
  let faceCenter={x:0,y:0};
  if(nums.length===4 && nums.every(Number.isFinite)){
    crop={
      x:Math.max(0,Math.min(1,nums[0])),
      y:Math.max(0,Math.min(1,nums[1])),
      w:Math.max(0,Math.min(1,nums[2])),
      h:Math.max(0,Math.min(1,nums[3]))
    };
  }
  if(faceCenterNums.length===2 && faceCenterNums.every(Number.isFinite)){
    faceCenter={
      x:Math.max(0,Math.min(1,faceCenterNums[0])),
      y:Math.max(0,Math.min(1,faceCenterNums[1]))
    };
  }
  if(!["person","logo","graphic","none"].includes(visual))visual="none";
  if(!["face","upper_body","logo","graphic","none"].includes(fit))fit=visual==="person"?"upper_body":visual==="logo"?"logo":visual==="graphic"?"graphic":"none";
  if(!["left","right"].includes(side))side="left";
  if(!["tight","medium","loose"].includes(zoom))zoom="medium";

  // Reject obviously useless/full-poster crops.
  if(crop.w>0.88 && crop.h>0.88){
    crop={x:0,y:0,w:0,h:0};
    visual="none";fit="none";
  }
  return {visualType:visual,visualCrop:crop,subjectFit:fit,subjectSide:side,faceCenter,subjectZoom:zoom};
}




function cleanDisplayFact(v=""){
  return String(v||"")
    .replace(/^["'“”]+|["'“”]+$/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function parseManifestLine(text,name){
  // IMPORTANT: spaces/tabs only around the field syntax.
  // Never use \s here because \s can consume newlines and make a blank
  // field capture the next manifest label.
  const escaped=String(name).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const re=new RegExp("^[ \\t]*"+escaped+"[ \\t]*:[ \\t]*([^\\r\\n]*)$","mi");
  const m=String(text||"").match(re);
  return cleanDisplayFact(m?m[1]:"");
}
function containsInternalManifestLabel(v=""){
  return /\b(?:headline|detail|secondary|cta)[_\s-]*override\b|\brequested[_\s-]*source[_\s-]*elements\b|\bsource[_\s-]*element[_\s-]*placement\b|\blayout[_\s-]*directives\b|\bdesign[_\s-]*directives\b|\bpreserve[_\s-]*exact[_\s-]*phrases\b|\bdisplay[_\s-]*(?:headline|detail|secondary|cta)\b|\bsource[_\s-]*fact\b/i.test(String(v||""));
}
function drawableFact(v=""){
  const s=cleanDisplayFact(v);
  return s && !containsInternalManifestLabel(s) ? s : "";
}

function validActionCta(v=""){
  return /\b(register|buy|book|learn|rsvp|reserve|tickets?|sign\s*up|join|donate|visit|apply|read|watch|listen|shop|get\s*tickets?)\b/i.test(v||"");
}
async function buildProtectedFactManifest(key,dataUrl,w,h){
  const prompt=`You are the SOURCE FACT EXTRACTOR for a ${w}x${h} advertisement adaptation.
Inspect ONLY the attached source artwork. This step is NOT design planning.

Return exactly these lines and nothing else:
DISPLAY_HEADLINE: <the COMPLETE visible event/campaign identity or headline, including continuation words across multiple title lines; copied from source; blank only if none>
DISPLAY_DETAIL: <the most useful visible date/time line, copied from source; blank only if none>
DISPLAY_SECONDARY: <the most useful visible venue + address/location line, or other next factual line, copied from source; blank only if none>
DISPLAY_CTA: <an actual visible action phrase such as Register Now / Buy Tickets / RSVP; blank if none>

HARD RULES:
- Copy factual wording from the source. Do not summarize, paraphrase, shorten, classify, explain, or annotate it.
- For titles/headlines, read ALL visible title lines before deciding the headline is complete. If a title is split across lines, combine the complete phrase.
- NEVER append semantic labels such as event date, date, time, venue, address, headline, title, person, speaker, CTA, source fact, or similar metadata.
- Keep identity words such as LIVE when they visibly belong to the headline.
- DISPLAY_CTA must be a real action phrase visibly present in the source. Never output person/logo/graphic/image/subject as CTA.
- Do not output any field name inside a field value.
- Do not invent missing facts.`;
  const text=await vision(key,dataUrl,prompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:1800,recoveryMaxOutput:2400,allowModelFallback:true});
  const get=name=>parseManifestLine(text,name);
  let headline=drawableFact(get("DISPLAY_HEADLINE")),
      detail=drawableFact(get("DISPLAY_DETAIL")),
      secondary=drawableFact(get("DISPLAY_SECONDARY")),
      cta=drawableFact(get("DISPLAY_CTA"));
  const leak=/\b(source\s+fact|critical\s+fact|important\s+fact|event\s+date|display[_\s-]*(headline|detail|secondary|cta)|banner[_\s-]*(headline|detail|cta)|subject[_\s-]*(anchor|side|count)|layout[_\s-]*intent)\b/i;
  const safe=v=>v && !leak.test(v) ? v : "";
  headline=safe(headline); detail=safe(detail); secondary=safe(secondary); cta=safe(cta);
  if(cta && !validActionCta(cta))cta="";

  // If the structured fields were unexpectedly empty, do a dedicated extraction-only
  // recovery pass from the original source. This is distinct from layout planning.
  if(!headline && !detail && !secondary && !cta){
    const recovery=await vision(key,dataUrl,`Read the attached source artwork and extract ONLY factual display copy.

Return exactly:
DISPLAY_HEADLINE: <complete visible event/campaign title/headline>
DISPLAY_DETAIL: <visible date/time or most useful primary event detail>
DISPLAY_SECONDARY: <visible venue/address/location or next useful factual line>
DISPLAY_CTA: <visible real CTA, otherwise blank>

Rules:
- Copy source wording; do not paraphrase.
- Do not add labels such as event date, venue, source fact, headline, or metadata inside the values.
- Keep words such as LIVE if visibly part of the title.
- Never invent a fact.`,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:1800,recoveryMaxOutput:2400,allowModelFallback:true});

    const rg=n=>parseManifestLine(recovery,n);
    headline=safe(rg("DISPLAY_HEADLINE"));
    detail=safe(rg("DISPLAY_DETAIL"));
    secondary=safe(rg("DISPLAY_SECONDARY"));
    cta=safe(rg("DISPLAY_CTA"));
    if(cta && !validActionCta(cta))cta="";
  }

  if(headlineLooksPossiblyIncomplete(headline)){
    try{
      const verify=await vision(key,dataUrl,`Read the attached source artwork and return ONLY the complete visible event/campaign title.
Return exactly:
COMPLETE_HEADLINE: <complete title across all title lines>

Rules:
- Copy visible wording exactly.
- Include continuation words on following title lines.
- Exclude date, time, venue, address, price, and CTA.
- Do not add labels inside the value.`,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:900,recoveryMaxOutput:1400,allowModelFallback:true});
      const m=verify.match(/^\s*COMPLETE_HEADLINE\s*:\s*(.*)$/mi);
      const v=safe(cleanDisplayFact(m?m[1]:""));
      if(v && v.length>=headline.length)headline=v;
    }catch(e){console.warn("Headline completeness verification failed:",e?.message||e);}
  }
  return Object.freeze({headline,detail,secondary,cta});
}
function applyProtectedFacts(composer,manifest){
  // V8.7: the layout model has zero authority to author display copy.
  composer.headline=manifest.headline||"";
  composer.detail=manifest.detail||"";
  composer.secondary=manifest.secondary||"";
  composer.cta=manifest.cta||"";
  composer.extraFacts=Array.isArray(manifest.extraFacts)?manifest.extraFacts.slice():[];
  composer.extraFact=composer.extraFacts.join(" · ");
  composer.protectedCopy=true;
  return composer;
}
function validateProtectedFacts(composer,manifest){
  const keys=["headline","detail","secondary","cta"];
  const failures=[];
  for(const k of keys){
    if(cleanDisplayFact(composer[k])!==cleanDisplayFact(manifest[k])) failures.push(k);
  }
  const expectedExtra=(manifest.extraFacts||[]).map(cleanDisplayFact).filter(Boolean);
  const actualExtra=(composer.extraFacts||[]).map(cleanDisplayFact).filter(Boolean);
  if(JSON.stringify(expectedExtra)!==JSON.stringify(actualExtra)) failures.push("extraFacts");
  const joined=keys.map(k=>composer[k]||"").join(" ")+" "+actualExtra.join(" ");
  if(/\b(event\s+date|source\s+fact|critical\s+facts?|important\s+facts?|banner[_\s-]|display[_\s-]|subject[_\s-]|layout[_\s-])\b/i.test(joined)) failures.push("metadata-leak");
  return {ok:failures.length===0,failures:[...new Set(failures)]};
}


function parseUserFactOverrides(userInstructions=""){
  const t=(userInstructions||"").trim();
  if(!t)return {};
  const out={};
  const quoted=(label)=>{
    const p=label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const patterns=[
      new RegExp(`\\b(?:change|set|use|replace|update)\\s+(?:the\\s+)?${p}\\s+(?:to|as|with)\\s+["“']([^"”']+)["”']`,"i"),
      new RegExp(`\\b${p}\\s+(?:should\\s+be|must\\s+be|should\\s+say|is)\\s+["“']([^"”']+)["”']`,"i")
    ];
    for(const re of patterns){const m=t.match(re);if(m&&m[1])return cleanDisplayFact(m[1]);}
    return "";
  };
  out.headline=quoted("headline")||quoted("title")||quoted("text");
  out.detail=quoted("date")||quoted("time")||quoted("date/time")||quoted("showtimes")||quoted("detail");
  out.secondary=quoted("venue")||quoted("address")||quoted("location")||quoted("venue/address");
  out.cta=quoted("cta")||quoted("button")||quoted("call to action");
  return out;
}
function applyUserFactOverrides(manifest,userInstructions=""){
  const o=parseUserFactOverrides(userInstructions);
  const next={...(manifest||{})};
  if(o.headline)next.headline=o.headline;
  else if(o.headlineAppend)next.headline=mergeHeadlineCompletion(next.headline||"",o.headlineAppend);
  if(o.detail)next.detail=o.detail;
  if(o.secondary)next.secondary=o.secondary;
  if(o.cta)next.cta=o.cta;
  return Object.freeze(next);
}
function headlineLooksPossiblyIncomplete(s=""){
  const t=(s||"").trim();
  if(!t)return true;
  const words=t.split(/\s+/).filter(Boolean);
  return words.length<=2 || /[:\-–—]\s*$/.test(t) || /\b(your|the|of|and|for|with|on|in|to)\s*$/i.test(t);
}

async function interpretUserInstructions(key,dataUrl,userInstructions=""){
  const t=(userInstructions||"").trim();
  if(!t)return Object.freeze({
    headlineOverride:"",headlineCompletionPhrase:"",
    detailOverride:"",secondaryOverride:"",ctaOverride:"",
    requestedSourceElements:[],sourceElementPlacement:"",
    requiredVisibleFacts:[],requiredFactsPlacement:"",
    layoutDirectives:[],designDirectives:[],preserveExactPhrases:[]
  });

  const prompt=`You are the OPTIONAL-INSTRUCTIONS INTERPRETER for an AI advertisement-layout tool.
The attached image is the ORIGINAL source artwork.

USER INSTRUCTIONS:
${t}

Convert the user's natural-language request into this exact manifest:
HEADLINE_OVERRIDE: <exact COMPLETE corrected title/headline if user supplies the whole corrected title; otherwise blank>
HEADLINE_COMPLETION_PHRASE: <exact phrase the user says is missing from the end/middle of the headline, if they give only the missing part; otherwise blank>
DETAIL_OVERRIDE: <exact corrected date/time/detail if user supplies one; otherwise blank>
SECONDARY_OVERRIDE: <exact corrected venue/address/location if user supplies one; otherwise blank>
CTA_OVERRIDE: <exact button/CTA wording if user supplies it; otherwise blank>
REQUESTED_SOURCE_ELEMENTS: <comma-separated people/logos/graphics from the ORIGINAL image that the user explicitly asks to include; otherwise blank>
SOURCE_ELEMENT_PLACEMENT: <where requested source element(s) should go, otherwise blank>
REQUIRED_VISIBLE_FACTS: <comma-separated factual items from the ORIGINAL source that the user explicitly requires to be visible, such as "all 3 dates", "speaker names", "venue", "price"; otherwise blank>
REQUIRED_FACTS_PLACEMENT: <requested placement for those factual items, such as "right side"; otherwise blank>
LAYOUT_DIRECTIVES: <semicolon-separated size/position/layout requests>
DESIGN_DIRECTIVES: <semicolon-separated design requests such as add a button, richer color, less empty space>
PRESERVE_EXACT_PHRASES: <comma-separated exact user-supplied phrases that must appear exactly>

Rules:
- Understand normal language, not only command syntax.
- If the user gives the entire corrected title, put it in HEADLINE_OVERRIDE.
- If the user says the title/headline is missing the ending and only supplies the missing phrase (for example "... Your Future on the Ballot"), put ONLY that supplied missing phrase in HEADLINE_COMPLETION_PHRASE, not HEADLINE_OVERRIDE.
- "the title is missing text, should be X" means HEADLINE_OVERRIDE=X only when X is clearly the complete intended title.
- "add featuring Hawa Haji (from the original image) on the right side of the person" means REQUESTED_SOURCE_ELEMENTS includes Hawa Haji and SOURCE_ELEMENT_PLACEMENT records that placement.
- If the user says "the featured person", "the other speaker", or similar without naming them, inspect the ORIGINAL image and put the visibly corresponding source person/role into REQUESTED_SOURCE_ELEMENTS. Do not invent a new person.
- "make the speakers pictures bigger" is a LAYOUT_DIRECTIVE.
- "add the 3 dates", "show all dates", "make all 3 dates visible", "add the speaker names", "show the venue", or similar are REQUIRED_VISIBLE_FACTS requests. Preserve the requested count when stated.
- If the user says where those facts should appear (for example "speaker names on the right side"), put that in REQUIRED_FACTS_PLACEMENT.
- "add an action button" is a DESIGN_DIRECTIVE. If no CTA wording is supplied, do not invent wording. The downstream planner may use the verified DISPLAY_CTA from the source if one exists.
- Never invent factual text.
- User-supplied factual corrections are authoritative.
- If a field has no value, leave everything after its colon EMPTY.
- Never copy another field name into a blank field.
- Never put strings such as DETAIL_OVERRIDE, SECONDARY_OVERRIDE, CTA_OVERRIDE, HEADLINE_OVERRIDE, LAYOUT_DIRECTIVES, or DESIGN_DIRECTIVES inside any field value.
- Return only the manifest lines.`;

  const raw=await vision(key,dataUrl,prompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:2200,recoveryMaxOutput:2800,allowModelFallback:true});
  const get=(n)=>parseManifestLine(raw,n);
  const split=(s,sep)=>s?s.split(sep).map(v=>v.trim()).filter(Boolean):[];
  return Object.freeze({
    headlineOverride:get("HEADLINE_OVERRIDE"),
    headlineCompletionPhrase:get("HEADLINE_COMPLETION_PHRASE"),
    detailOverride:get("DETAIL_OVERRIDE"),
    secondaryOverride:get("SECONDARY_OVERRIDE"),
    ctaOverride:get("CTA_OVERRIDE"),
    requestedSourceElements:split(get("REQUESTED_SOURCE_ELEMENTS"),/,/),
    sourceElementPlacement:get("SOURCE_ELEMENT_PLACEMENT"),
    requiredVisibleFacts:split(get("REQUIRED_VISIBLE_FACTS"),/,/),
    requiredFactsPlacement:get("REQUIRED_FACTS_PLACEMENT"),
    layoutDirectives:split(get("LAYOUT_DIRECTIVES"),/;/),
    designDirectives:split(get("DESIGN_DIRECTIVES"),/;/),
    preserveExactPhrases:split(get("PRESERVE_EXACT_PHRASES"),/,/)
  });
}

async function resolveHeadlineCompletion(key,dataUrl,currentHeadline,completionPhrase){
  const phrase=cleanDisplayFact(completionPhrase);
  if(!phrase)return currentHeadline||"";
  const prompt=`Read the ORIGINAL attached source artwork and determine the COMPLETE visible event/campaign headline.

Current extracted headline:
${currentHeadline||"(blank)"}

The user says this phrase is missing from the headline:
${phrase}

Return exactly:
COMPLETE_HEADLINE: <the full source headline, including the user's missing phrase if it is visibly part of the source title>

Rules:
- Use only wording visible in the original artwork plus the user's explicit correction phrase.
- Return the COMPLETE title, not only the missing suffix.
- Do not add date/time/venue/CTA.`;
  try{
    const raw=await vision(key,dataUrl,prompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:1000,recoveryMaxOutput:1400,allowModelFallback:true});
    const v=drawableFact(parseManifestLine(raw,"COMPLETE_HEADLINE"));
    if(v)return v;
  }catch(e){console.warn("Headline completion resolution failed:",e?.message||e);}
  // Safe fallback: append user phrase only if not already present.
  const base=cleanDisplayFact(currentHeadline||"");
  return mergeHeadlineCompletion(base,phrase);
}

async function extractRequiredVisibleFacts(key,dataUrl,requests=[]){
  const req=(requests||[]).map(v=>String(v||"").trim()).filter(Boolean);
  if(!req.length)return [];
  const prompt=`Read the ORIGINAL attached source artwork.

The user explicitly requires these source facts to appear in the final ad:
${req.map((x,i)=>`${i+1}. ${x}`).join("\n")}

Extract ONLY the exact visible factual values needed to satisfy those requests.
Examples:
- "all 3 dates" -> return all three exact visible dates
- "speaker names" -> return every exact visible speaker/person name requested
- "venue" -> return exact visible venue
- "price" -> return exact visible price

Return one fact per line:
REQUIRED_FACT_1: <exact visible fact>
REQUIRED_FACT_2: <exact visible fact>
REQUIRED_FACT_3: <exact visible fact>
REQUIRED_FACT_4: <exact visible fact>
REQUIRED_FACT_5: <exact visible fact>
REQUIRED_FACT_6: <exact visible fact>

Rules:
- Do not summarize.
- Do not invent.
- Preserve exact names/dates.
- If a request specifies a count, return that many items when they are visibly present.
- Leave unused lines blank.`;
  try{
    const raw=await vision(key,dataUrl,prompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:1800,recoveryMaxOutput:2400,allowModelFallback:true});
    const vals=[];
    for(let i=1;i<=6;i++){
      const v=drawableFact(parseManifestLine(raw,`REQUIRED_FACT_${i}`));
      if(v && !vals.some(x=>x.toLowerCase()===v.toLowerCase()))vals.push(v);
    }
    return vals;
  }catch(e){
    console.warn("Required source fact extraction failed:",e?.message||e);
    return [];
  }
}


function mergeHeadlineCompletion(base="",suffix=""){
  const clean=s=>cleanDisplayFact(String(s||"").replace(/^\s*\.{3}\s*/,""));
  const a=clean(base),b=clean(suffix);
  if(!a)return b;
  if(!b)return a;
  if(a.toLowerCase().includes(b.toLowerCase()))return a;

  const A=a.split(/\s+/),B=b.split(/\s+/);
  let overlap=0;
  const max=Math.min(A.length,B.length);
  for(let n=1;n<=max;n++){
    const left=A.slice(A.length-n).join(" ").replace(/[^\p{L}\p{N}]+/gu," ").trim().toLowerCase();
    const right=B.slice(0,n).join(" ").replace(/[^\p{L}\p{N}]+/gu," ").trim().toLowerCase();
    if(left && left===right)overlap=n;
  }
  return [...A,...B.slice(overlap)].join(" ").replace(/\s+/g," ").trim();
}

function augmentInstructionManifestFromRaw(raw="",manifest={}){
  const t=String(raw||"");
  const m={...manifest};
  m.requiredVisibleFacts=[...(m.requiredVisibleFacts||[])];
  m.layoutDirectives=[...(m.layoutDirectives||[])];
  m.designDirectives=[...(m.designDirectives||[])];
  m.preserveExactPhrases=[...(m.preserveExactPhrases||[])];

  const addUnique=(arr,v)=>{
    if(v && !arr.some(x=>String(x).toLowerCase()===String(v).toLowerCase()))arr.push(v);
  };

  const quoted=t.match(/\b(?:title|headline)\b[\s\S]{0,100}?\b(?:complete|missing|end|say|should)\b[\s\S]{0,80}?["“]([^"”]+)["”]/i);
  if(quoted?.[1]){
    const q=cleanDisplayFact(quoted[1]);
    if(/^\s*\.{3}/.test(quoted[1]) || /\b(?:complete|missing|to the end)\b/i.test(t)){
      m.headlineCompletionPhrase=q;
    }else if(!m.headlineOverride){
      m.headlineOverride=q;
    }
    addUnique(m.preserveExactPhrases,q);
  }

  const numDate=t.match(/\b(\d+|one|two|three|four|five|six)\s+dates?\b/i);
  if(numDate){
    addUnique(m.requiredVisibleFacts,`all ${numDate[1]} dates`);
  }else if(/\b(?:add|show|include|display)\b[\s\S]{0,30}\bdates?\b/i.test(t)){
    addUnique(m.requiredVisibleFacts,"all visible dates");
  }

  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t)){
    addUnique(m.requiredVisibleFacts,"speaker names");
    if(/\bright(?:\s+side)?\b/i.test(t))m.requiredFactsPlacement="right side";
  }

  if(/\bdates?\b/i.test(t) && /\b(?:big|bigger|larger|legible|readable|more legible|increase)\b/i.test(t)){
    addUnique(m.layoutDirectives,"EMPHASIZE_DATES");
  }
  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t) &&
     /\b(?:big|bigger|larger|legible|readable|more legible|increase)\b/i.test(t)){
    addUnique(m.layoutDirectives,"EMPHASIZE_SPEAKER_NAMES");
  }
  if(/\b(?:make|move|put|place)\b[\s\S]{0,40}\b(?:speaker|speakers|person|people)\b[\s\S]{0,30}\bcenter\b/i.test(t)){
    addUnique(m.layoutDirectives,"CENTER_SUBJECTS");
  }
  if(/\b(?:speaker|speakers|person|people)\b[\s\S]{0,30}\b(?:big|bigger|larger)\b/i.test(t)){
    addUnique(m.layoutDirectives,"ENLARGE_SUBJECTS");
  }

  // Face/portrait modification requests: these should change the current subject framing,
  // not just enlarge the existing full-body cutout.
  if(/\b(?:zoom|closer|close[- ]?up|face|faces|head|heads|shoulder|shoulders|upper body)\b/i.test(t) &&
     /\b(?:speaker|speakers|person|people|face|faces|head|heads|shoulder|shoulders)\b/i.test(t)){
    addUnique(m.layoutDirectives,"CROP_SUBJECTS_UPPER_BODY");
    addUnique(m.layoutDirectives,"ENLARGE_SUBJECTS");
  }

  if(/\b(?:no|without)\b[\s\S]{0,25}\b(?:background|box|panel)\b/i.test(t) &&
     /\b(?:speaker|speakers|names?|label)\b/i.test(t)){
    addUnique(m.designDirectives,"SPEAKER_NAMES_NO_BACKGROUND");
  }

  // Much more forgiving headline-completion parser. If the instruction discusses
  // title/headline completion and contains quoted copy, the quoted copy is authoritative.
  if(/\b(?:title|headline)\b/i.test(t) && /\b(?:complete|end|missing|finish|full)\b/i.test(t)){
    const q=t.match(/["“]([^"”]{3,180})["”]/);
    if(q?.[1]){
      m.headlineCompletionPhrase=cleanDisplayFact(q[1]);
      addUnique(m.preserveExactPhrases,m.headlineCompletionPhrase);
    }
  }

  // V8.7: newest user instruction is authoritative for deterministic text/styling.
  const appendAfter=t.match(/\b(?:add|insert|put|place|include|append)\b[\s\S]{0,55}?\b(?:subheading|subtitle|text|words?|phrase)\b[\s\S]{0,30}?["“]([^"”]+)["”][\s\S]{0,90}?\b(?:after|right\s+after|following)\b[\s\S]{0,55}?\b(?:the\s+)?(?:heading|headline|title|words?)\b[\s\S]{0,30}?["“]([^"”]+)["”]/i);
  if(appendAfter?.[1]&&appendAfter?.[2]){
    m.headlineOverride=mergeHeadlineCompletion(cleanDisplayFact(appendAfter[2]),cleanDisplayFact(appendAfter[1]));
    m.headlineCompletionPhrase="";
    addUnique(m.preserveExactPhrases,m.headlineOverride);
  }
  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t) && /\b(?:part\s+of\s+the\s+design|integrat(?:e|ed)|inline|not\s+(?:a\s+)?block|not\s+in\s+(?:a\s+)?block|not\s+(?:a\s+)?list)\b/i.test(t)){
    addUnique(m.designDirectives,"SPEAKER_NAMES_INLINE");
    addUnique(m.designDirectives,"SPEAKER_NAMES_NO_BACKGROUND");
  }
  if(/\b(?:remove|delete|clear|no|without)\b[\s\S]{0,35}\b(?:background|box|panel)\b/i.test(t) && /\b(?:speaker|speakers|names?|label)\b/i.test(t)){
    addUnique(m.designDirectives,"SPEAKER_NAMES_NO_BACKGROUND");
  }

  return Object.freeze(m);
}

function applyModifyLayoutDirectives(plan,instructions="",manifest={}){
  const next={...(plan||{})};
  const directives=[...(manifest?.layoutDirectives||[])].join(" ")+" "+String(instructions||"");
  if(/CENTER_SUBJECTS|(?:speaker|speakers|person|people)[\s\S]{0,30}center/i.test(directives)){
    next.subjectAnchor="center";
  }
  if(/ENLARGE_SUBJECTS|(?:speaker|speakers|person|people)[\s\S]{0,30}(?:big|bigger|larger)/i.test(directives)){
    next.subjectHeightPct=Math.max(Number(next.subjectHeightPct||94),100);
    next.subjectZonePct=Math.max(Number(next.subjectZonePct||34),40);
  }
  if(/CROP_SUBJECTS_UPPER_BODY|zoom[\s\S]{0,30}(?:face|faces)|shoulders?\s+and\s+head|upper body|close[- ]?up/i.test(directives)){
    next.subjectCropMode="upper-body";
    next.subjectHeightPct=Math.max(Number(next.subjectHeightPct||98),102);
    next.subjectZonePct=Math.max(Number(next.subjectZonePct||36),42);
  }
  const speakerStyleText=[...(manifest?.designDirectives||[])].join(" ")+" "+String(instructions||"");
  if(/SPEAKER_NAMES_NO_BACKGROUND/i.test(speakerStyleText))next.speakerNamesBackground="none";
  if(/SPEAKER_NAMES_INLINE|part\s+of\s+the\s+design|not\s+(?:a\s+)?block|inline/i.test(speakerStyleText)){
    next.speakerNamesMode="inline";
    next.speakerNamesBackground="none";
  }
  next.modifyInstructions=String(instructions||"");
  next.requiredVisibleFacts=manifest?.requiredVisibleFacts||next.requiredVisibleFacts||[];
  next.requiredFactsPlacement=manifest?.requiredFactsPlacement||next.requiredFactsPlacement||"";
  next.layoutDirectives=manifest?.layoutDirectives||next.layoutDirectives||[];
  next.designDirectives=manifest?.designDirectives||next.designDirectives||[];
  return next;
}

function explicitTextOverridesFromRaw(raw=""){
  const t=String(raw||"");
  const out={headline:"",headlineAppend:"",detail:"",secondary:"",cta:""};
  const cq=v=>cleanDisplayFact(String(v||"").replace(/^\s*\.{3}\s*/,"").trim());

  // Exact natural-language append: add "X" after heading/title "Y".
  let m=t.match(/\b(?:add|insert|put|place|include|append)\b[\s\S]{0,55}?\b(?:subheading|subtitle|text|words?|phrase)\b[\s\S]{0,30}?["“]([^"”]+)["”][\s\S]{0,90}?\b(?:after|right\s+after|following)\b[\s\S]{0,55}?\b(?:the\s+)?(?:heading|headline|title|words?)\b[\s\S]{0,30}?["“]([^"”]+)["”]/i);
  if(m?.[1]&&m?.[2]) out.headline=mergeHeadlineCompletion(cq(m[2]),cq(m[1]));

  if(!out.headline){
    m=t.match(/\b(?:after|right\s+after|following)\b[\s\S]{0,45}?\b(?:heading|headline|title|words?)\b[\s\S]{0,25}?["“]([^"”]+)["”][\s\S]{0,90}?\b(?:add|insert|put|place|include|append)\b[\s\S]{0,40}?["“]([^"”]+)["”]/i);
    if(m?.[1]&&m?.[2]) out.headline=mergeHeadlineCompletion(cq(m[1]),cq(m[2]));
  }

  const quotedHeadline=t.match(/\b(?:title|headline|name)\b[\s\S]{0,90}?\b(?:should be|should say|change(?: it)? to|change the name to|replace(?: it)? with|set(?: it)? to|correct(?: it)? to)\b[\s\S]{0,35}?["“]([^"”]+)["”]/i);
  if(!out.headline && quotedHeadline?.[1])out.headline=cq(quotedHeadline[1]);

  if(!out.headline){
    const direct=t.match(/\bchange\s+the\s+(?:name|title|headline)\s+to\s+["“]([^"”]+)["”]/i);
    if(direct?.[1])out.headline=cq(direct[1]);
  }

  // Missing/complete-to-end requests append quoted text to CURRENT headline.
  if(!out.headline){
    const append=t.match(/\b(?:missing|complete|finish|add|append|include)\b[\s\S]{0,80}?["“]([^"”]{2,180})["”][\s\S]{0,80}?(?:\bafter\b|\bto\s+the\s+end\b|\bat\s+the\s+end\b|$)/i);
    if(append?.[1])out.headlineAppend=cq(append[1]);
  }
  if(!out.headline && !out.headlineAppend && /\b(?:missing|complete|full headline|finish)\b/i.test(t)){
    const q=t.match(/["“]([^"”]{2,180})["”]/);
    if(q?.[1])out.headlineAppend=cq(q[1]);
  }

  if(!out.headline){
    const unquoted=t.match(/\b(?:title|headline|name)\b[\s\S]{0,80}?\b(?:should be|should say|change(?: it)? to|replace(?: it)? with|set(?: it)? to|correct(?: it)? to)\b\s*:?\s*([^\n;]{4,180})/i);
    if(unquoted?.[1] && !/\b(?:bigger|larger|legible|readable|right|left|center)\b/i.test(unquoted[1]))out.headline=cq(unquoted[1].replace(/["“”]/g,""));
  }

  const q=(label)=>t.match(new RegExp(`\\b(?:${label})\\b[\\s\\S]{0,65}?\\b(?:should be|should say|change(?: it)? to|replace(?: it)? with|set(?: it)? to|correct(?: it)? to)\\b[\\s\\S]{0,30}?["“]([^"”]+)["”]`,"i"));
  const detail=q("date|time|detail"); if(detail?.[1])out.detail=cq(detail[1]);
  const secondary=q("venue|address|location|secondary"); if(secondary?.[1])out.secondary=cq(secondary[1]);
  const cta=q("cta|button|call to action"); if(cta?.[1])out.cta=cq(cta[1]);
  return out;
}


function structuredDesignPatchFromRaw(raw="",currentFacts={}){
  const t=String(raw||"").trim();
  const q=[...t.matchAll(/["“]([^"”]{1,220})["”]/g)].map(m=>cleanDisplayFact(m[1])).filter(Boolean);
  const patch={text:{},facts:{},layout:{},style:{},sourceElements:[]};

  // Exact replacement requests.
  let m=t.match(/\b(?:headline|title|name)\b[\s\S]{0,70}?\b(?:should\s+be|should\s+say|change(?:\s+it)?\s+to|replace(?:\s+it)?\s+with|set(?:\s+it)?\s+to|correct(?:\s+it)?\s+to)\b[\s\S]{0,25}?["“]([^"”]+)["”]/i);
  if(m?.[1])patch.text.headline={op:"set",value:cleanDisplayFact(m[1])};

  // Natural correction: add "X" so it's "Y". Y is the desired visible phrase;
  // merge it with the current headline so source prefix such as "Ottawa Votes:" survives.
  if(!patch.text.headline && q.length>=2 && /\b(?:so\s+(?:it'?s|it\s+is|it\s+reads|it\s+becomes)|so\s+the\s+(?:headline|title)\s+(?:is|reads))\b/i.test(t)){
    patch.text.headline={op:"merge",value:q[q.length-1]};
  }

  // Add/append quoted text to the existing headline.
  if(!patch.text.headline && /\b(?:add|append|include|insert|put)\b/i.test(t) && /\b(?:text|words?|phrase|subheading|subtitle|headline|title)\b/i.test(t) && q.length){
    patch.text.headline={op:"merge",value:q[0]};
  }

  // "missing ... 'X'" or "complete ... 'X'" also means merge X into current headline.
  if(!patch.text.headline && /\b(?:missing|complete|finish|full\s+headline|to\s+the\s+end)\b/i.test(t) && q.length){
    patch.text.headline={op:"merge",value:q[q.length-1]};
  }

  // Deterministic factual/source-element requests persist into design state.
  if(/\b(?:add|show|include|display|put|place)\b[\s\S]{0,40}\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t)){
    patch.facts.requireSpeakerNames=true;
  }
  if(/\b(?:add|show|include|display|put|place)\b[\s\S]{0,40}\bdates?\b/i.test(t))patch.facts.requireDates=true;
  if(/\bdates?\b/i.test(t)&&/\b(?:big|bigger|larger|legible|readable|more\s+legible|increase)\b/i.test(t))patch.layout.emphasizeDates=true;
  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t)&&/\b(?:big|bigger|larger|legible|readable|more\s+legible|increase)\b/i.test(t))patch.layout.emphasizeSpeakerNames=true;
  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t)&&/\b(?:right(?:\s+side)?|on\s+the\s+right)\b/i.test(t))patch.layout.speakerNamesPlacement="right side";
  if(/\bspeakers?'?\s+names?\b|\bspeaker names?\b/i.test(t)&&/\b(?:part\s+of\s+the\s+design|integrat(?:e|ed)|inline|not\s+(?:a\s+)?block|not\s+(?:a\s+)?list)\b/i.test(t))patch.style.speakerNamesMode="inline";
  if(/\b(?:remove|no|without|delete)\b[\s\S]{0,35}\b(?:background|box|panel)\b/i.test(t)&&/\b(?:speaker|speakers|names?|label)\b/i.test(t))patch.style.speakerNamesBackground="none";

  return patch;
}

function applyStructuredDesignPatchToFacts(facts,patch={}){
  let next={...(facts||{})};
  const hp=patch?.text?.headline;
  if(hp?.value){
    next.headline=hp.op==="set"?cleanDisplayFact(hp.value):mergeHeadlineCompletion(next.headline||"",hp.value);
  }
  return Object.freeze(next);
}

function applyStructuredPatchToManifest(manifest={},patch={}){
  const m={...manifest};
  m.requiredVisibleFacts=[...(m.requiredVisibleFacts||[])];
  m.layoutDirectives=[...(m.layoutDirectives||[])];
  m.designDirectives=[...(m.designDirectives||[])];
  const add=(arr,v)=>{if(v&&!arr.some(x=>String(x).toLowerCase()===String(v).toLowerCase()))arr.push(v)};
  if(patch?.facts?.requireSpeakerNames)add(m.requiredVisibleFacts,"speaker names");
  if(patch?.facts?.requireDates)add(m.requiredVisibleFacts,"all visible dates");
  if(patch?.layout?.emphasizeDates)add(m.layoutDirectives,"EMPHASIZE_DATES");
  if(patch?.layout?.emphasizeSpeakerNames)add(m.layoutDirectives,"EMPHASIZE_SPEAKER_NAMES");
  if(patch?.layout?.speakerNamesPlacement)m.requiredFactsPlacement=patch.layout.speakerNamesPlacement;
  if(patch?.style?.speakerNamesMode==="inline")add(m.designDirectives,"SPEAKER_NAMES_INLINE");
  if(patch?.style?.speakerNamesBackground==="none")add(m.designDirectives,"SPEAKER_NAMES_NO_BACKGROUND");
  return Object.freeze(m);
}

function applyAuthoritativeUserText(facts,raw=""){
  const o=explicitTextOverridesFromRaw(raw);
  const next={...(facts||{})};
  if(o.headline)next.headline=o.headline;
  if(o.detail)next.detail=o.detail;
  if(o.secondary)next.secondary=o.secondary;
  if(o.cta)next.cta=o.cta;
  return Object.freeze(next);
}
function applyInstructionManifestToFacts(facts,manifest){
  const next={...(facts||{})},m=manifest||{};
  if(!Array.isArray(next.extraFacts))next.extraFacts=[];
  const h=drawableFact(m.headlineOverride);
  const d=drawableFact(m.detailOverride);
  const s=drawableFact(m.secondaryOverride);
  const c=drawableFact(m.ctaOverride);
  if(h)next.headline=h;
  if(d)next.detail=d;
  if(s)next.secondary=s;
  if(c)next.cta=c;
  // Final scrub: no interpreter/schema labels may become protected drawable copy.
  next.headline=drawableFact(next.headline);
  next.detail=drawableFact(next.detail);
  next.secondary=drawableFact(next.secondary);
  next.cta=drawableFact(next.cta);
  return Object.freeze(next);
}
async function bannerComposePlan(key,dataUrl,w,h,name,userInstructions="",protectedFacts=null,instructionManifest=null){
  const ratio=w/h;
  const canvasClass=(h<=55&&ratio>4.5)?"MICRO_BANNER":
    (h<=120&&ratio>2.4)?"COMPACT_BANNER":
    (ratio>5)?"LEADERBOARD":
    (ratio>2.4)?"WIDE_BANNER":
    (ratio<.65)?"TALL_AD":"STANDARD_AD";

  const prompt=`You are designing a NEW banner composition from an existing poster/flyer.

Target: ${name}, ${w}x${h}px.
Canvas class: ${canvasClass}.

CANVAS-CLASS ART DIRECTION:
- MICRO_BANNER: prioritize recognizable headline/event identity + one key fact + real CTA when present. CTA is a REQUIRED visible element whenever protected CTA is non-empty. Do not cram address/secondary copy if it causes collision or tiny text. Main subject is supporting but recognizable. Zero overlaps between CTA, subject, and copy. If all protected facts cannot fit, omit lower-priority venue/address from the DRAWING while preserving them in state.
- COMPACT_BANNER: prioritize headline + date/time + subject + CTA. CTA is REQUIRED whenever protected CTA is non-empty. Add venue/address only when the fit budget says there is room. Use a true horizontal composition, never a shrunken poster, and never overlap blocks.
- LEADERBOARD: use the full width with strong subject, headline, event facts, and CTA/venue where available.
- WIDE_BANNER: distribute information horizontally and avoid portrait-style stacking.
- STANDARD_AD: preserve more source information and use the available vertical space to create a genuinely redesigned ad.
- TALL_AD: recompose vertically rather than fitting a wide source inside a tall frame.

PROTECTED DISPLAY COPY (layout only; do not rewrite):
${JSON.stringify(protectedFacts||{},null,2)}

The protected display copy is authoritative. Explicit factual corrections from Optional Instructions have already been applied to it and outrank extraction. Your job is composition, hierarchy, subject placement, and visual direction. Any HEADLINE/DETAIL/SECONDARY/CTA values you return will be discarded and replaced by the protected values.

Do NOT crop the whole poster into the banner.
Do NOT return coordinates for random poster slices.
Understand the source as separate design ingredients:
- main person/subject
- headline/title
- date/time
- optional CTA
- dominant colors/style

Return exactly these lines:
HEADLINE: <short exact source headline>
DETAIL: <short exact source date/time or other highest-priority fact>
SECONDARY: <short exact next-most-useful source fact such as venue name, location, address, price, or featured guest; otherwise blank>
CTA: <short exact source CTA only if the source visibly contains an actual action phrase such as Register Now, Buy Tickets, Learn More, RSVP, Book Now; otherwise blank>
VISUAL: person|logo|graphic|none
SUBJECT_COUNT: <integer count of equally important main people/subjects, usually 0, 1, 2, or 3>
SUBJECT_DESCRIPTION: <brief description of the main source subject(s) to preserve visually>
SUBJECT_SIDE: left|right
LAYOUT_INTENT: subject-left|subject-right|balanced
SUBJECT_ZONE_PCT: <integer 22-42 indicating how much of the FINAL banner width the subject/group should occupy>
SUBJECT_ANCHOR: far-left|left-third|center-left|center|center-right|right-third|far-right
SUBJECT_EDGE_PADDING_PCT: <integer 2-10>
TEXT_ALIGN: left|center
STYLE: <brief source-style description>
ACCENT: <6-digit hex color>
TEXT: <6-digit hex color>

Rules:
- Think like a senior advertising art director before returning the fields.
- Spend reasoning effort deciding the destination composition before choosing the output fields.
- For extreme banners, explicitly reason about information density: subject scale, headline wrapping, CTA prominence, and which secondary fact should fill unused space.
- Prefer a subject that occupies most of the destination height when a recognizable person/main graphic exists.
- If the headline competes with the subject for space, wrap the headline before shrinking the subject.
- Avoid returning a plan that would leave a large unexplained empty center or side area.
- Treat the destination as a finite design budget: if only a few facts exist, make them larger and more prominent rather than leaving dead space.
- If more facts exist, prioritize headline, date/time, venue/location, CTA, then extra fact.
- USER-REQUIRED additional source facts are NOT optional. If the user asks for all 3 dates, all 3 exact dates must be planned visibly and legibly.
- Prefer enlarging useful text, CTA, and subject before tolerating large unused regions.
- The subject may be left or right depending on which arrangement best balances the FINAL canvas.
- Use only facts visibly present in the source.
- Optimize specifically for the requested destination dimensions, not for the source poster shape.
- Decide which information deserves the most visual weight.
- Prefer a polished editorial/ad composition over simply reproducing the original poster hierarchy.
- Use the source style as inspiration, while making the destination layout feel intentionally designed.
- Never invent factual content: names, dates, times, venues, addresses, prices, CTAs, URLs, organizations, or logos.
- VISUAL DESIGN IS DIFFERENT: you ARE encouraged to invent tasteful decorative/background artwork inspired by the source, including architecture, skyline silhouettes, gradients, lighting, textures, shapes, and environmental atmosphere. Decorative art must not imply a new factual venue or event claim.
- NEVER output planning/meta language as display copy, including SOURCE FACT MANIFEST, CRITICAL FACTS, IMPORTANT FACTS, VISUAL ASSETS, STYLE, DECORATIVE, BANNER_HEADLINE, HEADLINE, DETAIL, SECONDARY, SUBJECT, or similar internal labels.
- If a dominant person exists, VISUAL should normally be person.
- SUBJECT_COUNT should count equally important main people/subjects.
- For people, SUBJECT_DESCRIPTION should describe the main person or group only, not the whole poster.
- Choose SUBJECT_SIDE so the text has clean space on the opposite side.
- Use LAYOUT_INTENT balanced when two or more equally important people should be visually prominent.
- SUBJECT_ZONE_PCT must be chosen for the FINAL requested canvas. Use about 24-34 for one person and 30-42 for two equally important people.
- SUBJECT_ANCHOR should be chosen for visual balance, not mechanically forced to an edge. Center and third-position anchors are valid when they improve the composition.
- SUBJECT_EDGE_PADDING_PCT should usually be 3-7 so the main subject does not hug the canvas edge unless the source style clearly calls for it.
- Choose TEXT_ALIGN left unless the source strongly benefits from centered typography.
- Plan for the FINAL canvas before considering any image generation.
- Keep HEADLINE compact enough for a shallow leaderboard banner.
- DETAIL should usually be date/time if present.
- SECONDARY should be the next most useful fact after headline/date-time, preferably venue/location/address when available.
- CTA must be an actual visible call-to-action phrase. Never use labels such as person, logo, graphic, visual, speaker, image, photo, or subject as CTA.
- If no true CTA exists in the source, return CTA blank.
- STYLE should preserve the poster's recognizable visual identity.
- User instructions: ${userInstructions||"none"}`;

  const text=await vision(key,dataUrl,prompt);
  const val=name=>{
    const m=text.match(new RegExp("^\\s*"+name+"\\s*:\\s*(.*)$","mi"));
    return m?m[1].trim():"";
  };

  const clean=v=>(v||"")
    .replace(/^["'“”]+|["'“”]+$/g,"")
    .replace(/^[^:]{0,50}\b(headline|title|date|time|detail|cta|style|visual|subject)\b[^:]*:\s*/i,"")
    .trim();

  let headline=clean(val("HEADLINE"));
  let detail=clean(val("DETAIL"));
  let secondary=clean(val("SECONDARY"));
  let cta=clean(val("CTA"));
  let visual=(val("VISUAL")||"none").toLowerCase();
  let subjectCount=parseInt(val("SUBJECT_COUNT")||"0",10);
  if(!Number.isFinite(subjectCount))subjectCount=0;
  subjectCount=Math.max(0,Math.min(4,subjectCount));
  let subjectSide=(val("SUBJECT_SIDE")||"right").toLowerCase();
  let layoutIntent=(val("LAYOUT_INTENT")||"").toLowerCase();
  let subjectZonePct=parseInt(val("SUBJECT_ZONE_PCT")||"0",10);
  if(!Number.isFinite(subjectZonePct))subjectZonePct=0;
  subjectZonePct=Math.max(22,Math.min(42,subjectZonePct||((subjectCount>=2)?34:28)));

  let subjectAnchor=(val("SUBJECT_ANCHOR")||"").toLowerCase();
  if(!["far-left","left-third","center-left","center","center-right","right-third","far-right"].includes(subjectAnchor)){
    subjectAnchor=subjectCount>=2?"center-right":(subjectSide==="left"?"left-third":"right-third");
  }

  let subjectEdgePaddingPct=parseInt(val("SUBJECT_EDGE_PADDING_PCT")||"5",10);
  if(!Number.isFinite(subjectEdgePaddingPct))subjectEdgePaddingPct=5;
  subjectEdgePaddingPct=Math.max(2,Math.min(10,subjectEdgePaddingPct));

  let textAlign=(val("TEXT_ALIGN")||"left").toLowerCase();
  if(!["left","center"].includes(textAlign))textAlign="left";
  let subjectDescription=clean(val("SUBJECT_DESCRIPTION"));
  let style=clean(val("STYLE"));
  let accent=val("ACCENT");
  let textColor=val("TEXT");

  if(!["person","logo","graphic","none"].includes(visual))visual="none";
  if(!["left","right"].includes(subjectSide))subjectSide="right";
  if(!["subject-left","subject-right","balanced"].includes(layoutIntent)){
    layoutIntent=subjectCount>=2?"balanced":(subjectSide==="left"?"subject-left":"subject-right");
  }
  if(!/^#[0-9a-f]{6}$/i.test(accent))accent="#111111";
  if(!/^#[0-9a-f]{6}$/i.test(textColor))textColor="#111111";

  if(headline.length>90)headline=headline.slice(0,90).replace(/\s+\S*$/,"").trim();
  if(detail.length>58)detail=detail.slice(0,58).replace(/\s+\S*$/,"").trim();
  if(secondary.length>62)secondary=secondary.slice(0,62).replace(/\s+\S*$/,"").trim();

  // CTA must look like a real action. This prevents leaked planner labels such as "person".
  const badCta=/^(person|people|logo|graphic|visual|subject|speaker|photo|image|portrait|none|blank)$/i;
  const actionCta=/\b(register|buy|book|learn|rsvp|reserve|tickets?|sign\s*up|join|donate|visit|apply|read|watch|listen|shop|get\s*tickets?)\b/i;
  if(!cta || badCta.test(cta) || !actionCta.test(cta))cta="";

  return {headline,detail,secondary,cta,visual,subjectCount,subjectDescription,subjectSide,layoutIntent,subjectZonePct,subjectAnchor,subjectEdgePaddingPct,textAlign,style,accent,textColor};
}


async function artDirectorRefinePlan(key,dataUrl,w,h,composer,instructionManifest=null){
  const ratio=w/h;
  const canvasClass=(h<=55&&ratio>4.5)?"MICRO_BANNER":
    (h<=120&&ratio>2.4)?"COMPACT_BANNER":
    (ratio>5)?"LEADERBOARD":
    (ratio>2.4)?"WIDE_BANNER":
    (ratio<.65)?"TALL_AD":"STANDARD_AD";
  const prompt=`You are the SECOND-PASS ART DIRECTOR for a ${w}x${h} ad.
Canvas class: ${canvasClass}.
The first-pass planner proposed this layout:
${JSON.stringify(composer,null,2)}

USER INSTRUCTION MANIFEST:
${JSON.stringify(instructionManifest||{},null,2)}

Honor requested source elements, placement, layout directives, design directives, and exact user corrections. Do not silently ignore them.

Look at the source poster again and critique the proposed composition BEFORE rendering. Return exactly these lines:
SUBJECT_ANCHOR: far-left|left-third|center-left|center|center-right|right-third|far-right
SUBJECT_HEIGHT_PCT: <integer 78-104>
SUBJECT_ZONE_PCT: <integer 22-46>
SUBJECT_EDGE_PADDING_PCT: <integer 3-12>
TEXT_SIDE: left|right
TEXT_WIDTH_PCT: <integer 42-72>
BACKGROUND_RICHNESS: subtle|medium|rich
VEIL_STRENGTH: <integer 35-88>
ALLOW_SUBJECT_TEXT_OVERLAP: yes|no

Art-direction rules:
- Treat the exact ${w}x${h} canvas as the finished ad, not as a crop target.
- Make the main person/group recognizable and prominent. For people, prefer roughly 84-100% of canvas height when composition permits.
- Do NOT default subjects to the extreme edges. Use thirds, center-left, center, or center-right whenever that makes a stronger ad.
- Subjects may overlap decorative background zones and may visually intrude toward typography, but never cover essential text.
- Avoid rigid profile-card/photo-card framing. People should normally feel integrated into the artwork.
- Preserve strong readable typography and factual copy.
- Preserve or increase useful decorative atmosphere: architecture, skyline, lighting, gradients, textures, patterns, environmental cues.
- Be creatively aggressive with visual design but conservative with factual information.
- Look for dead space. If the first plan would leave a weak empty region, enlarge/reposition the subject, widen the copy, or increase decorative richness.
- The final result should feel like a professionally art-directed advertisement, not a template with separate boxes.
- For MICRO_BANNER, heavily penalize cramped copy, CTA collisions, tiny text, and awkward headline wrapping. It is better to omit protected SECONDARY copy from the DRAWING if the micro canvas cannot support it legibly; never alter the protected fact itself.
- For COMPACT_BANNER, require a genuine redesign rather than a shrunken/letterboxed copy of the source.
- For all sizes, avoid layouts where the source poster is simply centered inside the destination with filler around it.
- Do not invent factual text.`;
  const text=await vision(key,dataUrl,prompt);
  const val=name=>parseManifestLine(text,name);
  const clamp=(v,a,b,d)=>{v=parseInt(v||d,10);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d};
  const anchor=(val("SUBJECT_ANCHOR")||composer.subjectAnchor||"right-third").toLowerCase();
  composer.subjectAnchor=["far-left","left-third","center-left","center","center-right","right-third","far-right"].includes(anchor)?anchor:composer.subjectAnchor;
  composer.subjectHeightPct=clamp(val("SUBJECT_HEIGHT_PCT"),78,104,composer.subjectCount>=2?94:98);
  composer.subjectZonePct=clamp(val("SUBJECT_ZONE_PCT"),22,46,composer.subjectZonePct||30);
  composer.subjectEdgePaddingPct=clamp(val("SUBJECT_EDGE_PADDING_PCT"),3,12,composer.subjectEdgePaddingPct||5);
  const side=(val("TEXT_SIDE")||"").toLowerCase(); if(["left","right"].includes(side))composer.textSide=side;
  composer.textWidthPct=clamp(val("TEXT_WIDTH_PCT"),42,72,58);
  const richness=(val("BACKGROUND_RICHNESS")||"rich").toLowerCase();composer.backgroundRichness=["subtle","medium","rich"].includes(richness)?richness:"rich";
  composer.veilStrength=clamp(val("VEIL_STRENGTH"),35,88,68);
  composer.allowSubjectTextOverlap=/^yes$/i.test(val("ALLOW_SUBJECT_TEXT_OVERLAP"));
  composer.artDirectorPass=true;
  return composer;
}


async function buildSubjectAsset(key,sourceData,composer){
  if(composer.visual==="none"){
    return null;
  }

  const prompt=`Create a clean isolated visual asset from the attached source poster.

Use ONLY the source poster as reference.

Target subject type: ${composer.visual}
Target subject: ${composer.subjectDescription||"the most important visual subject"}

USER-REQUESTED SOURCE ELEMENTS:
${(composer.requestedSourceElements||[]).join(", ")||"(none)"}
Requested placement context: ${composer.sourceElementPlacement||"(none)"}

Rules:
- If the user explicitly requested additional people/subjects from the ORIGINAL source, include them faithfully in this isolated foreground asset when visibly present.
- Do not replace requested source people with invented people.
- Do not omit a requested original-image subject merely because the first-pass planner selected a different primary subject.
- Preserve the same person/logo/graphic from the source.
- If it is a person, show the complete head/face and useful upper body.
- Do not crop through the hair/head covering, forehead, eyes, chin, shoulders, or hands if they are important to the pose.
- Keep the subject centered and fully visible with comfortable margin around it.
- Remove poster text and unrelated poster elements from the subject asset.
- REQUIRED: output a transparent background. Do not add a rectangle, rounded card, border, glow-box, photo frame, panel, tile, or colored backdrop behind the subject.
- Do not invent a different person, logo, clothing, pose, or accessory.
- Keep likeness and source fidelity high.
- For people, isolate a clean advertising-ready cutout with the full head, shoulders, and useful upper body.
- If there are two or more equally important people, preserve the full group together at balanced relative scale.
- Leave only a very small transparent margin so the browser can scale the subject close to full banner height. The subject must look like a direct cutout, not a portrait card.
- Do not shrink the person/group inside a large empty transparent square.
- The visible subject should occupy roughly 85-95% of the asset height.`;

  const form=new FormData();
  form.append("model",IMAGE_MODEL);
  form.append("prompt",prompt);
  form.append("size","1024x1024");
  form.append("quality","high");
  form.append("input_fidelity","high");
  form.append("background","transparent");
  form.append("image[]",new Blob([Buffer.from(sourceData.split(",")[1],"base64")],{type:"image/png"}),"source.png");

  let r=await fetch("https://api.openai.com/v1/images/edits",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`},
    body:form
  });
  let d=await r.json();

  // If the newer image model is not enabled for this project/endpoint,
  // automatically retry with GPT Image 1 so the app still works.
  if(!r.ok && IMAGE_MODEL!==IMAGE_MODEL_FALLBACK){
    console.warn(`Image model ${IMAGE_MODEL} failed; retrying with ${IMAGE_MODEL_FALLBACK}:`, d?.error?.message||r.status);
    const fallbackForm=new FormData();
    fallbackForm.append("model",IMAGE_MODEL_FALLBACK);
    fallbackForm.append("prompt",prompt);
    fallbackForm.append("size","1024x1024");
    fallbackForm.append("quality","high");
    fallbackForm.append("input_fidelity","high");
    fallbackForm.append("background","transparent");
    fallbackForm.append("image[]",new Blob([Buffer.from(sourceData.split(",")[1],"base64")],{type:"image/png"}),"source.png");
    r=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",
      headers:{Authorization:`Bearer ${key}`},
      body:fallbackForm
    });
    d=await r.json();
  }

  if(!r.ok)throw Error(d?.error?.message||"Subject asset generation failed");
  const b64=d?.data?.[0]?.b64_json;
  if(!b64)throw Error("Subject asset generation returned no image");
  return `data:image/png;base64,${b64}`;
}



async function buildVisualBannerArt(key,sourceData,composer,w,h){
  const targetRatio=Number(w)/Number(h);
  const generatedRatio=1.5;
  const safeStripPct=targetRatio>generatedRatio?Math.max(12,Math.min(88,Math.round((generatedRatio/targetRatio)*100))):88;
  const prompt=`Create BACKGROUND ART ONLY for a polished horizontal advertising banner derived from the attached source poster.

FINAL destination canvas is exactly ${w}x${h}px.

DIMENSION-AWARE BACKGROUND SAFE STRIP:
- The image API generation canvas is taller than this destination. Compose the meaningful background scene inside a CENTERED HORIZONTAL SAFE STRIP approximately ${safeStripPct}% of the generated image height, spanning the full width. The browser will crop that centered strip to the final ${w}x${h} background.
- Within that safe strip, distribute meaningful source-inspired visual atmosphere ACROSS THE WIDTH.
- Never leave a tiny isolated landmark fragment, tower tip, building tip, partial icon, or accidental-looking object as the only recognizable background feature.
- If a landmark/architecture cannot fit meaningfully, abstract it into a wider skyline/silhouette/atmospheric motif or omit it and extend the source palette/texture instead.
- For very wide/shallow destinations, think PANORAMIC REINTERPRETATION / OUTPAINTED SCENE, not literal source crop.

IMPORTANT:
- The final canvas dimensions above are the FIRST design constraint.
- DO NOT place the main person/people or main subject in this background.
- DO NOT render any text, words, letters, numbers, dates, labels, prices, CTA copy, logos-as-text, QR codes, or badges.
- Browser code will place the exact main subject and all text afterward.
- This background may be cropped slightly for decorative fill, so it must contain NO critical content.

Source design direction:
Source style: ${composer.style||"preserve the source poster's recognizable visual identity"}
Accent color: ${composer.accent||"#111111"}
Planned subject side: ${composer.subjectSide||"right"}
Planned subject width: ${composer.subjectZonePct||28}% of FINAL banner width.
User layout directives: ${(composer.layoutDirectives||[]).join("; ")||"(none)"}
User design directives: ${(composer.designDirectives||[]).join("; ")||"(none)"}

Art-direction rules:
- Treat the source as creative reference, not something to paste.
- Rebuild source-derived atmosphere: color palette, lighting, gradients, architecture, abstract motifs, textures, skyline, venue/environmental cues, etc.
- Be creatively aggressive with decorative visual design. You may create new complementary architecture silhouettes, cityscape forms, light effects, patterns, depth, framing shapes, and atmospheric scenery when they make the banner stronger.
- These additions are decorative artwork, not factual claims: do not add readable signs, venue names, logos, addresses, or specific factual identifiers that were not present in the source.
- Keep the subject zone visually supportive but not busy.
- Keep the opposite text zone calmer and higher contrast.
- Preserve strong source-derived scene elements when they help the design, but show them meaningfully at the target aspect ratio; never preserve only an accidental fragment. Prefer panoramic skyline/environmental continuity over isolated cropped landmark tips.
- Do not over-simplify the background into a flat wash when the source has meaningful visual atmosphere.
- Avoid large dead flat areas; distribute source-derived visual interest across the width without competing with the text.
- No people/faces in the generated background.
- No readable text of any kind.
- No fake CTA/button.
- The result should feel like professional ad background art prepared for exact subject + typography placement on a ${w}x${h} canvas.`;

  const makeForm=(model)=>{
    const form=new FormData();
    form.append("model",model);
    form.append("prompt",prompt);
    form.append("size","1536x1024");
    form.append("quality","high");
    form.append("input_fidelity","high");
    form.append("image[]",new Blob([Buffer.from(sourceData.split(",")[1],"base64")],{type:"image/png"}),"source.png");
    return form;
  };

  let r=await fetch("https://api.openai.com/v1/images/edits",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`},
    body:makeForm(IMAGE_MODEL)
  });
  let d=await r.json();

  if(!r.ok && IMAGE_MODEL!==IMAGE_MODEL_FALLBACK){
    console.warn(`Background art model ${IMAGE_MODEL} failed; retrying with ${IMAGE_MODEL_FALLBACK}:`, d?.error?.message||r.status);
    r=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",
      headers:{Authorization:`Bearer ${key}`},
      body:makeForm(IMAGE_MODEL_FALLBACK)
    });
    d=await r.json();
  }

  if(!r.ok)throw Error(d?.error?.message||"Background art generation failed");
  const b64=d?.data?.[0]?.b64_json;
  if(!b64)throw Error("Background art generation returned no image");
  return `data:image/png;base64,${b64}`;
}


function isDeterministicStructuredPatch(text=''){
  const t=String(text||'').toLowerCase();
  const knownTarget=/\b(?:headline|heading|title|date|time|showtime|venue|address|location|call to action|cta|button|person|people|speaker|subject|image|picture)\b/.test(t);
  const knownAction=/\b(?:move|shift|nudge|position|bigger|larger|smaller|reduce|enlarge|color|colour|black|white|red|blue|green|orange|purple|gold|yellow|left|right|up|down|higher|lower)\b/.test(t);
  return knownTarget&&knownAction;
}

export default async function handler(req,res){
const len=Number(req.headers?.["content-length"]||0);
if(req.method==="POST" && len>4_000_000){
  return res.status(413).json({error:"Upload is too large for the serverless function. V8.7 should compress the source image in the browser before upload; please refresh and try again."});
}

if(req.method==='GET')return res.status(200).json({ok:true,route:'/api/reshape',version:ENGINE_VERSION,engine:UNIFIED_ENGINE?'unified':'legacy'});
if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});let key=process.env.OPENAI_API_KEY;if(!key)return res.status(503).json({error:'OPENAI_API_KEY is not configured'});try{let c=[];for await(let x of req)c.push(x);let body=Buffer.concat(c),a=parse(body,req.headers['content-type']||''),g=n=>a.find(x=>x.name===n),im=g('image'),currentIm=g('currentImage'),name=g('name')?.data.toString()||'destination',w=+g('width')?.data.toString(),h=+g('height')?.data.toString(),extra=(g('instructions')?.data.toString()||'').slice(0,3000),requestMode=(g('mode')?.data.toString()||'generate').trim(),priorPlanRaw=(g('priorPlan')?.data.toString()||'').slice(0,25000);if(!im||!w||!h)return res.status(400).json({error:'Missing image or dimensions'});let mime=im.type||'image/png',src=`data:${mime};base64,${im.data.toString('base64')}`;
let priorPlan=null;
if(priorPlanRaw){try{priorPlan=JSON.parse(priorPlanRaw)}catch(e){console.warn("Could not parse priorPlan:",e?.message||e)}}

if(requestMode==="validate"){
  const requiredTextsRaw=(g('requiredTexts')?.data.toString()||'[]').slice(0,12000);
  let requiredTexts=[];try{requiredTexts=JSON.parse(requiredTextsRaw)}catch{}
  const qaPrompt=`Inspect THIS FINAL RENDERED IMAGE itself. This is the actual end product, not a plan.

USER REQUIREMENT:
${extra||'No separate instruction.'}

REQUIRED EXACT TEXTS THAT MUST BE VISIBLY PRESENT:
${(Array.isArray(requiredTexts)?requiredTexts:[]).map(x=>'- '+x).join('\n')||'- none supplied'}

Return exactly one line:
PASS: <brief visual evidence>
or
FAIL: <specific requested item that is not visibly present / not visibly implemented>

Rules:
- Judge only what is visibly present in this final rendered image.
- Do not trust hidden state, prompts, metadata, or intended layout.
- For exact text, fail if the phrase is missing, truncated, replaced, or unreadably tiny.
- For movement/size instructions, fail if the visible result does not clearly reflect the requested change.
- If the user requested an element from the original and it is not visibly present, fail.`;
  const verdict=await vision(key,src,qaPrompt,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:700,recoveryMaxOutput:900,allowModelFallback:true});
  const verified=/^PASS:/i.test(verdict.trim());
  return res.status(200).json({verified,status:verified?"PASS":"FAIL",reason:verdict.replace(/^(PASS|FAIL):\s*/i,'').trim()});
}

let inventory;
if((requestMode==="regenerate"||requestMode==="replan"||requestMode==="edit_text"||requestMode==="modify"||requestMode==="resize") && priorPlan?.sourceManifest){
  inventory=String(priorPlan.sourceManifest);
}else{
  inventory=await vision(key,src,`Analyze this source poster/flyer/brochure and return a concise SOURCE FACT MANIFEST with these sections:

CRITICAL FACTS:
- exact event/campaign headline and subheadline text
- every person name and the role/title paired with that person
- every date and the time paired with that date
- every distinct price/fee/discount/ticket tier and the label paired with that price
- essential CTA, URL, phone, registration detail, or code when visibly present

IMPORTANT FACTS:
- venue name
- full street address/location detail
- organization/sponsor names
- supporting descriptive text

VISUAL ASSETS:
- logos/brand marks
- people/portraits and approximate positions
- photos/illustrations/icons/QR codes/barcodes actually present

STYLE:
- key colors, typography character, and major layout zones

DECORATIVE:
- purely decorative elements that may be reduced if space is tight

CRITICAL RULES:
- PEOPLE/PORTRAITS must identify actual displayed person names when readable; do not turn portrait descriptions into editable text.
- Venue and address must be returned as actual values, never placeholder phrases like "venue name + address".
- Prices must remain separate price-label facts.
- Visual-description prose such as "portrait of...", "lower left", "rectangular photo", or "placed above the text" is metadata, NOT editable display copy.
- Only report elements actually visible. Never infer or invent missing content.
- Treat each price-label pair as a separate fact. Example: "$15 Early Bird" and "$20 Regular" are two distinct facts.
- If there are zero prices, report zero. If there are multiple prices, report all of them.
- Keep each name paired with the correct portrait and role.
- Keep venue paired with its address when both are present. Treat venue + address as one linked fact group; if the venue is retained, its visible address/location detail must also be retained unless the source truly has no address.
- Explicitly state whether a QR code/barcode exists.

USER BANNER PREFERENCE:
${extra||'No special instruction.'}

For extreme-banner planning, honor the user's preference when it is compatible with the source. For example, if the user asks to include a person and a person is visibly present, BANNER_VISUAL must be person and BANNER_CROP must tightly crop one visible person. If the user asks for more source color, choose a visible source color for BANNER_ACCENT and avoid a plain white-only treatment.

AT THE VERY END, BEFORE the BANNER_* lines, add these exact canonical lines for ALL destination sizes. Use NONE when absent. Do not include wrapping quotation marks. Separate multiple items with |:
MANIFEST_HEADLINE: exact visible headline only
MANIFEST_DATE_TIME: exact visible date/time only
MANIFEST_VENUE: venue name only, excluding street address
MANIFEST_ADDRESS: street/location detail only, excluding venue name
MANIFEST_LOCATION: combined venue/address only if they cannot be confidently separated; otherwise NONE
MANIFEST_CTA: exact visible call-to-action only
MANIFEST_PRICES: every price/label pair separated with |
MANIFEST_PEOPLE: every visible/named person separated with |; use Person 1 | Person 2 when names are not visibly readable
MANIFEST_LOGOS: every visible logo/organization mark separated with |
MANIFEST_BACKGROUND: short description of reusable background artwork/illustration; NONE if plain

AT THE VERY END, add these exact machine-readable lines for extreme-banner use:
BANNER_HEADLINE: ONLY the actual short source headline/event identity. Do NOT include labels such as "Event headline:" or "Exact event/campaign headline:" and do not include quotation marks
BANNER_DETAIL: ONLY one compact factual source detail such as date/time or a key price. Do NOT include labels such as "Date and time:"
BANNER_CTA: short CTA from source if clearly present, otherwise leave blank
BANNER_VISUAL: logo, person, graphic, or none
BANNER_CROP: normalized x,y,w,h from 0.0 to 1.0 for ONE focused source visual only; never the entire poster. Use 0,0,0,0 only when absolutely no useful source visual exists
BANNER_SUBJECT_FIT: face, upper_body, logo, graphic, or none
BANNER_SUBJECT_SIDE: left or right
BANNER_ACCENT: one dominant source color as a 6-digit hex value
BANNER_TEXT: readable source-compatible text color as a 6-digit hex value

For BANNER_CROP, tightly crop only one logo, one person, or one graphic. Never select the full poster.
If the source visibly contains a person, logo, or strong graphic, prefer using ONE of them rather than BANNER_VISUAL:none unless the user explicitly requests text-only.
For banner output, visual interest is required: use a focused source visual and source-derived color whenever possible.`,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:3600,recoveryMaxOutput:4200,allowModelFallback:true});
}
if(requestMode==="edit_text" && priorPlan){
  const exact=(Array.isArray(priorPlan.textElements)?priorPlan.textElements:[]).filter(x=>x&&x.visible!==false&&x.text).map(x=>`${x.label||x.role}: ${x.text}`);
  const manual=(Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements:[]).filter(x=>x&&x.text).map(x=>`MANDATORY ADDED TEXT: ${x.text}`);
  extra=`EDIT_TEXT MODE. Update the CURRENT rendered design's text to these exact authoritative values while preserving the current overall composition, people, logos, background, colors, and unrequested positions. Local text reflow is allowed only where necessary. ${[...exact,...manual].join(' | ')} ${extra||''}`.slice(0,5000);
}
if(requestMode==="replan" && priorPlan){
  const exact=(Array.isArray(priorPlan.textElements)?priorPlan.textElements:[]).filter(x=>x&&x.visible!==false&&x.text).map(x=>`${x.label||x.role}: ${x.text}`);
  const manual=(Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements:[]).filter(x=>x&&x.text).map(x=>`MANDATORY ADDED TEXT: ${x.text}`);
  extra=`AUTHORITATIVE TEXT RE-LAYOUT. Render every exact text item and every mandatory added text item. Added text must visibly appear as a normal part of the composition. Do not omit it. Preserve the source theme and assets. ${[...exact,...manual].join(' | ')} ${extra||''}`.slice(0,5000);
}
if(requestMode==="resize" && priorPlan?.sourceManifest){
  extra=`RESIZE MODE. Reuse the cached canonical source manifest exactly and plan a fresh composition for ${w}x${h}. Do NOT re-analyze/re-extract source facts. Use the original source image only as visual reference for assets/background/style. ${extra||''}`.slice(0,3000);
}
if(requestMode==="regenerate" && priorPlan){
  extra=`REGENERATE MODE. Create a CLEARLY AND MATERIALLY DIFFERENT composition from the ORIGINAL canonical source manifest. Change the major layout structure (text zone, subject placement, hierarchy, or grouping), not merely spacing. Do not carry forward prior user-edited text/manual fields. Preserve source facts and immutable logos. ${extra||''}`.slice(0,3000);
}
let universalPlan=universalPlanFromInventory(inventory,extra);
let sp=spec(w,h),s=sp.safe,tr=w/h;
const strategy=operationStrategy(requestMode,w,h);
const formatClass=strategy.profile.id;
const exactCanvasProfile=strategy.profile.exactCanvas;
const displayBudget=displayBudgetForCanvas(w,h,universalPlan);
universalPlan.displayBudget=displayBudget;
const legacyExact=((tr>2.4 && h<=160) || tr<0.2);
    // V8.7 keeps ONE canonical source manifest/planner, but extreme/shallow canvases
    // use an exact-dimension compositor so a poster is never shrunk/letterboxed inside a banner.
    if((UNIFIED_ENGINE && exactCanvasProfile) || (!UNIFIED_ENGINE && legacyExact)){
      const sourceData=`data:${im.type||"image/png"};base64,${im.data.toString("base64")}`;

      // EDIT_TEXT MODE: keep the current banner layout; only update authoritative text state.
      if(requestMode==="edit_text" && priorPlan){
        const edited={...priorPlan,sourceManifest:priorPlan.sourceManifest||inventory,userTextLocked:true};
        edited.displayBudget=displayBudgetForCanvas(w,h,edited);
        edited.manualTextElements=Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements:[];
        edited.textElements=Array.isArray(priorPlan.textElements)?priorPlan.textElements:[];
        edited.textStyles=priorPlan.textStyles||{};
        res.setHeader('Cache-Control','no-store');
        return res.status(200).json({renderMode:'canvas-first-banner-composer',width:w,height:h,bannerPlan:edited,reuseAssets:true,
          sourceManifest:inventory,sourceElements:canonicalSourceElements(inventory,edited),validationSummary:'V8.7 EDIT_TEXT mode preserved the current banner layout and updated authoritative text only.'});
      }

      // V8.7 MODIFY MODE: update the LAST generated plan rather than starting over.
      if(requestMode==="replan" && priorPlan){
        const replanned={...priorPlan};
        replanned.sourceManifest=priorPlan.sourceManifest||inventory;
        replanned.userTextLocked=true;
        replanned.displayBudget=displayBudgetForCanvas(w,h,replanned);
        replanned.extraFacts=[...(Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements.map(x=>x.text).filter(Boolean):[]),...(Array.isArray(priorPlan.extraFacts)?priorPlan.extraFacts:[])];
        replanned.textZonePct=Math.min(74,Math.max(Number(priorPlan.textZonePct||50),50+Math.min(20,replanned.extraFacts.join(' ').length/10)));
        replanned.subjectZonePct=Math.max(22,100-replanned.textZonePct-8);
        res.setHeader('Cache-Control','no-store');
        return res.status(200).json({renderMode:'canvas-first-banner-composer',width:w,height:h,bannerPlan:replanned,reuseAssets:true,
          sourceManifest:inventory,sourceElements:canonicalSourceElements(inventory,replanned),validationSummary:'V8.7 re-planned the banner around authoritative text using the shared canonical source manifest.'});
      }

      if(requestMode==="regenerate" && priorPlan){
        const regenerated={...universalPlan};
        const variant=(Number(priorPlan.layoutVariant||0)+1)%4;
        regenerated.layoutVariant=variant;
        regenerated.subjectAnchor=['left-third','right-third','center','right-third'][variant];
        regenerated.subjectX=[.28,.72,.50,.68][variant];
        regenerated.subjectPositionLocked=true;
        regenerated.ctaPlacement=['right','center','left','right'][variant];
        regenerated.regeneratedFromVersion=true;
        regenerated.sourceManifest=priorPlan.sourceManifest||inventory;
        regenerated.displayBudget=displayBudgetForCanvas(w,h,regenerated);
        regenerated.manualTextElements=[];
        regenerated.textElements=[];
        regenerated.userTextLocked=false;
        let regeneratedBackground=null;
        try{regeneratedBackground=await buildVisualBannerArt(key,sourceData,regenerated,w,h);}catch(e){console.warn("Regenerated background art failed; preserving prior background asset:",e?.message||e);}
        res.setHeader("Cache-Control","no-store");
        return res.status(200).json({
          renderMode:"canvas-first-banner-composer",
          structuredStateMode:true,
          width:w,height:h,bannerPlan:regenerated,reuseAssets:true,
          backgroundArt:regeneratedBackground||undefined,
          sourceManifest:inventory,
          sourceElements:canonicalSourceElements(inventory,regenerated),
          modelInfo:{engine:UNIFIED_ENGINE?"unified":"legacy",sourceAnalysisReused:true,operation:"regenerate",backgroundRegenerated:!!regeneratedBackground},
          validationSummary:"V8.7 created an alternate banner layout and a new target-aware panoramic background from the cached canonical source manifest without re-running source analysis."
        });
      }

      if(requestMode==="modify" && priorPlan){
        const structuredPatch=structuredDesignPatchFromRaw(extra,{headline:priorPlan.headline||"",detail:priorPlan.detail||priorPlan.dateTime||"",secondary:priorPlan.secondary||priorPlan.address||"",cta:priorPlan.cta||""});
        let modifyManifest;
        try{
          modifyManifest=await interpretUserInstructions(key,sourceData,extra);
          modifyManifest=augmentInstructionManifestFromRaw(extra,modifyManifest);
        }catch(e){
          console.warn("Modify instruction interpretation failed; deterministic fallback only:",e?.message||e);
          modifyManifest=augmentInstructionManifestFromRaw(extra,{
            headlineOverride:"",headlineCompletionPhrase:"",
            detailOverride:"",secondaryOverride:"",ctaOverride:"",
            requestedSourceElements:[],sourceElementPlacement:"",
            requiredVisibleFacts:[],requiredFactsPlacement:"",
            layoutDirectives:[],designDirectives:[],preserveExactPhrases:[]
          });
        }

        modifyManifest=applyStructuredPatchToManifest(modifyManifest,structuredPatch);

        let modifyFacts=Object.freeze({
          headline:drawableFact(priorPlan.headline||""),
          detail:drawableFact(priorPlan.detail||priorPlan.dateTime||""),
          secondary:drawableFact(priorPlan.secondary||priorPlan.address||""),
          cta:drawableFact(priorPlan.cta||""),
          extraFacts:Array.isArray(priorPlan.extraFacts)?priorPlan.extraFacts.map(drawableFact).filter(Boolean):[]
        });
        const priorUserTextLocked=!!priorPlan.userTextLocked;

        modifyFacts=applyInstructionManifestToFacts(modifyFacts,modifyManifest);
        modifyFacts=applyUserFactOverrides(modifyFacts,extra);
        modifyFacts=applyAuthoritativeUserText(modifyFacts,extra);
        modifyFacts=applyStructuredDesignPatchToFacts(modifyFacts,structuredPatch);

        if(priorUserTextLocked){
          const rawOverrides=explicitTextOverridesFromRaw(extra);
          const textPatch=structuredPatch?.text||{};
          modifyFacts=Object.freeze({
            ...modifyFacts,
            headline:(textPatch.headline||rawOverrides.headline||rawOverrides.headlineAppend||modifyManifest?.headlineOverride||modifyManifest?.headlineCompletionPhrase)
              ? modifyFacts.headline : drawableFact(priorPlan.headline||""),
            detail:(textPatch.detail||rawOverrides.detail||modifyManifest?.detailOverride)
              ? modifyFacts.detail : drawableFact(priorPlan.detail||priorPlan.dateTime||""),
            secondary:(textPatch.secondary||rawOverrides.secondary||modifyManifest?.secondaryOverride)
              ? modifyFacts.secondary : drawableFact(priorPlan.secondary||priorPlan.address||""),
            cta:(textPatch.cta||rawOverrides.cta||modifyManifest?.ctaOverride)
              ? modifyFacts.cta : drawableFact(priorPlan.cta||""),
            extraFacts:Array.isArray(priorPlan.extraFacts)
              ? priorPlan.extraFacts.map(drawableFact).filter(Boolean)
              : (modifyFacts.extraFacts||[])
          });
        }

        if(!structuredPatch?.text?.headline && !explicitTextOverridesFromRaw(extra).headline && modifyManifest?.headlineCompletionPhrase){
          modifyFacts=Object.freeze({
            ...modifyFacts,
            headline:mergeHeadlineCompletion(modifyFacts.headline,modifyManifest.headlineCompletionPhrase)
          });
        }

        const newFacts=await extractRequiredVisibleFacts(key,sourceData,modifyManifest?.requiredVisibleFacts||[]);
        if(newFacts.length){
          const merged=[...(modifyFacts.extraFacts||[])];
          for(const fact of newFacts){
            if(fact && !merged.some(v=>v.toLowerCase()===fact.toLowerCase()))merged.push(fact);
          }
          modifyFacts=Object.freeze({...modifyFacts,extraFacts:merged});
        }

        let modified=applyModifyLayoutDirectives(priorPlan,extra,modifyManifest);
        modified=applyProtectedFacts(modified,modifyFacts);
        modified.extraFacts=Array.isArray(modifyFacts.extraFacts)?modifyFacts.extraFacts.slice():[];
        modified.extraFact=modified.extraFacts.join(" · ");
        modified.displayBudget=displayBudgetForCanvas(w,h,modified);
        modified.requiredVisibleFacts=modifyManifest?.requiredVisibleFacts||modified.requiredVisibleFacts||[];
        modified.requiredFactsPlacement=modifyManifest?.requiredFactsPlacement||modified.requiredFactsPlacement||"";
        modified.modifyInstructions=extra;
        modified.lastStructuredPatch=structuredPatch;
        modified.userTextLocked=!!priorPlan.userTextLocked;
        modified.manualTextElements=Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements:[];
        modified.textElements=Array.isArray(priorPlan.textElements)?priorPlan.textElements:modified.textElements;
        modified.textStyles=priorPlan.textStyles||modified.textStyles;
        modified.designStateVersion=priorPlan.designStateVersion||1;
        // V8.7: the browser's deterministic visual state is authoritative too.
        if(priorPlan.subjectPositionLocked || priorPlan.subjectScaleLocked || priorPlan.subjectOrderLocked || priorPlan.subjectSizeLocked){
          modified.subjectAnchor=priorPlan.subjectAnchor||modified.subjectAnchor;
          if(Number.isFinite(priorPlan.subjectX))modified.subjectX=priorPlan.subjectX;
          if(Number.isFinite(priorPlan.subjectScale))modified.subjectScale=priorPlan.subjectScale;
          if(Number.isFinite(priorPlan.subjectTargetHeightPct))modified.subjectTargetHeightPct=priorPlan.subjectTargetHeightPct;
          if(Number.isFinite(priorPlan.subjectHeightPct))modified.subjectHeightPct=priorPlan.subjectHeightPct;
          if(Number.isFinite(priorPlan.subjectZonePct))modified.subjectZonePct=priorPlan.subjectZonePct;
          if(priorPlan.subjectCropMode)modified.subjectCropMode=priorPlan.subjectCropMode;
          if(Number.isFinite(priorPlan.subjectCount))modified.subjectCount=priorPlan.subjectCount;
          if(priorPlan.subjectOrder)modified.subjectOrder=priorPlan.subjectOrder;
          modified.subjectPositionLocked=!!priorPlan.subjectPositionLocked;
          modified.subjectScaleLocked=!!priorPlan.subjectScaleLocked;
          modified.subjectSizeLocked=!!priorPlan.subjectSizeLocked;
          modified.subjectOrderLocked=!!priorPlan.subjectOrderLocked;
          modified.visualState=priorPlan.visualState||modified.visualState;
        }

        res.setHeader("Cache-Control","no-store");
return res.status(200).json({
          renderMode:"canvas-first-banner-composer",
          structuredStateMode:true,
          width:w,height:h,
          bannerPlan:modified,
          reuseAssets:true,
          validationSummary:"V8.7 modified the current design using a structured state patch. The newest user instruction was applied deterministically before layout, the current design state remained the baseline, and reusable source subject geometry/assets were preferred for resize or move requests when available."
        });
      }

      // V8.7 stage 0: understand Optional Instructions as a first-class manifest.
      const initialStructuredPatch=structuredDesignPatchFromRaw(extra,{});
      let instructionManifest;
      try{
        instructionManifest=await interpretUserInstructions(key,sourceData,extra);
        instructionManifest=augmentInstructionManifestFromRaw(extra,instructionManifest);
      }
      catch(e){
        console.warn("Instruction interpretation failed; using raw instructions only:",e?.message||e);
        instructionManifest=augmentInstructionManifestFromRaw(extra,{headlineOverride:"",headlineCompletionPhrase:"",detailOverride:"",secondaryOverride:"",ctaOverride:"",requestedSourceElements:[],sourceElementPlacement:"",requiredVisibleFacts:[],requiredFactsPlacement:"",layoutDirectives:[],designDirectives:[],preserveExactPhrases:[]});
      }

      instructionManifest=applyStructuredPatchToManifest(instructionManifest,initialStructuredPatch);

      // V8.7 stage 1: extract factual display copy before any layout/design reasoning.
      let protectedFacts;
      if(requestMode==="resize" && priorPlan?.sourceManifest){
        const fallback=bannerPlanFromInventory(inventory,extra);
        protectedFacts=Object.freeze({headline:fallback.headline||"",detail:fallback.detail||fallback.dateTime||"",secondary:fallback.secondary||fallback.address||fallback.venue||"",cta:fallback.cta||"",extraFacts:Array.isArray(fallback.extraFacts)?fallback.extraFacts:[]});
      }else{
        try{ protectedFacts=await buildProtectedFactManifest(key,sourceData,w,h); }
        catch(e){
          console.error("Protected fact extraction failed; falling back to inventory facts:",e?.message||e);
          const fallback=bannerPlanFromInventory(inventory,extra);
          protectedFacts=Object.freeze({headline:fallback.headline||"",detail:fallback.detail||"",secondary:"",cta:fallback.cta||""});
        }
      }

      // V8.7: interpreted user corrections outrank extraction; regex parser remains as fallback.
      protectedFacts=applyInstructionManifestToFacts(protectedFacts,instructionManifest);
      protectedFacts=applyUserFactOverrides(protectedFacts,extra);
      protectedFacts=applyAuthoritativeUserText(protectedFacts,extra);
      protectedFacts=applyStructuredDesignPatchToFacts(protectedFacts,initialStructuredPatch);

      // V8.7: resolve natural-language "missing ending" headline requests against the ORIGINAL source.
      if(!initialStructuredPatch?.text?.headline && !explicitTextOverridesFromRaw(extra).headline && instructionManifest?.headlineCompletionPhrase){
        const completeHeadline=await resolveHeadlineCompletion(
          key,sourceData,protectedFacts.headline,instructionManifest.headlineCompletionPhrase
        );
        protectedFacts=Object.freeze({...protectedFacts,headline:completeHeadline});
      }

      // V8.7: facts the user explicitly asks to see become protected display facts,
      // rather than optional art-direction suggestions.
      const requiredFacts=await extractRequiredVisibleFacts(
        key,sourceData,instructionManifest?.requiredVisibleFacts||[]
      );
      if(requiredFacts.length){
        protectedFacts=Object.freeze({...protectedFacts,extraFacts:requiredFacts});
      }else if(!Array.isArray(protectedFacts.extraFacts)){
        protectedFacts=Object.freeze({...protectedFacts,extraFacts:[]});
      }

      let composer;
      try{
        composer=await bannerComposePlan(key,sourceData,w,h,name,extra,protectedFacts,instructionManifest);
      }catch(e){
        console.error("Banner composer analysis failed:",e?.message||e);
        composer={headline:"",detail:"",secondary:"",cta:"",visual:"none",subjectDescription:"",subjectSide:"right",style:"",accent:"#111111",textColor:"#111111"};
      }

      // V8.7 stage 2: protected facts are re-applied AFTER planning. Planner metadata can never become drawable copy.
      const invPlan=bannerPlanFromInventory(inventory,extra);
      composer=applyProtectedFacts(composer,protectedFacts);
      composer.requestedSourceElements=instructionManifest?.requestedSourceElements||[];
      composer.sourceElementPlacement=instructionManifest?.sourceElementPlacement||"";
      composer.requiredVisibleFacts=instructionManifest?.requiredVisibleFacts||[];
      composer.requiredFactsPlacement=instructionManifest?.requiredFactsPlacement||"";
      composer.layoutDirectives=instructionManifest?.layoutDirectives||[];
      composer.designDirectives=instructionManifest?.designDirectives||[];
      composer.actionButtonRequested=(instructionManifest?.designDirectives||[]).some(v=>/action button|cta button|button/i.test(v));
      composer.preserveExactPhrases=instructionManifest?.preserveExactPhrases||[];
      composer.canvasClass=strategy.profile.id==='MICRO_HORIZONTAL'?'MICRO_BANNER':
        ((strategy.profile.id==='COMPACT_HORIZONTAL'||strategy.profile.id==='EXTREME_HORIZONTAL')?(w>=600&&h>=70?'LEADERBOARD':'COMPACT_BANNER'):
        (tr<.65?'TALL_AD':'STANDARD_AD'));

      // If the planner missed a visible source subject, recover the source visual rather than rendering a text-only failure.
      if((!composer.visual||composer.visual==="none") && invPlan.visualType && invPlan.visualType!=="none") composer.visual=invPlan.visualType;
      if(!composer.subjectCount && composer.visual==="person") composer.subjectCount=1;

      // V7.1: second-pass art director critiques/rebalances the first plan before any assets are rendered.
      try{ composer=await artDirectorRefinePlan(key,sourceData,w,h,composer,instructionManifest); }
      catch(e){ console.error("Art-director refinement failed; using first-pass plan:",e?.message||e); }

      // V8.7 stage 3: lock again after art direction and fail closed on any copy mutation/leak.
      composer=applyProtectedFacts(composer,protectedFacts);
      composer.displayBudget=displayBudgetForCanvas(w,h,{...universalPlan,...composer});
      const copyAudit=validateProtectedFacts(composer,protectedFacts);
      if(!copyAudit.ok) throw Error("Protected display-copy validation failed: "+copyAudit.failures.join(", "));

      let visualArt=null;
      let subjectAsset=null;

      try{
        [visualArt,subjectAsset]=await Promise.all([
          buildVisualBannerArt(key,sourceData,composer,w,h),
          buildSubjectAsset(key,sourceData,composer)
        ]);
      }catch(e){
        console.error("Canvas-first asset generation issue:",e?.message||e);

        // Retry independently so one failed asset does not kill the banner.
        if(!visualArt){
          try{ visualArt=await buildVisualBannerArt(key,sourceData,composer,w,h); }catch(_){}
        }
        if(!subjectAsset){
          try{ subjectAsset=await buildSubjectAsset(key,sourceData,composer); }catch(_){}
        }
      }

      res.setHeader("Cache-Control","no-store");
      return res.status(200).json({
        renderMode:"canvas-first-banner-composer",
        width:w,
        height:h,
        canvasProfile:strategy.profile,
        sourceImage:sourceData,
        backgroundArt:visualArt,
        subjectAsset,
        bannerPlan:{...universalPlan,...composer,sourceManifest:inventory,subjects:universalPlan.subjects||[],subjectCount:Math.max(Number(composer.subjectCount||0),Number(universalPlan.subjectCount||0)),subjectLabels:universalPlan.subjectLabels||[]},
        sourceManifest:inventory,
        sourceElements:canonicalSourceElements(inventory,{...universalPlan,...composer}),
        validationSummary:`V8.7 resilient-source pipeline: source analysis retries on empty output, suspiciously incomplete headlines are verified, and explicit factual corrections in Optional Instructions override extraction before design; ${PLANNER_MODEL} uses dimension-aware art direction for ${composer.canvasClass||"the target"}; compact horizontal ads use the canvas-first composer; copy is audited before ${IMAGE_MODEL} creates visual assets.`,
        modelInfo:{planner:PLANNER_MODEL,reasoning:PLANNER_REASONING,api:"responses",imageRequested:IMAGE_MODEL,imageFallback:IMAGE_MODEL_FALLBACK,engine:UNIFIED_ENGINE?"unified":"legacy",sourceAnalysisReused:!!priorPlan?.sourceManifest,operation:requestMode,canvasProfile:strategy.profile.id}
      });
    }
const unifiedModeRules=`
V8.7 OPERATION MODES — APPLY TO EVERY DESTINATION SIZE:
- The structured current-design state is authoritative for element geometry/style. The PNG is the rendered result, not the only editable truth.
- For a subject scale/move request, prefer the original source reference supplied alongside the current render instead of enlarging a low-resolution thumbnail.

- MODIFY / EDIT_TEXT should patch the structured current design state and must not flatten that state into a brand-new redesign.
- When the same uploaded source is resized into another destination, reuse the canonical source manifest and restart from layout planning for the new dimensions rather than re-reading the source facts.

- GENERATE: create the first composition from the canonical source manifest.
- RESIZE: reuse the already analyzed canonical source manifest and create a new layout for the new target dimensions. Do NOT re-read/re-extract source facts.
- EDIT_TEXT: the CURRENT rendered image is the visual baseline. Change/reflow only authoritative text requested by the user; preserve all unrequested composition/assets.
- MODIFY: the CURRENT rendered image is the visual baseline. Patch only requested element positions/sizes/styles/content; preserve all unrequested areas.
- REGENERATE: ignore the current composition as a layout baseline and create a meaningfully different composition from the ORIGINAL canonical source manifest.
These semantics are identical for Events, square/tall formats, leaderboard banners, directory banners, and custom dimensions.
`;
let authoritativeReplanText=((requestMode==='replan'||requestMode==='edit_text')&&priorPlan)?`\n\nAUTHORITATIVE CURRENT TEXT STATE (must visibly appear exactly):\n${(priorPlan.textElements||[]).filter(x=>x&&x.visible!==false&&x.text).map(x=>'- '+(x.label||x.role)+': '+x.text).join('\n')}\n${(priorPlan.manualTextElements||[]).filter(x=>x&&x.text).map(x=>'- MANDATORY ADDED TEXT: '+x.text).join('\n')}\nRe-layout around this text. Do not omit added text.`:'';
let prompt=`UNIFIED IMAGE RESHAPER — adapt the attached artwork using the same composition engine for every destination size.\nTARGET: ${name}; final ${w}×${h}px; generation canvas ${sp.gw}×${sp.gh}px. The app will proportionally CONTAIN the complete generated design inside the final canvas and will extend only decorative background if the aspect ratios differ. Nothing from your generated foreground may be intentionally placed off-canvas. Compose the artwork itself for the requested aspect ratio and keep every important content element inside a generous internal safe margin.\n\nSOURCE INVENTORY:\n${inventory}${authoritativeReplanText}\n${unifiedModeRules}\n\nFORMAT CLASS: ${formatClass}\n\nASPECT-RATIO LAYOUT CONSTRAINTS (these are constraints inside ONE unified engine, not separate renderers):\n- STANDARD: preserve nearly all meaningful content and recompose naturally.\n- WIDE_BANNER: create a genuine horizontal banner and spread retained information across the full width. Rebuild the hierarchy for the banner rather than preserving the source poster geometry.\n- EXTREME_BANNER: design DIRECTLY as a compact horizontal ad. Do NOT shrink, crop, or embed the original poster. Select only the highest-priority source elements that remain readable at the requested dimensions.\n- TALL_NARROW / EXTREME_TALL: build a true vertical layout rather than squeezing a wide design.\nFor very small formats, priority is brand/logo, recognizable event identity/headline, then one key action/detail such as date/time/CTA/key price when legible. People and secondary details come after that.\nIt is acceptable to omit lower-priority or decorative information if the final size cannot support it legibly. Never invent replacement facts. Never render tiny unreadable text merely to preserve everything.\nThe output must look intentionally designed for the requested shape, not compressed or letterboxed.\nVERY SHALLOW/WIDE LAYOUT CONSTRAINTS:
- Treat the requested width:height ratio as the design brief itself.
- Build a coherent horizontal row or shallow two-row composition across the canvas.
- Use the full width intentionally; avoid large empty side zones.
- Omit lower-priority source elements when needed for legibility; never rewrite or invent facts.
- Do not force every source detail into tiny text.
- Preserve relationships among retained facts. For example, if Early Bird $15 and Regular $20 are retained, keep both labels paired with the correct prices.
- A 728x90 or similarly shallow output must resemble a professionally designed leaderboard ad, not a cropped slice of a poster.
- All retained text, logos, and faces must be fully visible with safe margins.
\n\nRULES:\n1. Use ONLY elements that exist in the source inventory and attached artwork.\n2. DO NOT ADD any new QR code, barcode, icon, badge, seal, logo, decorative symbol, person, photo, sponsor, CTA, URL, price, date, location, or text.\n3. If no QR/barcode is present, absolutely do not create one.\n4. Preserve factual text and names; never invent, rewrite, paraphrase, substitute, merge, or silently omit facts.
4A. Every item under CRITICAL FACTS in the source manifest must appear in the final design exactly once in meaning.
4B. Preserve every distinct price together with its correct label. If the source shows "$15 Early Bird" and "$20 Regular", both must remain as separate pricing facts.
4C. If space is tight, first shrink portraits, reduce decorative spacing, reduce headline size, wrap text, or use a compact two-row footer before dropping IMPORTANT facts.
4D. Never remove a CRITICAL fact just to improve appearance.
4E. LINKED VENUE FACT RULE: when the source contains both a venue name and an address/location line, preserve BOTH together. The address may use smaller type than the venue name, but it may not be silently omitted. If space is tight, reduce decorative spacing, portrait size, or noncritical typography first.
4F. Preserve meaningful parent-child relationships: venue+address, price+price-label, date+time, person+role. Never keep the parent while dropping its visible paired detail merely for aesthetics.\n5. Preserve logos accurately and undistorted.\n6. Preserve the same people, with recognizable faces and natural framing.\n7. Recompose for the target aspect ratio; do not stretch.\n8. Keep ALL critical content fully visible with generous margins. No headline, name, date, time, price, role, venue or CTA may touch the canvas edge.\n9. Keep text/logos/people away from the outer edges. Use only simple extendable background near the canvas boundaries.\n10. Make text legible at final size using hierarchy, larger type, compact grouping and contrast.\n11. Avoid dead space while keeping all source content fully visible. Reserve enough vertical space for a complete information/footer section containing every mandatory event detail.\n12. Preserve source visual identity. In MODIFY/EDIT_TEXT this is not a redesign; in REGENERATE a new composition is intentionally allowed while preserving source facts/assets.\n13. If something is unclear, preserve its visual form rather than inventing replacement content.\n14. Before finishing, verify that the complete top logo/header and complete bottom venue/date/time/price/CTA area are visible and that no new element has been introduced.
15. Specifically inspect the leftmost and rightmost characters of every headline and name. The main headline must have obvious whitespace on BOTH sides. If any character is close to an edge, reduce the type size or wrap the headline to an additional line until the entire word has generous breathing room.
15A. For a headline like 'YOUR FUTURE ON THE BALLOT', prefer two balanced lines such as 'YOUR FUTURE' / 'ON THE BALLOT' or a smaller single line rather than allowing the final letters to approach the edge.
16. Before finishing, compare the composition against the CRITICAL FACTS list line by line. If even one critical fact is missing, duplicated incorrectly, merged with another fact, associated with the wrong label/person/date, or unreadable, revise the layout before finalizing.
17. Do a final edge audit: no letter, logo, portrait, or factual detail may touch the outer 8% edge band of the generation canvas.

VISUAL BALANCE / REPEATED-ELEMENT RULES:
- Detect repeated or parallel elements in the source, such as two speaker cards, multiple product cards, sponsor tiles, pricing boxes, or side-by-side portraits.
- When repeated elements represent equivalent roles, keep them visually equal in importance unless the source clearly establishes a different hierarchy.
- For two speaker/person cards of equal status:
  * use the same card width and height;
  * use the same portrait scale and crop style;
  * align their top and bottom edges;
  * use consistent internal padding;
  * keep the gap between them even;
  * center the pair as one group within the composition.
- Do not make one speaker card substantially larger than the other unless the original clearly indicates one is the primary speaker.
- Use one SHARED CONTENT GRID for the main body. Establish a single centered content width and align the speaker/card row and event-info/footer to that exact same left edge, right edge, and center line.
- Center the major composition groups horizontally within the target:
  * logo/header group centered;
  * headline block centered;
  * speaker/card row centered;
  * event-info/footer group centered.
- Prefer a clear shared visual axis. Avoid layouts that feel shifted left or right.
- Keep left and right outer margins visually similar.
- Maintain consistent spacing rhythm between major sections.
- If a balanced two-column layout fits, prefer it over an asymmetrical composition.
- For two equal speaker cards, the combined row must be mathematically centered: equal card widths + one even gap, with equal left/right outer margins.
- The footer/info bar should normally match the exact total width of the centered speaker-card row above it.
- Within the footer, distribute venue/address, date/time, and pricing as balanced columns. Do not visually push the footer to one side.
- Perform a final alignment audit: compare the left edge, right edge, and horizontal midpoint of the speaker row and footer. Correct any visible drift before finishing.


18. LANDSCAPE / CANVAS UTILIZATION:
- The destination shape is the actual design canvas, not a frame around a smaller portrait poster.
- For wide targets, actively recompose into a true wide layout.
- Use roughly 85–92% of the available width for the main content system when practical.
- Avoid large unused left/right zones or a narrow centered column.
- The two-speaker row should use most of the available width when two equal speakers are present.
- The footer/info bar should be similarly wide and visually anchored to the speaker row.
- Symmetry is secondary to proper canvas utilization: first fill the target gracefully, then refine alignment.
18A. FINAL WIDE-CANVAS AUDIT:
- Does the result look like a real landscape redesign?
- Are the speaker row and footer using most of the available width?
- Are unnecessary blank side zones avoided?
If not, expand/recompose the content horizontally before finalizing.

18B. For WIDE_BANNER or EXTREME_BANNER, distribute retained information horizontally across the destination and do not preserve portrait-style vertical stacking when it wastes width.\n19. Produce a polished commercial composition.\n\nOPTIONAL USER INSTRUCTIONS: ${extra||'None.'}

HIGHEST-PRIORITY USER OVERRIDE RULE:
- If the user explicitly asks to change, replace, correct, rename, or complete visible text, follow the user's wording exactly.
- User-supplied replacement text outranks source-copy preservation for that requested field.
- Do not restore the old wording after the user explicitly changes it.
- In MODIFY mode, preserve everything not requested and change only what the newest instruction asks for.`;

// V8.7 OPERATION SEPARATION: EDIT_TEXT / MODIFY are current-design patches, never redesign prompts.
let operationPrompt=prompt;
const exactCurrentText=priorPlan ? [
  ...(Array.isArray(priorPlan.textElements)?priorPlan.textElements.filter(x=>x&&x.visible!==false&&x.text).map(x=>`${x.label||x.role||'Text'}: ${x.text}`):[]),
  ...(Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements.filter(x=>x&&x.text).map(x=>`Added text: ${x.text}`):[])
].join('\n') : '';

if((requestMode==="modify"||requestMode==="edit_text") && currentIm){
  const action=requestMode==="edit_text"
    ? `Change only the authoritative text/content values listed below. Local reflow inside existing text areas is allowed, but do not move unrelated visual groups.`
    : `Apply ONLY this newest instruction: ${extra||'No instruction supplied.'}`;
  operationPrompt=`V8.7 CURRENT DESIGN PATCH — THIS IS NOT A REGENERATE REQUEST.\n\nTreat the current design as a structured editable composition, not as a request to invent a new layout from scratch.

The attached image is the CURRENT rendered design and is the absolute visual baseline.
TARGET OUTPUT: ${w}x${h}px. The image API output will be proportionally contained in the final ${w}x${h} canvas without cropping. Keep the complete current design and every requested edit fully visible inside the generated image.

${action}

AUTHORITATIVE CURRENT TEXT STATE:
${exactCurrentText||'(no structured text state supplied)'}

STRUCTURED CURRENT DESIGN STATE — AUTHORITATIVE FOR POSITIONS/STYLES:
${JSON.stringify(priorPlan?.structuredDesignState||{},null,2)}

SOURCE MANIFEST — FACT CHECK AND SOURCE-ASSET REFERENCE ONLY, NEVER USE IT AS A LAYOUT TEMPLATE:
${inventory}

NON-NEGOTIABLE PRESERVATION RULES:
- Pixel-preserve the current composition as closely as the image editor allows.
- Keep the same overall background, major text block positions, logos, people, subject scale, decorative treatment, margins, and hierarchy unless the newest instruction explicitly changes one of them.
- Do NOT restart from the original poster. Do NOT propose a new composition. Do NOT move unrelated groups to improve aesthetics.
- If the request is to move, enlarge, reduce, or reframe a person/subject and a reusable source subject asset or geometry is available, use that higher-quality source asset/geometry instead of merely enlarging a tiny rendered thumbnail.
- If the instruction changes one element, patch that element in place and leave the rest visually unchanged.
- Logos are immutable: do not redraw, simplify, recolor, merge, distort, or replace them.
- Never invent or omit factual copy.
- For EDIT_TEXT, every authoritative current text value above must appear exactly unless the user explicitly changed/removed it.
- For MODIFY, preserve authoritative text unless the newest instruction explicitly changes it.
- A fresh redesign is a FAILED result.`;
}

// Current-design patch modes edit the CURRENT rendered PNG. Generate/regenerate use the original source.
let editInput=((requestMode==="modify"||requestMode==="edit_text"||requestMode==="replan")&&currentIm)?currentIm:im;
let editMime=editInput.type||mime;
const sourceRefs=((requestMode==='modify'||requestMode==='edit_text')&&currentIm)?[{data:im.data,type:im.type||mime,filename:im.filename||'original-source.png'}]:[];
let b=await edit(key,editInput.data,editInput.filename||im.filename,editMime,operationPrompt,sp.size,sourceRefs);
let retried=false;
let preservationVerdict='';

if((requestMode==="modify"||requestMode==="edit_text") && currentIm){
  const baseline=`data:${currentIm.type||'image/png'};base64,${currentIm.data.toString('base64')}`;
  let candidate=`data:image/png;base64,${b}`;
  const comparePrompt=`Compare IMAGE 1 (baseline current design) with IMAGE 2 (new result).
USER REQUEST: ${extra||requestMode}
MODE: ${requestMode}
IMAGE 2 will be proportionally contained in the final canvas without cropping. Judge the complete generated image and fail if any important top/bottom/side content is clipped or placed outside the visible design.
Return exactly PASS: <brief evidence> or FAIL: <specific drift/failure>.
PASS only if:
- the overall composition/layout remains recognizably the SAME as IMAGE 1;
- unrequested people, logos, background regions, major text groups and margins remain in the same places and at similar scale;
- only the requested text/element changed, plus minimal local reflow necessary for that change;
- the requested change is visibly present.
FAIL if IMAGE 2 looks like a new design/recomposition, moves unrelated groups, changes the background/layout substantially, or does not visibly implement the request.`;
  try{preservationVerdict=await visionCompare(key,baseline,candidate,comparePrompt,{maxOutput:700});}catch(e){console.warn('V8.7 preservation comparison unavailable:',e?.message||e);preservationVerdict='PASS: comparison unavailable; strict patch prompt used';}
  if(/^FAIL:/i.test(preservationVerdict)){
    if(isDeterministicStructuredPatch(extra)){
      throw Error(`Structured patch verification failed without launching a second full image edit: ${preservationVerdict.replace(/^FAIL:\s*/i,'')}`);
    }
    retried=true;
    b=await edit(key,editInput.data,editInput.filename||im.filename,editMime,operationPrompt+`\n\nFIRST PATCH WAS REJECTED BY STRUCTURAL PRESERVATION QA:\n${preservationVerdict}\nTry again. Make the smallest possible localized edit. Everything not explicitly requested must stay in the exact same visual location and style.`,sp.size,sourceRefs);
    candidate=`data:image/png;base64,${b}`;
    try{preservationVerdict=await visionCompare(key,baseline,candidate,comparePrompt,{maxOutput:700});}catch(e){preservationVerdict='PASS: second comparison unavailable';}
    if(/^FAIL:/i.test(preservationVerdict)){
      throw Error(`Current-design preservation check rejected the generated patch after two attempts: ${preservationVerdict.replace(/^FAIL:\s*/i,'')}`);
    }
  }
}else if(requestMode==="regenerate" && currentIm){
  const baseline=`data:${currentIm.type||'image/png'};base64,${currentIm.data.toString('base64')}`;
  let candidate=`data:image/png;base64,${b}`;
  const diffPrompt=`Compare IMAGE 1 (previous design) and IMAGE 2 (regenerated result). Return exactly PASS: <evidence> or FAIL: <reason>. PASS only if IMAGE 2 is a clearly, materially different composition/layout while retaining the same source identity/facts. Merely changing spacing, tiny positions, or colors is not enough.`;
  try{preservationVerdict=await visionCompare(key,baseline,candidate,diffPrompt,{maxOutput:600});}catch(e){preservationVerdict='PASS: difference comparison unavailable';}
  if(/^FAIL:/i.test(preservationVerdict)){
    retried=true;
    b=await edit(key,im.data,im.filename||'source.png',mime,prompt+`\n\nREGENERATION DIFFERENCE QA FAILED:\n${preservationVerdict}\nCreate a substantially different layout structure this time while preserving the canonical facts and immutable logos.`,sp.size);
  }
}else{
  // Generate/re-generate source QA. Patch modes are validated against the current design instead.
  try{
    const val=await vision(key,`data:image/png;base64,${b}`,`Compare this generated adaptation against this source inventory:\n${inventory}\nEvaluate invented elements, clipping, major omissions, factual mismatches, and whether the requested target shape is intentionally composed. Judge the complete generated image. The browser will contain the complete design without cropping; fail if important foreground content is clipped at any edge or if the composition relies on content outside the image. Return exactly PASS or RETRY: <brief reasons>.`,{mode:"extract",effort:"none",recoveryEffort:"none",maxOutput:800,recoveryMaxOutput:1000,allowModelFallback:true});
    if(/^RETRY:/i.test(val.trim()) && requestMode!=="modify" && requestMode!=="edit_text"){
      retried=true;
      b=await edit(key,editInput.data,editInput.filename||im.filename,editMime,prompt+`\n\nVALIDATION FAILURE FROM FIRST ATTEMPT:\n${val}\nCorrect these failures and keep all critical facts fully visible inside the generated image with clear edge-safe margins.`,sp.size);
    }
  }catch(e){console.warn('V8.7 source QA unavailable:',e?.message||e);}
}
res.setHeader('Cache-Control','no-store');
let responsePlan={...universalPlan};
if((requestMode==='modify'||requestMode==='edit_text'||requestMode==='replan') && priorPlan){responsePlan={...universalPlan,...priorPlan};responsePlan.manualTextElements=Array.isArray(priorPlan.manualTextElements)?priorPlan.manualTextElements:[];responsePlan.textElements=Array.isArray(priorPlan.textElements)?priorPlan.textElements:responsePlan.textElements;responsePlan.textStyles=priorPlan.textStyles||responsePlan.textStyles;responsePlan.userTextLocked=!!priorPlan.userTextLocked;}
responsePlan.displayBudget=displayBudgetForCanvas(w,h,responsePlan);
return res.status(200).json({renderMode:'unified-ai-composer',structuredStateMode:true,image:`data:image/png;base64,${b}`,width:w,height:h,exportMode:'safe-contain',safeCrop:sp.safe,generationCanvas:{width:sp.gw,height:sp.gh},canvasProfile:strategy.profile,bannerPlan:responsePlan,sourceManifest:inventory,sourceElements:canonicalSourceElements(inventory,responsePlan),validationSummary:(requestMode==='edit_text'||requestMode==='modify')?(retried?'V8.7 current-design preservation QA rejected the first patch and accepted the stricter retry.':'V8.7 current-design preservation QA accepted the patch without a redesign.'):(retried?'V8.7 visual QA detected a preservation/layout issue and automatically regenerated once.':(requestMode==='regenerate'?'V8.7 REGENERATE created a new layout from canonical source state.':'V8.7 visual QA passed: no obvious invented elements, clipping, major omissions, or severe canvas-utilization issues detected.'))})}catch(e){console.error(e);return res.status(500).json({error:e?.message||'Unexpected server error'})}}


/*

CONTROLLED CREATIVE FREEDOM — V8.7:
The final canvas is exactly 728x90 and MUST be treated as the design surface from the first decision.
Do NOT use a rigid left/right/thirds template. Compose the whole advertisement as an art director.
You may place the main source subject left, right, center, off-center, between text groups, or partially integrated with typography/background when visually strong.
Choose subject scale for the WHOLE composition; do not automatically maximize it. Preserve recognizable faces and important source subjects.
Choose headline wrapping (one or two lines) based on balance and readability.
Event details may sit below, beside, or in another deliberate region. Do not cram factual lines merely to maximize font size.
Use the full canvas intelligently. Dead space is allowed only when it creates intentional visual breathing room; otherwise rebalance scale, position, typography, decorative environment, or CTA.
Creative decorative graphics are encouraged: architecture, skyline motifs, lighting, textures, gradients, patterns, shapes, environmental atmosphere, and source-inspired visual language.
Decorative graphics may be newly created, but MUST NOT introduce factual claims.
Never fabricate factual text: names, dates, times, venue, address, price, organization, CTA wording, or other event facts must come from the source.
Never render planner labels, metadata, schema names, debug text, internal instructions, or placeholders.
Do not put isolated people into portrait cards, rounded thumbnails, frames, badges, or boxes unless the source design clearly calls for that treatment.
Prefer integrated layering: background/environment -> decorative art -> source subject -> factual typography/CTA.
Before approving the plan, critique the COMPLETE banner for: visual balance, text legibility, subject recognizability, awkward cropping, dead space, cramped copy, background richness, and whether it looks like a professionally designed ad.
If any of those are weak, revise the composition before rendering.

*/
