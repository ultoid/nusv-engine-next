import React from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { ProjectBundle } from '../../core/types.js';
import { MZIcons } from '../MZIcons.js';
import { ToolButton } from './ToolButton.js';

export interface EditorToolbarProps {
  bundle?: ProjectBundle;
  dirty: boolean;
  busy: boolean;
  mode: 'map' | 'event' | 'search';
  setMode: (m: 'map' | 'event' | 'search') => void;
  mapTool: string;
  setMapTool: (tool: any) => void;
  activeLayer: LayerSelection;
  setActiveLayer: (layer: LayerSelection) => void;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  modal: string;
  setModal: (modal: any) => void;
  canPlay: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canCutCopy: boolean;
  canPaste: boolean;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onCutEvent: () => void;
  onCopyEvent: () => void;
  onPasteEvent: () => void;
  onDeleteEvent: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPlaytest: () => void;
  openToolPlaceholder: (title: string, desc: string) => void;
}

export function EditorToolbar({
  bundle,
  dirty,
  busy,
  mode,
  setMode,
  mapTool,
  setMapTool,
  activeLayer,
  setActiveLayer,
  zoom,
  setZoom,
  modal,
  setModal,
  canPlay,
  canUndo,
  canRedo,
  canCutCopy,
  canPaste,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onCutEvent,
  onCopyEvent,
  onPasteEvent,
  onDeleteEvent,
  onUndo,
  onRedo,
  onPlaytest,
  openToolPlaceholder
}: EditorToolbarProps) {
  return (
    <section className="mv-toolbar" aria-label="Toolbar editor">
      {/* 1. File Group */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.New />} label="New Project (Ctrl+N)" disabled={busy} onClick={onNewProject} />
        <ToolButton icon={<MZIcons.Open />} label="Open Project (Ctrl+O)" disabled={busy} onClick={onOpenProject} />
        <ToolButton icon={<MZIcons.Save />} label="Save Project (Ctrl+S)" active={dirty} disabled={!bundle || !dirty || busy} onClick={onSaveProject} />
      </div>

      <span className="mz-tool-divider" />

      {/* 2. Clipboard Group */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.Cut />} label="Cut (Ctrl+X)" disabled={!canCutCopy} onClick={onCutEvent} />
        <ToolButton icon={<MZIcons.Copy />} label="Copy (Ctrl+C)" disabled={!canCutCopy} onClick={onCopyEvent} />
        <ToolButton icon={<MZIcons.Paste />} label="Paste (Ctrl+V)" disabled={!canPaste} onClick={onPasteEvent} />
        <ToolButton icon={<MZIcons.Delete />} label="Delete (Del)" disabled={!canCutCopy} onClick={onDeleteEvent} />
        <ToolButton icon={<MZIcons.Undo />} label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
        <ToolButton icon={<MZIcons.Redo />} label="Redo (Ctrl+Y / Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} />
      </div>

      <span className="mz-tool-divider" />

      {/* 3. Mode Switcher Group */}
      <div className="mv-tool-group mode-tools">
        <ToolButton icon={<MZIcons.MapMode />} label="Map Mode (F5)" active={mode === 'map'} disabled={!bundle} onClick={() => setMode('map')} />
        <ToolButton icon={<MZIcons.EventMode />} label="Event Mode (F6)" active={mode === 'event'} disabled={!bundle} onClick={() => setMode('event')} />
      </div>

      {/* 4. Drawing Tools (Hanya tampil saat Map Mode) */}
      {mode === 'map' && (
        <>
          <span className="mz-tool-divider" />
          <div className="mv-tool-group draw-tools">
            <ToolButton icon={<MZIcons.Pencil />} label="Pencil" active={mapTool === 'pencil'} onClick={() => setMapTool('pencil')} />
            <ToolButton icon={<MZIcons.Rectangle />} label="Rectangle" active={mapTool === 'rectangle'} onClick={() => setMapTool('rectangle')} />
            <ToolButton icon={<MZIcons.Circle />} label="Circle" active={mapTool === 'circle'} onClick={() => setMapTool('circle')} />
            <ToolButton icon={<MZIcons.Fill />} label="Flood Fill" active={mapTool === 'fill'} onClick={() => setMapTool('fill')} />
            <ToolButton icon={<MZIcons.Shadow />} label="Shadow Pen" active={mapTool === 'shadow'} onClick={() => setMapTool('shadow')} />
          </div>

          <span className="mz-tool-divider" />

          {/* Layer Controls */}
          <div className="mv-tool-group">
            <div className="mv-layer-switcher" aria-label="Map layer selection">
              {(['auto', 0, 1, 2, 3] as LayerSelection[]).map(layer => (
                <button
                  className={activeLayer === layer ? 'active' : ''}
                  key={String(layer)}
                  onClick={() => setActiveLayer(layer)}
                  title={layer === 'auto' ? 'Automatic Layer (Auto)' : `Layer ${layer + 1} (L${layer + 1})`}
                >
                  {layer === 'auto' ? 'Auto' : `L${layer + 1}`}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <span className="mz-tool-divider" />

      {/* 5. Scale / Zoom Controls */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.ZoomIn />} label="Zoom In" disabled={!bundle || zoom >= 200} onClick={() => setZoom(z => Math.min(200, z + 25))} />
        <ToolButton icon={<MZIcons.ZoomOut />} label="Zoom Out" disabled={!bundle || zoom <= 50} onClick={() => setZoom(z => Math.max(50, z - 25))} />
        <ToolButton icon={<MZIcons.ActualSize />} label="Actual Size 1:1" active={zoom === 100} disabled={!bundle} onClick={() => setZoom(100)} />
      </div>

      <span className="mz-tool-divider" />

      {/* 6. Tools & Managers Group */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.Database />} label="Database (F9)" active={modal === 'database'} disabled={!bundle} onClick={() => setModal('database')} />
        <ToolButton icon={<MZIcons.Search />} label="Event Searcher / Reference Search" active={mode === 'search'} disabled={!bundle} onClick={() => setMode('search')} />
        <ToolButton icon={<MZIcons.Sound />} label="Sound Test" disabled={!bundle} onClick={() => setModal('soundTest')} />
        <ToolButton icon={<MZIcons.Chara />} label="Character Generator" disabled={!bundle} onClick={() => openToolPlaceholder('Character Generator', 'Pembuat sprite karakter kustom, face grafis, dan animasi gerak.')} />
        <ToolButton icon={<MZIcons.Resource />} label="Resource Manager (F10)" active={modal === 'resourceManager'} disabled={!bundle} onClick={() => setModal('resourceManager')} />
        <ToolButton icon={<MZIcons.Plugin />} label="Plugin Manager" disabled={!bundle} onClick={() => openToolPlaceholder('Plugin Manager', 'Pengelola modul ekstensi gameplay dan skrip.')} />
      </div>

      <span className="mz-tool-divider" />

      {/* 7. Playtest */}
      <div className="mv-tool-group mv-play-group">
        <ToolButton icon={<MZIcons.Playtest />} label="Playtest (F6)" primary disabled={!canPlay} onClick={onPlaytest} />
      </div>
    </section>
  );
}
