import { advanceQuest, completeQuest, defaultSettings, startQuest } from './adventure.js';
import { derivedStats } from './battle.js';
import { effectiveActor } from './equipment.js';
import { initialActorProgress } from './progression.js';
import { getHighestTileFlagAt, isLadderTile, isBushTile, isCounterTile, isDamageFloorTile, terrainTag } from './map-layers.js';
import type { EventCommand, EventPage, EventTrigger, MapEvent, ProgressState, ProjectBundle } from './types.js';

export { isLadderTile, isBushTile, isCounterTile, isDamageFloorTile, terrainTag };
export type Direction = ProgressState['facing'];
export interface EventIO {
  showText(text: string, options?: { speakerName?: string; faceName?: string; faceIndex?: number; background?: number; positionType?: number }): Promise<void>;
  choose(prompt: string, choices: string[]): Promise<number>;
  battle(troopId: string, state: ProgressState): Promise<{
    victory: boolean;
    actorResources: ProgressState['actorResources'];
    actorProgress: ProgressState['actorProgress'];
    inventory: Record<string, number>;
    gold: number;
    turns?: number;
    damageTaken?: number;
  }>;
  shop?(shopId: string, state: ProgressState): Promise<ProgressState>;
  inn?(price: number, state: ProgressState): Promise<ProgressState>;
  cutscene?(lines: string[], vfx?: 'flash' | 'shake'): Promise<void>;
  music?(mood: 'calm' | 'danger' | 'boss' | 'silence'): void;
  eventMove?(state: ProgressState): Promise<void>;
  wait?(frames: number): Promise<void>;
  tintScreen?(tone: [number, number, number, number], duration: number, wait?: boolean): Promise<void>;
  flashScreen?(color: [number, number, number, number], duration: number, wait?: boolean): Promise<void>;
  shakeScreen?(power: number, speed: number, duration: number, wait?: boolean): Promise<void>;
  fadeoutScreen?(duration?: number): Promise<void>;
  fadeinScreen?(duration?: number): Promise<void>;
  weather?(weatherType: 'none' | 'rain' | 'storm' | 'snow', power: number, duration: number, wait?: boolean): Promise<void>;
  showPicture?(picture: import('./types.js').PictureState): Promise<void>;
  movePicture?(id: number, duration: number, x: number, y: number, scaleX?: number, scaleY?: number, opacity?: number, wait?: boolean): Promise<void>;
  erasePicture?(id: number): Promise<void>;
  showBalloon?(target: 'player' | string, balloon: string, wait?: boolean): Promise<void>;
  showAnimation?(target: 'player' | string, animationId: string, wait?: boolean): Promise<void>;
  transparency?(value: boolean): void;
  playSe?(path: string, volume?: number, pitch?: number): void;
  stopSe?(): void;
  playMe?(path: string, volume?: number, pitch?: number): Promise<void>;
  playBgs?(path: string, volume?: number, pitch?: number): void;
  fadeoutBgs?(seconds: number): Promise<void>;
  scrollMap?(direction: Direction, distance: number, speed: number): Promise<void>;
  gameOver?(): Promise<void>;
}

export const directionDelta: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0]
};

export function initialProgress(bundle: ProjectBundle): ProgressState {
  const actorProgress = Object.fromEntries(bundle.project.party.map(id => {
    const actor = bundle.game.actors.find(entry => entry.id === id)!;
    return [id, initialActorProgress(actor)];
  }));
  const actorResources = Object.fromEntries(bundle.project.party.map(id => {
    const actor = bundle.game.actors.find(entry => entry.id === id)!;
    const stats = derivedStats(effectiveActor(bundle.game, actor, actorProgress[id]));
    return [id, { hp: stats.maxHp, mp: stats.maxMp, sp: stats.maxSp }];
  }));
  return {
    schemaVersion: 2,
    projectId: bundle.project.projectId,
    mapId: bundle.project.start.mapId,
    x: bundle.project.start.x,
    y: bundle.project.start.y,
    facing: 'down',
    switches: {},
    variables: {},
    inventory: { 'item.potion': 2, 'item.phoenix-leaf': 1, 'item.respec-seal': 1 },
    actorResources,
    actorProgress,
    gold: 0,
    quests: {},
    formation: [...bundle.project.party],
    settings: defaultSettings(),
    telemetry: { battles: 0, victories: 0, turns: 0, damageTaken: 0 },
    eventPositions: {},
    selfSwitches: {}
  };
}

