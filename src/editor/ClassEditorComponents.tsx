import { useState, useMemo, useEffect } from 'react';
import type { ClassData, ClassLearning, ProjectBundle } from '../core/types.js';
import type { BaseStats, TraitData, SkillData } from '../core/combat-types.js';
import { ActorTraitModal, formatTraitType, formatTraitContent } from './ActorEditorComponents.js';

// ============================================================================
// EXP Curve Calculation (RPG Maker MZ Standard Formula)
// ============================================================================

export function calculateExpForLevel(level: number, expParams: [number, number, number, number]): number {
  if (level <= 1) return 0;
  const [basis, extra, accA, accB] = expParams;
  return Math.round(
    (basis * Math.pow(level - 1, 0.9 + accA / 250) * level * (level + 1)) /
      (6 + Math.pow(level, 2) / 50 / accB) +
      (level - 1) * extra
  );
}

export function calculateTotalExp(level: number, expParams: [number, number, number, number]): number {
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += calculateExpForLevel(l, expParams);
  }
  return total;
}

// ============================================================================
// Parameter Curve Definitions & Generation
// ============================================================================

export interface ParamDefinition {
  name: string;
  shortName: string;
  defaultMin: number;
  defaultMax: number;
  color: string;
  gradientTop: string;
  gradientBottom: string;
}

export const PARAM_DEFINITIONS: ParamDefinition[] = [
  { name: 'Max HP', shortName: 'MHP', defaultMin: 450, defaultMax: 6000, color: '#d86c58', gradientTop: '#e27d6a', gradientBottom: '#b24534' },
  { name: 'Max MP', shortName: 'MMP', defaultMin: 90, defaultMax: 800, color: '#4b80ca', gradientTop: '#5d93dc', gradientBottom: '#2e589e' },
  { name: 'Attack', shortName: 'ATK', defaultMin: 16, defaultMax: 80, color: '#d33955', gradientTop: '#e24a66', gradientBottom: '#9f1f35' },
  { name: 'Defense', shortName: 'DEF', defaultMin: 14, defaultMax: 75, color: '#8ea94d', gradientTop: '#a1be5e', gradientBottom: '#61792a' },
  { name: 'M.Attack', shortName: 'MAT', defaultMin: 10, defaultMax: 65, color: '#b54da3', gradientTop: '#c75fb5', gradientBottom: '#832f74' },
  { name: 'M.Defense', shortName: 'MDF', defaultMin: 10, defaultMax: 65, color: '#3ba25c', gradientTop: '#4cb66f', gradientBottom: '#1e6e37' },
  { name: 'Agility', shortName: 'AGI', defaultMin: 12, defaultMax: 70, color: '#44aedb', gradientTop: '#59bfeb', gradientBottom: '#217a9e' },
  { name: 'Luck', shortName: 'LUK', defaultMin: 10, defaultMax: 65, color: '#d9a334', gradientTop: '#ebb547', gradientBottom: '#9f7218' }
];

export function generateParamCurve(min: number, max: number, curve: number = 0): number[] {
  const result: number[] = [0]; // index 0 unused, index 1..99
  // curve range -10..10. 0 = linear (exponent 1.0)
  const exponent = Math.pow(1.15, curve);
  for (let lvl = 1; lvl <= 99; lvl++) {
    if (lvl === 1) {
      result.push(min);
    } else if (lvl === 99) {
      result.push(max);
    } else {
      const t = (lvl - 1) / 98;
      const factor = Math.pow(t, exponent);
      result.push(Math.round(min + (max - min) * factor));
    }
  }
  return result;
}

export function getDefaultParams(): number[][] {
  return PARAM_DEFINITIONS.map(p => generateParamCurve(p.defaultMin, p.defaultMax, 0));
}

// ============================================================================
// Modal: EXP Curve Modal (RPG Maker MZ)
// ============================================================================

