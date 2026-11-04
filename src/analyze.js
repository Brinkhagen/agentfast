import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, posix, sep } from 'node:path';

const IGNORE_DIRS = new Set(['.git','node_modules','.next','.nuxt','.turbo','.cache','dist','build','coverage','.output','vendor','.venv','tmp','temp','out']);
const SOURCE_EXTS = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.mts','.cts','.json']);
const SCRIPT_EXTS = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.mts','.cts']);
const TEST_PATTERN = /(?:^|\/)(?:__tests__\/.*|tests?\/.*|.*\.(?:test|spec))\.(?:[cm]?[jt]sx?)$/i;
const DOC_PATTERN = /(?:^|\/)(?:docs?\/|\.github\/ISSUE_TEMPLATE\/)|\.(?:md|mdx|txt|rst|adoc|svg|png|jpe?g|gif|webp)$/i;
const CONFIG_PATTERN = /(?:^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|bun\.lock|(?:vitest|jest|playwright|vite|next|webpack|tsup|babel|eslint|prettier)\.config\.[^/]+|tsconfig[^/]*\.json|\.env(?:\..*)?|Dockerfile|docker-compose[^/]*|\.github\/workflows\/.*)$/i;
const MIGRATION_PATTERN = /(?:^|\/)(?:prisma\/migrations\/|migrations\/|schema\.prisma$|.*migration.*\.(?:ts|js|sql)$)/i;
const AUTH_PATTERN = /(?:^|\/)(?:auth|authentication|authorization|acl|permissions?|rbac|jwt|sessions?|guards?|crypto|security)(?:\/|\.|-)/i;
const PAYMENT_PATTERN = /(?:^|\/)(?:payments?|billing|checkout|refunds?|invoices?|payouts?|stripe|mollie)(?:\/|\.|-)/i;
const SHARED_PATTERN = /(?:^|\/)(?:packages?\/(?:shared|core|common)|libs?\/(?:shared|core)|types?\/|utils?\/)/i;
const MAX_SOURCE_BYTES = 512*1024;
const MAX_FILES = 12000;

export const isTest = path => TEST_PATTERN.test(path);
export const isDocs = path => DOC_PATTERN.test(path);
export const isScript = path => SCRIPT_EXTS.has(extname(path));

export function discover(root) {
  const files=[], stack=[''];
  while(stack.length) {
    const dir=stack.pop();
    let entries;
    try {entries=readdirSync(join(root,dir),{withFileTypes:true});}catch{continue;}
    for(const entry of entries){
      const rel=dir?`${dir.split(sep).join('/')}/${entry.name}`:entry.name;
      if(entry.isSymbolicLink())continue;
      if(entry.isDirectory()){if(!IGNORE_DIRS.has(entry.name))stack.push(rel);}
      else if(entry.isFile()){files.push(rel);if(files.length>MAX_FILES)return {files,truncated:true};}
    }
  }
  return {files:files.sort(),truncated:false};
}

function importSpecifiers(content){
  const results=[];
  const patterns=[
    /\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s+)?['"]([^'"\n]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g
  ];
  for(const re of patterns)for(const match of content.matchAll(re))results.push(match[1]);
  return results;
}

function resolveLocalImport(importer,spec,lookup){
  const base=posix.normalize(posix.join(posix.dirname(importer),spec));
  if(base.startsWith('../')||base==='..'||base.startsWith('/'))return null;
  const candidates=[base];
  for(const ext of SOURCE_EXTS)candidates.push(base+ext);
  for(const ext of SOURCE_EXTS)candidates.push(posix.join(base,'index'+ext));
  return candidates.find(candidate=>lookup.has(candidate))||null;
}

