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

test('validasi bundle mendukung extended database RPG Maker MZ/MV (classes, commonEvents, drops, types)', () => {
  const bundle = loadProject(fixture);

  // 1. Class dengan learnings dan traits
  bundle.game.classes.push({
    id: 'class.paladin',
    name: 'Paladin',
    tier: 2,
    statGrowth: { str: 2, int: 1, dex: 1, luk: 1, agi: 1, vit: 2 },
    learnings: [
      { level: 5, skillId: 'skill.mend', note: 'Learned at rank 5' },
      { level: 10, skillId: 'skill.power-strike' }
    ],
    traits: [
      { code: 22, dataId: 0, value: 0.05 } // TRAIT_XPARAM (HIT)
    ]
  });

  // 2. Enemy dengan dropItems, actions, params, dan traits
  bundle.game.enemies[0].params = [250, 0, 30, 25, 20, 20, 18, 15];
  bundle.game.enemies[0].actions = [
    { skillId: 'skill.attack', rating: 5, conditionType: 'always', conditionParam1: 0, conditionParam2: 0 }
  ];
  bundle.game.enemies[0].dropItems = [
    { kind: 'item', dataId: 'item.potion', denominator: 2 },
    { kind: 'weapon', dataId: 'equip.dagger', denominator: 1 }
  ];

  // Troop dengan members dan pages
  bundle.game.troops[0].members = [
    { enemyId: bundle.game.enemies[0].id, x: 400, y: 280, hidden: false }
  ];
  bundle.game.troops[0].pages = [
    {
      conditions: { turnValid: true, turnA: 1, turnB: 0 },
      span: 'battle',
      commands: [{ type: 'text', text: 'Encounter started!' }]
    }
  ];

  // State dengan priority dan traits
  bundle.game.states[0].priority = 100;
  bundle.game.states[0].traits = [
    { code: 23, dataId: 9, value: 0 } // TRAIT_SPARAM (EXR * 0)
  ];

  // 3. Common Events dengan event commands
  bundle.game.commonEvents = [
    {
      id: 'ce.intro',
      name: 'Intro Sequence',
      trigger: 'autorun',
      switchId: 'switch.start',
      commands: [
        { type: 'text', text: 'Welcome to the world!', speakerName: 'Narrator' },
        { type: 'playSe', path: 'audio/se/Item1.ogg', volume: 90, pitch: 100 }
      ]
    }
  ];

  // 4. Types metadata
  bundle.game.types = {
    elements: ['Physical', 'Fire', 'Ice', 'Holy'],
    skillTypes: ['Magic', 'Special'],
    weaponTypes: ['Melee', 'Finesse', 'Ranged'],
    armorTypes: ['Light Armor', 'Heavy Armor', 'Shield'],
    equipmentTypes: ['Weapon', 'Shield', 'Head', 'Body', 'Accessory']
  };

  // 5. Skill dengan format RPG Maker MZ (damage, effects, stypeId, invocation)
  bundle.game.skills.push({
    id: 'skill.holy-smite',
    name: 'Holy Smite',
    kind: 'magical',
    power: 2.5,
    mpCost: 15,
    stypeId: 1,
    scope: 1,
    occasion: 1,
    speed: 0,
    successRate: 100,
    repeats: 1,
    tpGain: 5,
    hitType: 2,
    animationId: 'Thunder One 1',
    message1: '%1 casts Holy Smite!',
    requiredWtypeId1: 1,
    damage: {
      type: 1,
      elementId: 4,
      formula: 'a.mat * 4 - b.mdf * 2',
      variance: 20,
      critical: true
    },
    effects: [
      { code: 21, dataId: 'state.stun', value1: 0.8, value2: 0 },
      { code: 11, dataId: 0, value1: 0.2, value2: 50 }
    ],
    target: 'enemy'
  });

  // 6. Item dengan format RPG Maker MZ (damage, effects, itypeId)
  bundle.game.items.push({
    id: 'item.super-potion',
    name: 'Super Potion',
    kind: 'heal',
    healHp: 200,
    itypeId: 1,
    price: 100,
    consumable: true,
    scope: 7,
    occasion: 0,
    speed: 0,
    successRate: 100,
    repeats: 1,
    tpGain: 0,
    hitType: 0,
    animationId: 'Recovery One 1',
    damage: {
      type: 3,
      elementId: 0,
      formula: '200',
      variance: 20,
      critical: false
    },
    effects: [
      { code: 11, dataId: 0, value1: 0, value2: 200 }
    ]
  });

  // 7. Weapon dengan format RPG Maker MZ (wtypeId, params, traits)
  bundle.game.equipment.push({
    id: 'equip.mithril-sword',
    name: 'Mithril Sword',
    slot: 'weapon',
    wtypeId: 2,
    weaponType: 'melee',
    price: 800,
    animationId: '0006 Slash Physical',
    params: [0, 0, 18, 0, 4, 0, 2, 0],
    bonuses: { atk: 18, mat: 4, agi: 2 },
    traits: [
      { code: 31, dataId: 'physical', value: 1.0 },
      { code: 22, dataId: 0, value: 0.05 }
    ]
  });

  // 8. Armor dengan format RPG Maker MZ (atypeId, etypeId, params, traits)
  bundle.game.equipment.push({
    id: 'equip.dragon-armor',
    name: 'Dragon Armor',
    slot: 'body',
    atypeId: 4,
    etypeId: 4,
    price: 2500,
    params: [100, 0, 0, 45, 0, 20, 0, 0],
    bonuses: { hp: 100, def: 45, mdf: 20 },
    traits: [
      { code: 11, dataId: 'fire', value: 0.5 }
    ]
  });

  const validated = validateBundle(bundle);
  const paladin = validated.game.classes.find(c => c.id === 'class.paladin');
  assert.ok(paladin);
  assert.equal(paladin.learnings?.length, 2);
  assert.equal(paladin.learnings?.[0].level, 5);
  assert.equal(paladin.traits?.length, 1);

  const holySmite = validated.game.skills.find(s => s.id === 'skill.holy-smite');
  assert.ok(holySmite);
  assert.equal(holySmite.damage?.type, 1);
  assert.equal(holySmite.damage?.formula, 'a.mat * 4 - b.mdf * 2');
  assert.equal(holySmite.effects?.length, 2);
  assert.equal(holySmite.effects?.[0].code, 21);

  const superPotion = validated.game.items.find(i => i.id === 'item.super-potion');
  assert.ok(superPotion);
  assert.equal(superPotion.damage?.type, 3);
  assert.equal(superPotion.effects?.length, 1);
  assert.equal(superPotion.effects?.[0].code, 11);

  const mithrilSword = validated.game.equipment.find(e => e.id === 'equip.mithril-sword');
  assert.ok(mithrilSword);
  assert.equal(mithrilSword.params?.length, 8);
  assert.equal(mithrilSword.params?.[2], 18);
  assert.equal(mithrilSword.traits?.length, 2);

  const dragonArmor = validated.game.equipment.find(e => e.id === 'equip.dragon-armor');
  assert.ok(dragonArmor);
  assert.equal(dragonArmor.params?.length, 8);
  assert.equal(dragonArmor.params?.[3], 45);
  assert.equal(dragonArmor.atypeId, 4);
  assert.equal(dragonArmor.etypeId, 4);
  assert.equal(dragonArmor.traits?.length, 1);

  assert.equal(validated.game.enemies[0].params?.[0], 250);
  assert.equal(validated.game.enemies[0].actions?.[0].skillId, 'skill.attack');
  assert.equal(validated.game.enemies[0].actions?.[0].rating, 5);
  assert.equal(validated.game.enemies[0].dropItems?.length, 2);
  assert.equal(validated.game.troops[0].members?.[0].x, 400);
  assert.equal(validated.game.troops[0].pages?.[0].span, 'battle');
  assert.equal(validated.game.states[0].priority, 100);
  assert.equal(validated.game.states[0].traits?.length, 1);
  assert.equal(validated.game.commonEvents?.length, 1);
  assert.equal(validated.game.commonEvents?.[0].commands.length, 2);
  assert.equal(validated.game.types?.elements.length, 4);

  // Verifikasi penolakan learning invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.classes[0].learnings = [{ level: -1, skillId: '' }];
    validateBundle(invalidBundle);
  }, /learnings\[0\]\.level/);

  // Verifikasi penolakan damage invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    const smite = invalidBundle.game.skills.find(s => s.id === 'skill.holy-smite');
    smite.damage = { type: 99 };
    validateBundle(invalidBundle);
  }, /damage\.type/);

  // Verifikasi penolakan item damage invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    const potion = invalidBundle.game.items.find(i => i.id === 'item.super-potion');
    potion.damage = { type: 100 };
    validateBundle(invalidBundle);
  }, /damage\.type/);

  // Verifikasi penolakan equipment params invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    const w = invalidBundle.game.equipment.find(e => e.id === 'equip.mithril-sword');
    w.params = [1, 2, 3];
    validateBundle(invalidBundle);
  }, /params/);

  // Verifikasi penolakan enemy params invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.enemies[0].params = [1, 2, 3];
    validateBundle(invalidBundle);
  }, /params/);

  // Verifikasi penolakan enemy actions invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.enemies[0].actions = [{ skillId: '', rating: 15 }];
    validateBundle(invalidBundle);
  }, /actions/);

  // Verifikasi penolakan troop member invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.troops[0].members = [{ enemyId: 'enemy.nonexistent' }];
    validateBundle(invalidBundle);
  }, /members\[0\]\.enemyId/);

  // Verifikasi penolakan troop page span invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.troops[0].pages = [{ span: 'invalid_span', commands: [] }];
    validateBundle(invalidBundle);
  }, /pages\[0\]\.span/);

  // Verifikasi penolakan state priority invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.states[0].priority = 150;
    validateBundle(invalidBundle);
  }, /priority/);

  // Verifikasi struktur animasi RPG Maker MZ
  assert.ok(Array.isArray(bundle.game.animations));
  assert.ok(bundle.game.animations.length >= 3);
  const pierceIce = bundle.game.animations.find(a => a.id === 'anim.0014');
  assert.ok(pierceIce);
  assert.equal(pierceIce.name, 'Pierce Ice');
  assert.equal(pierceIce.effectName, 'PierceIce');
  assert.equal(pierceIce.scale, 80);
  assert.equal(pierceIce.displayType, 1);
  assert.equal(pierceIce.soundTimings.length, 3);
  assert.equal(pierceIce.soundTimings[0].se.name, 'Thunder1');
  assert.equal(pierceIce.flashTimings.length, 2);
  assert.deepEqual(pierceIce.flashTimings[0].color, [119, 187, 255, 221]);

  // Verifikasi penolakan animasi tanpa nama
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.animations[0].name = '';
    validateBundle(invalidBundle);
  }, /name: wajib diisi/);

  // Verifikasi penolakan animasi displayType invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.animations[0].displayType = 9;
    validateBundle(invalidBundle);
  }, /displayType/);

  // Verifikasi penolakan flashTimings color invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.animations[0].flashTimings = [{ frame: 1, duration: 10, color: [300, 0, 0, 0] }];
    validateBundle(invalidBundle);
  }, /flashTimings\[0\]\.color/);

  // Verifikasi struktur common events RPG Maker MZ
  const fixtureBundle = loadProject(fixture);
  assert.ok(Array.isArray(fixtureBundle.game.commonEvents));
  assert.equal(fixtureBundle.game.commonEvents.length, 4);
  assert.equal(fixtureBundle.game.commonEvents[0].id, 'common.0001');
  assert.equal(fixtureBundle.game.commonEvents[0].trigger, 'none');
  assert.deepEqual(fixtureBundle.game.commonEvents[0].commands, []);

  assert.ok(Array.isArray(bundle.game.commonEvents));
  assert.equal(bundle.game.commonEvents[0].id, 'ce.intro');
  assert.equal(bundle.game.commonEvents[0].trigger, 'autorun');

  // Verifikasi penolakan trigger invalid pada common event
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.commonEvents[0].trigger = 'invalid_trigger';
    validateBundle(invalidBundle);
  }, /trigger/);

  // Verifikasi penolakan name bukan string pada common event
  assert.throws(() => {
    const invalidBundle = structuredClone(bundle);
    invalidBundle.game.commonEvents[0].name = 123;
    validateBundle(invalidBundle);
  }, /name: wajib diisi/);

  // Verifikasi struktur konfigurasi system (System 1 & System 2) RPG Maker MZ
  const systemBundle = structuredClone(bundle);
  systemBundle.game.system = {
    gameTitle: 'Test MZ RPG',
    currencyUnit: 'G',
    windowTone: [0, 0, 0],
    boat: { characterName: 'Vehicle', characterIndex: 0 },
    ship: { characterName: 'Vehicle', characterIndex: 1 },
    airship: { characterName: 'Vehicle', characterIndex: 2 },
    startPositions: {
      player: { mapId: 'map.map001', x: 8, y: 6 },
      boat: null,
      ship: null,
      airship: null
    },
    titleScreen: {
      title1Name: 'Ruins',
      drawTitle: true,
      commandWindow: { background: 0, offsetX: 0, offsetY: 0 }
    },
    battleScreen: { sideView: true },
    battleSystem: 0,
    options: {
      optFollowers: true,
      optDisplayTp: true,
      optAutosave: true
    },
    bgm: {
      title: { name: 'Theme1', volume: 90, pitch: 100, pan: 0 },
      battle: { name: 'Battle1', volume: 90, pitch: 100, pan: 0 }
    },
    sounds: {
      Cursor: { name: 'Cursor3', volume: 90, pitch: 100, pan: 0 }
    },
    menuCommands: { item: true, skill: true, equip: true, status: true, formation: true, save: true },
    itemCategories: { item: true, weapon: true, armor: true, keyItem: true },
    svMagicSkills: [1],
    svAttackMotions: [
      { weaponTypeId: 1, motion: 1, weaponImageId: 1 }
    ],
    advanced: {
      screenWidth: 1080,
      screenHeight: 720,
      uiAreaWidth: 1080,
      uiAreaHeight: 720,
      tileSize: 48,
      windowOpacity: 192,
      mainFontFilename: 'mplus-1m-regular.woff',
      fontSize: 26
    }
  };

  const validatedSystem = validateBundle(systemBundle);
  assert.ok(validatedSystem.game.system);
  assert.equal(validatedSystem.game.system.gameTitle, 'Test MZ RPG');
  assert.equal(validatedSystem.game.system.battleSystem, 0);
  assert.equal(validatedSystem.game.system.advanced?.tileSize, 48);

  // Verifikasi penolakan battleSystem invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(systemBundle);
    invalidBundle.game.system.battleSystem = 99;
    validateBundle(invalidBundle);
  }, /battleSystem/);

  // Verifikasi penolakan windowTone invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(systemBundle);
    invalidBundle.game.system.windowTone = [300, 0, 0];
    validateBundle(invalidBundle);
  }, /windowTone/);

  // Verifikasi penolakan tileSize invalid
  assert.throws(() => {
    const invalidBundle = structuredClone(systemBundle);
    invalidBundle.game.system.advanced.tileSize = 50;
    validateBundle(invalidBundle);
  }, /tileSize/);

  // Verifikasi kelima kategori types RPG Maker MZ
  const typesBundle = structuredClone(bundle);
  typesBundle.game.types = {
    elements: ['Physical', 'Fire', 'Ice', 'Thunder', 'Water', 'Earth', 'Wind', 'Light', 'Darkness'],
    skillTypes: ['Magic', 'Special'],
    weaponTypes: ['Dagger', 'Sword', 'Flail', 'Axe', 'Whip', 'Staff', 'Bow', 'Crossbow', 'Gun', 'Claw', 'Glove', 'Spear'],
    armorTypes: ['General Armor', 'Magic Armor', 'Light Armor', 'Heavy Armor', 'Small Shield', 'Large Shield'],
    equipmentTypes: ['Weapon', 'Shield', 'Head', 'Body', 'Accessory']
  };

  const validatedTypes = validateBundle(typesBundle);
  assert.ok(validatedTypes.game.types);
  assert.equal(validatedTypes.game.types.elements?.length, 9);
  assert.equal(validatedTypes.game.types.skillTypes?.length, 2);
  assert.equal(validatedTypes.game.types.weaponTypes?.length, 12);
  assert.equal(validatedTypes.game.types.armorTypes?.length, 6);
  assert.equal(validatedTypes.game.types.equipmentTypes?.length, 5);
  assert.equal(validatedTypes.game.types.weaponTypes?.[0], 'Dagger');
  assert.equal(validatedTypes.game.types.equipmentTypes?.[4], 'Accessory');

  // Verifikasi penolakan elements bukan string array
  assert.throws(() => {
    const invalidBundle = structuredClone(typesBundle);
    invalidBundle.game.types = { elements: [123, 'Fire'] };
    validateBundle(invalidBundle);
  }, /game\.types\.elements: harus berupa daftar teks/);

  // Verifikasi penolakan equipmentTypes bukan string array
  assert.throws(() => {
    const invalidBundle = structuredClone(typesBundle);
    invalidBundle.game.types = { equipmentTypes: 'not_an_array' };
    validateBundle(invalidBundle);
  }, /game\.types\.equipmentTypes: harus berupa daftar teks/);

  // Verifikasi terms (Basic Statuses, Parameters, Commands, Messages) RPG Maker MZ
  const termsBundle = structuredClone(bundle);
  termsBundle.game.terms = {
    basic: ['Level', 'Lv', 'HP', 'HP', 'MP', 'MP', 'TP', 'TP', 'EXP', 'EXP'],
    params: ['Max HP', 'Max MP', 'Attack', 'Defense', 'M.Attack', 'M.Defense', 'Agility', 'Luck', 'Hit', 'Evasion'],
    commands: [
      'Fight', 'Escape', 'Attack', 'Guard',
      'Item', 'Skill', 'Equip', 'Status',
      'Formation', 'Options', 'Save', 'Game End',
      'Weapon', 'Armor', 'Key Item', 'Equip',
      'Optimize', 'Clear', 'Buy', 'Sell',
      'New Game', 'Continue', 'To Title', 'Cancel'
    ],
    messages: {
      alwaysDash: 'Always Dash',
      commandRemember: 'Command Remember',
      touchUi: 'Touch UI',
      levelUp: '%1 is now %2 %3!'
    }
  };

  const validatedTerms = validateBundle(termsBundle);
  assert.ok(validatedTerms.game.terms);
  assert.equal(validatedTerms.game.terms.basic?.length, 10);
  assert.equal(validatedTerms.game.terms.params?.length, 10);
  assert.equal(validatedTerms.game.terms.commands?.length, 24);
  assert.equal(validatedTerms.game.terms.basic?.[0], 'Level');
  assert.equal(validatedTerms.game.terms.params?.[2], 'Attack');
  assert.equal(validatedTerms.game.terms.commands?.[0], 'Fight');
  assert.equal(validatedTerms.game.terms.messages?.levelUp, '%1 is now %2 %3!');

  // Verifikasi penolakan basic bukan string array
  assert.throws(() => {
    const invalidBundle = structuredClone(termsBundle);
    invalidBundle.game.terms = { basic: [123, 'Lv'] };
    validateBundle(invalidBundle);
  }, /game\.terms\.basic: harus berupa daftar teks/);

  // Verifikasi penolakan messages bernilai non-string
  assert.throws(() => {
    const invalidBundle = structuredClone(termsBundle);
    invalidBundle.game.terms = { messages: { alwaysDash: 123 } };
    validateBundle(invalidBundle);
  }, /game\.terms\.messages\.alwaysDash: harus berupa teks/);
});
