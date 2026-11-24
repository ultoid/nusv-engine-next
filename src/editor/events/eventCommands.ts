import type { EventCommand, ProjectBundle } from '../../core/types.js';

export const commandTypes: Array<EventCommand['type']> = [
  'text','choice','setSwitch','setVariable','setSelfSwitch','changeGold','wait','branch','loop','breakLoop','exitEvent','label','jumpToLabel',
  'tintScreen','flashScreen','shakeScreen','fadeoutScreen','fadeinScreen','weather',
  'showPicture','movePicture','erasePicture','showBalloon','showAnimation','transparency',
  'playSe','stopSe','playMe','playBgs','fadeoutBgs',
  'giveItem','transfer','battle','questStart','questAdvance','questComplete','shop','inn','cutscene','music',
  'setMovementRoute','changeHp','changeMp','recoverAll','changeLevel','changeExp','changePartyMember','changeSkill','setEventLocation','scrollMap','eraseEvent','gameOver','script',
  'inputNumber','selectItem','scrollingText','controlTimer','commonEvent','comment','changeWeapons','changeArmors','changeTp','changeState','changeParameter','changeEquipment','changeName','changeClass','changeNickname','changeProfile',
  'setVehicleLocation','getOnOffVehicle','changePlayerFollowers','gatherFollowers','rotatePicture','tintPicture','playBgm','fadeoutBgm','saveBgm','replayBgm','playMovie',
  'nameInput','openMenu','openSave','returnToTitle','changeBattleBgm','changeVictoryMe','changeDefeatMe','changeVehicleBgm','changeSaveAccess','changeMenuAccess','changeEncounter','changeFormationAccess','changeWindowColor','changeActorImages','changeVehicleImage','changeMapNameDisplay','changeTileset','changeBattleBack','changeParallax','getLocationInfo','changeEnemyHp','changeEnemyMp','changeEnemyTp','changeEnemyState','enemyRecoverAll','enemyAppear','enemyTransform','showBattleAnimation','forceAction','abortBattle','pluginCommand'
];

export const commandName: Record<EventCommand['type'], string> = {
  text:'Show Text',choice:'Show Choices',setSwitch:'Control Switch',setVariable:'Control Variable',setSelfSwitch:'Control Self Switch',changeGold:'Change Gold',wait:'Wait',branch:'Conditional Branch',loop:'Loop',breakLoop:'Break Loop',exitEvent:'Exit Event Processing',label:'Label',jumpToLabel:'Jump to Label',
  tintScreen:'Tint Screen',flashScreen:'Flash Screen',shakeScreen:'Shake Screen',fadeoutScreen:'Fadeout Screen',fadeinScreen:'Fadein Screen',weather:'Set Weather Effect',
  showPicture:'Show Picture',movePicture:'Move Picture',erasePicture:'Erase Picture',showBalloon:'Show Balloon Icon',showAnimation:'Show Animation',transparency:'Change Transparency',
  playSe:'Play SE',stopSe:'Stop SE',playMe:'Play ME',playBgs:'Play BGS',fadeoutBgs:'Fadeout BGS',
  giveItem:'Give Item',transfer:'Transfer Player',battle:'Start Battle',questStart:'Start Quest',questAdvance:'Advance Quest',questComplete:'Complete Quest',shop:'Open Shop',inn:'Open Inn',cutscene:'Cutscene',music:'Change Music',
  setMovementRoute:'Set Movement Route',changeHp:'Change HP',changeMp:'Change MP',recoverAll:'Recover All',changeLevel:'Change Level',changeExp:'Change EXP',changePartyMember:'Change Party Member',changeSkill:'Change Skill',setEventLocation:'Set Event Location',scrollMap:'Scroll Map',eraseEvent:'Erase Event',gameOver:'Game Over',script:'Script',
  inputNumber:'Input Number',selectItem:'Select Item',scrollingText:'Show Scrolling Text',controlTimer:'Control Timer',commonEvent:'Common Event',comment:'Comment',changeWeapons:'Change Weapons',changeArmors:'Change Armors',changeTp:'Change TP',changeState:'Change State',changeParameter:'Change Parameter',changeEquipment:'Change Equipment',changeName:'Change Name',changeClass:'Change Class',changeNickname:'Change Nickname',changeProfile:'Change Profile',
  setVehicleLocation:'Set Vehicle Location',getOnOffVehicle:'Get on/off Vehicle',changePlayerFollowers:'Change Player Followers',gatherFollowers:'Gather Followers',rotatePicture:'Rotate Picture',tintPicture:'Tint Picture',playBgm:'Play BGM',fadeoutBgm:'Fadeout BGM',saveBgm:'Save BGM',replayBgm:'Replay BGM',playMovie:'Play Movie',
  nameInput:'Name Input Processing',openMenu:'Open Menu Screen',openSave:'Open Save Screen',returnToTitle:'Return to Title Screen',
  changeBattleBgm:'Change Battle BGM',changeVictoryMe:'Change Victory ME',changeDefeatMe:'Change Defeat ME',changeVehicleBgm:'Change Vehicle BGM',
  changeSaveAccess:'Change Save Access',changeMenuAccess:'Change Menu Access',changeEncounter:'Change Encounter',changeFormationAccess:'Change Formation Access',
  changeWindowColor:'Change Window Color',changeActorImages:'Change Actor Images',changeVehicleImage:'Change Vehicle Image',
  changeMapNameDisplay:'Change Map Name Display',changeTileset:'Change Tileset',changeBattleBack:'Change Battle Background',changeParallax:'Change Parallax',
  getLocationInfo:'Get Location Info',changeEnemyHp:'Change Enemy HP',changeEnemyMp:'Change Enemy MP',changeEnemyTp:'Change Enemy TP',
  changeEnemyState:'Change Enemy State',enemyRecoverAll:'Enemy Recover All',enemyAppear:'Enemy Appear',enemyTransform:'Enemy Transform',
  showBattleAnimation:'Show Battle Animation',forceAction:'Force Action',abortBattle:'Abort Battle',pluginCommand:'Plugin Command'
};

