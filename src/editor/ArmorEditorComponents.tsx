import React, { useState, useMemo } from 'react';
import type { EquipmentData, BaseStats, CombatBonuses, TraitData } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  ActorTraitModal,
  formatTraitType,
  formatTraitContent
} from './ActorEditorComponents.js';
import { IconPickerModal } from './SkillEditorComponents.js';
import { DEFAULT_ARMOR_TYPES } from './TypesEditorComponents.js';

export { DEFAULT_ARMOR_TYPES };

export const ARMOR_EQUIPMENT_TYPES: Array<{ value: number; label: string; slot: 'shield' | 'head' | 'body' | 'accessory' }> = [
  { value: 2, label: 'Shield', slot: 'shield' },
  { value: 3, label: 'Head', slot: 'head' },
  { value: 4, label: 'Body', slot: 'body' },
  { value: 5, label: 'Accessory', slot: 'accessory' }
];

export function ArmorDetailForm({
  armor,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  armor: EquipmentData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconUrl = assetUrlMap['assets/system/IconSet.png'];
  const iconIndex = Number(armor.iconIndex ?? 135);

  const armorTypes = useMemo(() => {
    return bundle.game.types?.armorTypes || DEFAULT_ARMOR_TYPES;
  }, [bundle.game.types?.armorTypes]);

  const bonuses: CombatBonuses = armor.bonuses || {};
  const stats: Partial<BaseStats> = armor.stats || {};
  const traits: TraitData[] = armor.traits || [];

  // RPG Maker MZ standard 8 parameter changes: [mhp, mmp, atk, def, mat, mdf, agi, luk]
  const params: number[] = useMemo(() => {
    if (Array.isArray(armor.params) && armor.params.length === 8) {
      return armor.params;
    }
    return [
      bonuses.hp ?? 0,
      bonuses.mp ?? 0,
      bonuses.atk ?? 0,
      bonuses.def ?? 0,
      bonuses.mat ?? 0,
      bonuses.mdf ?? 0,
      bonuses.agi ?? 0,
      stats.luk ?? 0
    ];
  }, [armor.params, bonuses, stats]);

  // Handle parameter changes
  const updateParam = (paramIndex: number, val: number) => {
    const nextParams = [...params];
    nextParams[paramIndex] = val;

    const nextBonuses: CombatBonuses = { ...bonuses };
    const nextStats: Partial<BaseStats> = { ...stats };

    switch (paramIndex) {
      case 0: nextBonuses.hp = val; break;
      case 1: nextBonuses.mp = val; break;
      case 2: nextBonuses.atk = val; break;
      case 3: nextBonuses.def = val; break;
      case 4: nextBonuses.mat = val; break;
      case 5: nextBonuses.mdf = val; break;
      case 6: nextBonuses.agi = val; break;
      case 7: nextStats.luk = val; break;
    }

    onUpdate({
      params: nextParams,
      bonuses: nextBonuses,
      stats: nextStats
    });
  };

  // Armor Type conversion (atypeId)
  const atypeVal = armor.atypeId ?? 1;

  // Equipment Type conversion (etypeId: 2=Shield, 3=Head, 4=Body, 5=Accessory)
  const etypeVal = useMemo(() => {
    if (armor.etypeId && armor.etypeId >= 2 && armor.etypeId <= 5) return armor.etypeId;
    if (armor.slot === 'shield') return 2;
    if (armor.slot === 'head') return 3;
    if (armor.slot === 'accessory') return 5;
    return 4; // default body
  }, [armor.etypeId, armor.slot]);

  const handleEquipmentTypeChange = (val: number) => {
    const target = ARMOR_EQUIPMENT_TYPES.find((t) => t.value === val);
    const slot = target?.slot || 'body';
    onUpdate({
      etypeId: val,
      slot
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

  return (
    <div className="mz-armor-editor-root">
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Parameter Changes                  */}
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
                  value={armor.name ?? ''}
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
                      <span style={{ fontSize: 14 }}>🛡️</span>
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
                value={armor.description ?? ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Description of the armor..."
              />
            </label>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span className="mz-field-label">Armor Type:</span>
                <select
                  className="mz-select"
                  value={atypeVal}
                  onChange={(e) => onUpdate({ atypeId: Number(e.target.value) })}
                >
                  {armorTypes.map((at, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {at}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mz-field-item" style={{ width: 100 }}>
                <span className="mz-field-label">Price:</span>
                <input
                  type="number"
                  min={0}
                  className="mz-input"
                  value={armor.price ?? 0}
                  onChange={(e) => onUpdate({ price: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Equipment Type:</span>
                <select
                  className="mz-select"
                  value={etypeVal}
                  onChange={(e) => handleEquipmentTypeChange(Number(e.target.value))}
                >
                  {ARMOR_EQUIPMENT_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {/* 2. Parameter Changes (2 Rows x 4 Cols matching Image 1) */}
          <fieldset className="mz-groupbox">
            <legend>Parameter Changes</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Row 1: Attack, Defense, M.Attack, M.Defense */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <label className="mz-field-item">
                  <span className="mz-field-label">Attack:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[2]}
                    onChange={(e) => updateParam(2, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">Defense:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[3]}
                    onChange={(e) => updateParam(3, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">M.Attack:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[4]}
                    onChange={(e) => updateParam(4, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">M.Defense:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[5]}
                    onChange={(e) => updateParam(5, Number(e.target.value))}
                  />
                </label>
              </div>

              {/* Row 2: Agility, Luck, Max HP, Max MP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <label className="mz-field-item">
                  <span className="mz-field-label">Agility:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[6]}
                    onChange={(e) => updateParam(6, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">Luck:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[7]}
                    onChange={(e) => updateParam(7, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">Max HP:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[0]}
                    onChange={(e) => updateParam(0, Number(e.target.value))}
                  />
                </label>
                <label className="mz-field-item">
                  <span className="mz-field-label">Max MP:</span>
                  <input
                    type="number"
                    className="mz-input"
                    value={params[1]}
                    onChange={(e) => updateParam(1, Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Traits, Note                                        */}
        {/* ================================================================= */}
        <div className="mz-actor-col" style={{ flex: 1 }}>
          {/* 1. Traits */}
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
              className="mz-table-container"
              style={{
                minHeight: 160,
                maxHeight: 220,
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
                  {traits.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                        Tidak ada traits. Klik ＋ Tambah Trait...
                      </td>
                    </tr>
                  ) : (
                    traits.map((tr, idx) => (
                      <tr
                        key={idx}
                        className="mz-tr-hover"
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onDoubleClick={() => setTraitModalIndex(idx)}
                      >
                        <td style={{ padding: '4px 8px', fontWeight: 600, color: '#334155' }}>
                          {formatTraitType(tr)}
                        </td>
                        <td style={{ padding: '4px 8px', color: '#475569' }}>
                          {formatTraitContent(tr, bundle.game)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>
                          <button
                            type="button"
                            className="mz-btn-small danger"
                            style={{ padding: '0 4px', fontSize: 10, height: 18 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrait(idx);
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

          {/* 2. Note */}
          <fieldset className="mz-groupbox">
            <legend>Note</legend>
            <textarea
              className="mz-textarea"
              rows={5}
              value={armor.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Developer notes or plugin metadata..."
            />
          </fieldset>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BOTTOM ACCORDION: NUSV Engine Combat Parameters & Growth            */}
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
            Klik untuk melihat konfigurasi ID, Slot Equipment, Bonus Base Stats, & Combat Bonuses
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
                <span className="mz-field-label">ID Pelindung:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={armor.id}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Slot Equipment (NUSV):</span>
                <select
                  className="mz-select"
                  value={armor.slot}
                  onChange={(e) => onUpdate({ slot: e.target.value })}
                >
                  <option value="shield">Perisai (Shield)</option>
                  <option value="head">Kepala (Head)</option>
                  <option value="body">Tubuh (Body)</option>
                  <option value="accessory">Aksesoris (Accessory)</option>
                </select>
              </label>
            </div>

            {/* Bonus Base Stats */}
            <div>
              <span className="mz-field-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Bonus Base Stats:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as Array<keyof BaseStats>).map((st) => (
                  <label key={st} className="mz-field-item">
                    <span className="mz-field-label">+{st.toUpperCase()}</span>
                    <input
                      type="number"
                      className="mz-input"
                      value={stats[st] ?? 0}
                      onChange={(e) =>
                        onUpdate({
                          stats: { ...stats, [st]: Number(e.target.value) }
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Extra Defense Combat Bonuses */}
            <div>
              <span className="mz-field-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Extra Combat Bonuses (+SP, +EVA, +CEV, +GUARD, dll.):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {(['sp', 'eva', 'cev', 'guard', 'hpRegen', 'mpRegen'] as Array<keyof CombatBonuses>).map((bn) => (
                  <label key={bn} className="mz-field-item">
                    <span className="mz-field-label">+{bn.toUpperCase()}</span>
                    <input
                      type="number"
                      step={bn === 'eva' || bn === 'cev' || bn === 'hpRegen' || bn === 'mpRegen' ? '0.01' : '1'}
                      className="mz-input"
                      value={bonuses[bn] ?? 0}
                      onChange={(e) =>
                        onUpdate({
                          bonuses: { ...bonuses, [bn]: Number(e.target.value) }
                        })
                      }
                    />
                  </label>
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

      {/* MODAL: TRAIT EDITOR */}
      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={traitModalIndex === 'new' ? null : traits[traitModalIndex]}
          bundle={bundle}
          onConfirm={handleConfirmTrait}
          onDelete={typeof traitModalIndex === 'number' ? () => handleDeleteTrait(traitModalIndex) : undefined}
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}
