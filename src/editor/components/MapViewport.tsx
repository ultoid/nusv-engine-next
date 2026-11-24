import React from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { MapData, MapEvent, ProjectBundle } from '../../core/types.js';
import type { PaletteBlockSelection } from './MapPaletteCanvas.js';

export interface MapViewportProps {
  bundle: ProjectBundle;
  map?: MapData;
  mode: 'map' | 'event' | 'search';
  dirty: boolean;
  currentEvent?: MapEvent;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewportRef: React.RefObject<HTMLDivElement>;
  isPanningRef: React.MutableRefObject<boolean>;
  panStartRef: React.MutableRefObject<{ x: number; y: number; scrollLeft: number; scrollTop: number }>;
  activeLayer: LayerSelection;
  mapTool: string;
  selectedBlock: PaletteBlockSelection;
  hoverMapCell: { x: number; y: number } | null;
  setHoverMapCell: (cell: { x: number; y: number } | null) => void;
  selectedCell: { x: number; y: number } | null;
  selectedEvent: string;
  rectangleStart: { x: number; y: number } | null;
  draggedEvent?: { eventId: string; originX: number; originY: number; targetX: number; targetY: number } | null;
  assetUrls: Record<string, string>;
  onMouseDownCell: (x: number, y: number, e: React.MouseEvent) => void;
  onMouseEnterCell: (x: number, y: number) => void;
  onClickCell: (x: number, y: number, marker: MapEvent | undefined, shiftKey: boolean) => void;
  onDoubleClickCell: (x: number, y: number, marker: MapEvent | undefined) => void;
  onContextMenuCell: (x: number, y: number, marker: MapEvent | undefined, e: React.MouseEvent) => void;
  query: string;
  setQuery: (q: string) => void;
  references: Array<{ path: string; preview: string }>;
}

