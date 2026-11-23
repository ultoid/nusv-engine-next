import { useState, useMemo } from 'react';
import type {
  ActorData,
  BaseStats,
  CombatBase,
  EquipmentData,
  TraitData
} from '../core/combat-types.js';
import {
  TRAIT_ELEMENT_RATE,
  TRAIT_DEBUFF_RATE,
  TRAIT_STATE_RATE,
  TRAIT_STATE_RESIST,
  TRAIT_PARAM,
  TRAIT_XPARAM,
  TRAIT_SPARAM,
  TRAIT_ATTACK_ELEMENT,
  TRAIT_ATTACK_STATE,
  TRAIT_ATTACK_SPEED,
  TRAIT_ATTACK_TIMES,
  TRAIT_ATTACK_SKILL,
  TRAIT_STYPE_ADD,
  TRAIT_STYPE_SEAL,
  TRAIT_SKILL_ADD,
  TRAIT_SKILL_SEAL,
  TRAIT_EQUIP_WTYPE,
  TRAIT_EQUIP_ATYPE,
  TRAIT_EQUIP_LOCK,
  TRAIT_EQUIP_SEAL,
  TRAIT_SLOT_TYPE,
  TRAIT_ACTION_PLUS,
  TRAIT_SPECIAL_FLAG,
  TRAIT_COLLAPSE_TYPE,
  TRAIT_PARTY_ABILITY
} from '../core/combat-types.js';
import type { ProjectBundle } from '../core/types.js';

// ============================================================================
// Constants & Labels (RPG Maker MZ Standard)
// ============================================================================

export const ELEMENT_OPTIONS = [
  { id: 'physical', name: 'Physical' },
  { id: 'fire', name: 'Fire' },
  { id: 'ice', name: 'Ice' },
  { id: 'thunder', name: 'Thunder' },
  { id: 'water', name: 'Water' },
  { id: 'earth', name: 'Earth' },
  { id: 'wind', name: 'Wind' },
  { id: 'light', name: 'Light' },
  { id: 'darkness', name: 'Darkness' }
];

export const PARAM_NAMES = [
  'Max HP',
  'Max MP',
  'Attack',
  'Defense',
  'M.Attack',
  'M.Defense',
  'Agility',
  'Luck'
];

export const XPARAM_NAMES = [
  'Hit Rate',
  'Evasion Rate',
  'Critical Rate',
  'Critical Evasion',
  'Magic Evasion',
  'Magic Reflect',
  'Counter Attack',
  'HP Regeneration',
  'MP Regeneration',
  'SP/TP Regeneration'
];

export const SPARAM_NAMES = [
  'Target Rate (TGR)',
  'Guard Effect',
  'Recovery Effect',
  'Pharmacology',
  'MP Cost Rate',
  'TP Charge Rate',
  'Physical Damage Rate',
  'Magic Damage Rate',
  'Floor Damage Rate',
  'Experience Rate'
];

export const SPECIAL_FLAGS = ['Auto Battle', 'Guard', 'Substitute', 'Preserve TP'];
export const COLLAPSE_EFFECTS = ['Normal', 'Boss', 'Instant', 'No Collapse'];
export const SKILL_TYPES = ['Magic', 'Special', 'Physical'];
export const EQUIP_ARMOR_TYPES = ['General Armor', 'Magic Armor', 'Light Armor', 'Heavy Armor', 'Shield'];
export const EQUIP_SLOT_TYPES = [
  { id: 0, name: 'Weapon' },
  { id: 1, name: 'Shield' },
  { id: 2, name: 'Head' },
  { id: 3, name: 'Body' },
  { id: 4, name: 'Accessory' }
];
export const PARTY_ABILITIES = [
  'Encounter Half',
  'Encounter None',
  'Cancel Surprise',
  'Raise Preemptive',
  'Double Gold',
  'Double Drop'
];

export function formatTraitType(trait: TraitData): string {
  switch (trait.code) {
    case TRAIT_ELEMENT_RATE: return 'Element Rate';
    case TRAIT_DEBUFF_RATE: return 'Debuff Rate';
    case TRAIT_STATE_RATE: return 'State Rate';
    case TRAIT_STATE_RESIST: return 'State Resist';
    case TRAIT_PARAM: return 'Parameter';
    case TRAIT_XPARAM: return 'Ex-Parameter';
    case TRAIT_SPARAM: return 'Sp-Parameter';
    case TRAIT_ATTACK_ELEMENT: return 'Attack Element';
    case TRAIT_ATTACK_STATE: return 'Attack State';
    case TRAIT_ATTACK_SPEED: return 'Attack Speed';
    case TRAIT_ATTACK_TIMES: return 'Attack Times+';
    case TRAIT_ATTACK_SKILL: return 'Attack Skill';
    case TRAIT_STYPE_ADD: return 'Add Skill Type';
    case TRAIT_STYPE_SEAL: return 'Seal Skill Type';
    case TRAIT_SKILL_ADD: return 'Add Skill';
    case TRAIT_SKILL_SEAL: return 'Seal Skill';
    case TRAIT_EQUIP_WTYPE: return 'Equip Weapon';
    case TRAIT_EQUIP_ATYPE: return 'Equip Armor';
    case TRAIT_EQUIP_LOCK: return 'Lock Equip';
    case TRAIT_EQUIP_SEAL: return 'Seal Equip';
    case TRAIT_SLOT_TYPE: return 'Slot Type';
    case TRAIT_ACTION_PLUS: return 'Action Times+';
    case TRAIT_SPECIAL_FLAG: return 'Special Flag';
    case TRAIT_COLLAPSE_TYPE: return 'Collapse Effect';
    case TRAIT_PARTY_ABILITY: return 'Party Ability';
    default: return `Trait (${trait.code})`;
  }
}

