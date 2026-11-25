import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadProject } from '../.electron-dist/electron/project-service.js';
import {
  resolveAnimation,
  resolveActionAnimation,
  computeAnimationDurationFrames,
  collectAnimationFrameEvents,
  formatAnimationLabel,
  ANIMATION_BASE_DELAY,
  ANIMATION_NEXT_DELAY,
  computeAnimationSchedule,
  animationShouldMirror
} from '../.electron-dist/src/core/animations.js';
import { inferAssetCategory } from '../.electron-dist/src/core/resource-manager.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'stage0-safe-project');

test('resolveAnimation memetakan ID exact, numeric MZ, nama, dan legacy string', () => {
  const bundle = loadProject(fixture);
  const game = bundle.game;

  assert.equal(resolveAnimation(game, undefined), undefined);
  assert.equal(resolveAnimation(game, 0), undefined);
  assert.equal(resolveAnimation(game, '0'), undefined);

  assert.equal(resolveAnimation(game, 'anim.0001')?.name, 'Hit Physical');
  assert.equal(resolveAnimation(game, 6)?.id, 'anim.0006');
  assert.equal(resolveAnimation(game, '0006 Slash Physical')?.id, 'anim.0006');
  assert.equal(resolveAnimation(game, 'pierce ice')?.id, 'anim.0014');
  assert.equal(formatAnimationLabel(game.animations[2]), '0014 Pierce Ice');
});

test('resolveActionAnimation menghormati skill, item, weapon fallback, dan guard', () => {
  const bundle = loadProject(fixture);
  const game = structuredClone(bundle.game);

  game.equipment.push({
    id: 'equip.test-blade',
    name: 'Test Blade',
    slot: 'weapon',
    animationId: 'anim.0006'
  });
  game.skills.push({
    id: 'skill.ice-lance',
    name: 'Ice Lance',
    kind: 'magical',
    power: 1.5,
    target: 'enemy',
    animationId: 'anim.0014'
  });
  game.skills.push({
    id: 'skill.weapon-art',
    name: 'Weapon Art',
    kind: 'physical',
    power: 1.4,
    target: 'enemy',
    animationId: -1
  });
  game.items.push({
    id: 'item.fire-bomb',
    name: 'Fire Bomb',
    kind: 'key',
    animationId: 'anim.0001'
  });

  const actor = { ...game.actors[0], defaultEquipment: { weapon: 'equip.test-blade' } };

  assert.equal(resolveActionAnimation(game, { actorId: actor.id, type: 'guard' }, actor), undefined);
  assert.equal(resolveActionAnimation(game, { actorId: actor.id, type: 'attack', targetId: 'e1' }, actor)?.id, 'anim.0006');
  assert.equal(resolveActionAnimation(game, { actorId: actor.id, type: 'skill', skillId: 'skill.ice-lance', targetId: 'e1' }, actor)?.id, 'anim.0014');
  assert.equal(resolveActionAnimation(game, { actorId: actor.id, type: 'skill', skillId: 'skill.weapon-art', targetId: 'e1' }, actor)?.id, 'anim.0006');
  assert.equal(resolveActionAnimation(game, { actorId: actor.id, type: 'item', itemId: 'item.fire-bomb', targetId: actor.id }, actor)?.id, 'anim.0001');
});

test('computeAnimationDurationFrames dan collectAnimationFrameEvents mengikuti speed dan timing MZ', () => {
  const bundle = loadProject(fixture);
  const pierceIce = bundle.game.animations.find(a => a.id === 'anim.0014');
  assert.ok(pierceIce);

  const normalDuration = computeAnimationDurationFrames(pierceIce);
  const fastDuration = computeAnimationDurationFrames({ ...pierceIce, speed: 200, flashTimings: [] });
  assert.ok(normalDuration >= 48);
  assert.ok(fastDuration < normalDuration);

  const f1 = collectAnimationFrameEvents(pierceIce, 1);
  assert.equal(f1.sounds.length, 1);
  assert.equal(f1.sounds[0].se.name, 'Thunder1');
  assert.equal(f1.flashes.length, 1);
  assert.deepEqual(f1.flashes[0].color, [119, 187, 255, 221]);

  const f4 = collectAnimationFrameEvents(pierceIce, 4);
  assert.equal(f4.sounds[0].se.name, 'Ice3');
  assert.equal(f4.flashes[0].color[0], 187);
});

test('paritas MZ: konstanta delay, stagger schedule, dan mirror', () => {
  assert.equal(ANIMATION_BASE_DELAY, 8);
  assert.equal(ANIMATION_NEXT_DELAY, 12);
  assert.deepEqual(computeAnimationSchedule(0), []);
  assert.deepEqual(computeAnimationSchedule(1), [{ targetIndex: 0, delayFrames: 8 }]);
  assert.deepEqual(computeAnimationSchedule(2).map(e => e.delayFrames), [8, 20]);
  assert.equal(animationShouldMirror(100, 200), true);
  assert.equal(animationShouldMirror(300, 200), false);
  assert.equal(animationShouldMirror(200, 200), false);
});

test('inferAssetCategory mengenali folder effects dan berkas .efkefc/.efkmodel', () => {
  assert.equal(inferAssetCategory('assets/effects/FireOne1.efkefc'), 'effects');
  assert.equal(inferAssetCategory('assets/effects/Sword.efkmodel'), 'effects');
});
