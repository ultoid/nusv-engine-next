import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { executeCommands, initialProgress } from '../.electron-dist/src/core/world.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const fixture = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));

test('perintah screen effects memanggil callback EventIO dengan parameter yang benar', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const logs = [];
  const io = {
    showText: async () => {},
    choose: async () => 0,
    tintScreen: async (tone, duration) => { logs.push(`tint:${tone.join(',')}:${duration}`); },
    flashScreen: async (color, duration) => { logs.push(`flash:${color.join(',')}:${duration}`); },
    shakeScreen: async (power, speed, duration) => { logs.push(`shake:${power}:${speed}:${duration}`); },
    fadeoutScreen: async (duration) => { logs.push(`fadeout:${duration}`); },
    fadeinScreen: async (duration) => { logs.push(`fadein:${duration}`); },
    weather: async (type, power, duration) => { logs.push(`weather:${type}:${power}:${duration}`); }
  };

  const commands = [
    { type: 'tintScreen', tone: [34, -34, -68, 170], duration: 60 },
    { type: 'flashScreen', color: [255, 0, 0, 128], duration: 30 },
    { type: 'shakeScreen', power: 7, speed: 5, duration: 45 },
    { type: 'fadeoutScreen', duration: 30 },
    { type: 'fadeinScreen', duration: 30 },
    { type: 'weather', weatherType: 'storm', power: 8, duration: 120 }
  ];

  state = await executeCommands(bundle, state, commands, io);

  assert.deepEqual(logs, [
    'tint:34,-34,-68,170:60',
    'flash:255,0,0,128:30',
    'shake:7:5:45',
    'fadeout:30',
    'fadein:30',
    'weather:storm:8:120'
  ]);
});

test('perintah picture layers 1-100 memanggil show, move, dan erase picture', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const picLogs = [];
  const io = {
    showText: async () => {},
    choose: async () => 0,
    showPicture: async (pic) => { picLogs.push(`show:${pic.id}:${pic.path}:${pic.x},${pic.y}`); },
    movePicture: async (id, duration, x, y) => { picLogs.push(`move:${id}:${duration}:${x},${y}`); },
    erasePicture: async (id) => { picLogs.push(`erase:${id}`); }
  };

  const commands = [
    { type: 'showPicture', picture: { id: 1, path: 'assets/pictures/banner.png', x: 100, y: 50, origin: 'center' } },
    { type: 'movePicture', id: 1, duration: 40, x: 200, y: 150 },
    { type: 'erasePicture', id: 1 }
  ];

  state = await executeCommands(bundle, state, commands, io);

  assert.deepEqual(picLogs, [
    'show:1:assets/pictures/banner.png:100,50',
    'move:1:40:200,150',
    'erase:1'
  ]);
});

test('perintah karakter dan visual feedback memanggil balloon, animation, dan transparency', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const feedbackLogs = [];
  const io = {
    showText: async () => {},
    choose: async () => 0,
    showBalloon: async (target, balloon) => { feedbackLogs.push(`balloon:${target}:${balloon}`); },
    showAnimation: async (target, animId) => { feedbackLogs.push(`anim:${target}:${animId}`); },
    transparency: (val) => { feedbackLogs.push(`transparency:${val}`); }
  };

  const commands = [
    { type: 'showBalloon', target: 'player', balloon: 'exclamation' },
    { type: 'showAnimation', target: 'chest_01', animationId: 'anim.sparkle' },
    { type: 'transparency', value: true }
  ];

  state = await executeCommands(bundle, state, commands, io);

  assert.deepEqual(feedbackLogs, [
    'balloon:player:exclamation',
    'anim:chest_01:anim.sparkle',
    'transparency:true'
  ]);
});

test('perintah audio SE, ME, dan BGS diteruskan ke EventIO', async () => {
  const bundle = loadProject(fixture);
  let state = initialProgress(bundle);

  const audioLogs = [];
  const io = {
    showText: async () => {},
    choose: async () => 0,
    playSe: (path, vol) => { audioLogs.push(`se:${path}:${vol ?? 1}`); },
    stopSe: () => { audioLogs.push('stopSe'); },
    playMe: async (path) => { audioLogs.push(`me:${path}`); },
    playBgs: (path) => { audioLogs.push(`bgs:${path}`); },
    fadeoutBgs: async (seconds) => { audioLogs.push(`fadeBgs:${seconds}`); }
  };

  const commands = [
    { type: 'playSe', path: 'assets/audio/se/Slash1.ogg', volume: 0.8 },
    { type: 'stopSe' },
    { type: 'playMe', path: 'assets/audio/me/Fanfare.ogg' },
    { type: 'playBgs', path: 'assets/audio/bgs/Wind.ogg' },
    { type: 'fadeoutBgs', seconds: 3 }
  ];

  state = await executeCommands(bundle, state, commands, io);

  assert.deepEqual(audioLogs, [
    'se:assets/audio/se/Slash1.ogg:0.8',
    'stopSe',
    'me:assets/audio/me/Fanfare.ogg',
    'bgs:assets/audio/bgs/Wind.ogg',
    'fadeBgs:3'
  ]);
});

test('validation bundle menerima semua perintah audiovisual dan picture MZ', () => {
  const bundle = loadProject(fixture);
  bundle.maps['map.intro'].events[0].pages[0].commands.push(
    { type: 'tintScreen', tone: [0, 0, 0, 0], duration: 10 },
    { type: 'flashScreen', color: [255, 255, 255, 255], duration: 10 },
    { type: 'shakeScreen', power: 5, speed: 5, duration: 10 },
    { type: 'fadeoutScreen', duration: 24 },
    { type: 'fadeinScreen', duration: 24 },
    { type: 'weather', weatherType: 'rain', power: 5, duration: 60 },
    { type: 'showPicture', picture: { id: 2, path: 'assets/pictures/pic.png', x: 0, y: 0 } },
    { type: 'movePicture', id: 2, duration: 10, x: 50, y: 50 },
    { type: 'erasePicture', id: 2 },
    { type: 'showBalloon', target: 'player', balloon: 'heart' },
    { type: 'showAnimation', target: 'player', animationId: 'anim.hit' },
    { type: 'transparency', value: false },
    { type: 'playSe', path: 'assets/audio/se/Item1.ogg' },
    { type: 'stopSe' },
    { type: 'playMe', path: 'assets/audio/me/Victory1.ogg' },
    { type: 'playBgs', path: 'assets/audio/bgs/Sea.ogg' },
    { type: 'fadeoutBgs', seconds: 2 }
  );

  const validated = validateBundle(bundle);
  assert.ok(validated);
});
