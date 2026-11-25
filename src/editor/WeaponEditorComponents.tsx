import React, { useState, useMemo } from 'react';
import { formatAnimationLabel } from '../core/animations.js';
import type { EquipmentData, BaseStats, CombatBonuses, TraitData } from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';
import {
  ActorTraitModal,
  formatTraitType,
  formatTraitContent
} from './ActorEditorComponents.js';
import {
  IconPickerModal,
  DEFAULT_WEAPON_TYPES
} from './SkillEditorComponents.js';

export function WeaponDetailForm({
  weapon,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  weapon: EquipmentData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const iconUrl = assetUrlMap['assets/system/IconSet.png'];
  const iconIndex = Number(weapon.iconIndex ?? 96);

  const weaponTypes = useMemo(() => {
    return bundle.game.types?.weaponTypes || DEFAULT_WEAPON_TYPES;
  }, [bundle.game.types?.weaponTypes]);

  const bonuses: CombatBonuses = weapon.bonuses || {};
  const stats: Partial<BaseStats> = weapon.stats || {};
  const traits: TraitData[] = weapon.traits || [];

  // RPG Maker MZ standard 8 parameter changes: [mhp, mmp, atk, def, mat, mdf, agi, luk]
  const params: number[] = useMemo(() => {
    if (Array.isArray(weapon.params) && weapon.params.length === 8) {
      return weapon.params;
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
  }, [weapon.params, bonuses, stats]);

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

  // Weapon Type conversion
  const wtypeVal = weapon.wtypeId ?? 1;

  const handleWeaponTypeChange = (val: number) => {
    const patch: Record<string, unknown> = { wtypeId: val };
    // Synchronize legacy weaponType if applicable
    const typeName = (weaponTypes[val - 1] || '').toLowerCase();
    if (typeName.includes('bow') || typeName.includes('gun') || typeName.includes('crossbow')) {
      patch.weaponType = 'ranged';
    } else if (typeName.includes('dagger') || typeName.includes('cane') || typeName.includes('finesse')) {
      patch.weaponType = 'finesse';
    } else {
      patch.weaponType = 'melee';
    }
    onUpdate(patch);
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
    <div className="mz-weapon-editor-root">
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
                  value={weapon.name ?? ''}
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
                      <span style={{ fontSize: 14 }}>⚔️</span>
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
                value={weapon.description ?? ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Description of the weapon..."
              />
            </label>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.2 }}>
                <span className="mz-field-label">Weapon Type:</span>
                <select
                  className="mz-select"
                  value={wtypeVal}
                  onChange={(e) => handleWeaponTypeChange(Number(e.target.value))}
                >
                  {weaponTypes.map((wt, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {wt}
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
                  value={weapon.price ?? 0}
                  onChange={(e) => onUpdate({ price: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Animation:</span>
                <select
                  className="mz-select"
                  value={String(weapon.animationId ?? bundle.game.animations?.[0]?.id ?? 0)}
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
                  {weapon.animationId !== undefined &&
                    String(weapon.animationId) !== '0' &&
                    !(bundle.game.animations ?? []).some((a) => a.id === String(weapon.animationId)) && (
                      <option value={String(weapon.animationId)}>{String(weapon.animationId)}</option>
                    )}
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
              value={weapon.note ?? ''}
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
            Klik untuk melihat konfigurasi ID, Weapon Type (NUSV Kind), Bonus Base Stats, & Combat Bonuses
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
                <span className="mz-field-label">ID Senjata:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={weapon.id}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Tipe Senjata (NUSV):</span>
                <select
                  className="mz-select"
                  value={weapon.weaponType || 'melee'}
                  onChange={(e) => onUpdate({ weaponType: e.target.value })}
                >
                  <option value="melee">Melee (Fisik Jarak Dekat)</option>
                  <option value="finesse">Finesse (Cepat / Presisi)</option>
                  <option value="ranged">Ranged (Jarak Jauh)</option>
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

            {/* Extra Combat Bonuses */}
            <div>
              <span className="mz-field-label" style={{ marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Extra Combat Bonuses (+SP, +HIT, +CRI, +CEV, dll.):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {(['sp', 'hit', 'cri', 'eva', 'cev', 'guard'] as Array<keyof CombatBonuses>).map((bn) => (
                  <label key={bn} className="mz-field-item">
                    <span className="mz-field-label">+{bn.toUpperCase()}</span>
                    <input
                      type="number"
                      step={bn === 'hit' || bn === 'cri' || bn === 'eva' || bn === 'cev' ? '0.01' : '1'}
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
