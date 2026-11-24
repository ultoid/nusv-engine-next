import React, { useState, useMemo } from 'react';
import type { ProjectBundle, GameData, TypesData } from '../core/types.js';

export const DEFAULT_ELEMENTS = [
  'Physical',
  'Fire',
  'Ice',
  'Thunder',
  'Water',
  'Earth',
  'Wind',
  'Light',
  'Darkness'
];

export const DEFAULT_SKILL_TYPES = [
  'Magic',
  'Special'
];

export const DEFAULT_WEAPON_TYPES = [
  'Dagger',
  'Sword',
  'Flail',
  'Axe',
  'Whip',
  'Staff',
  'Bow',
  'Crossbow',
  'Gun',
  'Claw',
  'Glove',
  'Spear'
];

export const DEFAULT_ARMOR_TYPES = [
  'General Armor',
  'Magic Armor',
  'Light Armor',
  'Heavy Armor',
  'Small Shield',
  'Large Shield'
];

export const DEFAULT_EQUIPMENT_TYPES = [
  'Weapon',
  'Shield',
  'Head',
  'Body',
  'Accessory'
];

// ------------------------------------------------------------------------------------------------
// Change Maximum Modal (1 - 99)
// ------------------------------------------------------------------------------------------------

interface ChangeMaximumModalProps {
  title: string;
  initialValue: number;
  onSave: (newMax: number) => void;
  onClose: () => void;
}

