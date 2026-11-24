import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('RPG Maker MZ Movement Route: runMoveRoute mengeksekusi langkah, hadap, dan batasan collision', async () => {
  const { runMoveRoute, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const state = initialProgress(bundle);

  // Initial player position: (x=1, y=1, facing='down')
  state.x = 1;
  state.y = 1;
  state.facing = 'down';

  let movesNotified = 0;
  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    eventMove: async () => { movesNotified++; }
  };

  const route = {
    repeat: false,
    skippable: true,
    list: [
      { code: 'moveRight' },
      { code: 'moveDown' },
      { code: 'turnUp' },
      { code: 'switchOn', parameters: ['route.flag'] }
    ]
  };

  const next = await runMoveRoute(bundle, state, 'player', route, io);

  assert.equal(next.x, 2);
  assert.equal(next.y, 2);
  assert.equal(next.facing, 'up');
  assert.equal(next.switches['route.flag'], true);
  assert.ok(movesNotified >= 3);
});

test('RPG Maker MZ Movement Route pada Event: pergerakan mendekati player (moveTowardPlayer) dan skippable', async () => {
  const { runMoveRoute, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  const testEvent = {
    id: 'event.patrol',
    name: 'Patrol NPC',
    x: 4,
    y: 1,
    trigger: 'interact',
    pages: [{
      solid: true,
      trigger: 'interact',
      moveType: 'custom',
      moveRoute: {
        repeat: true,
        skippable: true,
        list: [{ code: 'moveTowardPlayer' }]
      },
      commands: []
    }]
  };
  map.events.push(testEvent);
  validateBundle(bundle);

  const state = initialProgress(bundle);
  state.x = 2; // player is to the left of event at x=4
  state.y = 1;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 })
  };

  // Move patrol event towards player
  const route = {
    repeat: false,
    skippable: true,
    list: [{ code: 'moveTowardPlayer' }]
  };

  const next = await runMoveRoute(bundle, state, 'event.patrol', route, io, { eventId: 'event.patrol', mapId });
  const eventPos = next.eventPositions[`${mapId}:event.patrol`];
  assert.ok(eventPos);
  assert.equal(eventPos.x, 3); // moved from 4 to 3 towards player at 2
  assert.equal(eventPos.y, 1);
});

test('RPG Maker MZ Party & Actor Commands: changeHp, changeMp, recoverAll, changeLevel, changePartyMember', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);
  const actorId = bundle.project.party[0];

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 })
  };

  // 1. Change HP (subtract 50 without knockout)
  const initialHp = state.actorResources[actorId].hp;
  let next = await executeCommands(bundle, state, [
    { type: 'changeHp', actorId, operation: 'sub', amount: 50, allowKnockout: false }
  ], io);
  assert.equal(next.actorResources[actorId].hp, initialHp - 50);

  // 2. Change HP with knockout protection: subtract huge amount, should clamp to 1
  next = await executeCommands(bundle, next, [
    { type: 'changeHp', actorId, operation: 'sub', amount: 99999, allowKnockout: false }
  ], io);
  assert.equal(next.actorResources[actorId].hp, 1);

  // 3. Change MP: sub 20
  const initialMp = next.actorResources[actorId].mp;
  next = await executeCommands(bundle, next, [
    { type: 'changeMp', actorId, operation: 'sub', amount: 20 }
  ], io);
  assert.equal(next.actorResources[actorId].mp, Math.max(0, initialMp - 20));

  // 4. Recover All: restores HP and MP to full
  next = await executeCommands(bundle, next, [
    { type: 'recoverAll', actorId }
  ], io);
  assert.equal(next.actorResources[actorId].hp, initialHp);
  assert.equal(next.actorResources[actorId].mp, initialMp);

  // 5. Change Level: add 3 levels
  const initialLevel = next.actorProgress[actorId].baseLevel;
  next = await executeCommands(bundle, next, [
    { type: 'changeLevel', actorId, operation: 'add', amount: 3 }
  ], io);
  assert.equal(next.actorProgress[actorId].baseLevel, initialLevel + 3);

  // 6. Change Party Member: remove and add
  next = await executeCommands(bundle, next, [
    { type: 'changePartyMember', actorId, operation: 'remove' }
  ], io);
  assert.equal(next.formation.includes(actorId), false);

  next = await executeCommands(bundle, next, [
    { type: 'changePartyMember', actorId, operation: 'add' }
  ], io);
  assert.equal(next.formation.includes(actorId), true);
});

test('RPG Maker MZ Event Positioning & Control Commands: setEventLocation, eraseEvent, script', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const state = initialProgress(bundle);

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 })
  };

  // 1. setEventLocation
  let next = await executeCommands(bundle, state, [
    { type: 'setEventLocation', eventId: 'event.target', x: 7, y: 8 }
  ], io, { eventId: 'event.runner', mapId });

  assert.deepEqual(next.eventPositions[`${mapId}:event.target`], { mapId, x: 7, y: 8 });

  // 2. eraseEvent (sets off-map)
  next = await executeCommands(bundle, next, [
    { type: 'eraseEvent', eventId: 'event.target' }
  ], io, { eventId: 'event.runner', mapId });

  assert.equal(next.eventPositions[`${mapId}:event.target`].x, -999);

  // 3. script command: modifies variable directly
  next = await executeCommands(bundle, next, [
    { type: 'script', code: 'state.variables["custom.test"] = 42;' }
  ], io);

  assert.equal(next.variables['custom.test'], 42);
});

test('RPG Maker MZ Show Text: meneruskan speakerName, faceName, faceIndex, background, dan positionType ke EventIO', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);

  let capturedText = '';
  let capturedOptions = null;

  const io = {
    showText: async (text, options) => {
      capturedText = text;
      capturedOptions = options;
    },
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 })
  };

  const command = {
    type: 'text',
    text: 'Halo petualang nusv!',
    speakerName: 'Harold',
    faceName: 'assets/faces/Actor1.png',
    faceIndex: 2,
    background: 0,
    positionType: 2
  };

  await executeCommands(bundle, state, [command], io);

  assert.equal(capturedText, 'Halo petualang nusv!');
  assert.deepEqual(capturedOptions, {
    speakerName: 'Harold',
    faceName: 'assets/faces/Actor1.png',
    faceIndex: 2,
    background: 0,
    positionType: 2
  });
});
