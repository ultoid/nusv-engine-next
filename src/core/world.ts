import { advanceQuest, completeQuest, defaultSettings, startQuest } from './adventure.js';
import { derivedStats } from './battle.js';
import { effectiveActor } from './equipment.js';
import { initialActorProgress } from './progression.js';
import { getHighestTileFlagAt, isLadderTile, isBushTile, isCounterTile, isDamageFloorTile, terrainTag } from './map-layers.js';
import type { EventCommand, EventPage, MapEvent, ProgressState, ProjectBundle } from './types.js';

export { isLadderTile, isBushTile, isCounterTile, isDamageFloorTile, terrainTag };
export type Direction = ProgressState['facing'];
export interface EventIO {
  showText(text: string): Promise<void>;
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
    eventPositions: {}
  };
}

export function activePage(event: MapEvent, state: ProgressState): EventPage | null {
  let selected: EventPage | null = null;
  for (const page of event.pages) {
    const condition = page.conditions;
    if (!condition?.switchId || state.switches[condition.switchId] === (condition.switchValue ?? true)) selected = page;
  }
  return selected;
}

export function eventPosition(state: ProgressState, mapId: string, event: MapEvent) {
  return state.eventPositions[`${mapId}:${event.id}`] ?? { mapId, x: event.x, y: event.y };
}

export function eventAt(bundle: ProjectBundle, state: ProgressState, x: number, y: number, trigger?: MapEvent['trigger']): MapEvent | null {
  return bundle.maps[state.mapId].events.find(event => {
    const position = eventPosition(state, state.mapId, event);
    return position.x === x && position.y === y && (!trigger || event.trigger === trigger) && activePage(event, state);
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
    return position.x === toX && position.y === toY && activePage(event, state)?.solid;
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

export async function executeCommands(bundle: ProjectBundle, state: ProgressState, commands: EventCommand[], io: EventIO): Promise<ProgressState> {
  let next: ProgressState = {
    ...state,
    switches: { ...state.switches },
    variables: { ...state.variables },
    inventory: { ...state.inventory },
    actorResources: { ...state.actorResources },
    actorProgress: { ...state.actorProgress },
    quests: structuredClone(state.quests),
    telemetry: { ...state.telemetry },
    eventPositions: structuredClone(state.eventPositions)
  };

  for (const command of commands) {
    if (command.type === 'text') await io.showText(command.text);
    else if (command.type === 'choice') {
      const selected = await io.choose(command.prompt, command.choices.map(choice => choice.text));
      const choice = command.choices[selected];
      if (choice) next = await executeCommands(bundle, next, choice.commands, io);
    } else if (command.type === 'setSwitch') next.switches[command.id] = command.value;
    else if (command.type === 'setVariable') next.variables[command.id] = command.value;
    else if (command.type === 'giveItem') next.inventory[command.itemId] = Math.max(0, (next.inventory[command.itemId] ?? 0) + command.amount);
    else if (command.type === 'transfer') {
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
    } else if (command.type === 'music') io.music?.(command.mood);
  }
  return next;
}

