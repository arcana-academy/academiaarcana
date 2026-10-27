'use strict';
// C40 BOUNDED REVIEW-ONLY DERIVATIVE of S32. Original source remains untouched.
// Original S32 blob: cfdbf7fd048e9c1157841182af27f47fb31aa1f4
// No source CSS/WOFF2 or evidence artifact is published by this script.
// Captures ORIGINAL fonts as a CANDIDATE; never auto-approves or triggers a workflow.
const fs=require('node:fs'),path=require('node:path'),https=require('node:https');
const {createHash}=require('node:crypto');
const sha256=b=>createHash('sha256').update(b).digest('hex');
const LIMIT={maxBytes:64*1024*1024,maxObjects:64,maxWoff2:48,maxElapsedMs:120000,maxStylesheets:4};
let totalBytes=0, objects=0, uniqueWoff2=0;
const deadline=Date.now()+LIMIT.maxElapsedMs;
function enforceTime(){if(Date.now()>deadline)blocked('overall collection time limit exceeded')}
function blocked(why){throw Error('BLOCKED: '+why)}
if(process.env.AA_EVIDENCE_COLLECTION_AUTHORIZED!=='yes' ||
   process.env.RUNNER_OS!=='Linux' || process.env.GITHUB_ACTIONS!=='true')
  blocked('authorized GitHub Linux runner required');
if(!path.isAbsolute(process.env.RUNNER_TEMP||''))
  blocked('ephemeral runner storage required');
const root=process.cwd(), source=fs.readFileSync(path.join(root,'src/app/fonts.ts'));
const blob=createHash('sha1').update('blob '+source.length+'\0').update(source).digest('hex');
if(blob!=='3315a36d3977b894256b65c2a24cacfa43cef5fa')
  blocked('canonical font source changed');
if(require(path.join(root,'node_modules/next/package.json')).version!=='16.4.3')
  blocked('Next.js loader version changed');
const helper=n=>require(path.join(root,'node_modules/next/dist/compiled/@next/font/dist/google',n));
const {validateGoogleFontFunctionCall}=helper('validate-google-font-function-call');
const {getFontAxes}=helper('get-font-axes');
const {getGoogleFontsUrl}=helper('get-google-fonts-url');
const {findFontFilesInCss}=helper('find-font-files-in-css');
const fonts=[
 ['Grenze',{subsets:['latin'],display:'swap',variable:'--font-arcana-grenze'}],
 ['Literata',{subsets:['latin'],display:'swap',variable:'--font-arcana-literata'}],
 ['Cormorant_Upright',{subsets:['latin'],weight:['400','600'],display:'swap',variable:'--font-arcana-cormorant',preload:false}],
 ['Smythe',{subsets:['latin'],weight:'400',display:'swap',variable:'--font-arcana-smythe',preload:false}]
];
const agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '+
 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
