import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, renameSync, unlinkSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { listChanges, parseNameStatusZ, GitError } from '../src/git.js';
import { classify, isTest, discover, selectPlan } from '../src/analyze.js';
import { formatReport, formatMarkdownReport } from '../src/report.js';

function run(command,args,cwd) {
 const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:10000});
 assert.equal(r.status,0,command+' '+args.join(' ')+'\n'+r.stderr);
 return r.stdout;
}
function write(root,path,content) {
 const p=join(root,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,content);
}
function fixture(t,files={}) {
 const root=mkdtempSync(join(tmpdir(),'agentfast-test-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 run('git',['init','-q'],root);
 run('git',['config','user.email','test@example.invalid'],root);
 run('git',['config','user.name','Test'],root);
 for(const [p,c] of Object.entries(files))write(root,p,c);
 run('git',['add','.'],root);run('git',['commit','-qm','initial'],root);return root;
}
const demo={'src/math.js':'export const add=(a,b)=>a+b;\n','tests/math.test.js':"import { add } from '../src/math.js';\n"};
const analyze=root=>selectPlan(root,'HEAD',listChanges(root));

test('parses rename and paths with spaces',()=>{
 assert.deepEqual(parseNameStatusZ('M\0with spaces/a.ts\0R098\0old.js\0new.js\0'),[
 {status:'modified',path:'with spaces/a.ts'},{status:'renamed',path:'new.js',previousPath:'old.js'}]);
});
for(const [path,want] of [['src/x.test.ts',true],['tests/x.spec.js',true],['src/x.ts',false]]) {
 test('test-file detection '+path,()=>assert.equal(isTest(path),want));
}
for(const [path,code] of [
 ['src/auth/session.js','AUTH_CHANGE'],
 ['src/payments/checkout.ts','PAYMENT_CHANGE'],
 ['prisma/schema.prisma','SCHEMA_CHANGE'],
 ['migrations/01.sql','SCHEMA_CHANGE'],
 ['package.json','CONFIG_CHANGE'],
 ['src/utils/core.js','SHARED_CODE'],
 ['docs/readme.md','DOCUMENTATION']
]) {
 test('classifies '+path,()=>assert.equal(classify(path).code,code));
}
test('no changes',t=>{const root=fixture(t,demo);assert.equal(analyze(root).decision.reason,'NO_CHANGES');});
test('documentation-only',t=>{const root=fixture(t,demo);write(root,'README.md','# docs');assert.equal(analyze(root).decision.reason,'DOCUMENTATION_ONLY');});
test('targeted dependent test',t=>{const root=fixture(t,demo);write(root,'src/math.js','export const add=(a,b)=>a-b;');assert.deepEqual(analyze(root).affectedTests,['tests/math.test.js']);});
test('transitive dependencies',t=>{
 const root=fixture(t,{'src/calc.js':'export const x=1;','src/index.js':"import './calc.js';",'tests/index.test.js':"import '../src/index.js';"});
 write(root,'src/calc.js','export const x=2;');assert.deepEqual(analyze(root).affectedTests,['tests/index.test.js']);
});
test('authentication requires full',t=>{const root=fixture(t,{'src/auth/session.js':'export const x=1;'});write(root,'src/auth/session.js','export const x=2;');assert.equal(analyze(root).decision.mode,'full');});
test('unknown source requires full',t=>{const root=fixture(t,{'src/solo.js':'export default 1;'});write(root,'src/solo.js','export default 2;');assert.equal(analyze(root).decision.reason,'NO_MATCHING_TESTS');});
test('test-only modifications target test',t=>{const root=fixture(t,demo);write(root,'tests/math.test.js',"import '../src/math.js';\n// change");assert.equal(analyze(root).decision.mode,'targeted');});
test('untracked files included',t=>{const root=fixture(t,demo);write(root,'tests/add.test.js',"import '../src/math.js';");assert.ok(listChanges(root).some(x=>x.status==='untracked'));});
test('deletion is structural',t=>{const root=fixture(t,demo);unlinkSync(join(root,'src/math.js'));assert.equal(analyze(root).decision.reason,'STRUCTURAL_CHANGE');});
test('rename is structural',t=>{const root=fixture(t,demo);renameSync(join(root,'src/math.js'),join(root,'src/new.js'));run('git',['add','-A'],root);assert.equal(analyze(root).decision.reason,'STRUCTURAL_CHANGE');});
test('unresolved import requires full',t=>{const root=fixture(t,{...demo,'src/unresolved.js':"import './missing.js';"});write(root,'src/math.js','export const add=2;');assert.equal(analyze(root).decision.reason,'INCOMPLETE_DEPENDENCY_GRAPH');});
test('plain report has no ANSI',t=>{const root=fixture(t,demo);write(root,'src/math.js','export const add=3;');assert.doesNotMatch(formatReport(analyze(root),{color:false}),/\x1b\[/);});
test('invalid git ref rejected',t=>{const root=fixture(t,demo);assert.throws(()=>listChanges(root,'--malicious'),GitError);});
test('CLI machine-readable output',t=>{
 const root=fixture(t,demo);write(root,'src/math.js','export const add=3;');
 const out=run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--json'],root);
 assert.equal(JSON.parse(out).decision.mode,'targeted');
});
test('CLI exit code 2 for full',t=>{
 const root=fixture(t,{'package.json':'{"name":"x"}'});write(root,'package.json','{"name":"y"}');
 const r=spawnSync(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--fail-on-full'],{encoding:'utf8'});
 assert.equal(r.status,2);
});
test('symlink scan stays within repo',t=>{
 const root=fixture(t,demo),other=mkdtempSync(join(tmpdir(),'agentfast-outside-'));
 t.after(()=>rmSync(other,{recursive:true,force:true}));write(other,'secret.js','const secret=true;');
 try{symlinkSync(other,join(root,'external'),'dir');}catch(e){if(process.platform==='win32'&&e.code==='EPERM'){t.skip();return;}throw e;}
 assert.ok(!discover(root).files.some(x=>x.includes('secret')));
});


test('Markdown output is suitable for PR and GitHub Actions summaries',t=>{
 const root=fixture(t,demo);write(root,'src/math.js','export const add=3;');
 const text=run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','markdown'],root);
 assert.match(text,/## AgentFast — change risk advisory/);
 assert.match(text,/Targeted tests suggested/);
 assert.match(text,/tests\/math\.test\.js/);
 assert.match(text,/full required CI checks/i);
});
test('Markdown report escapes untrusted file paths',t=>{
 const root=fixture(t,demo);write(root,'src/math.js','export const add=3;');
 const plan=analyze(root);
 plan.risks=[{code:'AUTH_CHANGE',path:'src/auth/<script>|unsafe*.ts'}];
 const report=formatMarkdownReport(plan);
 assert.match(report,/&lt;script&gt;/);
 assert.match(report,/&#124;/);
 assert.doesNotMatch(report,/<script>/);
});
test('Markdown output supports full-suite safety recommendation',t=>{
 const root=fixture(t,{'src/auth/session.js':'export const x=1;'});
 write(root,'src/auth/session.js','export const x=2;');
 const result=run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','markdown'],root);
 assert.match(result,/Full test suite recommended/);
 assert.match(result,/AUTH_CHANGE/);
});
test('safe --output creates report but never overwrites',t=>{
 const root=fixture(t,demo);write(root,'src/math.js','export const add=4;');
 const outfile=join(root,'report.md');
 const first=spawnSync(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','markdown','--output',outfile],{encoding:'utf8'});
 assert.equal(first.status,0,first.stderr);
 const content=readFileSync(outfile,'utf8');
 assert.match(content,/## AgentFast/);
 const second=spawnSync(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','markdown','--output',outfile],{encoding:'utf8'});
 assert.equal(second.status,1);
 assert.equal(readFileSync(outfile,'utf8'),content);
});
test('JSON format aliases legacy --json',t=>{
 const root=fixture(t,demo);write(root,'src/math.js','export const add=7;');
 const a=run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--json'],root);
 const b=run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','json'],root);
 assert.deepEqual(JSON.parse(a),JSON.parse(b));
});
test('CLI rejects invalid formats and conflicting outputs',t=>{
 const root=fixture(t,demo);
 for(const args of [['check','--format','xml'],['check','--json','--format','markdown'],['doctor','--output','bad.txt']]){
  const r=spawnSync(process.execPath,[resolve('bin/agentfast.js'),...args,'--root',root],{encoding:'utf8'});
  assert.equal(r.status,1,JSON.stringify(args));
 }
});
test('fail-on-full exit status remains 2 with Markdown output',t=>{
 const root=fixture(t,{'src/auth/session.js':'export const x=1;'});
 write(root,'src/auth/session.js','export const x=2;');
 const r=spawnSync(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','markdown','--fail-on-full'],{encoding:'utf8'});
 assert.equal(r.status,2,r.stderr);
 assert.match(r.stdout,/Full test suite/);
});
