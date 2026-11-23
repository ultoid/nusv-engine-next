import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadProject } from '../.electron-dist/electron/project-service.js';
import {
  getTileFlag,
  getHighestTileFlagAt,
  isLadderTile,
  isBushTile,
  isCounterTile,
  isDamageFloorTile,
  terrainTag
} from '../.electron-dist/src/core/map-layers.js';
import { canPass, interactiveEventAt, move, initialProgress } from '../.electron-dist/src/core/world.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'stage0-safe-project');

test('getTileFlag resolves standard RPG Maker MZ bitmasks', () => {
  const dummyTileset = {
    id: 'ts1',
    name: 'Test Tileset',
    mode: 1,
    tilesetNames: ['', 'Outside_A2', '', '', 'Outside_A5', 'Outside_B', 'Outside_C'],
    flags: [
      0x00, // 0: Passable
      0x0f, // 1: Impassable
      0x10, // 2: Star (Roof)
      0x20, // 3: Ladder
      0x40, // 4: Bush
      0x80, // 5: Counter
      0x100, // 6: Damage floor
      (3 << 12) // 7: Terrain tag 3
    ]
  };

  assert.equal(getTileFlag(2000, dummyTileset), 0x10); // Tile 0 of sheet B is star by default
  assert.equal(getTileFlag(2001, dummyTileset), 0x0f); // Tile 1 of sheet B
  assert.equal(getTileFlag(2003, dummyTileset), 0x20); // Ladder
  assert.equal(getTileFlag(2004, dummyTileset), 0x40); // Bush
  assert.equal(getTileFlag(2005, dummyTileset), 0x80); // Counter
  assert.equal(getTileFlag(2006, dummyTileset), 0x100); // Damage
  assert.equal(getTileFlag(2007, dummyTileset) >> 12, 3); // Terrain tag
});

test('canPass handles 4-directional passage and star roof tiles', () => {
  const bundle = loadProject(fixture);
  const mapId = 'map.intro';
  const state = initialProgress(bundle);
  state.mapId = mapId;
  state.x = 2;
  state.y = 2;

  const map = bundle.maps[mapId];
  // Setup a custom tileset with directional flags
  const tilesetId = 'custom.ts';
  const customTileset = {
    id: tilesetId,
    name: 'Custom Passage TS',
    mode: 1,
    tilesetNames: ['', '', '', '', '', 'Outside_B'],
    flags: new Array(500).fill(0x00)
  };
  bundle.game.tilesets = [customTileset];
  map.tilesetId = tilesetId;

  // Tile 2010: Impassable DOWN (0x01)
  // Tile 2011: Impassable UP (0x08)
  // Tile 2012: Impassable ALL (0x0f)
  // Tile 2013: Star roof (0x10)
  customTileset.flags[10] = 0x01; // down blocked
  customTileset.flags[11] = 0x08; // up blocked
  customTileset.flags[12] = 0x0f; // completely blocked
  customTileset.flags[13] = 0x10; // star

  // Layer 0: normal ground passable (tile 2001 -> flag 0)
  map.layers[0].data[2 * map.width + 2] = 2001; // (2, 2)
  map.layers[0].data[3 * map.width + 2] = 2001; // (2, 3)
  map.layers[0].data[2 * map.width + 3] = 2001; // (3, 2)

  // 1. Moving from (2, 2) to (2, 3) DOWN with normal tiles -> can pass
  assert.equal(canPass(bundle, state, 2, 2, 'down'), true);

  // 2. Put tile with 0x01 (blocked DOWN) at (2, 2)
  map.layers[0].data[2 * map.width + 2] = 2010;
  assert.equal(canPass(bundle, state, 2, 2, 'down'), false);

  // 3. Reset (2, 2), and put tile with 0x08 (blocked UP) at (2, 3) -> entering from above is blocked
  map.layers[0].data[2 * map.width + 2] = 2001;
  map.layers[0].data[3 * map.width + 2] = 2011;
  assert.equal(canPass(bundle, state, 2, 2, 'down'), false);

  // 4. Put Star tile on upper layer (layer 1) at (2, 3) while layer 0 is passable
  map.layers[0].data[3 * map.width + 2] = 2001; // ground passable
  map.layers[1].data[3 * map.width + 2] = 2013; // roof overhead (star 0x10)
  assert.equal(canPass(bundle, state, 2, 2, 'down'), true); // Can walk under roof
});

test('move onto Ladder tile forces player facing to UP', () => {
  const bundle = loadProject(fixture);
  const mapId = 'map.intro';
  const state = initialProgress(bundle);
  state.mapId = mapId;
  state.x = 2;
  state.y = 2;
  state.facing = 'down';

  const map = bundle.maps[mapId];
  const customTileset = {
    id: 'ladder.ts',
    name: 'Ladder TS',
    mode: 1,
    tilesetNames: ['', '', '', '', '', 'Outside_B'],
    flags: new Array(100).fill(0x00)
  };
  bundle.game.tilesets = [customTileset];
  map.tilesetId = 'ladder.ts';

  // Tile 2002: Ladder (0x20)
  customTileset.flags[2] = 0x20;
  map.layers[0].data[3 * map.width + 2] = 2002; // (2, 3) is a ladder

  const moved = move(bundle, state, 'down');
  assert.equal(moved.x, 2);
  assert.equal(moved.y, 3);
  assert.equal(moved.facing, 'up'); // Always face UP on ladder!
});

