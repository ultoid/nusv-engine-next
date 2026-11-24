import type { ActorData, ActorProgress, EnemyData, EquipmentData, ItemData, ResourceState, SkillData, StateData, TroopData } from './combat-types.js';
export interface QuestData { id: string; name: string; description: string; objectives: Array<{ id: string; text: string; target: number }>; rewards?: { gold?: number; items?: Record<string, number> } }
export interface QuestProgress { status: 'active' | 'completed'; objectives: Record<string, number> }
export interface ShopData { id: string; name: string; items: Array<{ itemId: string; price: number }> }
export interface ClassLearning {
  level: number;
  skillId: string;
  note?: string;
}

export interface ClassData {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  growth?: Partial<import('./combat-types.js').BaseStats>;
  statGrowth?: Partial<import('./combat-types.js').BaseStats>;
  learnings?: ClassLearning[];
  traits?: import('./combat-types.js').TraitData[];
  expParams?: [number, number, number, number];
  params?: number[][];
  expCurve?: { basis: number; extra: number; accA: number; accB: number };
  note?: string;
  [key: string]: unknown;
}
export interface RuntimeSettings { language: 'id' | 'en'; masterVolume: number; musicVolume: number; sfxVolume: number; textScale: number; highContrast: boolean; reducedMotion: boolean }
export interface ProjectManifest { schemaVersion: 1; projectId: string; title: string; logicalResolution: { width: number; height: number }; maps: string[]; start: { mapId: string; x: number; y: number }; party: string[];[key: string]: unknown }
export interface TilesetData { id: string; name: string; mode: number; tilesetNames: string[]; note?: string; flags?: number[] }
export interface CommonEventData {
  id: string;
  name: string;
  trigger?: 'none' | 'autorun' | 'parallel' | number;
  switchId?: string;
  commands: EventCommand[];
  note?: string;
  [key: string]: unknown;
}

export interface TypesData {
  elements?: string[];
  skillTypes?: string[];
  weaponTypes?: string[];
  armorTypes?: string[];
  equipmentTypes?: string[];
  [key: string]: unknown;
}

export interface AnimationSoundTiming {
  frame: number;
  se: {
    name: string;
    volume?: number;
    pitch?: number;
    pan?: number;
  };
}

export interface AnimationFlashTiming {
  frame: number;
  duration: number;
  color: [number, number, number, number]; // [r, g, b, a]
  target?: number; // 0: target, 1: screen, 2: hide target
}

export interface AnimationRotation {
  x: number;
  y: number;
  z: number;
}

export interface AnimationData {
  id: string;
  name: string;
  displayType: number; // 0: None, 1: For each target, 2: For entire screen
  alignBottom?: boolean;
  effectName: string;
  scale?: number;
  speed?: number;
  rotation?: AnimationRotation;
  offsetX?: number;
  offsetY?: number;
  soundTimings?: AnimationSoundTiming[];
  flashTimings?: AnimationFlashTiming[];
  note?: string;
  [key: string]: unknown;
}

export interface SystemAudioSettings {
  name: string;
  volume?: number;
  pitch?: number;
  pan?: number;
}

export interface SystemVehicleImage {
  characterName: string;
  characterIndex: number;
}

export interface SystemStartingPosition {
  mapId: string;
  x: number;
  y: number;
}

export interface SystemTitleScreen {
  title1Name?: string;
  title2Name?: string;
  drawTitle?: boolean;
  commandWindow?: {
    background?: number; // 0: Window, 1: Dim, 2: Transparent
    offsetX?: number;
    offsetY?: number;
  };
}

export interface SystemOptions {
  optTransparent?: boolean;
  optFollowers?: boolean;
  optSlipDeath?: boolean;
  optFloorDeath?: boolean;
  optDisplayTp?: boolean;
  optExtraExp?: boolean;
  optKeyItemsNumber?: boolean;
  optAutosave?: boolean;
}

