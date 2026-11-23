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

export interface EnemyData extends ActorData { reward: { gold: number; baseExp?: number; classExp?: number; items?: Record<string, number> }; ai?:'aggressive'|'caster'|'guardian';bossPhases?:BossPhase[]; battlerImage?: string }
export interface SkillData { id: string; name: string; kind: 'physical' | 'magical' | 'heal' | 'revive'; power: number; mpCost?: number; spCost?: number; speed?: number; target: 'enemy' | 'ally'; armorPiercing?: boolean; element?:string; stateId?: string; stateChance?: number;sequence?:Array<'approach'|'cast'|'impact'|'return'>; iconIndex?: number; [key: string]: unknown }
export interface ItemData { id: string; name: string; kind: 'key' | 'heal' | 'revive' | 'stat-reset'; healHp?: number; reviveHpRatio?:number; iconIndex?: number; [key: string]: unknown }
export interface EquipmentData { id:string; name:string; slot:'weapon'|'shield'|'head'|'body'|'accessory'; stats?:Partial<BaseStats>; bonuses?:CombatBonuses; weaponType?:'melee'|'finesse'|'ranged'; iconIndex?: number; traits?: TraitData[]; note?: string; [key: string]: unknown }
export interface TroopData { id: string; name: string; enemyIds: string[] }
export interface StateData { id:string; name:string; duration:number; pdr?:number; mdr?:number; damagePerTurn?:number; preventsAction?:boolean }
export interface ActiveState { id:string; turns:number }
export interface ActorProgress { baseLevel:number; baseExp:number; unspentStatPoints:number; allocated:BaseStats; equipment:Record<string,string>; activeClassId:string; classes:Record<string,{level:number;exp:number;tier:1|2|3|4|5}> }
export interface DerivedStats { maxHp: number; maxMp: number; maxSp: number; atk: number; def: number; mat: number; mdf: number; actionSpeed: number; hit: number; eva: number; cri: number; cev: number; criticalDamage: number; guard: number; hpRegen: number; mpRegen: number; spRegen: number }
export interface ResourceState { hp: number; mp: number; sp: number }
export interface BattleBattler extends ResourceState { instanceId: string; definitionId: string; side: 'party' | 'enemy'; guarded: boolean; states:ActiveState[]; combat:ActorData; phaseId?:string }
export type BattleAction = { actorId: string; type: 'attack' | 'guard'; targetId?: string } | { actorId: string; type: 'skill'; skillId: string; targetId: string } | { actorId: string; type: 'item'; itemId: string; targetId: string };
export interface BattleState { seed: number; round: number; status: 'active' | 'victory' | 'defeat'; battlers: BattleBattler[]; ctbCharge:Record<string,number>; inventory: Record<string, number>; goldReward: number; baseExpReward:number; classExpReward:number; itemRewards: Record<string, number>; log: string[];turnsTaken:number;damageTaken:number }