test('move onto Damage Floor tile inflicts 10 HP floor damage without dropping below 1 HP', () => {
  const bundle = loadProject(fixture);
  const mapId = 'map.intro';
  const state = initialProgress(bundle);
  state.mapId = mapId;
  state.x = 2;
  state.y = 2;

  const actorId = state.formation[0];
  state.actorResources[actorId] = { hp: 15, mp: 10, tp: 0 };

  const map = bundle.maps[mapId];
  const customTileset = {
    id: 'dmg.ts',
    name: 'Damage TS',
    mode: 1,
    tilesetNames: ['', '', '', '', '', 'Outside_B'],
    flags: new Array(100).fill(0x00)
  };
  bundle.game.tilesets = [customTileset];
  map.tilesetId = 'dmg.ts';

  // Tile 2003: Damage floor (0x100)
  customTileset.flags[3] = 0x100;
  map.layers[0].data[3 * map.width + 2] = 2003; // (2, 3) is damage floor

  // First step: 15 HP -> 15 - 10 = 5 HP
  const step1 = move(bundle, state, 'down');
  assert.equal(step1.actorResources[actorId].hp, 5);

  // Second step: 5 HP -> floored at 1 HP (does not drop to 0 or negative)
  map.layers[0].data[4 * map.width + 2] = 2003; // (2, 4) is damage floor
  const step2 = move(bundle, step1, 'down');
  assert.equal(step2.actorResources[actorId].hp, 1);
});

test('interactiveEventAt reaches across Counter tables (0x80)', () => {
  const bundle = loadProject(fixture);
  const mapId = 'map.intro';
  const state = initialProgress(bundle);
  state.mapId = mapId;
  state.x = 2;
  state.y = 1;
  state.facing = 'down';

  const map = bundle.maps[mapId];
  const customTileset = {
    id: 'counter.ts',
    name: 'Counter TS',
    mode: 1,
    tilesetNames: ['', '', '', '', '', 'Outside_B'],
    flags: new Array(100).fill(0x00)
  };
  bundle.game.tilesets = [customTileset];
  map.tilesetId = 'counter.ts';

  // (2, 2) is a Counter table (0x80 | 0x0f)
  customTileset.flags[4] = 0x80 | 0x0f;
  map.layers[0].data[2 * map.width + 2] = 2004;

  // NPC Event is placed at (2, 3), behind the counter
  const npcEvent = {
    id: 'shopkeeper',
    x: 2,
    y: 3,
    trigger: 'interact',
    pages: [{ conditions: {}, commands: [{ type: 'text', text: 'Welcome!' }], graphic: 'Actor1' }]
  };
  map.events = [npcEvent];

  // Player at (2, 1) facing down toward Counter at (2, 2) can interact with NPC at (2, 3)
  const targetEvent = interactiveEventAt(bundle, state);
  assert.ok(targetEvent);
  assert.equal(targetEvent.id, 'shopkeeper');

  // If tile at (2, 2) is NOT a counter table, interaction does not reach beyond
  customTileset.flags[4] = 0x0f; // Impassable wall, not counter
  const blockedEvent = interactiveEventAt(bundle, state);
  assert.equal(blockedEvent, null);
});

test('terrainTag retrieves tag 0..7 accurately', () => {
  const bundle = loadProject(fixture);
  const mapId = 'map.intro';
  const map = bundle.maps[mapId];

  const customTileset = {
    id: 'terrain.ts',
    name: 'Terrain TS',
    mode: 1,
    tilesetNames: ['', '', '', '', '', 'Outside_B'],
    flags: new Array(100).fill(0x00)
  };
  bundle.game.tilesets = [customTileset];
  map.tilesetId = 'terrain.ts';

  // Tile with terrain tag 5: (5 << 12)
  customTileset.flags[5] = (5 << 12);
  map.layers[0].data[1 * map.width + 1] = 2005;

  assert.equal(terrainTag(bundle, mapId, 1, 1), 5);
});

test('getPaletteTiles and tileDefinition support Sheet E and custom tileset names', async () => {
  const { getPaletteTiles, tileDefinition, resolveSheetPath } = await import('../.electron-dist/src/core/map-layers.js');
  const { addAssetToBundle } = await import('../.electron-dist/src/core/resource-manager.js');

  const customTileset = {
    id: 'ts.custom',
    name: 'Custom World TS',
    mode: 1,
    tilesetNames: ['Outside_A1', 'Outside_A2', '', '', 'Outside_A5', 'My_Custom_B', 'My_Custom_C', 'My_Custom_D', 'My_Custom_E']
  };

  // Test getPaletteTiles for Sheet E
  const eTiles = getPaletteTiles('E', customTileset);
  assert.equal(eTiles.length, 256);
  assert.equal(eTiles[0].id, 5000);
  assert.equal(eTiles[255].id, 5255);
  assert.equal(eTiles[0].tileset, resolveSheetPath('My_Custom_E'));

  // Test tileDefinition for Sheet E tile ID 5010
  const defE = tileDefinition(5010, customTileset);
  assert.equal(defE.id, 5010);
  assert.equal(defE.tileset, resolveSheetPath('My_Custom_E'));

  // Test tileDefinition for custom Sheet B tile ID 2005
  const defB = tileDefinition(2005, customTileset);
  assert.equal(defB.id, 2005);
  assert.equal(defB.tileset, resolveSheetPath('My_Custom_B'));

  // Test addAssetToBundle with newly imported tileset
  const bundle = loadProject(fixture);
  const newAssetEntry = {
    id: 'asset.tilesets.my-custom-e',
    type: 'image',
    path: 'assets/tilesets/My_Custom_E.png',
    category: 'tilesets',
    size: 54321
  };
  const updatedBundle = addAssetToBundle(bundle, newAssetEntry);
  assert.ok(updatedBundle.assets?.assets.some(a => a.path === 'assets/tilesets/My_Custom_E.png'));
});
