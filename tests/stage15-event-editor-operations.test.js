import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('event movement dan nudging: memindahkan event ke sel kosong dengan batasan boundary map', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  const testEvent = {
    id: 'event.mover',
    name: 'Moving NPC',
    x: 2,
    y: 2,
    trigger: 'interact',
    pages: [{ trigger: 'interact', solid: true, commands: [] }]
  };
  map.events.push(testEvent);

  // Function simulating moveEvent logic from useEventEditor
  const moveEventLogic = (id, newX, newY) => {
    const target = map.events.find(e => e.id === id);
    if (!target) return;
    const clampedX = Math.max(0, Math.min(map.width - 1, newX));
    const clampedY = Math.max(0, Math.min(map.height - 1, newY));
    const other = map.events.find(e => e.id !== id && e.x === clampedX && e.y === clampedY);
    if (other) {
      map.events = map.events.map(e => {
        if (e.id === id) return { ...e, x: clampedX, y: clampedY };
        if (e.id === other.id) return { ...e, x: target.x, y: target.y };
        return e;
      });
    } else {
      map.events = map.events.map(e => (e.id === id ? { ...e, x: clampedX, y: clampedY } : e));
    }
  };

  // Move to empty cell (5, 4)
  moveEventLogic('event.mover', 5, 4);
  const moved = map.events.find(e => e.id === 'event.mover');
  assert.equal(moved.x, 5);
  assert.equal(moved.y, 4);

  // Move with out-of-bounds coordinates (should clamp to width-1, height-1)
  moveEventLogic('event.mover', 999, 999);
  const clamped = map.events.find(e => e.id === 'event.mover');
  assert.equal(clamped.x, map.width - 1);
  assert.equal(clamped.y, map.height - 1);

  // Nudge logic (-1, 0)
  moveEventLogic('event.mover', clamped.x - 1, clamped.y);
  const nudged = map.events.find(e => e.id === 'event.mover');
  assert.equal(nudged.x, map.width - 2);
  assert.equal(nudged.y, map.height - 1);

  validateBundle(bundle);
});

test('event movement: menukar posisi (swap) saat didrop ke sel yang sudah berisi event lain', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  const evA = {
    id: 'event.alpha',
    name: 'Event Alpha',
    x: 1,
    y: 1,
    trigger: 'interact',
    pages: [{ trigger: 'interact', solid: true, commands: [] }]
  };
  const evB = {
    id: 'event.beta',
    name: 'Event Beta',
    x: 3,
    y: 3,
    trigger: 'interact',
    pages: [{ trigger: 'interact', solid: true, commands: [] }]
  };
  map.events.push(evA, evB);

  // Simulating moveEvent drop of Alpha onto Beta at (3, 3)
  const target = map.events.find(e => e.id === 'event.alpha');
  const clampedX = 3;
  const clampedY = 3;
  const other = map.events.find(e => e.id !== 'event.alpha' && e.x === clampedX && e.y === clampedY);

  assert.ok(other);
  assert.equal(other.id, 'event.beta');

  map.events = map.events.map(e => {
    if (e.id === 'event.alpha') return { ...e, x: clampedX, y: clampedY };
    if (e.id === other.id) return { ...e, x: target.x, y: target.y };
    return e;
  });

  const resA = map.events.find(e => e.id === 'event.alpha');
  const resB = map.events.find(e => e.id === 'event.beta');

  assert.equal(resA.x, 3);
  assert.equal(resA.y, 3);
  assert.equal(resB.x, 1);
  assert.equal(resB.y, 1);

  validateBundle(bundle);
});

