export interface BaseStats { str: number; int: number; dex: number; luk: number; agi: number; vit: number }
export interface CombatBase { hp: number; mp: number; atk: number; def: number; mat: number; mdf: number; agi: number }
export interface CombatBonuses { hp?: number; mp?: number; sp?: number; atk?: number; def?: number; mat?: number; mdf?: number; agi?: number; hit?: number; eva?: number; cri?: number; cev?: number; criticalDamage?: number; guard?: number; hpRegen?: number; mpRegen?: number; spRegen?: number }
export interface BossPhase { id:string;name:string;hpRatio:number;bonuses?:CombatBonuses;skillIds?:string[] }

export interface TraitData {
  code: number;
  dataId: number | string;
  value: number;
}

// RPG Maker MZ Standard Trait Codes
export const TRAIT_ELEMENT_RATE = 11;
export const TRAIT_DEBUFF_RATE = 12;
export const TRAIT_STATE_RATE = 13;
export const TRAIT_STATE_RESIST = 14;
export const TRAIT_PARAM = 21;
export const TRAIT_XPARAM = 22;
export const TRAIT_SPARAM = 23;
export const TRAIT_ATTACK_ELEMENT = 31;
export const TRAIT_ATTACK_STATE = 32;
export const TRAIT_ATTACK_SPEED = 33;
export const TRAIT_ATTACK_TIMES = 34;
export const TRAIT_ATTACK_SKILL = 35;
export const TRAIT_STYPE_ADD = 41;
export const TRAIT_STYPE_SEAL = 42;
export const TRAIT_SKILL_ADD = 43;
export const TRAIT_SKILL_SEAL = 44;
export const TRAIT_EQUIP_WTYPE = 51;
export const TRAIT_EQUIP_ATYPE = 52;
export const TRAIT_EQUIP_LOCK = 53;
export const TRAIT_EQUIP_SEAL = 54;
export const TRAIT_SLOT_TYPE = 55;
export const TRAIT_ACTION_PLUS = 61;
export const TRAIT_SPECIAL_FLAG = 62;
export const TRAIT_COLLAPSE_TYPE = 63;
export const TRAIT_PARTY_ABILITY = 64;

export interface ActorData {
  id: string;
  name: string;
  nickname?: string;
  classId?: string;
  initialLevel?: number;
  maxLevel?: number;
  profile?: string;
  characterName?: string;
  characterIndex?: number;
  faceName?: string;
  faceIndex?: number;
  battlerName?: string;
  characterImage?: string;
  faceImage?: string;
  battlerImage?: string;
  equips?: string[];
  defaultEquipment?: Record<string, string>;
  traits?: TraitData[];
  attackSkillId?: string;
  note?: string;
  stats: BaseStats;
  base: CombatBase;
  bonuses?: CombatBonuses;
  weaponType?: 'melee' | 'finesse' | 'ranged';
  skillIds: string[];
  classTier?: 1|2|3|4|5;
  availableClassIds?: string[];
  classGrowth?: Partial<BaseStats>;
  classLearnings?: Array<{ classId: string; level: number; skillId: string }>;
  elementRates?: Record<string, 0|0.5|1|2>;
  targetRate?: number;
  [key: string]: unknown;
}

export interface EnemyDropItem {
  kind: 'item' | 'weapon' | 'armor';
  dataId: string;
  denominator: number;
}

export interface EnemyAction {
  skillId: string;
  rating: number;
  conditionType?: 'always' | 'turn' | 'hp' | 'mp' | 'state' | 'level' | 'switch' | number;
  conditionParam1?: number | string;
  conditionParam2?: number;
}

export interface EnemyData extends ActorData {
  reward: { gold: number; baseExp?: number; classExp?: number; items?: Record<string, number> };
  ai?: 'aggressive' | 'caster' | 'guardian';
  bossPhases?: BossPhase[];
  battlerImage?: string;
  battlerName?: string;
  battlerHue?: number;
  params?: number[];
  exp?: number;
  gold?: number;
  dropItems?: EnemyDropItem[];
  actions?: EnemyAction[];
}

export interface SkillDamage {
  type: number; // 0: None, 1: HP Damage, 2: MP Damage, 3: HP Recover, 4: MP Recover, 5: HP Drain, 6: MP Drain
  elementId?: number | string; // -1: Normal Attack, 0: None, 1..: Element ID
  formula?: string;
  variance?: number;
  critical?: boolean;
}

export interface SkillEffect {
  code: number;
  dataId: number | string;
  value1: number;
  value2: number;
}

export interface SkillData {
  id: string;
  name: string;
  kind: 'physical' | 'magical' | 'heal' | 'revive';
  power: number;
  mpCost?: number;
  spCost?: number;
  tpCost?: number;
  tpGain?: number;
  speed?: number;
  target: 'enemy' | 'ally';
  scope?: number | string;
  occasion?: 'always' | 'battle' | 'menu' | 'never' | number;
  armorPiercing?: boolean;
  element?: string;
  stateId?: string;
  stateChance?: number;
  sequence?: Array<'approach' | 'cast' | 'impact' | 'return'>;
  iconIndex?: number;
  description?: string;
  animationId?: string | number;
  note?: string;

