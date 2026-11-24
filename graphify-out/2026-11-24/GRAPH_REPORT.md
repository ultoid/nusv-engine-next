# Graph Report - NUSV Engine Next  (2026-11-24)

## Corpus Check
- 192 files · ~206,338 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 145 file(s) not represented in the graph (top: .efkefc 120, .efkmodel 7, .bak 3)

## Summary
- 1325 nodes · 3145 edges · 68 communities (57 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `689a7202`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- import-mz-database.mjs
- [Unreleased] — 2026-11-24
- Runtime.ts
- NUSV Engine - Technical Architecture & Clean-Room Specification
- IPC Preload & Package Security
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
- stage10-actor-traits.test.js
- paint-initial-maps.mjs
- Karpathy Guidelines
- Karpathy Guidelines
- CLAUDE.md
- stage11-tileset-flags.test.js
- world.ts
- 2. Fitur & Perbaikan Utama
- ProjectBundle
- stage13-shift-mapping.test.js
- license-report.cjs
- runCommandList
- AnimationEditorComponents.tsx
- my-rpg-game2/assets/manifest.json
- my-rpg-game/assets/manifest.json
- my-rpg-game3/assets/manifest.json
- MapTreePanel.tsx
- EditorModals.tsx
- ref_node_url
- App.tsx
- ArmorEditorComponents.tsx
- MoveRouteModal.tsx
- TextureManager
- WorldScene
- CommandFields.tsx
- Stage 8 Production Editor Audit
- Legacy Database Studio Evaluation
- Project Contract v1 Specification
- EditorToolbar.tsx
- Stage 0 Technical Inventory & Proof of Concept
- Player Save Architecture v2
- ProgressState
- stage9-database-and-resources.test.js
- TypesEditorComponents.tsx
- EnemyEditorComponents.tsx
- ref_node_url
- ClassEditorComponents.tsx
- SkillEditorComponents.tsx
- ref_node_path
- StateEditorComponents.tsx
- verify-package.cjs
- .exit
- stage5-tools.test.js
- useMapOperations.ts
- LegacyQuestShopComponents.tsx
- TroopEditorComponents.tsx
- Dokumentasi Arsip: Sistem Quest & Shop (Tahap Awal)

## God Nodes (most connected - your core abstractions)
1. `ProjectBundle` - 89 edges
2. `runCommandList()` - 87 edges
3. `EventIO` - 79 edges
4. `react` - 55 edges
5. `ProgressState` - 30 edges
6. `AudioManager` - 28 edges
7. `derivedStats()` - 26 edges
8. `WorldScene` - 25 edges
9. `App()` - 22 edges
10. `MapEvent` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2. Paritas Penuh Transfer Player RPG Maker MZ & Visual Map Location Picker Modal` --references--> `validateBundle()`  [INFERRED]
  CHANGELOG.md → src/core/validation.ts
- `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)` --references--> `WorldScene`  [INFERRED]
  CHANGELOG.md → src/runtime/WorldScene.ts
- `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)` --references--> `EventIO`  [INFERRED]
  CHANGELOG.md → src/core/world.ts
- `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)` --references--> `DialogueController`  [INFERRED]
  CHANGELOG.md → src/runtime/DialogueController.ts
- `2. Pemetaan & Implementasi Lengkap Perintah Tab 1 RPG Maker MZ (Message, Progression, Flow Control, Party, Actor)` --references--> `changeClass()`  [INFERRED]
  CHANGELOG.md → src/core/adventure.ts

## Import Cycles
- 2-file cycle: `src/core/battle.ts -> src/core/ctb.ts -> src/core/battle.ts`

## Hyperedges (group relationships)
- **Combat Engine & RPG Progression** — audit_project_contract_v1_ctb_engine, audit_tahap_3_turn_simulation, audit_tahap_4_ctb_mechanics, audit_tahap_4_progression_system, audit_tahap_6_two_phase_boss [EXTRACTED 0.75]
- **Content Workbench & Editor Subsystems** — audit_tahap_8_workspace_ui, audit_tahap_8_four_layers_editor, audit_tahap_8_visual_event_editor, audit_tahap_8_database_collections, audit_tahap_8_diagnostics_lint [EXTRACTED 0.75]
- **Security & Trust Architecture** — audit_extension_security_trust_zones, audit_extension_security_declarative_content, audit_tahap_7_hardening, index_csp_meta, player_csp_meta [EXTRACTED 0.75]
- **NUSV Engine Development Evolution (Stages 0-8)** — audit_tahap_0_overview, audit_tahap_1_overview, audit_tahap_2_overview, audit_tahap_3_overview, audit_tahap_4_overview, audit_tahap_5_overview, audit_tahap_6_overview, audit_tahap_7_overview, audit_tahap_8_overview [EXTRACTED 0.75]

## Communities (68 total, 11 thin omitted)

### Community 0 - "import-mz-database.mjs"
Cohesion: 0.05
Nodes (35): armorMap, assetManifest, classMap, convertedActors, convertedClasses, convertedEnemies, convertedEquipment, convertedItems (+27 more)

### Community 1 - "[Unreleased] — 2026-11-24"
Cohesion: 0.14
Nodes (13): 1. Alert Konfirmasi Penutupan Aplikasi Saat Perubahan Belum Disimpan (Save, Tidak, dan Cancel), 1. Map Editor Backend & Sistem Undo / Redo, 2. Frontend UI Event Editor & Alur Kerja Penambahan Event (100% RPG Maker MZ Style), 2. Paritas Penuh Transfer Player RPG Maker MZ & Visual Map Location Picker Modal, 2. Refactor UI & UX: Perbaikan Tampilan Responsif dan Bebas Terpotong di Seluruh Bagian Editor, 2. Sistem Tileset & Passage Direction (Standar RPG Maker MZ), 3. Database Editor & Image Picker Modal, 3. Perbaikan Visual Event di Peta & Kontras Dialog Perintah (+5 more)

### Community 2 - "Runtime.ts"
Cohesion: 0.08
Nodes (12): pixi.js, start(), GameLoop, gamepadButtons, InputAction, InputManager, keys, Logger (+4 more)

### Community 3 - "NUSV Engine - Technical Architecture & Clean-Room Specification"
Cohesion: 0.29
Nodes (6): 10 Pilar Komponen Utama NUSV Engine:, 1. Ringkasan Eksekutif & Prinsip Clean-Room, 2. Fondasi Arsitektur (Berdasarkan Graphify God Nodes), 3. Struktur Codebase NUSV Engine, NUSV Engine - Technical Architecture & Clean-Room Specification, Prinsip Clean-Room Engineering

### Community 4 - "IPC Preload & Package Security"
Cohesion: 0.05
Nodes (42): { contextBridge, ipcRenderer }, { contextBridge, ipcRenderer }, allowScripts, electron@45.4.1, dependencies, pixi.js@^8.16.0, react@^18.3.1, react-dom@^18.3.1 (+34 more)

### Community 5 - ".createEventIO"
Cohesion: 0.14
Nodes (4): RuntimeSettings, AudioManager, DialogueController, wait()

### Community 6 - "battle.ts"
Cohesion: 0.07
Nodes (53): 2. Pemetaan & Implementasi Lengkap Perintah Tab 1 RPG Maker MZ (Message, Progression, Flow Control, Party, Actor), loadProgress(), saveProgress(), validateProgress(), changeClass(), reorderFormation(), actionSpeed(), activateBossPhases() (+45 more)

### Community 7 - "NUSV Format & API Specification v1"
Cohesion: 0.15
Nodes (15): Extension & Modding Security Policy, Security Trust Zones, Declarative Event Commands Specification, Host IPC Preload API Contract, NUSV Format & API Specification v1, NUSV Project File Structure, Four Tile Layers Schema, Self-Contained Windows Distribution Package (+7 more)

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
Cohesion: 0.10
Nodes (42): ActiveState, BossPhase, TRAIT_ACTION_PLUS, TRAIT_ATTACK_ELEMENT, TRAIT_ATTACK_SKILL, TRAIT_ATTACK_SPEED, TRAIT_ATTACK_STATE, TRAIT_ATTACK_TIMES (+34 more)

### Community 20 - "SystemEditorComponents.tsx"
Cohesion: 0.10
Nodes (26): EventGraphic, SystemAdvanced, SystemAudioSettings, SystemData, SystemOptions, SystemStartingPosition, SystemSvAttackMotion, SystemTitleScreen (+18 more)

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
Cohesion: 0.20
Nodes (21): 2. Pemetaan & Implementasi Lengkap Perintah Tab 3 RPG Maker MZ (Scene Control, System Settings, Map, Battle, Advanced), getHighestTileFlagAt(), getTileFlag(), isBushTile(), isCounterTile(), isDamageFloorTile(), isLadderTile(), terrainTag() (+13 more)

### Community 28 - "2. Fitur & Perbaikan Utama"
Cohesion: 0.22
Nodes (8): 1. Tujuan, 2. Fitur & Perbaikan Utama, 3. Bukti Verifikasi, A. Toolbar Visual & Redo Tool, Audit Tahap 12 — Sistem Undo / Redo & Map Editor Backend (RPG Maker MZ Standard), B. Shortcut Keyboard, C. History Stack & Drag-Stroke Painting, D. Eliminasi Double-Trigger pada Grid Cells

### Community 29 - "ProjectBundle"
Cohesion: 0.16
Nodes (18): DEFAULT_TILESETS, ProjectBundle, TilesetData, MapTreePanelProps, DatabaseViewProps, UseCanvasPainterParams, UseEventEditorParams, UseMapOperationsParams (+10 more)

### Community 30 - "stage13-shift-mapping.test.js"
Cohesion: 0.09
Nodes (4): fixture, fixture, fixture, fixture

### Community 31 - "license-report.cjs"
Cohesion: 0.29
Nodes (7): app, entries, {join,resolve}, packageData(), packages, {readFileSync,writeFileSync}, root

### Community 32 - "runCommandList"
Cohesion: 0.05
Nodes (5): 2. Pemetaan & Implementasi Lengkap Perintah Tab 2 RPG Maker MZ (Movement, Character, Picture, Timing, Screen, Audio & Video), EventIO, runCommandList(), runMovement(), runMoveRoute()

### Community 33 - "AnimationEditorComponents.tsx"
Cohesion: 0.11
Nodes (25): AnimationData, AnimationFlashTiming, AnimationRotation, AnimationSoundTiming, BranchCondition, CommonEventData, EventPageConditions, MapEncounter (+17 more)

### Community 37 - "MapTreePanel.tsx"
Cohesion: 0.23
Nodes (15): getPaletteTiles(), resolveSheetPath(), TileDefinition, MapPaletteCanvas(), MapPaletteCanvasProps, MapTreePanel(), DatabaseView(), TilesetCanvasPreview() (+7 more)

### Community 38 - "EditorModals.tsx"
Cohesion: 0.11
Nodes (22): TILE_CATALOG, DatabaseCollection, useProjectIO(), UseProjectIOParams, DungeonGeneratorModal(), DungeonGeneratorModalProps, EditorModals(), EditorModalsProps (+14 more)

### Community 39 - "ref_node_url"
Cohesion: 0.18
Nodes (7): fixture, fixture, fixture, fixture, fixture, fixture, fixture

### Community 40 - "App.tsx"
Cohesion: 0.12
Nodes (27): analyzeBundle(), Diagnostic, findReferences(), ReferenceHit, walkCommands(), LayerSelection, MapData, MapEvent (+19 more)

### Community 41 - "ArmorEditorComponents.tsx"
Cohesion: 0.15
Nodes (15): ActorData, ActorProgress, BaseStats, CombatBonuses, EnemyData, EquipmentData, ItemData, SkillData (+7 more)

### Community 42 - "MoveRouteModal.tsx"
Cohesion: 0.33
Nodes (6): 2. Event System & Movement Route Engine (Standar RPG Maker MZ), MoveRoute, MoveRouteCode, MoveRouteCommand, moveCodeLabels, MoveRouteModalProps

### Community 43 - "TextureManager"
Cohesion: 0.31
Nodes (3): 2. Show Text & Face Graphic Picker (Standar RPG Maker MZ), Window, TextureManager

### Community 44 - "WorldScene"
Cohesion: 0.21
Nodes (4): autotileMask(), executeCommands(), DebugOverlay, WorldScene

### Community 45 - "CommandFields.tsx"
Cohesion: 0.19
Nodes (22): react, EventCommand, EventPage, CommonEventDetailForm(), CommonEventSwitchModal(), CommandFields(), commandName, commandPreview() (+14 more)

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
Cohesion: 0.36
Nodes (5): EditorToolbar(), EditorToolbarProps, ToolButton(), ToolButtonProps, MZIcons

### Community 50 - "Stage 0 Technical Inventory & Proof of Concept"
Cohesion: 0.29
Nodes (6): Stage 0 Deliverables & Prototype, Stage 0 Technical Inventory & Proof of Concept, Stage 0 Safe Fixture Project, Architectural Package Boundaries, Godot 4 Comparison Evaluation, Technology Decision Document

### Community 51 - "Player Save Architecture v2"
Cohesion: 0.33
Nodes (5): Player Save Architecture v2, Mandatory Vertical Slice Playtest Flow, Player & Release Test Checklist, Failure Recovery Acceptance Gates, Engine Upgrade & Migration Guide

### Community 52 - "ProgressState"
Cohesion: 0.19
Nodes (11): advanceQuest(), buyItem(), completeQuest(), defaultSettings(), restAtInn(), startQuest(), ProgressState, QuestProgress (+3 more)

### Community 54 - "TypesEditorComponents.tsx"
Cohesion: 0.20
Nodes (11): TypesData, ChangeMaximumModal(), ChangeMaximumModalProps, DEFAULT_ARMOR_TYPES, DEFAULT_ELEMENTS, DEFAULT_EQUIPMENT_TYPES, DEFAULT_SKILL_TYPES, DEFAULT_WEAPON_TYPES (+3 more)

### Community 55 - "EnemyEditorComponents.tsx"
Cohesion: 0.27
Nodes (10): CombatBase, EnemyAction, EnemyDropItem, DEFAULT_ENEMY_BATTLERS, EnemyActionModal(), EnemyDetailForm(), EnemyDropItemModal(), EnemyImagePickerModal() (+2 more)

### Community 56 - "ref_node_url"
Cohesion: 0.11
Nodes (9): bundle, progress, rows, fixture, fixture, fixture, bundle, bundle (+1 more)

### Community 57 - "ClassEditorComponents.tsx"
Cohesion: 0.27
Nodes (12): ClassData, ClassLearning, calculateExpForLevel(), calculateTotalExp(), ClassDetailForm(), ClassLearningModal(), ExpCurveModal(), generateParamCurve() (+4 more)

### Community 58 - "SkillEditorComponents.tsx"
Cohesion: 0.22
Nodes (17): SkillDamage, SkillEffect, ITEM_TYPE_OPTIONS, ItemDetailForm(), DAMAGE_TYPE_OPTIONS, DEFAULT_ELEMENTS, DEFAULT_SKILL_TYPES, DEFAULT_WEAPON_TYPES (+9 more)

### Community 59 - "ref_node_path"
Cohesion: 0.09
Nodes (9): audioDir, destBase, imgDir, walk(), assets, byCat, manifestPath, projectRoot (+1 more)

### Community 60 - "StateEditorComponents.tsx"
Cohesion: 0.27
Nodes (14): StateData, ActorDetailForm(), ActorTraitModal(), formatTraitContent(), formatTraitType(), ArmorDetailForm(), RecordDetailForm(), TraitsEditorCard() (+6 more)

### Community 61 - "verify-package.cjs"
Cohesion: 0.08
Nodes (23): child, electron, env, finish(), { join, resolve }, { mkdtempSync, rmSync }, smokeRoot, { spawn, spawnSync } (+15 more)

### Community 64 - "useMapOperations.ts"
Cohesion: 0.29
Nodes (9): generateDungeonData(), shiftMapData(), clone(), EditorContextMenus(), EditorContextMenusProps, clone(), eventJson(), useEventEditor() (+1 more)

### Community 65 - "LegacyQuestShopComponents.tsx"
Cohesion: 0.36
Nodes (7): 1. Komponen Editor yang Diarsipkan, QuestData, ShopData, LegacyQuestDetailForm(), LegacyQuestFormProps, LegacyShopDetailForm(), LegacyShopFormProps

### Community 66 - "TroopEditorComponents.tsx"
Cohesion: 0.25
Nodes (10): TroopMember, TroopPage, TroopPageConditions, DEFAULT_BATTLEBACKS_1, DEFAULT_BATTLEBACKS_2, formatTroopConditions(), TroopBattlebackModal(), TroopBattleTestModal() (+2 more)

### Community 67 - "Dokumentasi Arsip: Sistem Quest & Shop (Tahap Awal)"
Cohesion: 0.29
Nodes (6): 2. Skema Data (Data Model), 3. Logika Runtime Petualangan (`src/core/adventure.ts`), 4. Rencana Pengembangan Masa Depan (Sistem Kompleks), Dokumentasi Arsip: Sistem Quest & Shop (Tahap Awal), QuestData (`src/core/types.ts`), ShopData (`src/core/types.ts`)

## Knowledge Gaps
- **35 isolated node(s):** `Sample Marker Asset`, `Cutscene Orchestration & VFX`, `Quest Journal & Shop/Inn Economy`, `Ash Warden Two-Phase Encounter`, `Ten Database Collections Manager` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 478 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectBundle` connect `ProjectBundle` to `Runtime.ts`, `battle.ts`, `map-layers.ts`, `electron/main.ts`, `Global Types & Project Bundle`, `TermsEditorComponents.tsx`, `DatabaseView.tsx`, `SystemEditorComponents.tsx`, `world.ts`, `AnimationEditorComponents.tsx`, `MapTreePanel.tsx`, `EditorModals.tsx`, `App.tsx`, `ArmorEditorComponents.tsx`, `TextureManager`, `WorldScene`, `CommandFields.tsx`, `EditorToolbar.tsx`, `ProgressState`, `TypesEditorComponents.tsx`, `EnemyEditorComponents.tsx`, `ClassEditorComponents.tsx`, `SkillEditorComponents.tsx`, `StateEditorComponents.tsx`, `.exit`, `useMapOperations.ts`, `LegacyQuestShopComponents.tsx`, `TroopEditorComponents.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `runCommandList()` (e.g. with `.abortBattle()` and `.battle()`) actually correct?**
  _`runCommandList()` has 73 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Sample Marker Asset`, `Cutscene Orchestration & VFX`, `Quest Journal & Shop/Inn Economy` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `import-mz-database.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Why does `EventIO` connect `runCommandList` to `world.ts`, `TextureManager`, `.createEventIO`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `EventIO` (e.g. with `2. Pemetaan & Implementasi Lengkap Perintah Tab 2 RPG Maker MZ (Movement, Character, Picture, Timing, Screen, Audio & Video)` and `2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)`) actually correct?**
  _`EventIO` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `[Unreleased] — 2026-11-24` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._