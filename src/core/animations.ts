import type { ActorData, ActorProgress, BattleAction } from './combat-types.js';
import type { AnimationData, AnimationFlashTiming, AnimationSoundTiming, GameData } from './types.js';

/**
 * Resolves an AnimationData record from GameData by exact ID, numeric/MZ ID, or name.
 * Returns undefined for "None" (0, '0', '', null, undefined) or unresolved IDs.
 */
export function resolveAnimation(
  game: GameData,
  animationId?: string | number | null
): AnimationData | undefined {
  if (animationId === undefined || animationId === null || animationId === '' || animationId === 0 || animationId === '0') {
    return undefined;
  }

  const list = game.animations ?? [];
  if (list.length === 0) return undefined;

  const raw = String(animationId).trim();
  if (!raw || raw === '0') return undefined;

  // 1. Exact ID match (e.g. 'anim.0001')
  const byId = list.find((a) => a.id === raw);
  if (byId) return byId;

  // 2. Numeric / zero-padded MZ ID match (e.g. 6 or '6' -> 'anim.0006', or '0006 Slash Physical')
  const numMatch = raw.match(/^(?:anim\.)?0*(\d+)\b/i);
  if (numMatch) {
    const padded = `anim.${numMatch[1].padStart(4, '0')}`;
    const byPadded = list.find((a) => a.id === padded);
    if (byPadded) return byPadded;
  }

  // 3. Exact or normalized name match (for legacy strings like 'Hit Physical' or '0006 Slash Physical')
  const strippedName = raw.replace(/^\d{4}\s+/, '').toLowerCase();
  const byName = list.find((a) => a.name.toLowerCase() === strippedName);
  if (byName) return byName;

  // 4. Fuzzy fallback on effectName / compacted name (e.g. 'Fire One 1' -> 'Fire One' / 'FireOne1')
  const compact = strippedName.replace(/[\s_-]+/g, '');
  return list.find((a) => {
    const aName = a.name.toLowerCase().replace(/[\s_-]+/g, '');
    const aEff = (a.effectName || '').toLowerCase().replace(/[\s_-]+/g, '');
    return aName === compact || aEff === compact || compact.startsWith(aName);
  });
}

/**
 * Resolves the AnimationData to play for a BattleAction (attack, skill, item, guard).
 * Follows RPG Maker MZ convention where skill/item animationId === -1 delegates to weapon/normal attack.
 */
export function resolveActionAnimation(
  game: GameData,
  action: BattleAction,
  actor?: ActorData,
  actorProgress?: ActorProgress
): AnimationData | undefined {
  if (action.type === 'guard') return undefined;

  if (action.type === 'skill') {
    const skill = game.skills.find((s) => s.id === action.skillId);
    if (skill) {
      const id = skill.animationId;
      if (id !== undefined && id !== -1 && id !== '-1') {
        return resolveAnimation(game, id);
      }
      // If skill uses Normal Attack (-1) or has no animationId, fall through to weapon/normal attack
      if (id === undefined && skill.kind === 'heal') {
        return resolveAnimation(game, 'anim.0015') ?? game.animations?.[0];
      }
    }
  }

  if (action.type === 'item') {
    const item = game.items.find((i) => i.id === action.itemId);
    if (item && item.animationId !== undefined) {
      return resolveAnimation(game, item.animationId);
    }
    return undefined;
  }

  // Normal attack (or skill with animationId === -1): check equipped weapon
  const weaponId = actorProgress?.equipment?.weapon ?? actor?.defaultEquipment?.weapon;
  if (weaponId) {
    const weapon = game.equipment.find((eq) => eq.id === weaponId);
    if (weapon?.animationId !== undefined) {
      return resolveAnimation(game, weapon.animationId);
    }
    if (weapon?.wtypeId !== undefined && game.system?.svAttackMotions) {
      const motion = game.system.svAttackMotions.find((m) => Number(m.weaponTypeId) === Number(weapon.wtypeId));
      if (motion?.animationId !== undefined) {
        return resolveAnimation(game, motion.animationId);
      }
    }
  }

  // Fallback to default Hit Physical (anim.0001) if animations exist
  return resolveAnimation(game, 'anim.0001') ?? game.animations?.[0];
}

/**
 * Computes total animation playback duration in 60fps reference frames,
 * accounting for speed (%) and any sound/flash timings.
 */
export function computeAnimationDurationFrames(anim: AnimationData): number {
  const speed = Math.max(10, Math.min(1000, Number(anim.speed ?? 100)));
  const baseFrames = Math.max(12, Math.round(48 * (100 / speed)));
  const maxSoundFrame = (anim.soundTimings ?? []).reduce((max, st) => Math.max(max, st.frame || 1), 1);
  const maxFlashEnd = (anim.flashTimings ?? []).reduce(
    (max, ft) => Math.max(max, (ft.frame || 1) + (ft.duration || 1)),
    1
  );
  return Math.max(baseFrames, maxSoundFrame + 4, maxFlashEnd);
}

/**
 * Returns all sound and flash timings scheduled to trigger on a given 1-based frame.
 */
export function collectAnimationFrameEvents(
  anim: AnimationData,
  frame: number
): { sounds: AnimationSoundTiming[]; flashes: AnimationFlashTiming[] } {
  const sounds = (anim.soundTimings ?? []).filter((st) => st.frame === frame);
  const flashes = (anim.flashTimings ?? []).filter((ft) => ft.frame === frame);
  return { sounds, flashes };
}

/**
 * Formats an AnimationData entry for editor dropdown labels (e.g., "0001 Hit Physical").
 */
export function formatAnimationLabel(anim: AnimationData, index?: number): string {
  const numMatch = anim.id.match(/(\d+)/);
  const num = numMatch ? numMatch[1].padStart(4, '0') : String((index ?? 0) + 1).padStart(4, '0');
  return `${num} ${anim.name}`;
}
