import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { listChanges } from '../src/git.js';
import { selectPlan } from '../src/analyze.js';
import { formatReport } from '../src/report.js';

const root=mkdtempSync(join(tmpdir(),'agentfast-demo-'));
function git(...args){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});
 if(r.status!==0)throw new Error(r.stderr);
}
function write(path,content){
 const full=join(root,path);
 mkdirSync(join(full,'..'),{recursive:true});
 writeFileSync(full,content);
}
try{
 git('init','-q');git('config','user.name','AgentFast Demo');git('config','user.email','demo@example.invalid');
 write('src/math.js','export const add=(a,b)=>a+b;\n');
 write('tests/math.test.js',"import { add } from '../src/math.js';\n");
 git('add','.');git('commit','-qm','baseline');
 write('src/math.js','export const add=(a,b)=>a-b;\n');
 console.log('=== Focused source change ===');
 console.log(formatReport(selectPlan(root,'HEAD',listChanges(root)),{color:false}));
 write('src/auth/session.js','export const authenticated=true;\n');
 console.log('=== Authentication change ===');
 console.log(formatReport(selectPlan(root,'HEAD',listChanges(root)),{color:false}));
}finally{rmSync(root,{recursive:true,force:true});}