function pageConditionMet(page: EventPage, event: MapEvent, state: ProgressState, mapId: string): boolean {
  const c = page.conditions;
  if (!c) return true;
  if (c.switchId && state.switches[c.switchId] !== (c.switchValue ?? true)) return false;
  if (c.switch2Id && state.switches[c.switch2Id] !== (c.switch2Value ?? true)) return false;
  if (c.variableId && (state.variables[c.variableId] ?? 0) < (c.variableValue ?? 0)) return false;
  if (c.selfSwitchKey) {
    const key = `${mapId}:${event.id}:${c.selfSwitchKey}`;
    if ((state.selfSwitches?.[key] ?? false) !== (c.selfSwitchValue ?? true)) return false;
  }
  if (c.itemId && (state.inventory[c.itemId] ?? 0) <= 0) return false;
  if (c.actorId && !state.formation.includes(c.actorId)) return false;
  return true;
}

export function activePage(event: MapEvent, state: ProgressState, currentMapId?: string): EventPage | null {
  const mapId = currentMapId ?? state.mapId;
  for (let i = event.pages.length - 1; i >= 0; i--) {
    const page = event.pages[i];
    if (pageConditionMet(page, event, state, mapId)) return page;
  }
  return null;
}

export function eventPosition(state: ProgressState, mapId: string, event: MapEvent) {
  return state.eventPositions[`${mapId}:${event.id}`] ?? { mapId, x: event.x, y: event.y };
}

export function eventAt(bundle: ProjectBundle, state: ProgressState, x: number, y: number, trigger?: EventTrigger): MapEvent | null {
  return bundle.maps[state.mapId].events.find(event => {
    const position = eventPosition(state, state.mapId, event);
    if (position.x !== x || position.y !== y) return false;
    const page = activePage(event, state);
    if (!page) return false;
    const effectiveTrigger = page.trigger ?? event.trigger;
    return !trigger || effectiveTrigger === trigger;
  }) ?? null;
}

export function interactiveEventAt(bundle: ProjectBundle, state: ProgressState): MapEvent | null {
  const [dx, dy] = directionDelta[state.facing];
  let targetX = state.x + dx;
  let targetY = state.y + dy;
  let event = eventAt(bundle, state, targetX, targetY, 'interact');
  if (!event && isCounterTile(bundle, state.mapId, targetX, targetY)) {
    targetX += dx;
    targetY += dy;
    event = eventAt(bundle, state, targetX, targetY, 'interact');
  }
  return event;
}

export function canPass(bundle: ProjectBundle, state: ProgressState, fromX: number, fromY: number, direction: Direction): boolean {
  const map = bundle.maps[state.mapId];
  if (!map) return false;

  const [dx, dy] = directionDelta[direction];
  const toX = fromX + dx;
  const toY = fromY + dy;

  if (toX < 0 || toY < 0 || toX >= map.width || toY >= map.height) return false;
  if (map.collision && map.collision[toY * map.width + toX] === 1) return false;

  const dirBit =
    direction === 'down' ? 0x01 :
    direction === 'left' ? 0x02 :
    direction === 'right' ? 0x04 : 0x08;

  const reverseDirBit =
    direction === 'down' ? 0x08 :
    direction === 'up' ? 0x01 :
    direction === 'left' ? 0x04 : 0x02;

  const fromFlag = getHighestTileFlagAt(bundle, state.mapId, fromX, fromY);
  if ((fromFlag & dirBit) !== 0) return false;

  const toFlag = getHighestTileFlagAt(bundle, state.mapId, toX, toY);
  if ((toFlag & reverseDirBit) !== 0) return false;

  const hasSolidEvent = map.events.some(event => {
    const position = eventPosition(state, state.mapId, event);
    if (position.x !== toX || position.y !== toY) return false;
    const page = activePage(event, state);
    if (!page) return false;
    if (page.through) return false;
    if (page.priorityType === 'below' || page.priorityType === 'above') return false;
    return page.solid;
  });
  if (hasSolidEvent) return false;

  return true;
}