export interface SystemSvAttackMotion {
  weaponTypeId: number | string;
  motion: number; // 0: Thrust, 1: Swing, 2: Missile
  animationId?: number | string;
  weaponImageId?: number;
}

export interface SystemAdvanced {
  screenWidth?: number;
  screenHeight?: number;
  uiAreaWidth?: number;
  uiAreaHeight?: number;
  tileSize?: 16 | 24 | 32 | 48;
  windowOpacity?: number;
  mainFontFilename?: string;
  numberFontFilename?: string;
  fallbackFont?: string;
  fontSize?: number;
}

export interface SystemData {
  // System 1
  gameTitle?: string;
  partyMembers?: string[];
  currencyUnit?: string;
  windowTone?: [number, number, number, number?];
  boat?: SystemVehicleImage;
  ship?: SystemVehicleImage;
  airship?: SystemVehicleImage;
  startPositions?: {
    player?: SystemStartingPosition;
    boat?: SystemStartingPosition | null;
    ship?: SystemStartingPosition | null;
    airship?: SystemStartingPosition | null;
  };
  titleScreen?: SystemTitleScreen;
  battleScreen?: {
    sideView: boolean;
  };
  battleSystem?: 0 | 1 | 2; // 0: Turn-based, 1: Time Progress (Active), 2: Time Progress (Wait)
  options?: SystemOptions;
  bgm?: {
    title?: SystemAudioSettings;
    battle?: SystemAudioSettings;
    victory?: SystemAudioSettings;
    defeat?: SystemAudioSettings;
    gameover?: SystemAudioSettings;
    boat?: SystemAudioSettings;
    ship?: SystemAudioSettings;
    airship?: SystemAudioSettings;
  };
  sounds?: Record<string, SystemAudioSettings>;

  // System 2
  menuCommands?: {
    item?: boolean;
    skill?: boolean;
    equip?: boolean;
    status?: boolean;
    formation?: boolean;
    save?: boolean;
  };
  itemCategories?: {
    item?: boolean;
    weapon?: boolean;
    armor?: boolean;
    keyItem?: boolean;
  };
  svMagicSkills?: (number | string)[];
  svAttackMotions?: SystemSvAttackMotion[];
  advanced?: SystemAdvanced;
  [key: string]: unknown;
}

export interface TermsData {
  basic?: string[];
  params?: string[];
  commands?: string[];
  messages?: Record<string, string>;
  [key: string]: unknown;
}

export interface GameData {
  schemaVersion: 1;
  actors: ActorData[];
  enemies: EnemyData[];
  equipment: EquipmentData[];
  skills: SkillData[];
  states: StateData[];
  troops: TroopData[];
  items: ItemData[];
  animations?: AnimationData[];
  tilesets?: TilesetData[];
  quests?: QuestData[];
  shops?: ShopData[];
  classes?: ClassData[];
  commonEvents?: CommonEventData[];
  types?: TypesData;
  terms?: TermsData;
  translations?: Record<string, Record<string, string>>;
  system?: SystemData;
  [key: string]: unknown;
}
export type BranchCondition =
  | { kind: 'switch'; id: string; value: boolean }
  | { kind: 'variable'; id: string; op: '==' | '>=' | '<=' | '>' | '<' | '!='; value: number }
  | { kind: 'selfSwitch'; key: 'A' | 'B' | 'C' | 'D'; value: boolean; eventId?: string }
  | { kind: 'item'; itemId: string }
  | { kind: 'gold'; op: '>=' | '<='; amount: number }
  | { kind: 'actor'; actorId: string }
  | { kind: 'script'; code: string };

