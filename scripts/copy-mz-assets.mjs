import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const srcBase = 'E:/Downloads/RPG-Maker-MZ-SteamRIP.com/RPG Maker MZ/newdata';
const destBase = resolve('project/my-rpg-game/assets');

if (!existsSync(destBase)) {
  mkdirSync(destBase, { recursive: true });
}

console.log('Target assets directory:', destBase);

const copyFolder = (srcDir, destDirName) => {
  if (existsSync(srcDir)) {
    const dest = join(destBase, destDirName);
    console.log(`Copying ${destDirName}...`);
    cpSync(srcDir, dest, { recursive: true });
  }
};

const imgDir = join(srcBase, 'img');
if (existsSync(imgDir)) {
  for (const ent of readdirSync(imgDir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      const src = join(imgDir, ent.name);
      const dest = join(destBase, ent.name);
      cpSync(src, dest, { recursive: true });
    }
  }
}

const audioDir = join(srcBase, 'audio');
if (existsSync(audioDir)) {
  for (const ent of readdirSync(audioDir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      const src = join(audioDir, ent.name);
      const dest = join(destBase, ent.name);
      cpSync(src, dest, { recursive: true });
    }
  }
}

copyFolder(join(srcBase, 'fonts'), 'fonts');
copyFolder(join(srcBase, 'effects'), 'effects');
copyFolder(join(srcBase, 'icon'), 'icon');

let count = 0;
function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && ent.name !== 'manifest.json' && ent.name !== 'manifest.tmp') count++;
  }
}
walk(destBase);
console.log(`Success! Total asset files copied: ${count}`);
