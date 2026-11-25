import { resolveActionAnimation } from '../core/animations.js';
import type { BattleAction, BattleState } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import type { AnimationAnchor, AnimationOverlayPlayer } from './AnimationPlayer.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ActionSequencePlayer {
  constructor(
    private root: HTMLElement,
    private bundle: ProjectBundle,
    private animPlayer?: AnimationOverlayPlayer,
    private animCanvas?: HTMLCanvasElement
  ) {}

  private targetAnchor(targetEl: HTMLElement | null): AnimationAnchor | undefined {
    if (!targetEl || !this.animCanvas) return undefined;
    const canvasRect = this.animCanvas.getBoundingClientRect();
    const rect = targetEl.getBoundingClientRect();
    const sprite = targetEl.querySelector<HTMLElement>('.battler-sprite');
    const spriteRect = sprite ? sprite.getBoundingClientRect() : rect;
    return {
      x: spriteRect.left - canvasRect.left + spriteRect.width / 2,
      y: spriteRect.top - canvasRect.top + spriteRect.height / 2,
      bottomY: spriteRect.bottom - canvasRect.top
    };
  }

  async play(actions: BattleAction[], state?: BattleState) {
    const reducedMotion = document.documentElement.classList.contains('reduced-motion');
    for (const action of actions) {
      const card = this.root.querySelector<HTMLElement>(`[data-battler="${CSS.escape(action.actorId)}"]`);
      const skill = action.type === 'skill' ? this.bundle.game.skills.find(entry => entry.id === action.skillId) : undefined;
      const steps = skill?.sequence ?? (action.type === 'guard' ? (['cast'] as const) : (['approach', 'impact', 'return'] as const));

      const actorBattler = state?.battlers.find(b => b.instanceId === action.actorId);
      const anim = resolveActionAnimation(this.bundle.game, action, actorBattler?.combat);
      const targetCard = action.type !== 'guard' && action.targetId
        ? this.root.querySelector<HTMLElement>(`[data-battler="${CSS.escape(action.targetId)}"]`)
        : null;

      for (const step of steps) {
        if (card) card.classList.add(`action-${step}`);
        if (step === 'impact' && anim && this.animPlayer) {
          const anchor = this.targetAnchor(targetCard ?? card);
          await this.animPlayer.play(anim, {
            anchor,
            targetElement: targetCard ?? card,
            reducedMotion
          });
        } else {
          await wait(reducedMotion ? 1 : 110);
        }
        if (card) card.classList.remove(`action-${step}`);
      }
    }
  }
}
