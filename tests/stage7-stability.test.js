import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { loadProgress,saveProgress,validateProgress } from '../.electron-dist/electron/progress-service.js';
import { simulateEncounter } from '../.electron-dist/src/core/simulation.js';
import { initialProgress } from '../.electron-dist/src/core/world.js';
const bundle=loadProject(resolve('fixtures/stage0-safe-project'));

test('save korup dipulihkan otomatis dari backup terakhir yang valid',async()=>{const base=await mkdtemp(join(tmpdir(),'nusv-stage7-recovery-')),first={...initialProgress(bundle),gold:11};saveProgress(base,bundle,first);const second={...first,gold:22};saveProgress(base,bundle,second);const file=join(base,bundle.project.projectId,'slot-01.json');await writeFile(file,'{"schemaVersion":2,"broken":true}');const recovered=loadProgress(base,bundle);assert.equal(recovered.gold,11);assert.equal(JSON.parse(await readFile(file,'utf8')).gold,11);});

test('save v2 sebelum Tahap 6 memperoleh field baru tanpa kehilangan progres',()=>{const legacy=structuredClone(initialProgress(bundle));delete legacy.quests;delete legacy.formation;delete legacy.settings;delete legacy.telemetry;delete legacy.eventPositions;legacy.gold=77;legacy.switches['legacy.flag']=true;const migrated=validateProgress(bundle,legacy);assert.equal(migrated.gold,77);assert.equal(migrated.switches['legacy.flag'],true);assert.deepEqual(migrated.formation,bundle.project.party);assert.equal(migrated.settings.language,'id');assert.deepEqual(migrated.eventPositions,{});});

test('budget performa validasi dan simulasi encounter representatif',()=>{const startValidation=performance.now();for(let index=0;index<250;index++)validateProgress(bundle,initialProgress(bundle));const validationMs=performance.now()-startValidation,startSimulation=performance.now();const result=simulateEncounter(bundle.game,initialProgress(bundle),'troop.ash-warden',100),simulationMs=performance.now()-startSimulation;assert.ok(validationMs<2500,`validasi terlalu lambat: ${validationMs.toFixed(1)}ms`);assert.ok(simulationMs<2500,`simulasi terlalu lambat: ${simulationMs.toFixed(1)}ms`);assert.equal(result.runs,100);});

test('renderer memakai CSP dan tidak mengekspos Node langsung',async()=>{for(const file of ['index.html','player.html']){const html=await readFile(resolve(file),'utf8');assert.match(html,/Content-Security-Policy/);assert.match(html,/object-src 'none'/);}const main=await readFile(resolve('electron/main.ts'),'utf8');assert.match(main,/contextIsolation: true/);assert.match(main,/nodeIntegration: false/);assert.match(main,/sandbox: true/);assert.match(main,/setWindowOpenHandler/);});
