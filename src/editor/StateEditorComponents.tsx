import React, { useState, useMemo } from 'react';
import type { StateData, TraitData } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  ActorTraitModal,
  formatTraitType,
  formatTraitContent
} from './ActorEditorComponents.js';
import { IconPickerModal } from './SkillEditorComponents.js';

export const RESTRICTION_OPTIONS = [
  { value: 0, strVal: 'none', label: 'None' },
  { value: 1, strVal: 'attackEnemy', label: 'Attack an enemy' },
  { value: 2, strVal: 'attackAnyone', label: 'Attack anyone' },
  { value: 3, strVal: 'attackAlly', label: 'Attack an ally' },
  { value: 4, strVal: 'cannotMove', label: 'Cannot move' }
];

export const SV_MOTION_OPTIONS = [
  { value: 0, label: 'Normal' },
  { value: 1, label: 'Abnormal' },
  { value: 2, label: 'Sleep' },
  { value: 3, label: 'Dead' }
];

export const SV_OVERLAY_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Poison' },
  { value: 2, label: 'Blind' },
  { value: 3, label: 'Silence' },
  { value: 4, label: 'Rage' },
  { value: 5, label: 'Confusion' },
  { value: 6, label: 'Charm' },
  { value: 7, label: 'Sleep' },
  { value: 8, label: 'Paralysis' },
  { value: 9, label: 'Stun' }
];

export const AUTO_REMOVAL_TIMING_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Action End' },
  { value: 2, label: 'Turn End' }
];

