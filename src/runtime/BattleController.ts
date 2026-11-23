import { createBattle, derivedStats, partyResources, resolveRound } from '../core/battle.js';
import type { BattleAction, BattleBattler, BattleState } from '../core/combat-types.js';
import { previewCtb } from '../core/ctb.js';
import { grantBattleProgress } from '../core/progression.js';
import type { ProgressState, ProjectBundle } from '../core/types.js';
import { ActionSequencePlayer } from './ActionSequencePlayer.js';
import type { AudioManager } from './AudioManager.js';
import { TextureManager } from './TextureManager.js';

export class BattleController {
  private root = document.createElement('section');
  private bgBackdrop = document.createElement('div');
  private bgGround = document.createElement('div');
  private sequence: ActionSequencePlayer;

  constructor(
    private bundle: ProjectBundle,
    private onLog: (message: string) => void = () => {},
    private audio?: AudioManager,
    private textures = new TextureManager()
  ) {
    this.root.className = 'battle-overlay';
    this.bgBackdrop.className = 'battle-backdrop-layer';
    this.bgGround.className = 'battle-ground-layer';
    this.root.append(this.bgBackdrop, this.bgGround);
    document.body.append(this.root);
    this.sequence = new ActionSequencePlayer(this.root, bundle);
  }

  private def(b: BattleBattler) {
    return b.combat;
  }

  private draw(state: BattleState, title: string) {
    this.root.querySelectorAll('h2, .ctb-preview, .battle-grid, .battle-actions, pre').forEach(el => el.remove());
    const heading = document.createElement('h2');
    heading.textContent = title;
    const timeline = document.createElement('div');
    timeline.className = 'ctb-preview';
    timeline.textContent = `CTB: ${previewCtb(state, 8).map(id => this.def(state.battlers.find(b => b.instanceId === id)!).name).join(' → ')}`;
    const grid = document.createElement('div');
    grid.className = 'battle-grid';

    for (const side of ['party', 'enemy'] as const) {
      const column = document.createElement('div');
      for (const battler of state.battlers.filter(entry => entry.side === side)) {
        const stats = derivedStats(battler.combat);
        const states = battler.states.map(active => this.bundle.game.states.find(entry => entry.id === active.id)?.name).filter(Boolean);
        const card = document.createElement('article');
        card.dataset.battler = battler.instanceId;
        card.className = `battle-card ${battler.hp <= 0 ? 'down' : ''}`;

        if (side === 'enemy') {
          const enemyDef = this.bundle.game.enemies.find(entry => entry.id === battler.definitionId);
          const battlerImg = (enemyDef as Record<string, unknown> | undefined)?.battlerImage as string | undefined;
          if (battlerImg) {
            const img = document.createElement('img');
            img.className = 'battler-sprite';
            img.alt = this.def(battler).name;
            void this.textures.loadDataUrl(battlerImg).then(url => {
              if (url) img.src = url;
            });
            card.append(img);
          }
        } else {
          const actorDef = this.bundle.game.actors.find(entry => entry.id === battler.definitionId);
          const faceImg = (actorDef as Record<string, unknown> | undefined)?.faceImage as string | undefined;
          const faceIdx = (actorDef as Record<string, unknown> | undefined)?.faceIndex as number | undefined ?? 0;
          if (faceImg) {
            const face = document.createElement('img');
            face.className = 'face-thumbnail';
            face.alt = this.def(battler).name;
            void this.textures.getFaceDataUrl(faceImg, faceIdx).then(url => {
              if (url) face.src = url;
            });
            card.append(face);
          }
        }

        const info = document.createElement('div');
        info.className = 'battle-card-content';
        info.textContent = `${this.def(battler).name}${battler.phaseId ? ` · ${battler.phaseId}` : ''}\nHP ${battler.hp}/${stats.maxHp}  MP ${battler.mp}/${stats.maxMp}  SP ${battler.sp}/${stats.maxSp}${battler.guarded ? '  [GUARD]' : ''}${states.length ? `\n${states.join(', ')}` : ''}`;
        card.append(info);
        column.append(card);
      }
      grid.append(column);
    }
    this.root.append(heading, timeline, grid);
  }

  private choose<T>(label: string, options: Array<{ label: string; value: T }>) {
    return new Promise<T>(resolve => {
      const panel = document.createElement('div');
      panel.className = 'battle-actions';
      const text = document.createElement('strong');
      text.textContent = label;
      panel.append(text, ...options.map(option => {
        const button = document.createElement('button');
        button.textContent = option.label;
        button.onclick = () => {
          panel.remove();
          resolve(option.value);
        };
        return button;
      }));
      this.root.append(panel);
    });
  }

