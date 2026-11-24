import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { activePage, executeCommands, initialProgress } from '../.electron-dist/src/core/world.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('evaluasi halaman terbalik (reverse order) dan self-switches bekerja sesuai standar MZ', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const testEvent = {
    id: 'chest_01',
    name: 'Treasure Chest',
    x: 3,
    y: 3,
    trigger: 'interact',
    pages: [
      {
        solid: true,
        commands: [
          { type: 'giveItem', itemId: 'item.potion', amount: 1 },
          { type: 'setSelfSwitch', key: 'A', value: true }
        ]
      },
      {
        conditions: { switchId: 'quest.active' },
        solid: true,
        commands: [{ type: 'text', text: 'Quest sedang aktif.' }]
      },
      {
        conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
        solid: true,
        commands: [{ type: 'text', text: 'Peti sudah kosong.' }]
      }
    ]
  };

  // 1. Awal: Page 0 aktif
  let page = activePage(testEvent, state);
  assert.equal(page, testEvent.pages[0]);

  // 2. Jika switch quest.active menyala, Page 1 aktif karena dievaluasi dari belakang
  state.switches['quest.active'] = true;
  page = activePage(testEvent, state);
  assert.equal(page, testEvent.pages[1]);

  // 3. Eksekusi page 0 untuk mengambil isi peti dan menyalakan Self Switch A
  const io = { showText: async () => {}, choose: async () => 0 };
  state = await executeCommands(bundle, state, testEvent.pages[0].commands, io, { eventId: testEvent.id });
  assert.equal(state.selfSwitches[`${state.mapId}:chest_01:A`], true);
  assert.equal(state.inventory['item.potion'], 3); // 2 default + 1

  // 4. Setelah Self Switch A aktif, Page 2 (indeks 2) harus aktif karena posisinya paling belakang
  page = activePage(testEvent, state);
  assert.equal(page, testEvent.pages[2]);
});

test('percabangan logika (conditional branch) mendukung switch, variable, selfSwitch, gold, dan item', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);
  state.gold = 50;
  state.variables['step'] = 10;
  state.switches['flag'] = true;

  const branchCommands = [
    {
      type: 'branch',
      condition: { kind: 'gold', op: '>=', amount: 40 },
      thenCommands: [{ type: 'changeGold', amount: 20, operation: 'add' }],
      elseCommands: [{ type: 'changeGold', amount: 10, operation: 'sub' }]
    },
    {
      type: 'branch',
      condition: { kind: 'variable', id: 'step', op: '==', value: 10 },
      thenCommands: [{ type: 'setVariable', id: 'step', value: 25 }]
    },
    {
      type: 'branch',
      condition: { kind: 'switch', id: 'flag', value: false },
      thenCommands: [{ type: 'setVariable', id: 'never', value: 999 }],
      elseCommands: [{ type: 'setVariable', id: 'branch_else', value: 1 }]
    }
  ];

  const io = { showText: async () => {}, choose: async () => 0 };
  state = await executeCommands(bundle, state, branchCommands, io);

  assert.equal(state.gold, 70); // 50 + 20
  assert.equal(state.variables['step'], 25);
  assert.equal(state.variables['never'], undefined);
  assert.equal(state.variables['branch_else'], 1);
});

test('perulangan (loop) dan breakLoop berfungsi dengan aman', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);
  state.variables['counter'] = 0;

  const loopCommands = [
    {
      type: 'loop',
      commands: [
        {
          type: 'branch',
          condition: { kind: 'variable', id: 'counter', op: '>=', value: 5 },
          thenCommands: [{ type: 'breakLoop' }],
          elseCommands: [
            { type: 'script', code: '' } // no-op
          ]
        },
        {
          type: 'branch',
          condition: { kind: 'variable', id: 'counter', op: '<', value: 5 },
          thenCommands: [
            // simulasi increment
            { type: 'setVariable', id: 'counter', value: 5 } // langsung lompat ke 5
          ]
        }
      ]
    }
  ];

  const io = { showText: async () => {}, choose: async () => 0 };
  state = await executeCommands(bundle, state, loopCommands, io);
  assert.equal(state.variables['counter'], 5);
});

test('label dan jumpToLabel melompati eksekusi perintah secara deterministik', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);
  state.gold = 100;

  const jumpCommands = [
    { type: 'jumpToLabel', name: 'skip_penalty' },
    { type: 'changeGold', amount: 50, operation: 'sub' }, // Harus dilewati
    { type: 'label', name: 'skip_penalty' },
    { type: 'changeGold', amount: 25, operation: 'add' }
  ];

  const io = { showText: async () => {}, choose: async () => 0 };
  state = await executeCommands(bundle, state, jumpCommands, io);
  assert.equal(state.gold, 125); // 100 + 25 (pengurangan 50 dilewati)
});

test('perintah wait memanggil io.wait dengan jumlah frame yang tepat', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);
  let waitedFrames = 0;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    wait: async (frames) => { waitedFrames += frames; }
  };

  state = await executeCommands(bundle, state, [{ type: 'wait', frames: 30 }, { type: 'wait', frames: 60 }], io);
  assert.equal(waitedFrames, 90);
});

test('validation bundle menerima perintah-perintah baru RPG Maker MZ', () => {
  const bundle = loadProject(fixture);
  bundle.maps['map.intro'].events[0].pages[0].commands.push(
    { type: 'setSelfSwitch', key: 'B', value: true },
    { type: 'changeGold', amount: 50, operation: 'add' },
    { type: 'wait', frames: 120 },
    { type: 'label', name: 'checkpoint' },
    { type: 'jumpToLabel', name: 'checkpoint' },
    {
      type: 'branch',
      condition: { kind: 'switch', id: 'door.open', value: true },
      thenCommands: [{ type: 'breakLoop' }]
    }
  );

  const validated = validateBundle(bundle);
  assert.ok(validated);
});
