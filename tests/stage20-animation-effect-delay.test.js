import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationOverlayPlayer } from '../.electron-dist/src/runtime/AnimationPlayer.js';

// Mock Effekseer + DOM minimal untuk menguji AnimationOverlayPlayer di Node.
function installEffekseerMock({ effectLifeFrames = 30 } = {}) {
  const state = { instances: [], stopAllCalls: 0, drawCalls: 0, frame: 0 };

  class MockHandle {
    constructor() {
      this.alive = true;
      this.age = 0;
    }
    get exists() {
      return this.alive;
    }
    stop() {
      this.alive = false;
    }
    setLocation() {}
    setRotation() {}
    setScale() {}
    setSpeed() {}
  }

  const mockContext = {
    init() {},
    update() {
      for (const h of state.instances) {
        if (h.alive) {
          h.age += 1;
          if (h.age > effectLifeFrames) h.alive = false;
        }
      }
    },
    draw() {
      state.drawCalls += 1;
    },
    setProjectionPerspective() {},
    setCameraLookAt() {},
    setResourceLoader() {},
    releaseEffect() {},
    loadEffect(_data, _scale, onload) {
      setTimeout(() => onload?.(), 0);
      return { isLoaded: true };
    },
    play() {
      const handle = new MockHandle();
      handle.bornFrame = state.frame;
      state.instances.push(handle);
      return handle;
    },
    // Semantics Effekseer: StopAllEffects melepas SEMUA instance yang sedang main.
    stopAll() {
      state.stopAllCalls += 1;
      for (const h of state.instances) h.alive = false;
    }
  };

  const ctx2d = {
    clearRect() {}, fillRect() {}, save() {}, restore() {},
    fillStyle: '', filter: ''
  };
  const mockGl = {
    viewport() {}, clearColor() {}, clear() {}, enable() {}, blendFunc() {},
    getParameter: () => 0, getExtension: () => null,
    createTexture: () => ({}), createBuffer: () => ({}),
    createShader: () => ({}), createProgram: () => ({}),
    bindTexture() {}, texImage2D() {}, texParameteri() {},
    deleteTexture() {}, isContextLost: () => false
  };

  function makeCanvas() {
    return {
      width: 400,
      height: 250,
      className: 'anim-canvas',
      style: {},
      parentElement: null,
      getContext: (kind) => (kind === '2d' ? ctx2d : mockGl),
      getBoundingClientRect: () => ({ width: 400, height: 250, left: 0, top: 0 }),
      insertBefore() {},
      remove() {}
    };
  }

  globalThis.window = globalThis;
  globalThis.effekseer = {
    initRuntime: (_path, onload) => setTimeout(onload, 0),
    createContext: () => mockContext,
    releaseContext() {}
  };
  globalThis.nusvRuntime = { loadAssetData: async () => ({ buffer: new ArrayBuffer(8) }) };
  globalThis.document = { createElement: () => makeCanvas() };

  let rafQueue = [];
  let virtualNow = 1000;
  globalThis.requestAnimationFrame = (cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  globalThis.cancelAnimationFrame = () => {};

  // Virtual clock: satu flush = satu frame @60fps.
  function flushFrames(n) {
    for (let i = 0; i < n; i += 1) {
      const queue = rafQueue;
      rafQueue = [];
      virtualNow += 16.67;
      state.frame += 1;
      for (const cb of queue) cb(virtualNow);
    }
  }

  return { state, makeCanvas, flushFrames };
}

const ANIM = {
  id: 'anim.0001',
  name: 'Slash Physical',
  displayType: 1,
  effectName: 'ClawEffect',
  scale: 100,
  speed: 100,
  offsetX: 0,
  offsetY: 0,
  alignBottom: false,
  rotation: { x: 0, y: 0, z: 0 },
  soundTimings: [
    { frame: 1, se: { name: 'S1' } },
    { frame: 10, se: { name: 'S10' } },
    { frame: 20, se: { name: 'S20' } }
  ],
  flashTimings: [{ frame: 5, duration: 3, color: [255, 0, 0, 255], target: 0 }]
};

async function runPlayer({ delayFrames, frames = 90 }) {
  const { state, makeCanvas, flushFrames } = installEffekseerMock();
  const player = new AnimationOverlayPlayer(makeCanvas());
  const sounds = [];
  const flashes = [];

  const settled = player
    .play(ANIM, {
      delayFrames,
      onSound: (st) => sounds.push(st.se.name),
      onFlash: (ft) => flashes.push(ft.frame)
    })
    .then(() => 'resolved');

  // Beri waktu load efek Effekseer selesai.
  await new Promise((resolve) => setTimeout(resolve, 30));
  for (let f = 0; f < frames; f += 1) {
    flushFrames(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const result = await settled;
  return { state, sounds, flashes, result };
}

test('efek tetap tampil meski animasi punya jeda (delayFrames > 0)', async () => {
  const { state, sounds, flashes, result } = await runPlayer({ delayFrames: 8 });

  assert.ok(state.drawCalls > 0, 'Effekseer harus menggambar frame efek');
  assert.equal(state.instances.length, 1, 'efek harus dibuat');
  assert.ok(
    state.instances[0].bornFrame >= 6,
    `efek harus dibuat setelah jeda selesai (bornFrame=${state.instances[0].bornFrame})`
  );
  assert.deepEqual(sounds, ['S1', 'S10', 'S20'], 'semua suara harus tetap diputar');
  assert.deepEqual(flashes, [5], 'flash harus tetap dipicu');
  assert.equal(result, 'resolved');
});

test('jeda tidak mematikan efek sebelum sempat digambar', async () => {
  const { state } = await runPlayer({ delayFrames: 8 });
  // stopAll()vkalian Effekseer melepas semua instance; jika efek dibunuh saat
  // masih dalam jeda, draw() tidak pernah terpanggil.
  assert.ok(
    state.instances[0].age > 0,
    `efek harus sempat hidup (age=${state.instances[0].age}), bukan dibunuh oleh stopAll()`
  );
});

test('animasi tanpa jeda tetap menggambar efek', async () => {
  const { state, sounds, flashes } = await runPlayer({ delayFrames: 0 });

  assert.ok(state.drawCalls > 0, 'Effekseer harus menggambar frame efek');
  assert.deepEqual(sounds, ['S1', 'S10', 'S20']);
  assert.deepEqual(flashes, [5]);
});
