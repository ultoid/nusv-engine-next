import { useState } from 'react';
import { generateDungeonData, shiftMapData, tileDefinition, resolveSheetPath, DEFAULT_TILESETS, TILE_CATALOG } from '../../core/map-layers.js';
import type { MapData, MapEvent, ProjectBundle, TilesetData } from '../../core/types.js';
import { getCachedImage } from '../imageCache.js';

export interface UseMapOperationsParams {
  bundle?: ProjectBundle;
  setBundle: (b: ProjectBundle) => void;
  selectedMap: string;
  chooseMap: (id: string) => void;
  commit: (next: ProjectBundle, status?: string) => void;
  setMessage: (msg: string) => void;
  setModal: (m: any) => void;
  currentTileset: TilesetData;
  assetUrls: Record<string, string>;
  setCellContextMenu: (c: any) => void;
}

export function useMapOperations({
  bundle,
  selectedMap,
  chooseMap,
  commit,
  setMessage,
  setModal,
  currentTileset,
  assetUrls,
  setCellContextMenu
}: UseMapOperationsParams) {
  const [copiedMap, setCopiedMap] = useState<MapData | null>(null);

  // Map Properties Form
  const [mapEditId, setMapEditId] = useState('');
  const [mapEditName, setMapEditName] = useState('');
  const [mapEditDisplayName, setMapEditDisplayName] = useState('');
  const [mapEditWidth, setMapEditWidth] = useState(17);
  const [mapEditHeight, setMapEditHeight] = useState(13);
  const [mapEditScroll, setMapEditScroll] = useState('none');
  const [mapEditBgm, setMapEditBgm] = useState('calm');
  const [mapEditTilesetId, setMapEditTilesetId] = useState('');
  const [mapEditParallaxName, setMapEditParallaxName] = useState('');
  const [mapEditParallaxLoopX, setMapEditParallaxLoopX] = useState(false);
  const [mapEditParallaxLoopY, setMapEditParallaxLoopY] = useState(false);
  const [mapEditParallaxSx, setMapEditParallaxSx] = useState(0);
  const [mapEditParallaxSy, setMapEditParallaxSy] = useState(0);
  const [mapEditBattleback1, setMapEditBattleback1] = useState('');
  const [mapEditBattleback2, setMapEditBattleback2] = useState('');
  const [mapEditEncounterStep, setMapEditEncounterStep] = useState(30);
  const [mapEditDisableDash, setMapEditDisableDash] = useState(false);
  const [mapEditNote, setMapEditNote] = useState('');

  // Sample Maps Form
  const [selectedSampleMap, setSelectedSampleMap] = useState<'village' | 'forest' | 'castle' | 'cave'>('village');

  // Map Shift & Dungeon Form
  const [shiftX, setShiftX] = useState(0);
  const [shiftY, setShiftY] = useState(0);
  const [shiftLoop, setShiftLoop] = useState(false);
  const [dungeonFloor, setDungeonFloor] = useState(3);
  const [dungeonWall, setDungeonWall] = useState(6);
  const [searchEventIndex, setSearchEventIndex] = useState(0);

  // Quick Event Creation Form
  const [quickSourceX, setQuickSourceX] = useState(0);
  const [quickSourceY, setQuickSourceY] = useState(0);
  const [quickTargetMap, setQuickTargetMap] = useState('');
  const [quickTargetX, setQuickTargetX] = useState(0);
  const [quickTargetY, setQuickTargetY] = useState(0);
  const [quickChestType, setQuickChestType] = useState<'gold' | 'item'>('gold');
  const [quickChestAmount, setQuickChestAmount] = useState(100);
  const [quickChestItem, setQuickChestItem] = useState('');
  const [quickInnPrice, setQuickInnPrice] = useState(10);

  const map = bundle?.maps[selectedMap];

  const handleOpenMapProperties = (id: string) => {
    if (!bundle?.maps[id]) return;
    const targetMap = bundle.maps[id];
    setMapEditId(id);
    setMapEditName(targetMap.name);
    setMapEditDisplayName(targetMap.displayName || '');
    setMapEditWidth(targetMap.width);
    setMapEditHeight(targetMap.height);
    setMapEditScroll(targetMap.scrollType || 'none');
    setMapEditBgm(targetMap.bgm || 'calm');
    setMapEditTilesetId(targetMap.tilesetId || '');
    setMapEditParallaxName(String(targetMap.parallaxName || ''));
    setMapEditParallaxLoopX(Boolean(targetMap.parallaxLoopX));
    setMapEditParallaxLoopY(Boolean(targetMap.parallaxLoopY));
    setMapEditParallaxSx(Number(targetMap.parallaxSx || 0));
    setMapEditParallaxSy(Number(targetMap.parallaxSy || 0));
    setMapEditBattleback1(String(targetMap.battleback1Name || ''));
    setMapEditBattleback2(String(targetMap.battleback2Name || ''));
    setMapEditEncounterStep(targetMap.encounterStep ?? 30);
    setMapEditDisableDash(Boolean(targetMap.disableDashing));
    setMapEditNote(targetMap.note || '');
    setModal('mapProperties');
  };

  const handleApplyMapProperties = () => {
    if (!bundle || !mapEditId || !bundle.maps[mapEditId]) return;
    const oldMap = bundle.maps[mapEditId];
    const newWidth = Math.max(5, Math.min(100, mapEditWidth));
    const newHeight = Math.max(5, Math.min(100, mapEditHeight));

    let newLayers = oldMap.layers;
    let newCollision = oldMap.collision;
    let newRegions = oldMap.regions || Array(oldMap.width * oldMap.height).fill(0);

    if (newWidth !== oldMap.width || newHeight !== oldMap.height) {
      newLayers = oldMap.layers.map(layer => {
        const newData = Array(newWidth * newHeight).fill(0);
        for (let y = 0; y < Math.min(oldMap.height, newHeight); y++) {
          for (let x = 0; x < Math.min(oldMap.width, newWidth); x++) {
            newData[y * newWidth + x] = layer.data[y * oldMap.width + x];
          }
        }
        return { ...layer, data: newData };
      });

      newCollision = Array(newWidth * newHeight).fill(0);
      for (let y = 0; y < Math.min(oldMap.height, newHeight); y++) {
        for (let x = 0; x < Math.min(oldMap.width, newWidth); x++) {
          newCollision[y * newWidth + x] = oldMap.collision[y * oldMap.width + x];
        }
      }

      const resizedRegions = Array(newWidth * newHeight).fill(0);
      for (let y = 0; y < Math.min(oldMap.height, newHeight); y++) {
        for (let x = 0; x < Math.min(oldMap.width, newWidth); x++) {
          resizedRegions[y * newWidth + x] = newRegions[y * oldMap.width + x] || 0;
        }
      }
      newRegions = resizedRegions;
    }

    const updatedMap: MapData = {
      ...oldMap,
      name: mapEditName.trim() || oldMap.name,
      displayName: mapEditDisplayName.trim() || undefined,
      width: newWidth,
      height: newHeight,
      scrollType: mapEditScroll as 'none' | 'vertical' | 'horizontal' | 'both',
      bgm: mapEditBgm,
      tilesetId: mapEditTilesetId.trim() || undefined,
      parallaxName: mapEditParallaxName.trim() || undefined,
      parallaxLoopX: mapEditParallaxLoopX || undefined,
      parallaxLoopY: mapEditParallaxLoopY || undefined,
      parallaxSx: mapEditParallaxSx || undefined,
      parallaxSy: mapEditParallaxSy || undefined,
      battleback1Name: mapEditBattleback1.trim() || undefined,
      battleback2Name: mapEditBattleback2.trim() || undefined,
      encounterStep: mapEditEncounterStep || undefined,
      disableDashing: mapEditDisableDash || undefined,
      note: mapEditNote.trim() || undefined,
      layers: newLayers,
      collision: newCollision,
      regions: newRegions
    };

    const next = {
      ...bundle,
      maps: {
        ...bundle.maps,
        [mapEditId]: updatedMap
      }
    };
    commit(next, `Properti peta "${updatedMap.name}" diperbarui.`);
    setModal('none');
  };

  const handleCreateNewMap = () => {
    if (!bundle) return;
    let n = 1;
    while (bundle.project.maps.includes(`map.area-${n}`)) n++;
    const newId = `map.area-${n}`;
    const w = 17, h = 13;
    const baseLayerData = Array(w * h).fill(1);
    const emptyLayerData = Array(w * h).fill(0);
    const newMap: MapData = {
      schemaVersion: 1,
      id: newId,
      name: `Map ${String(bundle.project.maps.length + 1).padStart(3, '0')}`,
      width: w,
      height: h,
      tileSize: 48,
      layers: [
        { id: `${newId}.l1`, type: 'tile', name: 'Layer 1', data: baseLayerData },
        { id: `${newId}.l2`, type: 'tile', name: 'Layer 2', data: [...emptyLayerData] },
        { id: `${newId}.l3`, type: 'tile', name: 'Layer 3', data: [...emptyLayerData] },
        { id: `${newId}.l4`, type: 'tile', name: 'Layer 4', data: [...emptyLayerData] }
      ],
      collision: Array(w * h).fill(0),
      regions: Array(w * h).fill(0),
      events: []
    };
    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        maps: [...bundle.project.maps, newId]
      },
      maps: {
        ...bundle.maps,
        [newId]: newMap
      }
    };
    commit(next, `Peta baru "${newMap.name}" dibuat.`);
    chooseMap(newId);
  };

  const handleCopyMap = (id: string) => {
    if (!bundle?.maps[id]) return;
    setCopiedMap(structuredClone(bundle.maps[id]));
    setMessage(`Peta "${bundle.maps[id].name}" disalin ke clipboard peta.`);
  };

  const handlePasteMap = () => {
    if (!bundle || !copiedMap) return;
    let n = 1;
    while (bundle.project.maps.includes(`${copiedMap.id}-copy-${n}`)) n++;
    const newId = `${copiedMap.id}-copy-${n}`;
    const newMap: MapData = {
      ...structuredClone(copiedMap),
      id: newId,
      name: `${copiedMap.name} (Copy)`,
      layers: copiedMap.layers.map((l, i) => ({
        ...l,
        id: `${newId}.l${i + 1}`
      }))
    };
    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        maps: [...bundle.project.maps, newId]
      },
      maps: {
        ...bundle.maps,
        [newId]: newMap
      }
    };
    commit(next, `Peta "${newMap.name}" berhasil ditempel.`);
    chooseMap(newId);
  };

  const handleDeleteMap = (id: string) => {
    if (!bundle || bundle.project.maps.length <= 1) {
      setMessage('Proyek harus memiliki setidaknya satu peta.');
      return;
    }
    const mapName = bundle.maps[id]?.name || id;
    const remainingMaps = bundle.project.maps.filter(mId => mId !== id);
    const newMapsDict = { ...bundle.maps };
    delete newMapsDict[id];

    let newStart = bundle.project.start;
    if (bundle.project.start.mapId === id) {
      newStart = {
        mapId: remainingMaps[0],
        x: 0,
        y: 0
      };
    }

    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        maps: remainingMaps,
        start: newStart
      },
      maps: newMapsDict
    };
    commit(next, `Peta "${mapName}" dihapus.`);
    chooseMap(remainingMaps[0]);
  };

  const handleShiftMap = (id: string, dx: number, dy: number, loop = false) => {
    if (!bundle?.maps[id]) return;
    const targetMap = bundle.maps[id];
    const shifted = shiftMapData(
      targetMap.layers,
      targetMap.collision,
      targetMap.width,
      targetMap.height,
      dx,
      dy,
      loop,
      targetMap.regions
    );
    const shiftedEvents = targetMap.events.map(ev => ({
      ...ev,
      x: loop ? (ev.x + dx + targetMap.width) % targetMap.width : Math.max(0, Math.min(targetMap.width - 1, ev.x + dx)),
      y: loop ? (ev.y + dy + targetMap.height) % targetMap.height : Math.max(0, Math.min(targetMap.height - 1, ev.y + dy))
    }));
    const shiftedMap: MapData = {
      ...targetMap,
      layers: shifted.layers,
      collision: shifted.collision,
      regions: shifted.regions,
      events: shiftedEvents
    };
    commit({
      ...bundle,
      maps: {
        ...bundle.maps,
        [id]: shiftedMap
      }
    }, `Peta "${targetMap.name}" digeser (${dx}, ${dy}).`);
  };

  const handleOpenShiftModal = (mapId: string) => {
    setShiftX(0);
    setShiftY(0);
    setShiftLoop(false);
    setModal('shiftMap');
  };

  const handleApplyShiftModal = () => {
    if (!selectedMap) return;
    handleShiftMap(selectedMap, shiftX, shiftY, shiftLoop);
    setModal('none');
  };

  const handleOpenGenerateDungeon = () => {
    setDungeonFloor(3);
    setDungeonWall(6);
    setModal('generateDungeon');
  };

  const handleApplyGenerateDungeon = () => {
    if (!bundle || !selectedMap || !bundle.maps[selectedMap]) return;
    const targetMap = bundle.maps[selectedMap];
    const dungeonData = generateDungeonData(targetMap.width, targetMap.height, dungeonWall, dungeonFloor);
    const dungeonMap: MapData = {
      ...targetMap,
      layers: dungeonData.layers,
      collision: dungeonData.collision,
      regions: dungeonData.regions
    };
    commit({
      ...bundle,
      maps: {
        ...bundle.maps,
        [selectedMap]: dungeonMap
      }
    }, `Labirin baru dibuat pada peta "${targetMap.name}".`);
    setModal('none');
  };

  const handleFindNextEvent = () => {
    if (!map || !map.events.length) return;
    const nextIdx = (searchEventIndex + 1) % map.events.length;
    setSearchEventIndex(nextIdx);
    const ev = map.events[nextIdx];
    setMessage(`Event #${nextIdx + 1}/${map.events.length}: "${ev.name}" di (${ev.x}, ${ev.y}).`);
  };

  const handleFindPrevEvent = () => {
    if (!map || !map.events.length) return;
    const prevIdx = (searchEventIndex - 1 + map.events.length) % map.events.length;
    setSearchEventIndex(prevIdx);
    const ev = map.events[prevIdx];
    setMessage(`Event #${prevIdx + 1}/${map.events.length}: "${ev.name}" di (${ev.x}, ${ev.y}).`);
  };

  const handleSaveMapAsImage = (mapId: string) => {
    if (!bundle?.maps[mapId]) return;
    const targetMap = bundle.maps[mapId];
    const offCanvas = document.createElement('canvas');
    offCanvas.width = targetMap.width * 48;
    offCanvas.height = targetMap.height * 48;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.fillStyle = '#1e293b';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    targetMap.layers.forEach(layer => {
      for (let index = 0; index < layer.data.length; index++) {
        const tileId = layer.data[index];
        if (tileId === 0) continue;
        const tile = tileDefinition(tileId, currentTileset);
        if (!tile || tile.id === 0) continue;
        const x = (index % targetMap.width) * 48;
        const y = Math.floor(index / targetMap.width) * 48;
        const imgUrl = tile.tileset ? assetUrls[tile.tileset] : null;
        if (imgUrl) {
          const img = getCachedImage(imgUrl);
          if (img && img.complete && img.naturalWidth > 0) {
            offCtx.drawImage(img, tile.srcX ?? 0, tile.srcY ?? 0, 48, 48, x, y, 48, 48);
          } else {
            offCtx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
            offCtx.fillRect(x, y, 48, 48);
          }
        } else {
          offCtx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
          offCtx.fillRect(x, y, 48, 48);
        }
      }
    });

    const dataUrl = offCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${targetMap.name || targetMap.id}.png`;
    a.click();
    setMessage(`Gambar tangkapan layar peta "${targetMap.name}" disimpan.`);
  };

  const handleApplySampleMap = () => {
    if (!bundle) return;
    let n = 1;
    while (bundle.project.maps.includes(`map.sample-${n}`)) n++;
    const newId = `map.sample-${n}`;
    let w = 20, h = 15, name = 'Plains Village';
    let baseTile = 1, wallTile = 6;
    if (selectedSampleMap === 'forest') {
      w = 24; h = 18; name = 'Forest Sanctuary'; baseTile = 1; wallTile = 2;
    } else if (selectedSampleMap === 'castle') {
      w = 17; h = 13; name = 'Castle Chamber'; baseTile = 3; wallTile = 6;
    } else if (selectedSampleMap === 'cave') {
      w = 20; h = 20; name = 'Deep Cavern'; baseTile = 3; wallTile = 6;
    }

    const baseLayerData = Array(w * h).fill(baseTile);
    const emptyLayerData = Array(w * h).fill(0);
    const newMap: MapData = {
      schemaVersion: 1,
      id: newId,
      name,
      width: w,
      height: h,
      tileSize: 48,
      layers: [
        { id: `${newId}.l1`, type: 'tile', name: 'Layer 1', data: baseLayerData },
        { id: `${newId}.l2`, type: 'tile', name: 'Layer 2', data: [...emptyLayerData] },
        { id: `${newId}.l3`, type: 'tile', name: 'Layer 3', data: [...emptyLayerData] },
        { id: `${newId}.l4`, type: 'tile', name: 'Layer 4', data: [...emptyLayerData] }
      ],
      collision: Array(w * h).fill(0),
      regions: Array(w * h).fill(0),
      events: []
    };

    const next = {
      ...bundle,
      project: { ...bundle.project, maps: [...bundle.project.maps, newId] },
      maps: { ...bundle.maps, [newId]: newMap }
    };
    commit(next, `Sample Map "${newMap.name}" dimuat.`);
    chooseMap(newId);
    setModal('none');
  };

  const handleSetStartingPosition = (x: number, y: number) => {
    if (!bundle || !map) return;
    const next = {
      ...bundle,
      project: { ...bundle.project, start: { mapId: map.id, x, y } }
    };
    commit(next, `Posisi awal pemain diset ke ${map.name} (${x}, ${y}).`);
    setCellContextMenu(null);
  };

  const handleCreateQuickTransfer = () => {
    if (!bundle || !map) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.transfer-${n}`)) n++;
    const newEv: MapEvent = {
      id: `event.transfer-${n}`,
      name: `Transfer to ${quickTargetMap}`,
      x: quickSourceX,
      y: quickSourceY,
      trigger: 'touch',
      pages: [{
        trigger: 'touch',
        solid: false,
        commands: [{ type: 'transfer', mapId: quickTargetMap, x: quickTargetX, y: quickTargetY }]
      }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Transfer dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickDoor = () => {
    if (!bundle || !map) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.door-${n}`)) n++;
    const newEv: MapEvent = {
      id: `event.door-${n}`,
      name: `Door to ${quickTargetMap}`,
      x: quickSourceX,
      y: quickSourceY,
      trigger: 'interact',
      pages: [{
        trigger: 'interact',
        solid: true,
        graphic: { characterName: 'assets/characters/Door1.png', characterIndex: 0, direction: 'down', pattern: 1 },
        commands: [
          { type: 'playSe', path: 'assets/audio/se/Door.ogg' },
          { type: 'wait', frames: 15 },
          { type: 'transfer', mapId: quickTargetMap, x: quickTargetX, y: quickTargetY }
        ]
      }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Door dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickChest = () => {
    if (!bundle || !map) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.chest-${n}`)) n++;
    const newEv: MapEvent = {
      id: `event.chest-${n}`,
      name: `Treasure Chest`,
      x: quickSourceX,
      y: quickSourceY,
      trigger: 'interact',
      pages: [
        {
          trigger: 'interact',
          solid: true,
          graphic: { characterName: 'assets/characters/Chest.png', characterIndex: 0, direction: 'down', pattern: 1 },
          commands: [
            { type: 'playSe', path: 'assets/audio/se/Chest.ogg' },
            ...(quickChestType === 'gold' ? [{ type: 'changeGold', amount: quickChestAmount, operation: 'add' } as const] : [{ type: 'giveItem', itemId: quickChestItem, amount: 1 } as const]),
            { type: 'text', text: quickChestType === 'gold' ? `Ditemukan ${quickChestAmount} Gold!` : `Ditemukan barang!` },
            { type: 'setSelfSwitch', key: 'A', value: true }
          ]
        },
        {
          trigger: 'interact',
          solid: true,
          conditions: { selfSwitchKey: 'A', selfSwitchValue: true },
          graphic: { characterName: 'assets/characters/Chest.png', characterIndex: 0, direction: 'up', pattern: 1 },
          commands: []
        }
      ]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Chest dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickInn = () => {
    if (!bundle || !map) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.inn-${n}`)) n++;
    const newEv: MapEvent = {
      id: `event.inn-${n}`,
      name: `Innkeeper`,
      x: quickSourceX,
      y: quickSourceY,
      trigger: 'interact',
      pages: [{
        trigger: 'interact',
        solid: true,
        commands: [
          { type: 'text', text: `Selamat datang di penginapan! Biaya menginap ${quickInnPrice} G per malam.` },
          {
            type: 'choice',
            prompt: 'Menginap?',
            choices: [
              {
                text: 'Ya',
                commands: [
                  { type: 'inn', price: quickInnPrice },
                  { type: 'fadeoutScreen', duration: 30 },
                  { type: 'playMe', path: 'assets/audio/me/Inn.ogg' },
                  { type: 'wait', frames: 60 },
                  { type: 'fadeinScreen', duration: 30 },
                  { type: 'text', text: 'Kesehatan Anda pulih sepenuhnya.' }
                ]
              },
              { text: 'Tidak', commands: [] }
            ]
          }
        ]
      }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Inn dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  return {
    copiedMap,
    setCopiedMap,
    mapEditName,
    mapEditDisplayName,
    mapEditWidth,
    mapEditHeight,
    mapEditTilesetId,
    mapEditScroll,
    mapEditBgm,
    mapEditParallaxName,
    mapEditParallaxLoopX,
    mapEditParallaxLoopY,
    mapEditParallaxSx,
    mapEditParallaxSy,
    mapEditBattleback1,
    mapEditBattleback2,
    mapEditEncounterStep,
    mapEditDisableDash,
    mapEditNote,
    setMapEditName,
    setMapEditDisplayName,
    setMapEditWidth,
    setMapEditHeight,
    setMapEditTilesetId,
    setMapEditScroll,
    setMapEditBgm,
    setMapEditParallaxName,
    setMapEditParallaxLoopX,
    setMapEditParallaxLoopY,
    setMapEditParallaxSx,
    setMapEditParallaxSy,
    setMapEditBattleback1,
    setMapEditBattleback2,
    setMapEditEncounterStep,
    setMapEditDisableDash,
    setMapEditNote,
    handleOpenMapProperties,
    handleApplyMapProperties,
    handleCreateNewMap,
    handleCopyMap,
    handlePasteMap,
    handleDeleteMap,
    handleShiftMap,
    handleOpenShiftModal,
    handleApplyShiftModal,
    handleOpenGenerateDungeon,
    handleApplyGenerateDungeon,
    handleFindNextEvent,
    handleFindPrevEvent,
    handleSaveMapAsImage,
    selectedSampleMap,
    setSelectedSampleMap,
    handleApplySampleMap,
    handleSetStartingPosition,
    shiftX,
    shiftY,
    shiftLoop,
    setShiftX,
    setShiftY,
    setShiftLoop,
    dungeonFloor,
    dungeonWall,
    setDungeonFloor,
    setDungeonWall,
    quickSourceX,
    setQuickSourceX,
    quickSourceY,
    setQuickSourceY,
    quickTargetMap,
    quickTargetX,
    quickTargetY,
    setQuickTargetMap,
    setQuickTargetX,
    setQuickTargetY,
    handleCreateQuickTransfer,
    handleCreateQuickDoor,
    quickChestType,
    quickChestAmount,
    quickChestItem,
    setQuickChestType,
    setQuickChestAmount,
    setQuickChestItem,
    handleCreateQuickChest,
    quickInnPrice,
    setQuickInnPrice,
    handleCreateQuickInn
  };
}
