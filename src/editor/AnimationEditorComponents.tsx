import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { collectAnimationFrameEvents, computeAnimationDurationFrames } from '../core/animations.js';
import type {
  AnimationData,
  AnimationSoundTiming,
  AnimationFlashTiming,
  AnimationRotation,
  ProjectBundle
} from '../core/types.js';
import { AudioManager } from '../runtime/AudioManager.js';
import { EffekseerViewport } from '../runtime/EffekseerBackend.js';

// Standard Effekseer effect names shipped with MZ and in assets/effects/
export const STANDARD_EFFECT_NAMES = [
  'Absorb',
  'ArrowSpecial',
  'BallsOfLight',
  'Bind',
  'Blind',
  'Bodyslam',
  'Breath',
  'ClawEffect',
  'ClawFire',
  'ClawIce',
  'ClawPhysical',
  'ClawSpecial',
  'ClawThunder',
  'Confusion',
  'CureAll1',
  'CureAll2',
  'CureOne1',
  'CureOne2',
  'DarknessAll1',
  'DarknessAll2',
  'DarknessAll3',
  'DarknessOne1',
  'DarknessOne2',
  'Death',
  'EarthAll1',
  'EarthAll2',
  'EarthAll3',
  'EarthOne1',
  'EarthOne2',
  'FireAll1',
  'FireAll2',
  'FireAll3',
  'FireOne1',
  'FireOne2',
  'Flash',
  'Fog',
  'GeneralSpecial1',
  'GeneralSpecial2',
  'HealAll1',
  'HealAll2',
  'HealOne1',
  'HealOne2',
  'HitEffect',
  'HitFire',
  'HitIce',
  'HitPhysical',
  'HitSpecial1',
  'HitSpecial2',
  'HitThunder',
  'IceAll1',
  'IceAll2',
  'IceAll3',
  'IceOne1',
  'IceOne2',
  'LaserAll',
  'LaserOne',
  'LightAll1',
  'LightAll2',
  'LightAll3',
  'LightOne1',
  'LightOne2',
  'LightPillar1',
  'LightPillar2',
  'NeutralAll1',
  'NeutralAll2',
  'NeutralAll3',
  'NeutralOne1',
  'NeutralOne2',
  'Paralyze',
  'PierceEffect',
  'PierceFire',
  'PierceIce',
  'PiercePhysical',
  'PierceSpecial1',
  'PierceSpecial2',
  'PierceThunder',
  'Poison',
  'Pollen',
  'Powerdown1',
  'Powerdown2',
  'Powerdown3',
  'Powerup1',
  'Powerup2',
  'Powerup3',
  'Radiation',
  'Revive1',
  'Revive2',
  'ShootAll',
  'ShootBarrage',
  'ShootNormal',
  'ShootSpecial',
  'Shout',
  'Silence',
  'SlashEffect',
  'SlashFire',
  'SlashIce',
  'SlashPhysical',
  'SlashSpecial1',
  'SlashSpecial2',
  'SlashSpecial3',
  'SlashThunder',
  'Sleep',
  'Song',
  'SonicWave',
  'Sweep',
  'ThunderAll1',
  'ThunderAll2',
  'ThunderAll3',
  'ThunderOne1',
  'ThunderOne2',
  'WaterAll1',
  'WaterAll2',
  'WaterAll3',
  'WaterOne1',
  'WaterOne2',
  'WindAll1',
  'WindAll2',
  'WindAll3',
  'WindOne1',
  'WindOne2'
];

export const STANDARD_SE_NAMES = [
  'Absorb1', 'Absorb2', 'Applause1', 'Applause2', 'Attack1', 'Attack2', 'Attack3',
  'Barrier', 'Battle1', 'Battle2', 'Battle3', 'Bell1', 'Bell2', 'Bite', 'Blind',
  'Blow1', 'Blow2', 'Blow3', 'Blow4', 'Blow5', 'Blow6', 'Blow7', 'Blow8',
  'Book1', 'Bow1', 'Bow2', 'Break', 'Buzzer1', 'Cancel1', 'Cancel2',
  'Chest1', 'Chest2', 'Chime1', 'Chime2', 'Collapse1', 'Collapse2', 'Collapse3', 'Collapse4',
  'Crash', 'Crossbow', 'Cursor1', 'Cursor2', 'Damage1', 'Damage2', 'Damage3', 'Damage4', 'Damage5',
  'Darkness1', 'Darkness2', 'Darkness3', 'Darkness4', 'Darkness5', 'Defeat1', 'Defeat2',
  'Disappear', 'Door1', 'Door2', 'Down1', 'Down2', 'Earth1', 'Earth2', 'Earth3', 'Earth4',
  'Equip1', 'Equip2', 'Equip3', 'Escape', 'Evasion1', 'Evasion2', 'Explosion1', 'Explosion2',
  'Fall', 'Fire1', 'Fire2', 'Fire3', 'Fire4', 'Flash1', 'Flash2', 'Flash3',
  'Heal1', 'Heal2', 'Heal3', 'Heal4', 'Heal5', 'Heal6', 'Heal7',
  'Hit1', 'Hit2', 'Hit3', 'Ice1', 'Ice2', 'Ice3', 'Ice4', 'Item1', 'Item2', 'Item3',
  'Jump1', 'Jump2', 'Key', 'Laser1', 'Laser2', 'Laser3', 'Load', 'Magic1', 'Magic2',
  'Miss', 'Move1', 'Paralyze1', 'Paralyze2', 'Poison', 'Powerup', 'Recovery',
  'Reflection', 'Run', 'Save', 'Shop1', 'Shop2', 'Silence', 'Skill1', 'Skill2', 'Skill3',
  'Slash1', 'Slash2', 'Slash3', 'Slash4', 'Slash5', 'Sleep', 'Stare',
  'Sword1', 'Sword2', 'Sword3', 'Sword4', 'Sword5', 'Thunder1', 'Thunder2', 'Thunder3',
  'Up1', 'Up2', 'Water1', 'Water2', 'Water3', 'Water4', 'Wind1', 'Wind2', 'Wind3'
];

