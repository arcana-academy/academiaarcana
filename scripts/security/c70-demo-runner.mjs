import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SHA="6a7b1907dc5fc854ab4a5c758911a75c2e251305";
const BRANCH="refs/heads/work/aa360-c70-pr767-demo-exact-20261021";
assert.equal(process.env.GITHUB_ACTIONS,"true");
assert.equal(process.env.GITHUB_EVENT_NAME,"push");
assert.equal(process.env.GITHUB_REPOSITORY,"arcana-academy/academiaarcana");
assert.equal(process.env.GITHUB_REF,BRANCH);
assert.equal(process.env.AA_LOCAL_SUPABASE_E2E,"1");
assert.equal(process.env.AA_C70_QA,"1");
assert.equal(execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),SHA);
for(const key of ["SUPABASE_ACCESS_TOKEN","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","DATABASE_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]){
  assert.equal(process.env[key],undefined,"Preconfigured hosted settings refused: "+key);
}
const raw=execFileSync("supabase",["status","-o","env"],{encoding:"utf8",timeout:30000});
const vars=Object.fromEntries(raw.split(/\r?\n/).flatMap(line=>{
  const m=line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return m?[[m[1],m[2].replace(/^[\"']|[\"']$/g,"")]]:[];
}));
assert.ok(vars.API_URL && vars.ANON_KEY);
const api=new URL(vars.API_URL);
assert.equal(api.protocol,"http:");
assert.equal(api.hostname,"127.0.0.1");
assert.equal(api.port,"54321");
assert.equal(api.pathname,"/");
const makeClient=()=>createClient(api.toString(),vars.ANON_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const a=makeClient(),b=makeClient();
const password="C70-"+randomBytes(22).toString("hex")+"!";
const emailA="c70a-"+randomUUID()+"@example.test";
const emailB="c70b-"+randomUUID()+"@example.test";
function success(r,label){if(r.error)throw new Error(label+": "+r.error.message);return r.data;}
const accountA=success(await a.auth.signUp({email:emailA,password}),"Signup A");
const accountB=success(await b.auth.signUp({email:emailB,password}),"Signup B");
assert.ok(accountA.user?.id&&accountA.session&&accountB.user?.id&&accountB.session);
assert.notEqual(accountA.user.id,accountB.user.id);
const taskA=success(await a.from("study_tasks").insert({owner_id:accountA.user.id,title:"C70 estudo pendente sintético"}).select("id").single(),"Task A");
success(await b.from("study_tasks").insert({owner_id:accountB.user.id,title:"C70 tarefa de outra identidade"}).select("id").single(),"Task B");
const completed=success(await a.from("study_tasks").insert({owner_id:accountA.user.id,title:"C70 estudo concluído sintético"}).select("id").single(),"Completion seed");
success(await a.rpc("complete_study_task_with_reward",{p_task_id:completed.id}),"Complete A task");
assert.ok(taskA.id);
console.log("PASS C70: two isolated synthetic identities and targeted Academy/Cronograma/Missions fixtures created in local Supabase");

const dir=mkdtempSync(join(tmpdir(),"aa-c70-tls-"));
const key=join(dir,"localhost.key"),cert=join(dir,"localhost.crt"),port=54443;
let proxy;
function portReady(){
 return new Promise(resolve=>{
  const socket=connect({host:"127.0.0.1",port});
  socket.once("connect",()=>{socket.destroy();resolve(true);});
  socket.once("error",()=>{socket.destroy();resolve(false);});
 });
}
try{
  execFileSync("openssl",["req","-x509","-newkey","rsa:2048","-sha256","-nodes","-days","1","-keyout",key,"-out",cert,"-subj","/CN=localhost","-addext","subjectAltName=DNS:localhost,IP:127.0.0.1"],{stdio:"ignore",timeout:20000});
  const proxyCode=`
    import https from "node:https";
    import http from "node:http";
    import {readFileSync} from "node:fs";
    const source=new URL(process.env.AA_LOCAL_SUPABASE_ORIGIN);
    if(source.protocol!=="http:" || source.hostname!=="127.0.0.1" || source.port!=="54321")process.exit(23);
    https.createServer({key:readFileSync(process.env.AA_LOCAL_TLS_KEY_FILE),cert:readFileSync(process.env.AA_LOCAL_TLS_CERT_FILE)},(req,res)=>{
      const upstream=http.request({hostname:"127.0.0.1",port:54321,method:req.method,path:req.url,headers:{...req.headers,host:source.host}},r=>{res.writeHead(r.statusCode??502,r.headers);r.pipe(res);});
      upstream.on("error",()=>{if(!res.headersSent)res.writeHead(502);res.end();});
      req.pipe(upstream);
    }).listen(54443,"127.0.0.1");
  `;
  proxy=spawn(process.execPath,["--input-type=module","-e",proxyCode],{
    stdio:["ignore","inherit","inherit"],
    env:{...process.env,AA_LOCAL_SUPABASE_ORIGIN:api.origin,AA_LOCAL_TLS_KEY_FILE:key,AA_LOCAL_TLS_CERT_FILE:cert}
  });
  let ready=false;
  for(let i=0;i<50;i++){
    if(proxy.exitCode!==null)break;
    if(await portReady()){ready=true;break;}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  assert.ok(ready,"Disposable HTTPS loopback bridge not listening");
  console.log("PASS C70: local HTTPS proxy established without weakening CSP");
  const env={...process.env,
    NODE_EXTRA_CA_CERTS:cert,
    NEXT_PUBLIC_SUPABASE_URL:"https://127.0.0.1:54443/",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:vars.ANON_KEY,
    E2E_EMAIL:emailA,E2E_EMAIL_B:emailB,E2E_PASSWORD:password
  };
  const build=spawnSync("npm",["exec","--","next","build","--webpack"],{stdio:"inherit",timeout:8*60_000,env});
  if(build.error)throw build.error;
  assert.equal(build.status,0,"Local-only Next build failed");
  console.log("PASS C70: local synthetic Next.js build using production CSP");
  const test=spawnSync("npm",["exec","--","playwright","test","tests/e2e/c70-demo.spec.ts","--config=playwright.local-auth.config.ts","--workers=1","--retries=0"],{stdio:"inherit",timeout:10*60_000,env});
  if(test.error)throw test.error;
  assert.equal(test.status,0,"Targeted C70 browser demonstration failed");
  console.log("PASS C70: targeted authenticated Academy, Cronograma, Missions and Profile browser journey");
}finally{
  if(proxy&&proxy.exitCode===null)proxy.kill();
  rmSync(dir,{recursive:true,force:true});
}
