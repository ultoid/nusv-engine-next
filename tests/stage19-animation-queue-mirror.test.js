import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMATION_BASE_DELAY,
  ANIMATION_NEXT_DELAY,
  animationShouldMirror,
  computeAnimationSchedule
} from '../.electron-dist/src/core/animations.js';

test('konstanta delay paritas MZ: base 8, next 6', () => {
  assert.equal(ANIMATION_BASE_DELAY, 8);
  assert.equal(ANIMATION_NEXT_DELAY, 6);
});

test('computeAnimationSchedule: kosong, tunggal, dan akumulatif stagger', () => {
  assert.deepEqual(computeAnimationSchedule(0), []);
  assert.deepEqual(computeAnimationSchedule(-3), []);
  assert.deepEqual(computeAnimationSchedule(1), [{ targetIndex: 0, delayFrames: 8 }]);
  assert.deepEqual(computeAnimationSchedule(3), [
    { targetIndex: 0, delayFrames: 8 },
    { targetIndex: 1, delayFrames: 14 },
    { targetIndex: 2, delayFrames: 20 }
  ]);
});

test('computeAnimationSchedule: menghormati baseDelay/nextDelay kustom', () => {
  assert.deepEqual(computeAnimationSchedule(2, { baseDelay: 0, nextDelay: 10 }), [
    { targetIndex: 0, delayFrames: 0 },
    { targetIndex: 1, delayFrames: 10 }
  ]);
  const out = computeAnimationSchedule(4);
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i].delayFrames > out[i - 1].delayFrames);
    assert.equal(out[i].delayFrames - out[i - 1].delayFrames, ANIMATION_NEXT_DELAY);
  }
});

test('animationShouldMirror: target kiri referensi -> true', () => {
  assert.equal(animationShouldMirror(100, 200), true);
  assert.equal(animationShouldMirror(200, 100), false);
  assert.equal(animationShouldMirror(150, 150), false);
});