export const commandPreview = (command: EventCommand): string => {
  if(command.type==='text') {
    const parts: string[] = [];
    if (command.faceName) {
      const base = command.faceName.split('/').pop()?.replace('.png', '') ?? '';
      parts.push(`[${base}(${command.faceIndex ?? 0})]`);
    }
    if (command.speakerName) {
      parts.push(`${command.speakerName}:`);
    }
    parts.push(`"${command.text}"`);
    return parts.join(' ');
  }
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
  if(command.type==='inputNumber')return `Input Number: Variable [${command.variableId}], ${command.digits} digits`;
  if(command.type==='selectItem')return `Select Item: Variable [${command.variableId}]${command.itemType ? ` (${command.itemType})` : ''}`;
  if(command.type==='scrollingText')return `Scroll Text: "${command.text.slice(0, 30)}..."`;
  if(command.type==='controlTimer')return `Timer: ${command.operation.toUpperCase()}${command.seconds ? ` (${command.seconds}s)` : ''}`;
  if(command.type==='commonEvent')return `Common Event: #${command.commonEventId}`;
  if(command.type==='comment')return `// ${command.text}`;
  if(command.type==='changeWeapons')return `Weapons: ${command.operation === 'sub' ? '-' : '+'}${command.amount}× [${command.weaponId}]`;
  if(command.type==='changeArmors')return `Armors: ${command.operation === 'sub' ? '-' : '+'}${command.amount}× [${command.armorId}]`;
  if(command.type==='changeTp')return `TP ${command.actorId ?? 'Party'}: ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeState')return `State ${command.actorId ?? 'Party'}: ${command.operation === 'add' ? '+' : '-'}[${command.stateId}]`;
  if(command.type==='changeParameter')return `Param ${command.actorId}: ${command.param.toUpperCase()} ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeEquipment')return `Equip ${command.actorId}: [${command.slot}] = ${command.equipId ?? '(None)'}`;
  if(command.type==='changeName')return `Name ${command.actorId}: "${command.name}"`;
  if(command.type==='changeClass')return `Class ${command.actorId}: [${command.classId}]`;
  if(command.type==='changeNickname')return `Nickname ${command.actorId}: "${command.nickname}"`;
  if(command.type==='changeProfile')return `Profile ${command.actorId}: "${command.profile.slice(0, 25)}..."`;
  if(command.type==='setVehicleLocation')return `Vehicle [${command.vehicleType}] -> ${command.mapId} (${command.x}, ${command.y})`;
  if(command.type==='getOnOffVehicle')return `Get on/off Vehicle`;
  if(command.type==='changePlayerFollowers')return `Player Followers: ${command.value ? 'ON' : 'OFF'}`;
  if(command.type==='gatherFollowers')return `Gather Followers`;
  if(command.type==='rotatePicture')return `Rotate Pic #${command.id} (speed ${command.speed})`;
  if(command.type==='tintPicture')return `Tint Pic #${command.id} [${command.tone.join(',')}] (${command.duration}f)`;
  if(command.type==='playBgm')return `BGM: ${command.path}`;
  if(command.type==='fadeoutBgm')return `Fadeout BGM (${command.seconds}s)`;
  if(command.type==='saveBgm')return `Save BGM`;
  if(command.type==='replayBgm')return `Replay BGM`;
  if(command.type==='playMovie')return `Movie: ${command.path}`;
  if(command.type==='nameInput')return `Name Input: [${command.actorId}] (${command.maxDigits} digits)`;
  if(command.type==='openMenu')return `Open Menu Screen`;
  if(command.type==='openSave')return `Open Save Screen`;
  if(command.type==='returnToTitle')return `Return to Title Screen`;
  if(command.type==='changeBattleBgm')return `Battle BGM: ${command.path}`;
  if(command.type==='changeVictoryMe')return `Victory ME: ${command.path}`;
  if(command.type==='changeDefeatMe')return `Defeat ME: ${command.path}`;
  if(command.type==='changeVehicleBgm')return `Vehicle BGM [${command.vehicleType}]: ${command.path}`;
  if(command.type==='changeSaveAccess')return `Save Access: ${command.enabled ? 'ON' : 'OFF'}`;
  if(command.type==='changeMenuAccess')return `Menu Access: ${command.enabled ? 'ON' : 'OFF'}`;
  if(command.type==='changeEncounter')return `Encounter: ${command.enabled ? 'ON' : 'OFF'}`;
  if(command.type==='changeFormationAccess')return `Formation Access: ${command.enabled ? 'ON' : 'OFF'}`;
  if(command.type==='changeWindowColor')return `Window Color: [${command.tone.join(',')}]`;
  if(command.type==='changeActorImages')return `Actor Images: [${command.actorId}]`;
  if(command.type==='changeVehicleImage')return `Vehicle Image [${command.vehicleType}]: ${command.imageName}(${command.imageIndex})`;
  if(command.type==='changeMapNameDisplay')return `Map Name Display: ${command.enabled ? 'ON' : 'OFF'}`;
  if(command.type==='changeTileset')return `Tileset: [${command.tilesetId}]`;
  if(command.type==='changeBattleBack')return `Battleback: ${command.battleback1Name ?? ''} / ${command.battleback2Name ?? ''}`;
  if(command.type==='changeParallax')return `Parallax: ${command.name}`;
  if(command.type==='getLocationInfo')return `Location Info -> Var [${command.variableId}]: ${command.infoType} at (${command.x}, ${command.y})`;
  if(command.type==='changeEnemyHp')return `Enemy #${command.enemyIndex + 1} HP ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeEnemyMp')return `Enemy #${command.enemyIndex + 1} MP ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeEnemyTp')return `Enemy #${command.enemyIndex + 1} TP ${command.operation === 'sub' ? '-' : '+'}${command.amount}`;
  if(command.type==='changeEnemyState')return `Enemy #${command.enemyIndex + 1} State: ${command.operation === 'add' ? '+' : '-'}[${command.stateId}]`;
  if(command.type==='enemyRecoverAll')return `Enemy Recover All: #${command.enemyIndex + 1}`;
  if(command.type==='enemyAppear')return `Enemy Appear: #${command.enemyIndex + 1}`;
  if(command.type==='enemyTransform')return `Enemy Transform: #${command.enemyIndex + 1} -> [${command.enemyId}]`;
  if(command.type==='showBattleAnimation')return `Battle Anim: ${command.animationId} -> Enemy #${command.enemyIndex + 1}`;
  if(command.type==='forceAction')return `Force Action: ${command.battler} #${command.index + 1} -> ${command.skillId}`;
  if(command.type==='abortBattle')return `Abort Battle`;
  if(command.type==='pluginCommand')return `Plugin: ${command.pluginName} -> ${command.commandName}`;
  return '';
};

