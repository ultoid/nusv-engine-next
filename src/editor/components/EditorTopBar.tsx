import React from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { ProjectBundle } from '../../core/types.js';
import type { RecentProject } from '../../global.js';

export interface EditorTopBarProps {
  bundle: ProjectBundle;
  dirty: boolean;
  busy: boolean;
  recentProjects: RecentProject[];
  canPlay: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canCopyEvent: boolean;
  canPasteEvent: boolean;
  mode: 'map' | 'event' | 'search';
  activeLayer: LayerSelection;
  zoom: number;
  showInspector: boolean;
  onCloseProject: () => void;
  onNewProject: () => void;
  onOpenProject: (path?: string) => void;
  onSaveProject: () => void;
  onOpenSettings: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopyEvent: () => void;
  onPasteEvent: () => void;
  setMode: (m: 'map' | 'event' | 'search') => void;
  setModal: (m: any) => void;
  setMapTool: (t: any) => void;
  setActiveLayer: (l: LayerSelection) => void;
  setZoom: (z: number) => void;
  setShowInspector: (fn: (v: boolean) => boolean) => void;
  onImportMv: () => void;
  onPlaytest: () => void;
  onExitApp: () => void;
}

export function EditorTopBar({
  bundle,
  dirty,
  busy,
  recentProjects,
  canPlay,
  canUndo,
  canRedo,
  canCopyEvent,
  canPasteEvent,
  mode,
  activeLayer,
  zoom,
  showInspector,
  onCloseProject,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onOpenSettings,
  onUndo,
  onRedo,
  onCopyEvent,
  onPasteEvent,
  setMode,
  setModal,
  setMapTool,
  setActiveLayer,
  setZoom,
  setShowInspector,
  onImportMv,
  onPlaytest,
  onExitApp
}: EditorTopBarProps) {
  return (
    <>
      <div className="mv-titlebar">
        <div className="mv-brand">
          <button
            className="mv-pm-switch-btn"
            title="Kembali ke Project Manager"
            onClick={onCloseProject}
          >
            ◂ Project Manager
          </button>
          <span className="mv-brand-mark">N</span>
          <strong>NUSV Engine</strong>
          <span>— {bundle.project.title}</span>
          {dirty && <i>*</i>}
        </div>
        <div className="mv-window-caption">Nusvanir JRPG Development Environment</div>
      </div>

      <nav className="mv-menubar" aria-label="Menu utama">
        <details className="mv-menu"><summary>File</summary><div>
          <button onClick={onNewProject}>New Project… <kbd>Ctrl+N</kbd></button>
          <button onClick={() => onOpenProject()}>Open Project… <kbd>Ctrl+O</kbd></button>
          <button onClick={onCloseProject}>Project Manager… <kbd>Esc</kbd></button>
          {recentProjects.length > 0 && <>
            <hr />
            <div className="mv-menu-section-title">Recent Projects</div>
            {recentProjects.slice(0, 5).map(proj => (
              <button
                key={proj.path}
                className="mv-recent-menu-item"
                onClick={() => onOpenProject(proj.path)}
              >
                <span>{proj.title}</span>
                <small>{proj.path}</small>
              </button>
            ))}
          </>}
          <button disabled={!bundle} onClick={onCloseProject}>Close Project</button>
          <hr />
          <button disabled={!bundle || !dirty || busy} onClick={onSaveProject}>Save Project <kbd>Ctrl+S</kbd></button>
          <hr />
          <button disabled={!bundle} onClick={onOpenSettings}>Project Settings…</button>
          <hr />
          <button onClick={onExitApp}>Exit <kbd>Alt+F4</kbd></button>
        </div></details>
        <details className="mv-menu"><summary>Edit</summary><div>
          <button disabled={!canUndo} onClick={onUndo}>Undo <kbd>Ctrl+Z</kbd></button>
          <button disabled={!canRedo} onClick={onRedo}>Redo <kbd>Ctrl+Y</kbd></button>
          <button disabled={!canCopyEvent} onClick={onCopyEvent}>Copy Event <kbd>Ctrl+C</kbd></button>
          <button disabled={!canPasteEvent} onClick={onPasteEvent}>Paste Event <kbd>Ctrl+V</kbd></button>
        </div></details>
        <details className="mv-menu"><summary>Mode</summary><div>
          <button onClick={() => setMode('map')}>Map <kbd>F5</kbd></button>
          <button onClick={() => setMode('event')}>Events <kbd>F6</kbd></button>
          <button onClick={() => setModal('database')}>Database <kbd>F9</kbd></button>
          <button onClick={() => setMode('search')}>Search</button>
        </div></details>
        <details className="mv-menu"><summary>Draw</summary><div>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('pencil')}>✎ Pencil</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('rectangle')}>□ Rectangle</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('circle')}>○ Circle</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('shadow')}>◐ Shadow Pen</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('fill')}>▣ Flood Fill</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('eraser')}>◇ Eraser</button>
          <button disabled={mode !== 'map'} onClick={() => setMapTool('collision')}>▨ Collision Mark</button>
        </div></details>
        <details className="mv-menu"><summary>Layer</summary><div>
          {(['auto', 0, 1, 2, 3] as LayerSelection[]).map(layer => (
            <button key={String(layer)} onClick={() => setActiveLayer(layer)}>
              {layer === 'auto' ? 'Automatic Layer' : `Layer ${layer + 1}`} {activeLayer === layer ? '✓' : ''}
            </button>
          ))}
        </div></details>
        <details className="mv-menu"><summary>Scale</summary><div>
          {[75, 100, 125, 150].map(val => (
            <button key={val} onClick={() => setZoom(val)}>
              {val}% {zoom === val ? '✓' : ''}
            </button>
          ))}
        </div></details>
        <details className="mv-menu"><summary>Tools</summary><div>
          <button onClick={() => setModal('database')}>Database… <kbd>F9</kbd></button>
          <button disabled={!bundle} onClick={() => setModal('resourceManager')}>Resource Manager… <kbd>F10</kbd></button>
          <button disabled={!bundle} onClick={() => setModal('soundTest')}>Sound Test…</button>
          <button onClick={() => setMode('search')}>Reference Search…</button>
          <button onClick={() => setShowInspector(v => !v)}>{showInspector ? '✓ ' : ''}Inspector Panel…</button>
          <button disabled={!bundle || busy} onClick={onImportMv}>Import RPG Maker MV Subset…</button>
        </div></details>
        <details className="mv-menu"><summary>Game</summary><div>
          <button disabled={!canPlay} onClick={onPlaytest}>
            Playtest <kbd>Ctrl+R</kbd>
          </button>
        </div></details>
        <details className="mv-menu"><summary>Help</summary><div>
          <button onClick={() => alert('NUSV Engine Next - RPG Maker MZ Compatible Environment')}>About…</button>
        </div></details>
        <span className="mv-menu-spacer" />
        <span className={`mv-save-state ${dirty ? 'dirty' : ''}`}>{busy ? 'Working…' : dirty ? 'Modified' : bundle ? 'Saved' : 'No project'}</span>
      </nav>
    </>
  );
}
