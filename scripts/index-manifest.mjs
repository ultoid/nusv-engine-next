import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { scanProjectAssets } from '../.electron-dist/electron/asset-service.js';

const projectRoot = resolve('project/my-rpg-game');
console.log('Scanning assets in:', projectRoot);

const assets = scanProjectAssets(projectRoot);
console.log(`Discovered ${assets.length} assets!`);

const manifestPath = join(projectRoot, 'assets', 'manifest.json');
writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, assets }, null, 2) + '\n', 'utf8');

console.log('Successfully written to:', manifestPath);

// Summary by category
const byCat = {};
for (const a of assets) {
  byCat[a.category] = (byCat[a.category] || 0) + 1;
}
console.log('Assets count by category:');
console.table(byCat);