export function isBlocked(
  bundle: ProjectBundle,
  state: ProgressState,
  x: number,
  y: number,
  direction?: Direction,
  fromX?: number,
  fromY?: number
): boolean {
  if (direction !== undefined && fromX !== undefined && fromY !== undefined) {
    return !canPass(bundle, state, fromX, fromY, direction);
  }
  const map = bundle.maps[state.mapId];
  if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height || map.collision[y * map.width + x] === 1) return true;
  const flag = getHighestTileFlagAt(bundle, state.mapId, x, y);
  if ((flag & 0x0f) === 0x0f) return true;
  return map.events.some(event => {
    const position = eventPosition(state, state.mapId, event);
    return position.x === x && position.y === y && activePage(event, state)?.solid;
  });
}

export function move(bundle: ProjectBundle, state: ProgressState, direction: Direction): ProgressState {
  const [dx, dy] = directionDelta[direction];
  const toX = state.x + dx;
  const toY = state.y + dy;
  let next = { ...state, facing: direction };

  if (canPass(bundle, state, state.x, state.y, direction)) {
    next.x = toX;
    next.y = toY;

    if (isLadderTile(bundle, state.mapId, toX, toY)) {
      next.facing = 'up';
    }

    if (isDamageFloorTile(bundle, state.mapId, toX, toY)) {
      const nextResources = { ...next.actorResources };
      for (const actorId of Object.keys(nextResources)) {
        const res = nextResources[actorId];
        if (res && res.hp > 0) {
          nextResources[actorId] = {
            ...res,
            hp: Math.max(1, res.hp - 10)
          };
        }
      }
      next.actorResources = nextResources;
    }
  } else {
    if (isLadderTile(bundle, state.mapId, state.x, state.y)) {
      next.facing = 'up';
    }
  }

  return next;
}

async function runMovement(bundle: ProjectBundle, state: ProgressState, movement: NonNullable<Extract<EventCommand, { type: 'cutscene' }>['movement']>, io: EventIO) {
  const map = bundle.maps[state.mapId];
  const event = map.events.find(entry => entry.id === movement.eventId);
  if (!event) throw new Error(`cutscene movement: ${movement.eventId} tidak ditemukan`);
  let next = state;
  for (const direction of movement.directions) {
    const key = `${map.id}:${event.id}`;
    const current = eventPosition(next, map.id, event);
    const [dx, dy] = directionDelta[direction];
    const x = current.x + dx;
    const y = current.y + dy;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height || map.collision[y * map.width + x] === 1) break;
    next = { ...next, eventPositions: { ...next.eventPositions, [key]: { mapId: map.id, x, y } } };
    await io.eventMove?.(next);
  }
  return next;
}