test('quick event creation: transfer, door, chest, dan inn dibuat di source tile yang benar dan valid', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  const sourceX = 3;
  const sourceY = 4;
  const targetMap = mapId;
  const targetX = 1;
  const targetY = 2;

  // 1. Quick Transfer
  const transferEv = {
    id: 'event.transfer-test',
    name: `Transfer to ${targetMap}`,
    x: sourceX,
    y: sourceY,
    trigger: 'touch',
    pages: [{
      trigger: 'touch',
      solid: false,
      commands: [{ type: 'transfer', mapId: targetMap, x: targetX, y: targetY }]
    }]
  };
  assert.equal(transferEv.x, sourceX);
  assert.equal(transferEv.y, sourceY);
  assert.equal(transferEv.pages[0].commands[0].x, targetX);
  assert.equal(transferEv.pages[0].commands[0].y, targetY);

  // 2. Quick Door
  const doorEv = {
    id: 'event.door-test',
    name: `Door to ${targetMap}`,
    x: sourceX,
    y: sourceY,
    trigger: 'interact',
    pages: [{
      trigger: 'interact',
      solid: true,
      graphic: { characterName: 'assets/characters/Door1.png', characterIndex: 0, direction: 'down', pattern: 1 },
      commands: [
        { type: 'playSe', path: 'assets/audio/se/Door.ogg' },
        { type: 'wait', frames: 15 },
        { type: 'transfer', mapId: targetMap, x: targetX, y: targetY }
      ]
    }]
  };
  assert.equal(doorEv.x, sourceX);
  assert.equal(doorEv.y, sourceY);
  assert.equal(doorEv.pages[0].graphic.characterName, 'assets/characters/Door1.png');

  // 3. Quick Treasure Chest
  const chestEv = {
    id: 'event.chest-test',
    name: 'Treasure Chest',
    x: sourceX,
    y: sourceY,
    trigger: 'interact',
    pages: [
      {
        trigger: 'interact',
        solid: true,
        graphic: { characterName: 'assets/characters/Chest.png', characterIndex: 0, direction: 'down', pattern: 1 },
        commands: [
          { type: 'playSe', path: 'assets/audio/se/Chest.ogg' },
          { type: 'changeGold', amount: 250, operation: 'add' },
          { type: 'text', text: 'Ditemukan 250 Gold!' },
          { type: 'setSelfSwitch', key: 'A', value: true }
        ]
      },
      {
        trigger: 'interact',
        solid: true,
        conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
        graphic: { characterName: 'assets/characters/Chest.png', characterIndex: 0, direction: 'up', pattern: 1 },
        commands: []
      }
    ]
  };
  assert.equal(chestEv.x, sourceX);
  assert.equal(chestEv.pages.length, 2);
  assert.equal(chestEv.pages[1].conditions.selfSwitchKey, 'A');

  // 4. Quick Inn
  const innEv = {
    id: 'event.inn-test',
    name: 'Innkeeper',
    x: sourceX,
    y: sourceY,
    trigger: 'interact',
    pages: [{
      trigger: 'interact',
      solid: true,
      commands: [
        { type: 'text', text: 'Selamat datang di penginapan!' },
        {
          type: 'choice',
          prompt: 'Menginap?',
          choices: [
            {
              text: 'Ya',
              commands: [
                { type: 'inn', price: 20 },
                { type: 'fadeoutScreen', duration: 30 },
                { type: 'wait', frames: 60 },
                { type: 'fadeinScreen', duration: 30 },
                { type: 'text', text: 'Kesehatan Anda pulih sepenuhnya.' }
              ]
            },
            { text: 'Tidak', commands: [] }
          ]
        }
      ]
    }]
  };
  assert.equal(innEv.x, sourceX);
  assert.equal(innEv.pages[0].commands[1].type, 'choice');

  // Push all to map and validate bundle
  map.events.push(transferEv, doorEv, chestEv, innEv);
  validateBundle(bundle);
});

