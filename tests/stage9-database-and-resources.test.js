import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { loadProject } from '../.electron-dist/electron/project-service.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';
import {
  inferAssetCategory,
  auditProjectResources,
  filterAssets,
  addAssetToBundle,
  removeAssetFromBundle,
  cleanUnusedAssetsFromBundle
} from '../.electron-dist/src/core/resource-manager.js';
import {
  importAssetFile,
  exportAssetFile,
  deleteAssetFile,
  scanProjectAssets
} from '../.electron-dist/electron/asset-service.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'stage0-safe-project');

test('inferAssetCategory mengklasifikasikan path aset sesuai standar RPG Maker', () => {
  assert.equal(inferAssetCategory('assets/characters/hero.png'), 'characters');
  assert.equal(inferAssetCategory('assets/faces/actor1.png'), 'faces');
  assert.equal(inferAssetCategory('assets/tilesets/world.png'), 'tilesets');
  assert.equal(inferAssetCategory('assets/pictures/cutscene01.jpg'), 'pictures');
  assert.equal(inferAssetCategory('assets/enemies/dragon.png'), 'enemies');
  assert.equal(inferAssetCategory('assets/system/Window.png'), 'system');
  assert.equal(inferAssetCategory('assets/audio/bgm/field.ogg'), 'bgm');
  assert.equal(inferAssetCategory('assets/audio/bgs/river.ogg'), 'bgs');
  assert.equal(inferAssetCategory('assets/audio/me/victory.ogg'), 'me');
  assert.equal(inferAssetCategory('assets/audio/se/slash.wav'), 'se');
  assert.equal(inferAssetCategory('assets/fonts/gamefont.woff2'), 'fonts');
  assert.equal(inferAssetCategory('assets/misc/data.bin'), 'other');
});

test('auditProjectResources mendeteksi aset in-use dan unused secara akurat', () => {
  const bundle = loadProject(fixture);

  // Tambahkan beberapa aset uji ke bundle
  bundle.assets.assets = [
    { id: 'asset.bgm.field', type: 'audio', path: 'assets/audio/bgm/field.ogg', category: 'bgm' },
    { id: 'asset.img.hero-face', type: 'image', path: 'assets/faces/hero-face.png', category: 'faces' },
    { id: 'asset.img.unused-tree', type: 'image', path: 'assets/pictures/unused-tree.png', category: 'pictures' }
  ];

  // Rujuk satu aset di actor dan satu aset di map
  bundle.game.actors[0].faceImage = 'assets/faces/hero-face.png';
  bundle.maps[bundle.project.start.mapId].bgm = 'assets/audio/bgm/field.ogg';

  const audit = auditProjectResources(bundle);
  assert.equal(audit.totalAssets, 3);
  assert.equal(audit.inUseCount, 2);
  assert.equal(audit.unusedCount, 1);

  assert.equal(audit.usageReports['asset.img.hero-face']?.inUse, true);
  assert.ok(audit.usageReports['asset.img.hero-face']?.references[0].includes('Actor'));

  assert.equal(audit.usageReports['asset.bgm.field']?.inUse, true);
  assert.ok(audit.usageReports['asset.bgm.field']?.references[0].includes('Map'));

  assert.equal(audit.usageReports['asset.img.unused-tree']?.inUse, false);
  assert.equal(audit.usageReports['asset.img.unused-tree']?.references.length, 0);
});

test('filterAssets menyaring aset berdasarkan kategori, status, dan query pencarian', () => {
  const assets = [
    { id: 'hero-sprite', type: 'image', path: 'assets/characters/hero.png', category: 'characters' },
    { id: 'villager-sprite', type: 'image', path: 'assets/characters/villager.png', category: 'characters' },
    { id: 'field-bgm', type: 'audio', path: 'assets/bgm/field.ogg', category: 'bgm' }
  ];

  const usageReports = {
    'hero-sprite': { assetId: 'hero-sprite', inUse: true, references: ['Actor 1'] },
    'villager-sprite': { assetId: 'villager-sprite', inUse: false, references: [] },
    'field-bgm': { assetId: 'field-bgm', inUse: true, references: ['Map Field'] }
  };

  const onlyCharacters = filterAssets(assets, { category: 'characters' });
  assert.equal(onlyCharacters.length, 2);

  const onlyInUse = filterAssets(assets, { status: 'in-use', usageReports });
  assert.equal(onlyInUse.length, 2);
  assert.ok(onlyInUse.some(a => a.id === 'hero-sprite'));
  assert.ok(onlyInUse.some(a => a.id === 'field-bgm'));

  const onlyUnused = filterAssets(assets, { status: 'unused', usageReports });
  assert.equal(onlyUnused.length, 1);
  assert.equal(onlyUnused[0].id, 'villager-sprite');

  const searchMatch = filterAssets(assets, { query: 'villager' });
  assert.equal(searchMatch.length, 1);
  assert.equal(searchMatch[0].id, 'villager-sprite');
});

