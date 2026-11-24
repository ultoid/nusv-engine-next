import React, { useState, useMemo } from 'react';
import type { EventCommand } from '../../core/types.js';
import { commandName } from '../events/eventCommands.js';

export interface EventCommandPickerModalProps {
  onSelect: (type: EventCommand['type']) => void;
  onClose: () => void;
}

interface CommandButtonDef {
  type: EventCommand['type'];
  label: string;
}

interface CommandGroupDef {
  title: string;
  commands: CommandButtonDef[];
}

const TAB_1_GROUPS: CommandGroupDef[] = [
  {
    title: 'Message',
    commands: [
      { type: 'text', label: 'Show Text...' },
      { type: 'choice', label: 'Show Choices...' },
      { type: 'inputNumber', label: 'Input Number...' },
      { type: 'selectItem', label: 'Select Item...' },
      { type: 'scrollingText', label: 'Show Scrolling Text...' },
    ]
  },
  {
    title: 'Party',
    commands: [
      { type: 'changeGold', label: 'Change Gold...' },
      { type: 'giveItem', label: 'Change Items...' },
      { type: 'changeWeapons', label: 'Change Weapons...' },
      { type: 'changeArmors', label: 'Change Armors...' },
      { type: 'changePartyMember', label: 'Change Party Member...' },
    ]
  },
  {
    title: 'Game Progression',
    commands: [
      { type: 'setSwitch', label: 'Control Switches...' },
      { type: 'setVariable', label: 'Control Variables...' },
      { type: 'setSelfSwitch', label: 'Control Self Switch...' },
      { type: 'controlTimer', label: 'Control Timer...' },
    ]
  },
  {
    title: 'Actor',
    commands: [
      { type: 'changeHp', label: 'Change HP...' },
      { type: 'changeMp', label: 'Change MP...' },
      { type: 'changeTp', label: 'Change TP...' },
      { type: 'changeState', label: 'Change State...' },
      { type: 'recoverAll', label: 'Recover All...' },
      { type: 'changeExp', label: 'Change EXP...' },
      { type: 'changeLevel', label: 'Change Level...' },
      { type: 'changeParameter', label: 'Change Parameter...' },
      { type: 'changeSkill', label: 'Change Skill...' },
      { type: 'changeEquipment', label: 'Change Equipment...' },
      { type: 'changeName', label: 'Change Name...' },
      { type: 'changeClass', label: 'Change Class...' },
      { type: 'changeNickname', label: 'Change Nickname...' },
      { type: 'changeProfile', label: 'Change Profile...' },
    ]
  },
  {
    title: 'Flow Control',
    commands: [
      { type: 'branch', label: 'Conditional Branch...' },
      { type: 'loop', label: 'Loop' },
      { type: 'breakLoop', label: 'Break Loop' },
      { type: 'exitEvent', label: 'Exit Event Processing' },
      { type: 'commonEvent', label: 'Common Event...' },
      { type: 'label', label: 'Label...' },
      { type: 'jumpToLabel', label: 'Jump to Label...' },
      { type: 'comment', label: 'Comment...' },
      { type: 'wait', label: 'Wait...' },
    ]
  },
  {
    title: 'Quests & Story',
    commands: [
      { type: 'questStart', label: 'Start Quest...' },
      { type: 'questAdvance', label: 'Advance Quest...' },
      { type: 'questComplete', label: 'Complete Quest...' },
    ]
  }
];

