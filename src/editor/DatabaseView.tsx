import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ActorData, BaseStats, BossPhase, CombatBase, CombatBonuses, EnemyData, EquipmentData, ItemData, SkillData, StateData, TroopData, TraitData, EnemyDropItem } from '../core/combat-types.js';
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
import type { ClassData, ClassLearning, GameData, ProjectBundle, TilesetData, AssetEntry, CommonEventData, EventCommand, TypesData, AnimationData } from '../core/types.js';
import { TILE_CATALOG, DEFAULT_TILESETS, resolveSheetPath } from '../core/map-layers.js';
import { getCachedImage, preloadImages } from './imageCache.js';
import { ActorDetailForm, ActorTraitModal, formatTraitType, formatTraitContent } from './ActorEditorComponents.js';
import { ClassDetailForm } from './ClassEditorComponents.js';
import { SkillDetailForm } from './SkillEditorComponents.js';
import { ItemDetailForm } from './ItemEditorComponents.js';
import { WeaponDetailForm } from './WeaponEditorComponents.js';
import { ArmorDetailForm } from './ArmorEditorComponents.js';
import { EnemyDetailForm } from './EnemyEditorComponents.js';
import { TroopDetailForm } from './TroopEditorComponents.js';
import { StateDetailForm } from './StateEditorComponents.js';
import { AnimationDetailForm } from './AnimationEditorComponents.js';
import { CommonEventDetailForm } from './CommonEventEditorComponents.js';
import { System1Editor, System2Editor } from './SystemEditorComponents.js';
import { TypesEditor } from './TypesEditorComponents.js';
import { TermsEditor } from './TermsEditorComponents.js';
import { addAssetToBundle } from '../core/resource-manager.js';
import { EventCommandPickerModal } from './modals/EventCommandPickerModal.js';
import { commandName, commandPreview, createCommand } from './events/eventCommands.js';

export type DatabaseCollection =
  | 'actors'
  | 'classes'
  | 'skills'
  | 'items'
  | 'weapons'
  | 'armors'
  | 'equipment'
  | 'enemies'
  | 'troops'
  | 'states'
  | 'animations'
  | 'tilesets'
  | 'commonEvents'
  | 'system1'
  | 'system2'
  | 'system'
  | 'types'
  | 'terms';

export const DATABASE_COLLECTIONS: Array<{ id: DatabaseCollection; label: string; icon?: string }> = [
  { id: 'actors', label: 'Actors' },
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'items', label: 'Items' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'armors', label: 'Armors' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'troops', label: 'Troops' },
  { id: 'states', label: 'States' },
  { id: 'animations', label: 'Animations' },
  { id: 'tilesets', label: 'Tilesets' },
  { id: 'commonEvents', label: 'Common Events' },
  { id: 'system1', label: 'System 1' },
  { id: 'system2', label: 'System 2' },
  { id: 'types', label: 'Types' },
  { id: 'terms', label: 'Terms' }
];

interface DatabaseViewProps {
  bundle: ProjectBundle;
  collection: DatabaseCollection;
  onSelectCollection: (collection: DatabaseCollection) => void;
  onCommit: (nextBundle: ProjectBundle, message: string) => void;
  onImportMv?: () => void;
  busy?: boolean;
  assetUrls?: Record<string, string>;
}

