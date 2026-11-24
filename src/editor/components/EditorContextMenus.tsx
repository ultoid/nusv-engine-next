import React, { useEffect } from 'react';
import type { MapData, MapEvent, ProjectBundle } from '../../core/types.js';
import type { useEventEditor } from '../hooks/useEventEditor.js';
import type { useMapOperations } from '../hooks/useMapOperations.js';

const clone = <T,>(value: T): T => structuredClone(value);

export interface EditorContextMenusProps {
  bundle?: ProjectBundle;
  map?: MapData;
  mapOps: ReturnType<typeof useMapOperations>;
  eventEditor: ReturnType<typeof useEventEditor>;
  mapContextMenu: { x: number; y: number; mapId: string } | null;
  cellContextMenu: { x: number; y: number; cellX: number; cellY: number; marker?: MapEvent } | null;
  setMapContextMenu: (m: { x: number; y: number; mapId: string } | null) => void;
  setCellContextMenu: (c: { x: number; y: number; cellX: number; cellY: number; marker?: MapEvent } | null) => void;
  setMode: (m: 'map' | 'event' | 'search') => void;
  setModal: (m: string) => void;
  commit: (next: ProjectBundle, status?: string) => void;
  setMessage: (msg: string) => void;
}

export function EditorContextMenus({
  bundle,
  map,
  mapOps,
  eventEditor,
  mapContextMenu,
  cellContextMenu,
  setMapContextMenu,
  setCellContextMenu,
  setMode,
  setModal,
  commit,
  setMessage
}: EditorContextMenusProps) {
  useEffect(() => {
    if (!cellContextMenu && !mapContextMenu) return;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.mv-context-menu')) {
        return;
      }
      setCellContextMenu(null);
      setMapContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCellContextMenu(null);
        setMapContextMenu(null);
      }
    };

    const handleBlur = () => {
      setCellContextMenu(null);
      setMapContextMenu(null);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('wheel', handlePointerDown, { capture: true, passive: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('wheel', handlePointerDown, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [cellContextMenu, mapContextMenu, setCellContextMenu, setMapContextMenu]);

  return (
    <>
      {mapContextMenu && (
        <div
          className="mv-context-menu"
          style={{ left: `${mapContextMenu.x}px`, top: `${mapContextMenu.y}px` }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              mapOps.handleOpenMapProperties(mapContextMenu.mapId);
              setMapContextMenu(null);
            }}
          >
            <span>Edit...</span>
            <kbd>Space</kbd>
          </button>
          <button
            onClick={() => {
              mapOps.handleCreateNewMap();
              setMapContextMenu(null);
            }}
          >
            <span>New...</span>
            <kbd>Return</kbd>
          </button>
          <button
            onClick={() => {
              setModal('sampleMaps');
              setMapContextMenu(null);
            }}
          >
            <span>Load...</span>
          </button>
          <hr />
          <button
            onClick={() => {
              mapOps.handleCopyMap(mapContextMenu.mapId);
              setMapContextMenu(null);
            }}
          >
            <span>Copy</span>
            <kbd>Ctrl+C</kbd>
          </button>
          <button
            disabled={!mapOps.copiedMap}
            onClick={() => {
              mapOps.handlePasteMap();
              setMapContextMenu(null);
            }}
          >
            <span>Paste</span>
            <kbd>Ctrl+V</kbd>
          </button>
          <button
            disabled={!bundle || bundle.project.maps.length <= 1}
            onClick={() => {
              mapOps.handleDeleteMap(mapContextMenu.mapId);
              setMapContextMenu(null);
            }}
          >
            <span>Delete</span>
            <kbd>Del</kbd>
          </button>
          <hr />
          <button
            onClick={() => {
              setMode('search');
              setMapContextMenu(null);
            }}
          >
            <span>Find...</span>
            <kbd>Ctrl+F</kbd>
          </button>
          <button
            disabled={!map || !map.events.length}
            onClick={() => {
              mapOps.handleFindNextEvent();
              setMapContextMenu(null);
            }}
          >
            <span>Find Next</span>
            <kbd>F3</kbd>
          </button>
          <button
            disabled={!map || !map.events.length}
            onClick={() => {
              mapOps.handleFindPrevEvent();
              setMapContextMenu(null);
            }}
          >
            <span>Find Previous</span>
            <kbd>Shift+F3</kbd>
          </button>
          <hr />
          <button
            onClick={() => {
              mapOps.handleOpenShiftModal(mapContextMenu.mapId);
              setMapContextMenu(null);
            }}
          >
            <span>Shift...</span>
            <kbd>Ctrl+T</kbd>
          </button>
          <button
            onClick={() => {
              mapOps.handleOpenGenerateDungeon();
              setMapContextMenu(null);
            }}
          >
            <span>Generate Dungeon...</span>
            <kbd>Ctrl+D</kbd>
          </button>
          <button
            onClick={() => {
              mapOps.handleSaveMapAsImage(mapContextMenu.mapId);
              setMapContextMenu(null);
            }}
          >
            <span>Save as Image...</span>
          </button>
        </div>
      )}

      {cellContextMenu && (
        <div
          className="mv-context-menu"
          style={{ left: `${cellContextMenu.x}px`, top: `${cellContextMenu.y}px` }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              eventEditor.createEventAt(cellContextMenu.cellX, cellContextMenu.cellY);
              setCellContextMenu(null);
            }}
          >
            <span>New...</span>
            <kbd>Return</kbd>
          </button>
          <button
            disabled={!cellContextMenu.marker}
            onClick={() => {
              if (cellContextMenu.marker) {
                eventEditor.selectEvent(cellContextMenu.marker.id);
                setModal('eventEditor');
              }
              setCellContextMenu(null);
            }}
          >
            <span>Edit...</span>
            <kbd>Space</kbd>
          </button>
          <hr />
          <button
            disabled={!cellContextMenu.marker}
            onClick={() => {
              if (cellContextMenu.marker) {
                eventEditor.setClipboard(clone(cellContextMenu.marker));
                eventEditor.removeEvent(cellContextMenu.marker.id);
                setMessage(`Event "${cellContextMenu.marker.name}" dipotong.`);
              }
              setCellContextMenu(null);
            }}
          >
            <span>Cut</span>
            <kbd>Ctrl+X</kbd>
          </button>
          <button
            disabled={!cellContextMenu.marker}
            onClick={() => {
              if (cellContextMenu.marker) {
                eventEditor.setClipboard(clone(cellContextMenu.marker));
                setMessage(`Event "${cellContextMenu.marker.name}" disalin.`);
              }
              setCellContextMenu(null);
            }}
          >
            <span>Copy</span>
            <kbd>Ctrl+C</kbd>
          </button>
          <button
            disabled={!eventEditor.clipboard}
            onClick={() => {
              if (eventEditor.clipboard && map && bundle) {
                let n = 1;
                while (map.events.some(e => e.id === `event.copy-${n}`)) n++;
                const pasted: MapEvent = {
                  ...clone(eventEditor.clipboard),
                  id: `event.copy-${n}`,
                  name: `${eventEditor.clipboard.name} (Copy)`,
                  x: cellContextMenu.cellX,
                  y: cellContextMenu.cellY
                };
                commit(
                  { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, pasted] } } },
                  `Event "${pasted.name}" ditempel pada (${cellContextMenu.cellX}, ${cellContextMenu.cellY}).`
                );
              }
              setCellContextMenu(null);
            }}
          >
            <span>Paste</span>
            <kbd>Ctrl+V</kbd>
          </button>
          <button
            disabled={!cellContextMenu.marker}
            onClick={() => {
              if (cellContextMenu.marker) {
                eventEditor.removeEvent(cellContextMenu.marker.id);
              }
              setCellContextMenu(null);
            }}
          >
            <span>Delete</span>
            <kbd>Del</kbd>
          </button>
          <hr />
          <div className="mv-menu-section-title">Quick Event Creation</div>
          <button
            onClick={() => {
              mapOps.setQuickSourceX(cellContextMenu.cellX);
              mapOps.setQuickSourceY(cellContextMenu.cellY);
              mapOps.setQuickTargetMap(bundle?.project.maps[0] || map?.id || '');
              mapOps.setQuickTargetX(0);
              mapOps.setQuickTargetY(0);
              setModal('quickTransfer');
              setCellContextMenu(null);
            }}
          >
            <span>Quick Transfer...</span>
          </button>
          <button
            onClick={() => {
              mapOps.setQuickSourceX(cellContextMenu.cellX);
              mapOps.setQuickSourceY(cellContextMenu.cellY);
              mapOps.setQuickTargetMap(bundle?.project.maps[0] || map?.id || '');
              mapOps.setQuickTargetX(0);
              mapOps.setQuickTargetY(0);
              setModal('quickDoor');
              setCellContextMenu(null);
            }}
          >
            <span>Quick Door...</span>
          </button>
          <button
            onClick={() => {
              mapOps.setQuickSourceX(cellContextMenu.cellX);
              mapOps.setQuickSourceY(cellContextMenu.cellY);
              mapOps.setQuickChestType('gold');
              mapOps.setQuickChestAmount(100);
              mapOps.setQuickChestItem(bundle?.game.items[0]?.id || '');
              setModal('quickChest');
              setCellContextMenu(null);
            }}
          >
            <span>Quick Treasure Chest...</span>
          </button>
          <button
            onClick={() => {
              mapOps.setQuickSourceX(cellContextMenu.cellX);
              mapOps.setQuickSourceY(cellContextMenu.cellY);
              mapOps.setQuickInnPrice(10);
              setModal('quickInn');
              setCellContextMenu(null);
            }}
          >
            <span>Quick Inn...</span>
          </button>
          <hr />
          <button
            onClick={() => {
              mapOps.handleSetStartingPosition(cellContextMenu.cellX, cellContextMenu.cellY);
              setCellContextMenu(null);
            }}
          >
            <span>Set Starting Position: Player</span>
          </button>
        </div>
      )}
    </>
  );
}