export type MoveRouteCode =
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'moveUp'
  | 'moveLowerLeft'
  | 'moveLowerRight'
  | 'moveUpperLeft'
  | 'moveUpperRight'
  | 'moveRandom'
  | 'moveTowardPlayer'
  | 'moveAwayFromPlayer'
  | 'stepForward'
  | 'stepBackward'
  | 'jump'
  | 'wait'
  | 'turnDown'
  | 'turnLeft'
  | 'turnRight'
  | 'turnUp'
  | 'turn90Right'
  | 'turn90Left'
  | 'turn180'
  | 'turn90RightOrLeft'
  | 'turnRandom'
  | 'turnTowardPlayer'
  | 'turnAwayFromPlayer'
  | 'switchOn'
  | 'switchOff'
  | 'changeSpeed'
  | 'changeFrequency'
  | 'walkAnimeOn'
  | 'walkAnimeOff'
  | 'stepAnimeOn'
  | 'stepAnimeOff'
  | 'directionFixOn'
  | 'directionFixOff'
  | 'throughOn'
  | 'throughOff'
  | 'transparentOn'
  | 'transparentOff'
  | 'script';

export interface MoveRouteCommand {
  code: MoveRouteCode;
  parameters?: any[];
}

export interface MoveRoute {
  repeat?: boolean;
  skippable?: boolean;
  wait?: boolean;
  list: MoveRouteCommand[];
}