export function dependencyGraph(root,files){
  const lookup=new Set(files),dependents=new Map(),ambiguous=[],tests=files.filter(isTest);
  for(const file of files){
    if(!isScript(file))continue;
    let content;
    try {
      const full=join(root,file);
      if(statSync(full).size>MAX_SOURCE_BYTES){ambiguous.push({path:file,reason:'file too large to analyze'});continue;}
      content=readFileSync(full,'utf8');
    }catch{ambiguous.push({path:file,reason:'unreadable source file'});continue;}
    for(const spec of importSpecifiers(content)){
      if(spec.startsWith('.')){
        const target=resolveLocalImport(file,spec,lookup);
        if(target){
          if(!dependents.has(target))dependents.set(target,new Set());
          dependents.get(target).add(file);
        }else ambiguous.push({path:file,reason:`unresolved local import: ${spec}`});
      }else if(/^(?:@\/|~\/|src\/|#)/.test(spec)){
        ambiguous.push({path:file,reason:`unresolved alias import: ${spec}`});
      }
    }
    if(/\b(?:import|require)\s*\(\s*(?!['"])/.test(content)){
      ambiguous.push({path:file,reason:'computed dynamic import or require'});
    }
  }
  return {dependents,tests,ambiguous};
}

function affectedTests(changes,graph){
  const queue=changes.flatMap(c=>c.previousPath?[c.path,c.previousPath]:[c.path]);
  const visited=new Set(queue),selected=new Set();
  while(queue.length){
    const file=queue.shift();
    if(isTest(file))selected.add(file);
    for(const dep of graph.dependents.get(file)||[]){
      if(!visited.has(dep)){visited.add(dep);queue.push(dep);}
    }
  }
  return [...selected].sort();
}

const severityRank={low:1,medium:2,high:3,critical:4};
const flag=(path,severity,code,description)=>({path,severity,code,description});

export function classify(path){
  if(MIGRATION_PATTERN.test(path)||/\.sql$/i.test(path))
    return flag(path,'critical','SCHEMA_CHANGE','Database schema or migration may require integration and migration checks.');
  if(AUTH_PATTERN.test(path))
    return flag(path,'critical','AUTH_CHANGE','Authentication, authorization or security-sensitive code changed.');
  if(PAYMENT_PATTERN.test(path))
    return flag(path,'critical','PAYMENT_CHANGE','Payment, checkout or billing code changed.');
  if(CONFIG_PATTERN.test(path))
    return flag(path,'high','CONFIG_CHANGE','Build, dependency, CI or runtime configuration changed.');
  if(SHARED_PATTERN.test(path)&&!isDocs(path))
    return flag(path,'high','SHARED_CODE','Shared modules may affect multiple consumers.');
  if(isDocs(path))return flag(path,'low','DOCUMENTATION','Documentation or static asset changed.');
  if(isTest(path))return flag(path,'low','TEST_CHANGE','Test file changed.');
  if(isScript(path))return flag(path,'medium','SOURCE_CHANGE','Application source file changed.');
  return flag(path,'high','UNCLASSIFIED_CHANGE','Unknown file type; test impact cannot be inferred safely.');
}

export function selectPlan(root,base,changes){
  const discovery=discover(root);
  const graph=dependencyGraph(root,discovery.files);
  const flags=changes.map(c=>classify(c.path));
  const impactedTests=affectedTests(changes,graph);
  const nonDocChanges=changes.filter(c=>!isDocs(c.path));
  const changedSource=changes.filter(c=>isScript(c.path)&&!isTest(c.path));
  const risks=flags.filter(f=>f.severity==='critical'||f.severity==='high');
  const notes=[];
  let mode='targeted',reason='AFFECTED_TESTS_FOUND',confidence='heuristic';
  if(changes.length===0){mode='none';reason='NO_CHANGES';confidence='high';}
  else if(nonDocChanges.length===0){mode='none';reason='DOCUMENTATION_ONLY';confidence='high';}
  else if(risks.length){mode='full';reason='HIGH_RISK_CHANGE';}
  else if(discovery.truncated){mode='full';reason='SCAN_LIMIT_REACHED';}
  else if(changedSource.some(c=>['deleted','renamed','copied','type-changed'].includes(c.status))){
    mode='full';reason='STRUCTURAL_CHANGE';
  }else if(changedSource.length>0&&graph.ambiguous.length>0){
    mode='full';reason='INCOMPLETE_DEPENDENCY_GRAPH';
  }else if(impactedTests.length===0){
    mode='full';reason='NO_MATCHING_TESTS';
  }
  if(graph.ambiguous.length)notes.push(`${graph.ambiguous.length} imports/files could not be resolved reliably.`);
  if(discovery.truncated)notes.push(`The repository exceeds the ${MAX_FILES}-file scan limit.`);
  if(changedSource.length>0&&impactedTests.length===0)notes.push('No matching tests were found through the supported static import graph.');
  notes.push('Static analysis cannot prove test completeness. Always run full required checks before merging or releasing.');
  const severity=flags.reduce((max,f)=>severityRank[f.severity]>severityRank[max]?f.severity:max,'low');
  return {
    schemaVersion:1,tool:'agentfast',base,repository:root,
    summary:{changed:changes.length,scannedFiles:discovery.files.length,totalTests:graph.tests.length,affectedTests:impactedTests.length,severity},
    decision:{mode,reason,confidence},changes,risks,affectedTests:impactedTests,
    diagnostics:graph.ambiguous.slice(0,20),notes
  };
}
