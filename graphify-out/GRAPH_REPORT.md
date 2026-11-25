# Graph Report - NUSV Engine Next  (2026-11-25)

## Corpus Check
- 186 files · ~177,710 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: .bak 3, .dat 3, (none) 2)

## Summary
- 1795 nodes · 3955 edges · 94 communities (80 shown, 14 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 222 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b67b1e98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- import-mz-database.mjs
- Runtime.ts
- NUSV Engine - Technical Architecture & Clean-Room Specification
- package.json
- .createEventIO
- battle.ts
- NUSV Format & API Specification v1
- map-layers.ts
- Stage 1 Project Foundation & Runtime Audit
- package-win.cjs
- electron/main.ts
- Global Types & Project Bundle
- TermsEditorComponents.tsx
- Frontend TypeScript Configuration
- Audit File Inventory & Hashes
- Electron TypeScript Configuration
- DatabaseView.tsx
- Safe Project Assets Manifest
- MV Sample Marker Asset
- SystemEditorComponents.tsx
- electron_dist_electron_project_service_loadproject
- paint-initial-maps.mjs
- Karpathy Guidelines
- Karpathy Guidelines
- CLAUDE.md
- stage11-tileset-flags.test.js
- world.ts
- 2. Fitur & Perbaikan Utama
- ProjectBundle
- stage13-shift-mapping.test.js
- smoke.cjs
- runCommandList
- AnimationEditorComponents.tsx
- EffekseerBackend.ts
- BattleController.ts
- my-rpg-game3/assets/manifest.json
- useMapOperations.ts
- EditorModals.tsx
- stage4-advanced.test.js
- App.tsx
- abort
- types.ts
- EventCommand
- WorldScene
- CommandFields.tsx
- Stage 8 Production Editor Audit
- Legacy Database Studio Evaluation
- Project Contract v1 Specification
- EditorToolbar.tsx
- Stage 0 Technical Inventory & Proof of Concept
- ref_node_test
- ProgressState
- stage9-database-and-resources.test.js
- TypesEditorComponents.tsx
- EnemyEditorComponents.tsx
- stage6-adventure.test.js
- ClassEditorComponents.tsx
- SkillEditorComponents.tsx
- ref_node_path
- StateEditorComponents.tsx
- verify-package.cjs
- scripts
- stringToUTF8
- useEventEditor.ts
- LegacyQuestShopComponents.tsx
- TroopEditorComponents.tsx
- TextureManager
- _strftime
- assert
- [Unreleased] — 2026-11-23
- emscriptenWebGLGetTexPixelData
- 2026-11-24
- callRuntimeCallbacks
- UTF8ToString
- __glGenObject
- emscriptenWebGLGet
- dependencies
- Karpathy Guidelines
- _classCallCheck
- electron
- _emscripten_resize_heap
- getEnvStrings
- setErrNo
- emscriptenWebGLGetUniform
- emscriptenWebGLGetVertexAttrib
- NUSV Engine Next Architecture
- graphify.md
- model.md
- _alDeleteSources
- _atexit
- demangle
- _emscripten_asm_const_iii
- ___sys_munmap

## God Nodes (most connected - your core abstractions)
1. `ProjectBundle` - 89 edges
2. `runCommandList()` - 87 edges
3. `EventIO` - 79 edges
4. `react` - 55 edges
5. `AudioManager` - 32 edges
6. `ProgressState` - 30 edges
7. `derivedStats()` - 26 edges
8. `WorldScene` - 26 edges
9. `App()` - 22 edges
10. `MapEvent` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2. Pemetaan & Implementasi Lengkap Perintah Tab 1 RPG Maker MZ (Message, Progression, Flow Control, Party, Actor)` --references--> `changeClass()`  [INFERRED]
  CHANGELOG.md → src/core/adventure.ts
- `2. Pemetaan & Implementasi Lengkap Perintah Tab 3 RPG Maker MZ (Scene Control, System Settings, Map, Battle, Advanced)` --references--> `terrainTag()`  [INFERRED]
  CHANGELOG.md → src/core/map-layers.ts
- `2. Paritas Penuh Transfer Player RPG Maker MZ & Visual Map Location Picker Modal` --references--> `validateBundle()`  [INFERRED]
  CHANGELOG.md → src/core/validation.ts
- `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)` --references--> `EventIO`  [INFERRED]
  CHANGELOG.md → src/core/world.ts
- `2. Event System & Movement Route Engine (Standar RPG Maker MZ)` --references--> `runMoveRoute()`  [INFERRED]
  CHANGELOG.md → src/core/world.ts

## Import Cycles
- 2-file cycle: `src/core/battle.ts -> src/core/ctb.ts -> src/core/battle.ts`

## Hyperedges (group relationships)
- **Combat Engine & RPG Progression** — audit_project_contract_v1_ctb_engine, audit_tahap_3_turn_simulation, audit_tahap_4_ctb_mechanics, audit_tahap_4_progression_system, audit_tahap_6_two_phase_boss [EXTRACTED 0.75]
- **Content Workbench & Editor Subsystems** — audit_tahap_8_workspace_ui, audit_tahap_8_four_layers_editor, audit_tahap_8_visual_event_editor, audit_tahap_8_database_collections, audit_tahap_8_diagnostics_lint [EXTRACTED 0.75]
- **Security & Trust Architecture** — audit_extension_security_trust_zones, audit_extension_security_declarative_content, audit_tahap_7_hardening, index_csp_meta, player_csp_meta [EXTRACTED 0.75]
- **NUSV Engine Development Evolution (Stages 0-8)** — audit_tahap_0_overview, audit_tahap_1_overview, audit_tahap_2_overview, audit_tahap_3_overview, audit_tahap_4_overview, audit_tahap_5_overview, audit_tahap_6_overview, audit_tahap_7_overview, audit_tahap_8_overview [EXTRACTED 0.75]

## Communities (94 total, 14 thin omitted)

### Community 0 - "import-mz-database.mjs"
Cohesion: 0.05
Nodes (35): armorMap, assetManifest, classMap, convertedActors, convertedClasses, convertedEnemies, convertedEquipment, convertedItems (+27 more)

### Community 2 - "Runtime.ts"
Cohesion: 0.08
Nodes (11): pixi.js, start(), GameLoop, gamepadButtons, InputAction, InputManager, keys, Runtime (+3 more)

### Community 3 - "NUSV Engine - Technical Architecture & Clean-Room Specification"
Cohesion: 0.29
Nodes (6): 10 Pilar Komponen Utama NUSV Engine:, 1. Ringkasan Eksekutif & Prinsip Clean-Room, 2. Fondasi Arsitektur (Berdasarkan Graphify God Nodes), 3. Struktur Codebase NUSV Engine, NUSV Engine - Technical Architecture & Clean-Room Specification, Prinsip Clean-Room Engineering

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (21): allowScripts, electron@45.4.1, devDependencies, electron@^45.4.1, @types/node@^22.10.2, @types/react@^18.3.12, @types/react-dom@^18.3.1, typescript@^5.7.2 (+13 more)

### Community 5 - ".createEventIO"
Cohesion: 0.13
Nodes (5): RuntimeSettings, AudioManager, DialogueController, ShowTextOptions, wait()

### Community 6 - "battle.ts"
Cohesion: 0.10
Nodes (43): loadProgress(), saveProgress(), validateProgress(), changeClass(), reorderFormation(), actionSpeed(), activateBossPhases(), clamp() (+35 more)

### Community 7 - "NUSV Format & API Specification v1"
Cohesion: 0.13
Nodes (17): Extension & Modding Security Policy, Security Trust Zones, Declarative Event Commands Specification, Host IPC Preload API Contract, NUSV Format & API Specification v1, NUSV Project File Structure, Player Save Architecture v2, Four Tile Layers Schema (+9 more)

### Community 8 - "map-layers.ts"
Cohesion: 0.20
Nodes (22): floodFillLayer(), floodFillRegion(), getAutotileQuadrants(), getDefaultAutotileQuadrants(), getPaletteRegions(), getRegionColor(), layerForTile(), paintLayerBlock() (+14 more)

### Community 9 - "Stage 1 Project Foundation & Runtime Audit"
Cohesion: 0.18
Nodes (11): Prepared Journal Transaction Recovery, Stage 1 Project Foundation & Runtime Audit, TypeScript & PixiJS/WebGL Runtime Boot, Interact/Touch Event Triggers, Four-Way Grid Movement & Collision, Stage 2 Exploration & Basic Event Audit, Six Base Attributes & Derived Combat Stats, Stage 3 Battle Sandbox Audit (+3 more)

### Community 10 - "package-win.cjs"
Cohesion: 0.12
Nodes (14): app, {cpSync,existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync}, {createHash}, electronDist, executable, files, {join,resolve,relative}, manifest (+6 more)

### Community 11 - "electron/main.ts"
Cohesion: 0.06
Nodes (68): deleteAssetFile(), exportAssetFile(), importAssetFile(), readManifest(), safeTarget(), scanProjectAssets(), walk(), writeManifest() (+60 more)

### Community 13 - "TermsEditorComponents.tsx"
Cohesion: 0.22
Nodes (9): TermsData, BASIC_STATUS_FIELDS, COMMAND_FIELDS, DEFAULT_MESSAGES, EditMessageModal(), EditMessageModalProps, PARAM_FIELDS, TermFieldDef (+1 more)

### Community 14 - "Frontend TypeScript Configuration"
Cohesion: 0.13
Nodes (14): compilerOptions, allowJs, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+6 more)

### Community 15 - "Audit File Inventory & Hashes"
Cohesion: 0.15
Nodes (11): crypto, files, fs, listed, listedNames, path, pluginDir, plugins (+3 more)

### Community 16 - "Electron TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, outDir, rootDir, skipLibCheck, strict, target (+2 more)

### Community 17 - "DatabaseView.tsx"
Cohesion: 0.09
Nodes (44): ActiveState, BossPhase, TRAIT_ACTION_PLUS, TRAIT_ATTACK_ELEMENT, TRAIT_ATTACK_SKILL, TRAIT_ATTACK_SPEED, TRAIT_ATTACK_STATE, TRAIT_ATTACK_TIMES (+36 more)

### Community 20 - "SystemEditorComponents.tsx"
Cohesion: 0.10
Nodes (26): EventGraphic, SystemAdvanced, SystemAudioSettings, SystemData, SystemOptions, SystemStartingPosition, SystemSvAttackMotion, SystemTitleScreen (+18 more)

### Community 21 - "electron_dist_electron_project_service_loadproject"
Cohesion: 0.14
Nodes (6): fixture, here, fixture, fixture, fixture, fixture

### Community 22 - "paint-initial-maps.mjs"
Cohesion: 0.10
Nodes (20): field, fieldL0, fieldL1, fieldPath, intro, introL0, introL1, introL2 (+12 more)

### Community 23 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 24 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 25 - "CLAUDE.md"
Cohesion: 0.33
Nodes (4): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution

### Community 27 - "world.ts"
Cohesion: 0.14
Nodes (26): advanceQuest(), completeQuest(), defaultSettings(), startQuest(), autotileMask(), getHighestTileFlagAt(), getTileFlag(), isBushTile() (+18 more)

### Community 28 - "2. Fitur & Perbaikan Utama"
Cohesion: 0.22
Nodes (8): 1. Tujuan, 2. Fitur & Perbaikan Utama, 3. Bukti Verifikasi, A. Toolbar Visual & Redo Tool, Audit Tahap 12 — Sistem Undo / Redo & Map Editor Backend (RPG Maker MZ Standard), B. Shortcut Keyboard, C. History Stack & Drag-Stroke Painting, D. Eliminasi Double-Trigger pada Grid Cells

### Community 29 - "ProjectBundle"
Cohesion: 0.16
Nodes (21): LayerSelection, MapData, MapEvent, ProjectBundle, EditorContextMenusProps, EditorStatusBarProps, InspectorPanelProps, PaletteBlockSelection (+13 more)

### Community 30 - "stage13-shift-mapping.test.js"
Cohesion: 0.09
Nodes (5): fixture, fixture, fixture, fixture, fixture

### Community 31 - "smoke.cjs"
Cohesion: 0.18
Nodes (10): child, electron, env, finish(), { join, resolve }, { mkdtempSync, rmSync }, smokeRoot, { spawn, spawnSync } (+2 more)

### Community 32 - "runCommandList"
Cohesion: 0.05
Nodes (4): 2. Pemetaan & Implementasi Lengkap Perintah Tab 2 RPG Maker MZ (Movement, Character, Picture, Timing, Screen, Audio & Video), EventIO, runCommandList(), runMoveRoute()

### Community 33 - "AnimationEditorComponents.tsx"
Cohesion: 0.09
Nodes (26): 3. Paritas Animasi Effekseer MZ (Queue, Stagger Multi-Target, Mirroring), collectAnimationFrameEvents(), computeAnimationDurationFrames(), AnimationData, AnimationFlashTiming, AnimationRotation, AnimationSoundTiming, AnimationBattlebackModal() (+18 more)

### Community 34 - "EffekseerBackend.ts"
Cohesion: 0.08
Nodes (10): AssetReadPayload, EffekseerContextLike, EffekseerEffectLike, EffekseerGlobal, EffekseerHandleLike, ensureEffekseerRuntime(), getEffekseerGlobal(), IMAGE_EXTS (+2 more)

### Community 35 - "BattleController.ts"
Cohesion: 0.17
Nodes (17): ANIMATION_BASE_DELAY, ANIMATION_NEXT_DELAY, AnimationScheduleEntry, animationShouldMirror(), computeAnimationSchedule(), resolveActionAnimation(), resolveAnimation(), partyResources() (+9 more)

### Community 37 - "useMapOperations.ts"
Cohesion: 0.19
Nodes (17): DEFAULT_TILESETS, generateDungeonData(), resolveSheetPath(), shiftMapData(), TilesetData, DatabaseCollection, DatabaseView(), TilesetImagePickerModal() (+9 more)

### Community 38 - "EditorModals.tsx"
Cohesion: 0.13
Nodes (23): react, TILE_CATALOG, DungeonGeneratorModal(), DungeonGeneratorModalProps, EditorModals(), MapLocationPickerModal(), MapPropertiesModal(), NewProjectModal() (+15 more)

### Community 39 - "stage4-advanced.test.js"
Cohesion: 0.10
Nodes (3): fixture, fixture, fixture

### Community 40 - "App.tsx"
Cohesion: 0.14
Nodes (21): analyzeBundle(), Diagnostic, findReferences(), ReferenceHit, walkCommands(), getPaletteTiles(), RecentProject, App() (+13 more)

### Community 41 - "abort"
Cohesion: 0.14
Nodes (16): abort(), _abort(), addRunDependency(), createWasm(), instantiateArrayBuffer(), instantiateAsync(), receiveInstance(), receiveInstantiatedSource() (+8 more)

### Community 42 - "types.ts"
Cohesion: 0.15
Nodes (15): 2. Event System & Movement Route Engine (Standar RPG Maker MZ), BranchCondition, CommonEventData, EventPageConditions, MapEncounter, MapParallax, MoveRoute, MoveRouteCode (+7 more)

### Community 43 - "EventCommand"
Cohesion: 0.24
Nodes (9): EventCommand, EventPage, CommandButtonDef, CommandGroupDef, EventCommandPickerModalProps, TAB_1_GROUPS, TAB_2_GROUPS, TAB_3_GROUPS (+1 more)

### Community 44 - "WorldScene"
Cohesion: 0.14
Nodes (5): executeCommands(), applyRuntimeSettings(), DebugOverlay, PartyController, WorldScene

### Community 45 - "CommandFields.tsx"
Cohesion: 0.35
Nodes (12): CommonEventDetailForm(), CommonEventSwitchModal(), CommandFields(), commandName, commandPreview(), commandTypes, createCommand(), EventCommandPickerModal() (+4 more)

### Community 46 - "Stage 8 Production Editor Audit"
Cohesion: 0.17
Nodes (12): Cutscene Orchestration & VFX, Stage 6 Advanced JRPG Systems Audit, Quest Journal & Shop/Inn Economy, Ash Warden Two-Phase Encounter, Ten Database Collections Manager, Diagnostic Lint & Search System, Visual Four Tile Layers Editor, Stage 8 Production Editor Audit (+4 more)

### Community 47 - "Legacy Database Studio Evaluation"
Cohesion: 0.22
Nodes (8): Ten Identified Technical Risks (R01-R10), Initial Technical Risk Register, Native Animation & Action Studio Criteria, Legacy Database Studio Evaluation, Content Workbench & Lossless Database Editor, Stage 5 Content Workbench & Legacy Importer Audit, Read-Only Legacy MV Importer, Legacy Source Immutability Sentinel

### Community 48 - "Project Contract v1 Specification"
Cohesion: 0.25
Nodes (8): CTB Battle Charge Threshold 1000, Fixed Logical Resolution 1080x720, Project Contract v1 Specification, Six Attributes & Dual EXP Progression, Semantic Input Action System, Charge-Time Battle (CTB) Implementation, Stage 4 Nusvanir Battle Rules & Progression Audit, Dual EXP & Stat Point Progression

### Community 49 - "EditorToolbar.tsx"
Cohesion: 0.24
Nodes (8): TileDefinition, EditorToolbar(), EditorToolbarProps, MapPaletteCanvas(), MapPaletteCanvasProps, ToolButton(), ToolButtonProps, MZIcons

### Community 50 - "Stage 0 Technical Inventory & Proof of Concept"
Cohesion: 0.29
Nodes (6): Stage 0 Deliverables & Prototype, Stage 0 Technical Inventory & Proof of Concept, Stage 0 Safe Fixture Project, Architectural Package Boundaries, Godot 4 Comparison Evaluation, Technology Decision Document

### Community 52 - "ProgressState"
Cohesion: 0.39
Nodes (4): buyItem(), restAtInn(), ProgressState, AdventureController

### Community 53 - "stage9-database-and-resources.test.js"
Cohesion: 0.12
Nodes (6): assets, byCat, manifestPath, projectRoot, fixture, here

### Community 54 - "TypesEditorComponents.tsx"
Cohesion: 0.22
Nodes (10): TypesData, ChangeMaximumModal(), ChangeMaximumModalProps, DEFAULT_ARMOR_TYPES, DEFAULT_EQUIPMENT_TYPES, DEFAULT_SKILL_TYPES, DEFAULT_WEAPON_TYPES, TypeColumn() (+2 more)

### Community 55 - "EnemyEditorComponents.tsx"
Cohesion: 0.12
Nodes (21): ActorData, ActorProgress, BaseStats, CombatBase, EnemyAction, EnemyData, EnemyDropItem, ItemData (+13 more)

### Community 56 - "stage6-adventure.test.js"
Cohesion: 0.09
Nodes (8): bundle, progress, rows, fixture, fixture, fixture, bundle, bundle

### Community 57 - "ClassEditorComponents.tsx"
Cohesion: 0.27
Nodes (12): ClassData, ClassLearning, calculateExpForLevel(), calculateTotalExp(), ClassDetailForm(), ClassLearningModal(), ExpCurveModal(), generateParamCurve() (+4 more)

### Community 58 - "SkillEditorComponents.tsx"
Cohesion: 0.26
Nodes (15): formatAnimationLabel(), SkillDamage, SkillEffect, ITEM_TYPE_OPTIONS, ItemDetailForm(), DAMAGE_TYPE_OPTIONS, formatEffectContent(), formatEffectType() (+7 more)

### Community 59 - "ref_node_path"
Cohesion: 0.06
Nodes (14): audioDir, destBase, imgDir, walk(), app, entries, {join,resolve}, packageData() (+6 more)

### Community 60 - "StateEditorComponents.tsx"
Cohesion: 0.22
Nodes (18): CombatBonuses, EquipmentData, StateData, ActorDetailForm(), ActorTraitModal(), formatTraitContent(), formatTraitType(), ARMOR_EQUIPMENT_TYPES (+10 more)

### Community 61 - "verify-package.cjs"
Cohesion: 0.13
Nodes (13): child, cleanRoot, {cpSync,existsSync,mkdtempSync,readFileSync,rmSync}, data, environment, exe, {join,resolve}, smokeRoot (+5 more)

### Community 62 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, balance, build, build:electron, dev, licenses, package:win, release:verify (+5 more)

### Community 63 - "stringToUTF8"
Cohesion: 0.18
Nodes (12): _emscripten_glGetActiveAttrib(), _emscripten_glGetActiveUniform(), _emscripten_glGetProgramInfoLog(), _emscripten_glGetShaderInfoLog(), _emscripten_glGetShaderSource(), _emscripten_glGetString(), _glGetString(), intArrayFromString() (+4 more)

### Community 64 - "useEventEditor.ts"
Cohesion: 0.39
Nodes (6): clone(), EditorContextMenus(), clone(), eventJson(), useEventEditor(), UseEventEditorParams

### Community 65 - "LegacyQuestShopComponents.tsx"
Cohesion: 0.16
Nodes (13): 1. Komponen Editor yang Diarsipkan, 2. Skema Data (Data Model), 3. Logika Runtime Petualangan (`src/core/adventure.ts`), 4. Rencana Pengembangan Masa Depan (Sistem Kompleks), Dokumentasi Arsip: Sistem Quest & Shop (Tahap Awal), QuestData (`src/core/types.ts`), ShopData (`src/core/types.ts`), QuestData (+5 more)

### Community 66 - "TroopEditorComponents.tsx"
Cohesion: 0.25
Nodes (10): TroopMember, TroopPage, TroopPageConditions, DEFAULT_BATTLEBACKS_1, DEFAULT_BATTLEBACKS_2, formatTroopConditions(), TroopBattlebackModal(), TroopBattleTestModal() (+2 more)

### Community 67 - "TextureManager"
Cohesion: 0.31
Nodes (3): 2. Show Text & Face Graphic Picker (Standar RPG Maker MZ), Direction, TextureManager

### Community 68 - "_strftime"
Cohesion: 0.27
Nodes (10): __addDays(), __arraySum(), __isLeapYear(), _strftime(), compareByDay(), getFirstWeekStartDate(), getWeekBasedYear(), _strftime_l() (+2 more)

### Community 69 - "assert"
Cohesion: 0.20
Nodes (11): addFunctionWasm(), assert(), ccall(), convertReturnValue(), convertJsFunctionToWasm(), cwrap(), _emscripten_set_main_loop(), _emscripten_set_main_loop_timing() (+3 more)

### Community 70 - "[Unreleased] — 2026-11-23"
Cohesion: 0.20
Nodes (9): 1. Map Editor Backend & Sistem Undo / Redo, 1. Sistem Tema Terpadu (Unified Theme System: theme.css), 2. Perbaikan Kontras Teks Formulir & Placeholder di Database Editor & Modals, 2. Sistem Tileset & Passage Direction (Standar RPG Maker MZ), 3. Database Editor & Image Picker Modal, 4. Pengujian & Verifikasi, Changelog — NUSV Engine Next, [Unreleased] — 2026-11-23 (+1 more)

### Community 71 - "emscriptenWebGLGetTexPixelData"
Cohesion: 0.20
Nodes (9): __colorChannelsInGlTextureFormat(), __computeUnpackAlignedImageSize(), _emscripten_glReadPixels(), _emscripten_glTexImage2D(), _emscripten_glTexSubImage2D(), emscriptenWebGLGetTexPixelData(), _glTexImage2D(), __heapAccessShiftForWebGLHeap() (+1 more)

### Community 72 - "2026-11-24"
Cohesion: 0.22
Nodes (9): 1. Alert Konfirmasi Penutupan Aplikasi Saat Perubahan Belum Disimpan (Save, Tidak, dan Cancel), 2026-11-24, 2. Frontend UI Event Editor & Alur Kerja Penambahan Event (100% RPG Maker MZ Style), 2. Paritas Penuh Transfer Player RPG Maker MZ & Visual Map Location Picker Modal, 2. Pemetaan & Implementasi Lengkap Perintah Tab 1 RPG Maker MZ (Message, Progression, Flow Control, Party, Actor), 2. Pemetaan & Implementasi Lengkap Perintah Tab 3 RPG Maker MZ (Scene Control, System Settings, Map, Battle, Advanced), 2. Refactor UI & UX: Perbaikan Tampilan Responsif dan Bebas Terpotong di Seluruh Bagian Editor, 3. Perbaikan Visual Event di Peta & Kontras Dialog Perintah (+1 more)

### Community 73 - "callRuntimeCallbacks"
Cohesion: 0.31
Nodes (9): addOnPostRun(), addOnPreRun(), callRuntimeCallbacks(), initRuntime(), postRun(), preMain(), preRun(), run() (+1 more)

### Community 74 - "UTF8ToString"
Cohesion: 0.25
Nodes (9): _alcOpenDevice(), _emscripten_glBindAttribLocation(), _emscripten_glGetAttribLocation(), _emscripten_glGetUniformLocation(), _glGetAttribLocation(), _glGetUniformLocation(), jstoi_q(), UTF8ArrayToString() (+1 more)

### Community 75 - "__glGenObject"
Cohesion: 0.22
Nodes (9): _emscripten_glGenBuffers(), _emscripten_glGenFramebuffers(), _emscripten_glGenRenderbuffers(), _emscripten_glGenTextures(), _emscripten_glGenVertexArraysOES(), _glGenBuffers(), _glGenFramebuffers(), __glGenObject() (+1 more)

### Community 76 - "emscriptenWebGLGet"
Cohesion: 0.22
Nodes (9): _emscripten_glGetBooleanv(), _emscripten_glGetFloatv(), _emscripten_glGetIntegerv(), _emscripten_glGetQueryObjecti64vEXT(), _emscripten_glGetQueryObjectui64vEXT(), emscriptenWebGLGet(), _glGetBooleanv(), _glGetIntegerv() (+1 more)

### Community 77 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, pixi.js@^8.16.0, react@^18.3.1, react-dom@^18.3.1, @zaniar/effekseer-webgl-wasm@^1.62.5000, react-dom, @zaniar/effekseer-webgl-wasm

### Community 78 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 79 - "_classCallCheck"
Cohesion: 0.33
Nodes (6): _classCallCheck(), ContextStates(), Effekseer(), EffekseerContext(), EffekseerEffect(), EffekseerHandle()

### Community 80 - "electron"
Cohesion: 0.40
Nodes (3): { contextBridge, ipcRenderer }, { contextBridge, ipcRenderer }, electron

### Community 81 - "_emscripten_resize_heap"
Cohesion: 0.40
Nodes (5): alignUp(), _emscripten_get_heap_size(), emscripten_realloc_buffer(), _emscripten_resize_heap(), updateGlobalBufferAndViews()

### Community 82 - "getEnvStrings"
Cohesion: 0.40
Nodes (5): _environ_get(), _environ_sizes_get(), getEnvStrings(), __getExecutableName(), writeAsciiToMemory()

### Community 83 - "setErrNo"
Cohesion: 0.67
Nodes (3): _clock_gettime(), ___map_file(), setErrNo()

### Community 84 - "emscriptenWebGLGetUniform"
Cohesion: 0.67
Nodes (3): _emscripten_glGetUniformfv(), _emscripten_glGetUniformiv(), emscriptenWebGLGetUniform()

### Community 85 - "emscriptenWebGLGetVertexAttrib"
Cohesion: 0.67
Nodes (3): _emscripten_glGetVertexAttribfv(), _emscripten_glGetVertexAttribiv(), emscriptenWebGLGetVertexAttrib()

### Community 86 - "NUSV Engine Next Architecture"
Cohesion: 0.67
Nodes (3): 4-Layer Tile Editor & Tools, NUSV Engine Next Architecture, NUSV Engine Vertical Slice

## Knowledge Gaps
- **35 isolated node(s):** `Sample Marker Asset`, `Cutscene Orchestration & VFX`, `Quest Journal & Shop/Inn Economy`, `Ash Warden Two-Phase Encounter`, `Ten Database Collections Manager` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 741 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `abort` to `Runtime.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `runCommandList()` (e.g. with `.abortBattle()` and `.battle()`) actually correct?**
  _`runCommandList()` has 73 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Sample Marker Asset`, `Cutscene Orchestration & VFX`, `Quest Journal & Shop/Inn Economy` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `import-mz-database.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Are the 2 inferred relationships involving `EventIO` (e.g. with `2. Pemetaan & Implementasi Lengkap Perintah Tab 2 RPG Maker MZ (Movement, Character, Picture, Timing, Screen, Audio & Video)` and `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)`) actually correct?**
  _`EventIO` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `effekseer.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.008695652173913044 - nodes in this community are weakly interconnected._
- **Should `Runtime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08405797101449275 - nodes in this community are weakly interconnected._