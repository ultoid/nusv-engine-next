import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import {
  layerForTile,
  paintLayerBlock,
  paintLayerBlockRectangle,
  tileDefinition
} from '../.electron-dist/src/core/map-layers.js';

const fixture = resolve('fixtures/stage0-safe-project');

test('paintLayerBlock menempatkan blok multi-tile (2x2) pada koordinat yang ditentukan', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  // Blok 2x2:
  // [101, 102]
  // [103, 104]
  const block = {
    width: 2,
    height: 2,
    tiles: [
      [101, 102],
      [103, 104]
    ]
  };

  const startX = 2;
  const startY = 1;
  const targetLayer = 0;

  const nextLayers = paintLayerBlock(
    map.layers,
    targetLayer,
    startX,
    startY,
    block,
    width,
    height
  );

  assert.equal(nextLayers[0].data[startY * width + startX], 101);
  assert.equal(nextLayers[0].data[startY * width + (startX + 1)], 102);
  assert.equal(nextLayers[0].data[(startY + 1) * width + startX], 103);
  assert.equal(nextLayers[0].data[(startY + 1) * width + (startX + 1)], 104);

  // Titik lain tidak boleh berubah
  assert.equal(nextLayers[0].data[(startY - 1) * width + startX], map.layers[0].data[(startY - 1) * width + startX]);
});

test('paintLayerBlock dengan mode auto mendistribusikan tiap tile ke defaultLayer masing-masing', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  // Buat blok gabungan:
  // Tile 1 (Ground/Grass -> defaultLayer 0)
  // Tile 9 (Sign / Deco -> defaultLayer 2)
  const tileA = 1;
  const tileB = 9;
  const defA = tileDefinition(tileA);
  const defB = tileDefinition(tileB);

  assert.equal(defA.defaultLayer, 0);
  assert.equal(defB.defaultLayer, 2);

  const block = {
    width: 2,
    height: 1,
    tiles: [[tileA, tileB]]
  };

  const startX = 2;
  const startY = 2;

  const nextLayers = paintLayerBlock(
    map.layers,
    'auto',
    startX,
    startY,
    block,
    width,
    height
  );

  // tileA harus masuk ke layer 0
  assert.equal(nextLayers[0].data[startY * width + startX], tileA);
  // tileB harus masuk ke layer 2
  assert.equal(nextLayers[2].data[startY * width + (startX + 1)], tileB);
});

test('paintLayerBlock dengan mode manual menempatkan seluruh tile ke layer terpilih', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  const block = {
    width: 2,
    height: 1,
    tiles: [[1, 9]]
  };

  const startX = 2;
  const startY = 2;
  const manualLayer = 1; // Paksa Layer 2 (index 1)

  const nextLayers = paintLayerBlock(
    map.layers,
    manualLayer,
    startX,
    startY,
    block,
    width,
    height
  );

  assert.equal(nextLayers[1].data[startY * width + startX], 1);
  assert.equal(nextLayers[1].data[startY * width + (startX + 1)], 9);
});

test('paintLayerBlock memotong (clip) koordinat out-of-bounds dengan aman di tepi peta', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  const block = {
    width: 2,
    height: 2,
    tiles: [
      [99, 98],
      [97, 96]
    ]
  };

  // Tempel di pojok kanan-bawah peta (width - 1, height - 1)
  // Hanya (width - 1, height - 1) yang sah, 3 sel lainnya di luar batas
  const startX = width - 1;
  const startY = height - 1;

  assert.doesNotThrow(() => {
    const nextLayers = paintLayerBlock(
      map.layers,
      0,
      startX,
      startY,
      block,
      width,
      height
    );

    assert.equal(nextLayers[0].data[startY * width + startX], 99);
  });
});

test('paintLayerBlock menghormati lockedLayers dan melewati layer yang terkunci', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  const block = {
    width: 1,
    height: 2,
    tiles: [
      [1],  // layer 0
      [9]   // layer 2
    ]
  };

  const startX = 1;
  const startY = 1;
  const locked = [true, false, false, false]; // Layer 0 terkunci

  const nextLayers = paintLayerBlock(
    map.layers,
    'auto',
    startX,
    startY,
    block,
    width,
    height,
    undefined,
    locked
  );

  // Layer 0 tidak boleh berubah karena locked
  assert.equal(nextLayers[0].data[startY * width + startX], map.layers[0].data[startY * width + startX]);
  // Layer 2 harus berubah
  assert.equal(nextLayers[2].data[(startY + 1) * width + startX], 9);
});

test('paintLayerBlockRectangle mengulang pola blok multi-tile (tiling pattern) di seluruh area rectangle', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  // Pola 2x2:
  // [11, 12]
  // [13, 14]
  const block = {
    width: 2,
    height: 2,
    tiles: [
      [11, 12],
      [13, 14]
    ]
  };

  // Rectangle ukuran 4x3 dari (1, 1) ke (4, 3)
  const nextLayers = paintLayerBlockRectangle(
    map.layers,
    0,
    1,
    1,
    4,
    3,
    block,
    width,
    height
  );

  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      const expectedTile = block.tiles[dy % 2][dx % 2];
      const actualTile = nextLayers[0].data[(1 + dy) * width + (1 + dx)];
      assert.equal(actualTile, expectedTile, `Mismatch pada offset (${dx}, ${dy})`);
    }
  }
});
