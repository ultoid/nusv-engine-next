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
  state.actorResources[actorId].sp = 0;

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

test('RPG Maker MZ Message & Logic Commands: inputNumber, selectItem, scrollingText, controlTimer, commonEvent, comment', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);

  let scrolled = '';
  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    inputNumber: async () => 1337,
    selectItem: async () => 'item.potion',
    scrollingText: async (text) => { scrolled = text; }
  };

  bundle.game.commonEvents = [
    {
      id: 'common.heal',
      name: 'Common Heal',
      commands: [
        { type: 'setSwitch', id: 'common.invoked', value: true }
      ]
    }
  ];

  const commands = [
    { type: 'comment', text: 'Catatan pengujian logika' },
    { type: 'inputNumber', variableId: 'pin.code', digits: 4 },
    { type: 'selectItem', variableId: 'quest.itemChoice', itemType: 'regular' },
    { type: 'scrollingText', text: 'Alkisah sebuah kerajaan...', speed: 3 },
    { type: 'controlTimer', operation: 'start', seconds: 180 },
    { type: 'commonEvent', commonEventId: 'common.heal' }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.equal(next.variables['pin.code'], 1337);
  assert.equal(next.variables['quest.itemChoice'], 'item.potion');
  assert.equal(scrolled, 'Alkisah sebuah kerajaan...');
  assert.deepEqual(next.timer, { active: true, seconds: 180 });
  assert.equal(next.switches['common.invoked'], true);
});

test('RPG Maker MZ Party & Actor Logic Commands: changeWeapons, changeArmors, changeTp, changeState, changeParameter, changeName, changeClass', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);
  const actorId = bundle.project.party[0];
  state.actorResources[actorId].sp = 0;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 })
  };

  const commands = [
    { type: 'changeWeapons', weaponId: 'weapon.iron-sword', operation: 'add', amount: 3 },
    { type: 'changeArmors', armorId: 'armor.leather-shield', operation: 'add', amount: 2 },
    { type: 'changeTp', actorId, operation: 'add', amount: 50 },
    { type: 'changeState', actorId, operation: 'add', stateId: 'state.poison' },
    { type: 'changeParameter', actorId, param: 'atk', operation: 'add', amount: 10 },
    { type: 'changeName', actorId, name: 'Reid the Brave' },
    { type: 'changeClass', actorId, classId: 'class.paladin', keepLevel: true }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.equal(next.inventory['weapon.iron-sword'], 3);
  assert.equal(next.inventory['armor.leather-shield'], 2);
  assert.equal(next.actorResources[actorId].sp, 50);
  assert.ok(next.activeStates[actorId].includes('state.poison'));
  assert.equal(next.actorProgress[actorId].allocated.atk, 10);
  assert.equal(next.actorOverrides[actorId].name, 'Reid the Brave');
  assert.equal(next.actorProgress[actorId].activeClassId, 'class.paladin');
});

test('RPG Maker MZ Movement & Character Commands: setVehicleLocation, getOnOffVehicle, changePlayerFollowers, gatherFollowers', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);
  state.x = 5;
  state.y = 5;

  let gathered = false;
  let followerState;
  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    changePlayerFollowers: (v) => { followerState = v; },
    gatherFollowers: async () => { gathered = true; }
  };

  const commands = [
    { type: 'setVehicleLocation', vehicleType: 'boat', mapId: state.mapId, x: 5, y: 5 },
    { type: 'getOnOffVehicle' },
    { type: 'changePlayerFollowers', value: false },
    { type: 'gatherFollowers' }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.deepEqual(next.vehiclePositions?.boat, { mapId: state.mapId, x: 5, y: 5 });
  assert.equal(next.inVehicle, 'boat');
  assert.equal(next.showFollowers, false);
  assert.equal(followerState, false);
  assert.equal(gathered, true);

  // Test get off vehicle
  const next2 = await executeCommands(bundle, next, [{ type: 'getOnOffVehicle' }], io);
  assert.equal(next2.inVehicle, null);
});

test('RPG Maker MZ Picture, Audio & Video Commands: rotatePicture, tintPicture, playBgm, fadeoutBgm, saveBgm, replayBgm, playMovie', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);

  let playedBgm;
  let fadeoutSec;
  let bgmSaved = false;
  let bgmReplayed = false;
  let moviePlayed;
  let pictureTinted = null;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    playBgm: (path) => { playedBgm = path; },
    fadeoutBgm: async (sec) => { fadeoutSec = sec; },
    saveBgm: () => { bgmSaved = true; },
    replayBgm: () => { bgmReplayed = true; },
    playMovie: async (path) => { moviePlayed = path; },
    tintPicture: async (id, tone, duration, wait) => { pictureTinted = { id, tone, duration, wait }; }
  };

  const commands = [
    { type: 'rotatePicture', id: 1, speed: 5 },
    { type: 'tintPicture', id: 1, tone: [68, -34, -34, 0], duration: 60, wait: true },
    { type: 'playBgm', path: 'assets/audio/bgm/Theme2.ogg' },
    { type: 'saveBgm' },
    { type: 'fadeoutBgm', seconds: 3 },
    { type: 'replayBgm' },
    { type: 'playMovie', path: 'assets/movies/opening.webm' }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.equal(next.pictureRotations?.[1], 5);
  assert.deepEqual(pictureTinted, { id: 1, tone: [68, -34, -34, 0], duration: 60, wait: true });
  assert.equal(playedBgm, 'assets/audio/bgm/Theme2.ogg');
  assert.equal(fadeoutSec, 3);
  assert.equal(bgmSaved, true);
  assert.equal(bgmReplayed, true);
  assert.equal(moviePlayed, 'assets/movies/opening.webm');
});