export function formatTraitContent(trait: TraitData, game: ProjectBundle['game']): string {
  switch (trait.code) {
    case TRAIT_ELEMENT_RATE: {
      const el = ELEMENT_OPTIONS.find((e) => e.id === String(trait.dataId).toLowerCase());
      const elName = el ? el.name : String(trait.dataId);
      return `${elName} * ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_DEBUFF_RATE: {
      const pName = PARAM_NAMES[Number(trait.dataId)] || `Param #${trait.dataId}`;
      return `${pName} * ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_STATE_RATE: {
      const st = game.states?.find((s) => s.id === trait.dataId);
      return `${st?.name || trait.dataId} * ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_STATE_RESIST: {
      const st = game.states?.find((s) => s.id === trait.dataId);
      return `${st?.name || trait.dataId}`;
    }
    case TRAIT_PARAM: {
      const pIdx =
        typeof trait.dataId === 'number'
          ? trait.dataId
          : ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'].indexOf(String(trait.dataId));
      const pName = PARAM_NAMES[pIdx] || String(trait.dataId);
      return `${pName} * ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_XPARAM: {
      const xpIdx =
        typeof trait.dataId === 'number'
          ? trait.dataId
          : ['hit', 'eva', 'cri', 'cev', 'mev', 'mrf', 'cnt', 'hpRegen', 'mpRegen', 'spRegen'].indexOf(
              String(trait.dataId)
            );
      const xpName = XPARAM_NAMES[xpIdx] || String(trait.dataId);
      const sign = trait.value >= 0 ? '+' : '';
      return `${xpName} ${sign}${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_SPARAM: {
      const spIdx =
        typeof trait.dataId === 'number'
          ? trait.dataId
          : [
              'targetRate',
              'guard',
              'recovery',
              'pharmacology',
              'mpCost',
              'tpCharge',
              'physicalDamage',
              'magicDamage',
              'floorDamage',
              'expRate'
            ].indexOf(String(trait.dataId));
      const spName = SPARAM_NAMES[spIdx] || String(trait.dataId);
      return `${spName} * ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_ATTACK_ELEMENT: {
      const el = ELEMENT_OPTIONS.find((e) => e.id === String(trait.dataId).toLowerCase());
      return el ? el.name : String(trait.dataId);
    }
    case TRAIT_ATTACK_STATE: {
      const st = game.states?.find((s) => s.id === trait.dataId);
      return `${st?.name || trait.dataId} + ${Math.round(trait.value * 100)}%`;
    }
    case TRAIT_ATTACK_SPEED: {
      const sign = trait.value >= 0 ? '+' : '';
      return `${sign}${trait.value}`;
    }
    case TRAIT_ATTACK_TIMES: {
      return `+${trait.value}`;
    }
    case TRAIT_ATTACK_SKILL: {
      const sk = game.skills?.find((s) => s.id === trait.dataId);
      return sk?.name || String(trait.dataId);
    }
    case TRAIT_STYPE_ADD: {
      const idx = typeof trait.dataId === 'number' ? trait.dataId - 1 : SKILL_TYPES.indexOf(String(trait.dataId));
      return SKILL_TYPES[idx] || `Skill Type #${trait.dataId}`;
    }
    case TRAIT_STYPE_SEAL: {
      const idx = typeof trait.dataId === 'number' ? trait.dataId - 1 : SKILL_TYPES.indexOf(String(trait.dataId));
      return SKILL_TYPES[idx] || `Skill Type #${trait.dataId}`;
    }
    case TRAIT_SKILL_ADD: {
      const sk = game.skills?.find((s) => s.id === trait.dataId);
      return sk?.name || String(trait.dataId);
    }
    case TRAIT_SKILL_SEAL: {
      const sk = game.skills?.find((s) => s.id === trait.dataId);
      return sk?.name || String(trait.dataId);
    }
    case TRAIT_EQUIP_WTYPE:
      return `Weapon Type: ${trait.dataId}`;
    case TRAIT_EQUIP_ATYPE: {
      const idx = typeof trait.dataId === 'number' ? trait.dataId : EQUIP_ARMOR_TYPES.indexOf(String(trait.dataId));
      return EQUIP_ARMOR_TYPES[idx] || String(trait.dataId);
    }
    case TRAIT_EQUIP_LOCK: {
      const slot = EQUIP_SLOT_TYPES.find(s => s.id === Number(trait.dataId) || s.name.toLowerCase() === String(trait.dataId).toLowerCase());
      return `Lock: ${slot ? slot.name : trait.dataId}`;
    }
    case TRAIT_EQUIP_SEAL: {
      const slot = EQUIP_SLOT_TYPES.find(s => s.id === Number(trait.dataId) || s.name.toLowerCase() === String(trait.dataId).toLowerCase());
      return `Seal: ${slot ? slot.name : trait.dataId}`;
    }
    case TRAIT_SLOT_TYPE:
      return Number(trait.value) === 1 ? 'Dual Wield' : 'Normal';
    case TRAIT_ACTION_PLUS:
      return `${Math.round(trait.value * 100)}%`;
    case TRAIT_SPECIAL_FLAG:
      return SPECIAL_FLAGS[Number(trait.dataId)] || `Special Flag #${trait.dataId}`;
    case TRAIT_COLLAPSE_TYPE:
      return COLLAPSE_EFFECTS[Number(trait.dataId)] || `Collapse #${trait.dataId}`;
    case TRAIT_PARTY_ABILITY:
      return PARTY_ABILITIES[Number(trait.dataId)] || `Party Ability #${trait.dataId}`;
    default:
      return `Value: ${trait.value}`;
  }
}

// ============================================================================
// Modal: Image Picker (Face, Character, SV Battler)
// ============================================================================

export function ActorImagePickerModal({
  category,
  currentImage,
  currentIndex,
  assetUrlMap,
  bundle,
  onConfirm,
  onClose
}: {
  category: 'face' | 'character' | 'sv';
  currentImage: string;
  currentIndex: number;
  assetUrlMap: Record<string, string>;
  bundle: ProjectBundle;
  onConfirm: (path: string, index: number) => void;
  onClose: () => void;
}) {
  const defaultList = useMemo(() => {
    if (category === 'face') {
      return [
        'Actor1.png',
        'Actor2.png',
        'Actor3.png',
        'Evil.png',
        'Monster.png',
        'Nature.png',
        'People1.png',
        'People2.png',
        'People3.png',
        'People4.png',
        'SF_Actor1.png',
        'SF_Actor2.png',
        'SF_Actor3.png'
      ];
    }
    if (category === 'character') {
      return [
        'Actor1.png',
        'Actor2.png',
        'Actor3.png',
        'Evil.png',
        'Monster.png',
        'Nature.png',
        'People1.png',
        'People2.png',
        'People3.png',
        'People4.png',
        'SF_Actor1.png',
        'SF_Actor2.png',
        'SF_Actor3.png',
        'Vehicle.png',
        '!Door1.png',
        '!Chest.png'
      ];
    }
    return [
      'Actor1_1.png',
      'Actor1_2.png',
      'Actor1_3.png',
      'Actor1_4.png',
      'Actor1_5.png',
      'Actor1_6.png',
      'Actor1_7.png',
      'Actor1_8.png',
      'Actor2_1.png',
      'Actor2_2.png',
      'Actor2_3.png',
      'Actor2_4.png',
      'Actor2_5.png',
      'Actor2_6.png',
      'Actor2_7.png',
      'Actor2_8.png',
      'Actor3_5.png',
      'Actor3_6.png',
      'Actor3_7.png',
      'Actor3_8.png',
      'SF_Actor1_1.png',
      'SF_Actor1_2.png',
      'SF_Actor1_3.png'
    ];
  }, [category]);

  const prefix = category === 'face' ? 'assets/faces/' : category === 'character' ? 'assets/characters/' : 'assets/sv_actors/';
  const currentFileName = currentImage.startsWith(prefix) ? currentImage.slice(prefix.length) : currentImage;

  const [selectedFile, setSelectedFile] = useState(currentFileName || defaultList[0]);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  const [search, setSearch] = useState('');

  const fullPath = `${prefix}${selectedFile}`;
  const dataUrl = assetUrlMap[fullPath] || assetUrlMap[currentImage];

  const filteredFiles = defaultList.filter((f) => f.toLowerCase().includes(search.toLowerCase()));

  const title =
    category === 'face'
      ? 'Pilih Gambar Wajah (Face Graphic)'
      : category === 'character'
      ? 'Pilih Gambar Karakter (Character Graphic)'
      : 'Pilih Gambar Tempur [SV] Battler';

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div className="mz-sub-modal-window" style={{ width: 620, height: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="mz-sub-modal-header">
          <span>{title}</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
          {/* Left: Files List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
            <input
              type="text"
              className="mz-input"
              placeholder="Cari berkas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mz-table-container" style={{ flex: 1, minHeight: 0 }}>
              {filteredFiles.map((f) => (
                <div
                  key={f}
                  className={`mz-table-clickable-row ${selectedFile === f ? 'active' : ''}`}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    background: selectedFile === f ? '#0078d7' : undefined,
                    color: selectedFile === f ? '#ffffff' : undefined
                  }}
                  onClick={() => setSelectedFile(f)}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Grid of 8 Frames (Face/Character) or Single Preview (SV) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
              {category === 'sv' ? 'Pratinjau [SV] Battler:' : 'Pilih Frame Karakter (1 - 8):'}
            </span>

            {category === 'face' ? (
              <div
                className="mz-sheet-frame-grid"
                style={{ width: 340, height: 170, backgroundColor: '#f0f3f6' }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                  const col = idx % 4;
                  const row = Math.floor(idx / 4);
                  const isSel = selectedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`mz-sheet-frame-cell mz-checkered-bg ${isSel ? 'selected' : ''}`}
                      style={{ position: 'relative', height: 78 }}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      {dataUrl ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url("${dataUrl}")`,
                            backgroundSize: '400% 200%',
                            backgroundPosition: `${col * -100}% ${row * -100}%`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 18 }}>👤</span>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          background: isSel ? '#0078d7' : 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          padding: '1px 3px',
                          borderRadius: 2
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : category === 'character' ? (
              <div
                className="mz-sheet-frame-grid"
                style={{ width: 340, height: 170, backgroundColor: '#f0f3f6' }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                  const col = idx % 4;
                  const row = Math.floor(idx / 4);
                  const isSel = selectedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`mz-sheet-frame-cell mz-checkered-bg ${isSel ? 'selected' : ''}`}
                      style={{ position: 'relative', height: 78 }}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      {dataUrl ? (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            backgroundImage: `url("${dataUrl}")`,
                            backgroundSize: '576px 384px',
                            backgroundPosition: `-${col * 144 + 48}px -${row * 192}px`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 18 }}>🚶</span>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          background: isSel ? '#0078d7' : 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          padding: '1px 3px',
                          borderRadius: 2
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="mz-mzstyle-preview-frame mz-checkered-bg"
                style={{ width: 140, height: 140, margin: '20px auto' }}
              >
                {dataUrl ? (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      backgroundImage: `url("${dataUrl}")`,
                      backgroundSize: '576px 384px',
                      backgroundPosition: '0px 0px',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      transform: 'scale(1.5)'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 32 }}>⚔️</span>
                )}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Berkas terpilih: <strong>{fullPath}</strong> (Frame: {selectedIndex + 1})
            </div>
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button
            className="mz-btn-dialog primary"
            onClick={() => {
              onConfirm(fullPath, selectedIndex);
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn-dialog" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Equipment Slot Picker
// ============================================================================

export function ActorEquipPickerModal({
  slot,
  currentEquipId,
  equipmentList,
  onConfirm,
  onClose
}: {
  slot: 'weapon' | 'shield' | 'head' | 'body' | 'accessory';
  currentEquipId: string;
  equipmentList: EquipmentData[];
  onConfirm: (equipId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(currentEquipId || '');

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      // In RPG Maker MZ, slot mapping:
      // weapon -> weapon items
      // shield -> shield/armor items
      // head -> head armor
      // body -> body armor
      // accessory -> accessory items
      const matchesSlot =
        slot === 'weapon'
          ? item.slot === 'weapon'
          : slot === 'shield'
          ? item.slot === 'shield' || item.name.toLowerCase().includes('shield') || item.slot === 'body'
          : item.slot === slot || item.slot === 'body';

      if (!matchesSlot) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [slot, equipmentList, search]);

  const slotTitle = slot.charAt(0).toUpperCase() + slot.slice(1);

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div className="mz-sub-modal-window" style={{ width: 440, height: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="mz-sub-modal-header">
          <span>Pilih Perlengkapan Awal: {slotTitle}</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            className="mz-input"
            placeholder="Cari item perlengkapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="mz-table-container" style={{ flex: 1, minHeight: 0 }}>
            {/* None Option */}
            <div
              className={`mz-table-clickable-row ${selectedId === '' ? 'active' : ''}`}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                borderBottom: '1px solid #eef2f6',
                background: selectedId === '' ? '#0078d7' : undefined,
                color: selectedId === '' ? '#ffffff' : '#64748b',
                fontStyle: 'italic'
              }}
              onClick={() => setSelectedId('')}
              onDoubleClick={() => {
                onConfirm('');
                onClose();
              }}
            >
              (None / Kosong)
            </div>

            {filteredEquipment.map((eq) => {
              const isSel = selectedId === eq.id;
              const bonusStr = Object.entries(eq.bonuses || {})
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                .join(', ');
              return (
                <div
                  key={eq.id}
                  className={`mz-table-clickable-row ${isSel ? 'active' : ''}`}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    borderBottom: '1px solid #eef2f6',
                    background: isSel ? '#0078d7' : undefined,
                    color: isSel ? '#ffffff' : undefined,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setSelectedId(eq.id)}
                  onDoubleClick={() => {
                    onConfirm(eq.id);
                    onClose();
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{eq.name}</span>
                  <small style={{ color: isSel ? '#ffffff' : '#64748b' }}>
                    {bonusStr || eq.id}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button
            className="mz-btn-dialog primary"
            onClick={() => {
              onConfirm(selectedId);
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn-dialog" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Trait Editor (7 Tabs ala RPG Maker MZ)
// ============================================================================

export function ActorTraitModal({
  initialTrait,
  bundle,
  onConfirm,
  onDelete,
  onClose
}: {
  initialTrait: TraitData | null;
  bundle: ProjectBundle;
  onConfirm: (trait: TraitData) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  // Infer active tab from initial trait code
  const initialTab = useMemo(() => {
    if (!initialTrait) return 'rate';
    const c = initialTrait.code;
    if ([11, 12, 13, 14].includes(c)) return 'rate';
    if ([31, 32, 33, 34, 35].includes(c)) return 'attack';
    if ([41, 42, 43, 44].includes(c)) return 'skill';
    if ([51, 52, 53, 54, 55].includes(c)) return 'equip';
    if (c === 61) return 'action';
    if ([62, 63, 64].includes(c)) return 'special';
    if ([21, 22, 23].includes(c)) return 'parameter';
    return 'rate';
  }, [initialTrait]);

  const [activeTab, setActiveTab] = useState<'rate' | 'attack' | 'skill' | 'equip' | 'action' | 'special' | 'parameter'>(
    initialTab as any
  );

  // Form state
  const [code, setCode] = useState(initialTrait?.code ?? 11);
  const [dataId, setDataId] = useState<string | number>(initialTrait?.dataId ?? 'fire');
  const [value, setValue] = useState(initialTrait?.value ?? 1.0);

  // Tab 1: Rate
  const renderRateTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="rate_type"
          checked={code === TRAIT_ELEMENT_RATE}
          onChange={() => {
            setCode(TRAIT_ELEMENT_RATE);
            setDataId('fire');
            setValue(0.5);
          }}
        />
        <span className="mz-trait-label">Element Rate:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_ELEMENT_RATE}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {ELEMENT_OPTIONS.map((el) => (
            <option key={el.id} value={el.id}>
              {el.name}
            </option>
          ))}
        </select>
        <span>*</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_ELEMENT_RATE}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="rate_type"
          checked={code === TRAIT_DEBUFF_RATE}
          onChange={() => {
            setCode(TRAIT_DEBUFF_RATE);
            setDataId(0);
            setValue(1.0);
          }}
        />
        <span className="mz-trait-label">Debuff Rate:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_DEBUFF_RATE}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {PARAM_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <span>*</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_DEBUFF_RATE}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="rate_type"
          checked={code === TRAIT_STATE_RATE}
          onChange={() => {
            setCode(TRAIT_STATE_RATE);
            setDataId(bundle.game.states?.[0]?.id || 'state.poison');
            setValue(1.0);
          }}
        />
        <span className="mz-trait-label">State Rate:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_STATE_RATE}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.states || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span>*</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_STATE_RATE}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="rate_type"
          checked={code === TRAIT_STATE_RESIST}
          onChange={() => {
            setCode(TRAIT_STATE_RESIST);
            setDataId(bundle.game.states?.[0]?.id || 'state.poison');
            setValue(1);
          }}
        />
        <span className="mz-trait-label">State Resist:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_STATE_RESIST}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.states || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  // Tab 2: Attack
  const renderAttackTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="attack_type"
          checked={code === TRAIT_ATTACK_ELEMENT}
          onChange={() => {
            setCode(TRAIT_ATTACK_ELEMENT);
            setDataId('physical');
            setValue(0);
          }}
        />
        <span className="mz-trait-label">Attack Element:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_ATTACK_ELEMENT}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {ELEMENT_OPTIONS.map((el) => (
            <option key={el.id} value={el.id}>
              {el.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="attack_type"
          checked={code === TRAIT_ATTACK_STATE}
          onChange={() => {
            setCode(TRAIT_ATTACK_STATE);
            setDataId(bundle.game.states?.[0]?.id || 'state.poison');
            setValue(0.2);
          }}
        />
        <span className="mz-trait-label">Attack State:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_ATTACK_STATE}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.states || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span>+</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_ATTACK_STATE}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="attack_type"
          checked={code === TRAIT_ATTACK_SPEED}
          onChange={() => {
            setCode(TRAIT_ATTACK_SPEED);
            setDataId(0);
            setValue(10);
          }}
        />
        <span className="mz-trait-label">Attack Speed:</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 80 }}
          disabled={code !== TRAIT_ATTACK_SPEED}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="attack_type"
          checked={code === TRAIT_ATTACK_TIMES}
          onChange={() => {
            setCode(TRAIT_ATTACK_TIMES);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Attack Times+:</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          min={1}
          max={9}
          disabled={code !== TRAIT_ATTACK_TIMES}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="attack_type"
          checked={code === TRAIT_ATTACK_SKILL}
          onChange={() => {
            setCode(TRAIT_ATTACK_SKILL);
            setDataId(bundle.game.skills?.[0]?.id || 'skill.power-strike');
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Attack Skill:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_ATTACK_SKILL}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.skills || []).map((sk) => (
            <option key={sk.id} value={sk.id}>
              {sk.name} ({sk.id})
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  // Tab 3: Skill
  const renderSkillTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="skill_type"
          checked={code === TRAIT_STYPE_ADD}
          onChange={() => {
            setCode(TRAIT_STYPE_ADD);
            setDataId(1);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Add Skill Type:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_STYPE_ADD}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {SKILL_TYPES.map((st, i) => (
            <option key={i} value={i + 1}>
              {st}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="skill_type"
          checked={code === TRAIT_STYPE_SEAL}
          onChange={() => {
            setCode(TRAIT_STYPE_SEAL);
            setDataId(1);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Seal Skill Type:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_STYPE_SEAL}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {SKILL_TYPES.map((st, i) => (
            <option key={i} value={i + 1}>
              {st}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="skill_type"
          checked={code === TRAIT_SKILL_ADD}
          onChange={() => {
            setCode(TRAIT_SKILL_ADD);
            setDataId(bundle.game.skills?.[0]?.id || 'skill.power-strike');
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Add Skill:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_SKILL_ADD}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.skills || []).map((sk) => (
            <option key={sk.id} value={sk.id}>
              {sk.name} ({sk.id})
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="skill_type"
          checked={code === TRAIT_SKILL_SEAL}
          onChange={() => {
            setCode(TRAIT_SKILL_SEAL);
            setDataId(bundle.game.skills?.[0]?.id || 'skill.power-strike');
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Seal Skill:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_SKILL_SEAL}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          {(bundle.game.skills || []).map((sk) => (
            <option key={sk.id} value={sk.id}>
              {sk.name} ({sk.id})
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  // Tab 4: Equip
  const renderEquipTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="equip_type"
          checked={code === TRAIT_EQUIP_WTYPE}
          onChange={() => {
            setCode(TRAIT_EQUIP_WTYPE);
            setDataId('melee');
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Equip Weapon:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_EQUIP_WTYPE}
          value={String(dataId)}
          onChange={(e) => setDataId(e.target.value)}
        >
          <option value="melee">Melee</option>
          <option value="finesse">Finesse</option>
          <option value="ranged">Ranged</option>
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="equip_type"
          checked={code === TRAIT_EQUIP_ATYPE}
          onChange={() => {
            setCode(TRAIT_EQUIP_ATYPE);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Equip Armor:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_EQUIP_ATYPE}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {EQUIP_ARMOR_TYPES.map((at, i) => (
            <option key={i} value={i}>
              {at}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="equip_type"
          checked={code === TRAIT_EQUIP_LOCK}
          onChange={() => {
            setCode(TRAIT_EQUIP_LOCK);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Lock Equip:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_EQUIP_LOCK}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {EQUIP_SLOT_TYPES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="equip_type"
          checked={code === TRAIT_EQUIP_SEAL}
          onChange={() => {
            setCode(TRAIT_EQUIP_SEAL);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Seal Equip:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_EQUIP_SEAL}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {EQUIP_SLOT_TYPES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="equip_type"
          checked={code === TRAIT_SLOT_TYPE}
          onChange={() => {
            setCode(TRAIT_SLOT_TYPE);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Slot Type:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_SLOT_TYPE}
          value={Number(value)}
          onChange={(e) => setValue(Number(e.target.value))}
        >
          <option value={0}>Normal (Single Weapon)</option>
          <option value={1}>Dual Wield (Dua Senjata)</option>
        </select>
      </label>
    </div>
  );

  // Tab 5: Action
  const renderActionTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="action_type"
          checked={code === TRAIT_ACTION_PLUS}
          onChange={() => {
            setCode(TRAIT_ACTION_PLUS);
            setDataId(0);
            setValue(1.0);
          }}
        />
        <span className="mz-trait-label">Action Times+:</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          min={1}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>
    </div>
  );

  // Tab 6: Special
  const renderSpecialTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="special_type"
          checked={code === TRAIT_SPECIAL_FLAG}
          onChange={() => {
            setCode(TRAIT_SPECIAL_FLAG);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Special Flag:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_SPECIAL_FLAG}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {SPECIAL_FLAGS.map((f, i) => (
            <option key={i} value={i}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="special_type"
          checked={code === TRAIT_COLLAPSE_TYPE}
          onChange={() => {
            setCode(TRAIT_COLLAPSE_TYPE);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Collapse Effect:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_COLLAPSE_TYPE}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {COLLAPSE_EFFECTS.map((ce, i) => (
            <option key={i} value={i}>
              {ce}
            </option>
          ))}
        </select>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="special_type"
          checked={code === TRAIT_PARTY_ABILITY}
          onChange={() => {
            setCode(TRAIT_PARTY_ABILITY);
            setDataId(0);
            setValue(1);
          }}
        />
        <span className="mz-trait-label">Party Ability:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_PARTY_ABILITY}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {PARTY_ABILITIES.map((a, i) => (
            <option key={i} value={i}>
              {a}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  // Tab 7: Parameter
  const renderParamTab = () => (
    <div className="mz-trait-form-list">
      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="param_type"
          checked={code === TRAIT_PARAM}
          onChange={() => {
            setCode(TRAIT_PARAM);
            setDataId(0);
            setValue(1.2);
          }}
        />
        <span className="mz-trait-label">Parameter:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_PARAM}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {PARAM_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <span>*</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_PARAM}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="param_type"
          checked={code === TRAIT_XPARAM}
          onChange={() => {
            setCode(TRAIT_XPARAM);
            setDataId(0);
            setValue(0.05);
          }}
        />
        <span className="mz-trait-label">Ex-Parameter:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_XPARAM}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {XPARAM_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <span>+</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_XPARAM}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>

      <label className="mz-trait-option-row">
        <input
          type="radio"
          name="param_type"
          checked={code === TRAIT_SPARAM}
          onChange={() => {
            setCode(TRAIT_SPARAM);
            setDataId(0);
            setValue(1.0);
          }}
        />
        <span className="mz-trait-label">Sp-Parameter:</span>
        <select
          className="mz-select"
          disabled={code !== TRAIT_SPARAM}
          value={Number(dataId)}
          onChange={(e) => setDataId(Number(e.target.value))}
        >
          {SPARAM_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <span>*</span>
        <input
          type="number"
          className="mz-input"
          style={{ width: 70 }}
          disabled={code !== TRAIT_SPARAM}
          value={Math.round(value * 100)}
          onChange={(e) => setValue(Number(e.target.value) / 100)}
        />
        <span>%</span>
      </label>
    </div>
  );

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div className="mz-sub-modal-window" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="mz-sub-modal-header">
          <span>{initialTrait ? 'Edit Trait' : 'Tambah Trait Baru'}</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mz-sub-modal-body">
          <div className="mz-trait-tabs">
            {(['rate', 'attack', 'skill', 'equip', 'action', 'special', 'parameter'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`mz-trait-tab-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(t);
                  if (t === 'rate') {
                    setCode(TRAIT_ELEMENT_RATE);
                    setDataId('fire');
                    setValue(0.5);
                  } else if (t === 'attack') {
                    setCode(TRAIT_ATTACK_ELEMENT);
                    setDataId('physical');
                    setValue(0);
                  } else if (t === 'skill') {
                    setCode(TRAIT_STYPE_ADD);
                    setDataId(1);
                    setValue(1);
                  } else if (t === 'equip') {
                    setCode(TRAIT_EQUIP_WTYPE);
                    setDataId('melee');
                    setValue(1);
                  } else if (t === 'action') {
                    setCode(TRAIT_ACTION_PLUS);
                    setDataId(0);
                    setValue(1.0);
                  } else if (t === 'special') {
                    setCode(TRAIT_SPECIAL_FLAG);
                    setDataId(0);
                    setValue(1);
                  } else if (t === 'parameter') {
                    setCode(TRAIT_PARAM);
                    setDataId(0);
                    setValue(1.2);
                  }
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px 4px' }}>
            {activeTab === 'rate' && renderRateTab()}
            {activeTab === 'attack' && renderAttackTab()}
            {activeTab === 'skill' && renderSkillTab()}
            {activeTab === 'equip' && renderEquipTab()}
            {activeTab === 'action' && renderActionTab()}
            {activeTab === 'special' && renderSpecialTab()}
            {activeTab === 'parameter' && renderParamTab()}
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          {onDelete && (
            <button
              className="mz-btn-dialog"
              style={{ color: '#ef4444', marginRight: 'auto' }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Hapus Trait
            </button>
          )}
          <button
            className="mz-btn-dialog primary"
            onClick={() => {
              onConfirm({ code, dataId, value });
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn-dialog" onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Form: Actor Detail Form (Matches Image 2 Layout)
// ============================================================================

export function ActorDetailForm({
  actor,
  bundle,
  onUpdate,
  assetUrlMap
}: {
  actor: ActorData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap: Record<string, string>;
}) {
  const [imageModalType, setImageModalType] = useState<'face' | 'character' | 'sv' | null>(null);
  const [equipModalSlot, setEquipModalSlot] = useState<'weapon' | 'shield' | 'head' | 'body' | 'accessory' | null>(
    null
  );
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultEquip = actor.defaultEquipment || {};
  const stats: BaseStats = actor.stats || { str: 10, int: 10, dex: 10, luk: 10, agi: 10, vit: 10 };
  const base: CombatBase = actor.base || { hp: 50, mp: 20, atk: 8, def: 6, mat: 5, mdf: 5, agi: 6 };
  const learnings = actor.classLearnings || [];

  const faceImg = actor.faceImage || 'assets/faces/Actor1.png';
  const charImg = actor.characterImage || 'assets/characters/Actor1.png';
  const faceIdx = Number(actor.faceIndex ?? 0);
  const charIdx = Number(actor.characterIndex ?? 0);
  const faceDataUrl = assetUrlMap[faceImg] || assetUrlMap['assets/faces/Actor1.png'];
  const charDataUrl = assetUrlMap[charImg] || assetUrlMap['assets/characters/Actor1.png'];
  const svImg = actor.battlerImage || `assets/sv_actors/Actor1_${charIdx + 1}.png`;
  const svDataUrl = assetUrlMap[svImg] || assetUrlMap['assets/sv_actors/Actor1_1.png'];

  const updateEquip = (slot: string, equipId: string) => {
    const nextEquip = {
      ...defaultEquip,
      [slot]: equipId || undefined
    };
    const nextEquipsArray = [
      nextEquip.weapon || '',
      nextEquip.shield || '',
      nextEquip.head || '',
      nextEquip.body || '',
      nextEquip.accessory || ''
    ];
    onUpdate({
      defaultEquipment: nextEquip,
      equips: nextEquipsArray
    });
  };

  const updateNested = (parentKey: 'stats' | 'base', subKey: string, val: number) => {
    onUpdate({
      [parentKey]: {
        ...(actor[parentKey] as unknown as Record<string, number>),
        [subKey]: val
      }
    });
  };

  const handleAddTrait = (trait: TraitData) => {
    const nextTraits = [...(actor.traits || []), trait];
    onUpdate({ traits: nextTraits });
  };

  const handleUpdateTrait = (index: number, trait: TraitData) => {
    const nextTraits = [...(actor.traits || [])];
    nextTraits[index] = trait;
    onUpdate({ traits: nextTraits });
  };

  const handleDeleteTrait = (index: number) => {
    const nextTraits = (actor.traits || []).filter((_, i) => i !== index);
    onUpdate({ traits: nextTraits });
  };

  return (
    <div className="mz-actor-editor-root">
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Images, Initial Equipment          */}
        {/* ================================================================= */}
        <div className="mz-actor-col mz-actor-left-col">
          {/* 1. General Settings */}
          <fieldset className="mz-groupbox">
            <legend>General Settings</legend>
            <div className="mz-field-row">
              <label className="mz-field-item">
                <span className="mz-field-label">Name:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={actor.name ?? ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                />
              </label>
              <label className="mz-field-item">
                <span className="mz-field-label">Nickname:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={actor.nickname ?? ''}
                  onChange={(e) => onUpdate({ nickname: e.target.value })}
                />
              </label>
            </div>

            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1.5 }}>
                <span className="mz-field-label">Class:</span>
                <select
                  className="mz-select"
                  value={actor.classId ?? ''}
                  onChange={(e) => onUpdate({ classId: e.target.value })}
                >
                  {(bundle.game.classes || []).map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {String(i + 1).padStart(4, '0')} {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mz-field-item" style={{ flex: 0.8 }}>
                <span className="mz-field-label">Initial Level:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={1}
                  max={actor.maxLevel ?? 99}
                  value={actor.initialLevel ?? 1}
                  onChange={(e) => onUpdate({ initialLevel: Number(e.target.value) })}
                />
              </label>
              <label className="mz-field-item" style={{ flex: 0.8 }}>
                <span className="mz-field-label">Max Level:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={actor.initialLevel ?? 1}
                  max={99}
                  value={actor.maxLevel ?? 99}
                  onChange={(e) => onUpdate({ maxLevel: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="mz-field-col">
              <span className="mz-field-label">Profile:</span>
              <textarea
                className="mz-textarea mz-profile-textarea"
                rows={3}
                value={actor.profile ?? ''}
                onChange={(e) => onUpdate({ profile: e.target.value })}
                placeholder="Deskripsi karakter..."
              />
            </div>
          </fieldset>

          {/* 2. Images */}
          <fieldset className="mz-groupbox">
            <legend>Images</legend>
            <div className="mz-actor-images-row">
              {/* Face Box */}
              <div
                className="mz-img-box-container"
                onClick={() => setImageModalType('face')}
                title="Klik untuk memilih Face Graphic"
              >
                <span className="mz-img-box-label">Face:</span>
                <div className="mz-checkered-bg mz-mzstyle-preview-frame mz-face-frame">
                  {faceDataUrl ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url("${faceDataUrl}")`,
                        backgroundSize: '400% 200%',
                        backgroundPosition: `${(faceIdx % 4) * -100}% ${Math.floor(faceIdx / 4) * -100}%`,
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated'
                      }}
                    />
                  ) : (
                    <span className="mz-placeholder-icon">👤</span>
                  )}
                </div>
              </div>

              {/* Character Box */}
              <div
                className="mz-img-box-container"
                onClick={() => setImageModalType('character')}
                title="Klik untuk memilih Character Sprite"
              >
                <span className="mz-img-box-label">Character:</span>
                <div className="mz-checkered-bg mz-mzstyle-preview-frame mz-char-frame">
                  {charDataUrl ? (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        backgroundImage: `url("${charDataUrl}")`,
                        backgroundSize: '576px 384px',
                        backgroundPosition: `-${(charIdx % 4) * 144 + 48}px -${Math.floor(charIdx / 4) * 192}px`,
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        transform: 'scale(1.2)'
                      }}
                    />
                  ) : (
                    <span className="mz-placeholder-icon">🚶</span>
                  )}
                </div>
              </div>

              {/* [SV] Battler Box */}
              <div
                className="mz-img-box-container"
                onClick={() => setImageModalType('sv')}
                title="Klik untuk memilih Sideview Battler"
              >
                <span className="mz-img-box-label">[SV] Battler:</span>
                <div className="mz-checkered-bg mz-mzstyle-preview-frame mz-sv-frame">
                  {svDataUrl ? (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        backgroundImage: `url("${svDataUrl}")`,
                        backgroundSize: '576px 384px',
                        backgroundPosition: '0px 0px',
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        transform: 'scale(1.1)'
                      }}
                    />
                  ) : (
                    <span className="mz-placeholder-icon">⚔️</span>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* 3. Initial Equipment */}
          <fieldset className="mz-groupbox">
            <legend>Initial Equipment</legend>
            <div className="mz-table-container">
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Type</th>
                    <th style={{ width: '62%' }}>Equipment Item</th>
                  </tr>
                </thead>
                <tbody>
                  {(['weapon', 'shield', 'head', 'body', 'accessory'] as const).map((slotKey) => {
                    const slotName = slotKey.charAt(0).toUpperCase() + slotKey.slice(1);
                    const equipId = defaultEquip[slotKey] || '';
                    const equipItem = bundle.game.equipment.find((e) => e.id === equipId);
                    return (
                      <tr
                        key={slotKey}
                        className="mz-table-clickable-row"
                        onClick={() => setEquipModalSlot(slotKey)}
                        title="Klik untuk memilih perlengkapan"
                      >
                        <td className="mz-td-type">{slotName}</td>
                        <td className="mz-td-content">
                          {equipItem ? (
                            equipItem.name
                          ) : (
                            <span style={{ color: '#888' }}>(None)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Traits & Note                                       */}
        {/* ================================================================= */}
        <div className="mz-actor-col mz-actor-right-col">
          {/* 4. Traits */}
          <fieldset className="mz-groupbox mz-traits-groupbox">
            <legend>Traits</legend>
            <div className="mz-table-container mz-traits-table-container">
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Type</th>
                    <th style={{ width: '62%' }}>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {(actor.traits || []).map((trait, tIdx) => (
                    <tr
                      key={tIdx}
                      className="mz-table-clickable-row"
                      onDoubleClick={() => setTraitModalIndex(tIdx)}
                      title="Klik ganda untuk mengedit trait"
                    >
                      <td className="mz-td-type">{formatTraitType(trait)}</td>
                      <td className="mz-td-content">{formatTraitContent(trait, bundle.game)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(1, 8 - (actor.traits?.length || 0)) }).map((_, emptyIdx) => (
                    <tr
                      key={`empty-${emptyIdx}`}
                      className="mz-table-empty-row"
                      onDoubleClick={() => setTraitModalIndex('new')}
                      title="Klik ganda untuk menambah trait baru"
                    >
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mz-traits-actions-bar">
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setTraitModalIndex('new')}
                title="Tambah Trait Baru"
              >
                ＋ Tambah Trait...
              </button>
              {(actor.traits?.length || 0) > 0 && (
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => {
                    const next = [...(actor.traits || [])];
                    next.pop();
                    onUpdate({ traits: next });
                  }}
                  title="Hapus Trait Terakhir"
                >
                  Hapus Trait
                </button>
              )}
            </div>
          </fieldset>

          {/* 5. Note */}
          <fieldset className="mz-groupbox mz-note-groupbox">
            <legend>Note</legend>
            <textarea
              className="mz-textarea mz-note-textarea"
              value={actor.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Catatan pengembang atau metadata plugin..."
            />
          </fieldset>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ACCORDION: Advanced Core Parameters (NUSV Engine Compatibility)   */}
      {/* ================================================================= */}
      <div className="mz-advanced-accordion">
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>{showAdvanced ? '▼' : '►'} Advanced / NUSV Core Combat Parameters & Growth</span>
          <small style={{ color: '#64748b' }}>
            {showAdvanced ? 'Sembunyikan' : 'Klik untuk melihat Base Stats, Combat Base, dan Class Learnings'}
          </small>
        </button>
        {showAdvanced && (
          <div className="mz-accordion-body">
            <div className="mz-form-row">
              <label className="mz-form-field">
                <span>ID Aktor</span>
                <input
                  type="text"
                  value={actor.id ?? ''}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>
              <label className="mz-form-field">
                <span>Class Tier</span>
                <select
                  value={String(actor.classTier ?? '1')}
                  onChange={(e) => onUpdate({ classTier: Number(e.target.value) })}
                >
                  <option value="1">Tier 1 (Dasar)</option>
                  <option value="2">Tier 2 (Lanjut)</option>
                  <option value="3">Tier 3 (Master)</option>
                </select>
              </label>
              <label className="mz-form-field">
                <span>Tipe Senjata</span>
                <select
                  value={actor.weaponType ?? 'melee'}
                  onChange={(e) => onUpdate({ weaponType: e.target.value })}
                >
                  <option value="melee">Melee</option>
                  <option value="finesse">Finesse</option>
                  <option value="ranged">Ranged</option>
                </select>
              </label>
            </div>

            <div className="mz-form-card" style={{ padding: 10 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 11, fontWeight: 700 }}>Base Stats (STR, INT, DEX, LUK, AGI, VIT)</h4>
              <div className="mz-stats-grid">
                {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as Array<keyof BaseStats>).map((st) => (
                  <label key={st} className="mz-stat-cell">
                    <span>{st.toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      value={stats[st] ?? 10}
                      onChange={(e) => updateNested('stats', st, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mz-form-card" style={{ padding: 10 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 11, fontWeight: 700 }}>Combat Base (HP, MP, ATK, DEF, MAT, MDF, AGI)</h4>
              <div className="mz-stats-grid">
                {(['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi'] as Array<keyof CombatBase>).map((cb) => (
                  <label key={cb} className="mz-stat-cell">
                    <span>{cb.toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      value={base[cb] ?? 10}
                      onChange={(e) => updateNested('base', cb, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mz-form-card" style={{ padding: 10 }}>
              <div className="mz-card-header-actions">
                <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>Daftar Pembelajaran Skill (Class Learnings)</h4>
                <button
                  className="mz-btn-small"
                  onClick={() => {
                    const defaultSkill = bundle.game.skills[0]?.id || 'skill.power-strike';
                    const defaultClass = actor.classId || bundle.game.classes?.[0]?.id || 'class.squire';
                    onUpdate({
                      classLearnings: [...learnings, { classId: defaultClass, level: 2, skillId: defaultSkill }]
                    });
                  }}
                >
                  ＋ Tambah Learning
                </button>
              </div>
              <div className="mz-learning-table">
                {learnings.map((lr, idx) => (
                  <div key={idx} className="mz-learning-row">
                    <span>Level:</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={lr.level}
                      onChange={(e) => {
                        const next = [...learnings];
                        next[idx] = { ...next[idx], level: Number(e.target.value) };
                        onUpdate({ classLearnings: next });
                      }}
                      style={{ width: '60px' }}
                    />
                    <span>Skill:</span>
                    <select
                      value={lr.skillId}
                      onChange={(e) => {
                        const next = [...learnings];
                        next[idx] = { ...next[idx], skillId: e.target.value };
                        onUpdate({ classLearnings: next });
                      }}
                    >
                      {bundle.game.skills.map((sk) => (
                        <option key={sk.id} value={sk.id}>
                          {sk.name} ({sk.id})
                        </option>
                      ))}
                    </select>
                    <button
                      className="mz-btn-del-sm"
                      onClick={() => {
                        onUpdate({
                          classLearnings: learnings.filter((_, i) => i !== idx)
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* POPUP MODALS                                                      */}
      {/* ================================================================= */}
      {imageModalType && (
        <ActorImagePickerModal
          category={imageModalType}
          currentImage={imageModalType === 'face' ? faceImg : imageModalType === 'character' ? charImg : svImg}
          currentIndex={imageModalType === 'face' ? faceIdx : charIdx}
          assetUrlMap={assetUrlMap}
          bundle={bundle}
          onConfirm={(path, frameIdx) => {
            const fileName = path.split('/').pop() || '';
            const rawName = fileName.replace(/\.png$/i, '');
            if (imageModalType === 'face') {
              onUpdate({ faceImage: path, faceIndex: frameIdx, faceName: rawName });
            } else if (imageModalType === 'character') {
              onUpdate({ characterImage: path, characterIndex: frameIdx, characterName: rawName });
            } else if (imageModalType === 'sv') {
              onUpdate({ battlerImage: path, battlerName: rawName });
            }
          }}
          onClose={() => setImageModalType(null)}
        />
      )}

      {equipModalSlot && (
        <ActorEquipPickerModal
          slot={equipModalSlot}
          currentEquipId={defaultEquip[equipModalSlot] || ''}
          equipmentList={bundle.game.equipment}
          onConfirm={(equipId) => updateEquip(equipModalSlot, equipId)}
          onClose={() => setEquipModalSlot(null)}
        />
      )}

      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={traitModalIndex === 'new' ? null : (actor.traits || [])[traitModalIndex]}
          bundle={bundle}
          onConfirm={(trait) => {
            if (traitModalIndex === 'new') {
              handleAddTrait(trait);
            } else {
              handleUpdateTrait(traitModalIndex, trait);
            }
          }}
          onDelete={
            traitModalIndex !== 'new'
              ? () => handleDeleteTrait(traitModalIndex)
              : undefined
          }
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}
