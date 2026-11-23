import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const projectRoot = resolve('project/my-rpg-game');
console.log('Painting maps in:', projectRoot);

// map.intro.json (9x6)
const introPath = join(projectRoot, 'maps', 'map.intro.json');
const intro = JSON.parse(readFileSync(introPath, 'utf8'));
const w = intro.width, h = intro.height, cells = w * h;

// L0: Floor & Walls
const introL0 = Array(cells).fill(1); // Default Grass (Tile ID 1)
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = y * w + x;
    if (intro.collision[idx] === 1) {
      introL0[idx] = 6; // Wall (Outside_A2.png)
    } else if (y === 2) {
      introL0[idx] = 3; // Stone Floor path down the middle
    }
  }
}

// L1: Flowers & Bush
const introL1 = Array(cells).fill(0);
introL1[1 * w + 2] = 7; // Flowers
introL1[1 * w + 4] = 7; // Flowers
introL1[1 * w + 6] = 7; // Flowers
introL1[3 * w + 2] = 8; // Bush
introL1[3 * w + 6] = 8; // Bush

// L2: Rock, Crate, Sign
const introL2 = Array(cells).fill(0);
introL2[1 * w + 1] = 10; // Rock
introL2[3 * w + 1] = 12; // Crate
introL2[1 * w + 7] = 11; // Sign

// L3: Torch
const introL3 = Array(cells).fill(0);
introL3[1 * w + 5] = 15; // Torch near the gate

intro.layers = [
  { id: 'layer.ground', type: 'tile', name: 'Ground Layer', data: introL0 },
  { id: 'layer.decor', type: 'tile', name: 'Decoration Layer', data: introL1 },
  { id: 'layer.objects', type: 'tile', name: 'Objects Layer', data: introL2 },
  { id: 'layer.upper', type: 'tile', name: 'Upper Layer', data: introL3 }
];
writeFileSync(introPath, JSON.stringify(intro, null, 2) + '\n', 'utf8');
console.log('Painted map.intro.json with real Grass, Walls, Stone Floor, Flowers, Bush, Torches!');

// map.field.json (7x5)
const fieldPath = join(projectRoot, 'maps', 'map.field.json');
const field = JSON.parse(readFileSync(fieldPath, 'utf8'));
const fw = field.width, fh = field.height, fcells = fw * fh;

const fieldL0 = Array(fcells).fill(1); // Grass
for (let y = 0; y < fh; y++) {
  for (let x = 0; x < fw; x++) {
    const idx = y * fw + x;
    if (field.collision[idx] === 1) fieldL0[idx] = 9; // Tree boundary
    else if (x === 3 || y === 2) fieldL0[idx] = 2; // Dry Ground path
  }
}
const fieldL1 = Array(fcells).fill(0);
fieldL1[1 * fw + 1] = 7; // Flowers
fieldL1[3 * fw + 5] = 8; // Bush

field.layers = [
  { id: 'layer.ground', type: 'tile', name: 'Ground Layer', data: fieldL0 },
  { id: 'layer.decor', type: 'tile', name: 'Decoration Layer', data: fieldL1 },
  { id: 'layer.objects', type: 'tile', name: 'Objects Layer', data: Array(fcells).fill(0) },
  { id: 'layer.upper', type: 'tile', name: 'Upper Layer', data: Array(fcells).fill(0) }
];
writeFileSync(fieldPath, JSON.stringify(field, null, 2) + '\n', 'utf8');
console.log('Painted map.field.json with Grass, Trees, Dry Ground paths, Flowers!');

// map.village.json (9x6)
const villagePath = join(projectRoot, 'maps', 'map.village.json');
const village = JSON.parse(readFileSync(villagePath, 'utf8'));
const vw = village.width, vh = village.height, vcells = vw * vh;

const villageL0 = Array(vcells).fill(1); // Grass
for (let y = 0; y < vh; y++) {
  for (let x = 0; x < vw; x++) {
    const idx = y * vw + x;
    if (village.collision[idx] === 1) villageL0[idx] = 6; // Wall
    else if (y >= 2 && y <= 4 && x >= 2 && x <= 6) villageL0[idx] = 3; // Cobblestone town square
  }
}
const villageL1 = Array(vcells).fill(0);
villageL1[2 * vw + 2] = 7;
villageL1[4 * vw + 6] = 8;

const villageL2 = Array(vcells).fill(0);
villageL2[1 * vw + 4] = 12; // Crate

village.layers = [
  { id: 'layer.ground', type: 'tile', name: 'Ground Layer', data: villageL0 },
  { id: 'layer.decor', type: 'tile', name: 'Decoration Layer', data: villageL1 },
  { id: 'layer.objects', type: 'tile', name: 'Objects Layer', data: villageL2 },
  { id: 'layer.upper', type: 'tile', name: 'Upper Layer', data: Array(vcells).fill(0) }
];
writeFileSync(villagePath, JSON.stringify(village, null, 2) + '\n', 'utf8');
console.log('Painted map.village.json with Cobblestone square, Walls, Grass, Crates!');

// map.ruins.json (7x5)
const ruinsPath = join(projectRoot, 'maps', 'map.ruins.json');
const ruins = JSON.parse(readFileSync(ruinsPath, 'utf8'));
const rw = ruins.width, rh = ruins.height, rcells = rw * rh;

const ruinsL0 = Array(rcells).fill(3); // Stone Floor
for (let y = 0; y < rh; y++) {
  for (let x = 0; x < rw; x++) {
    const idx = y * rw + x;
    if (ruins.collision[idx] === 1) ruinsL0[idx] = 6; // Ruins Wall
    else if ((x + y) % 3 === 0) ruinsL0[idx] = 2; // Broken Dry Ground
  }
}
const ruinsL2 = Array(rcells).fill(0);
ruinsL2[1 * rw + 1] = 10; // Rock
ruinsL2[3 * rw + 4] = 10; // Rock

ruins.layers = [
  { id: 'layer.ground', type: 'tile', name: 'Ground Layer', data: ruinsL0 },
  { id: 'layer.decor', type: 'tile', name: 'Decoration Layer', data: Array(rcells).fill(0) },
  { id: 'layer.objects', type: 'tile', name: 'Objects Layer', data: ruinsL2 },
  { id: 'layer.upper', type: 'tile', name: 'Upper Layer', data: Array(rcells).fill(0) }
];
writeFileSync(ruinsPath, JSON.stringify(ruins, null, 2) + '\n', 'utf8');
console.log('Painted map.ruins.json with Stone Floor, Ruins Walls, Rocks!');
