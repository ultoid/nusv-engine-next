import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { activePage, eventAt, executeCommands, initialProgress } from '../.electron-dist/src/core/world.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('validasi bundel menerima trigger interact, touch, event_touch, autorun, parallel pada event dan page', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  map.events.push({
    id: 'autorun-cutscene',
    name: 'Intro Cutscene',
    x: 0,
    y: 0,
    trigger: 'autorun',
    pages: [
      {
        solid: false,
        trigger: 'autorun',
        graphic: {
          characterName: 'assets/characters/Hero.png',
          characterIndex: 0,
          direction: 'down',
          pattern: 1
        },
        commands: [
          { type: 'text', text: 'Selamat datang di petualangan!' },
          { type: 'setSelfSwitch', key: 'A', value: true }
        ]
      },
      {
        conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
        solid: true,
        trigger: 'interact',
        graphic: {
          characterName: 'assets/characters/Hero.png',
          characterIndex: 0,
          direction: 'down',
          pattern: 1
        },
        commands: [
          { type: 'text', text: 'Halo kawan.' }
        ]
      }
    ]
  });

  map.events.push({
    id: 'parallel-weather',
    name: 'Weather Loop',
    x: 1,
    y: 0,
    trigger: 'parallel',
    pages: [
      {
        solid: false,
        trigger: 'parallel',
        commands: [
          { type: 'weather', weatherType: 'rain', power: 5, duration: 60 }
        ]
      }
    ]
  });

  assert.doesNotThrow(() => validateBundle(bundle));
});

test('page.trigger meng-override event.trigger pada eventAt', () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  const multiTriggerEvent = {
    id: 'switch-trigger-event',
    name: 'Dynamic Trigger Event',
    x: 2,
    y: 2,
    trigger: 'interact',
    pages: [
      {
        solid: false,
        trigger: 'touch',
        commands: [{ type: 'setSwitch', id: 'zone.entered', value: true }]
      },
      {
        conditions: { switchId: 'zone.entered', switchValue: true },
        solid: true,
        trigger: 'interact',
        commands: [{ type: 'text', text: 'Interaksi setelah touch.' }]
      }
    ]
  };
  map.events.push(multiTriggerEvent);

  // 1. Awalnya page 0 aktif dengan trigger 'touch'
  const touchMatch = eventAt(bundle, state, 2, 2, 'touch');
  assert.equal(touchMatch?.id, 'switch-trigger-event');

  const interactMatchBefore = eventAt(bundle, state, 2, 2, 'interact');
  assert.equal(interactMatchBefore, null);

  // 2. Setelah switch menyala, page 1 aktif dengan trigger 'interact'
  state.switches['zone.entered'] = true;
  const touchMatchAfter = eventAt(bundle, state, 2, 2, 'touch');
  assert.equal(touchMatchAfter, null);

  const interactMatchAfter = eventAt(bundle, state, 2, 2, 'interact');
  assert.equal(interactMatchAfter?.id, 'switch-trigger-event');
});

test('simulasi autorun event transisi ke non-autorun page setelah self switch diset', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const autorunEvent = {
    id: 'intro-event',
    name: 'Intro Sequence',
    x: 0,
    y: 0,
    trigger: 'autorun',
    pages: [
      {
        solid: false,
        trigger: 'autorun',
        commands: [
          { type: 'setSwitch', id: 'intro_done', value: true },
          { type: 'setSelfSwitch', key: 'A', value: true }
        ]
      },
      {
        conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
        solid: false,
        trigger: 'interact',
        commands: []
      }
    ]
  };

  // Sebelum eksekusi: page 0 (autorun)
  let active = activePage(autorunEvent, state);
  assert.equal(active?.trigger, 'autorun');

  const io = {
    showText: async () => {},
    choose: async () => 0
  };

  state = await executeCommands(bundle, state, active.commands, io, { eventId: autorunEvent.id, mapId: state.mapId });

  // Setelah eksekusi: self switch A aktif -> page 1 aktif (trigger interact)
  active = activePage(autorunEvent, state);
  assert.equal(active?.trigger, 'interact');
  assert.equal(state.switches['intro_done'], true);
  assert.equal(state.selfSwitches[`${state.mapId}:${autorunEvent.id}:A`], true);
});

test('simulasi parallel event mengeksekusi perintah dan memperbarui progress state', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const parallelEvent = {
    id: 'timer-event',
    name: 'Background Timer',
    x: 0,
    y: 0,
    trigger: 'parallel',
    pages: [
      {
        solid: false,
        trigger: 'parallel',
        commands: [
          { type: 'changeGold', operation: 'add', amount: 50 },
          { type: 'setSelfSwitch', key: 'B', value: true }
        ]
      }
    ]
  };

  const initialGold = state.gold;
  const page = activePage(parallelEvent, state);
  assert.ok(page);
  assert.equal(page.trigger, 'parallel');

  const io = {
    showText: async () => {},
    choose: async () => 0
  };

  state = await executeCommands(bundle, state, page.commands, io, { eventId: parallelEvent.id, mapId: state.mapId });

  assert.equal(state.gold, initialGold + 50);
  assert.equal(state.selfSwitches[`${state.mapId}:${parallelEvent.id}:B`], true);
});
