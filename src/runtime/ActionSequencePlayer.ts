import type { BattleAction } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export class ActionSequencePlayer{
  constructor(private root:HTMLElement,private bundle:ProjectBundle){}
  async play(actions:BattleAction[]){for(const action of actions){const card=this.root.querySelector<HTMLElement>(`[data-battler="${CSS.escape(action.actorId)}"]`);if(!card)continue;const skill=action.type==='skill'?this.bundle.game.skills.find(entry=>entry.id===action.skillId):undefined,steps=skill?.sequence??(action.type==='guard'?['cast'] as const:['approach','impact','return'] as const);for(const step of steps){card.classList.add(`action-${step}`);await wait(document.documentElement.classList.contains('reduced-motion')?1:110);card.classList.remove(`action-${step}`);}}}
}
