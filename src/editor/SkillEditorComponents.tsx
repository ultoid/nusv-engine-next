import React, { useState, useMemo } from 'react';
import type { SkillData, SkillDamage, SkillEffect } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  DEFAULT_ELEMENTS,
  DEFAULT_SKILL_TYPES,
  DEFAULT_WEAPON_TYPES
} from './TypesEditorComponents.js';

export { DEFAULT_ELEMENTS, DEFAULT_SKILL_TYPES, DEFAULT_WEAPON_TYPES };

export const SKILL_PARAM_NAMES: Record<number, string> = {
  0: 'Max HP',
  1: 'Max MP',
  2: 'Attack',
  3: 'Defense',
  4: 'M.Attack',
  5: 'M.Defense',
  6: 'Agility',
  7: 'Luck'
};

export const SCOPE_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: '1 Enemy' },
  { value: 2, label: 'All Enemies' },
  { value: 3, label: '1 Random Enemy' },
  { value: 4, label: '2 Random Enemies' },
  { value: 5, label: '3 Random Enemies' },
  { value: 6, label: '4 Random Enemies' },
  { value: 7, label: '1 Ally' },
  { value: 8, label: 'All Allies' },
  { value: 9, label: '1 Ally (Dead)' },
  { value: 10, label: 'All Allies (Dead)' },
  { value: 11, label: 'The User' }
];

export const OCCASION_OPTIONS = [
  { value: 0, label: 'Always' },
  { value: 1, label: 'Battle Screen' },
  { value: 2, label: 'Menu Screen' },
  { value: 3, label: 'Never' }
];

export const HIT_TYPE_OPTIONS = [
  { value: 0, label: 'Certain Hit' },
  { value: 1, label: 'Physical Attack' },
  { value: 2, label: 'Magical Attack' }
];

export const DAMAGE_TYPE_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'HP Damage' },
  { value: 2, label: 'MP Damage' },
  { value: 3, label: 'HP Recover' },
  { value: 4, label: 'MP Recover' },
  { value: 5, label: 'HP Drain' },
  { value: 6, label: 'MP Drain' }
];

export function formatEffectType(effect: SkillEffect): string {
  switch (effect.code) {
    case 11: return 'Recover HP';
    case 12: return 'Recover MP';
    case 13: return 'Gain TP';
    case 21: return 'Add State';
    case 22: return 'Remove State';
    case 31: return 'Add Buff';
    case 32: return 'Add Debuff';
    case 33: return 'Remove Buff';
    case 34: return 'Remove Debuff';
    case 41: return 'Special Effect';
    case 42: return 'Grow';
    case 43: return 'Learn Skill';
    case 44: return 'Common Event';
    default: return `Effect (${effect.code})`;
  }
}

export function formatEffectContent(effect: SkillEffect, game: ProjectBundle['game']): string {
  switch (effect.code) {
    case 11: {
      const pct = Math.round(effect.value1 * 100);
      const flat = effect.value2;
      if (pct !== 0 && flat !== 0) return `${pct}% + ${flat}`;
      if (pct !== 0) return `${pct}%`;
      return `${flat}`;
    }
    case 12: {
      const pct = Math.round(effect.value1 * 100);
      const flat = effect.value2;
      if (pct !== 0 && flat !== 0) return `${pct}% + ${flat}`;
      if (pct !== 0) return `${pct}%`;
      return `${flat}`;
    }
    case 13: return `${effect.value1}`;
    case 21: {
      const isNormal = effect.dataId === 0 || effect.dataId === 'normal' || String(effect.dataId) === '0';
      const name = isNormal ? 'Normal Attack' : (game.states.find((s) => s.id === effect.dataId)?.name ?? effect.dataId);
      return `${name} ${Math.round(effect.value1 * 100)}%`;
    }
    case 22: {
      const name = game.states.find((s) => s.id === effect.dataId)?.name ?? effect.dataId;
      return `${name} ${Math.round(effect.value1 * 100)}%`;
    }
    case 31: {
      const param = SKILL_PARAM_NAMES[Number(effect.dataId)] ?? `Param ${effect.dataId}`;
      return `${param} ${effect.value1} Turns`;
    }
    case 32: {
      const param = SKILL_PARAM_NAMES[Number(effect.dataId)] ?? `Param ${effect.dataId}`;
      return `${param} ${effect.value1} Turns`;
    }
    case 33: {
      const param = SKILL_PARAM_NAMES[Number(effect.dataId)] ?? `Param ${effect.dataId}`;
      return `${param}`;
    }
    case 34: {
      const param = SKILL_PARAM_NAMES[Number(effect.dataId)] ?? `Param ${effect.dataId}`;
      return `${param}`;
    }
    case 41: return 'Escape';
    case 42: {
      const param = SKILL_PARAM_NAMES[Number(effect.dataId)] ?? `Param ${effect.dataId}`;
      return `${param} +${effect.value1}`;
    }
    case 43: {
      const name = game.skills.find((s) => s.id === effect.dataId)?.name ?? effect.dataId;
      return `${name}`;
    }
    case 44: {
      const commonEvents = (game.commonEvents || []) as Array<{ id: string; name: string }>;
      const ce = commonEvents.find((c) => c.id === effect.dataId);
      return `${ce?.name ?? effect.dataId}`;
    }
    default:
      return `Data: ${effect.dataId}, Val1: ${effect.value1}, Val2: ${effect.value2}`;
  }
}