export function ChangeMaximumModal({
  title,
  initialValue,
  onSave,
  onClose
}: ChangeMaximumModalProps) {
  const [value, setValue] = useState<number>(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clamped = Math.max(1, Math.min(99, value));
    onSave(clamped);
    onClose();
  };

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 340 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>{title}</span>
          <button type="button" className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mv-modal-body" style={{ padding: 16 }}>
            <label className="mz-form-field">
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                Maximum (1 - 99):
              </span>
              <input
                type="number"
                min={1}
                max={99}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                autoFocus
                style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
              />
            </label>
          </div>
          <div className="mv-modal-footer">
            <button type="submit" className="primary">OK</button>
            <button type="button" onClick={onClose}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Single Type Column Component (Elements, Skill Types, Weapon Types, Armor Types, Equipment Types)
// ------------------------------------------------------------------------------------------------

interface TypeColumnProps {
  title: string;
  items: string[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  onUpdateName: (idx: number, newName: string) => void;
  onChangeMaximum: () => void;
}

function TypeColumn({
  title,
  items,
  selectedIndex,
  onSelectIndex,
  onUpdateName,
  onChangeMaximum
}: TypeColumnProps) {
  const selectedName = items[selectedIndex] ?? '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #7c8e9f',
        borderRadius: 4,
        background: '#e8ecf2',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 11,
          padding: '5px 8px',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          borderBottom: '1px solid #1d4ed8'
        }}
      >
        {title}
      </div>

      {/* Scrollable Item List */}
      <div
        style={{
          flex: 1,
          minHeight: 320,
          maxHeight: 380,
          overflowY: 'auto',
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const isEven = idx % 2 === 0;

          return (
            <div
              key={idx}
              onClick={() => onSelectIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
                userSelect: 'none',
                background: isSelected ? '#0078d7' : isEven ? '#ffffff' : '#f8fafc',
                color: isSelected ? '#ffffff' : '#0f172a',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <span
                style={{
                  minWidth: 20,
                  fontWeight: 600,
                  color: isSelected ? '#ffffff' : '#64748b'
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item || '-----'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Controls: Edit Name Input & Change Maximum */}
      <div style={{ padding: 6, background: '#e8ecf2', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          type="text"
          value={selectedName}
          onChange={(e) => onUpdateName(selectedIndex, e.target.value)}
          placeholder={`Name for #${String(selectedIndex + 1).padStart(2, '0')}`}
          style={{
            width: '100%',
            padding: '4px 6px',
            fontSize: 11,
            border: '1px solid #94a3b8',
            borderRadius: 3,
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="button"
          onClick={onChangeMaximum}
          style={{
            width: '100%',
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 500,
            background: '#ffffff',
            border: '1px solid #94a3b8',
            borderRadius: 3,
            cursor: 'pointer',
            color: '#1e293b'
          }}
          className="mz-btn-hover"
        >
          Change Maximum...
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Main Types Editor (Matches media_1795528301887_2d87c08d.jpg)
// ------------------------------------------------------------------------------------------------

export function TypesEditor({
  bundle,
  onUpdateGame
}: {
  bundle: ProjectBundle;
  onUpdateGame: (patch: Partial<GameData>) => void;
}) {
  const types: TypesData = useMemo(() => bundle.game.types || {}, [bundle.game.types]);

  // Extract type lists with defaults
  const elements = useMemo(
    () => types.elements && types.elements.length > 0 ? types.elements : DEFAULT_ELEMENTS,
    [types.elements]
  );
  const skillTypes = useMemo(
    () => types.skillTypes && types.skillTypes.length > 0 ? types.skillTypes : DEFAULT_SKILL_TYPES,
    [types.skillTypes]
  );
  const weaponTypes = useMemo(
    () => types.weaponTypes && types.weaponTypes.length > 0 ? types.weaponTypes : DEFAULT_WEAPON_TYPES,
    [types.weaponTypes]
  );
  const armorTypes = useMemo(
    () => types.armorTypes && types.armorTypes.length > 0 ? types.armorTypes : DEFAULT_ARMOR_TYPES,
    [types.armorTypes]
  );
  const equipmentTypes = useMemo(
    () => types.equipmentTypes && types.equipmentTypes.length > 0 ? types.equipmentTypes : DEFAULT_EQUIPMENT_TYPES,
    [types.equipmentTypes]
  );

  // Per-column selection indices
  const [selectedElementIdx, setSelectedElementIdx] = useState(0);
  const [selectedSkillTypeIdx, setSelectedSkillTypeIdx] = useState(0);
  const [selectedWeaponTypeIdx, setSelectedWeaponTypeIdx] = useState(0);
  const [selectedArmorTypeIdx, setSelectedArmorTypeIdx] = useState(0);
  const [selectedEquipTypeIdx, setSelectedEquipTypeIdx] = useState(0);

  // Change Maximum modal state
  const [maxModal, setMaxModal] = useState<{
    open: boolean;
    category: 'elements' | 'skillTypes' | 'weaponTypes' | 'armorTypes' | 'equipmentTypes';
    title: string;
    currentMax: number;
  }>({
    open: false,
    category: 'elements',
    title: '',
    currentMax: 1
  });

  // Accordion for advanced non-MZ settings
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Update a single item's text name
  const handleUpdateName = (
    category: 'elements' | 'skillTypes' | 'weaponTypes' | 'armorTypes' | 'equipmentTypes',
    index: number,
    newName: string
  ) => {
    const currentList =
      category === 'elements' ? [...elements] :
      category === 'skillTypes' ? [...skillTypes] :
      category === 'weaponTypes' ? [...weaponTypes] :
      category === 'armorTypes' ? [...armorTypes] : [...equipmentTypes];

    currentList[index] = newName;
    const nextTypes: TypesData = { ...types, [category]: currentList };
    onUpdateGame({ types: nextTypes });
  };

  // Change maximum handler
  const handleChangeMax = (
    category: 'elements' | 'skillTypes' | 'weaponTypes' | 'armorTypes' | 'equipmentTypes',
    newMax: number
  ) => {
    const currentList =
      category === 'elements' ? [...elements] :
      category === 'skillTypes' ? [...skillTypes] :
      category === 'weaponTypes' ? [...weaponTypes] :
      category === 'armorTypes' ? [...armorTypes] : [...equipmentTypes];

    let nextList: string[];
    if (newMax > currentList.length) {
      nextList = [...currentList];
      while (nextList.length < newMax) {
        nextList.push('');
      }
    } else {
      nextList = currentList.slice(0, newMax);
    }

    const nextTypes: TypesData = { ...types, [category]: nextList };
    onUpdateGame({ types: nextTypes });

    // Clamp selected index
    if (category === 'elements') setSelectedElementIdx((prev) => Math.min(prev, newMax - 1));
    else if (category === 'skillTypes') setSelectedSkillTypeIdx((prev) => Math.min(prev, newMax - 1));
    else if (category === 'weaponTypes') setSelectedWeaponTypeIdx((prev) => Math.min(prev, newMax - 1));
    else if (category === 'armorTypes') setSelectedArmorTypeIdx((prev) => Math.min(prev, newMax - 1));
    else if (category === 'equipmentTypes') setSelectedEquipTypeIdx((prev) => Math.min(prev, newMax - 1));
  };

  return (
    <section className="mz-db-content mz-db-system-pane" style={{ padding: 12 }}>
      {/* 5-Column Grid matching RPG Maker MZ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {/* Column 1: Elements */}
        <TypeColumn
          title="Elements"
          items={elements}
          selectedIndex={Math.max(0, Math.min(selectedElementIdx, elements.length - 1))}
          onSelectIndex={setSelectedElementIdx}
          onUpdateName={(idx, name) => handleUpdateName('elements', idx, name)}
          onChangeMaximum={() =>
            setMaxModal({
              open: true,
              category: 'elements',
              title: 'Change Elements Maximum',
              currentMax: elements.length
            })
          }
        />

        {/* Column 2: Skill Types */}
        <TypeColumn
          title="Skill Types"
          items={skillTypes}
          selectedIndex={Math.max(0, Math.min(selectedSkillTypeIdx, skillTypes.length - 1))}
          onSelectIndex={setSelectedSkillTypeIdx}
          onUpdateName={(idx, name) => handleUpdateName('skillTypes', idx, name)}
          onChangeMaximum={() =>
            setMaxModal({
              open: true,
              category: 'skillTypes',
              title: 'Change Skill Types Maximum',
              currentMax: skillTypes.length
            })
          }
        />

        {/* Column 3: Weapon Types */}
        <TypeColumn
          title="Weapon Types"
          items={weaponTypes}
          selectedIndex={Math.max(0, Math.min(selectedWeaponTypeIdx, weaponTypes.length - 1))}
          onSelectIndex={setSelectedWeaponTypeIdx}
          onUpdateName={(idx, name) => handleUpdateName('weaponTypes', idx, name)}
          onChangeMaximum={() =>
            setMaxModal({
              open: true,
              category: 'weaponTypes',
              title: 'Change Weapon Types Maximum',
              currentMax: weaponTypes.length
            })
          }
        />

        {/* Column 4: Armor Types */}
        <TypeColumn
          title="Armor Types"
          items={armorTypes}
          selectedIndex={Math.max(0, Math.min(selectedArmorTypeIdx, armorTypes.length - 1))}
          onSelectIndex={setSelectedArmorTypeIdx}
          onUpdateName={(idx, name) => handleUpdateName('armorTypes', idx, name)}
          onChangeMaximum={() =>
            setMaxModal({
              open: true,
              category: 'armorTypes',
              title: 'Change Armor Types Maximum',
              currentMax: armorTypes.length
            })
          }
        />

        {/* Column 5: Equipment Types */}
        <TypeColumn
          title="Equipment Types"
          items={equipmentTypes}
          selectedIndex={Math.max(0, Math.min(selectedEquipTypeIdx, equipmentTypes.length - 1))}
          onSelectIndex={setSelectedEquipTypeIdx}
          onUpdateName={(idx, name) => handleUpdateName('equipmentTypes', idx, name)}
          onChangeMaximum={() =>
            setMaxModal({
              open: true,
              category: 'equipmentTypes',
              title: 'Change Equipment Types Maximum',
              currentMax: equipmentTypes.length
            })
          }
        />
      </div>

      {/* =========================================================================
          BOTTOM ACCORDION: Advanced / Non-MZ Types Settings
         ========================================================================= */}
      <div className="mz-advanced-accordion" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <span>⚙ Pengaturan Lanjutan (Advanced Types Settings)</span>
          <span>{advancedOpen ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {advancedOpen && (
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mz-form-field">
              <span>Dual Wield Slot Substitution:</span>
              <select defaultValue="slot2">
                <option value="slot2">Slot 2 (Shield becomes Weapon 2)</option>
                <option value="slot5">Slot 5 (Accessory becomes Weapon 2)</option>
                <option value="none">No Secondary Weapon Slot</option>
              </select>
            </label>
            <label className="mz-form-field">
              <span>Default Element Penetration Rule:</span>
              <select defaultValue="standard">
                <option value="standard">Standard RPG Maker MZ (Multiplicative Rate)</option>
                <option value="additive">Additive Resistance Subtraction</option>
                <option value="highest">Take Highest Affinity / Weakness</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Change Maximum Modal */}
      {maxModal.open && (
        <ChangeMaximumModal
          title={maxModal.title}
          initialValue={maxModal.currentMax}
          onSave={(newMax) => handleChangeMax(maxModal.category, newMax)}
          onClose={() => setMaxModal({ ...maxModal, open: false })}
        />
      )}
    </section>
  );
}