test('addAssetToBundle, removeAssetFromBundle, dan cleanUnusedAssetsFromBundle mengelola aset secara deterministik', () => {
  const bundle = loadProject(fixture);
  bundle.assets.assets = [];

  const entry1 = { id: 'danger', type: 'audio', path: 'assets/bgm/danger.ogg', category: 'bgm' };
  const entry2 = { id: 'asset.img.unused', type: 'image', path: 'assets/pictures/unused.png', category: 'pictures' };

  const with1 = addAssetToBundle(bundle, entry1);
  assert.equal(with1.assets.assets.length, 1);
  assert.equal(with1.assets.assets[0].id, 'danger');

  const with2 = addAssetToBundle(with1, entry2);
  assert.equal(with2.assets.assets.length, 2);

  // Buat entry1 digunakan di event
  const map = with2.maps[with2.project.start.mapId];
  map.events[0].pages[0].commands.push({ type: 'music', mood: 'danger' });

  const cleaned = cleanUnusedAssetsFromBundle(with2);
  assert.equal(cleaned.removedCount, 1);
  assert.equal(cleaned.nextBundle.assets.assets.length, 1);
  assert.equal(cleaned.nextBundle.assets.assets[0].id, 'danger');

  const removed = removeAssetFromBundle(with2, 'danger');
  assert.equal(removed.assets.assets.length, 1);
  assert.equal(removed.assets.assets[0].id, 'asset.img.unused');
});

test('Electron asset-service mengimpor, mengekspor, mendeteksi, dan menghapus berkas aset secara aman', () => {
  const tempProject = mkdtempSync(join(tmpdir(), 'nusv-test-asset-service-'));
  const tempExternal = mkdtempSync(join(tmpdir(), 'nusv-test-ext-'));

  try {
    // Siapkan file sumber luar
    const dummySource = join(tempExternal, 'my-sound_effect.wav');
    writeFileSync(dummySource, 'RIFFdummywavecontent');

    // Impor berkas ke project
    const imported = importAssetFile(tempProject, dummySource, 'se', 'asset.se.my-sound');
    assert.equal(imported.id, 'asset.se.my-sound');
    assert.equal(imported.type, 'audio');
    assert.equal(imported.category, 'se');
    assert.ok(imported.path.startsWith('assets/se/'));
    assert.ok(existsSync(join(tempProject, imported.path)));

    // Verifikasi manifest terupdate
    const manifestPath = join(tempProject, 'assets', 'manifest.json');
    assert.ok(existsSync(manifestPath));
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.assets.length, 1);
    assert.equal(manifest.assets[0].id, 'asset.se.my-sound');

    // Ekspor berkas
    const exportedFile = join(tempExternal, 'exported.wav');
    exportAssetFile(tempProject, imported.path, exportedFile);
    assert.ok(existsSync(exportedFile));
    assert.equal(readFileSync(exportedFile, 'utf8'), 'RIFFdummywavecontent');

    // Scan direktori aset
    const scanned = scanProjectAssets(tempProject);
    assert.equal(scanned.length, 1);
    assert.equal(scanned[0].id, 'asset.se.my-sound');

    // Hapus berkas
    deleteAssetFile(tempProject, imported.path, imported.id);
    assert.ok(!existsSync(join(tempProject, imported.path)));
    const manifestAfter = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(manifestAfter.assets.length, 0);

    // Verifikasi perlindungan path traversal
    assert.throws(() => {
      importAssetFile(tempProject, '../../evil.png', 'characters');
    });
  } finally {
    rmSync(tempProject, { recursive: true, force: true });
    rmSync(tempExternal, { recursive: true, force: true });
  }
});

test('manipulasi database memenuhi validasi bundle Nusvanir', () => {
  const bundle = loadProject(fixture);

  // 1. Tambah Actor baru
  const newActor = {
    id: 'actor.hero2',
    name: 'Hero 2',
    stats: { str: 10, int: 8, dex: 12, luk: 6, agi: 11, vit: 9 },
    base: { hp: 55, mp: 15, atk: 9, def: 5, mat: 4, mdf: 4, agi: 7 },
    weaponType: 'finesse',
    skillIds: ['skill.power-strike']
  };
  bundle.game.actors.push(newActor);

  // 2. Tambah Skill baru
  const newSkill = {
    id: 'skill.flame-slash',
    name: 'Flame Slash',
    kind: 'physical',
    power: 1.5,
    mpCost: 6,
    spCost: 10,
    speed: 0,
    target: 'enemy'
  };
  bundle.game.skills.push(newSkill);

  // 3. Tambah Item baru
  const newItem = {
    id: 'item.elixir',
    name: 'Elixir',
    kind: 'heal',
    healHp: 200
  };
  bundle.game.items.push(newItem);

  // 4. Tambah Equipment baru
  const newEquip = {
    id: 'equip.flame-blade',
    name: 'Flame Blade',
    slot: 'weapon',
    weaponType: 'finesse',
    stats: { str: 3 },
    bonuses: { atk: 12 }
  };
  bundle.game.equipment.push(newEquip);

  // 5. Ubah System Settings (Party & Title)
  bundle.project.title = 'NUSV RPG Quest';
  bundle.project.party.push('actor.hero2');

  const validated = validateBundle(bundle);
  assert.equal(validated.project.title, 'NUSV RPG Quest');
  assert.equal(validated.project.party.length, 3);
  assert.equal(validated.game.actors.length, 3);
  assert.equal(validated.game.skills.some(s => s.id === 'skill.flame-slash'), true);
  assert.equal(validated.game.items.some(i => i.id === 'item.elixir'), true);
});