const TAB_2_GROUPS: CommandGroupDef[] = [
  {
    title: 'Movement',
    commands: [
      { type: 'transfer', label: 'Transfer Player...' },
      { type: 'setVehicleLocation', label: 'Set Vehicle Location...' },
      { type: 'setEventLocation', label: 'Set Event Location...' },
      { type: 'scrollMap', label: 'Scroll Map...' },
      { type: 'setMovementRoute', label: 'Set Movement Route...' },
      { type: 'getOnOffVehicle', label: 'Get on/off Vehicle' },
      { type: 'cutscene', label: 'Cutscene Movement...' },
    ]
  },
  {
    title: 'Character',
    commands: [
      { type: 'transparency', label: 'Change Transparency...' },
      { type: 'changePlayerFollowers', label: 'Change Player Followers...' },
      { type: 'gatherFollowers', label: 'Gather Followers' },
      { type: 'showAnimation', label: 'Show Animation...' },
      { type: 'showBalloon', label: 'Show Balloon Icon...' },
      { type: 'eraseEvent', label: 'Erase Event' },
    ]
  },
  {
    title: 'Picture',
    commands: [
      { type: 'showPicture', label: 'Show Picture...' },
      { type: 'movePicture', label: 'Move Picture...' },
      { type: 'rotatePicture', label: 'Rotate Picture...' },
      { type: 'tintPicture', label: 'Tint Picture...' },
      { type: 'erasePicture', label: 'Erase Picture...' },
    ]
  },
  {
    title: 'Timing',
    commands: [
      { type: 'wait', label: 'Wait...' },
    ]
  },
  {
    title: 'Screen',
    commands: [
      { type: 'fadeoutScreen', label: 'Fadeout Screen' },
      { type: 'fadeinScreen', label: 'Fadein Screen' },
      { type: 'tintScreen', label: 'Tint Screen...' },
      { type: 'flashScreen', label: 'Flash Screen...' },
      { type: 'shakeScreen', label: 'Shake Screen...' },
      { type: 'weather', label: 'Set Weather Effect...' },
    ]
  },
  {
    title: 'Audio & Video',
    commands: [
      { type: 'playBgm', label: 'Play BGM...' },
      { type: 'fadeoutBgm', label: 'Fadeout BGM...' },
      { type: 'saveBgm', label: 'Save BGM' },
      { type: 'replayBgm', label: 'Replay BGM' },
      { type: 'playBgs', label: 'Play BGS...' },
      { type: 'fadeoutBgs', label: 'Fadeout BGS...' },
      { type: 'playMe', label: 'Play ME...' },
      { type: 'playSe', label: 'Play SE...' },
      { type: 'stopSe', label: 'Stop SE' },
      { type: 'playMovie', label: 'Play Movie...' },
    ]
  }
];

const TAB_3_GROUPS: CommandGroupDef[] = [
  {
    title: 'Scene Control',
    commands: [
      { type: 'battle', label: 'Battle Processing...' },
      { type: 'shop', label: 'Shop Processing...' },
      { type: 'nameInput', label: 'Name Input Processing...' },
      { type: 'openMenu', label: 'Open Menu Screen' },
      { type: 'openSave', label: 'Open Save Screen' },
      { type: 'gameOver', label: 'Game Over' },
      { type: 'returnToTitle', label: 'Return to Title Screen' },
      { type: 'inn', label: 'Innkeeper Processing...' },
    ]
  },
  {
    title: 'System Settings',
    commands: [
      { type: 'changeBattleBgm', label: 'Change Battle BGM...' },
      { type: 'changeVictoryMe', label: 'Change Victory ME...' },
      { type: 'changeDefeatMe', label: 'Change Defeat ME...' },
      { type: 'changeVehicleBgm', label: 'Change Vehicle BGM...' },
      { type: 'changeSaveAccess', label: 'Change Save Access...' },
      { type: 'changeMenuAccess', label: 'Change Menu Access...' },
      { type: 'changeEncounter', label: 'Change Encounter...' },
      { type: 'changeFormationAccess', label: 'Change Formation Access...' },
      { type: 'changeWindowColor', label: 'Change Window Color...' },
      { type: 'changeActorImages', label: 'Change Actor Images...' },
      { type: 'changeVehicleImage', label: 'Change Vehicle Image...' },
    ]
  },
  {
    title: 'Map',
    commands: [
      { type: 'changeMapNameDisplay', label: 'Change Map Name Display...' },
      { type: 'changeTileset', label: 'Change Tileset...' },
      { type: 'changeBattleBack', label: 'Change Battle Background...' },
      { type: 'changeParallax', label: 'Change Parallax...' },
      { type: 'getLocationInfo', label: 'Get Location Info...' },
    ]
  },
  {
    title: 'Battle',
    commands: [
      { type: 'changeEnemyHp', label: 'Change Enemy HP...' },
      { type: 'changeEnemyMp', label: 'Change Enemy MP...' },
      { type: 'changeEnemyTp', label: 'Change Enemy TP...' },
      { type: 'changeEnemyState', label: 'Change Enemy State...' },
      { type: 'enemyRecoverAll', label: 'Enemy Recover All...' },
      { type: 'enemyAppear', label: 'Enemy Appear...' },
      { type: 'enemyTransform', label: 'Enemy Transform...' },
      { type: 'showBattleAnimation', label: 'Show Battle Animation...' },
      { type: 'forceAction', label: 'Force Action...' },
      { type: 'abortBattle', label: 'Abort Battle' },
    ]
  },
  {
    title: 'Advanced',
    commands: [
      { type: 'script', label: 'Script...' },
      { type: 'pluginCommand', label: 'Plugin Command...' },
    ]
  }
];