export type EventCommand =
  | { type: 'text'; text: string; speakerName?: string; faceName?: string; faceIndex?: number; background?: number; positionType?: number }
  | { type: 'choice'; prompt: string; choices: Array<{ text: string; commands: EventCommand[] }> }
  | { type: 'setSwitch'; id: string; value: boolean }
  | { type: 'setVariable'; id: string; value: number }
  | { type: 'setSelfSwitch'; key: 'A' | 'B' | 'C' | 'D'; value: boolean; eventId?: string }
  | { type: 'branch'; condition: BranchCondition; thenCommands: EventCommand[]; elseCommands?: EventCommand[] }
  | { type: 'loop'; commands: EventCommand[] }
  | { type: 'breakLoop' }
  | { type: 'exitEvent' }
  | { type: 'label'; name: string }
  | { type: 'jumpToLabel'; name: string }
  | { type: 'wait'; frames: number }
  | { type: 'changeGold'; amount: number; operation?: 'add' | 'sub' }
  | { type: 'giveItem'; itemId: string; amount: number }
  | { type: 'transfer'; designation?: 'direct' | 'variables'; mapId: string; x: number; y: number; mapVariableId?: string; xVariableId?: string; yVariableId?: string; direction?: 'retain' | 'down' | 'left' | 'right' | 'up'; fade?: 'black' | 'white' | 'none' }
  | { type: 'battle'; troopId: string; victorySwitchId?: string }
  | { type: 'questStart'; questId: string }
  | { type: 'questAdvance'; questId: string; objectiveId: string; amount: number }
  | { type: 'questComplete'; questId: string }
  | { type: 'shop'; shopId: string }
  | { type: 'inn'; price: number }
  | { type: 'cutscene'; lines: string[]; vfx?: 'flash' | 'shake'; movement?: { eventId: string; directions: Array<'up' | 'down' | 'left' | 'right'> } }
  | { type: 'music'; mood: 'calm' | 'danger' | 'boss' | 'silence' }
  | { type: 'tintScreen'; tone: [number, number, number, number]; duration: number; wait?: boolean }
  | { type: 'flashScreen'; color: [number, number, number, number]; duration: number; wait?: boolean }
  | { type: 'shakeScreen'; power: number; speed: number; duration: number; wait?: boolean }
  | { type: 'fadeoutScreen'; duration?: number }
  | { type: 'fadeinScreen'; duration?: number }
  | { type: 'weather'; weatherType: 'none' | 'rain' | 'storm' | 'snow'; power: number; duration: number; wait?: boolean }
  | { type: 'showPicture'; picture: PictureState }
  | { type: 'movePicture'; id: number; duration: number; x: number; y: number; scaleX?: number; scaleY?: number; opacity?: number; wait?: boolean }
  | { type: 'erasePicture'; id: number }
  | { type: 'showBalloon'; target: 'player' | string; balloon: 'exclamation' | 'question' | 'music' | 'heart' | 'anger' | 'sweat' | 'silence' | 'lightbulb' | 'zzz'; wait?: boolean }
  | { type: 'showAnimation'; target: 'player' | string; animationId: string; wait?: boolean }
  | { type: 'transparency'; value: boolean }
  | { type: 'playSe'; path: string; volume?: number; pitch?: number }
  | { type: 'stopSe' }
  | { type: 'playMe'; path: string; volume?: number; pitch?: number }
  | { type: 'playBgs'; path: string; volume?: number; pitch?: number }
  | { type: 'fadeoutBgs'; seconds: number }
  | { type: 'setMovementRoute'; target: 'player' | 'this' | string; route: MoveRoute; wait?: boolean }
  | { type: 'changeHp'; actorId?: string; operation: 'add' | 'sub'; amount: number; allowKnockout?: boolean }
  | { type: 'changeMp'; actorId?: string; operation: 'add' | 'sub'; amount: number }
  | { type: 'recoverAll'; actorId?: string }
  | { type: 'changeLevel'; actorId: string; operation: 'add' | 'sub'; amount: number }
  | { type: 'changeExp'; actorId: string; operation: 'add' | 'sub'; amount: number }
  | { type: 'changePartyMember'; actorId: string; operation: 'add' | 'remove' }
  | { type: 'changeSkill'; actorId: string; skillId: string; operation: 'learn' | 'forget' }
  | { type: 'setEventLocation'; eventId: string; x: number; y: number; direction?: 'down' | 'left' | 'right' | 'up' }
  | { type: 'scrollMap'; direction: 'down' | 'left' | 'right' | 'up'; distance: number; speed: number }
  | { type: 'eraseEvent'; eventId?: string }
  | { type: 'gameOver' }
  | { type: 'inputNumber'; variableId: string; digits: number }
  | { type: 'selectItem'; variableId: string; itemType?: 'regular' | 'key' | 'hiddenA' | 'hiddenB' }
  | { type: 'scrollingText'; text: string; speed?: number; noFastForward?: boolean }
  | { type: 'controlTimer'; operation: 'start' | 'stop'; seconds?: number }
  | { type: 'commonEvent'; commonEventId: string }
  | { type: 'comment'; text: string }
  | { type: 'changeWeapons'; weaponId: string; operation: 'add' | 'sub'; amount: number; includeEquip?: boolean }
  | { type: 'changeArmors'; armorId: string; operation: 'add' | 'sub'; amount: number; includeEquip?: boolean }
  | { type: 'changeTp'; actorId?: string; operation: 'add' | 'sub'; amount: number }
  | { type: 'changeState'; actorId?: string; operation: 'add' | 'remove'; stateId: string }
  | { type: 'changeParameter'; actorId: string; param: 'atk' | 'def' | 'mat' | 'mdf' | 'agi' | 'luk'; operation: 'add' | 'sub'; amount: number }
  | { type: 'changeEquipment'; actorId: string; slot: 'weapon' | 'shield' | 'head' | 'body' | 'accessory'; equipId?: string }
  | { type: 'changeName'; actorId: string; name: string }
  | { type: 'changeClass'; actorId: string; classId: string; keepLevel?: boolean }
  | { type: 'changeNickname'; actorId: string; nickname: string }
  | { type: 'changeProfile'; actorId: string; profile: string }
  | { type: 'setVehicleLocation'; vehicleType: 'boat' | 'ship' | 'airship'; mapId: string; x: number; y: number }
  | { type: 'getOnOffVehicle' }
  | { type: 'changePlayerFollowers'; value: boolean }
  | { type: 'gatherFollowers' }
  | { type: 'rotatePicture'; id: number; speed: number }
  | { type: 'tintPicture'; id: number; tone: [number, number, number, number]; duration: number; wait?: boolean }
  | { type: 'playBgm'; path: string; volume?: number; pitch?: number }
  | { type: 'fadeoutBgm'; seconds: number }
  | { type: 'saveBgm' }
  | { type: 'replayBgm' }
  | { type: 'playMovie'; path: string }
  | { type: 'nameInput'; actorId: string; maxDigits: number }
  | { type: 'openMenu' }
  | { type: 'openSave' }
  | { type: 'returnToTitle' }
  | { type: 'changeBattleBgm'; path: string; volume?: number; pitch?: number }
  | { type: 'changeVictoryMe'; path: string; volume?: number; pitch?: number }
  | { type: 'changeDefeatMe'; path: string; volume?: number; pitch?: number }
  | { type: 'changeVehicleBgm'; vehicleType: 'boat' | 'ship' | 'airship'; path: string; volume?: number; pitch?: number }
  | { type: 'changeSaveAccess'; enabled: boolean }
  | { type: 'changeMenuAccess'; enabled: boolean }
  | { type: 'changeEncounter'; enabled: boolean }
  | { type: 'changeFormationAccess'; enabled: boolean }
  | { type: 'changeWindowColor'; tone: [number, number, number] }
  | { type: 'changeActorImages'; actorId: string; characterName?: string; characterIndex?: number; faceName?: string; faceIndex?: number; battlerName?: string }
  | { type: 'changeVehicleImage'; vehicleType: 'boat' | 'ship' | 'airship'; imageName: string; imageIndex: number }
  | { type: 'changeMapNameDisplay'; enabled: boolean }
  | { type: 'changeTileset'; tilesetId: string }
  | { type: 'changeBattleBack'; battleback1Name?: string; battleback2Name?: string }
  | { type: 'changeParallax'; name: string; loopX?: boolean; loopY?: boolean; sx?: number; sy?: number }
  | { type: 'getLocationInfo'; variableId: string; infoType: 'terrainTag' | 'eventId' | 'tileId' | 'regionId'; x: number; y: number }
  | { type: 'changeEnemyHp'; enemyIndex: number; operation: 'add' | 'sub'; amount: number; allowKnockout?: boolean }
  | { type: 'changeEnemyMp'; enemyIndex: number; operation: 'add' | 'sub'; amount: number }
  | { type: 'changeEnemyTp'; enemyIndex: number; operation: 'add' | 'sub'; amount: number }
  | { type: 'changeEnemyState'; enemyIndex: number; operation: 'add' | 'remove'; stateId: string }
  | { type: 'enemyRecoverAll'; enemyIndex: number }
  | { type: 'enemyAppear'; enemyIndex: number }
  | { type: 'enemyTransform'; enemyIndex: number; enemyId: string }
  | { type: 'showBattleAnimation'; enemyIndex: number; animationId: string }
  | { type: 'forceAction'; battler: 'actor' | 'enemy'; index: number; skillId: string; targetIndex?: number }
  | { type: 'abortBattle' }
  | { type: 'pluginCommand'; pluginName: string; commandName: string; args?: Record<string, any> }
  | { type: 'script'; code: string };

