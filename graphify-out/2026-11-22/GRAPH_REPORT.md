# Graph Report - NUSV Engine Next  (2026-11-22)

## Corpus Check
- Corpus is ~21,400 words - fits in a single context window. You may not need a graph.

## Summary
- 572 nodes · 1192 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Adventure Progress Service
- Electron Distribution Bundles
- PixiJS Audio & Player Runtime
- MV Subset Import Service
- IPC Preload & Package Security
- Adventure Mode Controller
- Turn-Based Battle System
- Extension Security & Host API Docs
- Diagnostics & Bundle Analysis
- Audit Risk & Stage Roadmaps
- Smoke Testing & Child Process
- Electron Main Process Lifecycle
- Global Types & Project Bundle
- Windows Packaging Scripts
- Frontend TypeScript Configuration
- Audit File Inventory & Hashes
- Electron TypeScript Configuration
- Project README Documentation
- Safe Project Assets Manifest
- MV Sample Marker Asset

## God Nodes (most connected - your core abstractions)
1. `ProgressState` - 26 edges
2. `derivedStats()` - 25 edges
3. `ProjectBundle` - 22 edges
4. `WorldScene` - 19 edges
5. `resolveRound()` - 17 edges
6. `App()` - 17 edges
7. `executeCommands()` - 16 edges
8. `InputManager` - 15 edges
9. `scripts` - 13 edges
10. `GameData` - 13 edges

## Surprising Connections (you probably didn't know these)
- `validateProgress()` --calls--> `derivedStats()`  [EXTRACTED]
  electron/progress-service.ts → src/core/battle.ts
- `loadProject()` --calls--> `validateBundle()`  [EXTRACTED]
  electron/project-service.ts → src/core/validation.ts
- `saveProject()` --calls--> `validateBundle()`  [EXTRACTED]
  electron/project-service.ts → src/core/validation.ts
- `Player HTML Host Entrypoint` --conceptually_related_to--> `TypeScript & PixiJS/WebGL Runtime Boot`  [INFERRED]
  player.html → audit/TAHAP_1.md
- `Editor HTML Host Entrypoint` --conceptually_related_to--> `RPG Maker-Style Visual Workspace UI`  [INFERRED]
  index.html → audit/TAHAP_8.md

## Import Cycles
- 2-file cycle: `src/core/battle.ts -> src/core/ctb.ts -> src/core/battle.ts`

## Hyperedges (group relationships)
- **Security & Trust Architecture** — audit_extension_security_trust_zones, audit_extension_security_declarative_content, audit_tahap_7_hardening, index_csp_meta, player_csp_meta [EXTRACTED 0.75]
- **NUSV Engine Development Evolution (Stages 0-8)** — audit_tahap_0_overview, audit_tahap_1_overview, audit_tahap_2_overview, audit_tahap_3_overview, audit_tahap_4_overview, audit_tahap_5_overview, audit_tahap_6_overview, audit_tahap_7_overview, audit_tahap_8_overview [EXTRACTED 0.75]
- **Content Workbench & Editor Subsystems** — audit_tahap_8_workspace_ui, audit_tahap_8_four_layers_editor, audit_tahap_8_visual_event_editor, audit_tahap_8_database_collections, audit_tahap_8_diagnostics_lint [EXTRACTED 0.75]
- **Combat Engine & RPG Progression** — audit_project_contract_v1_ctb_engine, audit_tahap_3_turn_simulation, audit_tahap_4_ctb_mechanics, audit_tahap_4_progression_system, audit_tahap_6_two_phase_boss [EXTRACTED 0.75]

## Communities (20 total, 2 thin omitted)

### Community 0 - "Adventure Progress Service"
Cohesion: 0.08
Nodes (38): loadProgress(), saveProgress(), validateProgress(), advanceQuest(), changeClass(), completeQuest(), defaultSettings(), reorderFormation() (+30 more)

### Community 1 - "Electron Distribution Bundles"
Cohesion: 0.07
Nodes (21): @vitejs/plugin-react, bundle, progress, rows, app, entries, {join,resolve}, packageData() (+13 more)

### Community 2 - "PixiJS Audio & Player Runtime"
Cohesion: 0.07
Nodes (13): pixi.js, RuntimeSettings, start(), AudioManager, GameLoop, gamepadButtons, InputAction, InputManager (+5 more)