export const STANDARD_BATTLEBACK1 = [
  'Castle1', 'Castle2', 'Castle3', 'Clouds', 'Cobblestones1', 'Cobblestones2',
  'Cobblestones3', 'Cobblestones4', 'Cobblestones5', 'Colosseum', 'Crystal',
  'Cyberspace', 'DecorativeTile1', 'DecorativeTile2', 'DemonCastle1', 'DemonCastle2',
  'DemonCastle3', 'Desert', 'Dirt1', 'Dirt2', 'Forest', 'Grassland', 'Lava1', 'Lava2',
  'PoisonSwamp', 'Room1', 'Room2', 'Room3', 'Sea', 'Ship', 'Snowfield', 'Space',
  'Steppe', 'Volcano', 'Wasteland'
];

export const STANDARD_BATTLEBACK2 = [
  'Castle1', 'Castle2', 'Castle3', 'Cliff', 'Clouds', 'Colosseum', 'Crystal',
  'Cyberspace', 'DemonCastle1', 'DemonCastle2', 'Desert', 'Forest', 'Grassland',
  'Lava', 'Night', 'PoisonSwamp', 'Port', 'Room1', 'Room2', 'Room3', 'Sea', 'Ship',
  'Snowfield', 'Space', 'Town1', 'Town2', 'Volcano', 'Wasteland'
];

const editorAudio = new AudioManager();

function playEditorSe(name: string, volume = 90, pitch = 100, pan = 0) {
  void editorAudio.playSeByName(name, {
    volume: Math.max(0, Math.min(1, volume / 100)),
    pitch,
    pan
  });
}