export function ExpCurveModal({
  initialParams,
  onConfirm,
  onClose
}: {
  initialParams: [number, number, number, number];
  onConfirm: (params: [number, number, number, number]) => void;
  onClose: () => void;
}) {
  const [basis, setBasis] = useState(initialParams[0] ?? 30);
  const [extra, setExtra] = useState(initialParams[1] ?? 20);
  const [accA, setAccA] = useState(initialParams[2] ?? 30);
  const [accB, setAccB] = useState(initialParams[3] ?? 30);

  const expParams: [number, number, number, number] = [basis, extra, accA, accB];

  const levelsPreview = useMemo(() => {
    const list: Array<{ level: number; next: number; total: number }> = [];
    let runningTotal = 0;
    for (let l = 1; l <= 99; l++) {
      const nextExp = l === 1 ? calculateExpForLevel(2, expParams) : calculateExpForLevel(l + 1, expParams);
      if (l > 1) {
        runningTotal += calculateExpForLevel(l, expParams);
      }
      list.push({ level: l, next: nextExp, total: runningTotal });
    }
    return list;
  }, [basis, extra, accA, accB]);

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 560, height: 490 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>Pengaturan Kurva EXP (EXP Curve)</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="mz-field-item">
              <span className="mz-field-label">Base Value (10–50): {basis}</span>
              <input
                type="range"
                min={10}
                max={50}
                value={basis}
                onChange={(e) => setBasis(Number(e.target.value))}
              />
            </label>
            <label className="mz-field-item">
              <span className="mz-field-label">Extra Value (10–50): {extra}</span>
              <input
                type="range"
                min={10}
                max={50}
                value={extra}
                onChange={(e) => setExtra(Number(e.target.value))}
              />
            </label>
            <label className="mz-field-item">
              <span className="mz-field-label">Acceleration A (10–50): {accA}</span>
              <input
                type="range"
                min={10}
                max={50}
                value={accA}
                onChange={(e) => setAccA(Number(e.target.value))}
              />
            </label>
            <label className="mz-field-item">
              <span className="mz-field-label">Acceleration B (10–50): {accB}</span>
              <input
                type="range"
                min={10}
                max={50}
                value={accB}
                onChange={(e) => setAccB(Number(e.target.value))}
              />
            </label>

            <div style={{ marginTop: 'auto', padding: 8, background: 'rgba(0,0,0,0.04)', borderRadius: 4, fontSize: 11, color: '#64748b' }}>
              Kurva EXP menentukan total EXP yang dibutuhkan aktor untuk naik level dari Lv 1 sampai 99.
            </div>
          </div>

          {/* Table Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Pratinjau EXP per Level:
            </span>
            <div className="mz-table-container" style={{ flex: 1, maxHeight: 340, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Level</th>
                    <th style={{ width: '35%' }}>Next Level</th>
                    <th style={{ width: '40%' }}>Total EXP</th>
                  </tr>
                </thead>
                <tbody>
                  {levelsPreview.map((item) => (
                    <tr key={item.level}>
                      <td style={{ fontWeight: 600 }}>Lv {item.level}</td>
                      <td>{item.next.toLocaleString()}</td>
                      <td>{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button className="mz-btn-modal-cancel" onClick={onClose}>Batal</button>
          <button className="mz-btn-modal-ok" onClick={() => onConfirm(expParams)}>Terapkan</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Parameter Curve Modal (RPG Maker MZ)
// ============================================================================

export function ParameterCurveModal({
  paramIndex,
  currentValues,
  onConfirm,
  onClose
}: {
  paramIndex: number;
  currentValues: number[];
  onConfirm: (newValues: number[]) => void;
  onClose: () => void;
}) {
  const def = PARAM_DEFINITIONS[paramIndex] || PARAM_DEFINITIONS[0];

  const initialMin = currentValues[1] ?? def.defaultMin;
  const initialMax = currentValues[99] ?? def.defaultMax;

  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);
  const [curve, setCurve] = useState(0);

  const generatedCurve = useMemo(() => {
    return generateParamCurve(minVal, maxVal, curve);
  }, [minVal, maxVal, curve]);

  const handleQuickSetting = (preset: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (preset === 'A') setCurve(6);
    else if (preset === 'B') setCurve(3);
    else if (preset === 'C') setCurve(0);
    else if (preset === 'D') setCurve(-3);
    else if (preset === 'E') setCurve(-6);
  };

  const svgPath = useMemo(() => {
    const width = 280;
    const height = 140;
    const pts: string[] = [];
    const min = Math.min(...generatedCurve.slice(1));
    const max = Math.max(...generatedCurve.slice(1));
    const span = max - min || 1;

    for (let l = 1; l <= 99; l++) {
      const x = ((l - 1) / 98) * width;
      const y = height - ((generatedCurve[l] - min) / span) * (height - 12) - 6;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return {
      line: `M ${pts.join(' L ')}`,
      area: `M 0,${height} L ${pts.join(' L ')} L ${width},${height} Z`
    };
  }, [generatedCurve]);

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 620, height: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>Kurva Parameter: {def.name} ({def.shortName})</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 14 }}>
          {/* Left: Quick Setting, Min/Max Inputs, and Graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Quick Setting */}
            <div className="mz-field-item">
              <span className="mz-field-label">Quick Settings:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['A', 'B', 'C', 'D', 'E'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="mz-btn-small"
                    style={{ flex: 1, padding: '4px 0', fontWeight: 700 }}
                    onClick={() => handleQuickSetting(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Min & Max Values */}
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Level 1:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={1}
                  max={99999}
                  value={minVal}
                  onChange={(e) => setMinVal(Math.max(1, Number(e.target.value)))}
                />
              </label>
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Level 99:</span>
                <input
                  type="number"
                  className="mz-input"
                  min={1}
                  max={99999}
                  value={maxVal}
                  onChange={(e) => setMaxVal(Math.max(1, Number(e.target.value)))}
                />
              </label>
            </div>

            {/* Curve Shape Slider */}
            <label className="mz-field-item">
              <span className="mz-field-label">
                Bentuk Kurva (Growth Curve): {curve > 0 ? `Lambat Awal (+${curve})` : curve < 0 ? `Cepat Awal (${curve})` : 'Standar (0)'}
              </span>
              <input
                type="range"
                min={-8}
                max={8}
                value={curve}
                onChange={(e) => setCurve(Number(e.target.value))}
              />
            </label>

            {/* SVG Visual Graph */}
            <div
              style={{
                width: 280,
                height: 140,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <svg width="280" height="140" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id={`param-grad-${paramIndex}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={def.gradientTop} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={def.gradientBottom} stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <path d={svgPath.area} fill={`url(#param-grad-${paramIndex})`} />
                <path d={svgPath.line} fill="none" stroke="#ffffff" strokeWidth="2" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#475569'
                }}
              >
                Lv 1: {minVal} → Lv 99: {maxVal}
              </div>
            </div>
          </div>

          {/* Right: Table of Values */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Nilai Parameter per Level (1–99):
            </span>
            <div className="mz-table-container" style={{ flex: 1, maxHeight: 350, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Level</th>
                    <th style={{ width: '60%' }}>{def.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 99 }, (_, i) => i + 1).map((lvl) => (
                    <tr key={lvl}>
                      <td style={{ fontWeight: 600 }}>Lv {lvl}</td>
                      <td>{generatedCurve[lvl]?.toLocaleString() ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button className="mz-btn-modal-cancel" onClick={onClose}>Batal</button>
          <button className="mz-btn-modal-ok" onClick={() => onConfirm(generatedCurve)}>Terapkan</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Class Learning Modal (Add / Edit Skill)
// ============================================================================

export function ClassLearningModal({
  initialLearning,
  skills,
  onConfirm,
  onClose
}: {
  initialLearning: ClassLearning | null;
  skills: SkillData[];
  onConfirm: (learning: ClassLearning) => void;
  onClose: () => void;
}) {
  const [level, setLevel] = useState(initialLearning?.level ?? 1);
  const [skillId, setSkillId] = useState(initialLearning?.skillId ?? skills[0]?.id ?? '');
  const [note, setNote] = useState(initialLearning?.note ?? '');

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 420, height: 290 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>{initialLearning ? 'Ubah Skill Belajar' : 'Tambah Skill Belajar'}</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mz-sub-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="mz-field-item">
            <span className="mz-field-label">Level Mempelajari (1–99):</span>
            <input
              type="number"
              className="mz-input"
              min={1}
              max={99}
              value={level}
              onChange={(e) => setLevel(Math.max(1, Math.min(99, Number(e.target.value))))}
            />
          </label>

          <label className="mz-field-item">
            <span className="mz-field-label">Pilih Skill:</span>
            <select
              className="mz-select"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
            >
              {skills.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {String(i + 1).padStart(4, '0')} {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mz-field-item">
            <span className="mz-field-label">Catatan (Note):</span>
            <input
              type="text"
              className="mz-input"
              placeholder="Catatan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="mz-sub-modal-footer">
          <button className="mz-btn-modal-cancel" onClick={onClose}>Batal</button>
          <button
            className="mz-btn-modal-ok"
            onClick={() => onConfirm({ level, skillId, note: note || undefined })}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Form: Class Detail Form (Exact RPG Maker MZ Layout)
// ============================================================================

export function ClassDetailForm({
  cls,
  bundle,
  onUpdate
}: {
  cls: ClassData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [activeParamIndex, setActiveParamIndex] = useState<number | null>(null);
  const [learningModalIndex, setLearningModalIndex] = useState<number | 'new' | null>(null);
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const expParams = cls.expParams || [30, 20, 30, 30];
  const params = useMemo(() => {
    if (Array.isArray(cls.params) && cls.params.length === 8) {
      return cls.params;
    }
    return getDefaultParams();
  }, [cls.params]);

  const learnings = cls.learnings || [];
  const traits = cls.traits || [];
  const growth = (cls.statGrowth || cls.growth || { str: 1, vit: 1 }) as BaseStats;

  // Handlers for Learnings
  const handleConfirmLearning = (learning: ClassLearning) => {
    if (learningModalIndex === 'new') {
      const next = [...learnings, learning].sort((a, b) => a.level - b.level);
      onUpdate({ learnings: next });
    } else if (typeof learningModalIndex === 'number') {
      const next = [...learnings];
      next[learningModalIndex] = learning;
      next.sort((a, b) => a.level - b.level);
      onUpdate({ learnings: next });
    }
    setLearningModalIndex(null);
  };

  const handleDeleteLearning = (index: number) => {
    const next = learnings.filter((_, i) => i !== index);
    onUpdate({ learnings: next });
  };

  // Handlers for Traits
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

  // Handler for Parameter Curve
  const handleConfirmParamCurve = (newCurve: number[]) => {
    if (activeParamIndex === null) return;
    const nextParams = [...params];
    nextParams[activeParamIndex] = newCurve;
    onUpdate({ params: nextParams });
    setActiveParamIndex(null);
  };

  return (
    <div className="mz-class-editor-root">
      <div className="mz-actor-two-column-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: General Settings, Parameter Curves, Learnable Skills */}
        {/* ================================================================= */}
        <div className="mz-actor-col" style={{ flex: 1.15 }}>
          {/* 1. General Settings */}
          <fieldset className="mz-groupbox">
            <legend>General Settings</legend>
            <div className="mz-field-row">
              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">Name:</span>
                <input
                  type="text"
                  className="mz-input"
                  value={cls.name ?? ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                />
              </label>

              <label className="mz-field-item" style={{ flex: 1 }}>
                <span className="mz-field-label">EXP Curve:</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    className="mz-input"
                    readOnly
                    value={`[${expParams.join(', ')}]`}
                    style={{ cursor: 'pointer', background: '#f8fafc' }}
                    onClick={() => setExpModalOpen(true)}
                  />
                  <button
                    type="button"
                    className="mz-btn-small"
                    style={{ padding: '0 8px', fontWeight: 700 }}
                    onClick={() => setExpModalOpen(true)}
                  >
                    ...
                  </button>
                </div>
              </label>
            </div>
          </fieldset>

          {/* 2. Parameter Curves (2x4 Grid ala RPG Maker MZ) */}
          <fieldset className="mz-groupbox">
            <legend>Parameter Curves</legend>
            <div className="mz-param-curves-grid">
              {PARAM_DEFINITIONS.map((def, idx) => {
                const curveVals = params[idx] || generateParamCurve(def.defaultMin, def.defaultMax);
                const min = Math.min(...curveVals.slice(1));
                const max = Math.max(...curveVals.slice(1));
                const span = max - min || 1;

                // Build mini SVG path (width: 74, height: 42)
                const pts: string[] = [];
                for (let l = 1; l <= 99; l++) {
                  const x = ((l - 1) / 98) * 74;
                  const y = 42 - ((curveVals[l] - min) / span) * 36 - 3;
                  pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
                }
                const areaPath = `M 0,42 L ${pts.join(' L ')} L 74,42 Z`;
                const linePath = `M ${pts.join(' L ')}`;

                return (
                  <div
                    key={def.name}
                    className="mz-param-curve-cell"
                    onClick={() => setActiveParamIndex(idx)}
                    title={`Klik untuk mengatur kurva ${def.name}`}
                  >
                    <div className="mz-param-curve-header">{def.name}</div>
                    <div className="mz-param-curve-svg-box">
                      <svg width="100%" height="42" viewBox="0 0 74 42" preserveAspectRatio="none" style={{ display: 'block' }}>
                        <defs>
                          <linearGradient id={`mini-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={def.gradientTop} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={def.gradientBottom} stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill={`url(#mini-grad-${idx})`} />
                        <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="1.2" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* 3. Learnable Skills */}
          <fieldset className="mz-groupbox">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <legend style={{ margin: 0 }}>Learnable Skills</legend>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setLearningModalIndex('new')}
              >
                ＋ Tambah Skill
              </button>
            </div>

            <div className="mz-table-container" style={{ minHeight: 140, maxHeight: 220, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Level</th>
                    <th style={{ width: '48%' }}>Skill</th>
                    <th style={{ width: '22%' }}>Note</th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {learnings.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 12 }}>
                        Belum ada skill yang dipelajari. Klik ＋ Tambah Skill.
                      </td>
                    </tr>
                  ) : (
                    learnings.map((lrn, idx) => {
                      const skillObj = bundle.game.skills.find(s => s.id === lrn.skillId);
                      const skillName = skillObj?.name || lrn.skillId;
                      return (
                        <tr
                          key={idx}
                          className="mz-table-clickable-row"
                          onClick={() => setLearningModalIndex(idx)}
                          title="Klik untuk mengubah skill belajar"
                        >
                          <td style={{ fontWeight: 600 }}>Lv {lrn.level}</td>
                          <td>{skillName}</td>
                          <td style={{ color: '#64748b' }}>{lrn.note || ''}</td>
                          <td>
                            <button
                              type="button"
                              className="mz-btn-del-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLearning(idx);
                              }}
                              title="Hapus skill belajar"
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
          </fieldset>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Traits, Note                                        */}
        {/* ================================================================= */}
        <div className="mz-actor-col" style={{ flex: 0.85 }}>
          {/* 1. Traits Card */}
          <fieldset className="mz-groupbox" style={{ flex: 1 }}>
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

            <div className="mz-table-container" style={{ minHeight: 240, maxHeight: 310, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Type</th>
                    <th style={{ width: '54%' }}>Content</th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {traits.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: 16 }}>
                        Tidak ada ciri khusus (traits). Klik ＋ Tambah Trait.
                      </td>
                    </tr>
                  ) : (
                    traits.map((trait, idx) => (
                      <tr
                        key={idx}
                        className="mz-table-clickable-row"
                        onClick={() => setTraitModalIndex(idx)}
                        title="Klik untuk mengubah trait"
                      >
                        <td className="mz-td-type">{formatTraitType(trait)}</td>
                        <td className="mz-td-content">{formatTraitContent(trait, bundle.game)}</td>
                        <td>
                          <button
                            type="button"
                            className="mz-btn-del-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrait(idx);
                            }}
                            title="Hapus trait"
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
              rows={4}
              value={cls.note ?? ''}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="Catatan pengembang atau metadata plugin..."
            />
          </fieldset>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ACCORDION: Advanced Core Parameters (NUSV Engine Compatibility)   */}
      {/* ================================================================= */}
      <div className="mz-advanced-accordion" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>{showAdvanced ? '▼' : '►'} Advanced / NUSV Core Combat Parameters & Growth</span>
          <small style={{ color: '#64748b' }}>
            {showAdvanced ? 'Sembunyikan' : 'Klik untuk melihat ID, Tier, dan Pertumbuhan Stat Dasar'}
          </small>
        </button>
        {showAdvanced && (
          <div className="mz-accordion-body">
            <div className="mz-form-row">
              <label className="mz-form-field">
                <span>ID Kelas</span>
                <input
                  type="text"
                  value={cls.id ?? ''}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>
              <label className="mz-form-field">
                <span>Tier (1–5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={cls.tier ?? 1}
                  onChange={(e) => onUpdate({ tier: Number(e.target.value) })}
                />
              </label>
            </div>

            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                Pertumbuhan Stat Dasar per Level (Base Stat Growth):
              </span>
              <div className="mz-stats-grid" style={{ marginTop: 6 }}>
                {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as Array<keyof BaseStats>).map((st) => (
                  <label key={st} className="mz-stat-cell">
                    <span>+{st.toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      value={growth[st] ?? 0}
                      onChange={(e) => {
                        const nextGrowth = { ...growth, [st]: Number(e.target.value) };
                        onUpdate({ growth: nextGrowth, statGrowth: nextGrowth });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* POPUP SUB-MODALS                                                  */}
      {/* ================================================================= */}
      {expModalOpen && (
        <ExpCurveModal
          initialParams={expParams}
          onConfirm={(newParams) => {
            onUpdate({ expParams: newParams });
            setExpModalOpen(false);
          }}
          onClose={() => setExpModalOpen(false)}
        />
      )}

      {activeParamIndex !== null && (
        <ParameterCurveModal
          paramIndex={activeParamIndex}
          currentValues={params[activeParamIndex] || generateParamCurve(PARAM_DEFINITIONS[activeParamIndex].defaultMin, PARAM_DEFINITIONS[activeParamIndex].defaultMax)}
          onConfirm={handleConfirmParamCurve}
          onClose={() => setActiveParamIndex(null)}
        />
      )}

      {learningModalIndex !== null && (
        <ClassLearningModal
          initialLearning={learningModalIndex === 'new' ? null : learnings[learningModalIndex]}
          skills={bundle.game.skills}
          onConfirm={handleConfirmLearning}
          onClose={() => setLearningModalIndex(null)}
        />
      )}

      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={traitModalIndex === 'new' ? null : traits[traitModalIndex]}
          bundle={bundle}
          onConfirm={handleConfirmTrait}
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}
