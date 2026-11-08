import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { analyzeSymbolChanges } from '../src/symbols.js';
import { selectPlan } from '../src/analyze.js';
import { listChanges } from '../src/git.js';

let typescript = null;
try { typescript = createRequire(import.meta.url)('typescript'); } catch { /* optional */ }

function run(cmd,args,root){
 const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:15000});
 assert.equal(r.status,0,r.stderr||r.stdout);
 return r.stdout;
}
function put(root,path,text){
 const full=join(root,path);
 mkdirSync(dirname(full),{recursive:true});
 writeFileSync(full,text);
}
function fixture(t,files){
 const root=mkdtempSync(join(tmpdir(),'agentfast-symbols-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 run('git',['init','-q'],root);
 run('git',['config','user.email','fixture@example.invalid'],root);
 run('git',['config','user.name','Fixture'],root);
 for(const [path,body] of Object.entries(files))put(root,path,body);
 run('git',['add','.'],root);
 run('git',['commit','-qm','baseline'],root);
 return root;
}
const baseline={
 'src/core.ts':'export const add = (x: number) => x + 1;\nexport const keep = 42;\n',
 'tests/core.test.ts':"import { add } from '../src/core.ts';\n"
};

test('symbol preview recognizes a changed exported declaration and preserves file-level selection',{skip:!typescript},t=>{
 const root=fixture(t,baseline);
 put(root,'src/core.ts','export const add = (x: number) => x + 2;\nexport const keep = 42;\n');
 const changed=listChanges(root);
 const symbols=analyzeSymbolChanges(root,'HEAD',changed,{typescript});
 assert.equal(symbols.status,'preview');
 assert.deepEqual(symbols.changes[0].changedExports,[{name:'add',change:'modified'}]);
 assert.equal(symbols.changes[0].nonExportStatementsChanged,false);
 const plan=selectPlan(root,'HEAD',changed);
 assert.equal(plan.decision.mode,'targeted');
 assert.deepEqual(plan.affectedTests,['tests/core.test.ts']);
});

test('changed internal helper never becomes a claim of zero test impact',{skip:!typescript},t=>{
 const root=fixture(t,{
  'src/core.ts':'const helper = () => 1;\nexport const value = () => helper();\n',
  'tests/core.test.ts':"import { value } from '../src/core.ts';"
 });
 put(root,'src/core.ts','const helper = () => 2;\nexport const value = () => helper();\n');
 const result=analyzeSymbolChanges(root,'HEAD',listChanges(root),{typescript});
 assert.equal(result.status,'preview');
 assert.deepEqual(result.changes[0].changedExports,[]);
 assert.equal(result.changes[0].nonExportStatementsChanged,true);
 assert.match(result.caveat,/never|does not narrow/i);
});

test('reexports are inconclusive rather than silently treated as safe',{skip:!typescript},t=>{
 const root=fixture(t,{...baseline,'src/barrel.ts':"export { add } from './core.ts';\n"});
 put(root,'src/barrel.ts',"export { keep } from './core.ts';\n");
 const result=analyzeSymbolChanges(root,'HEAD',listChanges(root),{typescript});
 assert.equal(result.status,'partial');
 assert.match(result.diagnostics[0].reason,/re-export/i);
});

test('parse errors return explicit diagnostics',{skip:!typescript},t=>{
 const root=fixture(t,baseline);
 put(root,'src/core.ts','export const add = ;');
 const result=analyzeSymbolChanges(root,'HEAD',listChanges(root),{typescript});
 assert.equal(result.status,'partial');
 assert.match(result.diagnostics[0].reason,/syntax/i);
});

test('add/remove exported identifiers and full risk remain separate',{skip:!typescript},t=>{
 const root=fixture(t,{
  'src/auth/session.ts':'export const old = 1;\n',
  'tests/session.test.ts':"import '../src/auth/session.ts';"
 });
 put(root,'src/auth/session.ts','export const fresh = 2;\n');
 const changes=listChanges(root);
 const result=analyzeSymbolChanges(root,'HEAD',changes,{typescript});
 assert.deepEqual(result.changes[0].changedExports,[{name:'fresh',change:'added'},{name:'old',change:'removed'}]);
 assert.equal(selectPlan(root,'HEAD',changes).decision.mode,'full');
});

test('CLI refuses ambiguous text-format symbol reporting',t=>{
 const root=fixture(t,baseline);
 const command=spawnSync(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--symbol-impact'],{encoding:'utf8'});
 assert.equal(command.status,1);
 assert.match(command.stderr,/requires.*json/i);
});

test('CLI JSON symbol preview never changes the selection recommendation',t=>{
 const root=fixture(t,baseline);
 put(root,'src/core.ts','export const add = (x: number) => x + 2;\nexport const keep = 42;\n');
 const standard=JSON.parse(run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','json'],root));
 const enhanced=JSON.parse(run(process.execPath,[resolve('bin/agentfast.js'),'check','--root',root,'--format','json','--symbol-impact'],root));
 assert.equal(enhanced.decision.mode,standard.decision.mode);
 assert.deepEqual(enhanced.affectedTests,standard.affectedTests);
 assert.ok(['preview','unavailable'].includes(enhanced.symbolImpact.status));
 if(typescript) assert.equal(enhanced.symbolImpact.status,'preview');
});
