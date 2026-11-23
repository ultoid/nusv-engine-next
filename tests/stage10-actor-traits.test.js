import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadProject } from '../.electron-dist/electron/project-service.js';
import { validateBundle } from '../.electron-dist/src/core/validation.js';
import { effectiveActor } from '../.electron-dist/src/core/equipment.js';
import { initialActorProgress } from '../.electron-dist/src/core/progression.js';
import {
  TRAIT_ELEMENT_RATE,
  TRAIT_PARAM,
  TRAIT_XPARAM,
  TRAIT_SPARAM,
  TRAIT_SKILL_ADD,
  TRAIT_ATTACK_SKILL
} from '../.electron-dist/src/core/combat-types.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, '..', 'fixtures', 'stage0-safe-project');

test('effectiveActor mengaplikasikan traits RPG Maker MZ secara akurat', () => {
  const bundle = loadProject(fixture);
  const baseActor = bundle.game.actors[0];

  const actorWithTraits = {
    ...baseActor,
    traits: [
      { code: TRAIT_ELEMENT_RATE, dataId: 'fire', value: 0.5 },
      { code: TRAIT_PARAM, dataId: 'atk', value: 15 },
      { code: TRAIT_XPARAM, dataId: 'hit', value: 0.1 },
      { code: TRAIT_XPARAM, dataId: 'cri', value: 0.05 },
      { code: TRAIT_SPARAM, dataId: 0, value: 0.8 }, // targetRate (TGR)
      { code: TRAIT_SKILL_ADD, dataId: 'skill.power-strike', value: 1 },
      { code: TRAIT_ATTACK_SKILL, dataId: 'skill.double-slash', value: 1 }
    ]
  };

  const effectiveBase = effectiveActor(bundle.game, baseActor);
  const effective = effectiveActor(bundle.game, actorWithTraits);

  assert.equal(effective.elementRates?.fire, 0.5, 'Element rate fire harus 0.5');
  assert.equal(effective.bonuses?.atk, (effectiveBase.bonuses?.atk ?? 0) + 15, 'Bonus ATK dari param rate harus bertambah +15');
  assert.equal(effective.bonuses?.hit, (effectiveBase.bonuses?.hit ?? 0) + 0.1, 'Bonus Hit rate harus bertambah +0.1');
  assert.equal(effective.bonuses?.cri, (effectiveBase.bonuses?.cri ?? 0) + 0.05, 'Bonus Cri rate harus bertambah +0.05');
  assert.ok(Math.abs((effective.targetRate ?? 1) - (effectiveBase.targetRate ?? 1) * 0.8) < 0.0001, 'Target rate harus dikalikan 0.8');
  assert.ok(effective.skillIds.includes('skill.power-strike'), 'Extra skill dari trait harus ditambahkan');
  assert.equal(effective.attackSkillId, 'skill.double-slash', 'Attack skill id harus di-override oleh TRAIT_ATTACK_SKILL');
});

test('initialActorProgress menghormati initialLevel dari actor data', () => {
  const bundle = loadProject(fixture);
  const baseActor = { ...bundle.game.actors[0], initialLevel: 5, maxLevel: 50 };

  const progress = initialActorProgress(baseActor);
  assert.equal(progress.baseLevel, 5, 'Base level harus sesuai initialLevel');
  assert.equal(progress.classes[progress.activeClassId].level, 5, 'Class level harus sesuai initialLevel');
});

test('validateBundle menerima actor dengan field RPG Maker MZ lengkap', () => {
  const bundle = loadProject(fixture);
  const actor = bundle.game.actors[0];

  actor.nickname = 'The Brave';
  actor.profile = 'Seorang pendekar muda.';
  actor.initialLevel = 3;
  actor.maxLevel = 90;
  actor.note = '<meta_tag: 123>';
  actor.traits = [
    { code: 11, dataId: 'ice', value: 1.0 },
    { code: 22, dataId: 0, value: 0.05 }
  ];

  // Tambahkan item shield
  bundle.game.equipment.push({
    id: 'equip.test-shield',
    name: 'Iron Shield',
    slot: 'shield',
    bonuses: { def: 10 }
  });
  actor.defaultEquipment = {
    ...actor.defaultEquipment,
    shield: 'equip.test-shield'
  };

  assert.doesNotThrow(() => {
    validateBundle(bundle);
  }, 'Bundle dengan field actor MZ dan shield harus lolos validasi');
});
