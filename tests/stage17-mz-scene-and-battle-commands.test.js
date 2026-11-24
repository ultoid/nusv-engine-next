import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('RPG Maker MZ Scene Control & System Settings Commands', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);
  const actorId = bundle.project.party[0];

  let menuOpened = false;
  let saveOpened = false;
  let returnTitle = false;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    nameInput: async (id, maxDigits) => 'Alisa',
    openMenu: async () => { menuOpened = true; },
    openSave: async () => { saveOpened = true; },
    returnToTitle: async () => { returnTitle = true; }
  };

  const commands = [
    { type: 'nameInput', actorId, maxDigits: 8 },
    { type: 'openMenu' },
    { type: 'openSave' },
    { type: 'returnToTitle' },
    { type: 'changeBattleBgm', path: 'assets/audio/bgm/Battle2.ogg' },
    { type: 'changeVictoryMe', path: 'assets/audio/me/Fanfare.ogg' },
    { type: 'changeDefeatMe', path: 'assets/audio/me/Gameover.ogg' },
    { type: 'changeVehicleBgm', vehicleType: 'airship', path: 'assets/audio/bgm/Ship2.ogg' },
    { type: 'changeSaveAccess', enabled: false },
    { type: 'changeMenuAccess', enabled: false },
    { type: 'changeEncounter', enabled: false },
    { type: 'changeFormationAccess', enabled: false },
    { type: 'changeWindowColor', tone: [34, -34, 68] },
    { type: 'changeActorImages', actorId, characterName: 'Actor2', characterIndex: 1, faceName: 'Actor2', faceIndex: 1 },
    { type: 'changeVehicleImage', vehicleType: 'boat', imageName: 'Vehicle2', imageIndex: 3 }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.equal(next.actorOverrides?.[actorId]?.name, 'Alisa');
  assert.equal(menuOpened, true);
  assert.equal(saveOpened, true);
  assert.equal(returnTitle, true);
  assert.equal(next.systemSettings?.battleBgm, 'assets/audio/bgm/Battle2.ogg');
  assert.equal(next.systemSettings?.victoryMe, 'assets/audio/me/Fanfare.ogg');
  assert.equal(next.systemSettings?.defeatMe, 'assets/audio/me/Gameover.ogg');
  assert.equal(next.systemSettings?.vehicleBgm?.airship, 'assets/audio/bgm/Ship2.ogg');
  assert.equal(next.systemSettings?.saveEnabled, false);
  assert.equal(next.systemSettings?.menuEnabled, false);
  assert.equal(next.systemSettings?.encounterEnabled, false);
  assert.equal(next.systemSettings?.formationEnabled, false);
  assert.deepEqual(next.systemSettings?.windowColor, [34, -34, 68]);
  assert.equal(next.actorImages?.[actorId]?.characterName, 'Actor2');
  assert.equal(next.vehicleImages?.boat?.imageName, 'Vehicle2');
});

test('RPG Maker MZ Map, Battle & Advanced Commands', async () => {
  const { executeCommands, initialProgress } = await import('../.electron-dist/src/core/world.js');
  const bundle = loadProject(fixture);
  const state = initialProgress(bundle);

  let battleAnimCalled = false;
  let forceActionCalled = false;
  let battleAborted = false;
  let pluginExecuted = false;

  const io = {
    showText: async () => {},
    choose: async () => 0,
    battle: async () => ({ victory: true, actorResources: {}, actorProgress: {}, inventory: {}, gold: 0 }),
    showBattleAnimation: async (enemyIndex, animId) => { battleAnimCalled = true; },
    forceAction: async (battler, index, skillId) => { forceActionCalled = true; },
    abortBattle: () => { battleAborted = true; },
    pluginCommand: async (pName, cName) => { pluginExecuted = true; }
  };

  const commands = [
    { type: 'changeMapNameDisplay', enabled: false },
    { type: 'changeTileset', tilesetId: 'tileset.dungeon' },
    { type: 'changeBattleBack', battleback1Name: 'Cobblestones', battleback2Name: 'Fort' },
    { type: 'changeParallax', name: 'StarlitSky', loopX: true, loopY: false },
    { type: 'getLocationInfo', variableId: 'loc.terrain', infoType: 'terrainTag', x: 1, y: 1 },
    { type: 'changeEnemyHp', enemyIndex: 0, operation: 'sub', amount: 30, allowKnockout: true },
    { type: 'changeEnemyMp', enemyIndex: 0, operation: 'add', amount: 25 },
    { type: 'changeEnemyTp', enemyIndex: 0, operation: 'add', amount: 15 },
    { type: 'changeEnemyState', enemyIndex: 0, operation: 'add', stateId: 'state.poison' },
    { type: 'enemyTransform', enemyIndex: 0, enemyId: 'enemy.goblin' },
    { type: 'enemyAppear', enemyIndex: 1 },
    { type: 'showBattleAnimation', enemyIndex: 0, animationId: 'anim.slash' },
    { type: 'forceAction', battler: 'actor', index: 0, skillId: 'skill.attack' },
    { type: 'abortBattle' },
    { type: 'pluginCommand', pluginName: 'TestPlugin', commandName: 'testAction' }
  ];

  const next = await executeCommands(bundle, state, commands, io);

  assert.equal(next.mapNameDisplay, false);
  assert.equal(next.activeTilesetId, 'tileset.dungeon');
  assert.equal(next.battleBack?.battleback1, 'Cobblestones');
  assert.equal(next.parallax?.name, 'StarlitSky');
  assert.equal(next.parallax?.loopX, true);
  assert.ok(typeof next.variables['loc.terrain'] === 'number');
  assert.equal(next.enemyBattleState?.[0]?.hp, 70);
  assert.equal(next.enemyBattleState?.[0]?.mp, 75);
  assert.equal(next.enemyBattleState?.[0]?.tp, 15);
  assert.ok(next.enemyBattleState?.[0]?.states?.includes('state.poison'));
  assert.equal(next.enemyBattleState?.[0]?.enemyId, 'enemy.goblin');
  assert.equal(next.enemyBattleState?.[1]?.hidden, false);
  assert.equal(battleAnimCalled, true);
  assert.equal(forceActionCalled, true);
  assert.equal(battleAborted, true);
  assert.equal(pluginExecuted, true);
});