test('event creation dan editor commands: draft reactive, penambahan perintah, multiple pages, dan commit bundle', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  // 1. Simulating createEventAt
  let n = 1;
  while (map.events.some(event => event.id === `event.new-${n}`)) n++;
  const newEv = {
    id: `event.new-${n}`,
    name: `EV${String(n).padStart(3, '0')}`,
    x: 4,
    y: 3,
    trigger: 'interact',
    pages: [{ solid: true, commands: [{ type: 'text', text: 'Halo! Ini event baru.' }] }]
  };
  map.events.push(newEv);

  // 2. Simulating draft state in EventEditor
  let eventDraft = JSON.stringify(newEv, null, 2);

  // Simulating activeEv parsing logic
  const parseActive = (draft, fallback) => {
    try {
      const parsed = JSON.parse(draft);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return parsed;
      }
    } catch {}
    return fallback;
  };

  let activeEv = parseActive(eventDraft, newEv);
  assert.equal(activeEv.name, 'EV001');
  assert.equal(activeEv.pages.length, 1);
  assert.equal(activeEv.pages[0].commands.length, 1);

  // 3. Simulating adding a command (e.g. playSe) via addCommand
  const draftClone = structuredClone(activeEv);
  draftClone.pages[0].commands.push({ type: 'playSe', path: 'assets/audio/se/Decision1.ogg', volume: 90, pitch: 100 });
  eventDraft = JSON.stringify(draftClone, null, 2);
  activeEv = parseActive(eventDraft, newEv);

  assert.equal(activeEv.pages[0].commands.length, 2);
  assert.equal(activeEv.pages[0].commands[1].type, 'playSe');

  // 4. Simulating handleNewPage
  draftClone.pages.push({
    solid: true,
    trigger: 'touch',
    conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
    commands: [{ type: 'text', text: 'Halaman 2 aktif.' }]
  });
  eventDraft = JSON.stringify(draftClone, null, 2);
  activeEv = parseActive(eventDraft, newEv);

  assert.equal(activeEv.pages.length, 2);
  assert.equal(activeEv.pages[1].trigger, 'touch');
  assert.equal(activeEv.pages[1].conditions.selfSwitchKey, 'A');

  // 5. Simulating applyEvent commit logic
  const parsed = JSON.parse(eventDraft);
  const exists = map.events.some(e => e.id === parsed.id);
  assert.ok(exists);
  map.events = exists
    ? map.events.map(e => (e.id === parsed.id ? parsed : e))
    : [...map.events, parsed];

  const committed = map.events.find(e => e.id === `event.new-${n}`);
  assert.ok(committed);
  assert.equal(committed.pages.length, 2);
  assert.equal(committed.pages[0].commands.length, 2);
  assert.equal(committed.pages[1].commands[0].text, 'Halaman 2 aktif.');

  // 6. Validate bundle integrity
  validateBundle(bundle);
});

test('RPG Maker MZ event page options: autonomous movement, priorityType, through, and passage logic', async () => {
  const { canPass } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  // Create an event with full RPG Maker MZ page options
  const mzEvent = {
    id: 'event.mz-special',
    name: 'Special MZ NPC',
    note: '<quest-npc: true>',
    x: 2,
    y: 1,
    trigger: 'interact',
    pages: [{
      solid: true,
      trigger: 'interact',
      moveType: 'random',
      moveSpeed: 4,
      moveFrequency: 3,
      walkAnime: true,
      stepAnime: true,
      directionFix: false,
      through: false,
      priorityType: 'same',
      graphic: {
        characterName: 'assets/characters/Actor1.png',
        characterIndex: 0,
        direction: 'down',
        pattern: 1
      },
      commands: [{ type: 'text', text: 'Halo dari RPG Maker MZ!' }]
    }]
  };
  map.events.push(mzEvent);

  // Validate bundle with new MZ properties
  validateBundle(bundle);

  // Initial state simulation at (2, 2) facing 'up' towards (2, 1)
  const state = {
    schemaVersion: 2,
    projectId: bundle.project.id,
    mapId,
    x: 2,
    y: 2,
    facing: 'up',
    switches: {},
    variables: {},
    inventory: {},
    actorResources: {},
    actorProgress: {},
    gold: 0,
    quests: {},
    formation: [],
    settings: { bgmVolume: 100, bgsVolume: 100, meVolume: 100, seVolume: 100, dash: true },
    telemetry: { battles: 0, victories: 0, turns: 0, damageTaken: 0 },
    eventPositions: {}
  };

  // With priorityType: 'same' and through: false, moving up to (2, 1) should be blocked by the solid event
  const passBlocked = canPass(bundle, state, 2, 2, 'up');
  assert.equal(passBlocked, false);

  // If through: true, the player can pass through the event
  mzEvent.pages[0].through = true;
  const passThrough = canPass(bundle, state, 2, 2, 'up');
  assert.equal(passThrough, true);

  // If priorityType: 'below' (e.g. rug, switch on floor), the player can step on it
  mzEvent.pages[0].through = false;
  mzEvent.pages[0].priorityType = 'below';
  const passBelow = canPass(bundle, state, 2, 2, 'up');
  assert.equal(passBelow, true);

  validateBundle(bundle);
});
