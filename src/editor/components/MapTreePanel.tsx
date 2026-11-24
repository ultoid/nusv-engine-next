import React from 'react';
import { getPaletteTiles, resolveSheetPath, type TileDefinition } from '../../core/map-layers.js';
import type { MapData, ProjectBundle, TilesetData } from '../../core/types.js';
import { MZIcons } from '../MZIcons.js';
import { MapPaletteCanvas, type PaletteBlockSelection } from './MapPaletteCanvas.js';

export interface MapTreePanelProps {
  mode: 'map' | 'event' | 'search';
  paletteGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'R';
  paletteTiles: TileDefinition[];
  selectedTile: number;
  selectedBlock: PaletteBlockSelection;
  currentTileset: TilesetData;
  assetUrls: Record<string, string>;
  bundle: ProjectBundle;
  map?: MapData;
  selectedMap: string;
  selectedEvent: string;
  onSelectBlock: (block: PaletteBlockSelection) => void;
  setPaletteGroup: (group: 'A' | 'B' | 'C' | 'D' | 'E' | 'R') => void;
  setSelectedTile: (id: number) => void;
  setSelectedBlock: (block: PaletteBlockSelection) => void;
  onAddEvent: () => void;
  onSelectEventCell: (id: string, x: number, y: number) => void;
  onDoubleClickEvent: (id: string, x: number, y: number) => void;
  onChooseMap: (id: string) => void;
  onOpenMapProperties: (id: string) => void;
  onOpenMapContextMenu: (e: React.MouseEvent, mapId: string) => void;
}

export function MapTreePanel({
  mode,
  paletteGroup,
  paletteTiles,
  selectedTile,
  selectedBlock,
  currentTileset,
  assetUrls,
  bundle,
  map,
  selectedMap,
  selectedEvent,
  onSelectBlock,
  setPaletteGroup,
  setSelectedTile,
  setSelectedBlock,
  onAddEvent,
  onSelectEventCell,
  onDoubleClickEvent,
  onChooseMap,
  onOpenMapProperties,
  onOpenMapContextMenu
}: MapTreePanelProps) {
  return (
    <aside className="mv-sidebar mv-project-pane">
      {mode === 'map' ? (
        <div className="mz-tile-pane">
          <div className="mz-tile-palette-body">
            <MapPaletteCanvas
              paletteGroup={paletteGroup}
              paletteTiles={paletteTiles}
              selectedTile={selectedTile}
              selectedBlock={selectedBlock}
              onSelectBlock={onSelectBlock}
              activeSheetUrl={
                paletteGroup === 'B' ? (assetUrls[resolveSheetPath(currentTileset?.tilesetNames?.[5] || 'Outside_B')] || '') :
                paletteGroup === 'C' ? (assetUrls[resolveSheetPath(currentTileset?.tilesetNames?.[6] || 'Outside_C')] || '') :
                paletteGroup === 'D' ? (assetUrls[resolveSheetPath(currentTileset?.tilesetNames?.[7] || '')] || '') :
                paletteGroup === 'E' ? (assetUrls[resolveSheetPath(currentTileset?.tilesetNames?.[8] || '')] || '') :
                ''
              }
              assetUrls={assetUrls}
            />
          </div>
          {/* Tab A, B, C, (D), (E), R tepat di bawah palette */}
          <div className="mv-palette-tabs">
            {(['A', 'B', 'C', ...(currentTileset?.tilesetNames?.[7] ? ['D'] : []), ...(currentTileset?.tilesetNames?.[8] ? ['E'] : []), 'R'] as const).map(group => {
              const targetGroup = group as 'A' | 'B' | 'C' | 'D' | 'E' | 'R';
              const isActive = paletteGroup === targetGroup;
              return (
                <button
                  className={isActive ? 'active' : ''}
                  key={group}
                  onClick={() => {
                    setPaletteGroup(targetGroup);
                    const targetTiles = getPaletteTiles(targetGroup, currentTileset);
                    const firstTile = targetTiles[0]?.id ?? 1;
                    setSelectedTile(firstTile);
                    setSelectedBlock({
                      minCol: 0,
                      minRow: 0,
                      maxCol: 0,
                      maxRow: 0,
                      width: 1,
                      height: 1,
                      tiles: [[firstTile]],
                    });
                  }}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mz-events-pane">
          <div className="mv-pane-title">
            <strong>Events — {map?.name}</strong>
            <button className="mz-mini-add-btn" onClick={onAddEvent}>＋ New</button>
          </div>
          <div className="mz-events-list">
            {map?.events.map(event => (
              <button
                className={event.id === selectedEvent ? 'selected' : ''}
                key={event.id}
                onClick={() => onSelectEventCell(event.id, event.x, event.y)}
                onDoubleClick={() => onDoubleClickEvent(event.id, event.x, event.y)}
              >
                <span className="event-dot">◆</span>
                <span>{event.name}</span>
                <small>{event.x}, {event.y}</small>
              </button>
            ))}
            {!map?.events.length && <p className="mv-empty-tree">No events on this map</p>}
          </div>
        </div>
      )}

      <div
        className="mz-map-tree-pane"
        onContextMenu={(e) => onOpenMapContextMenu(e, selectedMap || bundle.project.maps[0])}
      >
        <div className="mz-tree-container">
          <div
            className="mz-tree-root"
            onContextMenu={(e) => onOpenMapContextMenu(e, selectedMap || bundle.project.maps[0])}
          >
            <span className="mz-tree-expander">－</span>
            <MZIcons.ProjectFolder />
            <b>{bundle.project.title}</b>
          </div>
          <div className="mz-tree-list">
            {bundle.project.maps.map((id) => (
              <button
                className={`mz-tree-item ${id === selectedMap ? 'selected' : ''}`}
                key={id}
                onClick={() => onChooseMap(id)}
                onDoubleClick={() => onOpenMapProperties(id)}
                onContextMenu={(e) => {
                  onChooseMap(id);
                  onOpenMapContextMenu(e, id);
                }}
              >
                <MZIcons.MapItem />
                <span>{bundle.maps[id]?.name || id}</span>
              </button>
            ))}
            {Array.from({ length: Math.max(0, 14 - bundle.project.maps.length) }, (_, i) => (
              <div className="mz-tree-item mz-tree-empty-row" key={`empty-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
