import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import {
  autotileMask,
  floodFillLayer,
  getAutotileQuadrants,
  getDefaultAutotileQuadrants,
  paintLayerCell,
  paintLayerRectangle,
  tileDefinition,
  TILE_CATALOG
} from '../.electron-dist/src/core/map-layers.js';

const fixture = resolve('fixtures/stage0-safe-project');

test('autotile pada tepian peta menjadi full tile seamless seperti RPG Maker MZ', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;
  const cells = width * height;

  // Isi seluruh layer 0 dengan tile air (Ocean Water = 4)
  const oceanTile = tileDefinition(4);
  assert.ok(oceanTile.autotile);
  const fullWaterData = new Array(cells).fill(4);

  // Periksa 4 sudut peta (0,0), (width-1, 0), (0, height-1), (width-1, height-1)
  const corners = [
    0, // top-left
    width - 1, // top-right
    (height - 1) * width, // bottom-left
    (height - 1) * width + (width - 1) // bottom-right
  ];

  for (const cornerIdx of corners) {
    const quads = getAutotileQuadrants(oceanTile, fullWaterData, cornerIdx, width, height);
    // Kuadran tengah seamless: q0=[2,4], q1=[1,4], q2=[2,3], q3=[1,3]
    // bx = 0, by = 144
    assert.equal(quads[0].srcX, 0 + 2 * 24); // 48
    assert.equal(quads[0].srcY, 144 + 4 * 24); // 240
    assert.equal(quads[1].srcX, 0 + 1 * 24); // 24
    assert.equal(quads[1].srcY, 144 + 4 * 24); // 240
    assert.equal(quads[2].srcX, 0 + 2 * 24); // 48
    assert.equal(quads[2].srcY, 144 + 3 * 24); // 216
    assert.equal(quads[3].srcX, 0 + 1 * 24); // 24
    assert.equal(quads[3].srcY, 144 + 3 * 24); // 216
  }

  // autotileMask pada peta penuh adalah 15 (semua arah seamless terhubung)
  assert.equal(autotileMask(fullWaterData, 0, width, height), 15);
  assert.equal(autotileMask(fullWaterData, width - 1, width, height), 15);
  assert.equal(autotileMask(fullWaterData, (height - 1) * width, width, height), 15);
});

test('shift mapping mengunci bentuk autotile dan menjaga bentuk tile sekitar', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;

  const grassTile = tileDefinition(20); // World Grass
  const waterTile = tileDefinition(4); // Ocean Water

  // Layer awal: 3x3 rumput di tengah (x=2..4, y=2..4)
  let layers = map.layers;
  layers = paintLayerRectangle(layers, 0, 2, 2, 4, 4, 20, width);

  // Titik tengah (3, 3) awalnya adalah seamless center grass
  const centerIdx = 3 * width + 3;
  const initialCenterQuads = getAutotileQuadrants(grassTile, layers[0].data, centerIdx, width, height);
  assert.equal(initialCenterQuads[0].srcX, (grassTile.autotileBaseX ?? 0) + 2 * 24);

  // Ambil bentuk isolated water untuk shift stamping
  const isolatedWaterQuads = getDefaultAutotileQuadrants(waterTile, 'isolated');

  // Pasang water dengan Shift Mapping di (3, 2) tepat di atas (3, 3)
  const targetIdx = 2 * width + 3;
  layers = paintLayerCell(
    layers,
    0,
    targetIdx,
    4,
    isolatedWaterQuads,
    true, // preserveNeighbors
    width,
    height,
    waterTile
  );

  // 1. Tile target (3, 2) harus memiliki bentuk locked isolatedWaterQuads
  assert.ok(layers[0].autotileShapes?.[targetIdx]);
  const renderedWaterQuads = getAutotileQuadrants(
    waterTile,
    layers[0].data,
    targetIdx,
    width,
    height,
    layers[0].autotileShapes?.[targetIdx]
  );
  assert.deepEqual(renderedWaterQuads, isolatedWaterQuads);

  // 2. Tile tetangga (3, 3) harus tetap mempertahankan bentuk awalnya tanpa teracak
  assert.ok(layers[0].autotileShapes?.[centerIdx]);
  const preservedCenterQuads = getAutotileQuadrants(
    grassTile,
    layers[0].data,
    centerIdx,
    width,
    height,
    layers[0].autotileShapes?.[centerIdx]
  );
  assert.deepEqual(preservedCenterQuads, initialCenterQuads);

  // 3. Jika tile target digambar ulang tanpa Shift, kunci bentuknya terhapus (kembali dinamis)
  layers = paintLayerCell(layers, 0, targetIdx, 20); // kembali jadi grass biasa
  assert.equal(layers[0].autotileShapes?.[targetIdx], undefined);
});

test('shift mapping pada rectangle dan flood fill menyimpan autotileShapes', () => {
  const bundle = loadProject(fixture);
  const map = bundle.maps['map.field'];
  const width = map.width;
  const height = map.height;
  const waterTile = tileDefinition(4);
  const centerWaterQuads = getDefaultAutotileQuadrants(waterTile, 'center');

  // Paint rectangle dengan overrideShape (Shift)
  const rectLayers = paintLayerRectangle(map.layers, 0, 1, 1, 3, 3, 4, width, centerWaterQuads);
  assert.ok(rectLayers[0].autotileShapes);
  assert.deepEqual(rectLayers[0].autotileShapes[1 * width + 1], centerWaterQuads);
  assert.deepEqual(rectLayers[0].autotileShapes[3 * width + 3], centerWaterQuads);

  // Flood fill dengan overrideShape (Shift)
  const fillLayers = floodFillLayer(map.layers, 0, 0, 4, width, height, centerWaterQuads);
  assert.ok(fillLayers[0].autotileShapes);
  assert.deepEqual(fillLayers[0].autotileShapes[0], centerWaterQuads);
});