// ============================================================================
// Main Form: State Detail Form (Matches RPG Maker MZ Layout)
// ============================================================================
export function StateDetailForm({
  state,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  state: StateData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconUrl = assetUrlMap['assets/system/IconSet.png'];
  const iconIndex = Number(state.iconIndex ?? 0);

  const traits: TraitData[] = state.traits || [];

  // Restriction conversion
  const restrictionVal = useMemo(() => {
    if (typeof state.restriction === 'number') return state.restriction;
    const found = RESTRICTION_OPTIONS.find((r) => r.strVal === state.restriction);
    return found ? found.value : 0;
  }, [state.restriction]);

  const handleRestrictionChange = (val: number) => {
    const opt = RESTRICTION_OPTIONS.find((r) => r.value === val) || RESTRICTION_OPTIONS[0];
    onUpdate({
      restriction: opt.value,
      // If Cannot move (4), auto-sync preventsAction
      preventsAction: opt.value === 4
    });
  };

  // Trait Handlers
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

  const handleDeleteTrait = (index: number) => {
    onUpdate({ traits: traits.filter((_, i) => i !== index) });
  };

  // Duration in turns sync
  const minTurns = state.minTurns ?? state.duration ?? 1;
  const maxTurns = state.maxTurns ?? state.duration ?? 1;

  const handleTurnsChange = (key: 'minTurns' | 'maxTurns', val: number) => {
    const nextVal = Math.max(1, val);
    const patch: Record<string, unknown> = { [key]: nextVal };
    // Keep duration synchronized with maxTurns / minTurns
    if (key === 'maxTurns') patch.duration = nextVal;
    else if (!state.maxTurns || state.maxTurns < nextVal) {
      patch.maxTurns = nextVal;
      patch.duration = nextVal;
    }
    onUpdate(patch);
  };

  return (
    <div className="mz-detail-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 2-Column Main Layout matching RPG Maker MZ */}
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Removal Conditions, Messages        */}
        {/* ================================================================= */}
        <div className="mz-actor-col">
          {/* 1. General Settings */}
          <fieldset className="mz-groupbox">
            <legend>General Settings</legend>

            {/* Name & Icon */}
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 2 }}>
                <span>Name:</span>
                <input
                  type="text"
                  value={state.name || ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                />
              </label>

              <div className="mz-field-item" style={{ flex: 1 }}>
                <span>Icon:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    value={iconIndex}
                    onChange={(e) => onUpdate({ iconIndex: Number(e.target.value) })}
                    style={{ width: 60 }}
                  />
                  <div
                    className="mz-icon-preview-box"
                    onClick={() => setIconModalOpen(true)}
                    style={{ cursor: 'pointer', border: '1px solid #94a3b8', borderRadius: 4, width: 34, height: 34 }}
                    title="Click to select icon"
                  >
                    {iconUrl ? (
                      <div
                        className="mz-icon-crop"
                        style={{
                          backgroundImage: `url("${iconUrl}")`,
                          backgroundPosition: `-${(iconIndex % 16) * 32}px -${Math.floor(iconIndex / 16) * 32}px`
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 11 }}>{iconIndex}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Restriction & Priority */}
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 2 }}>
                <span>Restriction:</span>
                <select
                  value={restrictionVal}
                  onChange={(e) => handleRestrictionChange(Number(e.target.value))}
                >
                  {RESTRICTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span>Priority:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={state.priority ?? 50}
                  onChange={(e) => onUpdate({ priority: Math.max(0, Math.min(100, Number(e.target.value))) })}
                />
              </label>
            </div>

            {/* SV Motion & SV Overlay */}
            <div className="mz-field-row">
              <label className="mz-field-item">
                <span>[SV] Motion:</span>
                <select
                  value={Number(state.motion ?? 0)}
                  onChange={(e) => onUpdate({ motion: Number(e.target.value) })}
                >
                  {SV_MOTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item">
                <span>[SV] Overlay:</span>
                <select
                  value={Number(state.overlay ?? 0)}
                  onChange={(e) => onUpdate({ overlay: Number(e.target.value) })}
                >
                  {SV_OVERLAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {/* 2. Removal Conditions */}
          <fieldset className="mz-groupbox">
            <legend>Removal Conditions</legend>

            {/* Checkboxes: Remove at Battle End & Remove by Restriction */}
            <div className="mz-field-row" style={{ gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(state.removeAtBattleEnd)}
                  onChange={(e) => onUpdate({ removeAtBattleEnd: e.target.checked })}
                />
                <span>Remove at Battle End</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(state.removeByRestriction)}
                  onChange={(e) => onUpdate({ removeByRestriction: e.target.checked })}
                />
                <span>Remove by Restriction</span>
              </label>
            </div>

            {/* Auto-removal Timing & Duration in Turns */}
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span>Auto-removal Timing:</span>
                <select
                  value={Number(state.autoRemovalTiming ?? 0)}
                  onChange={(e) => onUpdate({ autoRemovalTiming: Number(e.target.value) })}
                >
                  {AUTO_REMOVAL_TIMING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mz-field-item" style={{ flex: 1.5 }}>
                <span>Duration in Turns:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={1}
                    value={minTurns}
                    onChange={(e) => handleTurnsChange('minTurns', Number(e.target.value))}
                    style={{ width: 60 }}
                  />
                  <span>~</span>
                  <input
                    type="number"
                    min={1}
                    value={maxTurns}
                    onChange={(e) => handleTurnsChange('maxTurns', Number(e.target.value))}
                    style={{ width: 60 }}
                  />
                </div>
              </div>
            </div>

            {/* Remove by Damage */}
            <div className="mz-field-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={Boolean(state.removeByDamage)}
                  onChange={(e) => onUpdate({ removeByDamage: e.target.checked })}
                />
                <span>Remove by Damage</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={!state.removeByDamage}
                  value={state.chanceByDamage ?? 100}
                  onChange={(e) => onUpdate({ chanceByDamage: Number(e.target.value) })}
                  style={{ width: 60 }}
                />
                <span style={{ fontSize: 12 }}>%</span>
              </div>
            </div>

            {/* Remove by Walking */}
            <div className="mz-field-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={Boolean(state.removeByWalking)}
                  onChange={(e) => onUpdate({ removeByWalking: e.target.checked })}
                />
                <span>Remove by Walking</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  min={1}
                  disabled={!state.removeByWalking}
                  value={state.stepsToRemove ?? 100}
                  onChange={(e) => onUpdate({ stepsToRemove: Number(e.target.value) })}
                  style={{ width: 60 }}
                />
                <span style={{ fontSize: 12 }}>steps</span>
              </div>
            </div>
          </fieldset>

          {/* 3. Messages */}
          <fieldset className="mz-groupbox">
            <legend>Messages</legend>

            <label className="mz-field-item">
              <span>If an actor is inflicted with the state:</span>
              <input
                type="text"
                value={state.message1 || ''}
                onChange={(e) => onUpdate({ message1: e.target.value })}
                placeholder="%1 has fallen!"
              />
            </label>

            <label className="mz-field-item">
              <span>If an enemy is inflicted with the state:</span>
              <input
                type="text"
                value={state.message2 || ''}
                onChange={(e) => onUpdate({ message2: e.target.value })}
                placeholder="%1 is slain!"
              />
            </label>

            <label className="mz-field-item">
              <span>If the state persists:</span>
              <input
                type="text"
                value={state.message3 || ''}
                onChange={(e) => onUpdate({ message3: e.target.value })}
              />
            </label>

            <label className="mz-field-item">
              <span>If the state is removed:</span>
              <input
                type="text"
                value={state.message4 || ''}
                onChange={(e) => onUpdate({ message4: e.target.value })}
                placeholder="%1 revives!"
              />
            </label>
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Traits, Note                                         */}
        {/* ================================================================= */}
        <div className="mz-actor-col">
          {/* 4. Traits */}
          <fieldset className="mz-groupbox">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <legend style={{ margin: 0 }}>Traits</legend>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setTraitModalIndex('new')}
              >
                ＋ Tambah Trait...
              </button>
            </div>

            <div
              className="mz-traits-table-container"
              style={{
                height: 260,
                maxHeight: 320,
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
                              handleDeleteTrait(idx);
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
          </fieldset>

          {/* 5. Note */}
          <fieldset className="mz-groupbox" style={{ flex: 1 }}>
            <legend>Note</legend>
            <textarea
              value={state.note || ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Developer notes for this state..."
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
      {/* 3. BOTTOM ACCORDION: NUSV ENGINE ADVANCED FIELDS                   */}
      {/* ================================================================= */}
      <div
        className="mz-advanced-accordion"
        style={{ border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc' }}
      >
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
          <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mz-field-row">
              <label className="mz-field-item">
                <span>Technical ID:</span>
                <input
                  type="text"
                  value={state.id || ''}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item">
                <span>Durasi Standar (Turns):</span>
                <input
                  type="number"
                  min={1}
                  value={state.duration || 1}
                  onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item">
                <span>Damage per Turn (DoT):</span>
                <input
                  type="number"
                  min={0}
                  value={state.damagePerTurn ?? 0}
                  onChange={(e) => onUpdate({ damagePerTurn: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item">
                <span>PDR (Fisik Rate):</span>
                <input
                  type="number"
                  step="0.05"
                  value={state.pdr ?? 1.0}
                  onChange={(e) => onUpdate({ pdr: Number(e.target.value) })}
                />
              </label>

              <label className="mz-field-item">
                <span>MDR (Sihir Rate):</span>
                <input
                  type="number"
                  step="0.05"
                  value={state.mdr ?? 1.0}
                  onChange={(e) => onUpdate({ mdr: Number(e.target.value) })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginTop: 18 }}>
                <input
                  type="checkbox"
                  checked={Boolean(state.preventsAction)}
                  onChange={(e) => onUpdate({ preventsAction: e.target.checked })}
                />
                <span>Mencegah Aksi Karakter (Stun / Sleep)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}
      {iconModalOpen && (
        <IconPickerModal
          initialIndex={iconIndex}
          iconUrl={iconUrl}
          onConfirm={(idx) => onUpdate({ iconIndex: idx })}
          onClose={() => setIconModalOpen(false)}
        />
      )}

      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={typeof traitModalIndex === 'number' ? traits[traitModalIndex] : null}
          bundle={bundle}
          onConfirm={handleConfirmTrait}
          onDelete={typeof traitModalIndex === 'number' ? () => handleDeleteTrait(traitModalIndex) : undefined}
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}
