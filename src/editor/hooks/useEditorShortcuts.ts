import { useEffect } from 'react';
import type { LayerSelection } from '../../core/map-layers.js';
import type { MapEvent, ProjectBundle } from '../../core/types.js';

const clone = <T,>(value: T): T => structuredClone(value);

export interface UseEditorShortcutsParams {
  api: typeof window.nusvEditor;
  bundle?: ProjectBundle;
  dirty: boolean;
  busy: boolean;
  canPlay: boolean;
  mode: 'map' | 'event' | 'search';
  setMode: (m: 'map' | 'event' | 'search') => void;
  selectedMap: string;
  selectedEvent: string;
  selectedCell: { x: number; y: number } | null;
  rectangleStart: { x: number; y: number } | null;
  setRectangleStart: (pt: { x: number; y: number } | null) => void;
  setActiveLayer: React.Dispatch<React.SetStateAction<LayerSelection>>;
  handleSaveProject: () => Promise<void>;
  guardDirty: (action: () => Promise<void> | void, label: string) => void;
  openNewProjectModal: () => void;
  handleOpenProject: (targetPath?: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  setMessage: (msg: string) => void;
  setModal: (m: any) => void;
  handleOpenShiftModal: (mapId: string) => void;
  handleOpenGenerateDungeon: () => void;
  handleFindNextEvent: () => void;
  handleFindPrevEvent: () => void;
  createEventAt: (x: number, y: number) => void;
  removeEvent: (id: string) => void;
  clipboard: MapEvent | null;
  setClipboard: (ev: MapEvent | null) => void;
  commit: (next: ProjectBundle, status?: string) => void;
  setIsShiftPressed: (v: boolean) => void;
  isShiftHeldRef: React.MutableRefObject<boolean>;
  setSelectedCell?: (pt: { x: number; y: number } | null) => void;
  selectEvent?: (id: string) => void;
  setSelectedEvent?: (id: string) => void;
  nudgeEvent?: (id: string, dx: number, dy: number) => void;
}

export function useEditorShortcuts({
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
  handleSaveProject,
  guardDirty,
  openNewProjectModal,
  handleOpenProject,
  undo,
  redo,
  setMessage,
  setModal,
  handleOpenShiftModal,
  handleOpenGenerateDungeon,
  handleFindNextEvent,
  handleFindPrevEvent,
  createEventAt,
  removeEvent,
  clipboard,
  setClipboard,
  commit,
  setIsShiftPressed,
  isShiftHeldRef,
  setSelectedCell,
  selectEvent,
  setSelectedEvent,
  nudgeEvent
}: UseEditorShortcutsParams) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
        isShiftHeldRef.current = true;
      }
      const editing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement;

      if (!editing && mode === 'map' && event.ctrlKey && event.key === 'Tab') {
        event.preventDefault();
        const choices: LayerSelection[] = ['auto', 0, 1, 2, 3];
        setActiveLayer(current => choices[(choices.indexOf(current) + 1) % choices.length]);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (bundle && dirty && !busy) void handleSaveProject();
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        guardDirty(openNewProjectModal, 'Buat Proyek Baru');
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        guardDirty(() => handleOpenProject(), 'Buka Proyek');
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Escape') {
        if (rectangleStart) {
          event.preventDefault();
          setRectangleStart(null);
          setMessage('Operasi area dibatalkan.');
        }
      } else if (!editing && event.key === 'F5' && bundle) {
        event.preventDefault();
        setMode('map');
      } else if (!editing && event.key === 'F9' && bundle) {
        event.preventDefault();
        setModal('database');
      } else if (!editing && event.key === 'F10' && bundle) {
        event.preventDefault();
        setModal('resourceManager');
      } else if (!editing && event.key === 'F6' && canPlay) {
        event.preventDefault();
        void api!.playtest({ mapId: selectedMap, debug: true });
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        if (selectedMap) handleOpenShiftModal(selectedMap);
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        handleOpenGenerateDungeon();
      } else if (!editing && event.key === 'F3') {
        event.preventDefault();
        if (event.shiftKey) {
          handleFindPrevEvent();
        } else {
          handleFindNextEvent();
        }
      } else if (!editing && mode === 'event') {
        const map = bundle?.maps[selectedMap];
        const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
        if (isArrow && map) {
          event.preventDefault();
          let dx = 0;
          let dy = 0;
          if (event.key === 'ArrowUp') dy = -1;
          if (event.key === 'ArrowDown') dy = 1;
          if (event.key === 'ArrowLeft') dx = -1;
          if (event.key === 'ArrowRight') dx = 1;

          if (event.shiftKey && selectedEvent && nudgeEvent) {
            nudgeEvent(selectedEvent, dx, dy);
          } else if (setSelectedCell) {
            const curX = selectedCell ? selectedCell.x : 0;
            const curY = selectedCell ? selectedCell.y : 0;
            const nextX = Math.max(0, Math.min(map.width - 1, curX + dx));
            const nextY = Math.max(0, Math.min(map.height - 1, curY + dy));
            setSelectedCell({ x: nextX, y: nextY });
            const evOnCell = map.events.find(e => e.x === nextX && e.y === nextY);
            if (evOnCell) {
              if (selectEvent) selectEvent(evOnCell.id);
              setMessage(`Event "${evOnCell.name}" dipilih pada (${nextX}, ${nextY}).`);
            } else {
              if (setSelectedEvent) setSelectedEvent('');
              setMessage(`Koordinat (${nextX}, ${nextY}) dipilih.`);
            }
          }
        } else if (event.key === ' ' || event.key === 'Spacebar') {
          if (selectedEvent) {
            event.preventDefault();
            setModal('eventEditor');
          }
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (selectedEvent) {
            setModal('eventEditor');
          } else if (selectedCell) {
            createEventAt(selectedCell.x, selectedCell.y);
          }
        } else if (event.key === 'Delete' || event.key === 'Del') {
          if (selectedEvent) {
            event.preventDefault();
            removeEvent(selectedEvent);
          }
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') {
          if (selectedEvent && map) {
            event.preventDefault();
            const ev = map.events.find(e => e.id === selectedEvent);
            if (ev) {
              setClipboard(clone(ev));
              removeEvent(ev.id);
              setMessage(`Event "${ev.name}" dipotong.`);
            }
          }
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
          if (selectedEvent && map) {
            event.preventDefault();
            const ev = map.events.find(e => e.id === selectedEvent);
            if (ev) {
              setClipboard(clone(ev));
              setMessage(`Event "${ev.name}" disalin.`);
            }
          }
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
          if (clipboard && selectedCell && map) {
            event.preventDefault();
            let n = 1;
            while (map.events.some(e => e.id === `event.copy-${n}`)) n++;
            const pasted: MapEvent = {
              ...clone(clipboard),
              id: `event.copy-${n}`,
              name: `${clipboard.name} (Copy)`,
              x: selectedCell.x,
              y: selectedCell.y
            };
            commit(
              { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, pasted] } } },
              `Event "${pasted.name}" ditempel pada (${selectedCell.x}, ${selectedCell.y}).`
            );
          }
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
        isShiftHeldRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });
}