// =============================================================================
// MODAL: Icon Picker (Grid 16 Columns ala RPG Maker MZ)
// =============================================================================
export function IconPickerModal({
  initialIndex = 0,
  iconUrl,
  onConfirm,
  onClose
}: {
  initialIndex: number;
  iconUrl?: string;
  onConfirm: (index: number) => void;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const totalIcons = 512; // 32 rows x 16 cols

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 590, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>Pilih Icon (Select Icon)</span>
          <button type="button" className="mz-sub-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#334155' }}>
              Icon Terpilih: <strong>#{selectedIndex}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Index:</span>
              <input
                type="number"
                min={0}
                max={totalIcons - 1}
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Math.max(0, Math.min(totalIcons - 1, Number(e.target.value))))}
                style={{ width: 70, height: 26, fontSize: 12, padding: '2px 6px' }}
              />
            </div>
          </div>

          <div
            className="mz-icon-picker-grid-container"
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              padding: 6,
              background: '#f1f5f9'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(16, 32px)',
                gap: 2,
                justifyContent: 'center'
              }}
            >
              {Array.from({ length: totalIcons }).map((_, idx) => {
                const srcX = (idx % 16) * 32;
                const srcY = Math.floor(idx / 16) * 32;
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={idx}
                    title={`Icon #${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    onDoubleClick={() => {
                      onConfirm(idx);
                      onClose();
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0284c7' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 3,
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    {iconUrl ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          backgroundImage: `url("${iconUrl}")`,
                          backgroundPosition: `-${srcX}px -${srcY}px`,
                          backgroundSize: '512px auto'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        {idx}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button type="button" className="mz-btn-modal-cancel" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="mz-btn-modal-ok"
            onClick={() => {
              onConfirm(selectedIndex);
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL: Skill Effect Editor (4 Tabs ala RPG Maker MZ)
// =============================================================================
export function SkillEffectModal({
  initialEffect,
  game,
  onConfirm,
  onDelete,
  onClose
}: {
  initialEffect: SkillEffect | null;
  game: ProjectBundle['game'];
  onConfirm: (effect: SkillEffect) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const getInitialTab = () => {
    if (!initialEffect) return 'recover';
    const c = initialEffect.code;
    if (c >= 11 && c <= 13) return 'recover';
    if (c >= 21 && c <= 22) return 'state';
    if (c >= 31 && c <= 34) return 'param';
    return 'other';
  };

  const [activeTab, setActiveTab] = useState<'recover' | 'state' | 'param' | 'other'>(getInitialTab);
  const [subType, setSubType] = useState<number>(() => {
    if (initialEffect) return initialEffect.code;
    return 11;
  });
  const [dataId, setDataId] = useState<string | number>(() => {
    if (initialEffect) return initialEffect.dataId;
    return 0;
  });
  const [value1, setValue1] = useState<number>(() => {
    if (initialEffect) return initialEffect.value1;
    return 0;
  });
  const [value2, setValue2] = useState<number>(() => {
    if (initialEffect) return initialEffect.value2;
    return 0;
  });

  const handleTabChange = (tab: 'recover' | 'state' | 'param' | 'other') => {
    setActiveTab(tab);
    if (tab === 'recover') {
      setSubType(11);
      setValue1(0.2); // 20%
      setValue2(0);
    } else if (tab === 'state') {
      setSubType(21);
      setDataId(0);
      setValue1(1.0); // 100%
      setValue2(0);
    } else if (tab === 'param') {
      setSubType(31);
      setDataId(2); // ATK
      setValue1(5); // 5 turns
      setValue2(0);
    } else if (tab === 'other') {
      setSubType(41);
      setDataId(0);
      setValue1(0);
      setValue2(0);
    }
  };

  const handleSave = () => {
    onConfirm({
      code: subType,
      dataId,
      value1,
      value2
    });
    onClose();
  };

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>{initialEffect ? 'Edit Efek (Effect)' : 'Tambah Efek Baru (Add Effect)'}</span>
          <button type="button" className="mz-sub-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mz-sub-modal-body">
          {/* Tabs */}
          <div className="mz-trait-tabs">
            <button
              type="button"
              className={`mz-trait-tab-btn ${activeTab === 'recover' ? 'active' : ''}`}
              onClick={() => handleTabChange('recover')}
            >
              Recover
            </button>
            <button
              type="button"
              className={`mz-trait-tab-btn ${activeTab === 'state' ? 'active' : ''}`}
              onClick={() => handleTabChange('state')}
            >
              State
            </button>
            <button
              type="button"
              className={`mz-trait-tab-btn ${activeTab === 'param' ? 'active' : ''}`}
              onClick={() => handleTabChange('param')}
            >
              Param
            </button>
            <button
              type="button"
              className={`mz-trait-tab-btn ${activeTab === 'other' ? 'active' : ''}`}
              onClick={() => handleTabChange('other')}
            >
              Other
            </button>
          </div>

          {/* TAB 1: RECOVER */}
          {activeTab === 'recover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="recover_sub"
                    checked={subType === 11}
                    onChange={() => setSubType(11)}
                  />
                  <span>Recover HP</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="recover_sub"
                    checked={subType === 12}
                    onChange={() => setSubType(12)}
                  />
                  <span>Recover MP</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="recover_sub"
                    checked={subType === 13}
                    onChange={() => setSubType(13)}
                  />
                  <span>Gain TP</span>
                </label>
              </div>

              {subType === 11 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <label className="mz-field-item" style={{ flex: 1 }}>
                    <span className="mz-field-label">Rate (%):</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={Math.round(value1 * 100)}
                      onChange={(e) => setValue1(Number(e.target.value) / 100)}
                    />
                  </label>
                  <label className="mz-field-item" style={{ flex: 1 }}>
                    <span className="mz-field-label">Amount:</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={value2}
                      onChange={(e) => setValue2(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {subType === 12 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <label className="mz-field-item" style={{ flex: 1 }}>
                    <span className="mz-field-label">Rate (%):</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={Math.round(value1 * 100)}
                      onChange={(e) => setValue1(Number(e.target.value) / 100)}
                    />
                  </label>
                  <label className="mz-field-item" style={{ flex: 1 }}>
                    <span className="mz-field-label">Amount:</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={value2}
                      onChange={(e) => setValue2(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {subType === 13 && (
                <div style={{ marginTop: 8 }}>
                  <label className="mz-field-item" style={{ width: 140 }}>
                    <span className="mz-field-label">TP Gain:</span>
                    <input
                      type="number"
                      className="mz-input"
                      min={0}
                      max={100}
                      value={value1}
                      onChange={(e) => setValue1(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STATE */}
          {activeTab === 'state' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="state_sub"
                    checked={subType === 21}
                    onChange={() => setSubType(21)}
                  />
                  <span>Add State</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="state_sub"
                    checked={subType === 22}
                    onChange={() => setSubType(22)}
                  />
                  <span>Remove State</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <label className="mz-field-item" style={{ flex: 1 }}>
                  <span className="mz-field-label">State:</span>
                  <select
                    className="mz-select"
                    value={String(dataId)}
                    onChange={(e) => setDataId(e.target.value)}
                  >
                    {subType === 21 && <option value="0">Normal Attack</option>}
                    {game.states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.id})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mz-field-item" style={{ width: 120 }}>
                  <span className="mz-field-label">Success Rate (%):</span>
                  <input
                    type="number"
                    className="mz-input"
                    min={0}
                    max={1000}
                    value={Math.round(value1 * 100)}
                    onChange={(e) => setValue1(Number(e.target.value) / 100)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PARAM */}
          {activeTab === 'param' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="param_sub"
                    checked={subType === 31}
                    onChange={() => setSubType(31)}
                  />
                  <span>Add Buff</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="param_sub"
                    checked={subType === 32}
                    onChange={() => setSubType(32)}
                  />
                  <span>Add Debuff</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="param_sub"
                    checked={subType === 33}
                    onChange={() => setSubType(33)}
                  />
                  <span>Remove Buff</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="param_sub"
                    checked={subType === 34}
                    onChange={() => setSubType(34)}
                  />
                  <span>Remove Debuff</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <label className="mz-field-item" style={{ flex: 1 }}>
                  <span className="mz-field-label">Parameter:</span>
                  <select
                    className="mz-select"
                    value={Number(dataId)}
                    onChange={(e) => setDataId(Number(e.target.value))}
                  >
                    {Object.entries(SKILL_PARAM_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                {(subType === 31 || subType === 32) && (
                  <label className="mz-field-item" style={{ width: 120 }}>
                    <span className="mz-field-label">Turns:</span>
                    <input
                      type="number"
                      className="mz-input"
                      min={1}
                      max={1000}
                      value={value1 || 5}
                      onChange={(e) => setValue1(Number(e.target.value))}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OTHER */}
          {activeTab === 'other' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="other_sub"
                    checked={subType === 41}
                    onChange={() => {
                      setSubType(41);
                      setDataId(0);
                    }}
                  />
                  <span>Special Effect (Escape)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="other_sub"
                    checked={subType === 42}
                    onChange={() => {
                      setSubType(42);
                      setDataId(0);
                      setValue1(10);
                    }}
                  />
                  <span>Grow (Permanent Stat)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="other_sub"
                    checked={subType === 43}
                    onChange={() => {
                      setSubType(43);
                      setDataId(game.skills[0]?.id ?? '');
                    }}
                  />
                  <span>Learn Skill</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="radio"
                    name="other_sub"
                    checked={subType === 44}
                    onChange={() => {
                      setSubType(44);
                      setDataId((game.commonEvents || [])[0]?.id ?? '');
                    }}
                  />
                  <span>Common Event</span>
                </label>
              </div>

              {subType === 42 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <label className="mz-field-item" style={{ flex: 1 }}>
                    <span className="mz-field-label">Parameter:</span>
                    <select
                      className="mz-select"
                      value={Number(dataId)}
                      onChange={(e) => setDataId(Number(e.target.value))}
                    >
                      {Object.entries(SKILL_PARAM_NAMES).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mz-field-item" style={{ width: 120 }}>
                    <span className="mz-field-label">Amount:</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={value1 || 10}
                      onChange={(e) => setValue1(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {subType === 43 && (
                <div style={{ marginTop: 8 }}>
                  <label className="mz-field-item">
                    <span className="mz-field-label">Skill:</span>
                    <select
                      className="mz-select"
                      value={String(dataId)}
                      onChange={(e) => setDataId(e.target.value)}
                    >
                      {game.skills.map((sk) => (
                        <option key={sk.id} value={sk.id}>
                          {sk.name} ({sk.id})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {subType === 44 && (
                <div style={{ marginTop: 8 }}>
                  <label className="mz-field-item">
                    <span className="mz-field-label">Common Event:</span>
                    <select
                      className="mz-select"
                      value={String(dataId)}
                      onChange={(e) => setDataId(e.target.value)}
                    >
                      {(game.commonEvents || []).map((ce) => (
                        <option key={ce.id} value={ce.id}>
                          {ce.name} ({ce.id})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mz-sub-modal-footer">
          {onDelete && (
            <button
              type="button"
              className="mz-btn-modal-cancel"
              style={{ marginRight: 'auto', background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Hapus Efek
            </button>
          )}
          <button type="button" className="mz-btn-modal-cancel" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="mz-btn-modal-ok" onClick={handleSave}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN FORM: SkillDetailForm (2 Column RPG Maker MZ Layout)
// =============================================================================
export function SkillDetailForm({
  skill,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  skill: SkillData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [effectModalIndex, setEffectModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconUrl = assetUrlMap['assets/system/IconSet.png'];
  const iconIndex = Number(skill.iconIndex ?? 76);

  // Lists from types or defaults
  const skillTypes = useMemo(() => {
    return bundle.game.types?.skillTypes || DEFAULT_SKILL_TYPES;
  }, [bundle.game.types?.skillTypes]);

  const weaponTypes = useMemo(() => {
    return bundle.game.types?.weaponTypes || DEFAULT_WEAPON_TYPES;
  }, [bundle.game.types?.weaponTypes]);

  const elements = useMemo(() => {
    return bundle.game.types?.elements || DEFAULT_ELEMENTS;
  }, [bundle.game.types?.elements]);

  // MZ Damage Object
  const damage: SkillDamage = useMemo(() => {
    if (skill.damage && typeof skill.damage === 'object') return skill.damage;
    // synthesize from legacy fields
    let initialType = 1; // HP Damage
    if (skill.kind === 'heal') initialType = 3;
    return {
      type: initialType,
      elementId: -1, // Normal Attack
      formula: 'a.atk * 4 - b.def * 2',
      variance: 20,
      critical: true
    };
  }, [skill.damage, skill.kind]);

  // Effects Array
  const effects: SkillEffect[] = useMemo(() => {
    if (Array.isArray(skill.effects)) return skill.effects;
    // synthesize from legacy stateId if present
    if (skill.stateId) {
      return [
        {
          code: 21,
          dataId: skill.stateId,
          value1: skill.stateChance ?? 1.0,
          value2: 0
        }
      ];
    }
    return [
      {
        code: 21,
        dataId: 0, // Normal Attack
        value1: 1.0,
        value2: 0
      }
    ];
  }, [skill.effects, skill.stateId, skill.stateChance]);

  // Sequence Tags (NUSV Combat)
  const seq = Array.isArray(skill.sequence) ? skill.sequence : [];

  const toggleSequence = (tag: 'approach' | 'cast' | 'impact' | 'return') => {
    const nextSeq = seq.includes(tag) ? seq.filter((s) => s !== tag) : [...seq, tag];
    onUpdate({ sequence: nextSeq });
  };

  // Convert Scope between MZ number and NUSV string/target
  const scopeVal = typeof skill.scope === 'number' ? skill.scope : (skill.scope === 'all-enemies' ? 2 : skill.scope === '1-ally' ? 7 : skill.scope === 'all-allies' ? 8 : skill.scope === 'dead-ally' ? 9 : skill.scope === 'user' ? 11 : 1);

  const handleScopeChange = (val: number) => {
    const patch: Record<string, unknown> = { scope: val };
    if (val >= 1 && val <= 6) {
      patch.target = 'enemy';
      patch.scope = val === 2 ? 'all-enemies' : '1-enemy';
    } else if (val >= 7 && val <= 11) {
      patch.target = 'ally';
      if (val === 8) patch.scope = 'all-allies';
      else if (val === 9 || val === 10) {
        patch.scope = 'dead-ally';
        patch.kind = 'revive';
      } else if (val === 11) patch.scope = 'user';
      else patch.scope = '1-ally';
    } else {
      patch.scope = 'none';
    }
    onUpdate(patch);
  };

  // Convert Occasion between MZ number and NUSV string
  const occasionVal = typeof skill.occasion === 'number' ? skill.occasion : (skill.occasion === 'battle' ? 1 : skill.occasion === 'menu' ? 2 : skill.occasion === 'never' ? 3 : 0);

  const handleOccasionChange = (val: number) => {
    const str = val === 1 ? 'battle' : val === 2 ? 'menu' : val === 3 ? 'never' : 'always';
    onUpdate({ occasion: str });
  };

  // Handle Damage updates
  const updateDamage = (patch: Partial<SkillDamage>) => {
    const nextDamage = { ...damage, ...patch };
    const rootPatch: Record<string, unknown> = { damage: nextDamage };

    // Synchronize kind
    if (patch.type !== undefined) {
      if (patch.type === 3 || patch.type === 4) {
        rootPatch.kind = 'heal';
      } else if (patch.type === 1 || patch.type === 2 || patch.type === 5 || patch.type === 6) {
        rootPatch.kind = (skill.hitType ?? 1) === 2 ? 'magical' : 'physical';
      }
    }
    onUpdate(rootPatch);
  };

  // Quick message presets
  const applyMessagePreset = (verb: string) => {
    const skillName = skill.name || 'Action';
    onUpdate({ message1: `%1 ${verb.replace('*', skillName)}` });
  };

  // Effects Handlers
  const handleConfirmEffect = (effect: SkillEffect) => {
    if (effectModalIndex === 'new') {
      onUpdate({ effects: [...effects, effect] });
    } else if (typeof effectModalIndex === 'number') {
      const next = [...effects];
      next[effectModalIndex] = effect;
      onUpdate({ effects: next });
    }
    setEffectModalIndex(null);
  };

  const handleDeleteEffect = (index: number) => {
    onUpdate({ effects: effects.filter((_, i) => i !== index) });
  };

  return (
    <div className="mz-skill-editor-root">
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Invocation, Message, Required Weapon */}
        {/* ================================================================= */}
        <div className="mz-actor-col" style={{ flex: 1.1 }}>
          {/* 1. General Settings */}
          <fieldset className="mz-groupbox">
            <legend>General Settings</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Name:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={skill.name ?? ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                />
              </label>

              <div className="mz-field-item" style={{ width: 'auto' }}>
                <span className="mz-field-label">Icon:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    className="mz-icon-preview-box"
                    title="Klik untuk memilih Icon"
                    onClick={() => setIconModalOpen(true)}
                    style={{
                      width: 36,
                      height: 36,
                      border: '1px solid #94a3b8',
                      borderRadius: 4,
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {iconUrl ? (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          backgroundImage: `url("${iconUrl}")`,
                          backgroundPosition: `-${(iconIndex % 16) * 32}px -${Math.floor(iconIndex / 16) * 32}px`,
                          backgroundSize: '512px auto'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 14 }}>⚡</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={511}
                    className="mz-input"
                    value={iconIndex}
                    onChange={(e) => onUpdate({ iconIndex: Number(e.target.value) })}
                    style={{ width: 60 }}
                  />
                </div>
              </div>
            </div>

            <label className="mz-field-item">
              <span className="mz-field-label">Description:</span>
              <textarea
                className="mz-textarea"
                rows={2}
                value={skill.description ?? ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Description of the skill..."
              />
            </label>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Skill Type:</span>
                <select
                  className="mz-select"
                  value={skill.stypeId ?? 0}
                  onChange={(e) => onUpdate({ stypeId: Number(e.target.value) })}
                >
                  <option value={0}>None</option>
                  {skillTypes.map((st, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ width: 85 }}>
                <span className="mz-field-label">MP Cost:</span>
                <input
                  type="number"
                  min={0}
                  className="mz-input"
                  value={skill.mpCost ?? 0}
                  onChange={(e) => onUpdate({ mpCost: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ width: 85 }}>
                <span className="mz-field-label">TP Cost:</span>
                <input
                  type="number"
                  min={0}
                  className="mz-input"
                  value={skill.tpCost ?? skill.spCost ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdate({ tpCost: val, spCost: val });
                  }}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span className="mz-field-label">Scope:</span>
                <select
                  className="mz-select"
                  value={scopeVal}
                  onChange={(e) => handleScopeChange(Number(e.target.value))}
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Occasion:</span>
                <select
                  className="mz-select"
                  value={occasionVal}
                  onChange={(e) => handleOccasionChange(Number(e.target.value))}
                >
                  {OCCASION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {/* 2. Invocation */}
          <fieldset className="mz-groupbox">
            <legend>Invocation</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Speed:</span>
                <input
                  type="number"
                  className="mz-input"
                  value={skill.speed ?? 0}
                  onChange={(e) => onUpdate({ speed: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Success:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="mz-input"
                    value={skill.successRate ?? 100}
                    onChange={(e) => onUpdate({ successRate: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: 12, color: '#64748b' }}>%</span>
                </div>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Repeat:</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  className="mz-input"
                  value={skill.repeats ?? 1}
                  onChange={(e) => onUpdate({ repeats: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">TP Gain:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="mz-input"
                  value={skill.tpGain ?? 0}
                  onChange={(e) => onUpdate({ tpGain: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Hit Type:</span>
                <select
                  className="mz-select"
                  value={skill.hitType ?? (skill.kind === 'magical' ? 2 : 1)}
                  onChange={(e) => {
                    const hit = Number(e.target.value);
                    const patch: Record<string, unknown> = { hitType: hit };
                    if (skill.kind === 'physical' && hit === 2) patch.kind = 'magical';
                    if (skill.kind === 'magical' && hit === 1) patch.kind = 'physical';
                    onUpdate(patch);
                  }}
                >
                  {HIT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span className="mz-field-label">Animation:</span>
                <select
                  className="mz-select"
                  value={skill.animationId ?? -1}
                  onChange={(e) => onUpdate({ animationId: e.target.value })}
                >
                  <option value={-1}>Normal Attack</option>
                  <option value={0}>None</option>
                  <option value="Hit Physical">Hit Physical</option>
                  <option value="Slash">Slash</option>
                  <option value="Fire One 1">Fire One 1</option>
                  <option value="Ice One 1">Ice One 1</option>
                  <option value="Thunder One 1">Thunder One 1</option>
                  <option value="Recovery One 1">Recovery One 1</option>
                  <option value="Revive 1">Revive 1</option>
                </select>
              </label>
            </div>
          </fieldset>

          {/* 3. Message */}
          <fieldset className="mz-groupbox">
            <legend>Message</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="text"
                className="mz-input"
                placeholder="%1 attacks!"
                value={skill.message1 ?? '%1 attacks!'}
                onChange={(e) => onUpdate({ message1: e.target.value })}
              />
              <input
                type="text"
                className="mz-input"
                placeholder="(Optional second message line)"
                value={skill.message2 ?? ''}
                onChange={(e) => onUpdate({ message2: e.target.value })}
              />

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => applyMessagePreset('casts *!')}
                  style={{ flex: 1 }}
                >
                  &quot;casts *!&quot;
                </button>
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => applyMessagePreset('does *!')}
                  style={{ flex: 1 }}
                >
                  &quot;does *!&quot;
                </button>
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => applyMessagePreset('uses *!')}
                  style={{ flex: 1 }}
                >
                  &quot;uses *!&quot;
                </button>
              </div>
            </div>
          </fieldset>

          {/* 4. Required Weapon */}
          <fieldset className="mz-groupbox">
            <legend>Required Weapon</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Weapon Type 1:</span>
                <select
                  className="mz-select"
                  value={skill.requiredWtypeId1 ?? 0}
                  onChange={(e) => onUpdate({ requiredWtypeId1: Number(e.target.value) })}
                >
                  <option value={0}>None</option>
                  {weaponTypes.map((wt, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {wt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Weapon Type 2:</span>
                <select
                  className="mz-select"
                  value={skill.requiredWtypeId2 ?? 0}
                  onChange={(e) => onUpdate({ requiredWtypeId2: Number(e.target.value) })}
                >
                  <option value={0}>None</option>
                  {weaponTypes.map((wt, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {wt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Damage, Effects, Note                               */}
        {/* ================================================================= */}
        <div className="mz-actor-col" style={{ flex: 1 }}>
          {/* 1. Damage */}
          <fieldset className="mz-groupbox">
            <legend>Damage</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Type:</span>
                <select
                  className="mz-select"
                  value={damage.type}
                  onChange={(e) => updateDamage({ type: Number(e.target.value) })}
                >
                  {DAMAGE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Element:</span>
                <select
                  className="mz-select"
                  value={damage.elementId ?? -1}
                  onChange={(e) => {
                    const el = e.target.value === '-1' ? -1 : e.target.value === '0' ? 0 : Number(e.target.value);
                    updateDamage({ elementId: el });
                  }}
                >
                  <option value={-1}>Normal Attack</option>
                  <option value={0}>None</option>
                  {elements.map((el, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {el}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mz-field-item">
              <span className="mz-field-label">Formula:</span>
              <input
                type="text"
                className="mz-input"
                value={damage.formula ?? 'a.atk * 4 - b.def * 2'}
                onChange={(e) => updateDamage({ formula: e.target.value })}
              />
            </label>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Variance:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="mz-input"
                    value={damage.variance ?? 20}
                    onChange={(e) => updateDamage({ variance: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: 12, color: '#64748b' }}>%</span>
                </div>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Critical Hits:</span>
                <select
                  className="mz-select"
                  value={damage.critical ? 'yes' : 'no'}
                  onChange={(e) => updateDamage({ critical: e.target.value === 'yes' })}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          </fieldset>

          {/* 2. Effects */}
          <fieldset className="mz-groupbox">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <legend style={{ margin: 0 }}>Effects</legend>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setEffectModalIndex('new')}
              >
                ＋ Tambah Efek...
              </button>
            </div>

            <div
              className="mz-table-container"
              style={{
                minHeight: 120,
                maxHeight: 160,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#fff'
              }}
            >
              <table className="mz-table" style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', width: '38%' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Content</th>
                    <th style={{ width: 24 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {effects.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                        Tidak ada efek. Klik ＋ Tambah Efek...
                      </td>
                    </tr>
                  ) : (
                    effects.map((ef, idx) => (
                      <tr
                        key={idx}
                        className="mz-tr-hover"
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onDoubleClick={() => setEffectModalIndex(idx)}
                      >
                        <td style={{ padding: '4px 8px', fontWeight: 600, color: '#334155' }}>
                          {formatEffectType(ef)}
                        </td>
                        <td style={{ padding: '4px 8px', color: '#475569' }}>
                          {formatEffectContent(ef, bundle.game)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>
                          <button
                            type="button"
                            className="mz-btn-small danger"
                            style={{ padding: '0 4px', fontSize: 10, height: 18 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEffect(idx);
                            }}
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
          </fieldset>

          {/* 3. Note */}
          <fieldset className="mz-groupbox">
            <legend>Note</legend>
            <textarea
              className="mz-textarea"
              rows={4}
              value={skill.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Developer notes or plugin tags..."
            />
          </fieldset>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BOTTOM ACCORDION: NUSV Engine Combat & Sequences                     */}
      {/* =================================================================== */}
      <div className="mz-advanced-accordion" style={{ marginTop: 12 }}>
        <div
          className="mz-advanced-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            background: '#e2e8f0',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#1e293b'
          }}
        >
          <span>{showAdvanced ? '▼' : '►'} Advanced / NUSV Core Combat Parameters & Growth</span>
          <span className="mz-advanced-hint" style={{ fontSize: 11, color: '#64748b', fontWeight: 'normal' }}>
            Klik untuk melihat konfigurasi ID, Kind, Power, Armor Piercing & Action Sequence Tags
          </span>
        </div>

        {showAdvanced && (
          <div
            className="mz-advanced-content"
            style={{
              padding: '12px',
              border: '1px solid #cbd5e1',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">ID Skill:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={skill.id}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Tipe Aksi (Kind):</span>
                <select
                  className="mz-select"
                  value={skill.kind}
                  onChange={(e) => onUpdate({ kind: e.target.value })}
                >
                  <option value="physical">Physical (Serangan Fisik)</option>
                  <option value="magical">Magical (Sihir)</option>
                  <option value="heal">Heal (Pemulihan)</option>
                  <option value="revive">Revive (Kebangkitan)</option>
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Power (Pengali Damage):</span>
                <input
                  type="number"
                  step="0.05"
                  className="mz-input"
                  value={skill.power}
                  onChange={(e) => onUpdate({ power: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ width: 'auto', marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(skill.armorPiercing)}
                    onChange={(e) => onUpdate({ armorPiercing: e.target.checked })}
                  />
                  <span style={{ fontSize: 12, color: '#334155' }}>Armor Piercing</span>
                </div>
              </label>
            </div>

            <div>
              <span className="mz-field-label" style={{ marginBottom: 6, display: 'block' }}>
                Action Sequence Tags (Side View Animation):
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['approach', 'cast', 'impact', 'return'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`mz-btn-small ${seq.includes(tag) ? 'active' : ''}`}
                    style={{
                      background: seq.includes(tag) ? '#0284c7' : '#e2e8f0',
                      color: seq.includes(tag) ? '#ffffff' : '#475569',
                      fontWeight: 600,
                      padding: '4px 12px'
                    }}
                    onClick={() => toggleSequence(tag)}
                  >
                    {tag.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ICON PICKER */}
      {iconModalOpen && (
        <IconPickerModal
          initialIndex={iconIndex}
          iconUrl={iconUrl}
          onConfirm={(idx) => onUpdate({ iconIndex: idx })}
          onClose={() => setIconModalOpen(false)}
        />
      )}

      {/* MODAL: EFFECT EDITOR */}
      {effectModalIndex !== null && (
        <SkillEffectModal
          initialEffect={effectModalIndex === 'new' ? null : effects[effectModalIndex]}
          game={bundle.game}
          onConfirm={handleConfirmEffect}
          onDelete={typeof effectModalIndex === 'number' ? () => handleDeleteEffect(effectModalIndex) : undefined}
          onClose={() => setEffectModalIndex(null)}
        />
      )}
    </div>
  );
}
