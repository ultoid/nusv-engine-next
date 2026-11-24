import React, { useState, useMemo } from 'react';
import type {
  ProjectBundle,
  GameData,
  SystemData,
  SystemAudioSettings,
  SystemVehicleImage,
  SystemStartingPosition,
  SystemTitleScreen,
  SystemOptions,
  SystemSvAttackMotion,
  SystemAdvanced
} from '../core/types.js';
import { CharacterPickerModal } from './modals/CharacterPickerModal.js';
import { MapLocationPickerModal } from './modals/MapLocationPickerModal.js';

// Default list of 24 sound effect keys matching RPG Maker MZ
export const DEFAULT_SOUND_TYPES = [
  'Cursor',
  'OK',
  'Cancel',
  'Buzzer',
  'Equip',
  'Save',
  'Load',
  'Battle Start',
  'Escape',
  'Enemy Attack',
  'Enemy Damage',
  'Enemy Collapse',
  'Boss Collapse 1',
  'Boss Collapse 2',
  'Actor Damage',
  'Actor Collapse',
  'Recovery',
  'Miss',
  'Evasion',
  'Magic Evasion',
  'Magic Reflection',
  'Shop',
  'Use Item',
  'Use Skill'
];

export const DEFAULT_BGM_TYPES = [
  { key: 'title', label: 'Title', defaultFile: 'Theme1' },
  { key: 'battle', label: 'Battle', defaultFile: 'Battle1' },
  { key: 'victory', label: 'Victory', defaultFile: 'Victory1' },
  { key: 'defeat', label: 'Defeat', defaultFile: 'Defeat1' },
  { key: 'gameover', label: 'Game Over', defaultFile: 'Gameover1' },
  { key: 'boat', label: 'Boat', defaultFile: 'Ship1' },
  { key: 'ship', label: 'Ship', defaultFile: 'Ship2' },
  { key: 'airship', label: 'Airship', defaultFile: 'Ship3' }
];

export const WEAPON_IMAGES = [
  'None',
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
  'Spear',
  'Book',
  'Custom 1',
  'Custom 2'
];

// ------------------------------------------------------------------------------------------------
// Window Color Modal (RGB tone sliders: -255 to 255)
// ------------------------------------------------------------------------------------------------

interface WindowColorModalProps {
  initialTone: [number, number, number, number?];
  onSave: (tone: [number, number, number, number?]) => void;
  onClose: () => void;
}

export function WindowColorModal({ initialTone, onSave, onClose }: WindowColorModalProps) {
  const [r, setR] = useState(initialTone[0] ?? 0);
  const [g, setG] = useState(initialTone[1] ?? 0);
  const [b, setB] = useState(initialTone[2] ?? 0);

  // Compute CSS preview color from window tone (-255..255) offset around base gray (128)
  const previewR = Math.max(0, Math.min(255, 128 + r));
  const previewG = Math.max(0, Math.min(255, 128 + g));
  const previewB = Math.max(0, Math.min(255, 128 + b));

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Window Color</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            {/* Color preview swatch with checkered border */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 4,
                border: '2px solid #5a6e85',
                backgroundColor: `rgb(${previewR}, ${previewG}, ${previewB})`,
                boxShadow: 'inset 0 0 16px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)'
              }}
            >
              Window
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ color: '#ef4444' }}>Red:</span>
                  <span>{r}</span>
                </div>
                <input
                  type="range"
                  min={-255}
                  max={255}
                  value={r}
                  onChange={(e) => setR(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ color: '#22c55e' }}>Green:</span>
                  <span>{g}</span>
                </div>
                <input
                  type="range"
                  min={-255}
                  max={255}
                  value={g}
                  onChange={(e) => setG(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ color: '#3b82f6' }}>Blue:</span>
                  <span>{b}</span>
                </div>
                <input
                  type="range"
                  min={-255}
                  max={255}
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={() => { onSave([r, g, b]); onClose(); }}>
            OK
          </button>
          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// System Audio Modal (BGM, ME, SE Picker + Volume, Pitch, Pan)
// ------------------------------------------------------------------------------------------------

interface SystemAudioModalProps {
  title: string;
  category: 'bgm' | 'me' | 'se';
  initialAudio?: SystemAudioSettings;
  assetUrlMap: Record<string, string>;
  onSave: (audio: SystemAudioSettings) => void;
  onClose: () => void;
}