// ============================================================================
// Modal: Particle Effect Picker
// ============================================================================
export function AnimationEffectPickerModal({
  currentEffect,
  bundle,
  onSelect,
  onClose
}: {
  currentEffect: string;
  bundle: ProjectBundle;
  onSelect: (effectName: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(currentEffect || STANDARD_EFFECT_NAMES[0]);

  // Combine standard effects with any effects found in assets
  const effectList = useMemo(() => {
    const set = new Set<string>(STANDARD_EFFECT_NAMES);
    if (bundle.assets?.assets) {
      for (const a of bundle.assets.assets) {
        if (a.path?.includes('effects/')) {
          const match = a.path.match(/effects\/([^/]+)\.efkefc$/i);
          if (match && match[1]) {
            set.add(match[1]);
          }
        }
      }
    }
    const list = Array.from(set);
    list.sort();
    return list;
  }, [bundle.assets]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return effectList;
    const q = filter.toLowerCase();
    return effectList.filter((e) => e.toLowerCase().includes(q));
  }, [effectList, filter]);

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 440, maxHeight: 520, display: 'flex', flexDirection: 'column' }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Select Particle Effect</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '8px 12px 4px' }}>
          <input
            type="text"
            className="mz-input"
            style={{ width: '100%' }}
            placeholder="Search particle effect..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px', minHeight: 260, maxHeight: 320 }}>
          <div className="mz-table-container" style={{ maxHeight: 310 }}>
            <table className="mz-grid-table">
              <thead>
                <tr>
                  <th>Effect Name</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item}
                    className={`mz-table-clickable-row ${selected === item ? 'mz-selected-row' : ''}`}
                    onClick={() => setSelected(item)}
                    onDoubleClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    style={{ background: selected === item ? '#2563eb' : undefined, color: selected === item ? '#fff' : undefined }}
                  >
                    <td>{item}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td style={{ color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No effects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              if (selected) onSelect(selected);
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Rotation Dialog
// ============================================================================
export function AnimationRotationModal({
  rotation,
  onSave,
  onClose
}: {
  rotation: AnimationRotation;
  onSave: (rot: AnimationRotation) => void;
  onClose: () => void;
}) {
  const [x, setX] = useState(rotation.x || 0);
  const [y, setY] = useState(rotation.y || 0);
  const [z, setZ] = useState(rotation.z || 0);

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 320 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Rotation</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="mz-label">X:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="mz-input"
                style={{ width: 80 }}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
              <input
                type="range"
                min="-360"
                max="360"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div>
            <label className="mz-label">Y:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="mz-input"
                style={{ width: 80 }}
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
              <input
                type="range"
                min="-360"
                max="360"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div>
            <label className="mz-label">Z:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="mz-input"
                style={{ width: 80 }}
                value={z}
                onChange={(e) => setZ(Number(e.target.value))}
              />
              <input
                type="range"
                min="-360"
                max="360"
                value={z}
                onChange={(e) => setZ(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              onSave({ x, y, z });
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Sound Timing Dialog
// ============================================================================
export function AnimationSoundModal({
  timing,
  onSave,
  onClose
}: {
  timing?: AnimationSoundTiming;
  onSave: (timing: AnimationSoundTiming) => void;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState(timing?.frame ?? 1);
  const [seName, setSeName] = useState(timing?.se?.name || 'Blow1');
  const [volume, setVolume] = useState(timing?.se?.volume ?? 90);
  const [pitch, setPitch] = useState(timing?.se?.pitch ?? 100);
  const [pan, setPan] = useState(timing?.se?.pan ?? 0);
  const [filter, setFilter] = useState('');

  const filteredSEs = useMemo(() => {
    if (!filter.trim()) return STANDARD_SE_NAMES;
    const q = filter.toLowerCase();
    return STANDARD_SE_NAMES.filter((s) => s.toLowerCase().includes(q));
  }, [filter]);

  const handleTest = () => {
    playEditorSe(seName, volume, pitch, pan);
  };

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 420 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">SE</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="mz-label" style={{ minWidth: 60 }}>Frame:</label>
            <input
              type="number"
              className="mz-input"
              style={{ width: 80 }}
              min={1}
              max={9999}
              value={frame}
              onChange={(e) => setFrame(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="mz-label">SE File:</label>
              <input
                type="text"
                className="mz-input"
                style={{ width: 140, padding: '2px 4px', fontSize: 11 }}
                placeholder="Search SE..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="mz-table-container" style={{ height: 140, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <tbody>
                  {filteredSEs.map((se) => (
                    <tr
                      key={se}
                      className={`mz-table-clickable-row ${seName === se ? 'mz-selected-row' : ''}`}
                      onClick={() => setSeName(se)}
                      style={{ background: seName === se ? '#2563eb' : undefined, color: seName === se ? '#fff' : undefined }}
                    >
                      <td>{se}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 50px', gap: 8, alignItems: 'center' }}>
            <label className="mz-label">Volume:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{volume}%</span>

            <label className="mz-label">Pitch:</label>
            <input
              type="range"
              min="50"
              max="150"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{pitch}%</span>

            <label className="mz-label">Pan:</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={pan}
              onChange={(e) => setPan(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{pan}</span>
          </div>
        </div>
        <div className="mz-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="mz-btn" onClick={handleTest}>Play SE</button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="mz-btn mz-btn-primary"
              onClick={() => {
                onSave({
                  frame,
                  se: { name: seName, volume, pitch, pan }
                });
                onClose();
              }}
            >
              OK
            </button>
            <button className="mz-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Flash Timing Dialog
// ============================================================================
export function AnimationFlashModal({
  timing,
  onSave,
  onClose
}: {
  timing?: AnimationFlashTiming;
  onSave: (timing: AnimationFlashTiming) => void;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState(timing?.frame ?? 1);
  const [duration, setDuration] = useState(timing?.duration ?? 30);
  const [target, setTarget] = useState(timing?.target ?? 0);
  const [r, setR] = useState(timing?.color?.[0] ?? 255);
  const [g, setG] = useState(timing?.color?.[1] ?? 255);
  const [b, setB] = useState(timing?.color?.[2] ?? 255);
  const [a, setA] = useState(timing?.color?.[3] ?? 255);

  const previewColor = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 380 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Flash Timing</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="mz-label">Frame:</label>
              <input
                type="number"
                className="mz-input"
                style={{ width: '100%' }}
                min={1}
                max={9999}
                value={frame}
                onChange={(e) => setFrame(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="mz-label">Duration:</label>
              <input
                type="number"
                className="mz-input"
                style={{ width: '100%' }}
                min={1}
                max={9999}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div>
            <label className="mz-label">Flash Target:</label>
            <select
              className="mz-select"
              style={{ width: '100%' }}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            >
              <option value={0}>Target</option>
              <option value={1}>Screen</option>
              <option value={2}>Hide Target</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <label className="mz-label">Color:</label>
            <div
              style={{
                width: 36,
                height: 22,
                borderRadius: 3,
                border: '1px solid #475569',
                backgroundColor: previewColor,
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
              }}
            />
            <span style={{ fontSize: 11, color: '#64748b' }}>({r}, {g}, {b}, {a})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', gap: 8, alignItems: 'center' }}>
            <label className="mz-label">Red:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={r}
              onChange={(e) => setR(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{r}</span>

            <label className="mz-label">Green:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={g}
              onChange={(e) => setG(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{g}</span>

            <label className="mz-label">Blue:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{b}</span>

            <label className="mz-label">Alpha:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
            />
            <span style={{ fontSize: 11, textAlign: 'right' }}>{a}</span>
          </div>
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              onSave({
                frame,
                duration,
                target,
                color: [r, g, b, a]
              });
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Change Target Battler
// ============================================================================
export function AnimationTargetModal({
  bundle,
  currentTarget,
  onSelect,
  onClose
}: {
  bundle: ProjectBundle;
  currentTarget: string;
  onSelect: (target: { name: string; isActor: boolean; path: string }) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'enemies' | 'actors'>('enemies');
  const [selected, setSelected] = useState(currentTarget || 'Hi_monster');

  const enemyList = useMemo(() => {
    return bundle.game.enemies.map((e) => ({
      id: e.id,
      name: e.battlerName || e.name || 'Goblin',
      path: e.battlerImage || `assets/sv_enemies/${e.battlerName || e.name}.png`
    }));
  }, [bundle.game.enemies]);

  const actorList = useMemo(() => {
    return bundle.game.actors.map((a) => ({
      id: a.id,
      name: a.battlerName || a.name || 'Actor1_1',
      path: a.battlerImage || `assets/sv_actors/${a.battlerName || 'Actor1_1'}.png`
    }));
  }, [bundle.game.actors]);

  const currentList = tab === 'enemies' ? enemyList : actorList;

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 440 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Change Target</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', padding: '0 12px' }}>
          <button
            className={`mz-tab-btn ${tab === 'enemies' ? 'active' : ''}`}
            onClick={() => setTab('enemies')}
            style={{ padding: '6px 14px', border: 'none', background: tab === 'enemies' ? '#f1f5f9' : 'transparent', fontWeight: 600 }}
          >
            Enemies
          </button>
          <button
            className={`mz-tab-btn ${tab === 'actors' ? 'active' : ''}`}
            onClick={() => setTab('actors')}
            style={{ padding: '6px 14px', border: 'none', background: tab === 'actors' ? '#f1f5f9' : 'transparent', fontWeight: 600 }}
          >
            Actors (SV Battlers)
          </button>
        </div>
        <div style={{ padding: 12 }}>
          <div className="mz-table-container" style={{ maxHeight: 240, overflowY: 'auto' }}>
            <table className="mz-grid-table">
              <thead>
                <tr>
                  <th>Target Name</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((item) => (
                  <tr
                    key={item.id}
                    className={`mz-table-clickable-row ${selected === item.name ? 'mz-selected-row' : ''}`}
                    onClick={() => setSelected(item.name)}
                    style={{ background: selected === item.name ? '#2563eb' : undefined, color: selected === item.name ? '#fff' : undefined }}
                  >
                    <td>{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              const found = currentList.find((i) => i.name === selected) || currentList[0];
              if (found) {
                onSelect({
                  name: found.name,
                  isActor: tab === 'actors',
                  path: found.path
                });
              }
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Change Battleback (scans available battleback images from assets)
// ============================================================================
export function AnimationBattlebackModal({
  currentBb1,
  currentBb2,
  bundle,
  onSelect,
  onClose
}: {
  currentBb1: string;
  currentBb2: string;
  bundle: ProjectBundle;
  onSelect: (bb1: string, bb2: string) => void;
  onClose: () => void;
}) {
  // Scan available battlebacks from asset manifest
  const battlebacks1 = useMemo(() => {
    const set = new Set<string>();
    if (bundle.assets?.assets) {
      for (const a of bundle.assets.assets) {
        if (a.path?.startsWith('assets/battlebacks1/') && a.path.endsWith('.png')) {
          const name = a.path.split('/').pop()?.replace(/\.png$/i, '');
          if (name) set.add(name);
        }
      }
    }
    // Fallback to standard names if no assets found
    if (set.size === 0) {
      STANDARD_BATTLEBACK1.forEach((b) => set.add(b));
    }
    return Array.from(set).sort();
  }, [bundle.assets]);

  const battlebacks2 = useMemo(() => {
    const set = new Set<string>();
    if (bundle.assets?.assets) {
      for (const a of bundle.assets.assets) {
        if (a.path?.startsWith('assets/battlebacks2/') && a.path.endsWith('.png')) {
          const name = a.path.split('/').pop()?.replace(/\.png$/i, '');
          if (name) set.add(name);
        }
      }
    }
    if (set.size === 0) {
      STANDARD_BATTLEBACK2.forEach((b) => set.add(b));
    }
    return Array.from(set).sort();
  }, [bundle.assets]);

  const [bb1, setBb1] = useState(currentBb1 || battlebacks1[0] || 'Grassland');
  const [bb2, setBb2] = useState(currentBb2 || battlebacks2[0] || 'Grassland');

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 440 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Change Battleback</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div className="mz-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="mz-label">Battleback 1:</label>
            <div className="mz-table-container" style={{ height: 220, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <tbody>
                  {battlebacks1.map((b) => (
                    <tr
                      key={b}
                      className={`mz-table-clickable-row ${bb1 === b ? 'mz-selected-row' : ''}`}
                      onClick={() => setBb1(b)}
                      style={{ background: bb1 === b ? '#2563eb' : undefined, color: bb1 === b ? '#fff' : undefined }}
                    >
                      <td>{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <label className="mz-label">Battleback 2:</label>
            <div className="mz-table-container" style={{ height: 220, overflowY: 'auto' }}>
              <table className="mz-grid-table">
                <tbody>
                  {battlebacks2.map((b) => (
                    <tr
                      key={b}
                      className={`mz-table-clickable-row ${bb2 === b ? 'mz-selected-row' : ''}`}
                      onClick={() => setBb2(b)}
                      style={{ background: bb2 === b ? '#2563eb' : undefined, color: bb2 === b ? '#fff' : undefined }}
                    >
                      <td>{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              onSelect(bb1, bb2);
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Form: Animation Detail Form (Exact RPG Maker MZ Layout)
// ============================================================================
export function AnimationDetailForm({
  animation,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  animation: AnimationData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  // Modals
  const [effectModalOpen, setEffectModalOpen] = useState(false);
  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [soundModalIndex, setSoundModalIndex] = useState<number | 'new' | null>(null);
  const [flashModalIndex, setFlashModalIndex] = useState<number | 'new' | null>(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [battlebackModalOpen, setBattlebackModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Selected row indices
  const [selectedSoundIdx, setSelectedSoundIdx] = useState<number | null>(null);
  const [selectedFlashIdx, setSelectedFlashIdx] = useState<number | null>(null);

  // Preview settings
  const [targetName, setTargetName] = useState('Hi_monster');
  const [targetIsActor, setTargetIsActor] = useState(false);
  const [battleback1, setBattleback1] = useState('Grassland');
  const [battleback2, setBattleback2] = useState('Grassland');
  // SV actor preview: cropped single-cell frames (MZ wait row + damage cell)
  const [svIdleFrames, setSvIdleFrames] = useState<string[]>([]);
  const [svIdleStep, setSvIdleStep] = useState(0);
  const [svDamageUrl, setSvDamageUrl] = useState<string>('');

  // Dynamically loaded asset URLs (loaded on demand when not in assetUrlMap)
  const [dynamicUrls, setDynamicUrls] = useState<Record<string, string>>({});

  // Animation Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [previewBackend, setPreviewBackend] = useState<'effekseer' | 'missing' | null>(null);
  const [flashVisual, setFlashVisual] = useState<{ screenColor?: string; flashTarget: boolean; hideTarget: boolean }>({
    flashTarget: false,
    hideTarget: false
  });
  const animFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const effekseerRef = useRef<EffekseerViewport | null>(null);

  // Normalize soundTimings and flashTimings
  const soundTimings: AnimationSoundTiming[] = useMemo(() => {
    return Array.isArray(animation.soundTimings) ? animation.soundTimings : [];
  }, [animation.soundTimings]);

  const flashTimings: AnimationFlashTiming[] = useMemo(() => {
    return Array.isArray(animation.flashTimings) ? animation.flashTimings : [];
  }, [animation.flashTimings]);

  const rotation: AnimationRotation = useMemo(() => {
    return animation.rotation || { x: 0, y: 0, z: 0 };
  }, [animation.rotation]);

  // Load an asset URL on demand via Electron API
  const loadAssetUrl = useCallback(async (path: string) => {
    const api = typeof window !== 'undefined' ? (window as unknown as { nusvEditor?: { readAssetData?: (p: string) => Promise<{ dataUrl?: string } | null> } }).nusvEditor : undefined;
    if (!api?.readAssetData) return undefined;
    const res = await api.readAssetData(path);
    if (res?.dataUrl) {
      setDynamicUrls((prev) => (prev[path] ? prev : { ...prev, [path]: res.dataUrl! }));
      return res.dataUrl;
    }
    return undefined;
  }, []);

  // Asset URLs (with dynamic fallback for on-demand loaded assets)
  const bb1Url =
    assetUrlMap[`assets/battlebacks1/${battleback1}.png`] ||
    dynamicUrls[`assets/battlebacks1/${battleback1}.png`] ||
    assetUrlMap['assets/battlebacks1/Grassland.png'] ||
    dynamicUrls['assets/battlebacks1/Grassland.png'] ||
    '';
  const bb2Url =
    assetUrlMap[`assets/battlebacks2/${battleback2}.png`] ||
    dynamicUrls[`assets/battlebacks2/${battleback2}.png`] ||
    assetUrlMap['assets/battlebacks2/Grassland.png'] ||
    dynamicUrls['assets/battlebacks2/Grassland.png'] ||
    '';

  const targetUrl = useMemo(() => {
    if (targetIsActor) {
      return (
        assetUrlMap[`assets/sv_actors/${targetName}.png`] ||
        dynamicUrls[`assets/sv_actors/${targetName}.png`] ||
        assetUrlMap['assets/sv_actors/Actor1_1.png'] ||
        dynamicUrls['assets/sv_actors/Actor1_1.png'] ||
        ''
      );
    }
    return (
      assetUrlMap[`assets/enemies/${targetName}.png`] ||
      dynamicUrls[`assets/enemies/${targetName}.png`] ||
      assetUrlMap[`assets/sv_enemies/${targetName}.png`] ||
      dynamicUrls[`assets/sv_enemies/${targetName}.png`] ||
      assetUrlMap['assets/enemies/Hi_monster.png'] ||
      dynamicUrls['assets/enemies/Hi_monster.png'] ||
      assetUrlMap['assets/enemies/Goblin.png'] ||
      dynamicUrls['assets/enemies/Goblin.png'] ||
      ''
    );
  }, [targetIsActor, targetName, assetUrlMap, dynamicUrls]);

  // Sprite yang benar-benar dirender di preview: actor SV pakai sel ter-crop
  // (idle loop, atau pose damage saat flash target), enemy memakai gambar utuh.
  const targetSpriteSrc = useMemo(() => {
    if (targetIsActor) {
      if (flashVisual.flashTarget && svDamageUrl) return svDamageUrl;
      if (svIdleFrames.length > 0) return svIdleFrames[svIdleStep];
      return '';
    }
    return targetUrl;
  }, [targetIsActor, targetUrl, svIdleFrames, svIdleStep, svDamageUrl, flashVisual.flashTarget]);

  // Load battleback and target images on demand when they change
  useEffect(() => {
    const b1Path = `assets/battlebacks1/${battleback1}.png`;
    const b2Path = `assets/battlebacks2/${battleback2}.png`;
    const tPath = targetIsActor
      ? `assets/sv_actors/${targetName}.png`
      : `assets/enemies/${targetName}.png`;

    const loadMissing = async () => {
      if (!assetUrlMap[b1Path] && !dynamicUrls[b1Path]) await loadAssetUrl(b1Path);
      if (!assetUrlMap[b2Path] && !dynamicUrls[b2Path]) await loadAssetUrl(b2Path);
      if (!assetUrlMap[tPath] && !dynamicUrls[tPath]) await loadAssetUrl(tPath);
    };
    void loadMissing();
  }, [battleback1, battleback2, targetName, targetIsActor, assetUrlMap, dynamicUrls, loadAssetUrl]);

  // Preview SV actor: crop sel 64x64 dari sheet 9x6 (grid sama seperti TextureManager).
  // Baris 0 = idle (3 frame loop), baris 2 kolom 1 = pose damage (MZ).
  useEffect(() => {
    if (!targetIsActor) {
      setSvIdleFrames([]);
      setSvDamageUrl('');
      return;
    }
    const path = `assets/sv_actors/${targetName}.png`;
    const src = assetUrlMap[path] || dynamicUrls[path];
    if (!src) return;

    let cancelled = false;
    const CELL = 64;
    const COLS = 9;
    const ROWS = 6;

    const crop = (img: HTMLImageElement, col: number, row: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(
        img,
        col * CELL,
        row * CELL,
        CELL,
        CELL,
        0,
        0,
        CELL,
        CELL
      );
      return canvas.toDataURL('image/png');
    };

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const frames: string[] = [];
      for (let col = 0; col < 3; col += 1) {
        frames.push(crop(img, col, 0));
      }
      setSvIdleFrames(frames);
      setSvDamageUrl(crop(img, 1, 2));
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [targetIsActor, targetName, assetUrlMap, dynamicUrls]);

  // Loop idle actor saat preview berjalan.
  useEffect(() => {
    if (!isPlaying || svIdleFrames.length === 0) return;
    const id = window.setInterval(() => {
      setSvIdleStep((step) => (step + 1) % svIdleFrames.length);
    }, 250);
    return () => window.clearInterval(id);
  }, [isPlaying, svIdleFrames.length]);

  // Sound handlers
  const handleSaveSound = (timing: AnimationSoundTiming) => {
    if (soundModalIndex === 'new') {
      const next = [...soundTimings, timing].sort((a, b) => a.frame - b.frame);
      onUpdate({ soundTimings: next });
    } else if (typeof soundModalIndex === 'number') {
      const next = [...soundTimings];
      next[soundModalIndex] = timing;
      next.sort((a, b) => a.frame - b.frame);
      onUpdate({ soundTimings: next });
    }
    setSoundModalIndex(null);
  };

  const handleDeleteSound = (index: number) => {
    onUpdate({ soundTimings: soundTimings.filter((_, i) => i !== index) });
    if (selectedSoundIdx === index) setSelectedSoundIdx(null);
  };

  // Flash handlers
  const handleSaveFlash = (timing: AnimationFlashTiming) => {
    if (flashModalIndex === 'new') {
      const next = [...flashTimings, timing].sort((a, b) => a.frame - b.frame);
      onUpdate({ flashTimings: next });
    } else if (typeof flashModalIndex === 'number') {
      const next = [...flashTimings];
      next[flashModalIndex] = timing;
      next.sort((a, b) => a.frame - b.frame);
      onUpdate({ flashTimings: next });
    }
    setFlashModalIndex(null);
  };

  const handleDeleteFlash = (index: number) => {
    onUpdate({ flashTimings: flashTimings.filter((_, i) => i !== index) });
    if (selectedFlashIdx === index) setSelectedFlashIdx(null);
  };

  // Format Frame column string as #001
  const formatFrameNumber = (frame: number) => {
    return `#${String(frame).padStart(3, '0')}`;
  };

  // Format Flash Color string as (r, g, b, a)
  const formatFlashColor = (color?: [number, number, number, number]) => {
    if (!Array.isArray(color) || color.length < 4) return '(255, 255, 255, 255)';
    return `(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
  };

  // Particle playback loop driven by Effekseer WebGL (.efkefc) with Canvas2D fallback
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentFrame(0);
      setPreviewBackend(null);
      setFlashVisual({ flashTarget: false, hideTarget: false });
      effekseerRef.current?.clear();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
      return;
    }

    setIsPlaying(true);
    const totalFrames = computeAnimationDurationFrames(animation);
    const previewW = glCanvasRef.current?.width ?? 400;
    const previewH = glCanvasRef.current?.height ?? 250;

    let effHandle: { exists: boolean; stop(): void } | null = null;
    if (glCanvasRef.current && animation.displayType !== 0 && animation.effectName) {
      if (!effekseerRef.current) {
        effekseerRef.current = new EffekseerViewport(glCanvasRef.current);
      }
      effHandle = await effekseerRef.current.playAnimation(animation, previewW, previewH, {
        x: previewW / 2,
        y: previewH * 0.52,
        bottomY: previewH - 24
      });
    }
    setPreviewBackend(effHandle ? 'effekseer' : 'missing');

    let elapsedFrames = 0;
    let lastTriggeredFrame = 0;
    let lastTime = performance.now();
    let activeFlashes: Array<{ target: number; color: [number, number, number, number]; remaining: number; total: number }> = [];

    const step = (now: number) => {
      const dtMs = Math.min(50, Math.max(1, now - lastTime));
      lastTime = now;
      const dtFrames = dtMs / (1000 / 60);
      elapsedFrames += dtFrames;

      const intFrame = Math.min(totalFrames, Math.max(1, Math.floor(elapsedFrames) + 1));
      setCurrentFrame(intFrame);

      while (lastTriggeredFrame < intFrame) {
        lastTriggeredFrame++;
        const { sounds, flashes } = collectAnimationFrameEvents(animation, lastTriggeredFrame);
        for (const st of sounds) {
          playEditorSe(st.se.name, st.se.volume ?? 90, st.se.pitch ?? 100, st.se.pan ?? 0);
        }
        for (const ft of flashes) {
          activeFlashes.push({
            target: ft.target ?? 0,
            color: ft.color ?? [255, 255, 255, 255],
            remaining: ft.duration || 1,
            total: ft.duration || 1
          });
        }
      }

      if (effHandle && effekseerRef.current) {
        effekseerRef.current.updateAndDraw(dtFrames, previewW, previewH);
      }

      let screenColor: string | undefined;
      let flashTarget = false;
      let hideTarget = false;
      const nextFlashes: typeof activeFlashes = [];
      for (const fl of activeFlashes) {
        fl.remaining -= dtFrames;
        if (fl.remaining <= 0) continue;
        nextFlashes.push(fl);
        if (fl.target === 2) {
          hideTarget = true;
        } else if (fl.target === 1) {
          const ratio = Math.max(0, fl.remaining / fl.total);
          const [r, g, b, a] = fl.color;
          screenColor = `rgba(${r}, ${g}, ${b}, ${(a / 255) * ratio * 0.65})`;
        } else {
          flashTarget = true;
        }
      }
      activeFlashes = nextFlashes;
      setFlashVisual({ screenColor, flashTarget, hideTarget });

      const effAlive = Boolean(effHandle?.exists);
      const animActive = effHandle ? effAlive : elapsedFrames < totalFrames;
      if (animActive || activeFlashes.length > 0) {
        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        animFrameIdRef.current = null;
        effekseerRef.current?.clear();
        setIsPlaying(false);
        setCurrentFrame(0);
        setPreviewBackend(null);
        setFlashVisual({ flashTarget: false, hideTarget: false });
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [isPlaying, animation]);

  // Clean up animation and Effekseer context on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      effekseerRef.current?.destroy();
      effekseerRef.current = null;
    };
  }, []);

  // Paritas MZ: tidak ada fallback prosedural 2D. Canvas 2D hanya di-clear;
  // visual efek murni dari Effekseer (.efkefc). Jika missing, hanya SE/flash yang jalan.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [isPlaying, currentFrame, animation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Upper Grid: Left Settings & Right Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 12 }}>
        {/* Left Column: General Settings & Particle Effect */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* General Settings */}
          <div className="mz-group-box">
            <span className="mz-group-title">General Settings</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label className="mz-label">Name:</label>
                <input
                  type="text"
                  className="mz-input"
                  style={{ width: '100%' }}
                  value={animation.name || ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                />
              </div>

              <div>
                <label className="mz-label">Display Type:</label>
                <select
                  className="mz-select"
                  style={{ width: '100%' }}
                  value={animation.displayType ?? 1}
                  onChange={(e) => onUpdate({ displayType: Number(e.target.value) })}
                >
                  <option value={0}>None</option>
                  <option value={1}>For each target</option>
                  <option value={2}>For entire screen</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <input
                  type="checkbox"
                  id="alignBottomCheck"
                  checked={!!animation.alignBottom}
                  onChange={(e) => onUpdate({ alignBottom: e.target.checked })}
                />
                <label htmlFor="alignBottomCheck" className="mz-label" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Align Bottom
                </label>
              </div>
            </div>
          </div>

          {/* Particle Effect */}
          <div className="mz-group-box">
            <span className="mz-group-title">Particle Effect</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label className="mz-label">Filename:</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    className="mz-input"
                    style={{ flex: 1 }}
                    readOnly
                    value={animation.effectName || ''}
                  />
                  <button
                    className="mz-btn"
                    style={{ padding: '0 8px' }}
                    onClick={() => setEffectModalOpen(true)}
                  >
                    ...
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="mz-label">Scale:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      className="mz-input"
                      style={{ width: '100%' }}
                      min={10}
                      max={1000}
                      step={10}
                      value={animation.scale ?? 100}
                      onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: 11, color: '#475569' }}>%</span>
                  </div>
                </div>

                <div>
                  <label className="mz-label">Speed:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      className="mz-input"
                      style={{ width: '100%' }}
                      min={10}
                      max={1000}
                      step={10}
                      value={animation.speed ?? 100}
                      onChange={(e) => onUpdate({ speed: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: 11, color: '#475569' }}>%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mz-label">Rotation:</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    className="mz-input"
                    style={{ flex: 1 }}
                    readOnly
                    value={`X:${rotation.x || 0}, Y:${rotation.y || 0}, Z:${rotation.z || 0}`}
                  />
                  <button
                    className="mz-btn"
                    style={{ padding: '0 8px' }}
                    onClick={() => setRotationModalOpen(true)}
                  >
                    ...
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="mz-label">Offset X:</label>
                  <input
                    type="number"
                    className="mz-input"
                    style={{ width: '100%' }}
                    value={animation.offsetX ?? 0}
                    onChange={(e) => onUpdate({ offsetX: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="mz-label">Offset Y:</label>
                  <input
                    type="number"
                    className="mz-input"
                    style={{ width: '100%' }}
                    value={animation.offsetY ?? 0}
                    onChange={(e) => onUpdate({ offsetY: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview Area */}
        <div className="mz-group-box" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="mz-group-title">Preview</span>

          {/* Preview Viewport Canvas Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 250,
              border: '1px solid #64748b',
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Battleback 1 */}
            {bb1Url && (
              <img
                src={bb1Url}
                alt="Battleback 1"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Battleback 2 */}
            {bb2Url && (
              <img
                src={bb2Url}
                alt="Battleback 2"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Target Battler Sprite */}
            {targetSpriteSrc && (
              <div
                style={{
                  position: 'absolute',
                  bottom: animation.alignBottom ? 20 : '25%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              >
                <img
                  src={targetSpriteSrc}
                  alt={targetName}
                  style={{
                    maxHeight: 160,
                    maxWidth: 200,
                    imageRendering: targetIsActor ? 'pixelated' : undefined,
                    opacity: flashVisual.hideTarget ? 0 : 1,
                    filter: flashVisual.flashTarget ? 'brightness(2.0)' : undefined,
                    transition: 'filter 0.05s ease-out'
                  }}
                />
              </div>
            )}

            {/* WebGL Canvas for Effekseer (.efkefc) Rendering */}
            <canvas
              ref={glCanvasRef}
              width={400}
              height={250}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 3,
                pointerEvents: 'none'
              }}
            />

            {/* 2D Canvas (clear-only, paritas MZ: tanpa gambar prosedural) */}
            <canvas
              ref={canvasRef}
              width={400}
              height={250}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 3,
                pointerEvents: 'none'
              }}
            />

            {/* Screen Flash Overlay */}
            {flashVisual.screenColor && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: flashVisual.screenColor,
                  zIndex: 4,
                  pointerEvents: 'none',
                  mixBlendMode: 'screen',
                  transition: 'opacity 0.05s ease-out'
                }}
              />
            )}

            {/* Play head / Frame indicator */}
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: 3,
                  fontSize: 10,
                  zIndex: 5,
                  fontFamily: 'monospace'
                }}
              >
                Frame: #{String(currentFrame).padStart(3, '0')} ({previewBackend === 'effekseer' ? 'Effekseer' : 'No Effect'})
              </div>
            )}
          </div>

          {/* Controls under Preview Canvas */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="mz-btn mz-btn-primary"
              style={{ minWidth: 80 }}
              onClick={handlePlay}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <button
              className="mz-btn"
              style={{ flex: 1 }}
              onClick={() => setTargetModalOpen(true)}
            >
              Change Target...
            </button>
            <button
              className="mz-btn"
              style={{ flex: 1 }}
              onClick={() => setBattlebackModalOpen(true)}
            >
              Change Battleback...
            </button>
          </div>
        </div>
      </div>

      {/* Lower Grid: Sound Table & Flash Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Sound Group */}
        <div className="mz-group-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="mz-group-title" style={{ margin: 0 }}>Sound</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="mz-btn"
                style={{ padding: '1px 8px', fontSize: 11 }}
                onClick={() => setSoundModalIndex('new')}
              >
                + Add
              </button>
              {selectedSoundIdx !== null && (
                <>
                  <button
                    className="mz-btn"
                    style={{ padding: '1px 8px', fontSize: 11 }}
                    onClick={() => setSoundModalIndex(selectedSoundIdx)}
                  >
                    Edit
                  </button>
                  <button
                    className="mz-btn mz-btn-danger"
                    style={{ padding: '1px 8px', fontSize: 11 }}
                    onClick={() => handleDeleteSound(selectedSoundIdx)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mz-table-container" style={{ height: 160, overflowY: 'auto' }}>
            <table className="mz-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Frame</th>
                  <th style={{ width: '65%' }}>Filename</th>
                </tr>
              </thead>
              <tbody>
                {soundTimings.map((st, idx) => (
                  <tr
                    key={idx}
                    className={`mz-table-clickable-row ${selectedSoundIdx === idx ? 'mz-selected-row' : ''}`}
                    onClick={() => setSelectedSoundIdx(idx)}
                    onDoubleClick={() => setSoundModalIndex(idx)}
                    style={{ background: selectedSoundIdx === idx ? '#e0f2fe' : undefined }}
                  >
                    <td style={{ fontWeight: 600 }}>{formatFrameNumber(st.frame)}</td>
                    <td>{st.se?.name || 'Blow1'}</td>
                  </tr>
                ))}
                {soundTimings.length === 0 && (
                  <tr
                    className="mz-table-empty-row"
                    onClick={() => setSoundModalIndex('new')}
                  >
                    <td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8', padding: '12px 0' }}>
                      Double-click or click + Add to insert sound timing
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flash Group */}
        <div className="mz-group-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="mz-group-title" style={{ margin: 0 }}>Flash</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="mz-btn"
                style={{ padding: '1px 8px', fontSize: 11 }}
                onClick={() => setFlashModalIndex('new')}
              >
                + Add
              </button>
              {selectedFlashIdx !== null && (
                <>
                  <button
                    className="mz-btn"
                    style={{ padding: '1px 8px', fontSize: 11 }}
                    onClick={() => setFlashModalIndex(selectedFlashIdx)}
                  >
                    Edit
                  </button>
                  <button
                    className="mz-btn mz-btn-danger"
                    style={{ padding: '1px 8px', fontSize: 11 }}
                    onClick={() => handleDeleteFlash(selectedFlashIdx)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mz-table-container" style={{ height: 160, overflowY: 'auto' }}>
            <table className="mz-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Frame</th>
                  <th style={{ width: '25%' }}>Duration</th>
                  <th style={{ width: '50%' }}>Color</th>
                </tr>
              </thead>
              <tbody>
                {flashTimings.map((ft, idx) => (
                  <tr
                    key={idx}
                    className={`mz-table-clickable-row ${selectedFlashIdx === idx ? 'mz-selected-row' : ''}`}
                    onClick={() => setSelectedFlashIdx(idx)}
                    onDoubleClick={() => setFlashModalIndex(idx)}
                    style={{ background: selectedFlashIdx === idx ? '#e0f2fe' : undefined }}
                  >
                    <td style={{ fontWeight: 600 }}>{formatFrameNumber(ft.frame)}</td>
                    <td>{ft.duration}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            border: '1px solid #64748b',
                            backgroundColor: ft.color ? `rgba(${ft.color[0]}, ${ft.color[1]}, ${ft.color[2]}, 1)` : '#fff'
                          }}
                        />
                        <span>{formatFlashColor(ft.color)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {flashTimings.length === 0 && (
                  <tr
                    className="mz-table-empty-row"
                    onClick={() => setFlashModalIndex('new')}
                  >
                    <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '12px 0' }}>
                      Double-click or click + Add to insert flash timing
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Accordion for NUSV Core Advanced Settings (Technical ID & Note) */}
      <div className="mz-advanced-accordion">
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Pengaturan Lanjutan (Advanced Settings)</span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mz-accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="mz-label">Technical ID:</label>
              <input
                type="text"
                className="mz-input"
                style={{ width: '100%', maxWidth: 300 }}
                value={animation.id || ''}
                onChange={(e) => onUpdate({ id: e.target.value })}
              />
              <span className="mz-hint" style={{ display: 'block', marginTop: 4 }}>
                ID internal engine untuk animasi (contoh: <code>anim.0001</code> atau <code>1</code>).
              </span>
            </div>

            <div>
              <label className="mz-label">Note (Catatan):</label>
              <textarea
                className="mz-textarea"
                rows={3}
                style={{ width: '100%' }}
                placeholder="Catatan developer untuk animasi ini..."
                value={animation.note || ''}
                onChange={(e) => onUpdate({ note: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {effectModalOpen && (
        <AnimationEffectPickerModal
          currentEffect={animation.effectName || 'HitPhysical'}
          bundle={bundle}
          onSelect={(effectName) => onUpdate({ effectName })}
          onClose={() => setEffectModalOpen(false)}
        />
      )}

      {rotationModalOpen && (
        <AnimationRotationModal
          rotation={rotation}
          onSave={(rot) => onUpdate({ rotation: rot })}
          onClose={() => setRotationModalOpen(false)}
        />
      )}

      {soundModalIndex !== null && (
        <AnimationSoundModal
          timing={typeof soundModalIndex === 'number' ? soundTimings[soundModalIndex] : undefined}
          onSave={handleSaveSound}
          onClose={() => setSoundModalIndex(null)}
        />
      )}

      {flashModalIndex !== null && (
        <AnimationFlashModal
          timing={typeof flashModalIndex === 'number' ? flashTimings[flashModalIndex] : undefined}
          onSave={handleSaveFlash}
          onClose={() => setFlashModalIndex(null)}
        />
      )}

      {targetModalOpen && (
        <AnimationTargetModal
          bundle={bundle}
          currentTarget={targetName}
          onSelect={(t) => {
            setTargetName(t.name);
            setTargetIsActor(t.isActor);
          }}
          onClose={() => setTargetModalOpen(false)}
        />
      )}

      {battlebackModalOpen && (
        <AnimationBattlebackModal
          currentBb1={battleback1}
          currentBb2={battleback2}
          bundle={bundle}
          onSelect={(b1, b2) => {
            setBattleback1(b1);
            setBattleback2(b2);
          }}
          onClose={() => setBattlebackModalOpen(false)}
        />
      )}
    </div>
  );
}