export interface PictureState {
  id: number;
  path: string;
  origin?: 'upperLeft' | 'center';
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  blendMode?: 'normal' | 'add' | 'multiply' | 'screen';
}

export interface EventGraphic {
  characterName?: string;
  characterIndex?: number;
  direction?: 'down' | 'left' | 'right' | 'up';
  pattern?: number;
  tileId?: number;
}

export interface EventPageConditions {
  switchId?: string;
  switchValue?: boolean;
  switch2Id?: string;
  switch2Value?: boolean;
  variableId?: string;
  variableValue?: number;
  selfSwitchKey?: 'A' | 'B' | 'C' | 'D';
  selfSwitchValue?: boolean;
  itemId?: string;
  actorId?: string;
}

export type EventTrigger = 'interact' | 'touch' | 'event_touch' | 'autorun' | 'parallel';
export type MoveType = 'fixed' | 'random' | 'approach' | 'custom';
export type PriorityType = 'below' | 'same' | 'above';

export interface EventPage {
  conditions?: EventPageConditions;
  solid: boolean;
  trigger?: EventTrigger;
  graphic?: EventGraphic;
  commands: EventCommand[];
  moveType?: MoveType;
  moveSpeed?: number;
  moveFrequency?: number;
  moveRoute?: MoveRoute;
  walkAnime?: boolean;
  stepAnime?: boolean;
  directionFix?: boolean;
  through?: boolean;
  priorityType?: PriorityType;
  [key: string]: unknown;
}
export interface MapEvent { id: string; name: string; note?: string; x: number; y: number; trigger: EventTrigger; pages: EventPage[];[key: string]: unknown }
export interface TileLayer { id: string; type: 'tile'; name: string; data: number[]; autotileShapes?: Record<number, Array<{ srcX: number; srcY: number; left: number; top: number }>>;[key: string]: unknown }
export interface MapParallax {
  name: string;
  loopX?: boolean;
  loopY?: boolean;
  sx?: number;
  sy?: number;
  showInEditor?: boolean;
}