export function SystemAudioModal({
  title,
  category,
  initialAudio,
  assetUrlMap,
  onSave,
  onClose
}: SystemAudioModalProps) {
  const [name, setName] = useState<string>(initialAudio?.name || '');
  const [volume, setVolume] = useState<number>(initialAudio?.volume ?? 90);
  const [pitch, setPitch] = useState<number>(initialAudio?.pitch ?? 100);
  const [pan, setPan] = useState<number>(initialAudio?.pan ?? 0);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Filter available audio assets in the project
  const availableFiles = useMemo(() => {
    const prefix = `assets/audio/${category}/`;
    const files = Object.keys(assetUrlMap)
      .filter((k) => k.toLowerCase().startsWith(prefix))
      .map((k) => k.replace(prefix, '').replace(/\.(ogg|m4a|mp3|wav)$/i, ''));

    // Common fallback names if project assets are sparse
    const defaults =
      category === 'bgm'
        ? ['Theme1', 'Battle1', 'Field1', 'Ship1', 'Ship2', 'Ship3']
        : category === 'me'
        ? ['Victory1', 'Defeat1', 'Gameover1', 'Item1']
        : [
            'Cursor3',
            'Decision2',
            'Cancel2',
            'Buzzer1',
            'Equip1',
            'Save2',
            'Load2',
            'Battle1',
            'Run',
            'Attack3',
            'Damage4',
            'Collapse1',
            'Collapse2',
            'Collapse3',
            'Damage5',
            'Collapse4',
            'Recovery',
            'Miss',
            'Evasion1',
            'Evasion2',
            'Reflection',
            'Shop1',
            'Item1',
            'Skill1'
          ];

    return Array.from(new Set(['(None)', ...files, ...defaults]));
  }, [category, assetUrlMap]);

  const handlePlay = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
    if (!name || name === '(None)') return;

    // Find actual audio url
    const prefix = `assets/audio/${category}/`;
    const matchedKey = Object.keys(assetUrlMap).find(
      (k) => k.toLowerCase().includes(name.toLowerCase()) && k.toLowerCase().startsWith(prefix)
    );
    const audioUrl = matchedKey ? assetUrlMap[matchedKey] : undefined;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = Math.max(0, Math.min(1, volume / 100));
      audio.playbackRate = Math.max(0.5, Math.min(2, pitch / 100));
      audio.play().catch(() => {});
      setPlayingAudio(audio);
    }
  };

  const handleStop = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
  };

  const handleApply = () => {
    handleStop();
    onSave({
      name: name === '(None)' ? '' : name,
      volume,
      pitch,
      pan
    });
    onClose();
  };

  return (
    <div className="mv-modal-backdrop" onClick={() => { handleStop(); onClose(); }}>
      <div className="mv-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>{title}</span>
          <button className="mv-modal-close" onClick={() => { handleStop(); onClose(); }}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>
                File:
              </div>
              <div
                style={{
                  height: 220,
                  overflowY: 'auto',
                  border: '1px solid #c9d2de',
                  borderRadius: 4,
                  background: '#fff',
                  padding: 4
                }}
              >
                {availableFiles.map((file) => (
                  <div
                    key={file}
                    onClick={() => setName(file)}
                    onDoubleClick={() => { setName(file); handlePlay(); }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 3,
                      background: name === file ? '#0078d7' : 'transparent',
                      color: name === file ? '#fff' : '#1e293b'
                    }}
                  >
                    🎵 {file}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <button
                  type="button"
                  className="primary"
                  style={{ flex: 1, padding: '6px 8px', fontSize: 12 }}
                  onClick={handlePlay}
                >
                  ▶ Play
                </button>
                <button
                  type="button"
                  style={{ flex: 1, padding: '6px 8px', fontSize: 12 }}
                  onClick={handleStop}
                >
                  ■ Stop
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>Volume:</span>
                  <span>{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>Pitch:</span>
                  <span>{pitch}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>Pan:</span>
                  <span>{pan}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={pan}
                  onChange={(e) => setPan(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={handleApply}>OK</button>
          <button onClick={() => { handleStop(); onClose(); }}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Title Screen Modal (Title1 & Title2 picker)
// ------------------------------------------------------------------------------------------------

interface TitleScreenModalProps {
  initialTitle1?: string;
  initialTitle2?: string;
  assetUrlMap: Record<string, string>;
  onSave: (title1: string, title2?: string) => void;
  onClose: () => void;
}

export function TitleScreenModal({
  initialTitle1 = 'Ruins',
  initialTitle2 = '',
  assetUrlMap,
  onSave,
  onClose
}: TitleScreenModalProps) {
  const [t1, setT1] = useState(initialTitle1);
  const [t2, setT2] = useState(initialTitle2);

  const title1Options = useMemo(() => {
    const files = Object.keys(assetUrlMap)
      .filter((k) => k.toLowerCase().includes('/titles1/'))
      .map((k) => k.split('/').pop()?.replace('.png', '') || '')
      .filter(Boolean);
    const defaults = ['Ruins', 'Castle', 'Forest', 'Plain', 'Space', 'Night', 'Desert'];
    return Array.from(new Set([...files, ...defaults]));
  }, [assetUrlMap]);

  const title2Options = useMemo(() => {
    const files = Object.keys(assetUrlMap)
      .filter((k) => k.toLowerCase().includes('/titles2/'))
      .map((k) => k.split('/').pop()?.replace('.png', '') || '')
      .filter(Boolean);
    return ['(None)', ...Array.from(new Set(files))];
  }, [assetUrlMap]);

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Title Screen Images</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label className="mz-form-field">
              <span>Title 1 Image:</span>
              <select value={t1} onChange={(e) => setT1(e.target.value)}>
                {title1Options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="mz-form-field">
              <span>Title 2 Image (Frame/Border):</span>
              <select value={t2} onChange={(e) => setT2(e.target.value === '(None)' ? '' : e.target.value)}>
                {title2Options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
          </div>
          {/* Live Title Graphic Preview */}
          <div
            style={{
              width: '100%',
              height: 180,
              borderRadius: 4,
              border: '1px solid #c9d2de',
              backgroundColor: '#1e293b',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: 13
            }}
          >
            🖼 Preview: {t1} {t2 ? `+ ${t2}` : ''}
          </div>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={() => { onSave(t1, t2); onClose(); }}>OK</button>
          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Title Command Window Modal
// ------------------------------------------------------------------------------------------------

interface TitleCommandWindowModalProps {
  initialConfig?: { background?: number; offsetX?: number; offsetY?: number };
  onSave: (config: { background: number; offsetX: number; offsetY: number }) => void;
  onClose: () => void;
}

export function TitleCommandWindowModal({
  initialConfig,
  onSave,
  onClose
}: TitleCommandWindowModalProps) {
  const [background, setBackground] = useState<number>(initialConfig?.background ?? 0);
  const [offsetX, setOffsetX] = useState<number>(initialConfig?.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState<number>(initialConfig?.offsetY ?? 0);

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Command Window</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 14 }}>
          <label className="mz-form-field">
            <span>Background:</span>
            <select value={background} onChange={(e) => setBackground(Number(e.target.value))}>
              <option value={0}>Window</option>
              <option value={1}>Dim</option>
              <option value={2}>Transparent</option>
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="mz-form-field">
              <span>Offset X:</span>
              <input type="number" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} />
            </label>
            <label className="mz-form-field">
              <span>Offset Y:</span>
              <input type="number" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} />
            </label>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={() => { onSave({ background, offsetX, offsetY }); onClose(); }}>OK</button>
          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// SV Attack Motion Modal
// ------------------------------------------------------------------------------------------------

interface SvAttackMotionModalProps {
  weaponTypeName: string;
  initialMotion: number;
  initialWeaponImageId: number;
  onSave: (motion: number, weaponImageId: number) => void;
  onClose: () => void;
}

export function SvAttackMotionModal({
  weaponTypeName,
  initialMotion,
  initialWeaponImageId,
  onSave,
  onClose
}: SvAttackMotionModalProps) {
  const [motion, setMotion] = useState<number>(initialMotion);
  const [weaponImageId, setWeaponImageId] = useState<number>(initialWeaponImageId);

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Attack Motion: {weaponTypeName}</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 14 }}>
          <label className="mz-form-field">
            <span>Motion Type:</span>
            <select value={motion} onChange={(e) => setMotion(Number(e.target.value))}>
              <option value={0}>Thrust</option>
              <option value={1}>Swing</option>
              <option value={2}>Missile</option>
            </select>
          </label>
          <label className="mz-form-field">
            <span>Weapon Image:</span>
            <select value={weaponImageId} onChange={(e) => setWeaponImageId(Number(e.target.value))}>
              {WEAPON_IMAGES.map((wName, idx) => (
                <option key={idx} value={idx}>{idx}: {wName}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={() => { onSave(motion, weaponImageId); onClose(); }}>OK</button>
          <button onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// System 1 Form Component (Matches media_1795528228221_2722a959.jpg)
// ------------------------------------------------------------------------------------------------

export function System1Editor({
  bundle,
  onUpdateProject,
  onUpdateGame,
  assetUrlMap
}: {
  bundle: ProjectBundle;
  onUpdateProject: (patch: Partial<ProjectBundle['project']>) => void;
  onUpdateGame: (patch: Partial<GameData>) => void;
  assetUrlMap: Record<string, string>;
}) {
  const project = bundle.project;
  const game = bundle.game;
  const system: SystemData = useMemo(() => game.system || {}, [game.system]);
  const actors = game.actors || [];

  // Active Modals
  const [windowColorModalOpen, setWindowColorModalOpen] = useState(false);
  const [audioModal, setAudioModal] = useState<{
    open: boolean;
    title: string;
    category: 'bgm' | 'me' | 'se';
    key: string;
    current?: SystemAudioSettings;
  }>({ open: false, title: '', category: 'bgm', key: '' });
  const [characterModal, setCharacterModal] = useState<{
    open: boolean;
    vehicleType: 'boat' | 'ship' | 'airship';
  }>({ open: false, vehicleType: 'boat' });
  const [mapLocationModal, setMapLocationModal] = useState<{
    open: boolean;
    target: 'player' | 'boat' | 'ship' | 'airship';
    initialMapId?: string;
    initialX?: number;
    initialY?: number;
  }>({ open: false, target: 'player' });
  const [titleScreenModalOpen, setTitleScreenModalOpen] = useState(false);
  const [titleCommandModalOpen, setTitleCommandModalOpen] = useState(false);

  // Accordion state
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Synchronize updates both to game.system and project manifest
  const updateSystem = (patch: Partial<SystemData>) => {
    const nextSystem = { ...system, ...patch };
    onUpdateGame({ system: nextSystem });

    // Also mirror top-level fields on project if changed
    const projectPatch: Partial<ProjectBundle['project']> = {};
    if (patch.gameTitle !== undefined) projectPatch.title = patch.gameTitle;
    if (patch.partyMembers !== undefined) projectPatch.party = patch.partyMembers;
    if (patch.currencyUnit !== undefined) (projectPatch as Record<string, unknown>).currency = patch.currencyUnit;
    if (patch.windowTone !== undefined) (projectPatch as Record<string, unknown>).windowTone = patch.windowTone;
    if (patch.startPositions?.player) projectPatch.start = patch.startPositions.player;
    if (Object.keys(projectPatch).length > 0) {
      onUpdateProject(projectPatch);
    }
  };

  // State values with fallbacks
  const gameTitle = system.gameTitle ?? project.title ?? '';
  const party = system.partyMembers ?? project.party ?? [];
  const currency = system.currencyUnit ?? (project as Record<string, unknown>).currency ?? 'G';
  const windowTone: [number, number, number, number?] = Array.isArray(system.windowTone)
    ? (system.windowTone as [number, number, number, number?])
    : Array.isArray((project as Record<string, unknown>).windowTone)
    ? ((project as Record<string, unknown>).windowTone as [number, number, number, number?])
    : [0, 0, 0];
  const boat = system.boat ?? { characterName: 'Vehicle', characterIndex: 0 };
  const ship = system.ship ?? { characterName: 'Vehicle', characterIndex: 1 };
  const airship = system.airship ?? { characterName: 'Vehicle', characterIndex: 2 };

  const startPositions = system.startPositions ?? {
    player: project.start,
    boat: null,
    ship: null,
    airship: null
  };

  const titleScreen: SystemTitleScreen = system.titleScreen ?? {
    title1Name: (project as Record<string, unknown>).titleImage
      ? String((project as Record<string, unknown>).titleImage).split('/').pop()?.replace('.png', '') || 'Ruins'
      : 'Ruins',
    drawTitle: true,
    commandWindow: { background: 0, offsetX: 0, offsetY: 0 }
  };

  const battleSystem = system.battleSystem ?? 0; // 0: Turn-based, 1: TP Active, 2: TP Wait
  const options: SystemOptions = system.options ?? {
    optFollowers: true,
    optDisplayTp: true,
    optAutosave: true
  };

  const sounds = system.sounds ?? {};
  const bgm = system.bgm ?? {};

  // Party handlers
  const handleAddParty = () => {
    if (party.length >= 4) return;
    const available = actors.find((a) => !party.includes(a.id));
    if (available) {
      const nextParty = [...party, available.id];
      updateSystem({ partyMembers: nextParty });
    }
  };

  const handleRemoveParty = (index: number) => {
    if (party.length <= 1) return;
    const nextParty = party.filter((_, i) => i !== index);
    updateSystem({ partyMembers: nextParty });
  };

  const handleChangePartySlot = (index: number, actorId: string) => {
    const nextParty = [...party];
    nextParty[index] = actorId;
    updateSystem({ partyMembers: nextParty });
  };

  // Checkered window tone RGB preview
  const prevR = Math.max(0, Math.min(255, 128 + (windowTone[0] ?? 0)));
  const prevG = Math.max(0, Math.min(255, 128 + (windowTone[1] ?? 0)));
  const prevB = Math.max(0, Math.min(255, 128 + (windowTone[2] ?? 0)));

  return (
    <section className="mz-db-content mz-db-system-pane" style={{ padding: 12 }}>
      {/* 3-Column Grid Layout matching RPG Maker MZ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: 12 }}>
        {/* =========================================================================
            COLUMN 1 (Left): Game Title, Starting Party, Currency, Window Color,
                            Vehicle Images, Starting Positions
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Game Title */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Game Title
            </span>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => updateSystem({ gameTitle: e.target.value })}
              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
            />
          </div>

          {/* Starting Party + Currency & Window Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
            {/* Starting Party List */}
            <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Starting Party</span>
                <button
                  type="button"
                  className="mz-btn-small"
                  disabled={party.length >= 4}
                  onClick={handleAddParty}
                  title="Tambah Anggota Party"
                  style={{ padding: '2px 6px', fontSize: 10 }}
                >
                  ＋
                </button>
              </div>
              <div
                style={{
                  height: 110,
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: 3,
                  background: '#fff',
                  padding: 2
                }}
              >
                {party.map((actId, idx) => {
                  const act = actors.find((a) => a.id === actId);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '3px 6px',
                        fontSize: 11,
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <select
                        value={actId}
                        onChange={(e) => handleChangePartySlot(idx, e.target.value)}
                        style={{ border: 'none', background: 'transparent', flex: 1, fontSize: 11, outline: 'none' }}
                      >
                        {actors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      {party.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParty(idx)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '0 2px'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Currency & Window Color */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="mz-form-card" style={{ padding: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 2 }}>
                  Currency
                </span>
                <input
                  type="text"
                  value={String(currency)}
                  onChange={(e) => updateSystem({ currencyUnit: e.target.value })}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 11 }}
                />
              </div>

              <div className="mz-form-card" style={{ padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4, width: '100%' }}>
                  Window Color
                </span>
                <div
                  onClick={() => setWindowColorModalOpen(true)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 3,
                    border: '1px solid #64748b',
                    backgroundColor: `rgb(${prevR}, ${prevG}, ${prevB})`,
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 10,
                    textShadow: '0 1px 2px #000'
                  }}
                  title="Klik untuk ubah Window Color"
                >
                  RGB ({windowTone[0]},{windowTone[1]},{windowTone[2]})
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Images */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Vehicle Images
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              {(['boat', 'ship', 'airship'] as const).map((veh) => {
                const vehData = veh === 'boat' ? boat : veh === 'ship' ? ship : airship;
                const charFile = vehData.characterName ? `assets/characters/${vehData.characterName}.png` : '';
                const charUrl = assetUrlMap[charFile];
                const charIdx = vehData.characterIndex ?? 0;
                const col = (charIdx % 4) * 3 + 1; // Middle walking frame
                const row = Math.floor(charIdx / 4) * 4 + 0; // Down facing

                return (
                  <div key={veh} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#475569', marginBottom: 2, textTransform: 'capitalize' }}>
                      {veh}:
                    </span>
                    <div
                      onClick={() => setCharacterModal({ open: true, vehicleType: veh })}
                      style={{
                        width: 54,
                        height: 54,
                        border: '1px solid #94a3b8',
                        borderRadius: 3,
                        background: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                      title={`Pilih sprite ${veh}`}
                    >
                      {charUrl ? (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            backgroundImage: `url("${charUrl}")`,
                            backgroundSize: '576px 384px',
                            backgroundPosition: `-${col * 48}px -${row * 48}px`
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 22 }}>
                          {veh === 'boat' ? '⛵' : veh === 'ship' ? '🚢' : '🛸'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Starting Positions */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Starting Positions
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['player', 'boat', 'ship', 'airship'] as const).map((key) => {
                const pos = key === 'player' ? startPositions.player : startPositions[key];
                const label = key === 'player' ? 'Player:' : `${key.charAt(0).toUpperCase() + key.slice(1)}:`;
                const displayVal = pos ? `${pos.mapId} (${pos.x}, ${pos.y})` : 'None';

                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 50, fontSize: 11, color: '#475569' }}>{label}</span>
                    <div
                      style={{
                        flex: 1,
                        padding: '3px 8px',
                        fontSize: 11,
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {displayVal}
                    </div>
                    <button
                      type="button"
                      className="mz-btn-small"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() =>
                        setMapLocationModal({
                          open: true,
                          target: key,
                          initialMapId: pos?.mapId || project.maps[0],
                          initialX: pos?.x ?? 0,
                          initialY: pos?.y ?? 0
                        })
                      }
                    >
                      ...
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2 (Middle): Title Screen, Battle Screen, Battle System, Options
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Title Screen */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Title Screen
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 65, fontSize: 11, color: '#475569' }}>Images:</span>
                <div
                  style={{
                    flex: 1,
                    padding: '3px 8px',
                    fontSize: 11,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 3
                  }}
                >
                  {titleScreen.title1Name || 'Ruins'}
                  {titleScreen.title2Name ? ` (${titleScreen.title2Name})` : ''}
                </div>
                <button
                  type="button"
                  className="mz-btn-small"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setTitleScreenModalOpen(true)}
                >
                  ...
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={titleScreen.drawTitle !== false}
                  onChange={(e) =>
                    updateSystem({
                      titleScreen: { ...titleScreen, drawTitle: e.target.checked }
                    })
                  }
                />
                <span>Draw Game Title</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 95, fontSize: 11, color: '#475569' }}>Command Window:</span>
                <div
                  style={{
                    flex: 1,
                    padding: '3px 8px',
                    fontSize: 11,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 3
                  }}
                >
                  {titleScreen.commandWindow?.background === 1
                    ? 'Dim'
                    : titleScreen.commandWindow?.background === 2
                    ? 'Transparent'
                    : 'Window'}{' '}
                  (X{titleScreen.commandWindow?.offsetX ?? 0 >= 0 ? '+' : ''}
                  {titleScreen.commandWindow?.offsetX ?? 0}, Y
                  {titleScreen.commandWindow?.offsetY ?? 0 >= 0 ? '+' : ''}
                  {titleScreen.commandWindow?.offsetY ?? 0})
                </div>
                <button
                  type="button"
                  className="mz-btn-small"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setTitleCommandModalOpen(true)}
                >
                  ...
                </button>
              </div>
            </div>
          </div>

          {/* Battle Screen (Focused on Side-view as requested) */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Battle Screen
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <input type="radio" checked readOnly style={{ accentColor: '#0078d7' }} />
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Side-view (Active)</span>
            </div>
          </div>

          {/* Battle System */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Battle System
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="battleSystem"
                  checked={battleSystem === 0}
                  onChange={() => updateSystem({ battleSystem: 0 })}
                />
                <span>Turn-based</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="battleSystem"
                  checked={battleSystem === 1}
                  onChange={() => updateSystem({ battleSystem: 1 })}
                />
                <span>Time Progress (Active)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="battleSystem"
                  checked={battleSystem === 2}
                  onChange={() => updateSystem({ battleSystem: 2 })}
                />
                <span>Time Progress (Wait)</span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Options
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
              {[
                { key: 'optTransparent', label: 'Start in Transparent' },
                { key: 'optFollowers', label: 'Show Player Followers' },
                { key: 'optSlipDeath', label: 'Death by Slip Damage' },
                { key: 'optFloorDeath', label: 'Death by Floor Damage' },
                { key: 'optDisplayTp', label: 'Display TP in Window' },
                { key: 'optExtraExp', label: 'EXP for Reserve Members' },
                { key: 'optKeyItemsNumber', label: 'Show the Number of Key Items' },
                { key: 'optAutosave', label: 'Enable Autosave' }
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(options[key as keyof SystemOptions])}
                    onChange={(e) =>
                      updateSystem({
                        options: { ...options, [key]: e.target.checked }
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3 (Right): Music (BGM & ME), Sound (SE)
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Music */}
          <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Music
            </span>
            <div
              style={{
                height: 140,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#fff'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '3px 6px', width: '38%' }}>Type</th>
                    <th style={{ padding: '3px 6px' }}>Filename</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_BGM_TYPES.map(({ key, label, defaultFile }) => {
                    const audio = (bgm as Record<string, SystemAudioSettings>)[key];
                    const filename = audio?.name || defaultFile;

                    return (
                      <tr
                        key={key}
                        onClick={() =>
                          setAudioModal({
                            open: true,
                            title: `Music: ${label}`,
                            category: key === 'victory' || key === 'defeat' || key === 'gameover' ? 'me' : 'bgm',
                            key,
                            current: audio || { name: defaultFile, volume: 90, pitch: 100, pan: 0 }
                          })
                        }
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                        className="mz-table-hover-row"
                      >
                        <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500 }}>{label}</td>
                        <td style={{ padding: '3px 6px', color: '#0f172a' }}>{filename}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sound */}
          <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Sound
            </span>
            <div
              style={{
                height: 240,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#fff'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '3px 6px', width: '45%' }}>Type</th>
                    <th style={{ padding: '3px 6px' }}>Filename</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_SOUND_TYPES.map((seType) => {
                    const audio = sounds[seType];
                    const filename = audio?.name || seType;

                    return (
                      <tr
                        key={seType}
                        onClick={() =>
                          setAudioModal({
                            open: true,
                            title: `Sound: ${seType}`,
                            category: 'se',
                            key: seType,
                            current: audio || { name: seType, volume: 90, pitch: 100, pan: 0 }
                          })
                        }
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                        className="mz-table-hover-row"
                      >
                        <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500 }}>{seType}</td>
                        <td style={{ padding: '3px 6px', color: '#0f172a' }}>{filename}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ACCORDION: Advanced / Non-MZ Engine Settings
         ========================================================================= */}
      <div className="mz-advanced-accordion" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <span>⚙ Pengaturan Lanjutan (Advanced Engine Settings - System 1)</span>
          <span>{advancedOpen ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {advancedOpen && (
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mz-form-field">
              <span>Project ID (Internal):</span>
              <input
                type="text"
                value={project.projectId}
                onChange={(e) => onUpdateProject({ projectId: e.target.value })}
              />
            </label>
            <label className="mz-form-field">
              <span>Logical Resolution (Lebar × Tinggi):</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  value={project.logicalResolution.width}
                  onChange={(e) =>
                    onUpdateProject({
                      logicalResolution: { ...project.logicalResolution, width: Number(e.target.value) }
                    })
                  }
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: 'center' }}>×</span>
                <input
                  type="number"
                  value={project.logicalResolution.height}
                  onChange={(e) =>
                    onUpdateProject({
                      logicalResolution: { ...project.logicalResolution, height: Number(e.target.value) }
                    })
                  }
                  style={{ flex: 1 }}
                />
              </div>
            </label>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {windowColorModalOpen && (
        <WindowColorModal
          initialTone={windowTone}
          onSave={(tone) => updateSystem({ windowTone: tone })}
          onClose={() => setWindowColorModalOpen(false)}
        />
      )}

      {audioModal.open && (
        <SystemAudioModal
          title={audioModal.title}
          category={audioModal.category}
          initialAudio={audioModal.current}
          assetUrlMap={assetUrlMap}
          onSave={(aud) => {
            if (audioModal.category === 'se') {
              updateSystem({ sounds: { ...sounds, [audioModal.key]: aud } });
            } else {
              updateSystem({ bgm: { ...bgm, [audioModal.key]: aud } });
            }
          }}
          onClose={() => setAudioModal({ open: false, title: '', category: 'bgm', key: '' })}
        />
      )}

      {characterModal.open && (
        <CharacterPickerModal
          currentGraphic={{
            characterName:
              characterModal.vehicleType === 'boat'
                ? boat.characterName
                : characterModal.vehicleType === 'ship'
                ? ship.characterName
                : airship.characterName,
            characterIndex:
              characterModal.vehicleType === 'boat'
                ? boat.characterIndex
                : characterModal.vehicleType === 'ship'
                ? ship.characterIndex
                : airship.characterIndex
          }}
          characterOptions={Object.keys(assetUrlMap)
            .filter((k) => k.toLowerCase().includes('/characters/'))
            .map((k) => k.split('/').pop()?.replace('.png', '') || '')}
          assetUrls={assetUrlMap}
          onSelect={(g) => {
            if (g) {
              const vehImg: SystemVehicleImage = {
                characterName: g.characterName || 'Vehicle',
                characterIndex: g.characterIndex || 0
              };
              if (characterModal.vehicleType === 'boat') updateSystem({ boat: vehImg });
              else if (characterModal.vehicleType === 'ship') updateSystem({ ship: vehImg });
              else if (characterModal.vehicleType === 'airship') updateSystem({ airship: vehImg });
            }
            setCharacterModal({ open: false, vehicleType: 'boat' });
          }}
          onClose={() => setCharacterModal({ open: false, vehicleType: 'boat' })}
        />
      )}

      {mapLocationModal.open && (
        <MapLocationPickerModal
          bundle={bundle}
          initialMapId={mapLocationModal.initialMapId}
          initialX={mapLocationModal.initialX}
          initialY={mapLocationModal.initialY}
          assetUrls={assetUrlMap}
          title={`Pilih Posisi ${mapLocationModal.target.toUpperCase()}`}
          onSelect={(mapId, x, y) => {
            const nextStartPositions = { ...startPositions };
            if (mapLocationModal.target === 'player') {
              nextStartPositions.player = { mapId, x, y };
              onUpdateProject({ start: { mapId, x, y } });
            } else {
              nextStartPositions[mapLocationModal.target] = { mapId, x, y };
            }
            updateSystem({ startPositions: nextStartPositions });
            setMapLocationModal({ open: false, target: 'player' });
          }}
          onClose={() => setMapLocationModal({ open: false, target: 'player' })}
        />
      )}

      {titleScreenModalOpen && (
        <TitleScreenModal
          initialTitle1={titleScreen.title1Name}
          initialTitle2={titleScreen.title2Name}
          assetUrlMap={assetUrlMap}
          onSave={(t1, t2) =>
            updateSystem({
              titleScreen: { ...titleScreen, title1Name: t1, title2Name: t2 }
            })
          }
          onClose={() => setTitleScreenModalOpen(false)}
        />
      )}

      {titleCommandModalOpen && (
        <TitleCommandWindowModal
          initialConfig={titleScreen.commandWindow}
          onSave={(cfg) =>
            updateSystem({
              titleScreen: { ...titleScreen, commandWindow: cfg }
            })
          }
          onClose={() => setTitleCommandModalOpen(false)}
        />
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------
// System 2 Form Component (Menu Commands, Item Categories, SV Magic, SV Attack, Advanced Screen)
// ------------------------------------------------------------------------------------------------

export function System2Editor({
  bundle,
  onUpdateProject,
  onUpdateGame
}: {
  bundle: ProjectBundle;
  onUpdateProject: (patch: Partial<ProjectBundle['project']>) => void;
  onUpdateGame: (patch: Partial<GameData>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const project = bundle.project;
  const game = bundle.game;
  const system: SystemData = useMemo(() => game.system || {}, [game.system]);

  // Skill Types & Weapon Types from bundle.game.types
  const skillTypes = game.types?.skillTypes || ['Magic', 'Special'];
  const weaponTypes = game.types?.weaponTypes || [
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

  // System 2 state values with fallbacks
  const menuCommands = system.menuCommands || {
    item: true,
    skill: true,
    equip: true,
    status: true,
    formation: true,
    save: true
  };

  const itemCategories = system.itemCategories || {
    item: true,
    weapon: true,
    armor: true,
    keyItem: true
  };

  const svMagicSkills = system.svMagicSkills || [1]; // Default Skill Type #1 (Magic)
  const svAttackMotions = system.svAttackMotions || [];
  const advanced: SystemAdvanced = system.advanced || {};

  const screenWidth = advanced.screenWidth ?? project.logicalResolution.width ?? 1080;
  const screenHeight = advanced.screenHeight ?? project.logicalResolution.height ?? 720;
  const uiAreaWidth = advanced.uiAreaWidth ?? screenWidth;
  const uiAreaHeight = advanced.uiAreaHeight ?? screenHeight;
  const tileSize = advanced.tileSize ?? 48;
  const mainFontFilename = advanced.mainFontFilename ?? 'mplus-1m-regular.woff';
  const numberFontFilename = advanced.numberFontFilename ?? 'mplus-2p-bold-sub.woff';
  const fallbackFont = advanced.fallbackFont ?? 'sans-serif';
  const fontSize = advanced.fontSize ?? 26;
  const windowOpacity = advanced.windowOpacity ?? 192;

  // Modals & Accordion
  const [attackMotionModal, setAttackMotionModal] = useState<{
    open: boolean;
    wIdx: number;
    wName: string;
    motion: number;
    weaponImageId: number;
  }>({ open: false, wIdx: 0, wName: '', motion: 1, weaponImageId: 0 });

  const [advancedAccordionOpen, setAdvancedAccordionOpen] = useState(false);

  const updateSystem = (patch: Partial<SystemData>) => {
    const nextSystem = { ...system, ...patch };
    onUpdateGame({ system: nextSystem });

    // Synchronize resolution to project logical resolution if updated
    if (patch.advanced?.screenWidth !== undefined || patch.advanced?.screenHeight !== undefined) {
      onUpdateProject({
        logicalResolution: {
          width: patch.advanced.screenWidth ?? project.logicalResolution.width,
          height: patch.advanced.screenHeight ?? project.logicalResolution.height
        }
      });
    }
  };

  // SV Magic Skill toggle handler
  const toggleMagicSkill = (typeId: number) => {
    const isMagic = svMagicSkills.includes(typeId);
    const nextList = isMagic ? svMagicSkills.filter((id) => id !== typeId) : [...svMagicSkills, typeId];
    updateSystem({ svMagicSkills: nextList });
  };

  return (
    <section className="mz-db-content mz-db-system-pane" style={{ padding: 12 }}>
      {/* 3-Column Grid Layout for System 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.3fr', gap: 12 }}>
        {/* =========================================================================
            COLUMN 1: Menu Commands, Item Categories, [SV] Magic Skills
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Menu Commands */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Menu Commands
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              {[
                { key: 'item', label: 'Item' },
                { key: 'skill', label: 'Skill' },
                { key: 'equip', label: 'Equip' },
                { key: 'status', label: 'Status' },
                { key: 'formation', label: 'Formation' },
                { key: 'save', label: 'Save' }
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(menuCommands[key as keyof typeof menuCommands])}
                    onChange={(e) =>
                      updateSystem({
                        menuCommands: { ...menuCommands, [key]: e.target.checked }
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Item Categories */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Item Categories
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              {[
                { key: 'item', label: 'Items' },
                { key: 'weapon', label: 'Weapons' },
                { key: 'armor', label: 'Armors' },
                { key: 'keyItem', label: 'Key Items' }
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(itemCategories[key as keyof typeof itemCategories])}
                    onChange={(e) =>
                      updateSystem({
                        itemCategories: { ...itemCategories, [key]: e.target.checked }
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* [SV] Magic Skills */}
          <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              [SV] Magic Skills
            </span>
            <div
              style={{
                maxHeight: 140,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#fff',
                padding: 4
              }}
            >
              {skillTypes.map((stName, idx) => {
                const typeId = idx + 1;
                const isMagic = svMagicSkills.includes(typeId);
                return (
                  <label
                    key={typeId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      padding: '3px 4px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isMagic}
                      onChange={() => toggleMagicSkill(typeId)}
                    />
                    <span>
                      {String(typeId).padStart(2, '0')} {stName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: [SV] Attack Motions
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              [SV] Attack Motions
            </span>
            <div
              style={{
                flex: 1,
                minHeight: 280,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#fff'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '3px 6px', width: '40%' }}>Weapon Type</th>
                    <th style={{ padding: '3px 6px', width: '28%' }}>Motion</th>
                    <th style={{ padding: '3px 6px' }}>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {weaponTypes.map((wName, idx) => {
                    const wTypeId = idx + 1;
                    const mapping = svAttackMotions.find((m) => Number(m.weaponTypeId) === wTypeId);
                    const motion = mapping?.motion ?? (wName.toLowerCase().includes('bow') || wName.toLowerCase().includes('gun') ? 2 : 1);
                    const weaponImageId = mapping?.weaponImageId ?? Math.min(idx + 1, WEAPON_IMAGES.length - 1);
                    const motionLabel = motion === 0 ? 'Thrust' : motion === 2 ? 'Missile' : 'Swing';
                    const imageName = WEAPON_IMAGES[weaponImageId] || 'None';

                    return (
                      <tr
                        key={wTypeId}
                        onClick={() =>
                          setAttackMotionModal({
                            open: true,
                            wIdx: wTypeId,
                            wName,
                            motion,
                            weaponImageId
                          })
                        }
                        style={{ cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                        className="mz-table-hover-row"
                      >
                        <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500 }}>
                          {String(wTypeId).padStart(2, '0')} {wName}
                        </td>
                        <td style={{ padding: '3px 6px', color: '#0f172a' }}>{motionLabel}</td>
                        <td style={{ padding: '3px 6px', color: '#0f172a' }}>{imageName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3: Advanced Settings (Screen, Tile Size, Fonts, Window Opacity)
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Screen & UI Area */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Screen & UI Area
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label className="mz-form-field">
                <span>Screen Width:</span>
                <input
                  type="number"
                  value={screenWidth}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, screenWidth: Number(e.target.value) }
                    })
                  }
                />
              </label>
              <label className="mz-form-field">
                <span>Screen Height:</span>
                <input
                  type="number"
                  value={screenHeight}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, screenHeight: Number(e.target.value) }
                    })
                  }
                />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <label className="mz-form-field">
                <span>UI Area Width:</span>
                <input
                  type="number"
                  value={uiAreaWidth}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, uiAreaWidth: Number(e.target.value) }
                    })
                  }
                />
              </label>
              <label className="mz-form-field">
                <span>UI Area Height:</span>
                <input
                  type="number"
                  value={uiAreaHeight}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, uiAreaHeight: Number(e.target.value) }
                    })
                  }
                />
              </label>
            </div>
          </div>

          {/* Tile Size */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Tile Size
            </span>
            <select
              value={tileSize}
              onChange={(e) =>
                updateSystem({
                  advanced: { ...advanced, tileSize: Number(e.target.value) as 16 | 24 | 32 | 48 }
                })
              }
              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
            >
              <option value={48}>48 (Default - RPG Maker MZ)</option>
              <option value={32}>32</option>
              <option value={24}>24</option>
              <option value={16}>16</option>
            </select>
          </div>

          {/* Fonts & Window */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Fonts & Window
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="mz-form-field">
                <span>Main Font Filename:</span>
                <input
                  type="text"
                  value={mainFontFilename}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, mainFontFilename: e.target.value }
                    })
                  }
                />
              </label>
              <label className="mz-form-field">
                <span>Number Font Filename:</span>
                <input
                  type="text"
                  value={numberFontFilename}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, numberFontFilename: e.target.value }
                    })
                  }
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 8 }}>
                <label className="mz-form-field">
                  <span>Fallback Font:</span>
                  <input
                    type="text"
                    value={fallbackFont}
                    onChange={(e) =>
                      updateSystem({
                        advanced: { ...advanced, fallbackFont: e.target.value }
                      })
                    }
                  />
                </label>
                <label className="mz-form-field">
                  <span>Font Size:</span>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) =>
                      updateSystem({
                        advanced: { ...advanced, fontSize: Number(e.target.value) }
                      })
                    }
                  />
                </label>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                  <span>Window Opacity:</span>
                  <span>{windowOpacity}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={windowOpacity}
                  onChange={(e) =>
                    updateSystem({
                      advanced: { ...advanced, windowOpacity: Number(e.target.value) }
                    })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ACCORDION: Advanced / Non-MZ Engine Settings
         ========================================================================= */}
      <div className="mz-advanced-accordion" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setAdvancedAccordionOpen(!advancedAccordionOpen)}
        >
          <span>⚙ Pengaturan Lanjutan (Advanced Engine Settings - System 2)</span>
          <span>{advancedAccordionOpen ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {advancedAccordionOpen && (
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mz-form-field">
              <span>Logical Resolution Scaling Mode:</span>
              <select defaultValue="pixelPerfect">
                <option value="pixelPerfect">Pixel Perfect (Aspect Ratio Locked)</option>
                <option value="stretch">Stretch to Viewport</option>
                <option value="integerScale">Integer Scaling</option>
              </select>
            </label>
            <label className="mz-form-field">
              <span>WebGL Texture Filtering:</span>
              <select defaultValue="nearest">
                <option value="nearest">Nearest Neighbor (Sharp Pixels)</option>
                <option value="linear">Bilinear (Smooth)</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* SV Attack Motion Modal */}
      {attackMotionModal.open && (
        <SvAttackMotionModal
          weaponTypeName={attackMotionModal.wName}
          initialMotion={attackMotionModal.motion}
          initialWeaponImageId={attackMotionModal.weaponImageId}
          onSave={(motion, weaponImageId) => {
            const nextMotions = [...svAttackMotions.filter((m) => Number(m.weaponTypeId) !== attackMotionModal.wIdx)];
            nextMotions.push({
              weaponTypeId: attackMotionModal.wIdx,
              motion,
              weaponImageId
            });
            updateSystem({ svAttackMotions: nextMotions });
          }}
          onClose={() => setAttackMotionModal({ open: false, wIdx: 0, wName: '', motion: 1, weaponImageId: 0 })}
        />
      )}
    </section>
  );
}
