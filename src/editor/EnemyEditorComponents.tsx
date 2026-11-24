import React, { useState, useMemo } from 'react';
import type { EnemyData, EnemyDropItem, EnemyAction, BaseStats, CombatBase, CombatBonuses, TraitData } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  ActorTraitModal,
  formatTraitType,
  formatTraitContent
} from './ActorEditorComponents.js';

// Default standard battler images when no assets in bundle
export const DEFAULT_ENEMY_BATTLERS = [
  'Bat.png',
  'Berserker.png',
  'Birdman.png',
  'Blackknight.png',
  'Captain.png',
  'Crab.png',
  'Crow.png',
  'Darkelf.png',
  'Demon.png',
  'Demoncount.png',
  'Demonpot.png',
  'Dragon.png',
  'Evilbook.png',
  'Evilgod.png',
  'Ghost.png',
  'Gnome.png',
  'Goblin.png',
  'Hi_monster.png',
  'Minotaur.png',
  'Orc.png',
  'Puppet.png',
  'Sahagin.png',
  'Skeleton.png',
  'Slime.png',
  'Snake.png',
  'Treant.png',
  'Vampire.png',
  'Werewolf.png',
  'Zombie.png'
];

// ============================================================================
// Modal: Enemy Image Picker & Hue
// ============================================================================
export function EnemyImagePickerModal({
  currentImage,
  currentHue = 0,
  assetUrlMap = {},
  onConfirm,
  onClose
}: {
  currentImage: string;
  currentHue?: number;
  assetUrlMap?: Record<string, string>;
  onConfirm: (path: string, hue: number) => void;
  onClose: () => void;
}) {
  // Extract file list from assetUrlMap or fallback
  const availableImages = useMemo(() => {
    const list: string[] = [];
    for (const key of Object.keys(assetUrlMap)) {
      if (key.startsWith('assets/sv_enemies/') || key.startsWith('assets/enemies/')) {
        const filename = key.split('/').pop();
        if (filename && !list.includes(filename)) {
          list.push(filename);
        }
      }
    }
    if (list.length === 0) {
      return DEFAULT_ENEMY_BATTLERS;
    }
    return list.sort();
  }, [assetUrlMap]);

  const initialFileName = useMemo(() => {
    const fn = currentImage.split('/').pop();
    if (fn && availableImages.includes(fn)) return fn;
    return availableImages[0] || 'Goblin.png';
  }, [currentImage, availableImages]);

  const [selectedFile, setSelectedFile] = useState<string>(initialFileName);
  const [hue, setHue] = useState<number>(currentHue);

  // Determine preview URL (prioritize sv_enemies if available)
  const previewUrl = useMemo(() => {
    return (
      assetUrlMap[`assets/sv_enemies/${selectedFile}`] ||
      assetUrlMap[`assets/enemies/${selectedFile}`] ||
      assetUrlMap[selectedFile] ||
      ''
    );
  }, [assetUrlMap, selectedFile]);

  const handleSave = () => {
    const fullPath = assetUrlMap[`assets/sv_enemies/${selectedFile}`]
      ? `assets/sv_enemies/${selectedFile}`
      : `assets/enemies/${selectedFile}`;
    onConfirm(fullPath, hue);
  };

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 620, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Select Enemy Graphic</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
          {/* File List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Files:</span>
            <div
              className="mz-select-box"
              style={{
                height: 280,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: '#ffffff'
              }}
            >
              {availableImages.map((file) => (
                <div
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                    background: selectedFile === file ? '#2563eb' : 'transparent',
                    color: selectedFile === file ? '#ffffff' : '#1e293b',
                    borderRadius: 2
                  }}
                >
                  {file.replace(/\.png$/i, '')}
                </div>
              ))}
            </div>
          </div>

          {/* Preview & Hue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Preview:</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{selectedFile}</span>
            </div>

            <div
              className="mz-checkered-bg mz-enemy-preview-box"
              style={{
                width: '100%',
                height: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={selectedFile}
                  className="mz-enemy-preview-img"
                  style={{
                    filter: hue !== 0 ? `hue-rotate(${hue}deg)` : undefined
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <span style={{ fontSize: 48, display: 'block' }}>👹</span>
                  <span style={{ fontSize: 11 }}>{selectedFile}</span>
                </div>
              )}
            </div>

            {/* Hue Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                <span>Hue:</span>
                <span>{hue}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-primary" onClick={handleSave}>
            OK
          </button>
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Enemy Drop Item
// ============================================================================
export function EnemyDropItemModal({
  currentDrop,
  bundle,
  onConfirm,
  onClose
}: {
  currentDrop?: EnemyDropItem;
  bundle: ProjectBundle;
  onConfirm: (drop: EnemyDropItem | null) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<'none' | 'item' | 'weapon' | 'armor'>(
    currentDrop?.kind || 'none'
  );

  const weapons = useMemo(
    () => bundle.game.equipment.filter((e) => e.slot === 'weapon'),
    [bundle.game.equipment]
  );
  const armors = useMemo(
    () => bundle.game.equipment.filter((e) => e.slot !== 'weapon'),
    [bundle.game.equipment]
  );
  const items = bundle.game.items;

  const defaultId = useMemo(() => {
    if (kind === 'weapon') return weapons[0]?.id || '';
    if (kind === 'armor') return armors[0]?.id || '';
    return items[0]?.id || '';
  }, [kind, weapons, armors, items]);

  const [dataId, setDataId] = useState<string>(currentDrop?.dataId || defaultId);
  const [denominator, setDenominator] = useState<number>(currentDrop?.denominator ?? 1);

  const handleKindChange = (nextKind: 'none' | 'item' | 'weapon' | 'armor') => {
    setKind(nextKind);
    if (nextKind === 'weapon') setDataId(weapons[0]?.id || '');
    else if (nextKind === 'armor') setDataId(armors[0]?.id || '');
    else if (nextKind === 'item') setDataId(items[0]?.id || '');
  };

  const handleSave = () => {
    if (kind === 'none' || !dataId) {
      onConfirm(null);
    } else {
      onConfirm({
        kind,
        dataId,
        denominator: Math.max(1, Number(denominator) || 1)
      });
    }
  };

  const percent = denominator > 0 ? (100 / denominator).toFixed(1).replace(/\.0$/, '') : '0';

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 440, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Drop Item</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Kind Radio Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="radio"
                name="dropKind"
                checked={kind === 'none'}
                onChange={() => handleKindChange('none')}
              />
              <span>None</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="radio"
                name="dropKind"
                checked={kind === 'item'}
                onChange={() => handleKindChange('item')}
              />
              <span style={{ width: 60 }}>Item:</span>
              <select
                disabled={kind !== 'item'}
                value={kind === 'item' ? dataId : ''}
                onChange={(e) => setDataId(e.target.value)}
                style={{ flex: 1 }}
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="radio"
                name="dropKind"
                checked={kind === 'weapon'}
                onChange={() => handleKindChange('weapon')}
              />
              <span style={{ width: 60 }}>Weapon:</span>
              <select
                disabled={kind !== 'weapon'}
                value={kind === 'weapon' ? dataId : ''}
                onChange={(e) => setDataId(e.target.value)}
                style={{ flex: 1 }}
              >
                {weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="radio"
                name="dropKind"
                checked={kind === 'armor'}
                onChange={() => handleKindChange('armor')}
              />
              <span style={{ width: 60 }}>Armor:</span>
              <select
                disabled={kind !== 'armor'}
                value={kind === 'armor' ? dataId : ''}
                onChange={(e) => setDataId(e.target.value)}
                style={{ flex: 1 }}
              >
                {armors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Probability */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderTop: '1px solid #e2e8f0',
              paddingTop: 12
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600 }}>Probability:</span>
            <span>1 /</span>
            <input
              type="number"
              min={1}
              max={9999}
              disabled={kind === 'none'}
              value={denominator}
              onChange={(e) => setDenominator(Math.max(1, Number(e.target.value)))}
              style={{ width: 70 }}
            />
            <span style={{ fontSize: 11, color: '#64748b' }}>({percent}%)</span>
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-primary" onClick={handleSave}>
            OK
          </button>
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Enemy Action Pattern
// ============================================================================
export function EnemyActionModal({
  currentAction,
  bundle,
  onConfirm,
  onClose
}: {
  currentAction?: EnemyAction;
  bundle: ProjectBundle;
  onConfirm: (action: EnemyAction) => void;
  onClose: () => void;
}) {
  const skills = bundle.game.skills;
  const states = bundle.game.states;

  const [skillId, setSkillId] = useState<string>(
    currentAction?.skillId || skills[0]?.id || 'skill.attack'
  );
  const [rating, setRating] = useState<number>(currentAction?.rating ?? 5);

  const initialConditionType = useMemo(() => {
    const raw = currentAction?.conditionType;
    if (typeof raw === 'number') {
      const map = ['always', 'turn', 'hp', 'mp', 'state', 'level', 'switch'];
      return map[raw] || 'always';
    }
    return raw || 'always';
  }, [currentAction?.conditionType]);

  const [conditionType, setConditionType] = useState<string>(initialConditionType);

  // Turn params (A + B * X)
  const [turnA, setTurnA] = useState<number>(
    conditionType === 'turn' ? Number(currentAction?.conditionParam1 ?? 0) : 0
  );
  const [turnB, setTurnB] = useState<number>(
    conditionType === 'turn' ? Number(currentAction?.conditionParam2 ?? 1) : 1
  );

  // HP params (% min ~ % max)
  const [hpMin, setHpMin] = useState<number>(
    conditionType === 'hp' ? Number(currentAction?.conditionParam1 ?? 0) : 0
  );
  const [hpMax, setHpMax] = useState<number>(
    conditionType === 'hp' ? Number(currentAction?.conditionParam2 ?? 100) : 100
  );

  // MP params (% min ~ % max)
  const [mpMin, setMpMin] = useState<number>(
    conditionType === 'mp' ? Number(currentAction?.conditionParam1 ?? 0) : 0
  );
  const [mpMax, setMpMax] = useState<number>(
    conditionType === 'mp' ? Number(currentAction?.conditionParam2 ?? 100) : 100
  );

  // State param
  const [stateId, setStateId] = useState<string>(
    conditionType === 'state' ? String(currentAction?.conditionParam1 ?? states[0]?.id ?? '') : (states[0]?.id ?? '')
  );

  // Level param
  const [level, setLevel] = useState<number>(
    conditionType === 'level' ? Number(currentAction?.conditionParam1 ?? 1) : 1
  );

  // Switch param
  const [switchId, setSwitchId] = useState<string>(
    conditionType === 'switch' ? String(currentAction?.conditionParam1 ?? 'switch.0001') : 'switch.0001'
  );

  const handleSave = () => {
    let p1: number | string | undefined;
    let p2: number | undefined;

    switch (conditionType) {
      case 'turn':
        p1 = turnA;
        p2 = turnB;
        break;
      case 'hp':
        p1 = hpMin;
        p2 = hpMax;
        break;
      case 'mp':
        p1 = mpMin;
        p2 = mpMax;
        break;
      case 'state':
        p1 = stateId;
        break;
      case 'level':
        p1 = level;
        break;
      case 'switch':
        p1 = switchId;
        break;
      case 'always':
      default:
        p1 = 0;
        p2 = 0;
        break;
    }

    onConfirm({
      skillId,
      rating: Math.max(1, Math.min(9, Number(rating) || 5)),
      conditionType: conditionType as EnemyAction['conditionType'],
      conditionParam1: p1,
      conditionParam2: p2
    });
  };

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 480, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Action Pattern</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Action Group */}
          <div className="mz-groupbox">
            <legend>Action</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 2 }}>
                <span>Skill:</span>
                <select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span>Rating:</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={rating}
                  onChange={(e) => setRating(Math.max(1, Math.min(9, Number(e.target.value))))}
                />
              </label>
            </div>
          </div>

          {/* Conditions Group */}
          <div className="mz-groupbox">
            <legend>Conditions</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Always */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'always'}
                  onChange={() => setConditionType('always')}
                />
                <span>Always</span>
              </label>

              {/* Turn */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'turn'}
                  onChange={() => setConditionType('turn')}
                />
                <span style={{ width: 50 }}>Turn:</span>
                <input
                  type="number"
                  min={0}
                  disabled={conditionType !== 'turn'}
                  value={turnA}
                  onChange={(e) => setTurnA(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>+</span>
                <input
                  type="number"
                  min={0}
                  disabled={conditionType !== 'turn'}
                  value={turnB}
                  onChange={(e) => setTurnB(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>* X</span>
              </label>

              {/* HP */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'hp'}
                  onChange={() => setConditionType('hp')}
                />
                <span style={{ width: 50 }}>HP:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={conditionType !== 'hp'}
                  value={hpMin}
                  onChange={(e) => setHpMin(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>% ~</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={conditionType !== 'hp'}
                  value={hpMax}
                  onChange={(e) => setHpMax(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>%</span>
              </label>

              {/* MP */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'mp'}
                  onChange={() => setConditionType('mp')}
                />
                <span style={{ width: 50 }}>MP:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={conditionType !== 'mp'}
                  value={mpMin}
                  onChange={(e) => setMpMin(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>% ~</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={conditionType !== 'mp'}
                  value={mpMax}
                  onChange={(e) => setMpMax(Number(e.target.value))}
                  style={{ width: 55 }}
                />
                <span>%</span>
              </label>

              {/* State */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'state'}
                  onChange={() => setConditionType('state')}
                />
                <span style={{ width: 50 }}>State:</span>
                <select
                  disabled={conditionType !== 'state'}
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Party Level */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'level'}
                  onChange={() => setConditionType('level')}
                />
                <span style={{ width: 50 }}>Party Lv:</span>
                <span>&gt;=</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  disabled={conditionType !== 'level'}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </label>

              {/* Switch */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="radio"
                  name="condType"
                  checked={conditionType === 'switch'}
                  onChange={() => setConditionType('switch')}
                />
                <span style={{ width: 50 }}>Switch:</span>
                <input
                  type="text"
                  disabled={conditionType !== 'switch'}
                  value={switchId}
                  onChange={(e) => setSwitchId(e.target.value)}
                  placeholder="switch.id"
                  style={{ flex: 1 }}
                />
                <span>ON</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-primary" onClick={handleSave}>
            OK
          </button>
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to format action pattern condition string
export function formatActionCondition(action: EnemyAction, bundle: ProjectBundle): string {
  const type = action.conditionType;
  if (type === 'turn' || type === 1) {
    const a = action.conditionParam1 ?? 0;
    const b = action.conditionParam2 ?? 1;
    return `Turn ${a} + ${b} * X`;
  }
  if (type === 'hp' || type === 2) {
    const a = action.conditionParam1 ?? 0;
    const b = action.conditionParam2 ?? 100;
    return `HP ${a}% ~ ${b}%`;
  }
  if (type === 'mp' || type === 3) {
    const a = action.conditionParam1 ?? 0;
    const b = action.conditionParam2 ?? 100;
    return `MP ${a}% ~ ${b}%`;
  }
  if (type === 'state' || type === 4) {
    const stId = String(action.conditionParam1 ?? '');
    const found = bundle.game.states.find((s) => s.id === stId);
    return `State [${found?.name || stId || 'None'}]`;
  }
  if (type === 'level' || type === 5) {
    const lv = action.conditionParam1 ?? 1;
    return `Level >= ${lv}`;
  }
  if (type === 'switch' || type === 6) {
    const swId = String(action.conditionParam1 ?? 'Switch');
    return `Switch [${swId}] ON`;
  }
  return 'Always';
}

// Helper to format drop item label
export function formatDropItemLabel(
  drop: EnemyDropItem | undefined,
  bundle: ProjectBundle
): string {
  if (!drop || !drop.kind || drop.kind === ('none' as any)) return 'None';
  let name = drop.dataId;
  if (drop.kind === 'item') {
    const item = bundle.game.items.find((i) => i.id === drop.dataId);
    if (item) name = item.name;
  } else if (drop.kind === 'weapon') {
    const weapon = bundle.game.equipment.find((e) => e.id === drop.dataId);
    if (weapon) name = weapon.name;
  } else if (drop.kind === 'armor') {
    const armor = bundle.game.equipment.find((e) => e.id === drop.dataId);
    if (armor) name = armor.name;
  }
  return `${name} 1/${drop.denominator ?? 1}`;
}

// ============================================================================
// Main Form: Enemy Detail Form (Matches RPG Maker MZ Layout)
// ============================================================================
export function EnemyDetailForm({
  enemy,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  enemy: EnemyData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [dropModalSlot, setDropModalSlot] = useState<number | null>(null);
  const [actionModalIndex, setActionModalIndex] = useState<number | 'new' | null>(null);
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const stats: BaseStats = enemy.stats || { str: 6, int: 4, dex: 6, luk: 4, agi: 6, vit: 6 };
  const base: CombatBase = enemy.base || { hp: 40, mp: 0, atk: 6, def: 4, mat: 2, mdf: 2, agi: 5 };
  const reward = enemy.reward || { gold: 10, baseExp: 20, classExp: 15 };
  const traits: TraitData[] = enemy.traits || [];
  const actions: EnemyAction[] = enemy.actions || [];
  const drops: EnemyDropItem[] = enemy.dropItems || [];

  // RPG Maker MZ standard 8 parameters: [mhp, mmp, atk, def, mat, mdf, agi, luk]
  const params: number[] = useMemo(() => {
    if (Array.isArray(enemy.params) && enemy.params.length === 8) {
      return enemy.params;
    }
    return [
      base.hp ?? 40,
      base.mp ?? 0,
      base.atk ?? 6,
      base.def ?? 4,
      base.mat ?? 2,
      base.mdf ?? 2,
      base.agi ?? 5,
      stats.luk ?? 4
    ];
  }, [enemy.params, base, stats.luk]);

  // Update single parameter
  const updateParam = (paramIndex: number, val: number) => {
    const nextParams = [...params];
    nextParams[paramIndex] = Math.max(0, val);

    const nextBase: CombatBase = { ...base };
    const nextStats: BaseStats = { ...stats };

    switch (paramIndex) {
      case 0: nextBase.hp = Math.max(1, val); break;
      case 1: nextBase.mp = val; break;
      case 2: nextBase.atk = val; break;
      case 3: nextBase.def = val; break;
      case 4: nextBase.mat = val; break;
      case 5: nextBase.mdf = val; break;
      case 6: nextBase.agi = val; break;
      case 7: nextStats.luk = val; break;
    }

    onUpdate({
      params: nextParams,
      base: nextBase,
      stats: nextStats
    });
  };

  // Battler image resolution
  const battlerPath = enemy.battlerImage || (enemy.battlerName ? `assets/sv_enemies/${enemy.battlerName}.png` : `assets/enemies/${enemy.name}.png`);
  const battlerUrl =
    assetUrlMap[battlerPath] ||
    assetUrlMap[`assets/sv_enemies/${enemy.name}.png`] ||
    assetUrlMap[`assets/enemies/${enemy.name}.png`] ||
    assetUrlMap['assets/enemies/Goblin.png'] ||
    assetUrlMap['assets/sv_enemies/Goblin.png'] ||
    '';
  const battlerHue = enemy.battlerHue ?? 0;

  // Handle Battler image confirm
  const handleConfirmImage = (path: string, hue: number) => {
    const filename = path.split('/').pop()?.replace(/\.png$/i, '') || '';
    onUpdate({
      battlerImage: path,
      battlerName: filename,
      battlerHue: hue
    });
    setImageModalOpen(false);
  };

  // Handle Rewards update
  const handleUpdateReward = (key: 'baseExp' | 'gold', val: number) => {
    const next = { ...reward, [key]: Math.max(0, val) };
    const patch: Record<string, unknown> = { reward: next };
    if (key === 'baseExp') patch.exp = Math.max(0, val);
    if (key === 'gold') patch.gold = Math.max(0, val);
    onUpdate(patch);
  };

  // Handle Drop Items (3 slots)
  const slot0 = drops[0];
  const slot1 = drops[1];
  const slot2 = drops[2];

  const handleConfirmDrop = (drop: EnemyDropItem | null) => {
    if (dropModalSlot === null) return;
    const next = [...drops];
    if (drop === null) {
      next.splice(dropModalSlot, 1);
    } else {
      next[dropModalSlot] = drop;
    }
    // Clean out empties
    const cleaned = next.filter(Boolean);
    onUpdate({ dropItems: cleaned });
    setDropModalSlot(null);
  };

  // Handle Action Patterns
  const handleConfirmAction = (action: EnemyAction) => {
    if (actionModalIndex === 'new') {
      const next = [...actions, action];
      // ensure skill is also in skillIds
      const nextSkillIds = Array.from(new Set([...(enemy.skillIds || []), action.skillId]));
      onUpdate({ actions: next, skillIds: nextSkillIds });
    } else if (typeof actionModalIndex === 'number') {
      const next = [...actions];
      next[actionModalIndex] = action;
      const nextSkillIds = Array.from(new Set([...(enemy.skillIds || []), action.skillId]));
      onUpdate({ actions: next, skillIds: nextSkillIds });
    }
    setActionModalIndex(null);
  };

  const handleRemoveAction = (index: number) => {
    const next = actions.filter((_, i) => i !== index);
    onUpdate({ actions: next });
  };

  // Handle Traits
  const handleConfirmTrait = (trait: TraitData) => {
    if (traitModalIndex === 'new') {
      onUpdate({ traits: [...traits, trait] });
    } else if (typeof traitModalIndex === 'number') {
      const next = [...traits];
      next[traitModalIndex] = trait;
      onUpdate({ traits: next });
    }
    setTraitModalIndex(null);
  };

  const handleRemoveTrait = (index: number) => {
    const next = traits.filter((_, i) => i !== index);
    onUpdate({ traits: next });
  };

  return (
    <div className="mz-detail-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 2-Column Main Layout matching RPG Maker MZ */}
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Rewards, Drops, Action Patterns     */}
        {/* ================================================================= */}
        <div className="mz-actor-col">
          {/* 1. General Settings */}
          <fieldset className="mz-groupbox">
            <legend>General Settings</legend>
            <div className="mz-field-row">
              <label className="mz-field-item">
                <span>Name:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={enemy.name || ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Enemy Name"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12, marginTop: 4 }}>
              {/* Image Preview Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Image:</span>
                <div
                  className="mz-checkered-bg mz-enemy-preview-box"
                  onClick={() => setImageModalOpen(true)}
                  style={{
                    width: '100%',
                    height: 180,
                    cursor: 'pointer',
                    border: '1px solid #94a3b8',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                  title="Click to select graphic"
                >
                  {battlerUrl ? (
                    <img
                      src={battlerUrl}
                      alt={enemy.name}
                      className="mz-enemy-preview-img"
                      style={{
                        filter: battlerHue !== 0 ? `hue-rotate(${battlerHue}deg)` : undefined
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 48 }}>👹</span>
                  )}
                </div>
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => setImageModalOpen(true)}
                  style={{ alignSelf: 'stretch', textAlign: 'center' }}
                >
                  Select Graphic...
                </button>
              </div>

              {/* 8 Parameters (2 columns x 4 rows) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  alignContent: 'start'
                }}
              >
                {/* Row 1: Max HP & Max MP */}
                <label className="mz-field-item">
                  <span>Max HP:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={1}
                    value={params[0]}
                    onChange={(e) => updateParam(0, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span>Max MP:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[1]}
                    onChange={(e) => updateParam(1, Number(e.target.value))}
                  />
                </label>

                {/* Row 2: Attack & Defense */}
                <label className="mz-field-item">
                  <span>Attack:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[2]}
                    onChange={(e) => updateParam(2, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span>Defense:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[3]}
                    onChange={(e) => updateParam(3, Number(e.target.value))}
                  />
                </label>

                {/* Row 3: M.Attack & M.Defense */}
                <label className="mz-field-item">
                  <span>M.Attack:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[4]}
                    onChange={(e) => updateParam(4, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span>M.Defense:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[5]}
                    onChange={(e) => updateParam(5, Number(e.target.value))}
                  />
                </label>

                {/* Row 4: Agility & Luck */}
                <label className="mz-field-item">
                  <span>Agility:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[6]}
                    onChange={(e) => updateParam(6, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span>Luck:</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    value={params[7]}
                    onChange={(e) => updateParam(7, Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          </fieldset>

          {/* 2. Rewards and Drop Items Row */}
          <div className="mz-field-row" style={{ alignItems: 'stretch' }}>
            {/* Rewards */}
            <fieldset className="mz-groupbox" style={{ flex: 1 }}>
              <legend>Rewards</legend>
              <label className="mz-field-item">
                <span>EXP:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={0}
                  value={reward.baseExp ?? enemy.exp ?? 0}
                  onChange={(e) => handleUpdateReward('baseExp', Number(e.target.value))}
                />
              </label>
              <label className="mz-field-item">
                <span>Gold:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={0}
                  value={reward.gold ?? enemy.gold ?? 0}
                  onChange={(e) => handleUpdateReward('gold', Number(e.target.value))}
                />
              </label>
            </fieldset>

            {/* Drop Items */}
            <fieldset className="mz-groupbox" style={{ flex: 1.4 }}>
              <legend>Drop Items</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[0, 1, 2].map((slotIdx) => {
                  const drop = drops[slotIdx];
                  const label = formatDropItemLabel(drop, bundle);
                  return (
                    <div
                      key={slotIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setDropModalSlot(slotIdx)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          padding: '4px 8px',
                          fontSize: 11,
                          border: '1px solid #cbd5e1',
                          borderRadius: 3,
                          background: '#ffffff',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        className="mz-btn-small"
                        onClick={() => setDropModalSlot(slotIdx)}
                        style={{ padding: '3px 8px' }}
                      >
                        ...
                      </button>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* 3. Action Patterns */}
          <fieldset className="mz-groupbox">
            <legend>Action Patterns</legend>
            <div
              className="mz-table-container"
              style={{
                height: 180,
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4
              }}
            >
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Skill</th>
                    <th style={{ width: '40%' }}>Condition</th>
                    <th style={{ width: '10%' }}>R</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {actions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 12 }}>
                        No action patterns (Click &quot;＋ Add Action&quot; below)
                      </td>
                    </tr>
                  ) : (
                    actions.map((act, idx) => {
                      const skill = bundle.game.skills.find((s) => s.id === act.skillId);
                      const skillName = skill?.name || act.skillId;
                      const condText = formatActionCondition(act, bundle);
                      return (
                        <tr
                          key={idx}
                          className="mz-table-clickable-row"
                          onDoubleClick={() => setActionModalIndex(idx)}
                        >
                          <td onClick={() => setActionModalIndex(idx)}>{skillName}</td>
                          <td onClick={() => setActionModalIndex(idx)}>{condText}</td>
                          <td onClick={() => setActionModalIndex(idx)} style={{ textAlign: 'center' }}>
                            {act.rating ?? 5}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="mz-btn-small danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAction(idx);
                              }}
                              style={{ padding: '0 4px', fontSize: 10 }}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setActionModalIndex('new')}
              >
                ＋ Tambah Action
              </button>
            </div>
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Traits, Note                                         */}
        {/* ================================================================= */}
        <div className="mz-actor-col">
          {/* 4. Traits */}
          <fieldset className="mz-groupbox">
            <legend>Traits</legend>
            <div
              className="mz-traits-table-container"
              style={{
                height: 240,
                maxHeight: 280,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4
              }}
            >
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Type</th>
                    <th style={{ width: '50%' }}>Content</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {traits.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: 12 }}>
                        No traits defined
                      </td>
                    </tr>
                  ) : (
                    traits.map((trait, idx) => (
                      <tr
                        key={idx}
                        className="mz-table-clickable-row"
                        onDoubleClick={() => setTraitModalIndex(idx)}
                      >
                        <td onClick={() => setTraitModalIndex(idx)}>
                          {formatTraitType(trait)}
                        </td>
                        <td onClick={() => setTraitModalIndex(idx)}>
                          {formatTraitContent(trait, bundle.game)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="mz-btn-small danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrait(idx);
                            }}
                            style={{ padding: '0 4px', fontSize: 10 }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setTraitModalIndex('new')}
              >
                ＋ Tambah Trait
              </button>
            </div>
          </fieldset>

          {/* 5. Note */}
          <fieldset className="mz-groupbox" style={{ flex: 1 }}>
            <legend>Note</legend>
            <textarea
              className="mz-textarea mz-note-textarea"
              value={enemy.note || ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Developer notes for this enemy..."
              rows={8}
              style={{
                width: '100%',
                flex: 1,
                minHeight: 120,
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </fieldset>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BOTTOM ACCORDION: NUSV Engine Advanced Fields                     */}
      {/* ================================================================= */}
      <div className="mz-advanced-accordion" style={{ border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#334155'
          }}
        >
          <span>⚙️ Pengaturan Lanjutan (Advanced / NUSV Engine)</span>
          <span>{showAdvanced ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {showAdvanced && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* ID & AI Archetype & Class EXP */}
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span>Technical ID:</span>
                <input
                  type="text"
                  value={enemy.id || ''}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span>AI Archetype:</span>
                <select
                  value={enemy.ai || 'aggressive'}
                  onChange={(e) => onUpdate({ ai: e.target.value as 'aggressive' | 'caster' | 'guardian' })}
                >
                  <option value="aggressive">Aggressive (Fisik / Agresif)</option>
                  <option value="caster">Caster (Sihir / Taktis)</option>
                  <option value="guardian">Guardian (Bertahan)</option>
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span>Class EXP Reward:</span>
                <input
                  type="number"
                  min={0}
                  value={reward.classExp ?? 0}
                  onChange={(e) =>
                    onUpdate({
                      reward: { ...reward, classExp: Math.max(0, Number(e.target.value)) }
                    })
                  }
                />
              </label>
            </div>

            {/* Base Stats Bonus */}
            <fieldset className="mz-groupbox">
              <legend>Bonus Base Stats (+STR, +INT, +DEX, +LUK, +AGI, +VIT)</legend>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 8
                }}
              >
                {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as const).map((key) => (
                  <label key={key} className="mz-field-item">
                    <span>+{key.toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      value={stats[key] ?? 0}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        onUpdate({
                          stats: { ...stats, [key]: val }
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Boss Phases Preview / Info */}
            {enemy.bossPhases && enemy.bossPhases.length > 0 && (
              <fieldset className="mz-groupbox">
                <legend>Boss Phases ({enemy.bossPhases.length})</legend>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {enemy.bossPhases.map((phase, pIdx) => (
                    <div key={pIdx} style={{ padding: '3px 0' }}>
                      <strong>{phase.name}</strong> (HP &le; {Math.round(phase.hpRatio * 100)}%) - Skills: {phase.skillIds?.join(', ') || 'None'}
                    </div>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}
      {imageModalOpen && (
        <EnemyImagePickerModal
          currentImage={battlerPath}
          currentHue={battlerHue}
          assetUrlMap={assetUrlMap}
          onConfirm={handleConfirmImage}
          onClose={() => setImageModalOpen(false)}
        />
      )}

      {dropModalSlot !== null && (
        <EnemyDropItemModal
          currentDrop={drops[dropModalSlot]}
          bundle={bundle}
          onConfirm={handleConfirmDrop}
          onClose={() => setDropModalSlot(null)}
        />
      )}

      {actionModalIndex !== null && (
        <EnemyActionModal
          currentAction={typeof actionModalIndex === 'number' ? actions[actionModalIndex] : undefined}
          bundle={bundle}
          onConfirm={handleConfirmAction}
          onClose={() => setActionModalIndex(null)}
        />
      )}

      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={typeof traitModalIndex === 'number' ? traits[traitModalIndex] : null}
          bundle={bundle}
          onConfirm={handleConfirmTrait}
          onDelete={typeof traitModalIndex === 'number' ? () => handleRemoveTrait(traitModalIndex) : undefined}
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}
