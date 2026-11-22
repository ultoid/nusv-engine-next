import type { ProgressState } from '../core/types.js';
export class DebugOverlay{
  private root=document.createElement('pre');private lines:string[]=[];private visible=false;
  constructor(initial=false){this.root.className='debug-overlay';this.root.hidden=true;document.body.append(this.root);if(initial)this.toggle();}
  toggle(){this.visible=!this.visible;this.root.hidden=!this.visible;}
  log(message:string){this.lines.push(`${new Date().toLocaleTimeString()} ${message}`);this.lines=this.lines.slice(-14);}
  draw(state:ProgressState){if(!this.visible)return;const switches=Object.entries(state.switches).filter(([,value])=>value).map(([key])=>key).join(', ')||'—',variables=Object.entries(state.variables).map(([key,value])=>`${key}=${value}`).join(', ')||'—',quests=Object.entries(state.quests).map(([id,value])=>`${id}:${value.status}`).join(', ')||'—',telemetry=`${state.telemetry.victories}/${state.telemetry.battles} win · ${state.telemetry.turns} turns · ${state.telemetry.damageTaken} dmg`;this.root.textContent=`NUSV DEBUG · F3\nmap ${state.mapId} @ ${state.x},${state.y} facing ${state.facing}\nswitches: ${switches}\nvariables: ${variables}\nquests: ${quests}\ngold: ${state.gold}\ntelemetry: ${telemetry}\n\nEVENT / BATTLE LOG\n${this.lines.join('\n')||'—'}`;}
  destroy(){this.root.remove();}
}
