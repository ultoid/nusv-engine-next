import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeBundle, findReferences } from '../core/diagnostics.js';
import {
  DEFAULT_TILESETS,
  getDefaultAutotileQuadrants,
  getPaletteTiles,
  tileDefinition,
  type LayerSelection,
  type TileDefinition
} from '../core/map-layers.js';
import type { MapEvent, ProjectBundle, TilesetData } from '../core/types.js';
import { EditorContextMenus } from './components/EditorContextMenus.js';
import { type PaletteBlockSelection } from './components/MapPaletteCanvas.js';
import { MapTreePanel } from './components/MapTreePanel.js';
import { MapViewport } from './components/MapViewport.js';
import { EditorStatusBar } from './components/EditorStatusBar.js';
import { EditorToolbar } from './components/EditorToolbar.js';
import { EditorTopBar } from './components/EditorTopBar.js';
import { InspectorPanel } from './components/InspectorPanel.js';
import { type DatabaseCollection } from './DatabaseView.js';
import { useAssetLoader } from './hooks/useAssetLoader.js';
import { useCanvasPainter, type MapTool, type PaletteGroup } from './hooks/useCanvasPainter.js';
import { useEditorShortcuts } from './hooks/useEditorShortcuts.js';
import { useEventEditor } from './hooks/useEventEditor.js';
import { useMapOperations } from './hooks/useMapOperations.js';
import { useProjectIO } from './hooks/useProjectIO.js';
import { EditorModals } from './modals/EditorModals.js';
import { playSoundEffect } from './services/soundFx.js';
import { ProjectManagerView } from './views/ProjectManagerView.js';