  // RPG Maker MZ Standard Fields
  stypeId?: number;
  successRate?: number;
  repeats?: number;
  hitType?: number;
  message1?: string;
  message2?: string;
  requiredWtypeId1?: number | string;
  requiredWtypeId2?: number | string;
  damage?: SkillDamage;
  effects?: SkillEffect[];
  [key: string]: unknown;
}

export interface ItemData {
  id: string;
  name: string;
  kind: 'key' | 'heal' | 'revive' | 'stat-reset' | 'buff' | string;
  healHp?: number;
  reviveHpRatio?: number;
  iconIndex?: number;
  price?: number;
  consumable?: boolean;
  scope?: number | string;
  occasion?: 'always' | 'battle' | 'menu' | 'never' | number;
  description?: string;
  animationId?: string | number;
  note?: string;

  // RPG Maker MZ Standard Fields
  itypeId?: number; // 1: Regular Item, 2: Key Item, 3: Hidden Item A, 4: Hidden Item B
  speed?: number;
  successRate?: number;
  repeats?: number;
  tpGain?: number;
  hitType?: number; // 0: Certain Hit, 1: Physical Attack, 2: Magical Attack
  damage?: SkillDamage;
  effects?: SkillEffect[];
  [key: string]: unknown;
}

export interface EquipmentData {
  id: string;
  name: string;
  slot: 'weapon' | 'shield' | 'head' | 'body' | 'accessory';
  stats?: Partial<BaseStats>;
  bonuses?: CombatBonuses;
  weaponType?: 'melee' | 'finesse' | 'ranged';
  price?: number;
  iconIndex?: number;
  traits?: TraitData[];
  description?: string;
  animationId?: string | number;
  wtypeId?: number;
  atypeId?: number;
  etypeId?: number;
  params?: number[]; // [mhp, mmp, atk, def, mat, mdf, agi, luk]
  note?: string;
  [key: string]: unknown;
}

export interface TroopMember {
  enemyId: string;
  x?: number;
  y?: number;
  hidden?: boolean;
}

export interface TroopPageConditions {
  turnEnding?: boolean;
  turnValid?: boolean;
  turnA?: number;
  turnB?: number;
  enemyValid?: boolean;
  enemyIndex?: number;
  enemyHp?: number;
  actorValid?: boolean;
  actorId?: string;
  actorHp?: number;
  switchValid?: boolean;
  switchId?: string;
}

export interface TroopPage {
  conditions: TroopPageConditions;
  span: 'battle' | 'turn' | 'moment';
  commands: unknown[];
}

export interface TroopData {
  id: string;
  name: string;
  enemyIds: string[];
  members?: TroopMember[];
  battleback1?: string;
  battleback2?: string;
  battleback1Name?: string;
  battleback2Name?: string;
  pages?: TroopPage[];
  [key: string]: unknown;
}

export interface StateData {
  id: string;
  name: string;
  duration: number;
  pdr?: number;
  mdr?: number;
  damagePerTurn?: number;
  preventsAction?: boolean;
  iconIndex?: number;
  restriction?: 'none' | 'attackEnemy' | 'attackAnyone' | 'attackAlly' | 'cannotMove' | number;
  priority?: number;
  motion?: number;
  overlay?: number;
  removeAtBattleEnd?: boolean;
  removeByRestriction?: boolean;
  autoRemovalTiming?: number;
  minTurns?: number;
  maxTurns?: number;
  removeByDamage?: boolean;
  chanceByDamage?: number;
  removeByWalking?: boolean;
  stepsToRemove?: number;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  traits?: TraitData[];
  note?: string;
  [key: string]: unknown;
}
export interface ActiveState { id:string; turns:number }
export interface ActorProgress { baseLevel:number; baseExp:number; unspentStatPoints:number; allocated:BaseStats; equipment:Record<string,string>; activeClassId:string; classes:Record<string,{level:number;exp:number;tier:1|2|3|4|5}> }
export interface DerivedStats { maxHp: number; maxMp: number; maxSp: number; atk: number; def: number; mat: number; mdf: number; actionSpeed: number; hit: number; eva: number; cri: number; cev: number; criticalDamage: number; guard: number; hpRegen: number; mpRegen: number; spRegen: number }
export interface ResourceState { hp: number; mp: number; sp: number }
export interface BattleBattler extends ResourceState { instanceId: string; definitionId: string; side: 'party' | 'enemy'; guarded: boolean; states:ActiveState[]; combat:ActorData; phaseId?:string }
export type BattleAction = { actorId: string; type: 'attack' | 'guard'; targetId?: string } | { actorId: string; type: 'skill'; skillId: string; targetId: string } | { actorId: string; type: 'item'; itemId: string; targetId: string };
export interface BattleState { seed: number; round: number; status: 'active' | 'victory' | 'defeat'; battlers: BattleBattler[]; ctbCharge:Record<string,number>; inventory: Record<string, number>; goldReward: number; baseExpReward:number; classExpReward:number; itemRewards: Record<string, number>; log: string[];turnsTaken:number;damageTaken:number }