export function createCommand(type: EventCommand['type'], bundle: ProjectBundle): EventCommand {
  if(type==='text')return{type,text:'New dialogue.',background:0,positionType:2};
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
  if(type==='inputNumber')return{type,variableId:'story.input',digits:4};
  if(type==='selectItem')return{type,variableId:'story.item',itemType:'regular'};
  if(type==='scrollingText')return{type,text:'Prologue...',speed:2,noFastForward:false};
  if(type==='controlTimer')return{type,operation:'start',seconds:120};
  if(type==='commonEvent')return{type,commonEventId:bundle.game.commonEvents?.[0]?.id??'common.1'};
  if(type==='comment')return{type,text:'Tulis catatan atau komentar alur event di sini.'};
  if(type==='changeWeapons')return{type,weaponId:bundle.game.equipment.find(e=>e.slot==='weapon')?.id??'weapon.sword',operation:'add',amount:1};
  if(type==='changeArmors')return{type,armorId:bundle.game.equipment.find(e=>e.slot!=='weapon')?.id??'armor.shield',operation:'add',amount:1};
  if(type==='changeTp')return{type,actorId:bundle.project.party[0],operation:'add',amount:10};
  if(type==='changeState')return{type,actorId:bundle.project.party[0],operation:'add',stateId:bundle.game.states?.[0]?.id??'state.poison'};
  if(type==='changeParameter')return{type,actorId:bundle.project.party[0]??'actor.missing',param:'atk',operation:'add',amount:5};
  if(type==='changeEquipment')return{type,actorId:bundle.project.party[0]??'actor.missing',slot:'weapon',equipId:bundle.game.equipment.find(e=>e.slot==='weapon')?.id};
  if(type==='changeName')return{type,actorId:bundle.project.party[0]??'actor.missing',name:'Hero'};
  if(type==='changeClass')return{type,actorId:bundle.project.party[0]??'actor.missing',classId:bundle.game.classes?.[0]?.id??'class.warrior',keepLevel:true};
  if(type==='changeNickname')return{type,actorId:bundle.project.party[0]??'actor.missing',nickname:'The Brave'};
  if(type==='changeProfile')return{type,actorId:bundle.project.party[0]??'actor.missing',profile:'A young hero from the village.'};
  if(type==='setVehicleLocation')return{type,vehicleType:'boat',mapId:bundle.project.start.mapId,x:0,y:0};
  if(type==='getOnOffVehicle')return{type};
  if(type==='changePlayerFollowers')return{type,value:true};
  if(type==='gatherFollowers')return{type};
  if(type==='rotatePicture')return{type,id:1,speed:2};
  if(type==='tintPicture')return{type,id:1,tone:[0,0,0,0],duration:60};
  if(type==='playBgm')return{type,path:'assets/audio/bgm/Theme1.ogg'};
  if(type==='fadeoutBgm')return{type,seconds:2};
  if(type==='saveBgm')return{type};
  if(type==='replayBgm')return{type};
  if(type==='playMovie')return{type,path:'assets/movies/movie1.webm'};
  if(type==='nameInput')return{type,actorId:bundle.project.party[0]??'actor.missing',maxDigits:8};
  if(type==='openMenu')return{type};
  if(type==='openSave')return{type};
  if(type==='returnToTitle')return{type};
  if(type==='changeBattleBgm')return{type,path:'assets/audio/bgm/Battle1.ogg'};
  if(type==='changeVictoryMe')return{type,path:'assets/audio/me/Victory1.ogg'};
  if(type==='changeDefeatMe')return{type,path:'assets/audio/me/Defeat1.ogg'};
  if(type==='changeVehicleBgm')return{type,vehicleType:'boat',path:'assets/audio/bgm/Ship1.ogg'};
  if(type==='changeSaveAccess')return{type,enabled:true};
  if(type==='changeMenuAccess')return{type,enabled:true};
  if(type==='changeEncounter')return{type,enabled:true};
  if(type==='changeFormationAccess')return{type,enabled:true};
  if(type==='changeWindowColor')return{type,tone:[0,0,0]};
  if(type==='changeActorImages')return{type,actorId:bundle.project.party[0]??'actor.missing',characterName:'Actor1',characterIndex:0};
  if(type==='changeVehicleImage')return{type,vehicleType:'boat',imageName:'Vehicle',imageIndex:0};
  if(type==='changeMapNameDisplay')return{type,enabled:true};
  if(type==='changeTileset')return{type,tilesetId:bundle.game.tilesets?.[0]?.id??'tileset.overworld'};
  if(type==='changeBattleBack')return{type,battleback1Name:'Grassland',battleback2Name:'Grassland'};
  if(type==='changeParallax')return{type,name:'Mountains',loopX:false,loopY:false,sx:0,sy:0};
  if(type==='getLocationInfo')return{type,variableId:'info.val',infoType:'terrainTag',x:0,y:0};
  if(type==='changeEnemyHp')return{type,enemyIndex:0,operation:'sub',amount:50,allowKnockout:false};
  if(type==='changeEnemyMp')return{type,enemyIndex:0,operation:'sub',amount:20};
  if(type==='changeEnemyTp')return{type,enemyIndex:0,operation:'add',amount:20};
  if(type==='changeEnemyState')return{type,enemyIndex:0,operation:'add',stateId:bundle.game.states?.[0]?.id??'state.poison'};
  if(type==='enemyRecoverAll')return{type,enemyIndex:0};
  if(type==='enemyAppear')return{type,enemyIndex:0};
  if(type==='enemyTransform')return{type,enemyIndex:0,enemyId:bundle.game.enemies[0]?.id??'enemy.slime'};
  if(type==='showBattleAnimation')return{type,enemyIndex:0,animationId:'anim.slash'};
  if(type==='forceAction')return{type,battler:'actor',index:0,skillId:bundle.game.skills[0]?.id??'skill.attack'};
  if(type==='abortBattle')return{type};
  if(type==='pluginCommand')return{type,pluginName:'SamplePlugin',commandName:'runCommand',args:{}};
  return{type:'music',mood:'calm'};
}
