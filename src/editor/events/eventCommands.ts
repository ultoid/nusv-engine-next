import type { EventCommand, ProjectBundle } from '../../core/types.js';

export const commandTypes: Array<EventCommand['type']> = [
  'text','choice','setSwitch','setVariable','setSelfSwitch','changeGold','wait','branch','loop','breakLoop','exitEvent','label','jumpToLabel',
  'tintScreen','flashScreen','shakeScreen','fadeoutScreen','fadeinScreen','weather',
  'showPicture','movePicture','erasePicture','showBalloon','showAnimation','transparency',
  'playSe','stopSe','playMe','playBgs','fadeoutBgs',
  'giveItem','transfer','battle','questStart','questAdvance','questComplete','shop','inn','cutscene','music',
  'setMovementRoute','changeHp','changeMp','recoverAll','changeLevel','changeExp','changePartyMember','changeSkill','setEventLocation','scrollMap','eraseEvent','gameOver','script'
];

export const commandName: Record<EventCommand['type'], string> = {
  text:'Show Text',choice:'Show Choices',setSwitch:'Control Switch',setVariable:'Control Variable',setSelfSwitch:'Control Self Switch',changeGold:'Change Gold',wait:'Wait',branch:'Conditional Branch',loop:'Loop',breakLoop:'Break Loop',exitEvent:'Exit Event Processing',label:'Label',jumpToLabel:'Jump to Label',
  tintScreen:'Tint Screen',flashScreen:'Flash Screen',shakeScreen:'Shake Screen',fadeoutScreen:'Fadeout Screen',fadeinScreen:'Fadein Screen',weather:'Set Weather Effect',
  showPicture:'Show Picture',movePicture:'Move Picture',erasePicture:'Erase Picture',showBalloon:'Show Balloon Icon',showAnimation:'Show Animation',transparency:'Change Transparency',
  playSe:'Play SE',stopSe:'Stop SE',playMe:'Play ME',playBgs:'Play BGS',fadeoutBgs:'Fadeout BGS',
  giveItem:'Give Item',transfer:'Transfer Player',battle:'Start Battle',questStart:'Start Quest',questAdvance:'Advance Quest',questComplete:'Complete Quest',shop:'Open Shop',inn:'Open Inn',cutscene:'Cutscene',music:'Change Music',
  setMovementRoute:'Set Movement Route',changeHp:'Change HP',changeMp:'Change MP',recoverAll:'Recover All',changeLevel:'Change Level',changeExp:'Change EXP',changePartyMember:'Change Party Member',changeSkill:'Change Skill',setEventLocation:'Set Event Location',scrollMap:'Scroll Map',eraseEvent:'Erase Event',gameOver:'Game Over',script:'Script'
};

export const commandPreview = (command: EventCommand): string => {
  if(command.type==='text')return `"${command.text}"`;
  if(command.type==='choice')return command.prompt;
  if(command.type==='setSwitch')return `${command.id} = ${command.value ? 'ON' : 'OFF'}`;
  if(command.type==='setVariable')return `${command.id} = ${command.value}`;
  if(command.type==='setSelfSwitch')return `Self Switch [${command.key}] = ${command.value ? 'ON' : 'OFF'}`;
  if(command.type==='changeGold')return `${command.operation === 'sub' ? '-' : '+'}${command.amount} G`;
  if(command.type==='wait')return `${command.frames} frames`;
  if(command.type==='branch')return `IF (${command.condition.kind})`;
  if(command.type==='loop')return `Loop (${command.commands.length} cmds)`;
  if(command.type==='breakLoop')return `Break Loop`;
  if(command.type==='exitEvent')return `Exit Event Processing`;
  if(command.type==='label')return `Label: ${command.name}`;
  if(command.type==='jumpToLabel')return `Jump to: ${command.name}`;
  if(command.type==='tintScreen')return `Tint [${command.tone.join(',')}] (${command.duration}f)`;
  if(command.type==='flashScreen')return `Flash (${command.duration}f)`;
  if(command.type==='shakeScreen')return `Shake (${command.duration}f)`;
  if(command.type==='fadeoutScreen')return `Fadeout (${command.duration ?? 24}f)`;
  if(command.type==='fadeinScreen')return `Fadein (${command.duration ?? 24}f)`;
  if(command.type==='weather')return `Weather: ${command.weatherType}`;
  if(command.type==='showPicture')return `Pic #${command.picture.id}: ${command.picture.path}`;
  if(command.type==='movePicture')return `Move Pic #${command.id} (${command.duration}f)`;
  if(command.type==='erasePicture')return `Erase Pic #${command.id}`;
  if(command.type==='showBalloon')return `Balloon ${command.balloon} -> ${command.target}`;
  if(command.type==='showAnimation')return `Anim ${command.animationId} -> ${command.target}`;
  if(command.type==='transparency')return `Transparency: ${command.value ? 'ON' : 'OFF'}`;
  if(command.type==='playSe')return `SE: ${command.path}`;
  if(command.type==='stopSe')return `Stop SE`;
  if(command.type==='playMe')return `ME: ${command.path}`;
  if(command.type==='playBgs')return `BGS: ${command.path}`;
  if(command.type==='fadeoutBgs')return `Fadeout BGS (${command.seconds}s)`;
  if(command.type==='giveItem')return `${command.amount}× ${command.itemId}`;
  if(command.type==='transfer')return `${command.mapId} (${command.x}, ${command.y})`;
  if(command.type==='battle')return command.troopId;
  if(command.type==='questStart')return command.questId;
  if(command.type==='questAdvance')return `${command.questId} · ${command.objectiveId} +${command.amount}`;
  if(command.type==='questComplete')return command.questId;
  if(command.type==='shop')return command.shopId;
  if(command.type==='inn')return `${command.price} G`;
  if(command.type==='cutscene')return command.lines.join(' · ');
  if(command.type==='music')return command.mood;
  if(command.type==='setMovementRoute')return `Route -> ${command.target} (${command.route.list.length} steps)`;
  if(command.type==='changeHp')return `${command.actorId ?? 'Entire Party'} HP ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeMp')return `${command.actorId ?? 'Entire Party'} MP ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='recoverAll')return `Recover All: ${command.actorId ?? 'Entire Party'}`;
  if(command.type==='changeLevel')return `Level ${command.actorId} ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeExp')return `EXP ${command.actorId} ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changePartyMember')return `Party: ${command.operation === 'add' ? '+' : '-'}${command.actorId}`;
  if(command.type==='changeSkill')return `Skill ${command.operation === 'learn' ? 'Learn' : 'Forget'}: ${command.skillId}`;
  if(command.type==='setEventLocation')return `Move ${command.eventId} to (${command.x}, ${command.y})`;
  if(command.type==='scrollMap')return `Scroll ${command.direction} ${command.distance} tiles (spd ${command.speed})`;
  if(command.type==='eraseEvent')return `Erase Event: ${command.eventId ?? 'This Event'}`;
  if(command.type==='gameOver')return `Game Over`;
  if(command.type==='script')return `Script: ${command.code.slice(0, 30)}...`;
  return '';
};

