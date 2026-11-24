import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import {
  paintRegionCell,
  paintRegionRectangle,
  paintRegionCircle,
  floodFillRegion,
  shiftMapData,
  generateDungeonData,
  getRegionColor,
  getPaletteRegions,
  tileDefinition,
  getPaletteTiles,
  getDefaultAutotileQuadrants,
  getAutotileQuadrants
} from '../.electron-dist/src/core/map-layers.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = resolve('fixtures/stage0-safe-project');

test('paintRegionCell dan operasi Region memodifikasi matriks regions tanpa mengorbankan tile layer', () => {
  const width = 10;
  const height = 10;
  let regions = Array(width * height).fill(0);

  // 1. Paint cell
  regions = paintRegionCell(regions, 15, 3);
  assert.equal(regions[15], 3);
  assert.equal(regions[14], 0);

  // 2. Paint rectangle
  regions = paintRegionRectangle(regions, 2, 2, 4, 4, 7, width);
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) {
      assert.equal(regions[y * width + x], 7);
    }
  }

  // 3. Paint circle
  regions = paintRegionCircle(regions, 5, 5, 8, 8, 12, width);
  assert.equal(regions[6 * width + 6], 12);

  // 4. Flood fill
  regions = floodFillRegion(regions, 0, 5, width, height);
  assert.equal(regions[0], 5);
  assert.equal(regions[1], 5);
  assert.equal(regions[15], 3); // Titik cell yang sudah berbeda tidak tertimpa
  assert.equal(regions[2 * width + 2], 7); // Area rectangle tidak tertimpa
});

test('shiftMapData dan generateDungeonData mengelola regions secara sinkron', () => {
  const width = 5;
  const height = 5;
  const layers = [
    { id: 'layer.1', type: 'tile', name: 'L1', data: Array(25).fill(1) },
    { id: 'layer.2', type: 'tile', name: 'L2', data: Array(25).fill(0) },
    { id: 'layer.3', type: 'tile', name: 'L3', data: Array(25).fill(0) },
    { id: 'layer.4', type: 'tile', name: 'L4', data: Array(25).fill(0) }
  ];
  const collision = Array(25).fill(0);
  const regions = Array(25).fill(0);
  regions[0] = 9; // (0, 0) memiliki Region 9

  const shifted = shiftMapData(layers, collision, width, height, 1, 1, true, regions);
  assert.ok(shifted.regions);
  assert.equal(shifted.regions[1 * width + 1], 9); // bergeser ke (1, 1)

  const dungeon = generateDungeonData(10, 10);
  assert.equal(dungeon.regions.length, 100);
});

test('palette regions dan warna menghasilkan palet hingga 64+ region', () => {
  const palette = getPaletteRegions(64);
  assert.equal(palette.length, 65); // 0 (eraser) + 1..64
  assert.equal(palette[0].id, 0);
  assert.equal(palette[1].id, 1);
  assert.equal(palette[64].id, 64);
  assert.ok(getRegionColor(1).includes('239'));
  assert.ok(getRegionColor(50).includes('hsla'));
});

test('autotile Sheet A3 dan A4 terdefinisi dan termuat di Tab A pada Area Mode', () => {
  const dummyTileset = {
    id: 'ts.area',
    name: 'Area Test',
    mode: 1,
    tilesetNames: ['Outside_A1', 'Outside_A2', 'Outside_A3', 'Outside_A4', 'Outside_A5', 'Outside_B']
  };

  const a3Tile = tileDefinition(6000, dummyTileset);
  assert.equal(a3Tile.id, 6000);
  assert.equal(a3Tile.group, 'A');
  assert.equal(a3Tile.defaultLayer, 1);
  assert.ok(a3Tile.autotile);
  assert.ok(a3Tile.tileset?.includes('Outside_A3'));

  const a4Tile = tileDefinition(7000, dummyTileset);
  assert.equal(a4Tile.id, 7000);
  assert.equal(a4Tile.group, 'A');
  assert.equal(a4Tile.defaultLayer, 0);
  assert.ok(a4Tile.autotile);
  assert.ok(a4Tile.tileset?.includes('Outside_A4'));

  const paletteTiles = getPaletteTiles('A', dummyTileset);
  assert.ok(paletteTiles.some(t => t.id === 6000));
  assert.ok(paletteTiles.some(t => t.id === 7000));

  const centerQuads = getDefaultAutotileQuadrants(a3Tile, 'center');
  assert.equal(centerQuads.length, 4);
});

test('validateBundle menormalisasi dan memvalidasi map.regions serta field properti peta baru', () => {
  const bundle = loadProject(fixture);
  const validated = validateBundle(bundle);
  assert.ok(Array.isArray(validated.maps['map.intro'].regions));
  assert.equal(validated.maps['map.intro'].regions.length, validated.maps['map.intro'].width * validated.maps['map.intro'].height);

  // Coba tambahkan properti baru valid
  const testBundle = structuredClone(bundle);
  testBundle.maps['map.intro'].displayName = 'Intro Valley';
  testBundle.maps['map.intro'].disableDash = true;
  testBundle.maps['map.intro'].encounterStep = 25;
  testBundle.maps['map.intro'].note = 'Map note test';

  const revalidated = validateBundle(testBundle);
  assert.equal(revalidated.maps['map.intro'].displayName, 'Intro Valley');
  assert.equal(revalidated.maps['map.intro'].disableDash, true);
  assert.equal(revalidated.maps['map.intro'].encounterStep, 25);
  assert.equal(revalidated.maps['map.intro'].note, 'Map note test');
});
