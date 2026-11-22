# Graph Report - NUSV Engine Next  (2026-11-22)

## Corpus Check
- 91 files · ~22,506 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .csv 2, .mdc 1, (none) 1)

## Summary
- 590 nodes · 1212 edges · 26 communities (23 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c7029b21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PartyController.ts
- stage4-advanced.test.js
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
- ref_node_fs
- Safe Project Assets Manifest
- MV Sample Marker Asset
- smoke.cjs
- ref_node_path
- stage5-tools.test.js
- Karpathy Guidelines
- Karpathy Guidelines
- CLAUDE.md

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
- `README Overview` --references--> `Engine Upgrade & Migration Guide`  [EXTRACTED]
  README.md → audit/UPGRADE_GUIDE.md
- `Editor HTML Host Entrypoint` --conceptually_related_to--> `RPG Maker-Style Visual Workspace UI`  [INFERRED]
  index.html → audit/TAHAP_8.md

## Import Cycles
- 2-file cycle: `src/core/battle.ts -> src/core/ctb.ts -> src/core/battle.ts`

## Hyperedges (group relationships)
- **Combat Engine & RPG Progression** — audit_project_contract_v1_ctb_engine, audit_tahap_3_turn_simulation, audit_tahap_4_ctb_mechanics, audit_tahap_4_progression_system, audit_tahap_6_two_phase_boss [EXTRACTED 0.75]
- **Content Workbench & Editor Subsystems** — audit_tahap_8_workspace_ui, audit_tahap_8_four_layers_editor, audit_tahap_8_visual_event_editor, audit_tahap_8_database_collections, audit_tahap_8_diagnostics_lint [EXTRACTED 0.75]
- **Security & Trust Architecture** — audit_extension_security_trust_zones, audit_extension_security_declarative_content, audit_tahap_7_hardening, index_csp_meta, player_csp_meta [EXTRACTED 0.75]
- **NUSV Engine Development Evolution (Stages 0-8)** — audit_tahap_0_overview, audit_tahap_1_overview, audit_tahap_2_overview, audit_tahap_3_overview, audit_tahap_4_overview, audit_tahap_5_overview, audit_tahap_6_overview, audit_tahap_7_overview, audit_tahap_8_overview [EXTRACTED 0.75]

## Communities (26 total, 3 thin omitted)

### Community 0 - "PartyController.ts"
Cohesion: 0.24
Nodes (14): changeClass(), reorderFormation(), allocateStat(), baseExpForLevel(), classExpForLevel(), classLevelCap(), emptyStats(), equip() (+6 more)

### Community 1 - "stage4-advanced.test.js"
Cohesion: 0.16
Nodes (5): template, fixture, fixture, fixture, fixture

### Community 2 - "PixiJS Audio & Player Runtime"
Cohesion: 0.07
Nodes (12): RuntimeSettings, start(), AudioManager, GameLoop, gamepadButtons, InputAction, InputManager, keys (+4 more)

### Community 3 - "MV Subset Import Service"
Cohesion: 0.09
Nodes (41): baseStats(), id(), importMvSubset(), ImportReport, mergeById(), noteStat(), number(), param() (+33 more)

### Community 4 - "IPC Preload & Package Security"
Cohesion: 0.05
Nodes (43): { contextBridge, ipcRenderer }, { contextBridge, ipcRenderer }, allowScripts, electron@45.4.1, dependencies, pixi.js@^8.16.0, react@^18.3.1, react-dom@^18.3.1 (+35 more)

### Community 5 - "Adventure Mode Controller"
Cohesion: 0.07
Nodes (27): advanceQuest(), buyItem(), completeQuest(), defaultSettings(), restAtInn(), startQuest(), EventPage, MapEvent (+19 more)

### Community 6 - "Turn-Based Battle System"
Cohesion: 0.14
Nodes (29): actionSpeed(), activateBossPhases(), clamp(), clone(), createBattle(), currentTarget(), damage(), definition() (+21 more)

### Community 7 - "Extension Security & Host API Docs"
Cohesion: 0.06
Nodes (40): Extension & Modding Security Policy, Security Trust Zones, Declarative Event Commands Specification, Host IPC Preload API Contract, NUSV Format & API Specification v1, NUSV Project File Structure, Player Save Architecture v2, Four Tile Layers Schema (+32 more)

### Community 8 - "Diagnostics & Bundle Analysis"
Cohesion: 0.09
Nodes (33): react, analyzeBundle(), Diagnostic, findReferences(), ReferenceHit, walkCommands(), autotileMask(), floodFillLayer() (+25 more)

### Community 9 - "Audit Risk & Stage Roadmaps"
Cohesion: 0.07
Nodes (25): Ten Identified Technical Risks (R01-R10), Initial Technical Risk Register, Native Animation & Action Studio Criteria, Legacy Database Studio Evaluation, Stage 0 Deliverables & Prototype, Stage 0 Technical Inventory & Proof of Concept, Stage 0 Safe Fixture Project, Prepared Journal Transaction Recovery (+17 more)

### Community 10 - "Smoke Testing & Child Process"
Cohesion: 0.13
Nodes (13): child, cleanRoot, {cpSync,existsSync,mkdtempSync,readFileSync,rmSync}, data, environment, exe, {join,resolve}, smokeRoot (+5 more)

### Community 11 - "Electron Main Process Lifecycle"
Cohesion: 0.15
Nodes (25): appRoot, createEditor(), createPlaytest(), finishSmoke(), harden(), here, page(), playtestRoots (+17 more)

### Community 12 - "Global Types & Project Bundle"
Cohesion: 0.15
Nodes (4): ProjectBundle, ImportReport, Window, ActionSequencePlayer

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

### Community 17 - "ref_node_fs"
Cohesion: 0.17
Nodes (6): bundle, progress, rows, fixture, bundle, bundle

### Community 20 - "smoke.cjs"
Cohesion: 0.18
Nodes (10): child, electron, env, finish(), { join, resolve }, { mkdtempSync, rmSync }, smokeRoot, { spawn, spawnSync } (+2 more)

### Community 21 - "ref_node_path"
Cohesion: 0.25
Nodes (7): app, entries, {join,resolve}, packageData(), packages, {readFileSync,writeFileSync}, root

### Community 23 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 24 - "Karpathy Guidelines"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Karpathy Guidelines

### Community 25 - "CLAUDE.md"
Cohesion: 0.33
Nodes (4): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution

## Knowledge Gaps
- **35 isolated node(s):** `CLI Build and Verification Commands`, `4-Layer Tile Editor & Tools`, `NUSV Engine Vertical Slice`, `Sample Marker Asset`, `Host IPC Preload API Contract` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 220 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectBundle` connect `Global Types & Project Bundle` to `PartyController.ts`, `PixiJS Audio & Player Runtime`, `MV Subset Import Service`, `Adventure Mode Controller`, `Turn-Based Battle System`, `Diagnostics & Bundle Analysis`, `Electron Main Process Lifecycle`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `CLI Build and Verification Commands`, `4-Layer Tile Editor & Tools`, `NUSV Engine Vertical Slice` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PixiJS Audio & Player Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.06745098039215686 - nodes in this community are weakly interconnected._
- **Why does `pixi.js` connect `IPC Preload & Package Security` to `PixiJS Audio & Player Runtime`, `Adventure Mode Controller`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `MV Subset Import Service` be split into smaller, more focused modules?**
  _Cohesion score 0.09158186864014801 - nodes in this community are weakly interconnected._
- **Why does `ProgressState` connect `Adventure Mode Controller` to `MV Subset Import Service`, `PartyController.ts`, `Electron Main Process Lifecycle`, `Turn-Based Battle System`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `IPC Preload & Package Security` be split into smaller, more focused modules?**
  _Cohesion score 0.05180388529139685 - nodes in this community are weakly interconnected._