export async function runMoveRoute(
  bundle: ProjectBundle,
  state: ProgressState,
  target: 'player' | 'this' | string,
  route: import('./types.js').MoveRoute,
  io: EventIO,
  context?: { eventId?: string; mapId?: string }
): Promise<ProgressState> {
  const mapId = context?.mapId ?? state.mapId;
  const map = bundle.maps[mapId];
  if (!map) return state;

  const isPlayer = target === 'player';
  const resolvedEventId = target === 'this' ? (context?.eventId ?? '') : (isPlayer ? '' : target);
  let next = { ...state };

  for (const cmd of route.list) {
    const currentX = isPlayer
      ? next.x
      : (next.eventPositions[`${mapId}:${resolvedEventId}`]?.x ?? map.events.find(e => e.id === resolvedEventId)?.x ?? 0);
    const currentY = isPlayer
      ? next.y
      : (next.eventPositions[`${mapId}:${resolvedEventId}`]?.y ?? map.events.find(e => e.id === resolvedEventId)?.y ?? 0);
    const currentFacing: Direction = isPlayer ? next.facing : 'down';

    const setPos = (x: number, y: number, facing?: Direction) => {
      if (isPlayer) {
        next = { ...next, x, y, facing: facing ?? next.facing };
      } else if (resolvedEventId) {
        const key = `${mapId}:${resolvedEventId}`;
        next = {
          ...next,
          eventPositions: {
            ...next.eventPositions,
            [key]: { mapId, x, y }
          }
        };
      }
    };

    const tryStep = (dir: Direction) => {
      const [dx, dy] = directionDelta[dir];
      const targetX = currentX + dx;
      const targetY = currentY + dy;
      const inBounds = targetX >= 0 && targetY >= 0 && targetX < map.width && targetY < map.height;
      const passable = inBounds && (map.collision[targetY * map.width + targetX] !== 1);

      if (passable) {
        setPos(targetX, targetY, dir);
      } else if (!route.skippable) {
        if (isPlayer) next.facing = dir;
      }
    };

    switch (cmd.code) {
      case 'moveDown': tryStep('down'); break;
      case 'moveLeft': tryStep('left'); break;
      case 'moveRight': tryStep('right'); break;
      case 'moveUp': tryStep('up'); break;
      case 'stepForward': tryStep(currentFacing); break;
      case 'stepBackward': {
        const reverseDir: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
        tryStep(reverseDir[currentFacing]);
        break;
      }
      case 'moveTowardPlayer': {
        const dx = next.x - currentX;
        const dy = next.y - currentY;
        if (Math.abs(dx) > Math.abs(dy)) tryStep(dx > 0 ? 'right' : 'left');
        else if (dy !== 0) tryStep(dy > 0 ? 'down' : 'up');
        break;
      }
      case 'moveAwayFromPlayer': {
        const dx = next.x - currentX;
        const dy = next.y - currentY;
        if (Math.abs(dx) > Math.abs(dy)) tryStep(dx > 0 ? 'left' : 'right');
        else if (dy !== 0) tryStep(dy > 0 ? 'up' : 'down');
        break;
      }
      case 'moveRandom': {
        const dirs: Direction[] = ['down', 'left', 'right', 'up'];
        tryStep(dirs[Math.floor(Math.random() * dirs.length)]);
        break;
      }
      case 'turnDown': if (isPlayer) next.facing = 'down'; break;
      case 'turnLeft': if (isPlayer) next.facing = 'left'; break;
      case 'turnRight': if (isPlayer) next.facing = 'right'; break;
      case 'turnUp': if (isPlayer) next.facing = 'up'; break;
      case 'wait': {
        const frames = Number(cmd.parameters?.[0] ?? 60);
        await io.wait?.(frames);
        break;
      }
      case 'switchOn': {
        const swId = String(cmd.parameters?.[0] ?? '');
        if (swId) next.switches[swId] = true;
        break;
      }
      case 'switchOff': {
        const swId = String(cmd.parameters?.[0] ?? '');
        if (swId) next.switches[swId] = false;
        break;
      }
      case 'script': {
        const code = String(cmd.parameters?.[0] ?? '');
        if (code) {
          try {
            new Function('state', 'bundle', code)(next, bundle);
          } catch {}
        }
        break;
      }
    }

    await io.eventMove?.(next);
  }

  return next;
}

type ExecutionSignal = 'none' | 'break' | 'exit';

interface ExecutionResult {
  state: ProgressState;
  signal: ExecutionSignal;
}