function fetchExactly(url,host,maxSize){
 enforceTime();
 if(++objects>LIMIT.maxObjects)blocked('total request count exceeded');
 const u=new URL(url);
 if(u.protocol!=='https:'||u.hostname!==host||u.port||u.username||u.password||u.hash)
  blocked('unexpected provider');
 return new Promise((resolve,reject)=>{
  const req=https.get(u,{timeout:Math.min(12000,Math.max(1000,deadline-Date.now())),headers:{'User-Agent':agent}},res=>{
   if(res.statusCode!==200){res.resume();reject(Error('provider status '+res.statusCode));return}
   const parts=[];let count=0;
   res.on('data',b=>{
    count+=b.length;
    totalBytes+=b.length;
    if(count>maxSize || totalBytes>LIMIT.maxBytes || Date.now()>deadline)
      res.destroy(Error('aggregate / per-file / time resource limit'));
    else parts.push(b);
   });
   res.on('error',reject);res.on('end',()=>resolve(Buffer.concat(parts)));
  });
  const remaining=Math.max(1,deadline-Date.now());
  const hardTimer=setTimeout(()=>req.destroy(Error('request hard deadline')),Math.min(remaining,12000));
  req.on('close',()=>clearTimeout(hardTimer));
  req.on('timeout',()=>req.destroy(Error('timeout')));
  req.on('error',reject);
 });
}
(async()=>{
 const dir=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP,'aa-font-candidate-'));
 fs.chmodSync(dir,0o700);
 const manifest={schema:1,approvalState:'candidate-only',
  sourceBlob:'3315a36d3977b894256b65c2a24cacfa43cef5fa',
  nextVersion:'16.4.3',fonts:{}};
 const cache=new Map();
 const cssEvidence=[];
 for(const [name,args] of fonts){
  enforceTime();
  if(cssEvidence.length>=LIMIT.maxStylesheets)blocked('maximum stylesheet count exceeded');
  const f=validateGoogleFontFunctionCall(name,args);
  const axes=getFontAxes(f.fontFamily,f.weights,f.styles,f.selectedVariableAxes);
  const cssUrl=getGoogleFontsUrl(f.fontFamily,axes,f.display);
  const cssBytes=await fetchExactly(cssUrl,'fonts.googleapis.com',256*1024);
  const css=cssBytes.toString('utf8');
  const cssHash=sha256(cssBytes);
  const cssFile=path.join(dir,sha256(Buffer.from(cssUrl))+'.css');
  fs.writeFileSync(cssFile,cssBytes,{mode:0o600,flag:'wx'});
  cssEvidence.push({family:f.fontFamily,url:cssUrl,sha256:cssHash,file:cssFile});
  if(!css.includes('@font-face')||/@import\b/i.test(css))blocked('CSS not expected');
  const entries=findFontFilesInCss(css,f.preload?f.subsets:undefined);
  if(entries.length<1||entries.length>80)blocked('font count');
  const entry={cssSha256:cssHash,files:{}};
  for(const {googleFontFileUrl,ext} of entries){
   if(ext!=='woff2'||!googleFontFileUrl.startsWith('https://fonts.gstatic.com/'))
    blocked('unapproved WOFF2 resource');
   let hash=cache.get(googleFontFileUrl);
   if(!hash){
    if(++uniqueWoff2>LIMIT.maxWoff2)blocked('maximum unique WOFF2 count exceeded');
    const binary=await fetchExactly(googleFontFileUrl,'fonts.gstatic.com',3*1024*1024);
    if(binary.length<64||binary.toString('ascii',0,4)!=='wOF2')blocked('WOFF2 format');
    hash=sha256(binary);
    fs.writeFileSync(path.join(dir,sha256(Buffer.from(googleFontFileUrl))+'.woff2'),
      binary,{mode:0o600,flag:'wx'});
    cache.set(googleFontFileUrl,hash);
   }
   entry.files[googleFontFileUrl]=hash;
  }
  manifest.fonts[f.fontFamily]=entry;
 }
 enforceTime();
 if(Object.keys(manifest.fonts).length!==4||cache.size<4)
  blocked('missing canonical font evidence');
 const json=JSON.stringify(manifest,null,2)+'\n';
 const output=path.join(dir,'candidate-manifest.json');
 fs.writeFileSync(output,json,{mode:0o600,flag:'wx'});
 const index={schema:1,approvalState:'candidate-only',
  originalCSS:cssEvidence,
  originalWOFF2:[...cache].map(([url,digest])=>({url,sha256:digest,
   file:path.join(dir,sha256(Buffer.from(url))+'.woff2')}))};
 const indexJSON=JSON.stringify(index,null,2)+'\n';
 const indexPath=path.join(dir,'evidence-index.json');
 fs.writeFileSync(indexPath,indexJSON,{mode:0o600,flag:'wx'});
 const report={approval:false,status:'CANDIDATE_NOT_APPROVED',
  sourceBlob:manifest.sourceBlob, nextVersion:manifest.nextVersion,
  stylesheetOrigin:'fonts.googleapis.com',binaryOrigin:'fonts.gstatic.com',
  manifestSha256:sha256(Buffer.from(json)),candidatePath:output,
  evidenceIndexPath:indexPath,evidenceIndexSha256:sha256(Buffer.from(indexJSON)),
  originalCSSFiles:cssEvidence.length,
  requests:objects,totalDownloadedBytes:totalBytes,elapsedMs:LIMIT.maxElapsedMs-(deadline-Date.now()),
  custody:'TEMPORARY_RUNNER_ONLY_NO_PUBLIC_ARTIFACT_UPLOAD',
  woff2Files:cache.size,next:'Independent evidence review and owner approval required'};
 fs.writeFileSync(path.join(dir,'evidence-report.json'),
  JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
 // Only sanitized digest metadata goes to runner logs. Raw CSS and WOFF2
 // remain on the disposable runner and are NOT included in an artifact upload.
 console.log(JSON.stringify({status:report.status,approval:false,
  sourceBlob:report.sourceBlob,manifestSha256:report.manifestSha256,
  evidenceIndexSha256:report.evidenceIndexSha256,
  originalCSSFiles:report.originalCSSFiles,woff2Files:report.woff2Files,
  requests:report.requests,totalDownloadedBytes:report.totalDownloadedBytes,
  custody:report.custody}));
})().catch(e=>{console.error('EVIDENCE_BLOCKED: '+e.message);process.exitCode=1});
