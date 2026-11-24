import { useEffect, useRef, useState } from 'react';
import {
  floodFillLayer,
  floodFillRegion,
  getAutotileQuadrants,
  getDefaultAutotileQuadrants,
  getRegionColor,
  layerForTile,
  paintLayerBlock,
  paintLayerBlockRectangle,
  paintLayerCell,
  paintLayerCircle,
  paintLayerRectangle,
  paintRegionCell,
  paintRegionCircle,
  paintRegionRectangle,
  tileDefinition,
  type LayerSelection,
  type TileQuadrant
} from '../../core/map-layers.js';
import type { MapEvent, ProjectBundle, TilesetData } from '../../core/types.js';
import type { PaletteBlockSelection } from '../components/MapPaletteCanvas.js';

export type MapTool = 'pencil' | 'rectangle' | 'circle' | 'eraser' | 'fill' | 'collision' | 'shadow' | 'event';
export type PaletteGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'R';

export interface UseCanvasPainterParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewportRef: React.RefObject<HTMLDivElement>;
  bundle?: ProjectBundle;
  setBundle: (b: ProjectBundle) => void;
  bundleRef: React.MutableRefObject<ProjectBundle | undefined>;
  selectedMap: string;
  currentTileset: TilesetData;
  assetUrls: Record<string, string>;
  imageCacheRef: React.MutableRefObject<Record<string, HTMLImageElement>>;
  visibleLayers: boolean[];
  lockedLayers: boolean[];
  activeLayer: LayerSelection;
  mapTool: MapTool;
  setMapTool: (t: MapTool) => void;
  selectedTile: number;
  setSelectedTile: (t: number) => void;
  selectedBlock: PaletteBlockSelection;
  setSelectedBlock: (b: PaletteBlockSelection) => void;
  paletteGroup: PaletteGroup;
  setPaletteGroup: (g: PaletteGroup) => void;
  rectangleStart: { x: number; y: number } | null;
  setRectangleStart: (pt: { x: number; y: number } | null) => void;
  selectedCell: { x: number; y: number } | null;
  setSelectedCell: (pt: { x: number; y: number } | null) => void;
  setHoverMapCell: (pt: { x: number; y: number } | null) => void;
  setCellContextMenu: (c: { x: number; y: number; cellX: number; cellY: number; marker?: MapEvent } | null) => void;
  mode: 'map' | 'event' | 'search';
  commit: (next: ProjectBundle, status?: string) => void;
  setMessage: (msg: string) => void;
  setModal: (m: any) => void;
  setPast: React.Dispatch<React.SetStateAction<ProjectBundle[]>>;
  setFuture: React.Dispatch<React.SetStateAction<ProjectBundle[]>>;
  setDirty: (d: boolean) => void;
  selectEvent: (id: string) => void;
  createEventAt: (x: number, y: number) => void;
  setSelectedEvent: (id: string) => void;
  moveEvent?: (id: string, x: number, y: number) => void;
  panStartRef: React.MutableRefObject<{ x: number; y: number; scrollLeft: number; scrollTop: number }>;
  isPanningRef: React.MutableRefObject<boolean>;
}

