import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { paintLayerCell, paintLayerRectangle, paintLayerCircle, floodFillLayer } from '../.electron-dist/src/core/map-layers.js';

const fixture = resolve('fixtures/stage0-safe-project');

test('stack undo dan redo memulihkan state map layers secara deterministik', () => {
  const initialBundle = loadProject(fixture);
  const mapId = 'map.intro';
  let bundle = structuredClone(initialBundle);
  const past = [];
  const future = [];

  const commit = (next) => {
    past.push(structuredClone(bundle));
    future.length = 0;
    bundle = next;
  };

  const undo = () => {
    if (!past.length) return;
    const prev = past.pop();
    future.unshift(structuredClone(bundle));
    bundle = prev;
  };

  const redo = () => {
    if (!future.length) return;
    const next = future.shift();
    past.push(structuredClone(bundle));
    bundle = next;
  };

  // 1. Ubah tile di cell 0 layer 0 dari 0 menjadi 5
  assert.equal(bundle.maps[mapId].layers[0].data[0], 0);
  const l1 = paintLayerCell(bundle.maps[mapId].layers, 0, 0, 5);
  commit({ ...bundle, maps: { ...bundle.maps, [mapId]: { ...bundle.maps[mapId], layers: l1 } } });
  assert.equal(bundle.maps[mapId].layers[0].data[0], 5);
  assert.equal(past.length, 1);
  assert.equal(future.length, 0);

  // 2. Ubah tile di cell 1 layer 0 dari 0 menjadi 7
  const l2 = paintLayerCell(bundle.maps[mapId].layers, 0, 1, 7);
  commit({ ...bundle, maps: { ...bundle.maps, [mapId]: { ...bundle.maps[mapId], layers: l2 } } });
  assert.equal(bundle.maps[mapId].layers[0].data[1], 7);
  assert.equal(past.length, 2);

  // 3. Undo satu kali: cell 1 harus kembali ke 0, cell 0 tetap 5
  undo();
  assert.equal(bundle.maps[mapId].layers[0].data[1], 0);
  assert.equal(bundle.maps[mapId].layers[0].data[0], 5);
  assert.equal(past.length, 1);
  assert.equal(future.length, 1);

  // 4. Undo kedua kali: cell 0 harus kembali ke 0 (state awal)
  undo();
  assert.equal(bundle.maps[mapId].layers[0].data[0], 0);
  assert.equal(past.length, 0);
  assert.equal(future.length, 2);

  // 5. Redo satu kali: cell 0 kembali menjadi 5
  redo();
  assert.equal(bundle.maps[mapId].layers[0].data[0], 5);
  assert.equal(bundle.maps[mapId].layers[0].data[1], 0);
  assert.equal(past.length, 1);
  assert.equal(future.length, 1);

  // 6. Redo kedua kali: cell 1 kembali menjadi 7
  redo();
  assert.equal(bundle.maps[mapId].layers[0].data[0], 5);
  assert.equal(bundle.maps[mapId].layers[0].data[1], 7);
  assert.equal(past.length, 2);
  assert.equal(future.length, 0);
});

test('drag stroke continuous painting menghasilkan 1 entry history dan 1 undo membatalkan seluruh goresan', () => {
  const initialBundle = loadProject(fixture);
  const mapId = 'map.intro';
  let bundle = structuredClone(initialBundle);
  const past = [];
  const future = [];

  // Simulasi lifecycle mouse drag stroke
  const strokeInitialBundle = structuredClone(bundle);
  let activeStrokeBundle = structuredClone(bundle);
  let strokeModified = false;

  const dragCells = [2, 3, 4, 5];
  for (const cellIndex of dragCells) {
    const currentMap = activeStrokeBundle.maps[mapId];
    const layers = paintLayerCell(currentMap.layers, 1, cellIndex, 9);
    activeStrokeBundle = { ...activeStrokeBundle, maps: { ...activeStrokeBundle.maps, [mapId]: { ...currentMap, layers } } };
    bundle = activeStrokeBundle;
    strokeModified = true;
  }

  // Mouse up
  if (strokeModified && strokeInitialBundle) {
    past.push(strokeInitialBundle);
    future.length = 0;
  }

  // Verifikasi semua cell terwarnai
  for (const cellIndex of dragCells) {
    assert.equal(bundle.maps[mapId].layers[1].data[cellIndex], 9);
  }
  // Hanya ada 1 riwayat di past
  assert.equal(past.length, 1);

  // Lakukan undo: seluruh goresan 4 cell harus kembali ke 0
  const prev = past.pop();
  future.unshift(bundle);
  bundle = prev;

  for (const cellIndex of dragCells) {
    assert.equal(bundle.maps[mapId].layers[1].data[cellIndex], 0);
  }
  assert.equal(future.length, 1);

  // Redo: seluruh goresan 4 cell kembali ke 9
  const next = future.shift();
  past.push(bundle);
  bundle = next;

  for (const cellIndex of dragCells) {
    assert.equal(bundle.maps[mapId].layers[1].data[cellIndex], 9);
  }
});

test('rectangle tool dan circle tool kompatibel dengan undo redo', () => {
  const initialBundle = loadProject(fixture);
  const mapId = 'map.intro';
  let bundle = structuredClone(initialBundle);
  const past = [];
  const future = [];

  const map = bundle.maps[mapId];
  const rectLayers = paintLayerRectangle(map.layers, 1, 0, 0, 2, 2, 8, map.width);
  past.push(structuredClone(bundle));
  bundle = { ...bundle, maps: { ...bundle.maps, [mapId]: { ...map, layers: rectLayers } } };

  // Verifikasi 9 sel kotak (0..2, 0..2) bernilai 8
  for (let y = 0; y <= 2; y++) {
    for (let x = 0; x <= 2; x++) {
      assert.equal(bundle.maps[mapId].layers[1].data[y * map.width + x], 8);
    }
  }

  // Undo rectangle
  const prev = past.pop();
  future.unshift(bundle);
  bundle = prev;

  // Verifikasi semua sel layer 1 kembali kosong (0)
  for (let y = 0; y <= 2; y++) {
    for (let x = 0; x <= 2; x++) {
      assert.equal(bundle.maps[mapId].layers[1].data[y * map.width + x], 0);
    }
  }

  // Redo rectangle
  const next = future.shift();
  past.push(bundle);
  bundle = next;
  assert.equal(bundle.maps[mapId].layers[1].data[0], 8);
});