export function EventCommandPickerModal({ onSelect, onClose }: EventCommandPickerModalProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState('');

  const allCommands = useMemo(() => {
    const list: Array<{ type: EventCommand['type']; label: string; tab: number; group: string }> = [];
    TAB_1_GROUPS.forEach(g => g.commands.forEach(c => list.push({ ...c, tab: 1, group: g.title })));
    TAB_2_GROUPS.forEach(g => g.commands.forEach(c => list.push({ ...c, tab: 2, group: g.title })));
    TAB_3_GROUPS.forEach(g => g.commands.forEach(c => list.push({ ...c, tab: 3, group: g.title })));
    return list;
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return allCommands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (commandName[c.type] && commandName[c.type].toLowerCase().includes(q))
    );
  }, [search, allCommands]);

  const { col1, col2 } = useMemo(() => {
    if (activeTab === 1) {
      return {
        col1: TAB_1_GROUPS.filter(g => ['Message', 'Game Progression', 'Flow Control'].includes(g.title)),
        col2: TAB_1_GROUPS.filter(g => ['Party', 'Actor', 'Quests & Story'].includes(g.title))
      };
    } else if (activeTab === 2) {
      return {
        col1: TAB_2_GROUPS.filter(g => ['Movement', 'Character', 'Picture'].includes(g.title)),
        col2: TAB_2_GROUPS.filter(g => ['Timing', 'Screen', 'Audio & Video'].includes(g.title))
      };
    } else {
      return {
        col1: TAB_3_GROUPS.filter(g => ['Scene Control', 'System Settings'].includes(g.title)),
        col2: TAB_3_GROUPS.filter(g => ['Map', 'Battle', 'Advanced'].includes(g.title))
      };
    }
  }, [activeTab]);

  return (
    <div className="mv-modal-backdrop mz-cmd-picker-backdrop" onClick={onClose}>
      <div className="mz-cmd-picker-dialog" onClick={e => e.stopPropagation()}>
        <div className="mz-dialog-titlebar">
          <span>Event Commands</span>
          <button className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        {/* Filter bar */}
        <div className="mz-cmd-picker-searchbar">
          <input
            type="text"
            className="mz-input mz-search-input"
            placeholder="Cari perintah (misal: text, gold, se, switch, branch)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button className="mz-btn mz-btn-sm" onClick={() => setSearch('')}>Clear</button>
          )}
        </div>

        {/* Tabs 1, 2, 3 */}
        {!searchResults && (
          <div className="mz-cmd-tabs">
            <button
              type="button"
              className={`mz-tab-item ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              1 Messages & Logic
            </button>
            <button
              type="button"
              className={`mz-tab-item ${activeTab === 2 ? 'active' : ''}`}
              onClick={() => setActiveTab(2)}
            >
              2 Movement & Screen
            </button>
            <button
              type="button"
              className={`mz-tab-item ${activeTab === 3 ? 'active' : ''}`}
              onClick={() => setActiveTab(3)}
            >
              3 Scene & System
            </button>
          </div>
        )}

        {/* Command Grid Body */}
        <div className="mz-cmd-picker-body">
          {searchResults ? (
            <div className="mz-cmd-search-results">
              {searchResults.length === 0 ? (
                <div className="mz-empty-text">Tidak ada perintah yang cocok dengan "{search}".</div>
              ) : (
                <div className="mz-cmd-grid">
                  {searchResults.map(c => (
                    <button
                      key={c.type}
                      type="button"
                      className="mz-btn mz-cmd-choice-btn"
                      onClick={() => onSelect(c.type)}
                    >
                      <span className="mz-cmd-name">{c.label}</span>
                      <small className="mz-cmd-cat">Tab {c.tab} · {c.group}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mz-cmd-columns">
              <div className="mz-cmd-col">
                {col1.map(group => (
                  <div key={group.title} className="mz-group-box mz-cmd-group">
                    <div className="mz-group-title">{group.title}</div>
                    <div className="mz-group-content mz-cmd-group-content">
                      {group.commands.map(cmd => (
                        <button
                          key={cmd.type}
                          type="button"
                          className="mz-btn mz-cmd-btn"
                          onClick={() => onSelect(cmd.type)}
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mz-cmd-col">
                {col2.map(group => (
                  <div key={group.title} className="mz-group-box mz-cmd-group">
                    <div className="mz-group-title">{group.title}</div>
                    <div className="mz-group-content mz-cmd-group-content">
                      {group.commands.map(cmd => (
                        <button
                          key={cmd.type}
                          type="button"
                          className="mz-btn mz-cmd-btn"
                          onClick={() => onSelect(cmd.type)}
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left">
            <span className="mz-cmd-count-hint">
              {allCommands.length} perintah standar RPG Maker MZ didukung
            </span>
          </div>
          <div className="mz-footer-right">
            <button type="button" className="mz-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