export function useCanvasPainter({
  canvasRef,
  viewportRef,
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
  selectEvent,
  createEventAt,
  setSelectedEvent,
  moveEvent,
  panStartRef,
  isPanningRef
}: UseCanvasPainterParams) {
  const [canvasTick, setCanvasTick] = useState(0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const isShiftHeldRef = useRef(false);
  const shiftStampQuadsRef = useRef<TileQuadrant[] | null>(null);

  const [draggedEvent, setDraggedEvent] = useState<{
    eventId: string;
    originX: number;
    originY: number;
    targetX: number;
    targetY: number;
  } | null>(null);
  const eventDragStartRef = useRef<{ eventId: string; originX: number; originY: number; hasMoved: boolean } | null>(null);
  const eventDragTargetRef = useRef<{ x: number; y: number } | null>(null);

  const isMouseDownRef = useRef(false);
  const strokeInitialBundleRef = useRef<ProjectBundle | null>(null);
  const activeStrokeBundleRef = useRef<ProjectBundle | null>(null);
  const strokeModifiedRef = useRef(false);

  const map = bundle?.maps[selectedMap];

  // Mouse pan and stroke listener
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current && viewportRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        viewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
        viewportRef.current.scrollTop = panStartRef.current.scrollTop - dy;
      }
    };

    const handleGlobalMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
      }
      if (eventDragStartRef.current) {
        const drag = eventDragStartRef.current;
        const target = eventDragTargetRef.current;
        if (drag.hasMoved && target && moveEvent && (drag.originX !== target.x || drag.originY !== target.y)) {
          moveEvent(drag.eventId, target.x, target.y);
        }
        eventDragStartRef.current = null;
        eventDragTargetRef.current = null;
        setDraggedEvent(null);
      }
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (strokeModifiedRef.current && strokeInitialBundleRef.current) {
          const initial = strokeInitialBundleRef.current;
          setPast(items => [...items.slice(-49), initial]);
          setFuture([]);
          setDirty(true);
          setMessage('Tile berhasil dipasang.');
        }
        strokeInitialBundleRef.current = null;
        activeStrokeBundleRef.current = null;
        strokeModifiedRef.current = false;
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanningRef, moveEvent, panStartRef, setDirty, setFuture, setMessage, setPast, viewportRef]);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [, url] of Object.entries(assetUrls)) {
      if (!imageCacheRef.current[url]) {
        const img = new Image();
        img.src = url;
        img.onload = () => setCanvasTick(t => t + 1);
        imageCacheRef.current[url] = img;
      }
    }

    map.layers.forEach((layer, layerIndex) => {
      if (!visibleLayers[layerIndex]) return;
      const isDimmed = activeLayer !== 'auto' && activeLayer !== layerIndex;
      ctx.globalAlpha = isDimmed ? 0.25 : 1.0;

      for (let index = 0; index < layer.data.length; index++) {
        const tileId = layer.data[index];
        if (tileId === 0) continue;
        const tile = tileDefinition(tileId, currentTileset);
        if (!tile || tile.id === 0) continue;

        const x = (index % map.width) * 48;
        const y = Math.floor(index / map.width) * 48;
        const imgUrl = tile.tileset ? assetUrls[tile.tileset] : null;
        if (imgUrl && !imageCacheRef.current[imgUrl]) {
          const newImg = new Image();
          newImg.src = imgUrl;
          newImg.onload = () => setCanvasTick(t => t + 1);
          imageCacheRef.current[imgUrl] = newImg;
        }
        const img = imgUrl ? imageCacheRef.current[imgUrl] : null;

        if (layerIndex === 0 && tile.defaultLayer === 1) {
          ctx.fillStyle = '#558844';
          ctx.fillRect(x, y, 48, 48);
        }

        if (img && img.complete && img.naturalWidth > 0) {
          if (tile.autotile && tile.autotileBaseX !== undefined && tile.autotileBaseY !== undefined) {
            const quads = getAutotileQuadrants(tile, layer.data, index, map.width, map.height, layer.autotileShapes?.[index]);
            for (let q = 0; q < 4; q++) {
              const quad = quads[q];
              ctx.drawImage(img, quad.srcX, quad.srcY, 24, 24, x + quad.left, y + quad.top, 24, 24);
            }
          } else if (tile.srcX !== undefined && tile.srcY !== undefined) {
            ctx.drawImage(img, tile.srcX, tile.srcY, 48, 48, x, y, 48, 48);
          }
        } else {
          ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(x, y, 48, 48);
          if (tile.glyph) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.glyph, x + 24, y + 24);
          }
        }
      }
    });

    if (map.regions && paletteGroup === 'R') {
      const regLen = map.regions.length;
      for (let index = 0; index < regLen; index++) {
        const regId = map.regions[index];
        if (regId <= 0) continue;
        const x = (index % map.width) * 48;
        const y = Math.floor(index / map.width) * 48;
        const color = getRegionColor(regId);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x, y, 48, 48);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(regId), x + 24, y + 24);
      }
    }
    ctx.globalAlpha = 1.0;
  }, [map?.layers, map?.regions, visibleLayers, activeLayer, canvasTick, assetUrls, map?.width, map?.height, paletteGroup, canvasRef, currentTileset, imageCacheRef]);

  const toggleTile = (x: number, y: number) => {
    const targetBundle = bundleRef.current || bundle;
    if (!targetBundle) return;
    const currentMap = targetBundle.maps[selectedMap];
    if (!currentMap) return;
    const collision = [...currentMap.collision];
    collision[y * currentMap.width + x] = collision[y * currentMap.width + x] === 1 ? 0 : 1;
    commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, collision } } }, `Collision (${x}, ${y}) diubah.`);
  };

  const applyPaint = (x: number, y: number, isBatch = false, isShift = false) => {
    const targetBundle = isBatch ? activeStrokeBundleRef.current ?? bundleRef.current ?? bundle : bundleRef.current ?? bundle;
    if (!targetBundle) return;
    const currentMap = targetBundle.maps[selectedMap];
    if (!currentMap) return;

    const cellIndex = y * currentMap.width + x;
    const isEraser = mapTool === 'eraser';
    const tileId = isEraser ? 0 : selectedTile;

    if (paletteGroup === 'R') {
      const regId = isEraser ? 0 : Math.max(0, Math.min(255, selectedTile));
      const curRegions =
        currentMap.regions && currentMap.regions.length === currentMap.width * currentMap.height
          ? currentMap.regions
          : Array(currentMap.width * currentMap.height).fill(0);

      if (mapTool === 'fill') {
        const nextRegions = floodFillRegion(curRegions, cellIndex, regId, currentMap.width, currentMap.height);
        commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, regions: nextRegions } } }, `Fill Region ${regId} diterapkan.`);
        return;
      }

      if (mapTool === 'rectangle') {
        if (!rectangleStart) {
          setRectangleStart({ x, y });
          setMessage(`Awal rectangle: (${x}, ${y}). Pilih sudut akhir.`);
          return;
        }
        const nextRegions = paintRegionRectangle(curRegions, rectangleStart.x, rectangleStart.y, x, y, regId, currentMap.width);
        setRectangleStart(null);
        commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, regions: nextRegions } } }, `Rectangle Region ${regId} diterapkan.`);
        return;
      }

      if (mapTool === 'circle') {
        if (!rectangleStart) {
          setRectangleStart({ x, y });
          setMessage(`Awal circle: (${x}, ${y}). Pilih sudut akhir.`);
          return;
        }
        const nextRegions = paintRegionCircle(curRegions, rectangleStart.x, rectangleStart.y, x, y, regId, currentMap.width);
        setRectangleStart(null);
        commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, regions: nextRegions } } }, `Circle Region ${regId} diterapkan.`);
        return;
      }

      const nextRegions = paintRegionCell(curRegions, cellIndex, regId);
      const next = { ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, regions: nextRegions } } };
      if (isBatch) {
        activeStrokeBundleRef.current = next;
        bundleRef.current = next;
        strokeModifiedRef.current = true;
        setBundle(next);
      } else {
        commit(next, `Region ${regId} diterapkan pada (${x}, ${y}).`);
      }
      return;
    }

    const currentTileDef = tileDefinition(tileId, currentTileset);

    let layerIndex: number;
    if (isEraser && activeLayer === 'auto') {
      layerIndex = [3, 2, 1, 0].find(l => visibleLayers[l] && currentMap.layers[l].data[cellIndex] !== 0) ?? 0;
    } else {
      layerIndex = layerForTile(tileId, activeLayer, currentTileset);
    }

    if (lockedLayers[layerIndex]) {
      if (!isBatch) setMessage(`Layer ${layerIndex + 1} terkunci.`);
      return;
    }

    let overrideShape: TileQuadrant[] | undefined;
    if (isShift && !isEraser && currentTileDef.autotile) {
      overrideShape = shiftStampQuadsRef.current ?? getDefaultAutotileQuadrants(currentTileDef, 'isolated');
    }

    if (!isEraser && mapTool === 'pencil' && (selectedBlock.width > 1 || selectedBlock.height > 1)) {
      const layers = paintLayerBlock(
        currentMap.layers,
        activeLayer,
        x,
        y,
        selectedBlock,
        currentMap.width,
        currentMap.height,
        currentTileset,
        lockedLayers
      );
      const next = { ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } };
      if (isBatch) {
        activeStrokeBundleRef.current = next;
        bundleRef.current = next;
        strokeModifiedRef.current = true;
        setBundle(next);
      } else {
        commit(next, `Blok ${selectedBlock.width}x${selectedBlock.height} ditempatkan pada (${x}, ${y}).`);
      }
      return;
    }

    if (mapTool === 'shadow') {
      const shadowLayer = 3;
      const nextTile = currentMap.layers[shadowLayer].data[cellIndex] === 10 ? 0 : 10;
      const layers = paintLayerCell(currentMap.layers, shadowLayer, cellIndex, nextTile);
      const next = { ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } };
      if (isBatch) {
        activeStrokeBundleRef.current = next;
        bundleRef.current = next;
        strokeModifiedRef.current = true;
        setBundle(next);
      } else {
        commit(next, `Shadow Pen diterapkan pada (${x}, ${y}).`);
      }
      return;
    }

    if (mapTool === 'fill') {
      const layers = floodFillLayer(currentMap.layers, layerIndex, cellIndex, tileId, currentMap.width, currentMap.height, overrideShape);
      if (layers === currentMap.layers) return;
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Fill${isShift ? ' (Shift)' : ''} diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    if (mapTool === 'rectangle') {
      if (!rectangleStart) {
        setRectangleStart({ x, y });
        setMessage(`Awal rectangle: (${x}, ${y}). Pilih sudut akhir.`);
        return;
      }
      if (!isEraser && (selectedBlock.width > 1 || selectedBlock.height > 1)) {
        const layers = paintLayerBlockRectangle(
          currentMap.layers,
          activeLayer,
          rectangleStart.x,
          rectangleStart.y,
          x,
          y,
          selectedBlock,
          currentMap.width,
          currentMap.height,
          currentTileset,
          lockedLayers
        );
        setRectangleStart(null);
        commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Rectangle blok ${selectedBlock.width}x${selectedBlock.height} diterapkan.`);
        return;
      }
      const layers = paintLayerRectangle(currentMap.layers, layerIndex, rectangleStart.x, rectangleStart.y, x, y, tileId, currentMap.width, overrideShape);
      setRectangleStart(null);
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Rectangle${isShift ? ' (Shift)' : ''} diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    if (mapTool === 'circle') {
      if (!rectangleStart) {
        setRectangleStart({ x, y });
        setMessage(`Awal Circle: (${x}, ${y}). Pilih sudut akhir.`);
        return;
      }
      const layers = paintLayerCircle(currentMap.layers, layerIndex, rectangleStart.x, rectangleStart.y, x, y, tileId, currentMap.width, overrideShape);
      setRectangleStart(null);
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Circle${isShift ? ' (Shift)' : ''} diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    const currentTile = currentMap.layers[layerIndex].data[cellIndex];
    const currentShape = currentMap.layers[layerIndex].autotileShapes?.[cellIndex];
    if (currentTile === tileId && (!isShift || currentShape === overrideShape)) return;

    const layers = paintLayerCell(
      currentMap.layers,
      layerIndex,
      cellIndex,
      tileId,
      overrideShape,
      isShift,
      currentMap.width,
      currentMap.height,
      currentTileDef
    );
    const next = { ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } };
    if (isBatch) {
      activeStrokeBundleRef.current = next;
      bundleRef.current = next;
      strokeModifiedRef.current = true;
      setBundle(next);
    } else {
      commit(next, `Tile${isShift ? ' (Shift Mapping)' : ''} diterapkan pada Layer ${layerIndex + 1}.`);
    }
  };

  const drawTile = (x: number, y: number, isShift = false) => {
    applyPaint(x, y, false, isShift);
  };

  const handleMapCell = (x: number, y: number, marker?: MapEvent, isShift = false) => {
    if (mode === 'event') {
      setSelectedCell({ x, y });
      if (marker) {
        selectEvent(marker.id);
        setMessage(`Event "${marker.name}" dipilih pada (${x}, ${y}). Klik ganda untuk menyunting.`);
      } else {
        setSelectedEvent('');
        setMessage(`Koordinat (${x}, ${y}) dipilih. Klik ganda untuk membuat event.`);
      }
      return;
    }
    if (mapTool === 'collision') return toggleTile(x, y);
    drawTile(x, y, isShift);
  };

  const handleCellDoubleClick = (x: number, y: number, marker?: MapEvent) => {
    if (mode === 'event') {
      setSelectedCell({ x, y });
      if (marker) {
        selectEvent(marker.id);
        setModal('eventEditor');
      } else {
        createEventAt(x, y);
      }
    }
  };

  const pickTile = (x: number, y: number, isShift = false) => {
    if (!map) return;
    const cell = y * map.width + x;

    if (paletteGroup === 'R') {
      const regId = map.regions?.[cell] ?? 0;
      setSelectedTile(regId);
      setSelectedBlock({
        minCol: 0,
        minRow: 0,
        maxCol: 0,
        maxRow: 0,
        width: 1,
        height: 1,
        tiles: [[regId]]
      });
      setMapTool(regId === 0 ? 'eraser' : 'pencil');
      setMessage(regId === 0 ? 'Clear Region dipilih.' : `Region ${regId} dipilih dari map.`);
      return;
    }

    const layerIndex = activeLayer === 'auto' ? [3, 2, 1, 0].find(index => visibleLayers[index] && map.layers[index].data[cell] !== 0) ?? 0 : activeLayer;
    const tileId = map.layers[layerIndex].data[cell];
    const def = tileDefinition(tileId, currentTileset);
    setSelectedTile(tileId);
    setSelectedBlock({
      minCol: 0,
      minRow: 0,
      maxCol: 0,
      maxRow: 0,
      width: 1,
      height: 1,
      tiles: [[tileId]]
    });
    setPaletteGroup(def.group === 'D' && tileId <= 116 ? 'R' : ((def.group ?? 'A') as any));
    setMapTool(tileId === 0 ? 'eraser' : 'pencil');

    if (isShift && def.autotile && def.autotileBaseX !== undefined && def.autotileBaseY !== undefined) {
      const quads = getAutotileQuadrants(def, map.layers[layerIndex].data, cell, map.width, map.height, map.layers[layerIndex].autotileShapes?.[cell]);
      shiftStampQuadsRef.current = quads;
      setMessage(`${def.name || `Tile ${tileId}`} (Shift-Copy): bentuk autotile disalin. Tekan Shift+Klik untuk menempel.`);
    } else {
      shiftStampQuadsRef.current = def.autotile ? getDefaultAutotileQuadrants(def, 'isolated') : null;
      setMessage(`${def.name || `Tile ${tileId}`} diambil dari Layer ${layerIndex + 1}.`);
    }
  };

  const clearLayer = (layerIndex: number) => {
    if (!bundle || !map || lockedLayers[layerIndex]) return setMessage(`Layer ${layerIndex + 1} terkunci.`);
    if (!map.layers[layerIndex].data.some(Boolean)) return setMessage(`Layer ${layerIndex + 1} sudah kosong.`);
    const layers = map.layers.map((layer, index) => (index === layerIndex ? { ...layer, data: Array(map.width * map.height).fill(0) } : layer));
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, layers } } }, `Layer ${layerIndex + 1} dikosongkan.`);
  };

  const rightClickStartRef = useRef<{ x: number; y: number } | null>(null);

  const onMouseDownCell = (x: number, y: number, e: React.MouseEvent) => {
    setCellContextMenu(null);
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: viewportRef.current?.scrollLeft || 0,
        scrollTop: viewportRef.current?.scrollTop || 0
      };
      return;
    }
    if (e.button === 0) {
      if (mode === 'event') {
        setSelectedCell({ x, y });
        const ev = map?.events.find(event => event.x === x && event.y === y);
        if (ev) {
          selectEvent(ev.id);
          eventDragStartRef.current = { eventId: ev.id, originX: x, originY: y, hasMoved: false };
          eventDragTargetRef.current = { x, y };
        } else {
          setSelectedEvent('');
          eventDragStartRef.current = null;
          eventDragTargetRef.current = null;
        }
        return;
      }
      if (mode === 'map') {
        if (mapTool === 'pencil' || mapTool === 'eraser' || mapTool === 'shadow') {
          const curr = bundleRef.current || bundle;
          if (curr) {
            isMouseDownRef.current = true;
            isShiftHeldRef.current = e.shiftKey;
            strokeInitialBundleRef.current = structuredClone(curr);
            activeStrokeBundleRef.current = structuredClone(curr);
            strokeModifiedRef.current = false;
            applyPaint(x, y, true, e.shiftKey);
          }
        }
      }
    } else if (e.button === 2 && mode === 'map') {
      rightClickStartRef.current = { x, y };
    }
  };

  const onMouseEnterCell = (x: number, y: number) => {
    const coordEl = document.getElementById('mz-status-coord-display');
    if (coordEl) coordEl.textContent = `(X: ${x}, Y: ${y})`;
    setHoverMapCell({ x, y });
    if (mode === 'event' && eventDragStartRef.current) {
      eventDragStartRef.current.hasMoved = true;
      eventDragTargetRef.current = { x, y };
      const start = eventDragStartRef.current;
      setDraggedEvent({
        eventId: start.eventId,
        originX: start.originX,
        originY: start.originY,
        targetX: x,
        targetY: y
      });
      const ev = map?.events.find(e => e.id === start.eventId);
      if (ev) {
        setMessage(`Memindahkan "${ev.name}" ke (${x}, ${y}). Lepaskan klik untuk menaruh.`);
      }
      return;
    }
    if (isMouseDownRef.current && mode === 'map') {
      if (mapTool === 'pencil' || mapTool === 'eraser' || mapTool === 'shadow') {
        applyPaint(x, y, true, isShiftHeldRef.current);
      }
    }
  };

  const onClickCell = (x: number, y: number, marker?: MapEvent, shiftKey = false) => {
    if (
      mode === 'event' ||
      mapTool === 'collision' ||
      mapTool === 'fill' ||
      mapTool === 'rectangle' ||
      mapTool === 'circle'
    ) {
      handleMapCell(x, y, marker, shiftKey);
    }
  };

  const onContextMenuCell = (x: number, y: number, marker: MapEvent | undefined, event: React.MouseEvent) => {
    event.preventDefault();
    if (mode === 'map') {
      const start = rightClickStartRef.current;
      if (start && (start.x !== x || start.y !== y) && map) {
        const minX = Math.min(start.x, x);
        const maxX = Math.max(start.x, x);
        const minY = Math.min(start.y, y);
        const maxY = Math.max(start.y, y);
        const bWidth = maxX - minX + 1;
        const bHeight = maxY - minY + 1;

        const blockTiles: number[][] = [];
        for (let r = minY; r <= maxY; r++) {
          const rowTiles: number[] = [];
          for (let c = minX; c <= maxX; c++) {
            const cellIdx = r * map.width + c;
            const lIdx =
              activeLayer === 'auto'
                ? [3, 2, 1, 0].find(i => visibleLayers[i] && map.layers[i].data[cellIdx] !== 0) ?? 0
                : activeLayer;
            rowTiles.push(map.layers[lIdx].data[cellIdx]);
          }
          blockTiles.push(rowTiles);
        }

        setSelectedBlock({
          minCol: 0,
          minRow: 0,
          maxCol: bWidth - 1,
          maxRow: bHeight - 1,
          width: bWidth,
          height: bHeight,
          tiles: blockTiles
        });
        setSelectedTile(blockTiles[0][0]);
        setMapTool('pencil');
        setMessage(`Blok ${bWidth}x${bHeight} disalin dari map.`);
      } else {
        pickTile(x, y, event.shiftKey);
      }
      rightClickStartRef.current = null;
    } else {
      setSelectedCell({ x, y });
      if (marker) {
        selectEvent(marker.id);
      }
      setCellContextMenu({ x: event.clientX, y: event.clientY, cellX: x, cellY: y, marker });
    }
  };

  return {
    canvasTick,
    setCanvasTick,
    isShiftPressed,
    setIsShiftPressed,
    isShiftHeldRef,
    shiftStampQuadsRef,
    isMouseDownRef,
    strokeInitialBundleRef,
    activeStrokeBundleRef,
    strokeModifiedRef,
    toggleTile,
    applyPaint,
    drawTile,
    handleMapCell,
    handleCellDoubleClick,
    pickTile,
    clearLayer,
    onMouseDownCell,
    onMouseEnterCell,
    onClickCell,
    onContextMenuCell,
    draggedEvent
  };
}
