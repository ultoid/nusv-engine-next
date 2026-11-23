import type { ActorData, ActorProgress, BaseStats, CombatBonuses, TraitData } from './combat-types.js';
import type { GameData } from './types.js';

const statKeys: Array<keyof BaseStats> = ['str', 'int', 'dex', 'luk', 'agi', 'vit'];
const bonusKeys: Array<keyof CombatBonuses> = [
  'hp', 'mp', 'sp', 'atk', 'def', 'mat', 'mdf', 'agi',
  'hit', 'eva', 'cri', 'cev', 'criticalDamage', 'guard',
  'hpRegen', 'mpRegen', 'spRegen'
];

export function effectiveActor(game: GameData, actor: ActorData, progress?: ActorProgress): ActorData {
  const stats = { ...actor.stats };
  const bonuses = { ...(actor.bonuses ?? {}) };
  const classLevel = progress?.classes[progress.activeClassId]?.level ?? 1;
  const classDef = game.classes?.find((entry) => entry.id === progress?.activeClassId);
  const growth = classDef?.growth ?? actor.classGrowth;

  for (const key of statKeys) {
    stats[key] = Math.max(
      1,
      Math.round(stats[key] + (progress?.allocated[key] ?? 0) + (growth?.[key] ?? 0) * (classLevel - 1))
    );
  }

  let weaponType = actor.weaponType;
  const equippedItems: typeof game.equipment = [];

  for (const itemId of Object.values(progress?.equipment ?? actor.defaultEquipment ?? {})) {
    const item = game.equipment.find((entry) => entry.id === itemId);
    if (!item) continue;
    equippedItems.push(item);
    for (const key of statKeys) stats[key] = Math.max(1, Math.round(stats[key] + (item.stats?.[key] ?? 0)));
    for (const key of bonusKeys) bonuses[key] = (bonuses[key] ?? 0) + (item.bonuses?.[key] ?? 0);
    if (item.slot === 'weapon' && item.weaponType) weaponType = item.weaponType;
  }

  const learned = (actor.classLearnings ?? [])
    .filter((entry) => entry.classId === (progress?.activeClassId ?? actor.classId) && entry.level <= classLevel)
    .map((entry) => entry.skillId);

  // Evaluate traits from actor and equipped items
  const allTraits: TraitData[] = [
    ...(actor.traits ?? []),
    ...equippedItems.flatMap((eq) => eq.traits ?? [])
  ];

  const extraSkills: string[] = [];
  const elementRates: Record<string, 0 | 0.5 | 1 | 2> = { ...(actor.elementRates ?? {}) };
  let targetRate = actor.targetRate ?? 1;
  let attackSkillId = actor.attackSkillId;

  for (const trait of allTraits) {
    if (trait.code === 11) {
      // Element Rate
      const elKey = String(trait.dataId);
      elementRates[elKey] = trait.value as 0 | 0.5 | 1 | 2;
    } else if (trait.code === 21) {
      // Param Rate: 0: mhp, 1: mmp, 2: atk, 3: def, 4: mat, 5: mdf, 6: agi, 7: luk
      const paramKeys: Array<keyof CombatBonuses> = ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi'];
      const pKey = typeof trait.dataId === 'string' ? (trait.dataId as keyof CombatBonuses) : paramKeys[Number(trait.dataId)];
      if (pKey && pKey in bonuses) {
        bonuses[pKey] = (bonuses[pKey] ?? 0) + Math.round(Number(trait.value));
      }
    } else if (trait.code === 22) {
      // Ex-Param: 0: hit, 1: eva, 2: cri, 3: cev, 7: hpRegen, 8: mpRegen, 9: spRegen
      const xparamMap: Record<number | string, keyof CombatBonuses> = {
        0: 'hit',
        1: 'eva',
        2: 'cri',
        3: 'cev',
        7: 'hpRegen',
        8: 'mpRegen',
        9: 'spRegen',
        hit: 'hit',
        eva: 'eva',
        cri: 'cri',
        cev: 'cev',
        hpRegen: 'hpRegen',
        mpRegen: 'mpRegen',
        spRegen: 'spRegen'
      };
      const xKey = xparamMap[trait.dataId];
      if (xKey) {
        bonuses[xKey] = (bonuses[xKey] ?? 0) + Number(trait.value);
      }
    } else if (trait.code === 23) {
      // Sp-Param: 0: targetRate, 1: guard
      if (trait.dataId === 0 || trait.dataId === 'targetRate') {
        targetRate *= Number(trait.value);
      } else if (trait.dataId === 1 || trait.dataId === 'guard') {
        bonuses.guard = (bonuses.guard ?? 0) + Number(trait.value);
      }
    } else if (trait.code === 35) {
      // Attack Skill (RPG Maker MZ)
      attackSkillId = String(trait.dataId);
    } else if (trait.code === 43) {
      // Add Skill
      if (typeof trait.dataId === 'string') {
        extraSkills.push(trait.dataId);
      }
    }
  }

  return {
    ...actor,
    stats,
    bonuses,
    weaponType,
    elementRates,
    targetRate,
    attackSkillId,
    skillIds: [...new Set([...actor.skillIds, ...learned, ...extraSkills])]
  };
}
