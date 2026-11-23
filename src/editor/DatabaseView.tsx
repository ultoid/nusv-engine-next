import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ActorData, BaseStats, BossPhase, CombatBase, CombatBonuses, EnemyData, EquipmentData, ItemData, SkillData, StateData, TroopData, TraitData } from '../core/combat-types.js';
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
import type { ClassData, ProjectBundle, QuestData, ShopData, TilesetData, AssetEntry } from '../core/types.js';
import { TILE_CATALOG, DEFAULT_TILESETS, resolveSheetPath } from '../core/map-layers.js';
import { getCachedImage, preloadImages } from './imageCache.js';
import { ActorDetailForm } from './ActorEditorComponents.js';
import { addAssetToBundle } from '../core/resource-manager.js';

export type DatabaseCollection =
  | 'actors'
  | 'classes'
  | 'skills'
  | 'items'
  | 'equipment'
  | 'enemies'
  | 'troops'
  | 'states'
  | 'tilesets'
  | 'quests'
  | 'shops'
  | 'system';

export const DATABASE_COLLECTIONS: Array<{ id: DatabaseCollection; label: string; icon?: string }> = [
  { id: 'actors', label: 'Actors' },
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'items', label: 'Items' },
  { id: 'equipment', label: 'Weapons' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'troops', label: 'Troops' },
  { id: 'states', label: 'States' },
  { id: 'tilesets', label: 'Tilesets' },
  { id: 'quests', label: 'Common Events' },
  { id: 'shops', label: 'Shops' },
  { id: 'system', label: 'System' }
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



  const getRecords = (): unknown[] => {
    if (collection === 'system') return [];
    if (collection === 'tilesets') {
      const val = (localGame as Record<string, unknown>).tilesets;
      return Array.isArray(val) && val.length ? val : DEFAULT_TILESETS;
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

  const handleAddRecord = () => {
    flushCommit();
    if (collection === 'system') return;
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
        growth: { str: 1, vit: 1 }
      };
    } else if (collection === 'skills') {
      newEntry = {
        id: newId,
        name: 'New Skill',
        kind: 'physical',
        power: 1.0,
        mpCost: 0,
        spCost: 5,
        speed: 0,
        target: 'enemy'
      };
    } else if (collection === 'items') {
      newEntry = {
        id: newId,
        name: 'New Item',
        kind: 'heal',
        healHp: 50
      };
    } else if (collection === 'equipment') {
      newEntry = {
        id: newId,
        name: 'New Equipment',
        slot: 'weapon',
        weaponType: 'melee',
        stats: { str: 2 },
        bonuses: { atk: 5 }
      };
    } else if (collection === 'enemies') {
      newEntry = {
        id: newId,
        name: 'New Enemy',
        ai: 'aggressive',
        stats: { str: 6, int: 4, dex: 6, luk: 4, agi: 6, vit: 6 },
        base: { hp: 40, mp: 0, atk: 6, def: 4, mat: 2, mdf: 2, agi: 5 },
        skillIds: [],
        reward: { gold: 10, baseExp: 25, classExp: 20 }
      };
    } else if (collection === 'troops') {
      const defaultEnemy = localGame.enemies[0]?.id ?? 'enemy.moss';
      newEntry = {
        id: newId,
        name: 'New Troop',
        enemyIds: [defaultEnemy]
      };
    } else if (collection === 'states') {
      newEntry = {
        id: newId,
        name: 'New State',
        duration: 3,
        damagePerTurn: 0,
        preventsAction: false
      };
    } else if (collection === 'quests') {
      newEntry = {
        id: newId,
        name: 'New Quest',
        description: 'Deskripsi quest baru.',
        objectives: [{ id: 'obj.1', text: 'Tujuan awal', target: 1 }],
        rewards: { gold: 50 }
      };
    } else if (collection === 'shops') {
      newEntry = {
        id: newId,
        name: 'New Shop',
        items: localGame.items[0] ? [{ itemId: localGame.items[0].id, price: 10 }] : []
      };
    } else if (collection === 'tilesets') {
      newEntry = {
        id: newId,
        name: 'New Tileset',
        mode: 1,
        tilesetNames: ['Outside_A1', 'Outside_A2', '', '', 'Outside_A5', 'Outside_B', '', '', '']
      };
    }

    const nextList = [...records, newEntry];
    const nextGame = {
      ...localGame,
      [collection]: nextList
    };
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
    if (collection === 'system' || selectedIndex === null || !selectedRecord) return;
    const cloned = structuredClone(selectedRecord);
    cloned.id = `${cloned.id}-copy`;
    cloned.name = `${String(cloned.name || '')} (Copy)`;

    const nextList = [...records, cloned];
    const nextGame = {
      ...localGame,
      [collection]: nextList
    };
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
    if (collection === 'system' || selectedIndex === null || !selectedRecord) return;
    const recordName = String(selectedRecord.name || selectedRecord.id);
    if (!confirm(`Hapus "${recordName}" dari database?`)) return;

    const nextList = records.filter((_, i) => i !== selectedIndex);
    const nextGame = {
      ...localGame,
      [collection]: nextList
    };
    setLocalGame(nextGame);
    const nextBundle: ProjectBundle = {
      ...bundle,
      game: nextGame,
      project: localProject
    };
    onCommit(nextBundle, `${recordName} dihapus dari database.`);
    setSelectedIndex(nextList.length > 0 ? Math.min(selectedIndex, nextList.length - 1) : null);
  };

  const handleUpdateRecord = (patch: Record<string, unknown>) => {
    if (collection === 'system' || selectedIndex === null || !selectedRecord) return;
    const updated = { ...selectedRecord, ...patch };
    const nextList = [...records];
    nextList[selectedIndex] = updated;

    const nextGame = {
      ...localGame,
      [collection]: nextList
    };
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
    if (collection === 'system') {
      setJsonDraft(JSON.stringify({ project: localProject, terms: localGame.translations }, null, 2));
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
      if (collection === 'system') {
        const nextProject = parsed.project || localProject;
        const nextGame = {
          ...localGame,
          translations: parsed.terms || localGame.translations
        };
        setLocalProject(nextProject);
        setLocalGame(nextGame);
        const nextBundle: ProjectBundle = {
          ...bundle,
          project: nextProject,
          game: nextGame
        };
        onCommit(nextBundle, 'Konfigurasi sistem diperbarui via JSON.');
      } else if (selectedIndex !== null) {
        if (!parsed || typeof parsed !== 'object' || !parsed.id) {
          throw new Error('Record harus berupa objek dan memiliki properti "id"');
        }
        const nextList = [...records];
        nextList[selectedIndex] = parsed;
        const nextGame = {
          ...localGame,
          [collection]: nextList
        };
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
      {collection === 'system' ? (
        <SystemSettingsEditor
          bundle={currentBundle}
          onUpdateProject={handleUpdateProject}
          onFlushCommit={flushCommit}
          viewMode={viewMode}
          jsonDraft={jsonDraft}
          setJsonDraft={setJsonDraft}
          jsonError={jsonError}
          onSwitchToJson={handleSwitchToJson}
          onApplyJson={handleApplyJson}
          assetUrlMap={assetUrlMap}
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
                      <span className="mz-db-record-name">{String(r.name || r.id)}</span>
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
// System Settings Form
// ------------------------------------------------------------------------------------------------

function SystemSettingsEditor({
  bundle,
  onUpdateProject,
  onFlushCommit,
  viewMode,
  jsonDraft,
  setJsonDraft,
  jsonError,
  onSwitchToJson,
  onApplyJson,
  assetUrlMap
}: {
  bundle: ProjectBundle;
  onUpdateProject: (patch: Partial<ProjectBundle['project']>) => void;
  onFlushCommit?: () => void;
  viewMode: 'form' | 'json';
  jsonDraft: string;
  setJsonDraft: (v: string) => void;
  jsonError: string | null;
  onSwitchToJson: () => void;
  onApplyJson: () => void;
  assetUrlMap: Record<string, string>;
}) {
  const project = bundle.project;
  const maps = bundle.project.maps.map((id) => bundle.maps[id]).filter(Boolean);
  const actors = bundle.game.actors;

  const updateProject = (patch: Partial<typeof bundle.project>) => {
    onUpdateProject(patch);
  };

  const handlePartyChange = (index: number, actorId: string) => {
    const nextParty = [...bundle.project.party];
    nextParty[index] = actorId;
    updateProject({ party: nextParty });
  };

  const handleAddParty = () => {
    if (bundle.project.party.length >= 4) return;
    const available = actors.find((a) => !bundle.project.party.includes(a.id));
    if (available) {
      updateProject({ party: [...bundle.project.party, available.id] });
    }
  };

  const handleRemoveParty = (index: number) => {
    if (bundle.project.party.length <= 1) return;
    const nextParty = bundle.project.party.filter((_, i) => i !== index);
    updateProject({ party: nextParty });
  };

  return (
    <section className="mz-db-content mz-db-system-pane">
      <div className="mz-db-detail-header">
        <div className="mz-db-detail-title">
          <span className="mv-kicker">DATABASE / SYSTEM</span>
          <h2>Pengaturan Sistem Proyek (System 1 & System 2)</h2>
        </div>
        <div className="mz-db-view-switch">
          <button className={viewMode === 'form' ? 'active' : ''} onClick={() => onFlushCommit?.()}>
            Form
          </button>
          <button className={viewMode === 'json' ? 'active' : ''} onClick={onSwitchToJson}>
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
            <button className="primary" onClick={onApplyJson}>
              Terapkan JSON
            </button>
          </div>
        </div>
      ) : (
        <div className="mz-db-form-view mz-system-form">
          <div className="mz-form-grid-2">
            <div className="mz-form-card">
              <h3>Informasi Proyek</h3>
              <label className="mz-form-field">
                <span>Nama / Judul Game</span>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => updateProject({ title: e.target.value })}
                />
              </label>
              <label className="mz-form-field">
                <span>Project ID (Internal)</span>
                <input
                  type="text"
                  value={project.projectId}
                  onChange={(e) => updateProject({ projectId: e.target.value })}
                />
              </label>
              <div className="mz-form-row">
                <label className="mz-form-field">
                  <span>Resolusi Logis (Lebar)</span>
                  <input
                    type="number"
                    value={project.logicalResolution.width}
                    onChange={(e) =>
                      updateProject({
                        logicalResolution: { ...project.logicalResolution, width: Number(e.target.value) }
                      })
                    }
                  />
                </label>
                <label className="mz-form-field">
                  <span>Resolusi Logis (Tinggi)</span>
                  <input
                    type="number"
                    value={project.logicalResolution.height}
                    onChange={(e) =>
                      updateProject({
                        logicalResolution: { ...project.logicalResolution, height: Number(e.target.value) }
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mz-form-card">
              <h3>Lokasi Awal Pemain (Starting Position)</h3>
              <label className="mz-form-field">
                <span>Map Awal</span>
                <select
                  value={project.start.mapId}
                  onChange={(e) => updateProject({ start: { ...project.start, mapId: e.target.value } })}
                >
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </label>
              <div className="mz-form-row">
                <label className="mz-form-field">
                  <span>Koordinat X</span>
                  <input
                    type="number"
                    value={project.start.x}
                    min={0}
                    onChange={(e) => updateProject({ start: { ...project.start, x: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-form-field">
                  <span>Koordinat Y</span>
                  <input
                    type="number"
                    value={project.start.y}
                    min={0}
                    onChange={(e) => updateProject({ start: { ...project.start, y: Number(e.target.value) } })}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mz-form-card">
            <div className="mz-card-header-actions">
              <h3>Anggota Party Awal (Starting Party: 1–4 Karakter)</h3>
              <button
                className="mz-btn-small"
                disabled={project.party.length >= 4}
                onClick={handleAddParty}
              >
                ＋ Tambah Anggota
              </button>
            </div>
            <div className="mz-party-list">
              {project.party.map((actorId, idx) => (
                <div key={idx} className="mz-party-row">
                  <span>Slot #{idx + 1}:</span>
                  <select
                    value={actorId}
                    onChange={(e) => handlePartyChange(idx, e.target.value)}
                  >
                    {actors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.id})
                      </option>
                    ))}
                  </select>
                  <button
                    className="mz-btn-del-sm"
                    disabled={project.party.length <= 1}
                    onClick={() => handleRemoveParty(idx)}
                    title="Hapus dari party"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mz-form-card">
            <h3>Vehicle Images (Kendaraan)</h3>
            <div className="mz-actor-images-card">
              <div className="mz-image-slot-col">
                <span className="slot-label">Boat:</span>
                <div className="mz-checkered-bg mz-character-preview-box">
                  {assetUrlMap['assets/characters/Vehicle.png'] ? (
                    <div
                      className="mz-character-crop"
                      style={{
                        backgroundImage: `url("${assetUrlMap['assets/characters/Vehicle.png']}")`,
                        backgroundSize: '576px 384px',
                        backgroundPosition: '-48px 0px'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 24 }}>⛵</span>
                  )}
                </div>
              </div>

              <div className="mz-image-slot-col">
                <span className="slot-label">Ship:</span>
                <div className="mz-checkered-bg mz-character-preview-box">
                  {assetUrlMap['assets/characters/Vehicle.png'] ? (
                    <div
                      className="mz-character-crop"
                      style={{
                        backgroundImage: `url("${assetUrlMap['assets/characters/Vehicle.png']}")`,
                        backgroundSize: '576px 384px',
                        backgroundPosition: '-192px 0px'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 24 }}>🚢</span>
                  )}
                </div>
              </div>

              <div className="mz-image-slot-col">
                <span className="slot-label">Airship:</span>
                <div className="mz-checkered-bg mz-character-preview-box">
                  {assetUrlMap['assets/characters/Vehicle.png'] ? (
                    <div
                      className="mz-character-crop"
                      style={{
                        backgroundImage: `url("${assetUrlMap['assets/characters/Vehicle.png']}")`,
                        backgroundSize: '576px 384px',
                        backgroundPosition: '-336px 0px'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 24 }}>🛸</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
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
// Record Detail Form
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
    const cls = record as unknown as ClassData;
    const growth = cls.growth || { str: 1, vit: 1 };

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Kelas (Class Settings)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', cls.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Kelas</span>
              {textInput('name', cls.name)}
            </label>
            <label className="mz-form-field">
              <span>Tier (1–5)</span>
              {numberInput('tier', cls.tier, 1)}
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Pertumbuhan Stat per Level (Base Stat Growth)</h3>
          <div className="mz-stats-grid">
            {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as Array<keyof BaseStats>).map((st) => (
              <label key={st} className="mz-stat-cell">
                <span>+{st.toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  value={growth[st] ?? 0}
                  onChange={(e) =>
                    onUpdate({
                      growth: { ...growth, [st]: Number(e.target.value) }
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SKILLS
  if (collection === 'skills') {
    const skill = record as unknown as SkillData;
    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Skill</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', skill.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Skill</span>
              {textInput('name', skill.name)}
            </label>
            <label className="mz-form-field">
              <span>Icon</span>
              {iconPreview('iconIndex', (skill as unknown as Record<string, unknown>).iconIndex ?? 76)}
            </label>
            <label className="mz-form-field">
              <span>Tipe Aksi (Kind)</span>
              {selectInput('kind', skill.kind, [
                { value: 'physical', label: 'Physical (Serangan Fisik)' },
                { value: 'magical', label: 'Magical (Sihir)' },
                { value: 'heal', label: 'Heal (Pemulihan)' },
                { value: 'revive', label: 'Revive (Kebangkitan)' }
              ])}
            </label>
          </div>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Target (Scope)</span>
              {selectInput('target', skill.target, [
                { value: 'enemy', label: 'Musuh (Enemy)' },
                { value: 'ally', label: 'Sekutu (Ally)' }
              ])}
            </label>
            <label className="mz-form-field">
              <span>Elemen</span>
              {textInput('element', skill.element)}
            </label>
            <label className="mz-form-field">
              <span>Power (Pengali Damage)</span>
              <input
                type="number"
                step="0.05"
                value={skill.power}
                onChange={(e) => onUpdate({ power: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Biaya & Kecepatan (Invocation & Cost)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Biaya MP (MP Cost)</span>
              {numberInput('mpCost', skill.mpCost, 0)}
            </label>
            <label className="mz-form-field">
              <span>Biaya SP / TP</span>
              {numberInput('spCost', skill.spCost, 0)}
            </label>
            <label className="mz-form-field">
              <span>Speed Modifier</span>
              <input
                type="number"
                value={skill.speed ?? 0}
                onChange={(e) => onUpdate({ speed: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Efek Status & Mekanik Tambahan</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Status Efek (State ID)</span>
              <select
                value={skill.stateId || ''}
                onChange={(e) => onUpdate({ stateId: e.target.value || undefined })}
              >
                <option value="">(Tidak ada)</option>
                {bundle.game.states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="mz-form-field">
              <span>Peluang Status (0.0 – 1.0)</span>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={skill.stateChance ?? 0}
                onChange={(e) => onUpdate({ stateChance: Number(e.target.value) })}
              />
            </label>
            <label className="mz-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(skill.armorPiercing)}
                onChange={(e) => onUpdate({ armorPiercing: e.target.checked })}
              />
              <span>Tembus Pertahanan (Armor Piercing)</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ITEMS
  if (collection === 'items') {
    const item = record as unknown as ItemData;
    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Item</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', item.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Item</span>
              {textInput('name', item.name)}
            </label>
            <label className="mz-form-field">
              <span>Icon</span>
              {iconPreview('iconIndex', (item as unknown as Record<string, unknown>).iconIndex ?? 176)}
            </label>
            <label className="mz-form-field">
              <span>Tipe Item</span>
              {selectInput('kind', item.kind, [
                { value: 'key', label: 'Key Item (Benda Penting)' },
                { value: 'heal', label: 'Heal (Pemulihan)' },
                { value: 'revive', label: 'Revive (Kebangkitan)' },
                { value: 'stat-reset', label: 'Stat Reset (Pengatur Ulang)' }
              ])}
            </label>
          </div>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Pemulihan HP (Flat)</span>
              {numberInput('healHp', item.healHp, 0)}
            </label>
            <label className="mz-form-field">
              <span>Rasio Kebangkitan HP (0.0 – 1.0)</span>
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={item.reviveHpRatio ?? 0}
                onChange={(e) => onUpdate({ reviveHpRatio: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // EQUIPMENT
  if (collection === 'equipment') {
    const equip = record as unknown as EquipmentData;
    const stats: Partial<BaseStats> = equip.stats || {};
    const bonuses: CombatBonuses = equip.bonuses || {};

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Perlengkapan (Weapons & Armors)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', equip.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Perlengkapan</span>
              {textInput('name', equip.name)}
            </label>
            <label className="mz-form-field">
              <span>Icon</span>
              {iconPreview('iconIndex', (equip as unknown as Record<string, unknown>).iconIndex ?? 96)}
            </label>
            <label className="mz-form-field">
              <span>Slot Perlengkapan</span>
              {selectInput('slot', equip.slot, [
                { value: 'weapon', label: 'Senjata (Weapon)' },
                { value: 'head', label: 'Kepala (Head)' },
                { value: 'body', label: 'Tubuh (Body)' },
                { value: 'accessory', label: 'Aksesoris (Accessory)' }
              ])}
            </label>
            {equip.slot === 'weapon' && (
              <label className="mz-form-field">
                <span>Tipe Senjata</span>
                {selectInput('weaponType', equip.weaponType, [
                  { value: 'melee', label: 'Melee' },
                  { value: 'finesse', label: 'Finesse' },
                  { value: 'ranged', label: 'Ranged' }
                ])}
              </label>
            )}
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Bonus Parameter Tempur (Combat Bonuses)</h3>
          <div className="mz-stats-grid">
            {(['atk', 'def', 'mat', 'mdf', 'hp', 'mp', 'sp', 'agi'] as Array<keyof CombatBonuses>).map((bn) => (
              <label key={bn} className="mz-stat-cell">
                <span>+{bn.toUpperCase()}</span>
                <input
                  type="number"
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

        <div className="mz-form-card">
          <h3>Bonus Base Stats</h3>
          <div className="mz-stats-grid">
            {(['str', 'int', 'dex', 'luk', 'agi', 'vit'] as Array<keyof BaseStats>).map((st) => (
              <label key={st} className="mz-stat-cell">
                <span>+{st.toUpperCase()}</span>
                <input
                  type="number"
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
      </div>
    );
  }

  // ENEMIES
  if (collection === 'enemies') {
    const enemy = record as unknown as EnemyData;
    const stats: BaseStats = enemy.stats || { str: 6, int: 4, dex: 6, luk: 4, agi: 6, vit: 6 };
    const base: CombatBase = enemy.base || { hp: 40, mp: 0, atk: 6, def: 4, mat: 2, mdf: 2, agi: 5 };
    const reward = enemy.reward || { gold: 10, baseExp: 20, classExp: 15 };
    const rawBattler = (enemy as unknown as Record<string, unknown>).battlerImage as string | undefined;
    const battlerPath = rawBattler || `assets/enemies/${enemy.name}.png`;
    const battlerUrl = assetUrlMap[battlerPath] || assetUrlMap[`assets/enemies/${enemy.name}.png`] || assetUrlMap['assets/enemies/Goblin.png'];

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>General Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr', gap: 16 }}>
            <div>
              <label className="mz-form-field">
                <span>Name:</span>
                {textInput('name', enemy.name)}
              </label>
              <div className="mz-enemy-preview-card" style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>Image:</span>
                <div className="mz-checkered-bg mz-enemy-preview-box">
                  {battlerUrl ? (
                    <img src={battlerUrl} alt={enemy.name} className="mz-enemy-preview-img" />
                  ) : (
                    <span style={{ fontSize: 40 }}>👹</span>
                  )}
                </div>
                <div style={{ width: '100%' }}>
                  {assetSelect('battlerImage', enemy.battlerImage || `assets/enemies/${enemy.name}.png`, 'image')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="mz-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <label className="mz-stat-cell">
                  <span>Max HP:</span>
                  <input
                    type="number"
                    min={1}
                    value={base.hp ?? 40}
                    onChange={(e) => onUpdate({ base: { ...base, hp: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>Max MP:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.mp ?? 0}
                    onChange={(e) => onUpdate({ base: { ...base, mp: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>Attack:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.atk ?? 6}
                    onChange={(e) => onUpdate({ base: { ...base, atk: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>Defense:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.def ?? 4}
                    onChange={(e) => onUpdate({ base: { ...base, def: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>M.Attack:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.mat ?? 2}
                    onChange={(e) => onUpdate({ base: { ...base, mat: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>M.Defense:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.mdf ?? 2}
                    onChange={(e) => onUpdate({ base: { ...base, mdf: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>Agility:</span>
                  <input
                    type="number"
                    min={0}
                    value={base.agi ?? 5}
                    onChange={(e) => onUpdate({ base: { ...base, agi: Number(e.target.value) } })}
                  />
                </label>
                <label className="mz-stat-cell">
                  <span>Luck:</span>
                  <input
                    type="number"
                    min={0}
                    value={stats.luk ?? 4}
                    onChange={(e) => onUpdate({ stats: { ...stats, luk: Number(e.target.value) } })}
                  />
                </label>
              </div>

              <div className="mz-form-row" style={{ marginTop: 8 }}>
                <label className="mz-form-field">
                  <span>ID:</span>
                  {textInput('id', enemy.id)}
                </label>
                <label className="mz-form-field">
                  <span>AI Archetype:</span>
                  {selectInput('ai', enemy.ai, [
                    { value: 'aggressive', label: 'Aggressive (Fisik / Agresif)' },
                    { value: 'caster', label: 'Caster (Sihir / Taktis)' },
                    { value: 'guardian', label: 'Guardian (Bertahan)' }
                  ])}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mz-form-card">
          <h3>Imbalan Kemenangan (Rewards & Drops)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Gold</span>
              <input
                type="number"
                min={0}
                value={reward.gold ?? 0}
                onChange={(e) =>
                  onUpdate({
                    reward: { ...reward, gold: Number(e.target.value) }
                  })
                }
              />
            </label>
            <label className="mz-form-field">
              <span>Base EXP</span>
              <input
                type="number"
                min={0}
                value={reward.baseExp ?? 0}
                onChange={(e) =>
                  onUpdate({
                    reward: { ...reward, baseExp: Number(e.target.value) }
                  })
                }
              />
            </label>
            <label className="mz-form-field">
              <span>Class EXP</span>
              <input
                type="number"
                min={0}
                value={reward.classExp ?? 0}
                onChange={(e) =>
                  onUpdate({
                    reward: { ...reward, classExp: Number(e.target.value) }
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // TROOPS
  if (collection === 'troops') {
    const troop = record as unknown as TroopData;
    const memberEnemyIds = Array.isArray(troop.enemyIds) ? troop.enemyIds : [];

    const handleAddMember = (enemyId: string) => {
      onUpdate({ enemyIds: [...memberEnemyIds, enemyId] });
    };

    const handleRemoveMember = (idx: number) => {
      onUpdate({ enemyIds: memberEnemyIds.filter((_, i) => i !== idx) });
    };

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Kelompok Pertempuran (Troop Settings)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', troop.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Troop</span>
              {textInput('name', troop.name)}
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <div className="mz-card-header-actions">
            <h3>Anggota Musuh dalam Pertempuran ({memberEnemyIds.length} Enemies)</h3>
            <div className="mz-add-inline">
              <select
                id="select-add-enemy"
                defaultValue={bundle.game.enemies[0]?.id || ''}
              >
                {bundle.game.enemies.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id})
                  </option>
                ))}
              </select>
              <button
                className="mz-btn-small"
                onClick={() => {
                  const el = document.getElementById('select-add-enemy') as HTMLSelectElement;
                  if (el && el.value) handleAddMember(el.value);
                }}
              >
                ＋ Tambah ke Troop
              </button>
            </div>
          </div>

          <div className="mz-troop-members-list">
            {memberEnemyIds.map((enemyId, idx) => {
              const enemyObj = bundle.game.enemies.find((e) => e.id === enemyId);
              return (
                <div key={idx} className="mz-troop-member-item">
                  <span>#{idx + 1}: <strong>{enemyObj?.name || enemyId}</strong></span>
                  <small>ID: {enemyId}</small>
                  <button className="mz-btn-del-sm" onClick={() => handleRemoveMember(idx)}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // STATES
  if (collection === 'states') {
    const state = record as unknown as StateData;
    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Pengaturan Efek Status (Buff / Debuff)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', state.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Status</span>
              {textInput('name', state.name)}
            </label>
            <label className="mz-form-field">
              <span>Durasi (Turns)</span>
              {numberInput('duration', state.duration, 1)}
            </label>
          </div>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>Damage per Turn (DoT)</span>
              {numberInput('damagePerTurn', state.damagePerTurn, 0)}
            </label>
            <label className="mz-form-field">
              <span>PDR (Fisik Rate)</span>
              <input
                type="number"
                step="0.1"
                value={state.pdr ?? 1.0}
                onChange={(e) => onUpdate({ pdr: Number(e.target.value) })}
              />
            </label>
            <label className="mz-form-field">
              <span>MDR (Sihir Rate)</span>
              <input
                type="number"
                step="0.1"
                value={state.mdr ?? 1.0}
                onChange={(e) => onUpdate({ mdr: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="mz-form-checkbox">
            <input
              type="checkbox"
              checked={Boolean(state.preventsAction)}
              onChange={(e) => onUpdate({ preventsAction: e.target.checked })}
            />
            <span>Mencegah Aksi Karakter (Stun / Sleep / Freeze)</span>
          </label>
        </div>
      </div>
    );
  }

  // QUESTS
  if (collection === 'quests') {
    const quest = record as unknown as QuestData;
    const objectives = quest.objectives || [];

    const handleAddObjective = () => {
      const objId = `obj.${Date.now().toString(36)}`;
      onUpdate({
        objectives: [...objectives, { id: objId, text: 'Tujuan quest baru', target: 1 }]
      });
    };

    const handleRemoveObjective = (idx: number) => {
      onUpdate({
        objectives: objectives.filter((_, i) => i !== idx)
      });
    };

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Informasi Quest</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', quest.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Quest</span>
              {textInput('name', quest.name)}
            </label>
          </div>
          <label className="mz-form-field">
            <span>Deskripsi / Alur Cerita</span>
            <textarea
              value={quest.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
            />
          </label>
        </div>

        <div className="mz-form-card">
          <div className="mz-card-header-actions">
            <h3>Tujuan Quest (Objectives)</h3>
            <button className="mz-btn-small" onClick={handleAddObjective}>
              ＋ Tambah Tujuan
            </button>
          </div>
          <div className="mz-learning-table">
            {objectives.map((obj, idx) => (
              <div key={idx} className="mz-learning-row">
                <span>Teks:</span>
                <input
                  type="text"
                  value={obj.text}
                  onChange={(e) => {
                    const next = [...objectives];
                    next[idx] = { ...next[idx], text: e.target.value };
                    onUpdate({ objectives: next });
                  }}
                  style={{ flex: 1 }}
                />
                <span>Target:</span>
                <input
                  type="number"
                  min={1}
                  value={obj.target}
                  onChange={(e) => {
                    const next = [...objectives];
                    next[idx] = { ...next[idx], target: Number(e.target.value) };
                    onUpdate({ objectives: next });
                  }}
                  style={{ width: '60px' }}
                />
                <button className="mz-btn-del-sm" onClick={() => handleRemoveObjective(idx)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SHOPS
  if (collection === 'shops') {
    const shop = record as unknown as ShopData;
    const items = shop.items || [];

    const handleAddItem = () => {
      const defaultItem = bundle.game.items[0]?.id || 'item.potion';
      onUpdate({
        items: [...items, { itemId: defaultItem, price: 10 }]
      });
    };

    const handleRemoveItem = (idx: number) => {
      onUpdate({
        items: items.filter((_, i) => i !== idx)
      });
    };

    return (
      <div className="mz-db-grid-sections">
        <div className="mz-form-card">
          <h3>Informasi Toko (Shop Settings)</h3>
          <div className="mz-form-row">
            <label className="mz-form-field">
              <span>ID</span>
              {textInput('id', shop.id)}
            </label>
            <label className="mz-form-field">
              <span>Nama Toko</span>
              {textInput('name', shop.name)}
            </label>
          </div>
        </div>

        <div className="mz-form-card">
          <div className="mz-card-header-actions">
            <h3>Daftar Barang Dagangan (Shop Goods)</h3>
            <button className="mz-btn-small" onClick={handleAddItem}>
              ＋ Tambah Barang
            </button>
          </div>
          <div className="mz-learning-table">
            {items.map((it, idx) => (
              <div key={idx} className="mz-learning-row">
                <span>Barang:</span>
                <select
                  value={it.itemId}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], itemId: e.target.value };
                    onUpdate({ items: next });
                  }}
                  style={{ flex: 1 }}
                >
                  {bundle.game.items.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.name} ({itm.id})
                    </option>
                  ))}
                </select>
                <span>Harga:</span>
                <input
                  type="number"
                  min={0}
                  value={it.price}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], price: Number(e.target.value) };
                    onUpdate({ items: next });
                  }}
                  style={{ width: '80px' }}
                />
                <span>Gold</span>
                <button className="mz-btn-del-sm" onClick={() => handleRemoveItem(idx)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
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
