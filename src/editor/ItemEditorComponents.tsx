import React, { useState, useMemo } from 'react';
import { formatAnimationLabel } from '../core/animations.js';
import type { ItemData, SkillDamage, SkillEffect } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  IconPickerModal,
  SkillEffectModal,
  formatEffectType,
  formatEffectContent,
  DEFAULT_ELEMENTS,
  SCOPE_OPTIONS,
  OCCASION_OPTIONS,
  HIT_TYPE_OPTIONS,
  DAMAGE_TYPE_OPTIONS
} from './SkillEditorComponents.js';

export const ITEM_TYPE_OPTIONS = [
  { value: 1, label: 'Regular Item' },
  { value: 2, label: 'Key Item' },
  { value: 3, label: 'Hidden Item A' },
  { value: 4, label: 'Hidden Item B' }
];

export function ItemDetailForm({
  item,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  item: ItemData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [effectModalIndex, setEffectModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconUrl = assetUrlMap['assets/system/IconSet.png'];
  const iconIndex = Number(item.iconIndex ?? 176);

  const elements = useMemo(() => {
    return bundle.game.types?.elements || DEFAULT_ELEMENTS;
  }, [bundle.game.types?.elements]);

  // MZ Damage Object
  const damage: SkillDamage = useMemo(() => {
    if (item.damage && typeof item.damage === 'object') return item.damage;
    // synthesize from legacy fields
    let initialType = 0; // None
    if (item.kind === 'heal') initialType = 3; // HP Recover
    return {
      type: initialType,
      elementId: 0, // None
      formula: item.healHp ? String(item.healHp) : '0',
      variance: 20,
      critical: false
    };
  }, [item.damage, item.kind, item.healHp]);

  // Effects Array
  const effects: SkillEffect[] = useMemo(() => {
    if (Array.isArray(item.effects)) return item.effects;
    // synthesize from healHp or reviveHpRatio
    const list: SkillEffect[] = [];
    if (item.kind === 'heal' && item.healHp) {
      list.push({
        code: 11,
        dataId: 0,
        value1: 0,
        value2: item.healHp
      });
    } else if (item.kind === 'revive') {
      list.push({
        code: 11,
        dataId: 0,
        value1: item.reviveHpRatio ?? 0.25,
        value2: 0
      });
    }
    return list;
  }, [item.effects, item.kind, item.healHp, item.reviveHpRatio]);

  // Scope conversion
  const scopeVal = typeof item.scope === 'number'
    ? item.scope
    : (item.scope === '1-ally' ? 7 : item.scope === 'all-allies' ? 8 : item.scope === 'dead-ally' ? 9 : item.scope === 'user' ? 11 : item.scope === '1-enemy' ? 1 : 7);

  const handleScopeChange = (val: number) => {
    const patch: Record<string, unknown> = { scope: val };
    if (val >= 1 && val <= 6) {
      patch.scope = val === 2 ? 'all-enemies' : '1-enemy';
    } else if (val >= 7 && val <= 11) {
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

  // Occasion conversion
  const occasionVal = typeof item.occasion === 'number'
    ? item.occasion
    : (item.occasion === 'battle' ? 1 : item.occasion === 'menu' ? 2 : item.occasion === 'never' ? 3 : 0);

  const handleOccasionChange = (val: number) => {
    const str = val === 1 ? 'battle' : val === 2 ? 'menu' : val === 3 ? 'never' : 'always';
    onUpdate({ occasion: str });
  };

  // Item Type conversion
  const itypeVal = item.itypeId ?? (item.kind === 'key' ? 2 : 1);

  const handleItemTypeChange = (val: number) => {
    const patch: Record<string, unknown> = { itypeId: val };
    if (val === 2) {
      patch.kind = 'key';
      patch.consumable = false;
    } else if (val === 1 && item.kind === 'key') {
      patch.kind = 'heal';
    }
    onUpdate(patch);
  };

  // Damage Update
  const updateDamage = (patch: Partial<SkillDamage>) => {
    const nextDamage = { ...damage, ...patch };
    const rootPatch: Record<string, unknown> = { damage: nextDamage };

    if (patch.type !== undefined) {
      if (patch.type === 3 || patch.type === 4) {
        rootPatch.kind = 'heal';
      }
    }
    onUpdate(rootPatch);
  };

  // Effect Handlers
  const handleConfirmEffect = (effect: SkillEffect) => {
    let nextEffects: SkillEffect[];
    if (effectModalIndex === 'new') {
      nextEffects = [...effects, effect];
    } else if (typeof effectModalIndex === 'number') {
      nextEffects = [...effects];
      nextEffects[effectModalIndex] = effect;
    } else {
      return;
    }

    const patch: Record<string, unknown> = { effects: nextEffects };
    // Synchronize healHp if adding HP recovery effect
    if (effect.code === 11 && effect.value2 > 0) {
      patch.healHp = effect.value2;
      patch.kind = 'heal';
    }
    onUpdate(patch);
    setEffectModalIndex(null);
  };

  const handleDeleteEffect = (index: number) => {
    onUpdate({ effects: effects.filter((_, i) => i !== index) });
  };

  return (
    <div className="mz-item-editor-root">
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Invocation                        */}
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
                  value={item.name ?? ''}
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
                rows={3}
                value={item.description ?? ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Description of the item..."
              />
            </label>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span className="mz-field-label">Item Type:</span>
                <select
                  className="mz-select"
                  value={itypeVal}
                  onChange={(e) => handleItemTypeChange(Number(e.target.value))}
                >
                  {ITEM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ width: 90 }}>
                <span className="mz-field-label">Price:</span>
                <input
                  type="number"
                  min={0}
                  className="mz-input"
                  value={item.price ?? 0}
                  onChange={(e) => onUpdate({ price: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ width: 95 }}>
                <span className="mz-field-label">Consumable:</span>
                <select
                  className="mz-select"
                  value={item.consumable ?? true ? 'yes' : 'no'}
                  onChange={(e) => onUpdate({ consumable: e.target.value === 'yes' })}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
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
                  value={item.speed ?? 0}
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
                    value={item.successRate ?? 100}
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
                  value={item.repeats ?? 1}
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
                  value={item.tpGain ?? 0}
                  onChange={(e) => onUpdate({ tpGain: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Hit Type:</span>
                <select
                  className="mz-select"
                  value={item.hitType ?? 0}
                  onChange={(e) => onUpdate({ hitType: Number(e.target.value) })}
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
                  value={String(item.animationId ?? 0)}
                  onChange={(e) => {
                    const v = e.target.value;
                    onUpdate({ animationId: v === '0' ? 0 : v });
                  }}
                >
                  <option value="0">None</option>
                  {(bundle.game.animations ?? []).map((anim, idx) => (
                    <option key={anim.id} value={anim.id}>
                      {formatAnimationLabel(anim, idx)}
                    </option>
                  ))}
                  {item.animationId !== undefined &&
                    String(item.animationId) !== '0' &&
                    !(bundle.game.animations ?? []).some((a) => a.id === String(item.animationId)) && (
                      <option value={String(item.animationId)}>{String(item.animationId)}</option>
                    )}
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
                  disabled={damage.type === 0}
                  value={damage.elementId ?? 0}
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
                disabled={damage.type === 0}
                className="mz-input"
                value={damage.formula ?? '0'}
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
                    disabled={damage.type === 0}
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
                  disabled={damage.type === 0}
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
              value={item.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Developer notes or plugin tags..."
            />
          </fieldset>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BOTTOM ACCORDION: NUSV Engine Item Parameters & Restorations        */}
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
          <span>{showAdvanced ? '▼' : '►'} Advanced / NUSV Core Item Parameters & Restorations</span>
          <span className="mz-advanced-hint" style={{ fontSize: 11, color: '#64748b', fontWeight: 'normal' }}>
            Klik untuk melihat konfigurasi ID, Tipe Item (Kind), Pemulihan HP, & Rasio Kebangkitan
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
                <span className="mz-field-label">ID Item:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={item.id}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Tipe Item (NUSV Kind):</span>
                <select
                  className="mz-select"
                  value={item.kind || 'heal'}
                  onChange={(e) => onUpdate({ kind: e.target.value })}
                >
                  <option value="heal">Heal (Pemulihan HP/MP)</option>
                  <option value="revive">Revive (Kebangkitan)</option>
                  <option value="buff">Buff (Penguat Status)</option>
                  <option value="stat-reset">Stat Reset (Pengatur Ulang)</option>
                  <option value="key">Key Item (Benda Penting)</option>
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Pemulihan HP (Flat / healHp):</span>
                <input
                  type="number"
                  min={0}
                  className="mz-input"
                  value={item.healHp ?? 0}
                  onChange={(e) => onUpdate({ healHp: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Rasio Kebangkitan (reviveHpRatio):</span>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  className="mz-input"
                  value={item.reviveHpRatio ?? 0}
                  onChange={(e) => onUpdate({ reviveHpRatio: Number(e.target.value) })}
                />
              </label>
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