export function createCommand(type: EventCommand['type'], bundle: ProjectBundle): EventCommand {
  if(type==='text')return{type,text:'New dialogue.'};
  if(type==='choice')return{type,prompt:'Choose:',choices:[{text:'Yes',commands:[]},{text:'No',commands:[]}]};
  if(type==='setSwitch')return{type,id:'story.flag',value:true};
  if(type==='setVariable')return{type,id:'story.step',value:1};
  if(type==='setSelfSwitch')return{type,key:'A',value:true};
  if(type==='changeGold')return{type,amount:10,operation:'add'};
  if(type==='wait')return{type,frames:60};
  if(type==='branch')return{type,condition:{kind:'switch',id:'story.flag',value:true},thenCommands:[],elseCommands:[]};
  if(type==='loop')return{type,commands:[]};
  if(type==='breakLoop')return{type};
  if(type==='exitEvent')return{type};
  if(type==='label')return{type,name:'marker'};
  if(type==='jumpToLabel')return{type,name:'marker'};
  if(type==='tintScreen')return{type,tone:[0,0,0,0],duration:60};
  if(type==='flashScreen')return{type,color:[255,255,255,255],duration:30};
  if(type==='shakeScreen')return{type,power:5,speed:5,duration:30};
  if(type==='fadeoutScreen')return{type,duration:24};
  if(type==='fadeinScreen')return{type,duration:24};
  if(type==='weather')return{type,weatherType:'rain',power:5,duration:60};
  if(type==='showPicture')return{type,picture:{id:1,path:'assets/pictures/pic1.png',x:0,y:0}};
  if(type==='movePicture')return{type,id:1,duration:30,x:100,y:100};
  if(type==='erasePicture')return{type,id:1};
  if(type==='showBalloon')return{type,target:'player',balloon:'exclamation'};
  if(type==='showAnimation')return{type,target:'player',animationId:'anim.slash'};
  if(type==='transparency')return{type,value:true};
  if(type==='playSe')return{type,path:'assets/audio/se/Decision1.ogg'};
  if(type==='stopSe')return{type};
  if(type==='playMe')return{type,path:'assets/audio/me/Victory1.ogg'};
  if(type==='playBgs')return{type,path:'assets/audio/bgs/Rain.ogg'};
  if(type==='fadeoutBgs')return{type,seconds:2};
  if(type==='giveItem')return{type,itemId:bundle.game.items[0]?.id??'item.missing',amount:1};
  if(type==='transfer')return{type,mapId:bundle.project.start.mapId,x:bundle.project.start.x,y:bundle.project.start.y};
  if(type==='battle')return{type,troopId:bundle.game.troops[0]?.id??'troop.missing'};
  if(type==='questStart')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing'};
  if(type==='questAdvance')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing',objectiveId:bundle.game.quests?.[0]?.objectives[0]?.id??'objective.missing',amount:1};
  if(type==='questComplete')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing'};
  if(type==='shop')return{type,shopId:bundle.game.shops?.[0]?.id??'shop.missing'};
  if(type==='inn')return{type,price:10};
  if(type==='cutscene')return{type,lines:['New cutscene line.']};
  if(type==='setMovementRoute')return{type,target:'player',route:{repeat:false,skippable:true,wait:true,list:[{code:'stepForward'}]}};
  if(type==='changeHp')return{type,operation:'sub',amount:10,allowKnockout:false};
  if(type==='changeMp')return{type,operation:'sub',amount:10};
  if(type==='recoverAll')return{type};
  if(type==='changeLevel')return{type,actorId:bundle.project.party[0]??'actor.missing',operation:'add',amount:1};
  if(type==='changeExp')return{type,actorId:bundle.project.party[0]??'actor.missing',operation:'add',amount:100};
  if(type==='changePartyMember')return{type,actorId:bundle.game.actors[0]?.id??'actor.missing',operation:'add'};
  if(type==='changeSkill')return{type,actorId:bundle.project.party[0]??'actor.missing',skillId:bundle.game.skills[0]?.id??'skill.missing',operation:'learn'};
  if(type==='setEventLocation')return{type,eventId:'this',x:0,y:0};
  if(type==='scrollMap')return{type,direction:'down',distance:4,speed:4};
  if(type==='eraseEvent')return{type};
  if(type==='gameOver')return{type};
  if(type==='script')return{type,code:'// script code'};
  return{type:'music',mood:'calm'};
}