### Community 3 - "MV Subset Import Service"
Cohesion: 0.10
Nodes (40): baseStats(), id(), importMvSubset(), ImportReport, mergeById(), noteStat(), number(), param() (+32 more)

### Community 4 - "IPC Preload & Package Security"
Cohesion: 0.05
Nodes (41): { contextBridge, ipcRenderer }, { contextBridge, ipcRenderer }, allowScripts, electron@45.4.1, dependencies, pixi.js@^8.16.0, react@^18.3.1, react-dom@^18.3.1 (+33 more)

### Community 5 - "Adventure Mode Controller"
Cohesion: 0.11
Nodes (9): buyItem(), restAtInn(), ProgressState, AdventureController, applyRuntimeSettings(), DebugOverlay, DialogueController, wait() (+1 more)

### Community 6 - "Turn-Based Battle System"
Cohesion: 0.15
Nodes (29): actionSpeed(), activateBossPhases(), clamp(), clone(), createBattle(), currentTarget(), damage(), definition() (+21 more)

### Community 7 - "Extension Security & Host API Docs"
Cohesion: 0.06
Nodes (35): Extension & Modding Security Policy, Security Trust Zones, Declarative Event Commands Specification, Host IPC Preload API Contract, NUSV Format & API Specification v1, NUSV Project File Structure, Player Save Architecture v2, Four Tile Layers Schema (+27 more)

### Community 8 - "Diagnostics & Bundle Analysis"
Cohesion: 0.10
Nodes (32): react, analyzeBundle(), Diagnostic, findReferences(), ReferenceHit, walkCommands(), autotileMask(), floodFillLayer() (+24 more)

### Community 9 - "Audit Risk & Stage Roadmaps"
Cohesion: 0.07
Nodes (25): Ten Identified Technical Risks (R01-R10), Initial Technical Risk Register, Native Animation & Action Studio Criteria, Legacy Database Studio Evaluation, Stage 0 Deliverables & Prototype, Stage 0 Technical Inventory & Proof of Concept, Stage 0 Safe Fixture Project, Prepared Journal Transaction Recovery (+17 more)

### Community 10 - "Smoke Testing & Child Process"
Cohesion: 0.08
Nodes (23): child, electron, env, finish(), { join, resolve }, { mkdtempSync, rmSync }, smokeRoot, { spawn, spawnSync } (+15 more)

### Community 11 - "Electron Main Process Lifecycle"
Cohesion: 0.18
Nodes (20): appRoot, createEditor(), createPlaytest(), finishSmoke(), harden(), here, page(), playtestRoots (+12 more)

### Community 12 - "Global Types & Project Bundle"
Cohesion: 0.12
Nodes (5): ProjectBundle, ImportReport, Window, ActionSequencePlayer, wait()

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

### Community 17 - "Project README Documentation"
Cohesion: 0.40
Nodes (5): CLI Build and Verification Commands, 4-Layer Tile Editor & Tools, NUSV Engine Next Architecture, README Overview, NUSV Engine Vertical Slice

## Knowledge Gaps
- **36 isolated node(s):** `NUSV Engine Vertical Slice`, `4-Layer Tile Editor & Tools`, `CLI Build and Verification Commands`, `NUSV Project File Structure`, `Four Tile Layers Schema` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectBundle` connect `Global Types & Project Bundle` to `Adventure Progress Service`, `PixiJS Audio & Player Runtime`, `MV Subset Import Service`, `Adventure Mode Controller`, `Turn-Based Battle System`, `Diagnostics & Bundle Analysis`, `Electron Main Process Lifecycle`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `NUSV Engine Vertical Slice`, `4-Layer Tile Editor & Tools`, `CLI Build and Verification Commands` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Adventure Progress Service` be split into smaller, more focused modules?**
  _Cohesion score 0.08116883116883117 - nodes in this community are weakly interconnected._
- **Why does `pixi.js` connect `PixiJS Audio & Player Runtime` to `Adventure Progress Service`, `IPC Preload & Package Security`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Electron Distribution Bundles` be split into smaller, more focused modules?**
  _Cohesion score 0.06948051948051948 - nodes in this community are weakly interconnected._
- **Why does `ProgressState` connect `Adventure Mode Controller` to `Adventure Progress Service`, `MV Subset Import Service`, `Turn-Based Battle System`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `PixiJS Audio & Player Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.06823529411764706 - nodes in this community are weakly interconnected._