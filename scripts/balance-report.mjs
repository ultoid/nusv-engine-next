import { loadProject } from '../.electron-dist/electron/project-service.js';
import { initialProgress } from '../.electron-dist/src/core/world.js';
import { simulateEncounter } from '../.electron-dist/src/core/simulation.js';
import { fileURLToPath } from 'node:url';
const bundle=loadProject(fileURLToPath(new URL('../fixtures/stage0-safe-project',import.meta.url)));
const progress=initialProgress(bundle);
const rows=bundle.game.troops.map(troop=>{const result=simulateEncounter(bundle.game,progress,troop.id,100);return{encounter:troop.name,runs:result.runs,'win %':Math.round(result.winRate*100),'avg turns':result.averageTurns.toFixed(1),'avg damage':result.averageDamageTaken.toFixed(1)};});
console.table(rows);
