import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { loadProgress, saveProgress } from '../.electron-dist/electron/progress-service.js';
import { activePage, eventAt, executeCommands, initialProgress, isBlocked, move } from '../.electron-dist/src/core/world.js';

const fixture=fileURLToPath(new URL('../fixtures/stage0-safe-project',import.meta.url));
test('collision, event solid, dan switch pintu memakai state yang sama',async()=>{const bundle=loadProject(fixture);let state=initialProgress(bundle);assert.deepEqual({x:state.x,y:state.y},{x:2,y:2});state=move(bundle,state,'right');assert.deepEqual({x:state.x,y:state.y},{x:2,y:2});assert.equal(isBlocked(bundle,state,5,2),true);const guide=eventAt(bundle,state,3,2,'interact');assert.ok(guide);const io={showText:async()=>{},choose:async()=>0};state=await executeCommands(bundle,state,activePage(guide,state).commands,io);assert.equal(state.switches['door.open'],true);assert.equal(state.inventory['item.token'],1);assert.equal(isBlocked(bundle,state,5,2),false);});
test('transfer dua map dan variable berjalan deterministik',async()=>{const bundle=loadProject(fixture);let state=initialProgress(bundle);state=await executeCommands(bundle,state,[{type:'setVariable',id:'story.step',value:2},{type:'transfer',mapId:'map.field',x:2,y:2}],{showText:async()=>{},choose:async()=>0});assert.equal(state.variables['story.step'],2);assert.deepEqual({mapId:state.mapId,x:state.x,y:state.y},{mapId:'map.field',x:2,y:2});});
test('save progres terpisah dapat dimuat dan korupsi ditolak',async()=>{const bundle=loadProject(fixture);const base=await mkdtemp(join(tmpdir(),'nusv-progress-'));const state={...initialProgress(bundle),switches:{'door.open':true},inventory:{'item.token':1}};saveProgress(base,bundle,state);assert.deepEqual(loadProgress(base,bundle),state);const file=join(base,bundle.project.projectId,'slot-01.json');await writeFile(file,'{"schemaVersion":9}');assert.throws(()=>loadProgress(base,bundle),/schemaVersion/);});
test('save v1 dimigrasikan ke v2 tanpa kehilangan state eksplorasi',async()=>{const bundle=loadProject(fixture);const base=await mkdtemp(join(tmpdir(),'nusv-progress-v1-'));const legacy={schemaVersion:1,projectId:bundle.project.projectId,mapId:'map.field',x:2,y:2,facing:'right',switches:{'door.open':true},variables:{'story.step':2},inventory:{'item.token':1}};const migrated=saveProgress(base,bundle,legacy);assert.equal(migrated.schemaVersion,2);assert.equal(migrated.switches['door.open'],true);assert.ok(migrated.actorResources['actor.arka']);assert.ok(migrated.actorProgress['actor.arka']);});