async function runCommandList(
  bundle: ProjectBundle,
  state: ProgressState,
  commands: EventCommand[],
  io: EventIO,
  context?: { eventId?: string; mapId?: string }
): Promise<ExecutionResult> {
  let next: ProgressState = {
    ...state,
    switches: { ...state.switches },
    variables: { ...state.variables },
    selfSwitches: { ...(state.selfSwitches ?? {}) },
    inventory: { ...state.inventory },
    actorResources: { ...state.actorResources },
    actorProgress: { ...state.actorProgress },
    quests: structuredClone(state.quests),
    telemetry: { ...state.telemetry },
    eventPositions: structuredClone(state.eventPositions)
  };

  const eventId = context?.eventId;
  const currentMapId = context?.mapId ?? state.mapId;

  let pc = 0;
  while (pc < commands.length) {
    const command = commands[pc];
    if (command.type === 'text') {
      await io.showText(command.text, {
        speakerName: command.speakerName,
        faceName: command.faceName,
        faceIndex: command.faceIndex,
        background: command.background,
        positionType: command.positionType
      });
    } else if (command.type === 'choice') {
      const selected = await io.choose(command.prompt, command.choices.map(choice => choice.text));
      const choice = command.choices[selected];
      if (choice) {
        const sub = await runCommandList(bundle, next, choice.commands, io, context);
        next = sub.state;
        if (sub.signal !== 'none') return sub;
      }
    } else if (command.type === 'setSwitch') {
      next.switches[command.id] = command.value;
    } else if (command.type === 'setVariable') {
      next.variables[command.id] = command.value;
    } else if (command.type === 'setSelfSwitch') {
      const targetEventId = command.eventId ?? eventId;
      if (targetEventId) {
        const selfKey = `${currentMapId}:${targetEventId}:${command.key}`;
        next.selfSwitches = { ...next.selfSwitches, [selfKey]: command.value };
      }
    } else if (command.type === 'changeGold') {
      const op = command.operation ?? 'add';
      next.gold = op === 'add' ? next.gold + command.amount : Math.max(0, next.gold - command.amount);
    } else if (command.type === 'branch') {
      let condMet = false;
      const c = command.condition;
      if (c.kind === 'switch') {
        condMet = (next.switches[c.id] ?? false) === c.value;
      } else if (c.kind === 'variable') {
        const val = next.variables[c.id] ?? 0;
        if (c.op === '==') condMet = val === c.value;
        else if (c.op === '>=') condMet = val >= c.value;
        else if (c.op === '<=') condMet = val <= c.value;
        else if (c.op === '>') condMet = val > c.value;
        else if (c.op === '<') condMet = val < c.value;
        else if (c.op === '!=') condMet = val !== c.value;
      } else if (c.kind === 'selfSwitch') {
        const targetEventId = c.eventId ?? eventId;
        if (targetEventId) {
          const selfKey = `${currentMapId}:${targetEventId}:${c.key}`;
          condMet = (next.selfSwitches?.[selfKey] ?? false) === c.value;
        }
      } else if (c.kind === 'item') {
        condMet = (next.inventory[c.itemId] ?? 0) > 0;
      } else if (c.kind === 'gold') {
        condMet = c.op === '>=' ? next.gold >= c.amount : next.gold <= c.amount;
      } else if (c.kind === 'actor') {
        condMet = next.formation.includes(c.actorId);
      } else if (c.kind === 'script') {
        try {
          const fn = new Function('state', 'bundle', `with(state){ return (${c.code}); }`);
          condMet = Boolean(fn(next, bundle));
        } catch {
          condMet = false;
        }
      }
      if (condMet) {
        const sub = await runCommandList(bundle, next, command.thenCommands, io, context);
        next = sub.state;
        if (sub.signal !== 'none') return sub;
      } else if (command.elseCommands && command.elseCommands.length > 0) {
        const sub = await runCommandList(bundle, next, command.elseCommands, io, context);
        next = sub.state;
        if (sub.signal !== 'none') return sub;
      }
    } else if (command.type === 'loop') {
      let maxIterations = 100000;
      while (maxIterations-- > 0) {
        const sub = await runCommandList(bundle, next, command.commands, io, context);
        next = sub.state;
        if (sub.signal === 'break') break;
        if (sub.signal === 'exit') return sub;
      }
    } else if (command.type === 'breakLoop') {
      return { state: next, signal: 'break' };
    } else if (command.type === 'exitEvent') {
      return { state: next, signal: 'exit' };
    } else if (command.type === 'label') {
      // label marker
    } else if (command.type === 'jumpToLabel') {
      const targetIdx = commands.findIndex(cmd => cmd.type === 'label' && cmd.name === command.name);
      if (targetIdx !== -1) {
        pc = targetIdx;
        continue;
      }
    } else if (command.type === 'wait') {
      await io.wait?.(command.frames);
    } else if (command.type === 'giveItem') {
      next.inventory[command.itemId] = Math.max(0, (next.inventory[command.itemId] ?? 0) + command.amount);
    } else if (command.type === 'transfer') {
      const map = bundle.maps[command.mapId];
      if (!map || command.x < 0 || command.y < 0 || command.x >= map.width || command.y >= map.height || map.collision[command.y * map.width + command.x] === 1) {
        throw new Error(`transfer ${command.mapId}: tujuan tidak valid`);
      }
      next = { ...next, mapId: command.mapId, x: command.x, y: command.y };
    } else if (command.type === 'battle') {
      const result = await io.battle(command.troopId, next);
      next = {
        ...next,
        actorResources: result.actorResources,
        actorProgress: result.actorProgress,
        inventory: result.inventory,
        gold: result.gold,
        telemetry: {
          battles: next.telemetry.battles + 1,
          victories: next.telemetry.victories + (result.victory ? 1 : 0),
          turns: next.telemetry.turns + (result.turns ?? 0),
          damageTaken: next.telemetry.damageTaken + (result.damageTaken ?? 0)
        }
      };
      if (result.victory && command.victorySwitchId) next.switches[command.victorySwitchId] = true;
    } else if (command.type === 'questStart') next = startQuest(bundle, next, command.questId);
    else if (command.type === 'questAdvance') next = advanceQuest(bundle, next, command.questId, command.objectiveId, command.amount);
    else if (command.type === 'questComplete') next = completeQuest(bundle, next, command.questId);
    else if (command.type === 'shop') {
      if (!io.shop) throw new Error('shop UI tidak tersedia');
      next = await io.shop(command.shopId, next);
    } else if (command.type === 'inn') {
      if (!io.inn) throw new Error('inn UI tidak tersedia');
      next = await io.inn(command.price, next);
    } else if (command.type === 'cutscene') {
      if (command.movement) next = await runMovement(bundle, next, command.movement, io);
      if (io.cutscene) await io.cutscene(command.lines, command.vfx);
      else for (const line of command.lines) await io.showText(line);
    } else if (command.type === 'music') {
      io.music?.(command.mood);
    } else if (command.type === 'tintScreen') {
      await io.tintScreen?.(command.tone, command.duration, command.wait);
    } else if (command.type === 'flashScreen') {
      await io.flashScreen?.(command.color, command.duration, command.wait);
    } else if (command.type === 'shakeScreen') {
      await io.shakeScreen?.(command.power, command.speed, command.duration, command.wait);
    } else if (command.type === 'fadeoutScreen') {
      await io.fadeoutScreen?.(command.duration);
    } else if (command.type === 'fadeinScreen') {
      await io.fadeinScreen?.(command.duration);
    } else if (command.type === 'weather') {
      await io.weather?.(command.weatherType, command.power, command.duration, command.wait);
    } else if (command.type === 'showPicture') {
      await io.showPicture?.(command.picture);
    } else if (command.type === 'movePicture') {
      await io.movePicture?.(command.id, command.duration, command.x, command.y, command.scaleX, command.scaleY, command.opacity, command.wait);
    } else if (command.type === 'erasePicture') {
      await io.erasePicture?.(command.id);
    } else if (command.type === 'showBalloon') {
      await io.showBalloon?.(command.target, command.balloon, command.wait);
    } else if (command.type === 'showAnimation') {
      await io.showAnimation?.(command.target, command.animationId, command.wait);
    } else if (command.type === 'transparency') {
      io.transparency?.(command.value);
    } else if (command.type === 'playSe') {
      io.playSe?.(command.path, command.volume, command.pitch);
    } else if (command.type === 'stopSe') {
      io.stopSe?.();
    } else if (command.type === 'playMe') {
      await io.playMe?.(command.path, command.volume, command.pitch);
    } else if (command.type === 'playBgs') {
      io.playBgs?.(command.path, command.volume, command.pitch);
    } else if (command.type === 'fadeoutBgs') {
      await io.fadeoutBgs?.(command.seconds);
    } else if (command.type === 'setMovementRoute') {
      next = await runMoveRoute(bundle, next, command.target, command.route, io, context);
    } else if (command.type === 'changeHp') {
      const targetIds = command.actorId ? [command.actorId] : next.formation;
      for (const aId of targetIds) {
        const actor = bundle.game.actors.find(a => a.id === aId);
        if (actor) {
          const stats = derivedStats(effectiveActor(bundle.game, actor, next.actorProgress[aId]));
          const currentRes = next.actorResources[aId] ?? { hp: stats.maxHp, mp: stats.maxMp, sp: stats.maxSp };
          let newHp = command.operation === 'add' ? currentRes.hp + command.amount : currentRes.hp - command.amount;
          newHp = Math.min(stats.maxHp, newHp);
          const minHp = command.allowKnockout ? 0 : 1;
          newHp = Math.max(minHp, newHp);
          next.actorResources[aId] = { ...currentRes, hp: newHp };
        }
      }
    } else if (command.type === 'changeMp') {
      const targetIds = command.actorId ? [command.actorId] : next.formation;
      for (const aId of targetIds) {
        const actor = bundle.game.actors.find(a => a.id === aId);
        if (actor) {
          const stats = derivedStats(effectiveActor(bundle.game, actor, next.actorProgress[aId]));
          const currentRes = next.actorResources[aId] ?? { hp: stats.maxHp, mp: stats.maxMp, sp: stats.maxSp };
          let newMp = command.operation === 'add' ? currentRes.mp + command.amount : currentRes.mp - command.amount;
          newMp = Math.max(0, Math.min(stats.maxMp, newMp));
          next.actorResources[aId] = { ...currentRes, mp: newMp };
        }
      }
    } else if (command.type === 'recoverAll') {
      const targetIds = command.actorId ? [command.actorId] : next.formation;
      for (const aId of targetIds) {
        const actor = bundle.game.actors.find(a => a.id === aId);
        if (actor) {
          const stats = derivedStats(effectiveActor(bundle.game, actor, next.actorProgress[aId]));
          next.actorResources[aId] = { hp: stats.maxHp, mp: stats.maxMp, sp: stats.maxSp };
        }
      }
    } else if (command.type === 'changeLevel') {
      const prog = next.actorProgress[command.actorId];
      if (prog) {
        const newLvl = command.operation === 'add' ? prog.baseLevel + command.amount : Math.max(1, prog.baseLevel - command.amount);
        prog.baseLevel = Math.min(99, Math.max(1, newLvl));
      }
    } else if (command.type === 'changeExp') {
      const prog = next.actorProgress[command.actorId];
      if (prog) {
        const newExp = command.operation === 'add' ? prog.baseExp + command.amount : Math.max(0, prog.baseExp - command.amount);
        prog.baseExp = newExp;
      }
    } else if (command.type === 'changePartyMember') {
      if (command.operation === 'add' && !next.formation.includes(command.actorId)) {
        next.formation.push(command.actorId);
        const actor = bundle.game.actors.find(a => a.id === command.actorId);
        if (actor && !next.actorProgress[command.actorId]) {
          next.actorProgress[command.actorId] = initialActorProgress(actor);
          const stats = derivedStats(effectiveActor(bundle.game, actor, next.actorProgress[command.actorId]));
          next.actorResources[command.actorId] = { hp: stats.maxHp, mp: stats.maxMp, sp: stats.maxSp };
        }
      } else if (command.operation === 'remove') {
        next.formation = next.formation.filter(id => id !== command.actorId);
      }
    } else if (command.type === 'changeSkill') {
      const actor = bundle.game.actors.find(a => a.id === command.actorId);
      if (actor) {
        if (command.operation === 'learn' && !actor.skillIds.includes(command.skillId)) {
          actor.skillIds.push(command.skillId);
        } else if (command.operation === 'forget') {
          actor.skillIds = actor.skillIds.filter(id => id !== command.skillId);
        }
      }
    } else if (command.type === 'setEventLocation') {
      const targetId = command.eventId === 'this' ? (context?.eventId ?? '') : command.eventId;
      if (targetId) {
        next.eventPositions[`${currentMapId}:${targetId}`] = { mapId: currentMapId, x: command.x, y: command.y };
      }
    } else if (command.type === 'eraseEvent') {
      const targetId = command.eventId ?? context?.eventId;
      if (targetId) {
        next.eventPositions[`${currentMapId}:${targetId}`] = { mapId: currentMapId, x: -999, y: -999 };
      }
    } else if (command.type === 'scrollMap') {
      await io.scrollMap?.(command.direction, command.distance, command.speed);
    } else if (command.type === 'gameOver') {
      await io.gameOver?.();
    } else if (command.type === 'script') {
      try {
        new Function('state', 'bundle', command.code)(next, bundle);
      } catch {}
    }

    pc++;
  }
  return { state: next, signal: 'none' };
}

export async function executeCommands(
  bundle: ProjectBundle,
  state: ProgressState,
  commands: EventCommand[],
  io: EventIO,
  context?: { eventId?: string; mapId?: string }
): Promise<ProgressState> {
  const result = await runCommandList(bundle, state, commands, io, context);
  return result.state;
}

