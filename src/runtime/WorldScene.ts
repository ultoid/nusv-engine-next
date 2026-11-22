import { Container,Graphics,Text } from 'pixi.js';
import type { ProgressState,ProjectBundle } from '../core/types.js';
import { autotileMask, tileDefinition } from '../core/map-layers.js';
import { activePage,directionDelta,eventAt,eventPosition,executeCommands,initialProgress,move,type Direction } from '../core/world.js';
import { AdventureController,applyRuntimeSettings } from './AdventureController.js';
import type { AudioManager } from './AudioManager.js';
import { BattleController } from './BattleController.js';
import { DebugOverlay } from './DebugOverlay.js';
import { DialogueController } from './DialogueController.js';
import type { InputManager } from './InputManager.js';
import { PartyController } from './PartyController.js';
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export class WorldScene{
  readonly view=new Container();private world=new Container();private label?:Text;private state:ProgressState;private busy=false;private dialogue=new DialogueController();private battle:BattleController;private party:PartyController;private debug:DebugOverlay;private adventure:AdventureController;
  constructor(private readonly bundle:ProjectBundle,private audio:AudioManager){this.state=initialProgress(bundle);applyRuntimeSettings(this.state.settings);this.audio.setMix(this.state.settings);this.debug=new DebugOverlay(bundle.project.debug===true);this.battle=new BattleController(bundle,message=>{this.debug.log(message);this.debug.draw(this.state);});this.party=new PartyController(bundle);this.adventure=new AdventureController(bundle,settings=>this.audio.setMix(settings));this.debug.log(`playtest start: ${this.state.mapId}`);}
  enter(){this.view.addChild(this.world);this.rebuild();}
  private rebuild(){
    this.world.removeChildren().forEach(child=>child.destroy());this.label?.destroy();
    const map=this.bundle.maps[this.state.mapId],tile=map.tileSize;
    for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
      const blocked=map.collision[y*map.width+x]===1;
      this.world.addChild(new Graphics().rect(x*tile,y*tile,tile-1,tile-1).fill(blocked?0x18232a:(x+y)%2?0x31594c:0x365f51));
    }
    map.layers.forEach((layer,layerIndex)=>layer.data.forEach((tileId,index)=>{
      if(tileId===0)return;
      const x=index%map.width,y=Math.floor(index/map.width),definition=tileDefinition(tileId);
      if(layerIndex===0){
        const graphic=new Graphics().rect(x*tile,y*tile,tile-1,tile-1).fill(definition.color),mask=autotileMask(layer.data,index,map.width,map.height);
        if(!(mask&1))graphic.moveTo(x*tile,y*tile).lineTo((x+1)*tile-1,y*tile);
        if(!(mask&2))graphic.moveTo((x+1)*tile-1,y*tile).lineTo((x+1)*tile-1,(y+1)*tile-1);
        if(!(mask&4))graphic.moveTo(x*tile,(y+1)*tile-1).lineTo((x+1)*tile-1,(y+1)*tile-1);
        if(!(mask&8))graphic.moveTo(x*tile,y*tile).lineTo(x*tile,(y+1)*tile-1);
        graphic.stroke({color:0xffffff,alpha:.22,width:2});this.world.addChild(graphic);
      }
      else{
        const inset=Math.max(4,10-layerIndex*2);
        this.world.addChild(new Graphics().roundRect(x*tile+inset,y*tile+inset,tile-inset*2,tile-inset*2,Math.max(2,7-layerIndex)).fill({color:definition.color,alpha:.9}));
        if(definition.glyph){const glyph=new Text({text:definition.glyph,style:{fill:0xffffff,fontSize:Math.max(12,tile*.38),fontFamily:'system-ui',fontWeight:'bold'}});glyph.anchor.set(.5);glyph.position.set((x+.5)*tile,(y+.5)*tile);this.world.addChild(glyph);}
      }
    }));
    for(const event of map.events){const page=activePage(event,this.state);if(!page||(!page.solid&&page.commands.length===0))continue;const position=eventPosition(this.state,map.id,event);this.world.addChild(new Graphics().roundRect(position.x*tile+8,position.y*tile+8,tile-16,tile-16,7).fill(event.trigger==='touch'?0xc99b4e:0x77a9c8));}
    this.world.addChild(new Graphics().roundRect(this.state.x*tile+7,this.state.y*tile+7,tile-14,tile-14,9).fill(0x65dfbd));
    const{width,height}=this.bundle.project.logicalResolution,px=(this.state.x+.5)*tile,py=(this.state.y+.5)*tile;
    this.world.position.set(map.width*tile<=width?(width-map.width*tile)/2:Math.min(0,Math.max(width-map.width*tile,width/2-px)),map.height*tile<=height?(height-map.height*tile)/2:Math.min(0,Math.max(height-map.height*tile,height/2-py)));
    this.label=new Text({text:`${map.name} · X party · Q jurnal · Esc settings · F5/F9 save/load`,style:{fill:0xe8d19c,fontSize:18,fontFamily:'system-ui'}});this.label.position.set(24,20);this.view.addChild(this.label);
  }
  update(_delta:number,input:InputManager){if(input.wasPressed('debug')){this.debug.toggle();this.debug.draw(this.state);}if(this.busy)return;if(input.wasPressed('menu'))return void this.openParty();if(input.wasPressed('journal'))return void this.openJournal();if(input.wasPressed('settings'))return void this.openSettings();if(input.wasPressed('save'))return void this.save();if(input.wasPressed('load'))return void this.load();const directions:Array<[Direction,Parameters<InputManager['wasPressed']>[0]]>=[['up','move.up'],['down','move.down'],['left','move.left'],['right','move.right']];for(const[direction,action]of directions)if(input.wasPressed(action)){const before=this.state;this.state=move(this.bundle,this.state,direction);this.rebuild();this.debug.draw(this.state);if(before.x!==this.state.x||before.y!==this.state.y){const event=eventAt(this.bundle,this.state,this.state.x,this.state.y,'touch');if(event)void this.runEvent(event);}return;}if(input.wasPressed('confirm')){const[dx,dy]=directionDelta[this.state.facing],event=eventAt(this.bundle,this.state,this.state.x+dx,this.state.y+dy,'interact');if(event)void this.runEvent(event);}}
  private async runEvent(event:NonNullable<ReturnType<typeof eventAt>>){const page=activePage(event,this.state);if(!page)return;this.busy=true;this.debug.log(`event start: ${event.id} (${page.commands.map(command=>command.type).join(', ')})`);try{const io={showText:(text:string)=>this.dialogue.showText(text),choose:(prompt:string,choices:string[])=>this.dialogue.choose(prompt,choices),battle:(troopId:string,state:ProgressState)=>this.battle.run(troopId,state),shop:(shopId:string,state:ProgressState)=>this.adventure.shop(shopId,state),inn:(price:number,state:ProgressState)=>this.adventure.inn(price,state),cutscene:(lines:string[],vfx:'flash'|'shake'|undefined)=>this.adventure.cutscene(lines,vfx,text=>this.dialogue.showText(text)),music:(mood:'calm'|'danger'|'boss'|'silence')=>this.audio.setMood(mood),eventMove:async(state:ProgressState)=>{this.state=state;this.rebuild();await wait(state.settings.reducedMotion?1:120);}};this.state=await executeCommands(this.bundle,this.state,page.commands,io);this.rebuild();this.debug.log(`event end: ${event.id}`);this.debug.draw(this.state);}catch(error){this.dialogue.toast(`Event gagal: ${error instanceof Error?error.message:String(error)}`);}finally{this.busy=false;}}
  private async openParty(){this.busy=true;try{this.state=await this.party.open(this.state);this.rebuild();}finally{this.busy=false;}}
  private async openJournal(){this.busy=true;try{this.state=await this.adventure.journal(this.state);}finally{this.busy=false;}}
  private async openSettings(){this.busy=true;try{this.state=await this.adventure.settings(this.state);}finally{this.busy=false;}}
  private async save(){this.busy=true;try{await window.nusvRuntime!.saveProgress(this.state);this.dialogue.toast('Progres disimpan.');}catch(error){this.dialogue.toast(`Save gagal: ${error instanceof Error?error.message:String(error)}`);}finally{this.busy=false;}}
  private async load(){this.busy=true;try{const saved=await window.nusvRuntime!.loadProgress();if(saved){this.state=saved;applyRuntimeSettings(saved.settings);this.audio.setMix(saved.settings);this.rebuild();this.dialogue.toast('Progres dimuat.');}else this.dialogue.toast('Belum ada save.');}catch(error){this.dialogue.toast(`Load gagal: ${error instanceof Error?error.message:String(error)}`);}finally{this.busy=false;}}
  exit(){this.dialogue.destroy();this.battle.destroy();this.party.destroy();this.adventure.destroy();this.debug.destroy();this.view.destroy({children:true});}
}