export interface MapEncounter {
  troopId: string;
  weight: number;
  regionFlags?: number[];
}

export interface MapData {
  schemaVersion: 1;
  id: string;
  name: string;
  displayName?: string;
  width: number;
  height: number;
  tileSize: number;
  layers: TileLayer[];
  collision: Array<0 | 1>;
  regions?: number[];
  events: MapEvent[];
  tilesetId?: string;
  scrollType?: string;
  bgm?: string;
  bgs?: string;
  parallax?: MapParallax;
  battleback1?: string;
  battleback2?: string;
  encounterStep?: number;
  encounterList?: MapEncounter[];
  disableDash?: boolean;
  note?: string;
  [key: string]: unknown;
}
export interface AssetEntry { id: string; type: string; path: string; category?: string; license?: string; size?: number;[key: string]: unknown }
export interface AssetManifest { schemaVersion: 1; assets: Array<AssetEntry>;[key: string]: unknown }
export interface ProjectBundle { root?: string; project: ProjectManifest; game: GameData; maps: Record<string, MapData>; assets: AssetManifest }
export interface ProgressState { schemaVersion: 2; projectId: string; mapId: string; x: number; y: number; facing: 'up' | 'down' | 'left' | 'right'; switches: Record<string, boolean>; variables: Record<string, number>; inventory: Record<string, number>; actorResources: Record<string, ResourceState>; actorProgress: Record<string, ActorProgress>; gold: number; quests: Record<string, QuestProgress>; formation: string[]; settings: RuntimeSettings; telemetry: { battles: number; victories: number; turns: number; damageTaken: number }; eventPositions: Record<string, { mapId: string; x: number; y: number }>; selfSwitches?: Record<string, boolean>; timer?: { active: boolean; seconds: number }; actorOverrides?: Record<string, { name?: string; nickname?: string; profile?: string; classId?: string }>; activeStates?: Record<string, string[]>; vehiclePositions?: Record<string, { mapId: string; x: number; y: number }>; inVehicle?: 'boat' | 'ship' | 'airship' | null; showFollowers?: boolean; pictureRotations?: Record<number, number>; systemSettings?: { saveEnabled?: boolean; menuEnabled?: boolean; encounterEnabled?: boolean; formationEnabled?: boolean; battleBgm?: string; victoryMe?: string; defeatMe?: string; vehicleBgm?: Record<string, string>; windowColor?: [number, number, number] }; mapNameDisplay?: boolean; activeTilesetId?: string; parallax?: { name: string; loopX?: boolean; loopY?: boolean; sx?: number; sy?: number }; battleBack?: { battleback1?: string; battleback2?: string }; actorImages?: Record<string, { characterName?: string; characterIndex?: number; faceName?: string; faceIndex?: number; battlerName?: string }>; vehicleImages?: Record<string, { imageName: string; imageIndex: number }>; enemyBattleState?: Record<number, { hp?: number; mp?: number; tp?: number; states?: string[]; hidden?: boolean; enemyId?: string }> }

export interface ImportReport {
  source: string;
  converted: string[];
  warnings: string[];
  unsupported: string[];
  errors: string[];
  idMap: Record<string, string>;
}

export interface RecentProject {
  path: string;
  title: string;
  lastOpened: number;
}

