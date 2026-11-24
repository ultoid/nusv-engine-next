# Graph Report - NUSV Engine Next  (2026-11-24)

## Corpus Check
- 135 files · ~124,750 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 145 file(s) not represented in the graph (top: .efkefc 120, .efkmodel 7, .bak 3)

## Summary
- 917 nodes · 1906 edges · 37 communities (28 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `29191ea4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- import-mz-database.mjs
- ref_node_path
- PixiJS Audio & Player Runtime
- NUSV Engine - Technical Architecture & Clean-Room Specification
- IPC Preload & Package Security
- Adventure Mode Controller
- battle.ts
- Extension Security & Host API Docs
- Diagnostics & Bundle Analysis
- Audit Risk & Stage Roadmaps
- Smoke Testing & Child Process
- electron/main.ts
- Global Types & Project Bundle
- Windows Packaging Scripts
- Frontend TypeScript Configuration
- Audit File Inventory & Hashes
- Electron TypeScript Configuration
- DatabaseView.tsx
- Safe Project Assets Manifest
- MV Sample Marker Asset
- PartyController.ts
- stage10-actor-traits.test.js
- paint-initial-maps.mjs
- Karpathy Guidelines
- Karpathy Guidelines
- CLAUDE.md
- stage11-tileset-flags.test.js
- ref_node_path
- 2. Fitur & Perbaikan Utama
- stage1-project-service.test.js
- stage13-shift-mapping.test.js
- license-report.cjs
- [Unreleased] — 2026-11-23
- stage5-tools.test.js
- my-rpg-game2/assets/manifest.json
- my-rpg-game/assets/manifest.json
- my-rpg-game3/assets/manifest.json

## God Nodes (most connected - your core abstractions)
1. `ProjectBundle` - 32 edges
2. `App()` - 30 edges
3. `ProgressState` - 29 edges
4. `derivedStats()` - 25 edges
5. `WorldScene` - 22 edges
6. `AudioManager` - 20 edges
7. `InputManager` - 17 edges
8. `resolveRound()` - 17 edges
9. `executeCommands()` - 16 edges
10. `TextureManager` - 15 edges

## Surprising Connections (you probably didn't know these)
- `importMvSubset()` --calls--> `validateBundle()`  [EXTRACTED]
  electron/import-service.ts → src/core/validation.ts
- `validateProgress()` --calls--> `derivedStats()`  [EXTRACTED]
  electron/progress-service.ts → src/core/battle.ts
- `importAssetFile()` --calls--> `inferAssetCategory()`  [EXTRACTED]
  electron/asset-service.ts → src/core/resource-manager.ts
- `scanProjectAssets()` --calls--> `inferAssetCategory()`  [EXTRACTED]
  electron/asset-service.ts → src/core/resource-manager.ts
- `Editor HTML Host Entrypoint` --conceptually_related_to--> `RPG Maker-Style Visual Workspace UI`  [INFERRED]
  index.html → audit/TAHAP_8.md

## Import Cycles
- 2-file cycle: `src/core/battle.ts -> src/core/ctb.ts -> src/core/battle.ts`

## Hyperedges (group relationships)
- **Combat Engine & RPG Progression** — audit_project_contract_v1_ctb_engine, audit_tahap_3_turn_simulation, audit_tahap_4_ctb_mechanics, audit_tahap_4_progression_system, audit_tahap_6_two_phase_boss [EXTRACTED 0.75]
- **Content Workbench & Editor Subsystems** — audit_tahap_8_workspace_ui, audit_tahap_8_four_layers_editor, audit_tahap_8_visual_event_editor, audit_tahap_8_database_collections, audit_tahap_8_diagnostics_lint [EXTRACTED 0.75]
- **Security & Trust Architecture** — audit_extension_security_trust_zones, audit_extension_security_declarative_content, audit_tahap_7_hardening, index_csp_meta, player_csp_meta [EXTRACTED 0.75]
- **NUSV Engine Development Evolution (Stages 0-8)** — audit_tahap_0_overview, audit_tahap_1_overview, audit_tahap_2_overview, audit_tahap_3_overview, audit_tahap_4_overview, audit_tahap_5_overview, audit_tahap_6_overview, audit_tahap_7_overview, audit_tahap_8_overview [EXTRACTED 0.75]

## Communities (37 total, 9 thin omitted)

### Community 0 - "import-mz-database.mjs"
Cohesion: 0.05
Nodes (35): armorMap, assetManifest, classMap, convertedActors, convertedClasses, convertedEnemies, convertedEquipment, convertedItems (+27 more)

### Community 1 - "ref_node_path"
Cohesion: 0.11
Nodes (10): bundle, progress, rows, fixture, fixture, fixture, fixture, bundle (+2 more)

### Community 2 - "PixiJS Audio & Player Runtime"
Cohesion: 0.06
Nodes (13): pixi.js, start(), AudioManager, GameLoop, gamepadButtons, InputAction, InputManager, keys (+5 more)

### Community 3 - "NUSV Engine - Technical Architecture & Clean-Room Specification"
Cohesion: 0.29
Nodes (6): 10 Pilar Komponen Utama NUSV Engine:, 1. Ringkasan Eksekutif & Prinsip Clean-Room, 2. Fondasi Arsitektur (Berdasarkan Graphify God Nodes), 3. Struktur Codebase NUSV Engine, NUSV Engine - Technical Architecture & Clean-Room Specification, Prinsip Clean-Room Engineering

### Community 4 - "IPC Preload & Package Security"
Cohesion: 0.05
Nodes (42): { contextBridge, ipcRenderer }, { contextBridge, ipcRenderer }, allowScripts, electron@45.4.1, dependencies, pixi.js@^8.16.0, react@^18.3.1, react-dom@^18.3.1 (+34 more)

### Community 5 - "Adventure Mode Controller"
Cohesion: 0.05
Nodes (37): advanceQuest(), buyItem(), completeQuest(), defaultSettings(), restAtInn(), startQuest(), getHighestTileFlagAt(), getTileFlag() (+29 more)

### Community 6 - "battle.ts"
Cohesion: 0.12
Nodes (32): actionSpeed(), activateBossPhases(), clamp(), clone(), createBattle(), currentTarget(), damage(), definition() (+24 more)

### Community 7 - "Extension Security & Host API Docs"
Cohesion: 0.06
Nodes (40): Extension & Modding Security Policy, Security Trust Zones, Declarative Event Commands Specification, Host IPC Preload API Contract, NUSV Format & API Specification v1, NUSV Project File Structure, Player Save Architecture v2, Four Tile Layers Schema (+32 more)

### Community 8 - "Diagnostics & Bundle Analysis"
Cohesion: 0.07
Nodes (59): react, analyzeBundle(), Diagnostic, findReferences(), ReferenceHit, walkCommands(), autotileMask(), DEFAULT_TILESETS (+51 more)

### Community 9 - "Audit Risk & Stage Roadmaps"
Cohesion: 0.07
Nodes (25): Ten Identified Technical Risks (R01-R10), Initial Technical Risk Register, Native Animation & Action Studio Criteria, Legacy Database Studio Evaluation, Stage 0 Deliverables & Prototype, Stage 0 Technical Inventory & Proof of Concept, Stage 0 Safe Fixture Project, Prepared Journal Transaction Recovery (+17 more)

### Community 10 - "Smoke Testing & Child Process"
Cohesion: 0.08
Nodes (23): child, electron, env, finish(), { join, resolve }, { mkdtempSync, rmSync }, smokeRoot, { spawn, spawnSync } (+15 more)

### Community 11 - "electron/main.ts"
Cohesion: 0.08
Nodes (48): deleteAssetFile(), exportAssetFile(), importAssetFile(), readManifest(), safeTarget(), scanProjectAssets(), walk(), writeManifest() (+40 more)

### Community 12 - "Global Types & Project Bundle"
Cohesion: 0.07
Nodes (20): addAssetToBundle(), ASSET_CATEGORIES, AssetCategory, AssetUsageReport, auditProjectResources(), cleanUnusedAssetsFromBundle(), filterAssets(), inferAssetCategory() (+12 more)

### Community 13 - "Windows Packaging Scripts"
Cohesion: 0.12
Nodes (14): app, {cpSync,existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync}, {createHash}, electronDist, executable, files, {join,resolve,relative}, manifest (+6 more)

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
Cohesion: 0.06
Nodes (78): baseStats(), id(), importMvSubset(), ImportReport, mergeById(), noteStat(), number(), param() (+70 more)

### Community 20 - "PartyController.ts"
Cohesion: 0.19
Nodes (15): changeClass(), reorderFormation(), allocateStat(), baseExpForLevel(), classExpForLevel(), classLevelCap(), emptyStats(), equip() (+7 more)

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

### Community 27 - "ref_node_path"
Cohesion: 0.12
Nodes (10): audioDir, destBase, imgDir, walk(), assets, byCat, manifestPath, projectRoot (+2 more)

### Community 28 - "2. Fitur & Perbaikan Utama"
Cohesion: 0.22
Nodes (8): 1. Tujuan, 2. Fitur & Perbaikan Utama, 3. Bukti Verifikasi, A. Toolbar Visual & Redo Tool, Audit Tahap 12 — Sistem Undo / Redo & Map Editor Backend (RPG Maker MZ Standard), B. Shortcut Keyboard, C. History Stack & Drag-Stroke Painting, D. Eliminasi Double-Trigger pada Grid Cells

### Community 30 - "stage13-shift-mapping.test.js"
Cohesion: 0.13
Nodes (3): fixture, fixture, fixture

### Community 31 - "license-report.cjs"
Cohesion: 0.29
Nodes (7): app, entries, {join,resolve}, packageData(), packages, {readFileSync,writeFileSync}, root

### Community 32 - "[Unreleased] — 2026-11-23"
Cohesion: 0.29
Nodes (6): 1. Map Editor Backend & Sistem Undo / Redo, 2. Sistem Tileset & Passage Direction (Standar RPG Maker MZ), 3. Database Editor & Image Picker Modal, 4. Pengujian & Verifikasi, Changelog — NUSV Engine Next, [Unreleased] — 2026-11-23

## Knowledge Gaps
- **35 isolated node(s):** `Sample Marker Asset`, `Host IPC Preload API Contract`, `NUSV Project File Structure`, `Four Tile Layers Schema`, `Mandatory Vertical Slice Playtest Flow` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 385 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectBundle` connect `Global Types & Project Bundle` to `PixiJS Audio & Player Runtime`, `Adventure Mode Controller`, `battle.ts`, `Diagnostics & Bundle Analysis`, `electron/main.ts`, `DatabaseView.tsx`, `PartyController.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `Sample Marker Asset`, `Host IPC Preload API Contract`, `NUSV Project File Structure` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `import-mz-database.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Why does `ProgressState` connect `Adventure Mode Controller` to `PixiJS Audio & Player Runtime`, `battle.ts`, `electron/main.ts`, `DatabaseView.tsx`, `PartyController.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `ref_node_path` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Why does `electron` connect `IPC Preload & Package Security` to `Smoke Testing & Child Process`, `electron/main.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `PixiJS Audio & Player Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.06398730830248546 - nodes in this community are weakly interconnected._