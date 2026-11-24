import { useMemo, useState } from 'react';
import type { EventCommand, EventPage, MapEvent, ProjectBundle } from '../../core/types.js';
import { createCommand } from '../events/eventCommands.js';

const clone = <T,>(value: T): T => structuredClone(value);
const eventJson = (event?: MapEvent) => JSON.stringify(event ?? {}, null, 2);

export interface UseEventEditorParams {
  bundle?: ProjectBundle;
  selectedMap: string;
  selectedEvent: string;
  setSelectedEvent: (id: string) => void;
  selectedCell: { x: number; y: number } | null;
  setSelectedCell: (cell: { x: number; y: number } | null) => void;
  commit: (next: ProjectBundle, status?: string) => void;
  setMessage: (msg: string) => void;
  setModal: (m: any) => void;
  setMode: (m: 'map' | 'event') => void;
}

export function useEventEditor({
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
}: UseEventEditorParams) {
  const [eventView, setEventView] = useState<'visual' | 'json'>('visual');
  const [eventPage, setEventPage] = useState(0);
  const [eventDraft, setEventDraft] = useState('{}');
  const [copiedPage, setCopiedPage] = useState<EventPage | null>(null);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState<number | null>(null);
  const [newCommandType, setNewCommandType] = useState<EventCommand['type']>('text');
  const [clipboard, setClipboard] = useState<MapEvent | null>(null);
  const [isCreatingNewEvent, setIsCreatingNewEvent] = useState(false);

  const map = bundle?.maps[selectedMap];

  const characterOptions = useMemo(() => {
    const fromAssets = bundle?.assets?.assets
      ?.filter(a => a.category === 'characters' || a.path.includes('characters/'))
      ?.map(a => a.path) ?? [];
    const defaults = [
      'assets/characters/Actor1.png',
      'assets/characters/Actor2.png',
      'assets/characters/Actor3.png',
      'assets/characters/Hero.png',
      'assets/characters/Door1.png',
      'assets/characters/Chest.png'
    ];
    return Array.from(new Set([...fromAssets, ...defaults]));
  }, [bundle?.assets]);

  const faceOptions = useMemo(() => {
    const fromAssets = bundle?.assets?.assets
      ?.filter(a => a.category === 'faces' || a.path.includes('faces/'))
      ?.map(a => a.path) ?? [];
    const defaults = [
      'assets/faces/Actor1.png',
      'assets/faces/Actor2.png',
      'assets/faces/Actor3.png',
      'assets/faces/Evil.png',
      'assets/faces/Monster.png',
      'assets/faces/Nature.png',
      'assets/faces/People1.png',
      'assets/faces/People2.png',
      'assets/faces/People3.png',
      'assets/faces/People4.png',
      'assets/faces/SF_Actor1.png',
      'assets/faces/SF_Actor2.png',
      'assets/faces/SF_Actor3.png',
      'assets/faces/SF_Monster.png',
      'assets/faces/SF_People1.png'
    ];
    return Array.from(new Set([...fromAssets, ...defaults]));
  }, [bundle?.assets]);

  const parsedEvent = useMemo(() => {
    try {
      const parsed = JSON.parse(eventDraft) as MapEvent;
      if (parsed && typeof parsed === 'object' && parsed.id && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return parsed;
      }
      return map?.events.find(event => event.id === selectedEvent);
    } catch {
      return map?.events.find(event => event.id === selectedEvent);
    }
  }, [eventDraft, map?.events, selectedEvent]);

  const selectEvent = (id: string, nextBundle = bundle) => {
    setSelectedEvent(id);
    const targetMap = nextBundle?.maps[selectedMap];
    setEventDraft(eventJson(targetMap?.events.find(event => event.id === id)));
    setEventPage(0);
    setSelectedCommandIndex(null);
  };

  const createEventAt = (x: number, y: number) => {
    if (!bundle || !map) return;
    let nextIdNum = 1;
    const usedNums = new Set<number>();
    for (const ev of map.events) {
      const match = ev.id.match(/\d+/);
      if (match) usedNums.add(parseInt(match[0], 10));
      const nameMatch = ev.name.match(/EV(\d+)/i);
      if (nameMatch) usedNums.add(parseInt(nameMatch[1], 10));
    }
    while (usedNums.has(nextIdNum)) nextIdNum++;
    const formattedNum = String(nextIdNum).padStart(3, '0');
    const newId = `event.${nextIdNum}`;
    const newName = `EV${formattedNum}`;

    const value: MapEvent = {
      id: newId,
      name: newName,
      x,
      y,
      trigger: 'interact',
      pages: [
        {
          solid: true,
          walkAnime: true,
          priorityType: 'same',
          trigger: 'interact',
          conditions: {},
          commands: []
        }
      ]
    };

    setSelectedEvent(newId);
    setEventDraft(eventJson(value));
    setEventPage(0);
    setSelectedCommandIndex(null);
    setSelectedCell({ x, y });
    setIsCreatingNewEvent(true);
    setModal('eventEditor');
  };

  const cancelEvent = () => {
    if (isCreatingNewEvent) {
      setIsCreatingNewEvent(false);
      setSelectedEvent('');
      setEventDraft('{}');
    } else {
      const orig = map?.events.find(e => e.id === selectedEvent);
      if (orig) setEventDraft(eventJson(orig));
    }
    setModal('none');
  };

  const addEvent = () => {
    if (!bundle || !map) return;
    const targetX = selectedCell ? selectedCell.x : 0;
    const targetY = selectedCell ? selectedCell.y : 0;
    createEventAt(targetX, targetY);
  };

  const applyEvent = () => {
    if (!bundle || !map) return;
    try {
      const parsed = JSON.parse(eventDraft) as MapEvent;
      if (!parsed.id || !Array.isArray(parsed.pages)) throw new Error('Event wajib memiliki id dan pages.');
      const exists = map.events.some(event => event.id === selectedEvent || event.id === parsed.id);
      let events: MapEvent[];
      if (exists) {
        events = map.events.map(event => ((event.id === selectedEvent || event.id === parsed.id) ? parsed : event));
      } else {
        events = [...map.events, parsed];
      }
      commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events } } }, `Event ${parsed.name} disimpan.`);
      setSelectedEvent(parsed.id);
      setIsCreatingNewEvent(false);
    } catch (error) {
      setMessage(`Event rusak: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateEventVisual = (change: (draft: MapEvent) => void) => {
    if (!parsedEvent) return;
    const next = clone(parsedEvent);
    change(next);
    setEventDraft(eventJson(next));
  };

  const getPage = (event: MapEvent, pageIdx = eventPage): EventPage => {
    return event.pages[Math.min(pageIdx, Math.max(0, event.pages.length - 1))];
  };

  const updateCurrentPage = (change: (page: EventPage) => void) => {
    updateEventVisual(draft => {
      const idx = Math.min(eventPage, Math.max(0, draft.pages.length - 1));
      if (draft.pages[idx]) change(draft.pages[idx]);
    });
  };

  const handleNewPage = () => {
    if (!parsedEvent) return;
    updateEventVisual(draft => {
      draft.pages.push({
        solid: true,
        commands: []
      });
    });
    setEventPage(parsedEvent.pages.length);
    setSelectedCommandIndex(null);
  };

  const handleDeletePage = () => {
    if (!parsedEvent || parsedEvent.pages.length <= 1) return;
    updateEventVisual(draft => {
      const idx = Math.min(eventPage, draft.pages.length - 1);
      draft.pages.splice(idx, 1);
    });
    setEventPage(prev => Math.max(0, prev - 1));
    setSelectedCommandIndex(null);
  };

  const handleCopyPage = () => {
    if (!parsedEvent) return;
    const idx = Math.min(eventPage, parsedEvent.pages.length - 1);
    const p = parsedEvent.pages[idx];
    if (p) {
      setCopiedPage(clone(p));
      setMessage(`Halaman ${idx + 1} disalin ke clipboard halaman.`);
    }
  };

  const handlePastePage = () => {
    if (!parsedEvent || !copiedPage) return;
    const insertIdx = Math.min(eventPage, parsedEvent.pages.length - 1) + 1;
    updateEventVisual(draft => {
      draft.pages.splice(insertIdx, 0, clone(copiedPage));
    });
    setEventPage(insertIdx);
    setSelectedCommandIndex(null);
    setMessage(`Halaman ditempel sebagai Halaman ${insertIdx + 1}.`);
  };

  const updateCommand = (index: number, command: EventCommand) =>
    updateCurrentPage(page => {
      page.commands[index] = command;
    });

  const removeCommand = (index: number) =>
    updateCurrentPage(page => {
      page.commands.splice(index, 1);
    });

  const moveCommand = (index: number, direction: -1 | 1) =>
    updateCurrentPage(page => {
      const commands = page.commands;
      const target = index + direction;
      if (target < 0 || target >= commands.length) return;
      [commands[index], commands[target]] = [commands[target], commands[index]];
    });

  const addCommandAt = (index: number, type: EventCommand['type']) => {
    if (!bundle) return;
    updateCurrentPage(page => {
      page.commands.splice(index, 0, createCommand(type, bundle));
    });
  };

  const addCommand = () => {
    if (!bundle || !parsedEvent) return;
    const page = getPage(parsedEvent);
    const insertIdx = selectedCommandIndex !== null && selectedCommandIndex < page.commands.length
      ? selectedCommandIndex + 1
      : page.commands.length;
    addCommandAt(insertIdx, newCommandType);
    setSelectedCommandIndex(insertIdx);
  };

  const copyEvent = async () => {
    const value = map?.events.find(event => event.id === selectedEvent);
    if (!value) return;
    setClipboard(clone(value));
    try {
      await navigator.clipboard.writeText(eventJson(value));
    } catch {
      /* clipboard OS opsional */
    }
    setMessage(`${value.name} disalin ke clipboard event.`);
  };

  const handleCutEvent = async () => {
    if (!bundle || !map || !selectedEvent) return;
    const value = map.events.find(event => event.id === selectedEvent);
    if (!value) return;
    setClipboard(clone(value));
    try {
      await navigator.clipboard.writeText(eventJson(value));
    } catch {
      /* clipboard OS opsional */
    }
    const events = map.events.filter(event => event.id !== selectedEvent);
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events } } }, `${value.name} dipotong ke clipboard.`);
    setSelectedEvent('');
  };

  const removeEvent = (id: string) => {
    if (!bundle || !map || !id) return;
    const value = map.events.find(event => event.id === id);
    if (!value) return;
    const events = map.events.filter(event => event.id !== id);
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events } } }, `${value.name} dihapus.`);
    if (selectedEvent === id) setSelectedEvent('');
  };

  const handleDeleteEvent = () => {
    removeEvent(selectedEvent);
  };

  const moveEvent = (id: string, newX: number, newY: number) => {
    if (!bundle || !map || !id) return;
    const targetEvent = map.events.find(e => e.id === id);
    if (!targetEvent) return;

    const clampedX = Math.max(0, Math.min(map.width - 1, newX));
    const clampedY = Math.max(0, Math.min(map.height - 1, newY));
    if (targetEvent.x === clampedX && targetEvent.y === clampedY) return;

    const otherEvent = map.events.find(e => e.id !== id && e.x === clampedX && e.y === clampedY);
    let events: MapEvent[];
    let statusMsg: string;
    if (otherEvent) {
      events = map.events.map(e => {
        if (e.id === id) return { ...e, x: clampedX, y: clampedY };
        if (e.id === otherEvent.id) return { ...e, x: targetEvent.x, y: targetEvent.y };
        return e;
      });
      statusMsg = `Event "${targetEvent.name}" dan "${otherEvent.name}" ditukar posisinya.`;
    } else {
      events = map.events.map(e => (e.id === id ? { ...e, x: clampedX, y: clampedY } : e));
      statusMsg = `Event "${targetEvent.name}" dipindahkan ke (${clampedX}, ${clampedY}).`;
    }

    const next = { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events } } };
    commit(next, statusMsg);
    setSelectedCell({ x: clampedX, y: clampedY });
    selectEvent(id, next);
  };

  const nudgeEvent = (id: string, dx: number, dy: number) => {
    if (!map || !id) return;
    const ev = map.events.find(e => e.id === id);
    if (!ev) return;
    moveEvent(id, ev.x + dx, ev.y + dy);
  };

  const pasteEvent = () => {
    if (!bundle || !map || !clipboard) return;
    let n = 1;
    while (map.events.some(event => event.id === `${clipboard.id}-copy-${n}`)) n++;
    const index = map.collision.findIndex(
      (cell, i) => cell === 0 && !map.events.some(event => event.x === i % map.width && event.y === Math.floor(i / map.width))
    );
    if (index < 0) return setMessage('Tidak ada tile kosong untuk event salinan.');
    const value = {
      ...clone(clipboard),
      id: `${clipboard.id}-copy-${n}`,
      name: `${clipboard.name} Copy`,
      x: index % map.width,
      y: Math.floor(index / map.width)
    };
    const next = { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, value] } } };
    commit(next, 'Event ditempel dengan ID baru.');
    selectEvent(value.id, next);
    setMode('event');
  };

  return {
    eventView,
    setEventView,
    eventPage,
    setEventPage,
    eventDraft,
    setEventDraft,
    copiedPage,
    setCopiedPage,
    selectedCommandIndex,
    setSelectedCommandIndex,
    newCommandType,
    setNewCommandType,
    clipboard,
    setClipboard,
    characterOptions,
    faceOptions,
    parsedEvent,
    selectEvent,
    createEventAt,
    cancelEvent,
    isCreatingNewEvent,
    addEvent,
    applyEvent,
    updateEventVisual,
    getPage,
    updateCurrentPage,
    handleNewPage,
    handleDeletePage,
    handleCopyPage,
    handlePastePage,
    updateCommand,
    removeCommand,
    moveCommand,
    addCommandAt,
    addCommand,
    copyEvent,
    handleCutEvent,
    removeEvent,
    handleDeleteEvent,
    moveEvent,
    nudgeEvent,
    pasteEvent
  };
}