export function MapViewport({
  bundle,
  map,
  mode,
  dirty,
  currentEvent,
  zoom,
  setZoom,
  canvasRef,
  viewportRef,
  isPanningRef,
  panStartRef,
  activeLayer,
  mapTool,
  selectedBlock,
  hoverMapCell,
  setHoverMapCell,
  selectedCell,
  selectedEvent,
  rectangleStart,
  draggedEvent,
  assetUrls,
  onMouseDownCell,
  onMouseEnterCell,
  onClickCell,
  onDoubleClickCell,
  onContextMenuCell,
  query,
  setQuery,
  references
}: MapViewportProps) {
  const getEventGraphicStyle = (ev: MapEvent) => {
    const page = ev.pages?.[0];
    const graphic = page?.graphic;
    let spriteUrl: string | undefined;
    let bgPos = '-48px 0px';
    let bgSize = '576px 384px';

    if (graphic?.characterName) {
      spriteUrl = assetUrls[graphic.characterName];
      if (spriteUrl) {
        const isSingle = graphic.characterName.split('/').pop()?.startsWith('$');
        const charIdx = isSingle ? 0 : (graphic.characterIndex ?? 0);
        const colChar = isSingle ? 0 : charIdx % 4;
        const rowChar = isSingle ? 0 : Math.floor(charIdx / 4);

        const pattern = graphic.pattern ?? 1;
        const dirMap: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
        const dirIdx = dirMap[graphic.direction ?? 'down'] ?? 0;

        const frameX = (colChar * 3 + pattern) * 48;
        const frameY = (rowChar * 4 + dirIdx) * 48;
        bgPos = `-${frameX}px -${frameY}px`;
        bgSize = isSingle ? '144px 192px' : '576px 384px';
        return { spriteUrl, bgPos, bgSize };
      }
    }

    const lowerName = ev.name.toLowerCase();
    const lowerId = ev.id.toLowerCase();
    if (lowerId.includes('gate') || lowerName.includes('gerbang') || lowerName.includes('pintu') || lowerId.includes('door')) {
      spriteUrl = assetUrls['assets/characters/Door1.png'];
      bgPos = '-48px 0px';
    } else if (lowerId.includes('chest') || lowerName.includes('peti')) {
      spriteUrl = assetUrls['assets/characters/Chest.png'];
      bgPos = '-48px 0px';
      bgSize = '144px 192px';
    } else if (lowerId.includes('guide') || lowerName.includes('penjaga') || lowerId.includes('inn') || lowerName.includes('inn')) {
      spriteUrl = assetUrls['assets/characters/Actor2.png'];
      bgPos = '-48px 0px';
    }

    return { spriteUrl, bgPos, bgSize };
  };
  return (
    <section className="mv-document-area">
      <div className="mv-document-tabs">
        <button className="active">
          <span>{mode === 'map' ? '▦' : mode === 'event' ? '◆' : '⌕'}</span>
          {mode === 'map' ? map?.name ?? 'Map' : mode === 'event' ? currentEvent?.name ?? 'Event Editor' : 'Reference Search'}
          {dirty && <i>●</i>}
        </button>
      </div>

      {!map ? (
        <div className="mv-welcome">
          <div className="mv-welcome-logo">N</div>
          <h1>{bundle.project.title}</h1>
          <p>Pilih map dari panel proyek untuk mulai menyunting.</p>
        </div>
      ) : (
        <div className="mv-document">
          {(mode === 'map' || mode === 'event') && (
            <div
              ref={viewportRef}
              className="mv-map-viewport full-canvas"
              onWheel={(e) => {
                if (e.ctrlKey) {
                  e.preventDefault();
                  const zoomSteps = [50, 75, 100, 150, 200];
                  if (e.deltaY < 0) {
                    const next = zoomSteps.find(z => z > zoom);
                    if (next) setZoom(next);
                  } else if (e.deltaY > 0) {
                    const prev = [...zoomSteps].reverse().find(z => z < zoom);
                    if (prev) setZoom(prev);
                  }
                }
              }}
              onMouseDown={(e) => {
                if (e.button === 1 || (e.button === 0 && e.altKey)) {
                  e.preventDefault();
                  isPanningRef.current = true;
                  panStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    scrollLeft: viewportRef.current?.scrollLeft || 0,
                    scrollTop: viewportRef.current?.scrollTop || 0,
                  };
                }
              }}
              onMouseLeave={() => {
                const coordEl = document.getElementById('mz-status-coord-display');
                if (coordEl) coordEl.textContent = '';
                setHoverMapCell(null);
              }}
            >
              <div
                className="mv-map-zoom-wrapper"
                style={{
                  width: `${Math.round(map.width * 48 * (zoom / 100))}px`,
                  height: `${Math.round(map.height * 48 * (zoom / 100))}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: '0 0',
                }}
              >
                <div className="mv-map-stage" style={{ width: `${map.width * 48}px`, height: `${map.height * 48}px` }}>
                  <canvas
                    ref={canvasRef}
                    className="mv-map-canvas"
                    width={map.width * 48}
                    height={map.height * 48}
                  />
                  <div
                    className={`mv-map-grid ${mode === 'event' ? 'event-grid-mode' : 'map-mode-clean'} ${activeLayer !== 'auto' ? 'layer-focus' : ''} ${draggedEvent ? 'is-dragging-active' : ''}`}
                    style={{
                      gridTemplateColumns: `repeat(${map.width}, 48px)`,
                      gridTemplateRows: `repeat(${map.height}, 48px)`,
                      width: `${map.width * 48}px`,
                      height: `${map.height * 48}px`,
                    }}
                  >
                    {map.collision.map((cell, index) => {
                      const x = index % map.width, y = Math.floor(index / map.width);
                      const marker = map.events.find(event => event.x === x && event.y === y);
                      const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                      const isDragTarget = Boolean(draggedEvent && draggedEvent.targetX === x && draggedEvent.targetY === y);
                      const isBeingDragged = Boolean(draggedEvent && marker?.id === draggedEvent.eventId);
                      const isBlockHover =
                        mode === 'map' &&
                        mapTool === 'pencil' &&
                        hoverMapCell !== null &&
                        (selectedBlock.width > 1 || selectedBlock.height > 1) &&
                        x >= hoverMapCell.x &&
                        x < hoverMapCell.x + selectedBlock.width &&
                        y >= hoverMapCell.y &&
                        y < hoverMapCell.y + selectedBlock.height;

                      const draggedEv = isDragTarget && draggedEvent ? map.events.find(e => e.id === draggedEvent.eventId) : null;

                      return (
                        <button
                          title={mode === 'event'
                            ? `${x}, ${y}${marker ? ` — ${marker.name}` : ' (Kosong)'} · Drag untuk memindahkan · Double click untuk ${marker ? 'edit' : 'buat'} event`
                            : `${x}, ${y}${marker ? ` — ${marker.name}` : ''} · Right-click to pick tile/block`}
                          className={`${mapTool === 'collision' && cell ? 'blocked' : ''} ${marker ? 'has-event' : ''} ${marker?.id === selectedEvent || isSelected ? 'selected' : ''} ${isSelected && mode === 'event' ? 'cell-selected' : ''} ${rectangleStart?.x === x && rectangleStart.y === y ? 'rectangle-origin' : ''} ${isBlockHover ? 'block-hover' : ''} ${isDragTarget ? 'drag-target-cell' : ''} ${isBeingDragged ? 'is-dragging' : ''}`}
                          key={index}
                          onDragStart={e => e.preventDefault()}
                          onMouseDown={(e) => onMouseDownCell(x, y, e)}
                          onMouseEnter={() => onMouseEnterCell(x, y)}
                          onClick={(e) => onClickCell(x, y, marker, e.shiftKey)}
                          onDoubleClick={() => onDoubleClickCell(x, y, marker)}
                          onContextMenu={(e) => onContextMenuCell(x, y, marker, e)}
                        >
                          {mapTool === 'collision' && (
                            <span className={`collision-mark ${cell ? 'blocked-mark' : 'passable-mark'}`}>
                              {cell ? '×' : '○'}
                            </span>
                          )}
                          {bundle.project.start.mapId === map.id && bundle.project.start.x === x && bundle.project.start.y === y && (
                            <span
                              className={`mv-start-marker ${assetUrls['assets/characters/Actor1.png'] ? 'textured-actor' : ''}`}
                              title="Starting Position: Player"
                              style={assetUrls['assets/characters/Actor1.png'] ? {
                                backgroundImage: `url("${assetUrls['assets/characters/Actor1.png']}")`,
                                backgroundPosition: '-48px 0px',
                                backgroundSize: '576px 384px',
                                imageRendering: 'pixelated'
                              } : undefined}
                            >
                              {!assetUrls['assets/characters/Actor1.png'] && <>👤<small>S</small></>}
                            </span>
                          )}
                          {isDragTarget && draggedEv && (
                            <span
                              className="mv-event-ghost"
                              style={(() => {
                                const { spriteUrl, bgPos, bgSize } = getEventGraphicStyle(draggedEv);
                                return spriteUrl ? {
                                  backgroundImage: `url("${spriteUrl}")`,
                                  backgroundPosition: bgPos,
                                  backgroundSize: bgSize,
                                  imageRendering: 'pixelated'
                                } : undefined;
                              })()}
                            >
                              {!getEventGraphicStyle(draggedEv).spriteUrl && '◆'}
                              <small>{draggedEv.name}</small>
                            </span>
                          )}
                          {marker && (() => {
                            const { spriteUrl, bgPos, bgSize } = getEventGraphicStyle(marker);
                            return (
                              <span
                                className={`mv-event-marker ${spriteUrl ? 'textured-event' : ''}`}
                                style={spriteUrl ? {
                                  backgroundImage: `url("${spriteUrl}")`,
                                  backgroundPosition: bgPos,
                                  backgroundSize: bgSize,
                                  imageRendering: 'pixelated'
                                } : undefined}
                              >
                                {!spriteUrl && '◆'}
                                <small>{marker.name}</small>
                              </span>
                            );
                          })()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'search' && (
            <div className="mv-search-view">
              <div className="mv-view-header">
                <div>
                  <span className="mv-kicker">PROJECT TOOLS</span>
                  <h2>Reference Search</h2>
                  <p>Find IDs, names, switches, items, and references across the project.</p>
                </div>
              </div>
              <div className="mv-search-box">
                <span>⌕</span>
                <input
                  autoFocus
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search project references…"
                />
              </div>
              <div className="mv-results">
                <div className="mv-results-title">{query ? `${references.length} results` : 'Enter a search term'}</div>
                {references.map(hit => (
                  <article key={hit.path}>
                    <code>{hit.path}</code>
                    <p>{hit.preview}</p>
                  </article>
                ))}
                {query && !references.length && (
                  <div className="mv-blank-state">
                    <span>⌕</span>
                    <p>No references found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