export function DatabaseView({
  bundle,
  collection,
  onSelectCollection,
  onCommit,
  onImportMv,
  busy,
  assetUrls
}: DatabaseViewProps) {
  const [localGame, setLocalGame] = useState(() => bundle.game);
  const [localProject, setLocalProject] = useState(() => bundle.project);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [assetUrlMap, setAssetUrlMap] = useState<Record<string, string>>(() => ({ ...(assetUrls || {}) }));
  const loadedPathsRef = useRef<Set<string>>(new Set(Object.keys(assetUrls || {})));

  // Synchronize when parent passes updated assetUrls
  useEffect(() => {
    if (assetUrls) {
      setAssetUrlMap((prev) => {
        let changed = false;
        for (const [k, v] of Object.entries(assetUrls)) {
          if (prev[k] !== v) {
            changed = true;
            break;
          }
        }
        return changed ? { ...prev, ...assetUrls } : prev;
      });
      for (const k of Object.keys(assetUrls)) {
        loadedPathsRef.current.add(k);
      }
      preloadImages(Object.values(assetUrls));
    }
  }, [assetUrls]);

  useEffect(() => {
    const api = typeof window !== 'undefined' ? (window as unknown as { nusvEditor?: { readAssetData?: (p: string) => Promise<{ dataUrl?: string }> } }).nusvEditor : undefined;
    if (!api?.readAssetData) return;

    const paths = [
      'assets/characters/Actor1.png',
      'assets/characters/Actor2.png',
      'assets/characters/Actor3.png',
      'assets/characters/Door1.png',
      'assets/characters/Chest.png',
      'assets/characters/Vehicle.png',
      'assets/faces/Actor1.png',
      'assets/faces/Actor2.png',
      'assets/faces/Actor3.png',
      'assets/sv_actors/Actor1_1.png',
      'assets/sv_actors/Actor1_2.png',
      'assets/sv_actors/Actor1_3.png',
      'assets/sv_actors/Actor1_4.png',
      'assets/sv_actors/Actor1_5.png',
      'assets/sv_actors/Actor1_6.png',
      'assets/sv_actors/Actor1_7.png',
      'assets/sv_actors/Actor1_8.png',
      'assets/enemies/Goblin.png',
      'assets/enemies/Gnome.png',
      'assets/enemies/Crow.png',
      'assets/enemies/Treant.png',
      'assets/enemies/Hi_monster.png',
      'assets/enemies/Bat.png',
      'assets/enemies/Dragon.png',
      'assets/enemies/Gargoyle.png',
      'assets/system/IconSet.png',
      'assets/tilesets/World_A1.png',
      'assets/tilesets/World_A2.png',
      'assets/tilesets/World_B.png',
      'assets/tilesets/World_C.png',
      'assets/tilesets/Outside_A1.png',
      'assets/tilesets/Outside_A2.png',
      'assets/tilesets/Outside_A3.png',
      'assets/tilesets/Outside_A4.png',
      'assets/tilesets/Outside_A5.png',
      'assets/tilesets/Outside_B.png',
      'assets/tilesets/Outside_C.png',
      'assets/tilesets/Inside_A1.png',
      'assets/tilesets/Inside_A2.png',
      'assets/tilesets/Inside_A4.png',
      'assets/tilesets/Inside_A5.png',
      'assets/tilesets/Inside_B.png',
      'assets/tilesets/Inside_C.png',
      'assets/tilesets/Dungeon_A1.png',
      'assets/tilesets/Dungeon_A2.png',
      'assets/tilesets/Dungeon_A4.png',
      'assets/tilesets/Dungeon_A5.png',
      'assets/tilesets/Dungeon_B.png',
      'assets/tilesets/Dungeon_C.png',
      'assets/tilesets/SF_Outside_A3.png',
      'assets/tilesets/SF_Outside_A4.png',
      'assets/tilesets/SF_Outside_A5.png',
      'assets/tilesets/SF_Outside_B.png',
      'assets/tilesets/SF_Outside_C.png',
      'assets/tilesets/SF_Inside_A4.png',
      'assets/tilesets/SF_Inside_B.png',
      'assets/tilesets/SF_Inside_C.png'
    ];

    for (const ts of ((localGame as Record<string, unknown>).tilesets as TilesetData[] | undefined) || []) {
      if (Array.isArray(ts.tilesetNames)) {
        for (const name of ts.tilesetNames) {
          if (name) {
            const p = resolveSheetPath(name);
            if (p && !paths.includes(p)) paths.push(p);
          }
        }
      }
    }

    for (const a of localGame.actors || []) {
      if (a.faceImage && !paths.includes(a.faceImage)) paths.push(a.faceImage);
      if (a.characterImage && !paths.includes(a.characterImage)) paths.push(a.characterImage);
      if (a.battlerImage && !paths.includes(a.battlerImage)) paths.push(a.battlerImage);
      if (a.battlerName) {
        const bp = `assets/sv_actors/${a.battlerName}.png`;
        if (!paths.includes(bp)) paths.push(bp);
      }
    }

    for (const e of localGame.enemies || []) {
      if (e.battlerImage && !paths.includes(e.battlerImage)) paths.push(e.battlerImage);
      const enemyDefImg = `assets/enemies/${e.name}.png`;
      if (!paths.includes(enemyDefImg)) paths.push(enemyDefImg);
    }

    for (const p of paths) {
      if (loadedPathsRef.current.has(p)) continue;
      loadedPathsRef.current.add(p);
      void api.readAssetData(p).then((res) => {
        if (res?.dataUrl) {
          setAssetUrlMap((prev) => (prev[p] ? prev : { ...prev, [p]: res.dataUrl! }));
          getCachedImage(res.dataUrl);
        }
      });
    }
  }, [bundle]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBundleRef = useRef<ProjectBundle | null>(null);
  const pendingMsgRef = useRef<string>('');

  // Flush any pending debounced commit immediately to parent
  const flushCommit = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingBundleRef.current) {
      const next = pendingBundleRef.current;
      const msg = pendingMsgRef.current;
      pendingBundleRef.current = null;
      onCommit(next, msg);
    }
  }, [onCommit]);

  // Schedule a debounced commit so rapid keystrokes don't deep-clone bundle on every character
  const scheduleCommit = useCallback(
    (nextBundle: ProjectBundle, message: string, delay = 350) => {
      pendingBundleRef.current = nextBundle;
      pendingMsgRef.current = message;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        flushCommit();
      }, delay);
    },
    [flushCommit]
  );

  // Flush pending changes before unmounting
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (pendingBundleRef.current) {
        onCommit(pendingBundleRef.current, pendingMsgRef.current);
        pendingBundleRef.current = null;
      }
    };
  }, [onCommit]);

  // Flush on Ctrl+S before project save executes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        flushCommit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [flushCommit]);

  // Sync if bundle prop changes externally (e.g. undo, MV import) and we have no pending edits
  useEffect(() => {
    if (!pendingBundleRef.current) {
      setLocalGame(bundle.game);
      setLocalProject(bundle.project);
    }
  }, [bundle]);

  const currentBundle = useMemo(
    () => ({ ...bundle, game: localGame, project: localProject }),
    [bundle, localGame, localProject]
  );



  const isSingleton = collection === 'system' || collection === 'system1' || collection === 'system2' || collection === 'types' || collection === 'terms';

  const getRecords = (): unknown[] => {
    if (isSingleton) return [];
    if (collection === 'tilesets') {
      const val = (localGame as Record<string, unknown>).tilesets;
      return Array.isArray(val) && val.length ? val : DEFAULT_TILESETS;
    }
    if (collection === 'weapons') {
      return (localGame.equipment || []).filter((e) => e.slot === 'weapon');
    }
    if (collection === 'armors') {
      return (localGame.equipment || []).filter((e) => e.slot !== 'weapon');
    }
    if (collection === 'commonEvents') {
      return localGame.commonEvents || [];
    }
    if (collection === 'equipment') {
      return localGame.equipment || [];
    }
    if (collection === 'animations') {
      return localGame.animations || [];
    }
    const val = localGame[collection as keyof typeof localGame];
    return Array.isArray(val) ? val : [];
  };

  const records = getRecords();

  const filteredRecords = records.map((record, index) => ({ record, index })).filter(({ record }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const r = record as Record<string, unknown>;
    const id = String(r.id ?? '').toLowerCase();
    const name = String(r.name ?? '').toLowerCase();
    return id.includes(q) || name.includes(q);
  });

  const selectedRecord = selectedIndex !== null && records[selectedIndex] ? (records[selectedIndex] as Record<string, unknown>) : null;

  const handleSelectRecord = (index: number) => {
    flushCommit();
    setSelectedIndex(index);
    setViewMode('form');
    setJsonError(null);
  };

  const handleUpdateProject = (patch: Partial<ProjectBundle['project']>) => {
    const nextProj = { ...localProject, ...patch };
    setLocalProject(nextProj);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: localGame,
      project: nextProj
    };
    scheduleCommit(nextBundle, 'Pengaturan proyek diperbarui.');
  };

  const handleUpdateGame = (patch: Partial<GameData>) => {
    const nextGame = { ...localGame, ...patch };
    setLocalGame(nextGame);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    scheduleCommit(nextBundle, 'Data game diperbarui.');
  };

  const handleAddRecord = () => {
    flushCommit();
    if (isSingleton) return;
    const newId = `${collection.slice(0, -1)}.${Date.now().toString(36)}`;
    let newEntry: Record<string, unknown> = { id: newId, name: 'New Record' };

    if (collection === 'actors') {
      newEntry = {
        id: newId,
        name: 'New Actor',
        classId: localGame.classes?.[0]?.id ?? 'class.squire',
        classTier: 1,
        stats: { str: 10, int: 10, dex: 10, luk: 10, agi: 10, vit: 10 },
        base: { hp: 50, mp: 20, atk: 8, def: 6, mat: 5, mdf: 5, agi: 6 },
        weaponType: 'melee',
        skillIds: localGame.skills[0] ? [localGame.skills[0].id] : []
      };
    } else if (collection === 'classes') {
      newEntry = {
        id: newId,
        name: 'New Class',
        tier: 1,
        growth: { str: 1, vit: 1 },
        learnings: [],
        traits: []
      };
    } else if (collection === 'skills') {
      newEntry = {
        id: newId,
        name: 'New Skill',
        iconIndex: 76,
        description: '',
        stypeId: 1,
        scope: 1,
        occasion: 0,
        speed: 0,
        successRate: 100,
        repeats: 1,
        tpGain: 0,
        hitType: 1,
        animationId: -1,
        message1: '%1 attacks!',
        message2: '',
        requiredWtypeId1: 0,
        requiredWtypeId2: 0,
        damage: {
          type: 1,
          elementId: -1,
          formula: 'a.atk * 4 - b.def * 2',
          variance: 20,
          critical: true
        },
        effects: [
          { code: 21, dataId: 0, value1: 1.0, value2: 0 }
        ],
        kind: 'physical',
        power: 1.0,
        mpCost: 0,
        spCost: 0,
        tpCost: 0,
        target: 'enemy'
      };
    } else if (collection === 'items') {
      newEntry = {
        id: newId,
        name: 'New Item',
        iconIndex: 176,
        description: '',
        itypeId: 1,
        price: 10,
        consumable: true,
        scope: 7,
        occasion: 0,
        speed: 0,
        successRate: 100,
        repeats: 1,
        tpGain: 0,
        hitType: 0,
        animationId: 0,
        damage: {
          type: 3,
          elementId: 0,
          formula: '50',
          variance: 20,
          critical: false
        },
        effects: [
          { code: 11, dataId: 0, value1: 0, value2: 50 }
        ],
        kind: 'heal',
        healHp: 50
      };
    } else if (collection === 'weapons') {
      newEntry = {
        id: newId,
        name: 'New Weapon',
        iconIndex: 97,
        description: '',
        slot: 'weapon',
        wtypeId: 2,
        weaponType: 'melee',
        price: 300,
        animationId: '0006 Slash Physical',
        params: [0, 0, 5, 0, 0, 0, 0, 0],
        bonuses: { atk: 5 },
        stats: { str: 1 },
        traits: []
      };
    } else if (collection === 'armors') {
      newEntry = {
        id: newId,
        name: 'New Armor',
        iconIndex: 135,
        description: '',
        slot: 'body',
        atypeId: 1,
        etypeId: 4,
        price: 300,
        params: [0, 0, 0, 10, 0, 0, 0, 0],
        bonuses: { def: 10 },
        stats: { vit: 1 },
        traits: []
      };
    } else if (collection === 'equipment') {
      newEntry = {
        id: newId,
        name: 'New Equipment',
        slot: 'weapon',
        weaponType: 'melee',
        price: 50,
        stats: { str: 2 },
        bonuses: { atk: 5 },
        traits: []
      };
    } else if (collection === 'enemies') {
      newEntry = {
        id: newId,
        name: 'New Enemy',
        battlerName: 'Goblin',
        battlerHue: 0,
        params: [200, 0, 25, 20, 20, 20, 20, 20],
        base: { hp: 200, mp: 0, atk: 25, def: 20, mat: 20, mdf: 20, agi: 20 },
        stats: { str: 6, int: 4, dex: 6, luk: 20, agi: 6, vit: 6 },
        exp: 10,
        gold: 5,
        reward: { gold: 5, baseExp: 10, classExp: 10 },
        actions: [
          { skillId: localGame.skills[0]?.id || 'skill.attack', rating: 5, conditionType: 'always', conditionParam1: 0, conditionParam2: 0 }
        ],
        dropItems: [],
        traits: [
          { code: 22, dataId: 0, value: 0.95 },
          { code: 22, dataId: 1, value: 0.05 },
          { code: 31, dataId: 1, value: 0 }
        ],
        skillIds: localGame.skills[0] ? [localGame.skills[0].id] : [],
        ai: 'aggressive'
      };
    } else if (collection === 'troops') {
      const defaultEnemy = localGame.enemies[0]?.id ?? 'enemy.moss';
      newEntry = {
        id: newId,
        name: 'New Troop',
        enemyIds: [defaultEnemy],
        members: [{ enemyId: defaultEnemy, x: 400, y: 280, hidden: false }],
        battleback1Name: 'Grassland',
        battleback2Name: 'Grassland',
        pages: [
          {
            conditions: { turnEnding: false },
            span: 'battle',
            commands: []
          }
        ]
      };
    } else if (collection === 'states') {
      newEntry = {
        id: newId,
        name: 'New State',
        iconIndex: 1,
        restriction: 0,
        priority: 50,
        motion: 0,
        overlay: 0,
        removeAtBattleEnd: true,
        removeByRestriction: false,
        autoRemovalTiming: 2,
        minTurns: 2,
        maxTurns: 4,
        duration: 3,
        removeByDamage: false,
        chanceByDamage: 100,
        removeByWalking: false,
        stepsToRemove: 100,
        message1: '%1 has fallen!',
        message2: '%1 is slain!',
        message3: '',
        message4: '%1 revives!',
        damagePerTurn: 0,
        preventsAction: false,
        traits: []
      };
    } else if (collection === 'animations') {
      const current = localGame.animations || [];
      const nextNum = current.length + 1;
      const idStr = String(nextNum).padStart(4, '0');
      newEntry = {
        id: `anim.${idStr}`,
        name: `Animation ${nextNum}`,
        displayType: 1,
        alignBottom: false,
        effectName: 'HitPhysical',
        scale: 100,
        speed: 100,
        rotation: { x: 0, y: 0, z: 0 },
        offsetX: 0,
        offsetY: 0,
        soundTimings: [],
        flashTimings: []
      };
    } else if (collection === 'commonEvents') {
      const current = localGame.commonEvents || [];
      const nextNum = current.length + 1;
      const idStr = String(nextNum).padStart(4, '0');
      newEntry = {
        id: `common.${idStr}`,
        name: '',
        trigger: 'none',
        commands: []
      };
    } else if (collection === 'tilesets') {
      newEntry = {
        id: newId,
        name: 'New Tileset',
        mode: 1,
        tilesetNames: ['Outside_A1', 'Outside_A2', '', '', 'Outside_A5', 'Outside_B', '', '', '']
      };
    }

    let nextGame: typeof localGame;
    if (collection === 'weapons' || collection === 'armors') {
      nextGame = {
        ...localGame,
        equipment: [...(localGame.equipment || []), newEntry as unknown as EquipmentData]
      };
    } else if (collection === 'commonEvents') {
      nextGame = {
        ...localGame,
        commonEvents: [...(localGame.commonEvents || []), newEntry as unknown as CommonEventData]
      };
    } else {
      nextGame = {
        ...localGame,
        [collection]: [...records, newEntry]
      };
    }

    setLocalGame(nextGame);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    onCommit(nextBundle, `${collection} baru berhasil ditambahkan.`);
    setSelectedIndex(records.length);
  };

  const handleDuplicateRecord = () => {
    flushCommit();
    if (isSingleton || selectedIndex === null || !selectedRecord) return;
    const cloned = structuredClone(selectedRecord);
    if (collection === 'commonEvents') {
      const current = localGame.commonEvents || [];
      const nextNum = current.length + 1;
      const idStr = String(nextNum).padStart(4, '0');
      cloned.id = `common.${idStr}`;
      cloned.name = cloned.name ? `${String(cloned.name)} (Copy)` : '';
    } else {
      cloned.id = `${cloned.id}-copy`;
      cloned.name = `${String(cloned.name || '')} (Copy)`;
    }

    let nextGame: typeof localGame;
    if (collection === 'weapons' || collection === 'armors') {
      nextGame = {
        ...localGame,
        equipment: [...(localGame.equipment || []), cloned as unknown as EquipmentData]
      };
    } else if (collection === 'commonEvents') {
      nextGame = {
        ...localGame,
        commonEvents: [...(localGame.commonEvents || []), cloned as unknown as CommonEventData]
      };
    } else {
      nextGame = {
        ...localGame,
        [collection]: [...records, cloned]
      };
    }

    setLocalGame(nextGame);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    onCommit(nextBundle, `${String(selectedRecord.name)} digandakan.`);
    setSelectedIndex(records.length);
  };

  const handleDeleteRecord = () => {
    flushCommit();
    if (isSingleton || selectedIndex === null || !selectedRecord) return;
    const recordName = String(selectedRecord.name || selectedRecord.id);
    if (!confirm(`Hapus "${recordName}" dari database?`)) return;

    const targetId = String(selectedRecord.id);
    let nextGame: typeof localGame;
    if (collection === 'weapons' || collection === 'armors') {
      nextGame = {
        ...localGame,
        equipment: (localGame.equipment || []).filter((e) => e.id !== targetId)
      };
    } else if (collection === 'commonEvents') {
      nextGame = {
        ...localGame,
        commonEvents: (localGame.commonEvents || []).filter((ce) => ce.id !== targetId)
      };
    } else {
      nextGame = {
        ...localGame,
        [collection]: records.filter((_, i) => i !== selectedIndex)
      };
    }

    setLocalGame(nextGame);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    onCommit(nextBundle, `${recordName} dihapus dari database.`);
    const remainingCount = records.length - 1;
    setSelectedIndex(remainingCount > 0 ? Math.min(selectedIndex, remainingCount - 1) : null);
  };

  const handleUpdateRecord = (patch: Record<string, unknown>) => {
    if (isSingleton || selectedIndex === null || !selectedRecord) return;
    const updated = { ...selectedRecord, ...patch };

    let nextGame: typeof localGame;
    if (collection === 'weapons' || collection === 'armors') {
      const targetId = String(selectedRecord.id);
      nextGame = {
        ...localGame,
        equipment: (localGame.equipment || []).map((e) => (e.id === targetId ? (updated as unknown as EquipmentData) : e))
      };
    } else if (collection === 'commonEvents') {
      const list = [...(localGame.commonEvents || [])];
      list[selectedIndex] = updated as unknown as CommonEventData;
      nextGame = { ...localGame, commonEvents: list };
    } else {
      const nextList = [...records];
      nextList[selectedIndex] = updated;
      nextGame = {
        ...localGame,
        [collection]: nextList
      };
    }

    setLocalGame(nextGame);

    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    scheduleCommit(nextBundle, `${String(updated.name ?? updated.id)} diperbarui.`);
  };

  const handleImportAssetEntry = (entry: AssetEntry, dataUrl?: string) => {
    if (dataUrl) {
      const sheetPath = resolveSheetPath(entry.path);
      setAssetUrlMap((prev) => ({
        ...prev,
        [entry.path]: dataUrl,
        [sheetPath]: dataUrl
      }));
      loadedPathsRef.current.add(entry.path);
      loadedPathsRef.current.add(sheetPath);
      preloadImages([dataUrl]);
    }
    const nextBundle = addAssetToBundle(bundle, entry);
    scheduleCommit(nextBundle, `Aset ${entry.id} berhasil diimpor ke proyek.`);
  };

  const handleSwitchToJson = () => {
    flushCommit();
    if (collection === 'system' || collection === 'system1' || collection === 'system2') {
      setJsonDraft(JSON.stringify({ project: localProject, system: localGame.system || {} }, null, 2));
    } else if (collection === 'types') {
      setJsonDraft(JSON.stringify(localGame.types || {}, null, 2));
    } else if (collection === 'terms') {
      setJsonDraft(JSON.stringify(localGame.terms || {}, null, 2));
    } else if (selectedRecord) {
      setJsonDraft(JSON.stringify(selectedRecord, null, 2));
    }
    setJsonError(null);
    setViewMode('json');
  };

  const handleApplyJson = () => {
    flushCommit();
    try {
      const parsed = JSON.parse(jsonDraft);
      if (collection === 'system' || collection === 'system1' || collection === 'system2') {
        const nextProject = parsed.project || localProject;
        const nextGame = {
          ...localGame,
          system: parsed.system || localGame.system
        };
        setLocalProject(nextProject);
        setLocalGame(nextGame);
        const nextBundle: ProjectBundle = {
          ...bundle,
          project: nextProject,
          game: nextGame
        };
        onCommit(nextBundle, 'Konfigurasi sistem diperbarui via JSON.');
      } else if (collection === 'types') {
        const nextGame = {
          ...localGame,
          types: parsed
        };
        setLocalGame(nextGame);
        const nextBundle: ProjectBundle = {
          ...bundle,
          project: localProject,
          game: nextGame
        };
        onCommit(nextBundle, 'Tipe database diperbarui via JSON.');
      } else if (collection === 'terms') {
        const nextGame = {
          ...localGame,
          terms: parsed
        };
        setLocalGame(nextGame);
        const nextBundle: ProjectBundle = {
          ...bundle,
          project: localProject,
          game: nextGame
        };
        onCommit(nextBundle, 'Istilah database (Terms) diperbarui via JSON.');
      } else if (selectedIndex !== null) {
        if (!parsed || typeof parsed !== 'object' || !parsed.id) {
          throw new Error('Record harus berupa objek dan memiliki properti "id"');
        }
        let nextGame: typeof localGame;
        if (collection === 'weapons' || collection === 'armors') {
          const targetId = String(selectedRecord?.id);
          nextGame = {
            ...localGame,
            equipment: (localGame.equipment || []).map((e) => (e.id === targetId ? parsed : e))
          };
        } else if (collection === 'commonEvents') {
          const list = [...(localGame.commonEvents || [])];
          list[selectedIndex] = parsed;
          nextGame = { ...localGame, commonEvents: list };
        } else {
          const nextList = [...records];
          nextList[selectedIndex] = parsed;
          nextGame = {
            ...localGame,
            [collection]: nextList
          };
        }
        setLocalGame(nextGame);
        const nextBundle: ProjectBundle = {
          ...bundle,
          game: nextGame,
          project: localProject
        };
        onCommit(nextBundle, `${String(parsed.name || parsed.id)} diperbarui via JSON.`);
      }
      setJsonError(null);
      setViewMode('form');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="mv-database-view mz-db-layout">
      {/* Category Nav Left - RPG Maker MZ Native Button Column */}
      <aside className="mz-db-nav">
        {DATABASE_COLLECTIONS.map((item) => (
          <button
            className={`mz-db-nav-btn ${collection === item.id ? 'active' : ''}`}
            key={item.id}
            onClick={() => {
              flushCommit();
              onSelectCollection(item.id);
              setSelectedIndex(0);
              setViewMode('form');
              setSearchQuery('');
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main Database Content Area */}
      {collection === 'system' || collection === 'system1' ? (
        <System1Editor
          bundle={currentBundle}
          onUpdateProject={handleUpdateProject}
          onUpdateGame={handleUpdateGame}
          assetUrlMap={assetUrlMap}
        />
      ) : collection === 'system2' ? (
        <System2Editor
          bundle={currentBundle}
          onUpdateProject={handleUpdateProject}
          onUpdateGame={handleUpdateGame}
          assetUrlMap={assetUrlMap}
        />
      ) : collection === 'types' ? (
        <TypesEditor
          bundle={currentBundle}
          onUpdateGame={handleUpdateGame}
        />
      ) : collection === 'terms' ? (
        <TermsEditor
          bundle={currentBundle}
          onUpdateGame={handleUpdateGame}
        />
      ) : (
        <section className="mz-db-content">
          {/* Middle: Record List Panel */}
          <div className="mz-db-records-sidebar">
            <div className="mz-db-records-banner">
              {collection === 'tilesets' ? 'Tilesets' : DATABASE_COLLECTIONS.find(c => c.id === collection)?.label || collection}
            </div>

            <div className="mz-db-record-items-scroll">
              {filteredRecords.length === 0 ? (
                <div className="mz-db-empty-records">Tidak ada data</div>
              ) : (
                filteredRecords.map(({ record, index }) => {
                  const r = record as Record<string, unknown>;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={index}
                      className={`mz-db-record-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectRecord(index)}
                    >
                      <span className="mz-db-record-index">{String(index + 1).padStart(4, '0')}</span>
                      <span className="mz-db-record-name">{collection === 'commonEvents' ? String(r.name || '') : String(r.name || r.id)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mz-db-records-footer">
              <button className="mz-btn-change-max" onClick={handleAddRecord} title="Tambah data baru">
                Change Maximum...
              </button>
              <div className="mz-records-sub-actions">
                <button
                  disabled={selectedRecord === null}
                  onClick={handleDuplicateRecord}
                  title="Gandakan data terpilih"
                >
                  Dup
                </button>
                <button
                  disabled={selectedRecord === null}
                  onClick={handleDeleteRecord}
                  title="Hapus data"
                >
                  Del
                </button>
                {onImportMv && (
                  <button disabled={busy} onClick={onImportMv} title="Import dari RPG Maker MV">
                    Import MV
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Detailed Form or JSON Editor */}
          <div className="mz-db-detail-pane">
            <div className="mz-db-detail-header">
              <div className="mz-db-view-switch">
                <button
                  className={viewMode === 'form' ? 'active' : ''}
                  onClick={() => setViewMode('form')}
                  disabled={!selectedRecord}
                >
                  Form
                </button>
                <button
                  className={viewMode === 'json' ? 'active' : ''}
                  onClick={handleSwitchToJson}
                  disabled={!selectedRecord}
                >
                  JSON
                </button>
              </div>
            </div>

            {viewMode === 'json' ? (
              <div className="mz-db-json-view">
                {jsonError && <div className="mz-db-json-error">⚠️ {jsonError}</div>}
                <textarea
                  className="mz-db-json-textarea"
                  spellCheck={false}
                  value={jsonDraft}
                  onChange={(e) => setJsonDraft(e.target.value)}
                />
                <div className="mz-db-json-footer">
                  <span>Simpan perubahan JSON ke memori bundle.</span>
                  <button className="primary" onClick={handleApplyJson}>
                    Terapkan JSON
                  </button>
                </div>
              </div>
            ) : selectedRecord ? (
              <div className="mz-db-form-view">
                <RecordDetailForm
                  collection={collection}
                  record={selectedRecord}
                  bundle={currentBundle}
                  onUpdate={handleUpdateRecord}
                  assetUrlMap={assetUrlMap}
                  onImportAssetEntry={handleImportAssetEntry}
                />
              </div>
            ) : (
              <div className="mz-db-blank">
                <p>Pilih data di daftar sebelah kiri untuk mulai mengedit.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Tileset Canvas Preview (GPU Accelerated, Zero-Delay Sheet Rendering)
// ------------------------------------------------------------------------------------------------

interface PreviewTileItem {
  tileId: number;
  sheetUrl?: string;
  srcX: number;
  srcY: number;
  name?: string;
  defaultBlocked?: boolean;
}

interface TilesetCanvasPreviewProps {
  tiles: PreviewTileItem[];
  activeSheetUrl?: string;
  previewTab: 'A' | 'B' | 'C' | 'D' | 'E';
  flagMode: 'passage' | 'passage4' | 'ladder' | 'bush' | 'counter' | 'damage' | 'terrain';
  flags: number[];
  onTileClick: (tileId: number, direction?: 'up' | 'down' | 'left' | 'right') => void;
  getTileFlag: (tileId: number, defaultBlocked?: boolean) => number;
}

function TilesetCanvasPreview({
  tiles,
  activeSheetUrl,
  previewTab,
  flagMode,
  flags,
  onTileClick,
  getTileFlag
}: TilesetCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  const rowCount = Math.max(10, Math.ceil(tiles.length / 8));
  const canvasHeight = rowCount * 48;
  const canvasWidth = 384;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Checkered neutral background pattern
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#475569';
    for (let r = 0; r < rowCount * 3; r++) {
      for (let c = 0; c < 8 * 3; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(c * 16, r * 16, 16, 16);
        }
      }
    }

    // 2. Draw tiles
    if (previewTab === 'B' || previewTab === 'C' || previewTab === 'D' || previewTab === 'E') {
      if (activeSheetUrl) {
        const img = getCachedImage(activeSheetUrl, () => setRenderTick((t) => t + 1));
        if (img && img.complete && img.naturalWidth > 0) {
          // RPG Maker MZ standard:
          // Left 8 cols of 768x768 sheet (0..384, 0..768) -> Upper 16 rows of preview (0, 0, 384, 768)
          ctx.drawImage(img, 0, 0, 384, 768, 0, 0, 384, 768);
          // Right 8 cols of 768x768 sheet (384..768, 0..768) -> Lower 16 rows of preview (0, 768, 384, 768)
          ctx.drawImage(img, 384, 0, 384, 768, 0, 768, 384, 768);
        }
      }
    } else {
      // Tab A
      tiles.forEach((tileItem, idx) => {
        if (!tileItem.sheetUrl) return;
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const dx = col * 48;
        const dy = row * 48;
        const img = getCachedImage(tileItem.sheetUrl, () => setRenderTick((t) => t + 1));
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, tileItem.srcX, tileItem.srcY, 48, 48, dx, dy, 48, 48);
        }
      });
    }

    // 3. Grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= 8; c++) {
      ctx.moveTo(c * 48 + 0.5, 0);
      ctx.lineTo(c * 48 + 0.5, canvasHeight);
    }
    for (let r = 0; r <= rowCount; r++) {
      ctx.moveTo(0, r * 48 + 0.5);
      ctx.lineTo(canvasWidth, r * 48 + 0.5);
    }
    ctx.stroke();

    // 4. Passage Flags
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;

    tiles.forEach((tileItem, idx) => {
      const col = idx % 8;
      const row = Math.floor(idx / 8);
      const cx = col * 48 + 24;
      const cy = row * 48 + 25;
      const flag = getTileFlag(tileItem.tileId, tileItem.defaultBlocked);

      if (flagMode === 'passage') {
        const isStar = (flag & 0x10) !== 0;
        const isBlocked = (flag & 0x0f) === 0x0f;
        if (isStar) {
          ctx.font = 'bold 24px "Segoe UI", sans-serif';
          ctx.strokeText('☆', cx, cy);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('☆', cx, cy);
        } else if (isBlocked) {
          ctx.font = 'bold 28px "Segoe UI", sans-serif';
          ctx.strokeText('×', cx, cy);
          ctx.fillStyle = '#ef4444';
          ctx.fillText('×', cx, cy);
        } else {
          ctx.font = 'bold 26px "Segoe UI", sans-serif';
          ctx.strokeText('○', cx, cy);
          ctx.fillStyle = '#22c55e';
          ctx.fillText('○', cx, cy);
        }
      } else if (flagMode === 'passage4') {
        const isStar = (flag & 0x10) !== 0;
        if (isStar) {
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.strokeText('☆', cx, cy);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('☆', cx, cy);
        } else {
          const down = (flag & 0x01) !== 0;
          const left = (flag & 0x02) !== 0;
          const right = (flag & 0x04) !== 0;
          const up = (flag & 0x08) !== 0;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';

          // Up arrow ▲
          if (!up) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeText('▲', cx, cy - 14);
            ctx.fillText('▲', cx, cy - 14);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('•', cx, cy - 14);
          }

          // Down arrow ▼
          if (!down) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeText('▼', cx, cy + 14);
            ctx.fillText('▼', cx, cy + 14);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('•', cx, cy + 14);
          }

          // Left arrow ◄
          if (!left) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeText('◄', cx - 14, cy);
            ctx.fillText('◄', cx - 14, cy);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('•', cx - 14, cy);
          }

          // Right arrow ►
          if (!right) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeText('►', cx + 14, cy);
            ctx.fillText('►', cx + 14, cy);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('•', cx + 14, cy);
          }
        }
      } else if (flagMode === 'ladder') {
        if ((flag & 0x20) !== 0) {
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.strokeText('▲', cx, cy);
          ctx.fillStyle = '#f59e0b';
          ctx.fillText('▲', cx, cy);
        }
      } else if (flagMode === 'bush') {
        if ((flag & 0x40) !== 0) {
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.strokeText('～', cx, cy);
          ctx.fillStyle = '#10b981';
          ctx.fillText('～', cx, cy);
        }
      } else if (flagMode === 'counter') {
        if ((flag & 0x80) !== 0) {
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.strokeText('◆', cx, cy);
          ctx.fillStyle = '#a855f7';
          ctx.fillText('◆', cx, cy);
        }
      } else if (flagMode === 'damage') {
        if ((flag & 0x100) !== 0) {
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.strokeText('⚡', cx, cy);
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚡', cx, cy);
        }
      } else if (flagMode === 'terrain') {
        const tag = (flag >> 12) & 0x07;
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillStyle = tag > 0 ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
        ctx.strokeText(String(tag), cx, cy);
        ctx.fillText(String(tag), cx, cy);
      }
    });
    ctx.restore();

    // 5. Hover outline
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < tiles.length) {
      const col = hoverIdx % 8;
      const row = Math.floor(hoverIdx / 8);
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(col * 48 + 1, row * 48 + 1, 46, 46);
    }
  }, [tiles, activeSheetUrl, previewTab, flagMode, flags, hoverIdx, renderTick, rowCount, canvasHeight, getTileFlag]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / 48);
    const row = Math.floor(y / 48);
    if (col >= 0 && col < 8 && row >= 0 && row < rowCount) {
      const idx = row * 8 + col;
      if (idx < tiles.length) {
        if (hoverIdx !== idx) setHoverIdx(idx);
        return;
      }
    }
    if (hoverIdx !== null) setHoverIdx(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / 48);
    const row = Math.floor(y / 48);
    if (col >= 0 && col < 8 && row >= 0 && row < rowCount) {
      const idx = row * 8 + col;
      if (tiles[idx]) {
        if (flagMode === 'passage4') {
          const relX = x - col * 48;
          const relY = y - row * 48;
          const dx = relX - 24;
          const dy = relY - 24;
          const dir = Math.abs(dy) >= Math.abs(dx)
            ? (dy < 0 ? 'up' : 'down')
            : (dx < 0 ? 'left' : 'right');
          onTileClick(tiles[idx].tileId, dir);
        } else {
          onTileClick(tiles[idx].tileId);
        }
      }
    }
  };

  const hoverTile = hoverIdx !== null ? tiles[hoverIdx] : null;
  const getHoverTitle = () => {
    if (!hoverTile) return 'Klik tile untuk mengubah flag';
    const base = hoverTile.name || `Tile ${hoverTile.tileId}`;
    if (flagMode === 'passage4') return `${base} · Klik panah Atas/Bawah/Kiri/Kanan untuk mengubah arah passage`;
    if (flagMode === 'passage') return `${base} · Klik untuk toggle ○ (Bisa) / × (Tertutup) / ☆ (Atap)`;
    if (flagMode === 'ladder') return `${base} · Klik untuk toggle Tangga ▲`;
    if (flagMode === 'bush') return `${base} · Klik untuk toggle Semak/Bush ～`;
    if (flagMode === 'counter') return `${base} · Klik untuk toggle Meja/Counter ◆`;
    if (flagMode === 'damage') return `${base} · Klik untuk toggle Lantai Jebakan ⚡`;
    if (flagMode === 'terrain') return `${base} · Klik untuk mengubah Terrain Tag (0-7)`;
    return base;
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="mz-tileset-canvas-preview"
      style={{ display: 'block', imageRendering: 'pixelated', cursor: 'pointer' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      onClick={handleClick}
      title={getHoverTitle()}
    />
  );
}

// ------------------------------------------------------------------------------------------------
// Select an Image Modal (RPG Maker MZ Standard Tileset Picker)
// ------------------------------------------------------------------------------------------------

interface TilesetImagePickerModalProps {
  slotLabel: string;
  currentImage: string;
  bundle: ProjectBundle;
  assetUrlMap: Record<string, string>;
  onConfirm: (imageName: string) => void;
  onClose: () => void;
  onImportAssetEntry?: (entry: AssetEntry, dataUrl?: string) => void;
}

function TilesetImagePickerModal({
  slotLabel,
  currentImage,
  bundle,
  assetUrlMap,
  onConfirm,
  onClose,
  onImportAssetEntry
}: TilesetImagePickerModalProps) {
  const [selectedFile, setSelectedFile] = useState<string>(currentImage || '');
  const [search, setSearch] = useState('');
  const [discoveredSheets, setDiscoveredSheets] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [localUrlMap, setLocalUrlMap] = useState<Record<string, string>>({});

  const api = typeof window !== 'undefined'
    ? (window as unknown as {
      nusvEditor?: {
        importAsset?: (opts: { category: string }) => Promise<AssetEntry | null>;
        readAssetData?: (p: string) => Promise<{ dataUrl?: string }>;
        scanAssets?: () => Promise<AssetEntry[]>;
      };
    }).nusvEditor
    : undefined;

  // Scan project assets on mount to discover any manually placed tileset sheets
  useEffect(() => {
    if (api?.scanAssets) {
      void api.scanAssets().then((entries) => {
        if (Array.isArray(entries)) {
          const found = entries
            .filter((e) => e.category === 'tilesets' || e.path.includes('/tilesets/'))
            .map((e) => e.path.split('/').pop()?.replace(/\.png$/i, '') || '')
            .filter(Boolean);
          if (found.length > 0) {
            setDiscoveredSheets(found);
          }
        }
      });
    }
  }, [api]);

  const allAvailableSheets = useMemo(() => {
    const defaults = [
      'World_A1', 'World_A2', 'World_B', 'World_C',
      'Outside_A1', 'Outside_A2', 'Outside_A3', 'Outside_A4', 'Outside_A5', 'Outside_B', 'Outside_C',
      'Inside_A1', 'Inside_A2', 'Inside_A4', 'Inside_A5', 'Inside_B', 'Inside_C',
      'Dungeon_A1', 'Dungeon_A2', 'Dungeon_A4', 'Dungeon_A5', 'Dungeon_B', 'Dungeon_C',
      'SF_Outside_A3', 'SF_Outside_A4', 'SF_Outside_A5', 'SF_Outside_B', 'SF_Outside_C',
      'SF_Inside_A4', 'SF_Inside_B', 'SF_Inside_C'
    ];
    const fromManifest = (bundle.assets?.assets || [])
      .filter((a) => a.category === 'tilesets' || a.path.includes('/tilesets/'))
      .map((a) => a.path.split('/').pop()?.replace(/\.png$/i, '') || '')
      .filter(Boolean);
    const combined = Array.from(new Set([...defaults, ...fromManifest, ...discoveredSheets]));
    combined.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return combined;
  }, [bundle.assets?.assets, discoveredSheets]);

  const filteredSheets = useMemo(() => {
    if (!search.trim()) return allAvailableSheets;
    return allAvailableSheets.filter((s) => s.toLowerCase().includes(search.trim().toLowerCase()));
  }, [allAvailableSheets, search]);

  // Load preview dataUrl if not in assetUrlMap
  useEffect(() => {
    if (!selectedFile) return;
    const path = resolveSheetPath(selectedFile);
    if (assetUrlMap[path] || localUrlMap[path]) return;
    if (api?.readAssetData) {
      void api.readAssetData(path).then((res) => {
        if (res?.dataUrl) {
          setLocalUrlMap((prev) => ({ ...prev, [path]: res.dataUrl! }));
          preloadImages([res.dataUrl]);
        }
      });
    }
  }, [selectedFile, assetUrlMap, localUrlMap, api]);

  const activePreviewUrl = selectedFile
    ? (localUrlMap[resolveSheetPath(selectedFile)] ||
      assetUrlMap[resolveSheetPath(selectedFile)] ||
      assetUrlMap[`assets/tilesets/${selectedFile}.png`] ||
      assetUrlMap[`assets/tilesets/${selectedFile}`] || '')
    : '';

  const handleImport = async () => {
    if (!api?.importAsset) return;
    setImporting(true);
    try {
      const res = await api.importAsset({ category: 'tilesets' });
      if (res?.path) {
        const fileName = res.path.split('/').pop()?.replace(/\.png$/i, '') || '';
        let dataUrl: string | undefined;
        if (api.readAssetData) {
          const dataRes = await api.readAssetData(res.path);
          if (dataRes?.dataUrl) {
            dataUrl = dataRes.dataUrl;
            setLocalUrlMap((prev) => ({ ...prev, [res.path]: dataUrl! }));
            preloadImages([dataUrl]);
          }
        }
        if (onImportAssetEntry) {
          onImportAssetEntry(res, dataUrl);
        }
        setDiscoveredSheets((prev) => Array.from(new Set([...prev, fileName])));
        setSelectedFile(fileName);
      }
    } catch (err) {
      console.error('Import tileset failed:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mz-sub-modal-backdrop" onClick={onClose}>
      <div
        className="mz-sub-modal-window"
        style={{ width: 680, height: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mz-sub-modal-header">
          <span>Select an Image — {slotLabel}</span>
          <button className="mz-sub-modal-close-btn" onClick={onClose} title="Tutup">
            ✕
          </button>
        </div>

        <div
          className="mz-sub-modal-body"
          style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, height: 'calc(100% - 75px)', overflow: 'hidden' }}
        >
          {/* Left: Search, File List, Import Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, height: '100%' }}>
            <input
              type="text"
              className="mz-slot-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Cari berkas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div
              className="mz-table-container"
              style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid #94a3b8', borderRadius: 3, background: '#ffffff' }}
            >
              {/* Option (None) at the very top */}
              <div
                className={`mz-table-clickable-row ${selectedFile === '' ? 'active' : ''}`}
                style={{
                  padding: '5px 8px',
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: selectedFile === '' ? '#ffffff' : '#64748b',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedFile('')}
                onDoubleClick={() => {
                  onConfirm('');
                  onClose();
                }}
              >
                (None)
              </div>

              {filteredSheets.map((name) => {
                const isSelected = selectedFile === name;
                return (
                  <div
                    key={name}
                    className={`mz-table-clickable-row ${isSelected ? 'active' : ''}`}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      fontFamily: '"Segoe UI", sans-serif',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedFile(name)}
                    onDoubleClick={() => {
                      onConfirm(name);
                      onClose();
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="mz-btn-action"
              disabled={importing}
              onClick={handleImport}
              style={{ width: '100%', marginTop: 2 }}
            >
              {importing ? 'Mengimpor...' : '📁 Impor Berkas Baru...'}
            </button>
          </div>

          {/* Right: Preview Pane */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              height: '100%',
              border: '1px solid #94a3b8',
              borderRadius: 3,
              background: '#f8fafc',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '6px 10px',
                background: '#e2e8f0',
                borderBottom: '1px solid #cbd5e1',
                fontSize: 12,
                fontWeight: 600,
                color: '#334155'
              }}
            >
              {selectedFile ? `${selectedFile}.png` : '(None)'}
            </div>

            <div
              className="mz-checkered-bg"
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                display: 'flex',
                alignItems: selectedFile ? 'flex-start' : 'center',
                justifyContent: selectedFile ? 'flex-start' : 'center',
                padding: selectedFile ? 8 : 0
              }}
            >
              {selectedFile ? (
                activePreviewUrl ? (
                  <img
                    src={activePreviewUrl}
                    alt={selectedFile}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      imageRendering: 'pixelated',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                ) : (
                  <div style={{ color: '#64748b', fontSize: 12, padding: 16 }}>Memuat gambar...</div>
                )
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>(None)</div>
              )}
            </div>
          </div>
        </div>

        <div className="mz-sub-modal-footer">
          <button
            type="button"
            className="mz-btn-primary"
            onClick={() => {
              onConfirm(selectedFile);
              onClose();
            }}
          >
            OK
          </button>
          <button type="button" className="mz-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Tileset Detail Form (RPG Maker MZ Layout)
// ------------------------------------------------------------------------------------------------

function TilesetDetailForm({
  ts,
  bundle,
  onUpdate,
  assetUrlMap,
  textInput,
  onImportAssetEntry
}: {
  ts: TilesetData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap: Record<string, string>;
  textInput: (key: string, value: unknown) => React.ReactNode;
  onImportAssetEntry?: (entry: AssetEntry, dataUrl?: string) => void;
}) {
  const tsNames = Array.isArray(ts.tilesetNames) ? ts.tilesetNames : [];
  const [activePickerSlot, setActivePickerSlot] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [flagMode, setFlagMode] = useState<'passage' | 'passage4' | 'ladder' | 'bush' | 'counter' | 'damage' | 'terrain'>('passage');

  const availableSheets = useMemo(() => {
    const defaults = [
      'World_A1', 'World_A2', 'World_B', 'World_C',
      'Outside_A1', 'Outside_A2', 'Outside_A3', 'Outside_A4', 'Outside_A5', 'Outside_B', 'Outside_C',
      'Inside_A1', 'Inside_A2', 'Inside_A4', 'Inside_A5', 'Inside_B', 'Inside_C',
      'Dungeon_A1', 'Dungeon_A2', 'Dungeon_A4', 'Dungeon_A5', 'Dungeon_B', 'Dungeon_C',
      'SF_Outside_A3', 'SF_Outside_A4', 'SF_Outside_A5', 'SF_Outside_B', 'SF_Outside_C',
      'SF_Inside_A4', 'SF_Inside_B', 'SF_Inside_C'
    ];
    const fromManifest = (bundle.assets?.assets || [])
      .filter((a) => a.category === 'tilesets' || a.path.includes('/tilesets/'))
      .map((a) => a.path.split('/').pop()?.replace(/\.png$/i, '') || '')
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...fromManifest]));
  }, [bundle.assets?.assets]);

  const slotLabels = [
    { label: 'A1 (Animation):', idx: 0 },
    { label: 'A2 (Ground):', idx: 1 },
    { label: 'A3 (Buildings):', idx: 2 },
    { label: 'A4 (Walls):', idx: 3 },
    { label: 'A5 (Normal):', idx: 4 },
    { label: 'B:', idx: 5 },
    { label: 'C:', idx: 6 },
    { label: 'D:', idx: 7 },
    { label: 'E:', idx: 8 }
  ];

  const updateSlot = (slotIdx: number, val: string) => {
    const next = [...tsNames];
    while (next.length <= slotIdx) next.push('');
    next[slotIdx] = val;
    onUpdate({ tilesetNames: next });
  };

  const availableTabs: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C'];
  if (tsNames[7]) availableTabs.push('D');
  if (tsNames[8]) availableTabs.push('E');

  let activeSheetName = '';
  if (previewTab === 'A') {
    activeSheetName = ts.mode === 0 ? (tsNames[0] || 'World_A1') : (tsNames[1] || tsNames[4] || 'Outside_A2');
  } else if (previewTab === 'B') {
    activeSheetName = tsNames[5] || 'Outside_B';
  } else if (previewTab === 'C') {
    activeSheetName = tsNames[6] || 'Outside_C';
  } else if (previewTab === 'D') {
    activeSheetName = tsNames[7] || '';
  } else if (previewTab === 'E') {
    activeSheetName = tsNames[8] || '';
  }

  const activeSheetUrl = assetUrlMap[resolveSheetPath(activeSheetName)] || assetUrlMap[`assets/tilesets/${activeSheetName}.png`] || assetUrlMap[`assets/tilesets/${activeSheetName}`] || '';

  interface PreviewTileItem {
    tileId: number;
    sheetUrl?: string;
    srcX: number;
    srcY: number;
    name?: string;
    defaultBlocked?: boolean;
  }

  const tiles = useMemo<PreviewTileItem[]>(() => {
    if (previewTab === 'A') {
      if (ts.mode === 0) {
        // World Type Tab A: 48 tiles (6 rows of 8 tiles)
        const worldTiles = TILE_CATALOG.filter((t) => t.group === 'A' && t.paletteSrcX !== undefined);
        return worldTiles.map((t) => ({
          tileId: t.id,
          sheetUrl: t.tileset ? assetUrlMap[t.tileset] : undefined,
          srcX: t.paletteSrcX ?? t.srcX ?? 0,
          srcY: t.paletteSrcY ?? t.srcY ?? 0,
          name: t.name,
          defaultBlocked: (t.defaultLayer ?? 0) >= 1
        }));
      } else {
        // Area Type Tab A: A2 ground autotiles (32 tiles) + A5 normal tiles (128 tiles)
        const items: PreviewTileItem[] = [];
        const a2Name = tsNames[1] || 'Outside_A2';
        const a2Url = assetUrlMap[resolveSheetPath(a2Name)] || assetUrlMap[`assets/tilesets/${a2Name}.png`] || assetUrlMap[`assets/tilesets/${a2Name}`];

        for (let i = 0; i < 32; i++) {
          const col = i % 8;
          const row = Math.floor(i / 8);
          items.push({
            tileId: 2048 + i * 48,
            sheetUrl: a2Url,
            srcX: col * 96,
            srcY: row * 144,
            name: `A2 Autotile #${i + 1}`,
            defaultBlocked: row >= 2
          });
        }

        const a5Name = tsNames[4] || 'Outside_A5';
        const a5Url = assetUrlMap[resolveSheetPath(a5Name)] || assetUrlMap[`assets/tilesets/${a5Name}.png`] || assetUrlMap[`assets/tilesets/${a5Name}`];
        if (a5Url) {
          for (let k = 0; k < 128; k++) {
            const col = k % 8;
            const row = Math.floor(k / 8);
            items.push({
              tileId: 1536 + k,
              sheetUrl: a5Url,
              srcX: col * 48,
              srcY: row * 48,
              name: `A5 Tile #${k + 1}`,
              defaultBlocked: false
            });
          }
        }
        return items;
      }
    }

    // Tabs B, C, D, E: 256 tiles per sheet (8 columns x 32 rows, 48x48 px each)
    const sheetName =
      previewTab === 'B' ? (tsNames[5] || 'Outside_B') :
        previewTab === 'C' ? (tsNames[6] || 'Outside_C') :
          previewTab === 'D' ? (tsNames[7] || '') :
            (tsNames[8] || '');
    const sheetUrl = assetUrlMap[resolveSheetPath(sheetName)] || assetUrlMap[`assets/tilesets/${sheetName}.png`] || assetUrlMap[`assets/tilesets/${sheetName}`];
    const baseTileId =
      previewTab === 'B' ? 0 :
        previewTab === 'C' ? 256 :
          previewTab === 'D' ? 512 : 768;

    const list: PreviewTileItem[] = [];
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(i / 8);
      const c = i % 8;
      // RPG Maker MZ standard: upper 16 rows = left 8 columns, lower 16 rows = right 8 columns
      const srcX = (r < 16 ? c : c + 8) * 48;
      const srcY = (r < 16 ? r : r - 16) * 48;
      list.push({
        tileId: baseTileId + i,
        sheetUrl,
        srcX,
        srcY,
        name: (previewTab === 'B' && i === 0) ? 'Empty Tile (Star)' : `Tile ${previewTab} #${i}`,
        defaultBlocked: false
      });
    }
    return list;
  }, [previewTab, ts.mode, tsNames, assetUrlMap]);

  // Click handler to toggle or update flags
  const handleTileClick = (tileId: number, direction?: 'up' | 'down' | 'left' | 'right') => {
    const currentFlags = Array.isArray(ts.flags) ? [...ts.flags] : [];
    while (currentFlags.length <= tileId) currentFlags.push(0);
    const current = currentFlags[tileId] ?? 0;
    let next = current;

    if (flagMode === 'passage') {
      const isStar = (current & 0x10) !== 0;
      const isBlocked = (current & 0x0f) === 0x0f;
      let nextPassage = 0;
      if (!isBlocked && !isStar) {
        // ○ -> ×
        nextPassage = 0x0f;
      } else if (isBlocked) {
        // × -> ☆
        nextPassage = 0x10;
      } else {
        // ☆ -> ○
        nextPassage = 0x00;
      }
      next = (current & ~0x1f) | nextPassage;
    } else if (flagMode === 'passage4') {
      if (direction) {
        const bit = direction === 'down' ? 0x01 : direction === 'left' ? 0x02 : direction === 'right' ? 0x04 : 0x08;
        next = current ^ bit;
      } else {
        const dir = current & 0x0f;
        const nextDir = dir === 0 ? 0x0f : dir === 0x0f ? 0x01 : dir === 0x01 ? 0x06 : 0;
        next = (current & ~0x0f) | nextDir;
      }
    } else if (flagMode === 'ladder') {
      next = current ^ 0x20;
    } else if (flagMode === 'bush') {
      next = current ^ 0x40;
    } else if (flagMode === 'counter') {
      next = current ^ 0x80;
    } else if (flagMode === 'damage') {
      next = current ^ 0x100;
    } else if (flagMode === 'terrain') {
      const tag = (current >> 12) & 0x07;
      const nextTag = (tag + 1) % 8;
      next = (current & ~0x7000) | (nextTag << 12);
    }

    currentFlags[tileId] = next;
    onUpdate({ flags: currentFlags });
  };

  const getTileFlag = (tileId: number, defaultBlocked = false) => {
    if (Array.isArray(ts.flags) && ts.flags[tileId] !== undefined) {
      return ts.flags[tileId];
    }
    if (tileId === 0) return 0x10; // Tile 0 of sheet B is star
    return defaultBlocked ? 0x0f : 0x00;
  };

  return (
    <div className="mz-tileset-editor-layout">
      {/* 1. General Settings & Images (Slot Lembar Tile) */}
      <div className="mz-tileset-slots-card">
        <div className="mz-form-card">
          <h3>General Settings</h3>
          <div className="mz-tileset-general-fields">
            <label className="mz-form-field-vertical">
              <span>Name:</span>
              {textInput('name', ts.name)}
            </label>
            <label className="mz-form-field-vertical">
              <span>Mode:</span>
              <select
                value={ts.mode ?? 1}
                onChange={(e) => onUpdate({ mode: Number(e.target.value) })}
              >
                <option value={0}>World Type</option>
                <option value={1}>Area Type</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Images</h3>
          <div className="mz-tileset-slots-list">
            {slotLabels.map(({ label, idx }) => (
              <div key={idx} className="mz-tileset-slot-row">
                <span className="mz-slot-name">{label}</span>
                <div
                  className="mz-mz-picker-field"
                  onClick={() => setActivePickerSlot(idx)}
                  title={`Pilih berkas untuk ${label}`}
                >
                  <span className="mz-mz-picker-val">{tsNames[idx] || ''}</span>
                  <button
                    type="button"
                    className="mz-mz-picker-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePickerSlot(idx);
                    }}
                    title="Pilih gambar..."
                  >
                    ...
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Tileset 8-Column Preview with Tabs */}
      <div className="mz-tileset-sheet-preview-pane">
        <div className="mz-form-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 13 }}>{activeSheetName ? `${activeSheetName} (Tab ${previewTab})` : `Tab ${previewTab}`}</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>{tiles.length} tiles (8 cols × 48px)</span>
          </div>

          <div className="mz-tileset-sheet-box mz-checkered-bg">
            <TilesetCanvasPreview
              tiles={tiles}
              activeSheetUrl={activeSheetUrl}
              previewTab={previewTab}
              flagMode={flagMode}
              flags={Array.isArray(ts.flags) ? ts.flags : []}
              onTileClick={handleTileClick}
              getTileFlag={getTileFlag}
            />
          </div>

          <div className="mv-palette-tabs" style={{ marginTop: 6, width: 384 }}>
            {availableTabs.map((t) => (
              <button
                key={t}
                className={previewTab === t ? 'active' : ''}
                onClick={() => setPreviewTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Flag Mode Buttons & Note */}
      <div className="mz-tileset-flags-sidebar">
        <div className="mz-tileset-flag-btns-vertical">
          {[
            { id: 'passage', label: 'Passage' },
            { id: 'passage4', label: 'Passage (4 dir)' },
            { id: 'ladder', label: 'Ladder' },
            { id: 'bush', label: 'Bush' },
            { id: 'counter', label: 'Counter' },
            { id: 'damage', label: 'Damage Floor' },
            { id: 'terrain', label: 'Terrain Tag' }
          ].map((m) => (
            <button
              key={m.id}
              className={`mz-tileset-mode-btn ${flagMode === m.id ? 'active' : ''}`}
              onClick={() => setFlagMode(m.id as any)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mz-form-card" style={{ marginTop: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 6px 0' }}>Note</h3>
          <textarea
            className="mz-textarea mz-note-textarea"
            value={ts.note || ''}
            onChange={(e) => onUpdate({ note: e.target.value })}
            style={{ flex: 1, minHeight: 180, resize: 'vertical' }}
            placeholder="Catatan tileset..."
          />
        </div>
      </div>

      {activePickerSlot !== null && (
        <TilesetImagePickerModal
          slotLabel={slotLabels[activePickerSlot]?.label || `Slot ${activePickerSlot}`}
          currentImage={tsNames[activePickerSlot] || ''}
          bundle={bundle}
          assetUrlMap={assetUrlMap}
          onConfirm={(selectedName) => {
            updateSlot(activePickerSlot, selectedName);
          }}
          onClose={() => setActivePickerSlot(null)}
          onImportAssetEntry={onImportAssetEntry}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Traits Editor Card (Ciri Khusus Standar RPG Maker MZ / NUSV)
// ------------------------------------------------------------------------------------------------

function TraitsEditorCard({
  traits,
  bundle,
  onUpdateTraits
}: {
  traits: TraitData[];
  bundle: ProjectBundle;
  onUpdateTraits: (nextTraits: TraitData[]) => void;
}) {
  const [traitModalIndex, setTraitModalIndex] = useState<number | 'new' | null>(null);

  const handleAddTrait = (trait: TraitData) => {
    onUpdateTraits([...traits, trait]);
    setTraitModalIndex(null);
  };

  const handleUpdateTrait = (idx: number, trait: TraitData) => {
    const next = [...traits];
    next[idx] = trait;
    onUpdateTraits(next);
    setTraitModalIndex(null);
  };

  const handleDeleteTrait = (idx: number) => {
    onUpdateTraits(traits.filter((_, i) => i !== idx));
    setTraitModalIndex(null);
  };

  return (
    <div className="mz-form-card">
      <div className="mz-card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Ciri Khusus (Traits)</h3>
        <button type="button" className="mz-btn-small" onClick={() => setTraitModalIndex('new')}>
          ＋ Tambah Trait
        </button>
      </div>
      <div className="mz-learning-table" style={{ maxHeight: 180, overflowY: 'auto' }}>
        {traits.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic', padding: 8 }}>Tidak ada ciri khusus (traits)</div>
        ) : (
          traits.map((t, idx) => (
            <div
              key={idx}
              className="mz-learning-row"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span style={{ fontWeight: 600, minWidth: 120 }}>{formatTraitType(t)}</span>
              <span style={{ flex: 1, padding: '0 8px', color: '#ccc' }}>{formatTraitContent(t, bundle.game)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className="mz-btn-small" onClick={() => setTraitModalIndex(idx)}>Ubah</button>
                <button type="button" className="mz-btn-small danger" onClick={() => handleDeleteTrait(idx)}>×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {traitModalIndex !== null && (
        <ActorTraitModal
          initialTrait={traitModalIndex === 'new' ? null : traits[traitModalIndex]}
          bundle={bundle}
          onConfirm={(t) => {
            if (traitModalIndex === 'new') handleAddTrait(t);
            else handleUpdateTrait(traitModalIndex, t);
          }}
          onDelete={traitModalIndex !== 'new' ? () => handleDeleteTrait(traitModalIndex) : undefined}
          onClose={() => setTraitModalIndex(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Record Detail Form
// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

function RecordDetailForm({
  collection,
  record,
  bundle,
  onUpdate,
  assetUrlMap,
  onImportAssetEntry
}: {
  collection: DatabaseCollection;
  record: Record<string, unknown>;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap: Record<string, string>;
  onImportAssetEntry?: (entry: AssetEntry, dataUrl?: string) => void;
}) {
  const textInput = (key: string, value: unknown) => (
    <input
      type="text"
      value={value == null ? '' : String(value)}
      onChange={(e) => onUpdate({ [key]: e.target.value })}
    />
  );

  const numberInput = (key: string, value: unknown, min = 0) => (
    <input
      type="number"
      min={min}
      value={value == null ? '' : Number(value)}
      onChange={(e) => onUpdate({ [key]: Number(e.target.value) })}
    />
  );

  const selectInput = (
    key: string,
    value: unknown,
    options: Array<{ value: string; label: string }>
  ) => (
    <select
      value={String(value ?? '')}
      onChange={(e) => onUpdate({ [key]: e.target.value })}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const assetSelect = (key: string, value: unknown, typeFilter?: string) => {
    const assets = bundle.assets?.assets || [];
    const filtered = typeFilter ? assets.filter((a) => a.type === typeFilter) : assets;
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onUpdate({ [key]: e.target.value })}
      >
        <option value="">(None / Standar)</option>
        {filtered.map((a) => (
          <option key={a.id} value={a.path || a.id}>
            {a.id} ({a.path})
          </option>
        ))}
      </select>
    );
  };

  const iconPreview = (key: string, value: unknown) => {
    const idx = Number(value ?? 0);
    const iconUrl = assetUrlMap['assets/system/IconSet.png'];
    const srcX = (idx % 16) * 32;
    const srcY = Math.floor(idx / 16) * 32;
    return (
      <div className="mz-icon-field-row">
        <div
          className="mz-icon-preview-box"
          title={`Icon index: ${idx}`}
        >
          {iconUrl ? (
            <div
              className="mz-icon-crop"
              style={{
                backgroundImage: `url("${iconUrl}")`,
                backgroundPosition: `-${srcX}px -${srcY}px`,
                backgroundSize: '512px auto'
              }}
            />
          ) : (
            <span style={{ fontSize: 16 }}>⚡</span>
          )}
        </div>
        <input
          type="number"
          min={0}
          max={500}
          value={idx}
          onChange={(e) => onUpdate({ [key]: Number(e.target.value) })}
          style={{ width: '80px' }}
          title="Icon Index (IconSet.png)"
        />
      </div>
    );
  };

  // ACTORS
  if (collection === 'actors') {
    return (
      <ActorDetailForm
        actor={record as unknown as ActorData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // CLASSES
  if (collection === 'classes') {
    return (
      <ClassDetailForm
        cls={record as unknown as ClassData}
        bundle={bundle}
        onUpdate={onUpdate}
      />
    );
  }

  // SKILLS
  if (collection === 'skills') {
    return (
      <SkillDetailForm
        skill={record as unknown as SkillData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // ITEMS
  if (collection === 'items') {
    return (
      <ItemDetailForm
        item={record as unknown as ItemData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // WEAPONS
  if (collection === 'weapons' || (collection === 'equipment' && (record as EquipmentData).slot === 'weapon')) {
    return (
      <WeaponDetailForm
        weapon={record as unknown as EquipmentData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // ARMORS
  if (collection === 'armors' || (collection === 'equipment' && (record as EquipmentData).slot !== 'weapon')) {
    return (
      <ArmorDetailForm
        armor={record as unknown as EquipmentData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // ENEMIES
  if (collection === 'enemies') {
    return (
      <EnemyDetailForm
        enemy={record as unknown as EnemyData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // TROOPS
  if (collection === 'troops') {
    return (
      <TroopDetailForm
        troop={record as unknown as TroopData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // STATES
  if (collection === 'states') {
    return (
      <StateDetailForm
        state={record as unknown as StateData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // ANIMATIONS
  if (collection === 'animations') {
    return (
      <AnimationDetailForm
        animation={record as unknown as AnimationData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // COMMON EVENTS
  if (collection === 'commonEvents') {
    return (
      <CommonEventDetailForm
        commonEvent={record as unknown as CommonEventData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
      />
    );
  }

  // TILESETS
  if (collection === 'tilesets') {
    return (
      <TilesetDetailForm
        ts={record as unknown as TilesetData}
        bundle={bundle}
        onUpdate={onUpdate}
        assetUrlMap={assetUrlMap}
        textInput={textInput}
        onImportAssetEntry={onImportAssetEntry}
      />
    );
  }

  // Fallback generic
  return (
    <div className="mz-form-card">
      <h3>Data Record</h3>
      <label className="mz-form-field">
        <span>ID</span>
        {textInput('id', record.id)}
      </label>
      <label className="mz-form-field">
        <span>Nama</span>
        {textInput('name', record.name)}
      </label>
    </div>
  );
}
