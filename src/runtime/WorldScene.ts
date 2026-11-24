import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { MapEvent, ProgressState, ProjectBundle } from '../core/types.js';
import { autotileMask, DEFAULT_TILESETS, getAutotileQuadrants, tileDefinition } from '../core/map-layers.js';
import { activePage, directionDelta, eventAt, eventPosition, executeCommands, initialProgress, move, interactiveEventAt, isLadderTile, isBushTile, isDamageFloorTile, type Direction, type EventIO } from '../core/world.js';
import { AdventureController, applyRuntimeSettings } from './AdventureController.js';
import type { AudioManager } from './AudioManager.js';
import { BattleController } from './BattleController.js';
import { DebugOverlay } from './DebugOverlay.js';
import { DialogueController } from './DialogueController.js';
import type { InputManager } from './InputManager.js';
import { PartyController } from './PartyController.js';
import { TextureManager } from './TextureManager.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class WorldScene {
  readonly view = new Container();
  private world = new Container();
  private playerLayer = new Container();
  private eventLayer = new Container();
  private label?: Text;
  private state: ProgressState;
  private busy = false;
  private dialogue = new DialogueController();
  private battle: BattleController;
  private party: PartyController;
  private debug: DebugOverlay;
  private adventure: AdventureController;
  private textures: TextureManager;
  private stepCount = 0;
  private parallelRunning = new Set<string>();

  constructor(
    private readonly bundle: ProjectBundle,
    private audio: AudioManager,
    textures?: TextureManager
  ) {
    this.textures = textures ?? new TextureManager();
    this.state = initialProgress(bundle);
    applyRuntimeSettings(this.state.settings);
    this.audio.setMix(this.state.settings);
    this.debug = new DebugOverlay(bundle.project.debug === true);
    this.battle = new BattleController(
      bundle,
      message => {
        this.debug.log(message);
        this.debug.draw(this.state);
      },
      this.audio,
      this.textures
    );
    this.party = new PartyController(bundle);
    this.adventure = new AdventureController(bundle, settings => this.audio.setMix(settings));
    this.debug.log(`playtest start: ${this.state.mapId}`);
  }

  enter() {
    this.view.addChild(this.world);
    this.playMapBgm();
    this.rebuild();
  }

  private playMapBgm() {
    const map = this.bundle.maps[this.state.mapId];
    const bgm = (map as Record<string, unknown> | undefined)?.bgm as string | undefined;
    if (bgm) {
      void this.audio.playBgm(bgm);
    }
  }

  private rebuild() {
    this.world.removeChildren().forEach(child => child.destroy());
    this.label?.destroy();
    const map = this.bundle.maps[this.state.mapId], tile = map.tileSize;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const blocked = map.collision[y * map.width + x] === 1;
        this.world.addChild(new Graphics().rect(x * tile, y * tile, tile - 1, tile - 1).fill(blocked ? 0x18232a : (x + y) % 2 ? 0x31594c : 0x365f51));
      }
    }

    const tilesets = (this.bundle.game.tilesets && this.bundle.game.tilesets.length > 0)
      ? this.bundle.game.tilesets
      : DEFAULT_TILESETS;
    const currentTileset = (map.tilesetId ? tilesets.find(ts => ts.id === map.tilesetId) : undefined)
      || tilesets.find(ts => ts.mode === (map.name?.toLowerCase().includes('world') ? 0 : 1))
      || tilesets[0];

    map.layers.forEach((layer, layerIndex) => layer.data.forEach((tileId, index) => {
      if (tileId === 0) return;
      const x = index % map.width, y = Math.floor(index / map.width), definition = tileDefinition(tileId, currentTileset);

      if (definition.autotile && definition.autotileBaseX !== undefined && definition.autotileBaseY !== undefined && definition.tileset) {
        const quads = getAutotileQuadrants(definition, layer.data, index, map.width, map.height, layer.autotileShapes?.[index]);
        const placeholder = new Graphics().rect(x * tile, y * tile, tile, tile).fill({ color: definition.color, alpha: layerIndex === 0 ? 1 : 0.85 });
        this.world.addChild(placeholder);

        void Promise.all(quads.map(q => this.textures.getTileTextureByPixel(definition.tileset!, q.srcX, q.srcY, 24, 24))).then(textures => {
          if (placeholder.parent) {
            const parent = placeholder.parent;
            placeholder.destroy();
            textures.forEach((texture, qIdx) => {
              if (!texture) return;
              const q = quads[qIdx];
              const sprite = new Sprite(texture);
              sprite.width = tile / 2;
              sprite.height = tile / 2;
              sprite.position.set(x * tile + (q.left / 48) * tile, y * tile + (q.top / 48) * tile);
              parent.addChild(sprite);
            });
          }
        });
      } else if (definition.tileset && definition.srcX !== undefined && definition.srcY !== undefined) {
        const placeholder = new Graphics().rect(x * tile, y * tile, tile, tile).fill({ color: definition.color, alpha: layerIndex === 0 ? 1 : 0.85 });
        this.world.addChild(placeholder);

        void this.textures.getTileTextureByPixel(definition.tileset, definition.srcX, definition.srcY, tile).then(texture => {
          if (texture && placeholder.parent) {
            const parent = placeholder.parent;
            placeholder.destroy();
            const sprite = new Sprite(texture);
            sprite.width = tile;
            sprite.height = tile;
            sprite.position.set(x * tile, y * tile);
            parent.addChild(sprite);
          }
        });
      } else if (layerIndex === 0) {
        const graphic = new Graphics().rect(x * tile, y * tile, tile - 1, tile - 1).fill(definition.color);
        const mask = autotileMask(layer.data, index, map.width, map.height);
        if (!(mask & 1)) graphic.moveTo(x * tile, y * tile).lineTo((x + 1) * tile - 1, y * tile);
        if (!(mask & 2)) graphic.moveTo((x + 1) * tile - 1, y * tile).lineTo((x + 1) * tile - 1, (y + 1) * tile - 1);
        if (!(mask & 4)) graphic.moveTo(x * tile, (y + 1) * tile - 1).lineTo((x + 1) * tile - 1, (y + 1) * tile - 1);
        if (!(mask & 8)) graphic.moveTo(x * tile, y * tile).lineTo(x * tile, (y + 1) * tile - 1);
        graphic.stroke({ color: 0xffffff, alpha: .22, width: 2 });
        this.world.addChild(graphic);
      } else {
        const inset = Math.max(4, 10 - layerIndex * 2);
        this.world.addChild(new Graphics().roundRect(x * tile + inset, y * tile + inset, tile - inset * 2, tile - inset * 2, Math.max(2, 7 - layerIndex)).fill({ color: definition.color, alpha: .9 }));
        if (definition.glyph) {
          const glyph = new Text({ text: definition.glyph, style: { fill: 0xffffff, fontSize: Math.max(12, tile * .38), fontFamily: 'system-ui', fontWeight: 'bold' } });
          glyph.anchor.set(.5);
          glyph.position.set((x + .5) * tile, (y + .5) * tile);
          this.world.addChild(glyph);
        }
      }
    }));

    this.eventLayer = new Container();
    this.world.addChild(this.eventLayer);
    for (const event of map.events) {
      const page = activePage(event, this.state);
      if (!page || (!page.solid && page.commands.length === 0)) continue;
      const position = eventPosition(this.state, map.id, event);
      const isTouch = event.trigger === 'touch';

      let eventGraphic: string | null = page.graphic?.characterName ?? null;
      let eventIdx = page.graphic?.characterIndex ?? 0;
      let eventDir: Direction = page.graphic?.direction ?? 'down';
      let eventStep = page.graphic?.pattern ?? 1;

      if (!eventGraphic) {
        if (event.id.includes('gate') || event.name.toLowerCase().includes('gerbang') || event.name.toLowerCase().includes('pintu')) {
          eventGraphic = 'assets/characters/Door1.png';
          const isOpen = this.state.switches['door.open'] === true;
          eventDir = isOpen ? 'right' : 'down';
          eventStep = isOpen ? 2 : 1;
        } else if (event.id.includes('chest') || event.name.toLowerCase().includes('peti')) {
          eventGraphic = 'assets/characters/Chest.png';
        } else if (event.id.includes('guide') || event.name.toLowerCase().includes('penjaga')) {
          eventGraphic = 'assets/characters/Actor2.png';
          eventIdx = 0;
          eventDir = 'down';
        }
      }

      const eventFallback = new Graphics().roundRect(position.x * tile + 8, position.y * tile + 8, tile - 16, tile - 16, 7).fill(isTouch ? 0xc99b4e : 0x77a9c8);
      this.eventLayer.addChild(eventFallback);

      if (eventGraphic) {
        void this.textures.getCharacterFrame(eventGraphic, eventIdx, eventDir, eventStep).then(frame => {
          if (frame && eventFallback.parent) {
            const parent = eventFallback.parent;
            eventFallback.destroy();
            const sprite = new Sprite(frame);
            sprite.width = tile;
            sprite.height = tile;
            sprite.position.set(position.x * tile, position.y * tile);
            parent.addChild(sprite);
          }
        });
      }
    }

    this.playerLayer = new Container();
    this.world.addChild(this.playerLayer);
    this.renderPlayer(tile);

    const { width, height } = this.bundle.project.logicalResolution;
    const px = (this.state.x + .5) * tile, py = (this.state.y + .5) * tile;
    this.world.position.set(
      map.width * tile <= width ? (width - map.width * tile) / 2 : Math.min(0, Math.max(width - map.width * tile, width / 2 - px)),
      map.height * tile <= height ? (height - map.height * tile) / 2 : Math.min(0, Math.max(height - map.height * tile, height / 2 - py))
    );

    this.label = new Text({
      text: `${map.name} · X party · Q jurnal · Esc settings · F5/F9 save/load`,
      style: { fill: 0xe8d19c, fontSize: 18, fontFamily: 'system-ui' }
    });
    this.label.position.set(24, 20);
    this.view.addChild(this.label);
  }

  private renderPlayer(tile: number) {
    this.playerLayer.removeChildren().forEach(child => child.destroy());
    const leaderId = this.bundle.project.party[0];
    const actor = this.bundle.game.actors.find(a => a.id === leaderId);
    const charImage = (actor as Record<string, unknown> | undefined)?.characterImage as string || 'assets/characters/Actor1.png';
    const charIdx = (actor as Record<string, unknown> | undefined)?.characterIndex as number || 0;

    const onLadder = isLadderTile(this.bundle, this.state.mapId, this.state.x, this.state.y);
    const onBush = isBushTile(this.bundle, this.state.mapId, this.state.x, this.state.y);
    const facing = onLadder ? 'up' : this.state.facing;

    const fallback = new Graphics().roundRect(this.state.x * tile + 7, this.state.y * tile + 7, tile - 14, tile - 14, 9).fill(0x65dfbd);
    this.playerLayer.addChild(fallback);

    void this.textures.getCharacterFrame(charImage, charIdx, facing, this.stepCount).then(frame => {
      if (frame && fallback.parent) {
        fallback.destroy();
        const sprite = new Sprite(frame);
        sprite.width = tile;
        sprite.height = tile;
        sprite.position.set(this.state.x * tile, this.state.y * tile);
        if (onBush) {
          sprite.alpha = 0.8;
        }
        this.playerLayer.addChild(sprite);

        // Visual depth in bush
        if (onBush) {
          const bushDepth = new Graphics()
            .rect(this.state.x * tile, this.state.y * tile + tile * 0.65, tile, tile * 0.35)
            .fill({ color: 0x22c55e, alpha: 0.35 });
          this.playerLayer.addChild(bushDepth);
        }
      }
    });
  }

  update(_delta: number, input: InputManager) {
    if (input.wasPressed('debug')) {
      this.debug.toggle();
      this.debug.draw(this.state);
    }
    const currentMap = this.bundle.maps[this.state.mapId];
    if (currentMap) {
      const parallelEvents = currentMap.events.filter(e => {
        const page = activePage(e, this.state);
        return page && (page.trigger ?? e.trigger) === 'parallel';
      });
      for (const pe of parallelEvents) {
        if (!this.parallelRunning.has(pe.id)) {
          this.parallelRunning.add(pe.id);
          void this.runParallelEvent(pe);
        }
      }
      if (!this.busy) {
        const autorunEvent = currentMap.events.find(e => {
          const page = activePage(e, this.state);
          return page && (page.trigger ?? e.trigger) === 'autorun';
        });
        if (autorunEvent) {
          void this.runEvent(autorunEvent);
          return;
        }
      }
    }
    if (this.busy) return;
    if (input.wasPressed('menu')) return void this.openParty();
    if (input.wasPressed('journal')) return void this.openJournal();
    if (input.wasPressed('settings')) return void this.openSettings();
    if (input.wasPressed('save')) return void this.save();
    if (input.wasPressed('load')) return void this.load();

    const directions: Array<[Direction, Parameters<InputManager['wasPressed']>[0]]> = [
      ['up', 'move.up'],
      ['down', 'move.down'],
      ['left', 'move.left'],
      ['right', 'move.right']
    ];

    for (const [direction, action] of directions) {
      if (input.wasPressed(action)) {
        const before = this.state;
        this.stepCount++;
        this.state = move(this.bundle, this.state, direction);
        void this.audio.playSe('assets/audio/se/Cursor1.ogg');
        this.rebuild();
        this.debug.draw(this.state);
        if (before.x !== this.state.x || before.y !== this.state.y) {
          const map = this.bundle.maps[this.state.mapId];
          const tile = 48;
          if (isDamageFloorTile(this.bundle, this.state.mapId, this.state.x, this.state.y)) {
            void this.audio.playSe('assets/audio/se/Damage1.ogg').catch(() => {});
            const flash = new Graphics().rect(0, 0, map.width * tile, map.height * tile).fill({ color: 0xef4444, alpha: 0.25 });
            this.world.addChild(flash);
            setTimeout(() => flash.destroy(), 100);
          }
          const event = eventAt(this.bundle, this.state, this.state.x, this.state.y, 'touch');
          if (event) void this.runEvent(event);
        }
        return;
      }
    }

    if (input.wasPressed('confirm')) {
      const event = interactiveEventAt(this.bundle, this.state);
      if (event) {
        void this.audio.playSe('assets/audio/se/Decision1.ogg');
        void this.runEvent(event);
      }
    }
  }

  private createEventIO(): EventIO {
    return {
      showText: async (text: string, options?: { speakerName?: string; faceName?: string; faceIndex?: number; background?: number; positionType?: number }) => {
        let faceUrl: string | undefined;
        if (options?.faceName) {
          const url = await this.textures.getFaceDataUrl(options.faceName, options.faceIndex ?? 0);
          if (url) faceUrl = url;
        }
        return this.dialogue.showText(text, { ...options, faceUrl });
      },
      choose: (prompt: string, choices: string[]) => this.dialogue.choose(prompt, choices),
      inputNumber: (variableId: string, digits: number) => this.dialogue.inputNumber(digits, this.state.variables[variableId] ?? 0),
      selectItem: async (variableId: string, itemType?: string) => {
        const inventoryItems = Object.keys(this.state.inventory)
          .filter(id => (this.state.inventory[id] ?? 0) > 0)
          .map(id => {
            const def = this.bundle.game.items.find(it => it.id === id);
            return { id, name: def?.name ?? id, kind: def?.kind };
          })
          .filter(it => !itemType || (itemType === 'key' ? it.kind === 'key' : true));
        return this.dialogue.selectItem(inventoryItems);
      },
      scrollingText: (text: string, speed?: number) => this.dialogue.scrollingText(text, speed),
      battle: async (troopId: string, state: ProgressState) => {
        const result = await this.battle.run(troopId, state);
        this.playMapBgm();
        return result;
      },
      shop: (shopId: string, state: ProgressState) => this.adventure.shop(shopId, state),
      inn: (price: number, state: ProgressState) => this.adventure.inn(price, state),
      cutscene: (lines: string[], vfx: 'flash' | 'shake' | undefined) => this.adventure.cutscene(lines, vfx, text => this.dialogue.showText(text)),
      music: (mood: 'calm' | 'danger' | 'boss' | 'silence') => this.audio.setMood(mood),
      eventMove: async (state: ProgressState) => {
        this.state = state;
        this.rebuild();
        await wait(state.settings.reducedMotion ? 1 : 120);
      },
      wait: async (frames: number) => {
        await wait(frames * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      tintScreen: async (_tone, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      flashScreen: async (_color, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      shakeScreen: async (_power, _speed, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      fadeoutScreen: async (duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      fadeinScreen: async (duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      weather: async (_weatherType, _power, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      showPicture: async () => {},
      movePicture: async (_id, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      erasePicture: async () => {},
      showBalloon: async () => {
        await wait(30 * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      showAnimation: async () => {
        await wait(30 * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      transparency: () => {},
      playSe: (path, vol) => {
        void this.audio.playSe(path, { volume: vol });
      },
      stopSe: () => {
        this.audio.stopSe();
      },
      playMe: async (path, vol) => {
        await this.audio.playMe(path, { volume: vol });
      },
      playBgs: (path, vol) => {
        void this.audio.playBgs(path, { volume: vol });
      },
      fadeoutBgs: async (seconds) => {
        await this.audio.fadeoutBgs(seconds);
      },
      rotatePicture: () => {},
      tintPicture: async (_id, _tone, duration) => {
        await wait((duration ?? 24) * (this.state.settings.reducedMotion ? 1 : 16.6));
      },
      playBgm: (path, vol) => {
        void this.audio.playBgm(path, { volume: vol });
      },
      fadeoutBgm: async (seconds) => {
        await this.audio.fadeoutBgm(seconds);
      },
      saveBgm: () => {
        this.audio.saveBgm();
      },
      replayBgm: () => {
        this.audio.replayBgm();
      },
      playMovie: async () => {},
      setVehicleLocation: () => {},
      getOnOffVehicle: () => {},
      changePlayerFollowers: () => {},
      gatherFollowers: async () => {}
    };
  }

  private async runEvent(event: NonNullable<ReturnType<typeof eventAt>>) {
    const page = activePage(event, this.state);
    if (!page) return;
    this.busy = true;
    const prevMapId = this.state.mapId;
    this.debug.log(`event start: ${event.id} (${page.commands.map(command => command.type).join(', ')})`);
    try {
      const io = this.createEventIO();
      this.state = await executeCommands(this.bundle, this.state, page.commands, io, { eventId: event.id, mapId: this.state.mapId });
      if (this.state.mapId !== prevMapId) {
        this.parallelRunning.clear();
        this.playMapBgm();
      }
      this.rebuild();
      this.debug.log(`event end: ${event.id}`);
      this.debug.draw(this.state);
    } catch (error) {
      this.dialogue.toast(`Event gagal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.busy = false;
    }
  }

  private async runParallelEvent(event: MapEvent) {
    const page = activePage(event, this.state);
    if (!page) {
      this.parallelRunning.delete(event.id);
      return;
    }
    const prevMapId = this.state.mapId;
    try {
      const io = this.createEventIO();
      this.state = await executeCommands(this.bundle, this.state, page.commands, io, { eventId: event.id, mapId: this.state.mapId });
      if (this.state.mapId !== prevMapId) {
        this.parallelRunning.clear();
        this.playMapBgm();
        this.rebuild();
      }
    } catch (error) {
      this.debug.log(`parallel event ${event.id} error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.parallelRunning.delete(event.id);
    }
  }

  private async openParty() {
    this.busy = true;
    void this.audio.playSe('assets/audio/se/Decision2.ogg');
    try {
      this.state = await this.party.open(this.state);
      this.rebuild();
    } finally {
      this.busy = false;
    }
  }

  private async openJournal() {
    this.busy = true;
    void this.audio.playSe('assets/audio/se/Item1.ogg');
    try {
      this.state = await this.adventure.journal(this.state);
    } finally {
      this.busy = false;
    }
  }

  private async openSettings() {
    this.busy = true;
    void this.audio.playSe('assets/audio/se/Decision1.ogg');
    try {
      this.state = await this.adventure.settings(this.state);
    } finally {
      this.busy = false;
    }
  }

  private async save() {
    this.busy = true;
    void this.audio.playSe('assets/audio/se/Decision1.ogg');
    try {
      await window.nusvRuntime!.saveProgress(this.state);
      this.dialogue.toast('Progres disimpan.');
    } catch (error) {
      this.dialogue.toast(`Save gagal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.busy = false;
    }
  }

  private async load() {
    this.busy = true;
    void this.audio.playSe('assets/audio/se/Item1.ogg');
    try {
      const saved = await window.nusvRuntime!.loadProgress();
      if (saved) {
        this.state = saved;
        this.parallelRunning.clear();
        applyRuntimeSettings(saved.settings);
        this.audio.setMix(saved.settings);
        this.playMapBgm();
        this.rebuild();
        this.dialogue.toast('Progres dimuat.');
      } else {
        this.dialogue.toast('Belum ada save.');
      }
    } catch (error) {
      this.dialogue.toast(`Load gagal: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.busy = false;
    }
  }

  exit() {
    this.dialogue.destroy();
    this.battle.destroy();
    this.party.destroy();
    this.adventure.destroy();
    this.debug.destroy();
    this.view.destroy({ children: true });
  }
}