test('RPG Maker MZ Validation: Semua 31 perintah Tab 3 baru valid dalam bundle', () => {
  const bundle = loadProject(fixture);
  const mapId = bundle.project.maps[0];
  const map = bundle.maps[mapId];

  map.events[0].pages[0].commands.push(
    { type: 'nameInput', actorId: bundle.project.party[0], maxDigits: 8 },
    { type: 'openMenu' },
    { type: 'openSave' },
    { type: 'returnToTitle' },
    { type: 'changeBattleBgm', path: 'assets/audio/bgm/Battle1.ogg' },
    { type: 'changeVictoryMe', path: 'assets/audio/me/Victory1.ogg' },
    { type: 'changeDefeatMe', path: 'assets/audio/me/Defeat1.ogg' },
    { type: 'changeVehicleBgm', vehicleType: 'boat', path: 'assets/audio/bgm/Ship1.ogg' },
    { type: 'changeSaveAccess', enabled: true },
    { type: 'changeMenuAccess', enabled: true },
    { type: 'changeEncounter', enabled: true },
    { type: 'changeFormationAccess', enabled: true },
    { type: 'changeWindowColor', tone: [0, 0, 0] },
    { type: 'changeActorImages', actorId: bundle.project.party[0] },
    { type: 'changeVehicleImage', vehicleType: 'boat', imageName: 'Vehicle', imageIndex: 0 },
    { type: 'changeMapNameDisplay', enabled: true },
    { type: 'changeTileset', tilesetId: bundle.game.tilesets?.[0]?.id ?? 'tileset.overworld' },
    { type: 'changeBattleBack' },
    { type: 'changeParallax', name: 'Mountains' },
    { type: 'getLocationInfo', variableId: 'var.loc', infoType: 'terrainTag', x: 0, y: 0 },
    { type: 'changeEnemyHp', enemyIndex: 0, operation: 'add', amount: 10 },
    { type: 'changeEnemyMp', enemyIndex: 0, operation: 'add', amount: 10 },
    { type: 'changeEnemyTp', enemyIndex: 0, operation: 'add', amount: 10 },
    { type: 'changeEnemyState', enemyIndex: 0, operation: 'add', stateId: bundle.game.states?.[0]?.id ?? 'state.poison' },
    { type: 'enemyRecoverAll', enemyIndex: 0 },
    { type: 'enemyAppear', enemyIndex: 0 },
    { type: 'enemyTransform', enemyIndex: 0, enemyId: bundle.game.enemies?.[0]?.id ?? 'enemy.slime' },
    { type: 'showBattleAnimation', enemyIndex: 0, animationId: 'anim.slash' },
    { type: 'forceAction', battler: 'actor', index: 0, skillId: bundle.game.skills?.[0]?.id ?? 'skill.attack' },
    { type: 'abortBattle' },
    { type: 'pluginCommand', pluginName: 'Test', commandName: 'run' }
  );

  const validated = validateBundle(bundle);
  assert.ok(validated);
});