  private async actorAction(state: BattleState, actor: BattleBattler): Promise<BattleAction> {
    const actorDef = this.def(actor);
    const hasDown = state.battlers.some(entry => entry.side === 'party' && entry.hp === 0);
    const skills = this.bundle.game.skills.filter(skill => actorDef.skillIds.includes(skill.id) && (skill.mpCost ?? 0) <= actor.mp && (skill.spCost ?? 0) <= actor.sp && (skill.kind !== 'revive' || hasDown));
    const items = this.bundle.game.items.filter(item => ['heal', 'revive'].includes(item.kind) && (state.inventory[item.id] ?? 0) > 0 && (item.kind !== 'revive' || hasDown));

    const kind = await this.choose(`${actorDef.name}: pilih aksi`, [
      { label: 'Attack', value: 'attack' as const },
      { label: 'Guard', value: 'guard' as const },
      ...skills.map(skill => ({ label: `${skill.name} (${skill.mpCost ? `${skill.mpCost} MP` : `${skill.spCost ?? 0} SP`})`, value: `skill:${skill.id}` as const })),
      ...items.map(item => ({ label: `${item.name} ×${state.inventory[item.id]}`, value: `item:${item.id}` as const }))
    ]);

    if (kind === 'guard') {
      void this.audio?.playSe('assets/audio/se/Decision2.ogg');
      return { actorId: actor.instanceId, type: 'guard' };
    }

    if (kind.startsWith('skill:')) {
      const id = kind.slice(6);
      const skill = this.bundle.game.skills.find(entry => entry.id === id)!;
      const targets = state.battlers.filter(entry => entry.side === (skill.target === 'ally' ? 'party' : 'enemy') && (skill.kind === 'revive' ? entry.hp === 0 : entry.hp > 0));
      const target = await this.choose('Pilih target', targets.map(entry => ({ label: this.def(entry).name, value: entry.instanceId })));
      void this.audio?.playSe('assets/audio/se/Attack2.ogg');
      return { actorId: actor.instanceId, type: 'skill', skillId: id, targetId: target };
    }

    if (kind.startsWith('item:')) {
      const id = kind.slice(5);
      const item = this.bundle.game.items.find(entry => entry.id === id)!;
      const targets = state.battlers.filter(entry => entry.side === 'party' && (item.kind === 'revive' ? entry.hp === 0 : entry.hp > 0));
      const target = await this.choose('Pilih target', targets.map(entry => ({ label: this.def(entry).name, value: entry.instanceId })));
      void this.audio?.playSe('assets/audio/se/Item1.ogg');
      return { actorId: actor.instanceId, type: 'item', itemId: id, targetId: target };
    }

    const targets = state.battlers.filter(entry => entry.hp > 0 && entry.side === 'enemy');
    const target = await this.choose('Pilih target', targets.map(entry => ({ label: this.def(entry).name, value: entry.instanceId })));
    void this.audio?.playSe('assets/audio/se/Attack1.ogg');
    return { actorId: actor.instanceId, type: 'attack', targetId: target };
  }

  async run(troopId: string, progress: ProgressState) {
    this.root.classList.add('open');
    this.onLog(`battle start: ${troopId}`);

    const map = this.bundle.maps[progress.mapId];
    const bback1 = (map as Record<string, unknown> | undefined)?.battleback1 as string | undefined || 'assets/battlebacks1/Cobblestones1.png';
    const bback2 = (map as Record<string, unknown> | undefined)?.battleback2 as string | undefined || 'assets/battlebacks2/Castle1.png';

    void this.textures.loadDataUrl(bback1).then(url => {
      if (url) this.bgGround.style.backgroundImage = `url("${url}")`;
    });
    void this.textures.loadDataUrl(bback2).then(url => {
      if (url) this.bgBackdrop.style.backgroundImage = `url("${url}")`;
    });

    const troop = this.bundle.game.troops.find(entry => entry.id === troopId);
    const battleBgm = (troop as Record<string, unknown> | undefined)?.bgm as string | undefined
      || (map as Record<string, unknown> | undefined)?.battleBgm as string | undefined
      || 'assets/audio/bgm/Battle1.ogg';
    void this.audio?.playBgm(battleBgm);

    let state = createBattle(this.bundle.game, progress.formation, troopId, progress.actorResources, progress.inventory, 0x4e555356, progress.actorProgress);

    while (state.status === 'active') {
      this.draw(state, `Round ${state.round}`);
      const actions: BattleAction[] = [];
      for (const actor of state.battlers.filter(entry => entry.side === 'party' && entry.hp > 0)) {
        actions.push(await this.actorAction(state, actor));
      }
      await this.sequence.play(actions);
      state = resolveRound(this.bundle.game, state, actions);
      state.log.forEach(line => this.onLog(`battle: ${line}`));
      this.draw(state, state.status === 'active' ? `Hasil Round ${state.round - 1}` : state.status === 'victory' ? 'Victory' : 'Defeat');
      const log = document.createElement('pre');
      log.textContent = state.log.join('\n');
      this.root.append(log);

      if (state.status === 'victory') {
        void this.audio?.playSe('assets/audio/me/Victory1.ogg');
      } else if (state.status === 'defeat') {
        void this.audio?.playSe('assets/audio/me/Gameover1.ogg');
      }

      await this.choose(state.status === 'active' ? 'Lanjutkan giliran' : 'Kembali ke peta', [{ label: 'Lanjut', value: true }]);
    }

    this.root.classList.remove('open');
    this.onLog(`battle end: ${state.status}`);
    const inventory = { ...state.inventory };
    for (const [id, count] of Object.entries(state.itemRewards)) {
      inventory[id] = (inventory[id] ?? 0) + count;
    }
    return {
      victory: state.status === 'victory',
      actorResources: partyResources(state),
      actorProgress: grantBattleProgress(progress.actorProgress, this.bundle.game.actors, state),
      inventory,
      gold: progress.gold + state.goldReward,
      turns: state.turnsTaken,
      damageTaken: state.damageTaken
    };
  }

  destroy() {
    this.root.remove();
  }
}