export function App() {
  const api = window.nusvEditor;
  const [bundle, setBundle] = useState<ProjectBundle>();
  const [past, setPast] = useState<ProjectBundle[]>([]);
  const [future, setFuture] = useState<ProjectBundle[]>([]);
  const [selectedMap, setSelectedMap] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [collection, setCollection] = useState<DatabaseCollection>('actors');
  const [mode, setMode] = useState<'map' | 'event' | 'search'>('map');
  const [mapTool, setMapTool] = useState<MapTool>('pencil');
  const [activeLayer, setActiveLayer] = useState<LayerSelection>('auto');
  const [selectedTile, setSelectedTile] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<PaletteBlockSelection>({
    minCol: 0,
    minRow: 0,
    maxCol: 0,
    maxRow: 0,
    width: 1,
    height: 1,
    tiles: [[1]]
  });
  const [hoverMapCell, setHoverMapCell] = useState<{ x: number; y: number } | null>(null);
  const [visibleLayers, setVisibleLayers] = useState([true, true, true, true]);
  const [lockedLayers, setLockedLayers] = useState([false, false, false, false]);
  const [paletteGroup, setPaletteGroup] = useState<PaletteGroup>('A');
  const [rectangleStart, setRectangleStart] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showInspector, setShowInspector] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Siap.');
  const [modal, setModal] = useState<string>('none');
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [cellContextMenu, setCellContextMenu] = useState<{
    x: number;
    y: number;
    cellX: number;
    cellY: number;
    marker?: MapEvent;
  } | null>(null);
  const [mapContextMenu, setMapContextMenu] = useState<{ x: number; y: number; mapId: string } | null>(null);
  const [query, setQuery] = useState('');
  const [soundCategory, setSoundCategory] = useState<'bgm' | 'me' | 'se'>('se');
  const [soundSelected, setSoundSelected] = useState('Attack1');
  const [placeholderTitle, setPlaceholderTitle] = useState('');
  const [placeholderDesc, setPlaceholderDesc] = useState('');

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const bundleRef = useRef<ProjectBundle | undefined>(bundle);

  const commit = (next: ProjectBundle, status = 'Perubahan diterapkan.') => {
    const current = bundleRef.current || bundle;
    if (current) {
      setPast(items => [...items.slice(-49), current]);
      setFuture([]);
    }
    bundleRef.current = next;
    setBundle(next);
    setDirty(true);
    setMessage(status);
  };

  const accept = (value: ProjectBundle, status: string) => {
    setBundle(value);
    bundleRef.current = value;
    const firstMap = value.project.maps[0] ?? '';
    setSelectedMap(firstMap);
    const firstEvent = value.maps[firstMap]?.events[0]?.id ?? '';
    setSelectedEvent(firstEvent);
    setCollection('actors');
    setPast([]);
    setFuture([]);
    setDirty(false);
    setMessage(status);
  };

  const undo = () => {
    setPast(items => {
      if (items.length === 0) return items;
      const previous = items[items.length - 1];
      const current = bundleRef.current || bundle;
      if (current) setFuture(f => [current, ...f]);
      bundleRef.current = previous;
      setBundle(previous);
      setDirty(true);
      setMessage('Undo berhasil.');
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture(items => {
      if (items.length === 0) return items;
      const next = items[0];
      const current = bundleRef.current || bundle;
      if (current) setPast(p => [...p.slice(-49), current]);
      bundleRef.current = next;
      setBundle(next);
      setDirty(true);
      setMessage('Redo berhasil.');
      return items.slice(1);
    });
  };

  // Diagnostics & References
  const diagnostics = useMemo(() => (bundle ? analyzeBundle(bundle) : []), [bundle]);
  const references = useMemo(() => (bundle ? findReferences(bundle, query) : []), [bundle, query]);
  const errorCount = diagnostics.filter(issue => issue.severity === 'error').length;
  const warningCount = diagnostics.filter(issue => issue.severity === 'warning').length;
  const canPlay = Boolean(bundle?.root && !dirty && !busy && !errorCount);

  // Tileset & Assets Resolution
  const tilesets: TilesetData[] = useMemo(() => {
    return Array.isArray(bundle?.game.tilesets) && bundle.game.tilesets.length > 0
      ? (bundle.game.tilesets as unknown as TilesetData[])
      : DEFAULT_TILESETS;
  }, [bundle?.game.tilesets]);

  const { assetUrls } = useAssetLoader({ api, bundle });

  const map = bundle?.maps[selectedMap];
  const currentTileset = useMemo<TilesetData>(() => {
    if (!map) return tilesets[0] || DEFAULT_TILESETS[0];
    const found = tilesets.find((ts: TilesetData) => ts.id === map.tilesetId || String(ts.id) === String(map.tilesetId));
    if (found) return found;
    const isWorld = map?.name?.toLowerCase().includes('world') || map?.id?.toLowerCase().includes('world');
    return (
      tilesets.find((ts: TilesetData) => (isWorld ? ts.id === 'tileset.overworld' : ts.id === 'tileset.outside')) ||
      tilesets[0] ||
      DEFAULT_TILESETS[0]
    );
  }, [map, tilesets]);

  const paletteTiles = useMemo<TileDefinition[]>(() => {
    return getPaletteTiles(paletteGroup, currentTileset);
  }, [paletteGroup, currentTileset]);

  const chooseMap = (id: string) => {
    setCellContextMenu(null);
    setMapContextMenu(null);
    setSelectedMap(id);
    setSelectedEvent('');
    eventEditor.setEventDraft('{}');
    setMode('map');
  };

  // Modular Hooks
  const projectIO = useProjectIO({
    api,
    bundle,
    setBundle,
    dirty,
    setDirty,
    busy,
    setBusy,
    setMessage,
    setModal,
    setPast,
    setFuture,
    setSelectedMap,
    setSelectedEvent,
    setEventDraft: () => {},
    accept
  });

  const eventEditor = useEventEditor({
    bundle,
    selectedMap,
    selectedEvent,
    setSelectedEvent,
    selectedCell,
    setSelectedCell,
    commit,
    setMessage,
    setModal,
    setMode
  });

  const mapOps = useMapOperations({
    bundle,
    setBundle,
    selectedMap,
    chooseMap,
    commit,
    setMessage,
    setModal,
    currentTileset,
    assetUrls,
    setCellContextMenu
  });

  const painter = useCanvasPainter({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    viewportRef: viewportRef as React.RefObject<HTMLDivElement>,
    bundle,
    setBundle,
    bundleRef,
    selectedMap,
    currentTileset,
    assetUrls,
    imageCacheRef,
    visibleLayers,
    lockedLayers,
    activeLayer,
    mapTool,
    setMapTool,
    selectedTile,
    setSelectedTile,
    selectedBlock,
    setSelectedBlock,
    paletteGroup,
    setPaletteGroup,
    rectangleStart,
    setRectangleStart,
    selectedCell,
    setSelectedCell,
    setHoverMapCell,
    setCellContextMenu,
    mode,
    commit,
    setMessage,
    setModal,
    setPast,
    setFuture,
    setDirty,
    selectEvent: eventEditor.selectEvent,
    createEventAt: eventEditor.createEventAt,
    setSelectedEvent,
    moveEvent: eventEditor.moveEvent,
    panStartRef,
    isPanningRef
  });

  useEditorShortcuts({
    api,
    bundle,
    dirty,
    busy,
    canPlay,
    mode,
    setMode,
    selectedMap,
    selectedEvent,
    selectedCell,
    rectangleStart,
    setRectangleStart,
    setActiveLayer,
    handleSaveProject: projectIO.handleSaveProject,
    guardDirty: projectIO.guardDirty,
    openNewProjectModal: projectIO.openNewProjectModal,
    handleOpenProject: projectIO.handleOpenProject,
    undo,
    redo,
    setMessage,
    setModal,
    handleOpenShiftModal: mapOps.handleOpenShiftModal,
    handleOpenGenerateDungeon: mapOps.handleOpenGenerateDungeon,
    handleFindNextEvent: mapOps.handleFindNextEvent,
    handleFindPrevEvent: mapOps.handleFindPrevEvent,
    createEventAt: eventEditor.createEventAt,
    removeEvent: eventEditor.removeEvent,
    clipboard: eventEditor.clipboard,
    setClipboard: eventEditor.setClipboard,
    commit,
    setIsShiftPressed: painter.setIsShiftPressed,
    isShiftHeldRef: painter.isShiftHeldRef,
    setSelectedCell,
    selectEvent: eventEditor.selectEvent,
    setSelectedEvent,
    nudgeEvent: eventEditor.nudgeEvent
  });

  // Auto-open last project on startup
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    hasAutoOpenedRef.current = true;
    if (!bundle && api?.getRecentProjects) {
      api
        .getRecentProjects()
        .then(items => {
          if (Array.isArray(items) && items[0]?.path) {
            projectIO.handleOpenProject(items[0].path);
          }
        })
        .catch(() => {});
    }
  }, [api, bundle, projectIO]);

  // Synchronize dirty state to electron main process
  useEffect(() => {
    api?.setDirty?.(dirty);
  }, [api, dirty]);

  // Handle request save-and-close from Electron main process
  useEffect(() => {
    if (!api?.onRequestSaveAndClose) return;
    const unsub = api.onRequestSaveAndClose(async () => {
      const ok = await projectIO.handleSaveProject();
      if (ok) {
        api.confirmClose?.();
      }
    });
    return unsub;
  }, [api, projectIO]);

  // Web browser beforeunload protection if running in browser
  useEffect(() => {
    if (api) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [api, dirty]);

  const handleExitApp = () => {
    if (api?.closeApp) {
      api.closeApp();
    } else {
      projectIO.guardDirty(() => {
        window.close();
      }, 'menutup aplikasi');
    }
  };

  if (!api) {
    return (
      <main className="editor-shell">
        <section className="error-card">NUSV Engine harus dijalankan sebagai aplikasi desktop.</section>
      </main>
    );
  }

  const openToolPlaceholder = (title: string, desc: string) => {
    setPlaceholderTitle(title);
    setPlaceholderDesc(desc);
    setModal('toolPlaceholder');
  };

  const openEvent = (id: string) => {
    eventEditor.selectEvent(id);
    setMode('event');
  };

  const currentEvent = map?.events.find(event => event.id === selectedEvent);

  const renderModals = () => (
    <EditorModals
      modal={modal}
      setModal={setModal}
      bundle={bundle}
      projectIO={projectIO}
      eventEditor={eventEditor}
      mapOps={mapOps}
      currentTileset={currentTileset}
      currentEvent={currentEvent}
      placeholderTitle={placeholderTitle}
      placeholderDesc={placeholderDesc}
      collection={collection}
      setCollection={setCollection}
      commit={commit}
      assetUrls={assetUrls}
      setMessage={setMessage}
      soundCategory={soundCategory}
      soundSelected={soundSelected}
      setSoundCategory={setSoundCategory}
      setSoundSelected={setSoundSelected}
      playSoundEffect={playSoundEffect}
    />
  );

  if (!bundle) {
    return (
      <ProjectManagerView
        recentProjects={projectIO.recentProjects}
        defaultLocation={projectIO.defaultLocation}
        onNewProject={() => projectIO.guardDirty(projectIO.openNewProjectModal, 'Buat Proyek')}
        onOpenProject={projPath =>
          projectIO.guardDirty(() => projectIO.handleOpenProject(projPath), 'Buka Proyek')
        }
        onLaunchPlaytest={projectIO.handleLaunchPlaytest}
        onRemoveRecent={projectIO.handleRemoveRecent}
        renderModals={renderModals}
      />
    );
  }

  return (
    <main className="mv-app">
      <EditorTopBar
        bundle={bundle}
        dirty={dirty}
        busy={busy}
        recentProjects={projectIO.recentProjects}
        canPlay={canPlay}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        canCopyEvent={Boolean(selectedEvent)}
        canPasteEvent={Boolean(eventEditor.clipboard)}
        mode={mode}
        activeLayer={activeLayer}
        zoom={zoom}
        showInspector={showInspector}
        onCloseProject={() => projectIO.guardDirty(projectIO.handleCloseProject, 'Project Manager')}
        onNewProject={() => projectIO.guardDirty(projectIO.openNewProjectModal, 'Buat Proyek')}
        onOpenProject={projPath =>
          projectIO.guardDirty(() => projectIO.handleOpenProject(projPath), 'Buka Proyek')
        }
        onSaveProject={projectIO.handleSaveProject}
        onOpenSettings={projectIO.openSettingsModal}
        onUndo={undo}
        onRedo={redo}
        onCopyEvent={() => void eventEditor.copyEvent()}
        onPasteEvent={eventEditor.pasteEvent}
        setMode={setMode}
        setModal={setModal}
        setMapTool={setMapTool}
        setActiveLayer={setActiveLayer}
        setZoom={setZoom}
        setShowInspector={setShowInspector}
        onImportMv={() => void projectIO.importMv()}
        onPlaytest={() => void api.playtest({ mapId: selectedMap, debug: true })}
        onExitApp={handleExitApp}
      />

      <EditorToolbar
        bundle={bundle}
        dirty={dirty}
        busy={busy}
        mode={mode}
        setMode={setMode}
        mapTool={mapTool}
        setMapTool={tool => {
          setMapTool(tool);
          setRectangleStart(null);
        }}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        zoom={zoom}
        setZoom={setZoom}
        modal={modal}
        setModal={setModal}
        canPlay={canPlay}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        canCutCopy={Boolean(bundle && (mode !== 'event' || selectedEvent))}
        canPaste={Boolean(bundle && (mode !== 'event' || eventEditor.clipboard))}
        onNewProject={() => projectIO.guardDirty(projectIO.openNewProjectModal, 'Buat Proyek')}
        onOpenProject={() => projectIO.guardDirty(() => projectIO.handleOpenProject(), 'Buka Proyek')}
        onSaveProject={projectIO.handleSaveProject}
        onCutEvent={eventEditor.handleCutEvent}
        onCopyEvent={eventEditor.copyEvent}
        onPasteEvent={eventEditor.pasteEvent}
        onDeleteEvent={eventEditor.handleDeleteEvent}
        onUndo={undo}
        onRedo={redo}
        onPlaytest={() => void api.playtest({ mapId: selectedMap, debug: true })}
        openToolPlaceholder={openToolPlaceholder}
      />

      <section className="mv-workspace mz-layout">
        <MapTreePanel
          mode={mode}
          paletteGroup={paletteGroup}
          paletteTiles={paletteTiles}
          selectedTile={selectedTile}
          selectedBlock={selectedBlock}
          currentTileset={currentTileset}
          assetUrls={assetUrls}
          bundle={bundle}
          map={map}
          selectedMap={selectedMap}
          selectedEvent={selectedEvent}
          onSelectBlock={block => {
            setSelectedBlock(block);
            const firstTile = block.tiles[0]?.[0] ?? 0;
            setSelectedTile(firstTile);
            const def = tileDefinition(firstTile, currentTileset);
            painter.shiftStampQuadsRef.current = def.autotile ? getDefaultAutotileQuadrants(def, 'isolated') : null;
            setMapTool(firstTile === 0 && block.width === 1 && block.height === 1 ? 'eraser' : 'pencil');
          }}
          setPaletteGroup={setPaletteGroup}
          setSelectedTile={setSelectedTile}
          setSelectedBlock={setSelectedBlock}
          onAddEvent={eventEditor.addEvent}
          onSelectEventCell={(id, x, y) => {
            openEvent(id);
            setSelectedCell({ x, y });
          }}
          onDoubleClickEvent={(id, x, y) => {
            openEvent(id);
            setSelectedCell({ x, y });
            setModal('eventEditor');
          }}
          onChooseMap={chooseMap}
          onOpenMapProperties={mapOps.handleOpenMapProperties}
          onOpenMapContextMenu={(e, id) => {
            e.preventDefault();
            e.stopPropagation();
            if (bundle && bundle.project.maps.length > 0) {
              setMapContextMenu({ x: e.clientX, y: e.clientY, mapId: id });
            }
          }}
        />

        <MapViewport
          bundle={bundle}
          map={map}
          mode={mode}
          dirty={dirty}
          currentEvent={currentEvent}
          zoom={zoom}
          setZoom={setZoom}
          canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
          viewportRef={viewportRef as React.RefObject<HTMLDivElement>}
          isPanningRef={isPanningRef}
          panStartRef={panStartRef}
          activeLayer={activeLayer}
          mapTool={mapTool}
          selectedBlock={selectedBlock}
          hoverMapCell={hoverMapCell}
          setHoverMapCell={setHoverMapCell}
          selectedCell={selectedCell}
          selectedEvent={selectedEvent}
          rectangleStart={rectangleStart}
          draggedEvent={painter.draggedEvent}
          assetUrls={assetUrls}
          onMouseDownCell={painter.onMouseDownCell}
          onMouseEnterCell={painter.onMouseEnterCell}
          onClickCell={painter.onClickCell}
          onDoubleClickCell={painter.handleCellDoubleClick}
          onContextMenuCell={painter.onContextMenuCell}
          query={query}
          setQuery={setQuery}
          references={references}
        />

        {showInspector && (
          <InspectorPanel
            bundle={bundle}
            map={map}
            currentEvent={currentEvent}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            visibleLayers={visibleLayers}
            setVisibleLayers={setVisibleLayers}
            lockedLayers={lockedLayers}
            setLockedLayers={setLockedLayers}
            clearLayer={painter.clearLayer}
            errorCount={errorCount}
            warningCount={warningCount}
            diagnostics={diagnostics}
            setMode={setMode}
          />
        )}
      </section>

      <EditorStatusBar
        bundle={bundle}
        map={map}
        zoom={zoom}
        activeLayer={activeLayer}
        isShiftPressed={painter.isShiftPressed}
        selectedBlock={selectedBlock}
        errorCount={errorCount}
        dirty={dirty}
        message={message}
      />

      <EditorContextMenus
        bundle={bundle}
        map={map}
        mapOps={mapOps}
        eventEditor={eventEditor}
        mapContextMenu={mapContextMenu}
        cellContextMenu={cellContextMenu}
        setMapContextMenu={setMapContextMenu}
        setCellContextMenu={setCellContextMenu}
        setMode={setMode}
        setModal={setModal}
        commit={commit}
        setMessage={setMessage}
      />

      {renderModals()}
    </main>
  );
}
