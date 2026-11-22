import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync,mkdtempSync,readdirSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { importMvSubset } from '../.electron-dist/electron/import-service.js';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { analyzeBundle,findReferences } from '../.electron-dist/src/core/diagnostics.js';

const root=resolve('fixtures/mv-import-sample');
const template=resolve('fixtures/stage0-safe-project');
function fingerprint(directory){const files=[];const walk=path=>{for(const name of readdirSync(path,{withFileTypes:true})){const target=join(path,name.name);if(name.isDirectory())walk(target);else files.push(target);}};walk(directory);const hash=createHash('sha256');for(const file of files.sort()){hash.update(file.slice(directory.length));hash.update(readFileSync(file));}return hash.digest('hex');}

test('importer MV subset mempertahankan sumber dan memetakan ID',()=>{
  const before=fingerprint(root);const input=loadProject(template);const target=mkdtempSync(join(tmpdir(),'nusv-stage5-assets-'));const result=importMvSubset(root,input,target);const after=fingerprint(root);
  assert.equal(after,before,'folder sumber berubah');assert.equal(result.report.idMap['actor:1'],'mv.actor.1');assert.equal(result.report.idMap['enemy:1'],'mv.enemy.1');
  assert.equal(result.bundle.game.actors.find(entry=>entry.id==='mv.actor.1').stats.str,14);assert.equal(result.bundle.game.enemies.find(entry=>entry.id==='mv.enemy.1').base.hp,80);
  assert.deepEqual(result.bundle.game.troops.find(entry=>entry.id==='mv.troop.1').enemyIds,['mv.enemy.1']);assert.ok(result.report.warnings.some(line=>line.includes('formula MV')));assert.ok(result.report.converted.includes('assets: 1'));assert.ok(existsSync(join(target,'assets','imported','asset.sample-marker.svg')));assert.equal(result.bundle.assets.assets.find(entry=>entry.id==='asset.sample-marker').license,'CC0-1.0 fixture generated for NUSV tests');
});

test('diagnostic menemukan referensi rusak dan pencarian menelusuri bundle',()=>{
  const bundle=loadProject(template);bundle.maps['map.intro'].events[0].pages[0].commands.push({type:'transfer',mapId:'map.missing',x:1,y:1});
  const issues=analyzeBundle(bundle);assert.ok(issues.some(issue=>issue.severity==='error'&&issue.message.includes('map.missing')));
  const hits=findReferences(bundle,'troop.training');assert.ok(hits.some(hit=>hit.path.includes('commands')));
});
