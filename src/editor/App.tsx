import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeBundle, findReferences } from '../core/diagnostics.js';
import { autotileMask, floodFillLayer, generateDungeonData, getAutotileQuadrants, getTileCoordinates, layerForTile, paintLayerCell, paintLayerCircle, paintLayerRectangle, shiftMapData, TILE_CATALOG, TILE_MAP, DEFAULT_TILESETS, getPaletteTiles, resolveSheetPath, tileDefinition, type LayerSelection, type TileDefinition } from '../core/map-layers.js';
import type { EventCommand, MapData, MapEvent, ProjectBundle, TilesetData } from '../core/types.js';
import type { ImportReport, RecentProject } from '../global.js';
import { MZIcons } from './MZIcons.js';
import { DatabaseView, DATABASE_COLLECTIONS, type DatabaseCollection } from './DatabaseView.js';
import { ResourceManagerModal } from './ResourceManagerModal.js';
import { getCachedImage, preloadImages } from './imageCache.js';

type Collection = DatabaseCollection;
type EditorMode = 'map' | 'event' | 'search';
type MapTool = 'pencil' | 'rectangle' | 'circle' | 'eraser' | 'fill' | 'collision' | 'shadow' | 'event';

const collections: Collection[] = ['actors', 'classes', 'skills', 'items', 'equipment', 'enemies', 'troops', 'states', 'quests', 'shops', 'system'];
const clone = <T,>(value: T): T => structuredClone(value);
const eventJson = (event?: MapEvent) => JSON.stringify(event ?? {}, null, 2);
const collectionLabel = (name: Collection) => name.charAt(0).toUpperCase() + name.slice(1);
const commandTypes:EventCommand['type'][]=['text','choice','setSwitch','setVariable','giveItem','transfer','battle','questStart','questAdvance','questComplete','shop','inn','cutscene','music'];
const commandName:Record<EventCommand['type'],string>={text:'Show Text',choice:'Show Choices',setSwitch:'Control Switch',setVariable:'Control Variable',giveItem:'Give Item',transfer:'Transfer Player',battle:'Start Battle',questStart:'Start Quest',questAdvance:'Advance Quest',questComplete:'Complete Quest',shop:'Open Shop',inn:'Open Inn',cutscene:'Cutscene',music:'Change Music'};
const commandPreview=(command:EventCommand):string=>{
  if(command.type==='text')return `"${command.text}"`;
  if(command.type==='choice')return command.prompt;
  if(command.type==='setSwitch')return `${command.id} = ${command.value ? 'ON' : 'OFF'}`;
  if(command.type==='setVariable')return `${command.id} = ${command.value}`;
  if(command.type==='giveItem')return `${command.amount}× ${command.itemId}`;
  if(command.type==='transfer')return `${command.mapId} (${command.x}, ${command.y})`;
  if(command.type==='battle')return command.troopId;
  if(command.type==='questStart')return command.questId;
  if(command.type==='questAdvance')return `${command.questId} · ${command.objectiveId} +${command.amount}`;
  if(command.type==='questComplete')return command.questId;
  if(command.type==='shop')return command.shopId;
  if(command.type==='inn')return `${command.price} G`;
  if(command.type==='cutscene')return command.lines.join(' · ');
  if(command.type==='music')return command.mood;
  return '';
};

function createCommand(type:EventCommand['type'],bundle:ProjectBundle):EventCommand{
  if(type==='text')return{type,text:'New dialogue.'};
  if(type==='choice')return{type,prompt:'Choose:',choices:[{text:'Yes',commands:[]},{text:'No',commands:[]}]};
  if(type==='setSwitch')return{type,id:'story.flag',value:true};
  if(type==='setVariable')return{type,id:'story.step',value:1};
  if(type==='giveItem')return{type,itemId:bundle.game.items[0]?.id??'item.missing',amount:1};
  if(type==='transfer')return{type,mapId:bundle.project.start.mapId,x:bundle.project.start.x,y:bundle.project.start.y};
  if(type==='battle')return{type,troopId:bundle.game.troops[0]?.id??'troop.missing'};
  if(type==='questStart')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing'};
  if(type==='questAdvance')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing',objectiveId:bundle.game.quests?.[0]?.objectives[0]?.id??'objective.missing',amount:1};
  if(type==='questComplete')return{type,questId:bundle.game.quests?.[0]?.id??'quest.missing'};
  if(type==='shop')return{type,shopId:bundle.game.shops?.[0]?.id??'shop.missing'};
  if(type==='inn')return{type,price:10};
  if(type==='cutscene')return{type,lines:['New cutscene line.']};
  return{type:'music',mood:'calm'};
}

interface ToolButtonProps {
  icon?: React.ReactNode;
  glyph?: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, glyph, label, active, disabled, primary, onClick }: ToolButtonProps) {
  return (
    <button
      className={`mv-tool ${active ? 'active' : ''} ${primary ? 'play' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true" className="mz-icon-container">{icon ?? glyph}</span>
    </button>
  );
}

function CommandFields({command,bundle,onChange}:{command:EventCommand;bundle:ProjectBundle;onChange:(command:EventCommand)=>void}){
  if(command.type==='text')return <label>Dialogue<textarea value={command.text} onChange={event=>onChange({...command,text:event.target.value})}/></label>;
  if(command.type==='choice')return <><label>Prompt<input value={command.prompt} onChange={event=>onChange({...command,prompt:event.target.value})}/></label><label>Choices, one per line<textarea value={command.choices.map(choice=>choice.text).join('\n')} onChange={event=>{const labels=event.target.value.split('\n');onChange({...command,choices:labels.map((text,index)=>({text,commands:command.choices[index]?.commands??[]}))});}}/></label></>;
  if(command.type==='setSwitch')return <><label>Switch ID<input value={command.id} onChange={event=>onChange({...command,id:event.target.value})}/></label><label>Value<select value={String(command.value)} onChange={event=>onChange({...command,value:event.target.value==='true'})}><option value="true">ON</option><option value="false">OFF</option></select></label></>;
  if(command.type==='setVariable')return <><label>Variable ID<input value={command.id} onChange={event=>onChange({...command,id:event.target.value})}/></label><label>Value<input type="number" value={command.value} onChange={event=>onChange({...command,value:Number(event.target.value)})}/></label></>;
  if(command.type==='giveItem')return <><label>Item<select value={command.itemId} onChange={event=>onChange({...command,itemId:event.target.value})}>{bundle.game.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Amount<input type="number" min="1" value={command.amount} onChange={event=>onChange({...command,amount:Number(event.target.value)})}/></label></>;
  if(command.type==='transfer')return <><label>Map<select value={command.mapId} onChange={event=>onChange({...command,mapId:event.target.value})}>{bundle.project.maps.map(id=><option key={id} value={id}>{bundle.maps[id].name}</option>)}</select></label><label>X<input type="number" min="0" value={command.x} onChange={event=>onChange({...command,x:Number(event.target.value)})}/></label><label>Y<input type="number" min="0" value={command.y} onChange={event=>onChange({...command,y:Number(event.target.value)})}/></label></>;
  if(command.type==='battle')return <><label>Troop<select value={command.troopId} onChange={event=>onChange({...command,troopId:event.target.value})}>{bundle.game.troops.map(troop=><option key={troop.id} value={troop.id}>{troop.name}</option>)}</select></label><label>Victory switch<input value={command.victorySwitchId??''} placeholder="Optional" onChange={event=>onChange({...command,victorySwitchId:event.target.value||undefined})}/></label></>;
  if(command.type==='questStart'||command.type==='questComplete')return <label>Quest<select value={command.questId} onChange={event=>onChange({...command,questId:event.target.value})}>{(bundle.game.quests??[]).map(quest=><option key={quest.id} value={quest.id}>{quest.name}</option>)}</select></label>;
  if(command.type==='questAdvance')return <><label>Quest<select value={command.questId} onChange={event=>{const quest=bundle.game.quests?.find(item=>item.id===event.target.value);onChange({...command,questId:event.target.value,objectiveId:quest?.objectives[0]?.id??command.objectiveId});}}>{(bundle.game.quests??[]).map(quest=><option key={quest.id} value={quest.id}>{quest.name}</option>)}</select></label><label>Objective<select value={command.objectiveId} onChange={event=>onChange({...command,objectiveId:event.target.value})}>{(bundle.game.quests?.find(quest=>quest.id===command.questId)?.objectives??[]).map(objective=><option key={objective.id} value={objective.id}>{objective.text}</option>)}</select></label><label>Amount<input type="number" min="1" value={command.amount} onChange={event=>onChange({...command,amount:Number(event.target.value)})}/></label></>;
  if(command.type==='shop')return <label>Shop<select value={command.shopId} onChange={event=>onChange({...command,shopId:event.target.value})}>{(bundle.game.shops??[]).map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>;
  if(command.type==='inn')return <label>Price<input type="number" min="0" value={command.price} onChange={event=>onChange({...command,price:Number(event.target.value)})}/></label>;
  if(command.type==='cutscene')return <><label>Lines, one per line<textarea value={command.lines.join('\n')} onChange={event=>onChange({...command,lines:event.target.value.split('\n')})}/></label><label>VFX<select value={command.vfx??''} onChange={event=>onChange({...command,vfx:(event.target.value||undefined) as 'flash'|'shake'|undefined})}><option value="">None</option><option value="flash">Flash</option><option value="shake">Shake</option></select></label></>;
  return <label>Music mood<select value={command.mood} onChange={event=>onChange({...command,mood:event.target.value as typeof command.mood})}><option value="calm">Calm</option><option value="danger">Danger</option><option value="boss">Boss</option><option value="silence">Silence</option></select></label>;
}

interface MapPaletteCanvasProps {
  paletteGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'R';
  paletteTiles: TileDefinition[];
  selectedTile: number;
  onSelectTile: (tileId: number) => void;
  activeSheetUrl?: string;
  assetUrls: Record<string, string>;
}

function MapPaletteCanvas({
  paletteGroup,
  paletteTiles,
  selectedTile,
  onSelectTile,
  activeSheetUrl,
  assetUrls
}: MapPaletteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  const rowCount = Math.max(8, Math.ceil(paletteTiles.length / 8));
  const canvasWidth = 256;
  const canvasHeight = rowCount * 32;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Background
    ctx.fillStyle = '#8b95a2';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw tiles
    if (paletteGroup === 'B' || paletteGroup === 'C' || paletteGroup === 'D' || paletteGroup === 'E') {
      if (activeSheetUrl) {
        const img = getCachedImage(activeSheetUrl, () => setRenderTick(t => t + 1));
        if (img && img.complete && img.naturalWidth > 0) {
          // Upper 16 rows (left 8 cols of 768x768 sheet)
          ctx.drawImage(img, 0, 0, 384, 768, 0, 0, 256, 512);
          // Lower 16 rows (right 8 cols of 768x768 sheet)
          ctx.drawImage(img, 384, 0, 384, 768, 0, 512, 256, 512);
        }
      }
      if (paletteGroup === 'B') {
        // Tile 0 clear / eraser
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⌫', 16, 16);
      }
    } else if (paletteGroup === 'R') {
      paletteTiles.forEach((tile, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const dx = col * 32;
        const dy = row * 32;
        ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.glyph || String(tile.id), dx + 16, dy + 16);
      });
    } else {
      paletteTiles.forEach((tile, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const dx = col * 32;
        const dy = row * 32;
        const imgUrl = tile.tileset ? assetUrls[tile.tileset] : null;
        if (imgUrl) {
          const img = getCachedImage(imgUrl, () => setRenderTick(t => t + 1));
          if (img && img.complete && img.naturalWidth > 0) {
            const pSrcX = tile.paletteSrcX ?? tile.srcX ?? 0;
            const pSrcY = tile.paletteSrcY ?? tile.srcY ?? 0;
            ctx.drawImage(img, pSrcX, pSrcY, 48, 48, dx, dy, 32, 32);
          } else {
            ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(dx, dy, 32, 32);
          }
        } else {
          ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(dx, dy, 32, 32);
          if (tile.glyph) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.glyph, dx + 16, dy + 16);
          }
        }
      });
    }

    // 3. Grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= 8; c++) {
      ctx.moveTo(c * 32 + 0.5, 0);
      ctx.lineTo(c * 32 + 0.5, canvasHeight);
    }
    for (let r = 0; r <= rowCount; r++) {
      ctx.moveTo(0, r * 32 + 0.5);
      ctx.lineTo(canvasWidth, r * 32 + 0.5);
    }
    ctx.stroke();

    // 4. Hover tile outline
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < paletteTiles.length) {
      const hCol = hoverIdx % 8;
      const hRow = Math.floor(hoverIdx / 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hCol * 32 + 0.5, hRow * 32 + 0.5, 31, 31);
    }

    // 5. Selected tile outline
    const selIdx = paletteTiles.findIndex(t => t.id === selectedTile);
    if (selIdx !== -1) {
      const sCol = selIdx % 8;
      const sRow = Math.floor(selIdx / 8);
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(sCol * 32 + 1, sRow * 32 + 1, 30, 30);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(sCol * 32 + 3, sRow * 32 + 3, 26, 26);
    }
  }, [paletteGroup, paletteTiles, selectedTile, activeSheetUrl, assetUrls, hoverIdx, renderTick, rowCount, canvasHeight]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / 32);
    const row = Math.floor(y / 32);
    if (col >= 0 && col < 8 && row >= 0 && row < rowCount) {
      const idx = row * 8 + col;
      if (idx < paletteTiles.length) {
        if (hoverIdx !== idx) setHoverIdx(idx);
        return;
      }
    }
    if (hoverIdx !== null) setHoverIdx(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / 32);
    const row = Math.floor(y / 32);
    if (col >= 0 && col < 8 && row >= 0 && row < rowCount) {
      const idx = row * 8 + col;
      const tile = paletteTiles[idx];
      if (tile) {
        onSelectTile(tile.id);
      }
    }
  };

  const hoverTile = hoverIdx !== null ? paletteTiles[hoverIdx] : null;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="mv-palette-canvas"
      style={{ display: 'block', margin: '0 auto', imageRendering: 'pixelated', cursor: 'pointer' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      onClick={handleClick}
      title={hoverTile ? `${hoverTile.name} · Auto Layer ${hoverTile.defaultLayer + 1}` : undefined}
    />
  );
}

export function App() {
  const api = window.nusvEditor;
  const [bundle, setBundle] = useState<ProjectBundle>();
  const [past, setPast] = useState<ProjectBundle[]>([]);
  const [future, setFuture] = useState<ProjectBundle[]>([]);
  const [selectedMap, setSelectedMap] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [collection, setCollection] = useState<Collection>('actors');
  const [mode, setMode] = useState<EditorMode>('map');
  const [mapTool, setMapTool] = useState<MapTool>('pencil');
  const [activeLayer, setActiveLayer] = useState<LayerSelection>('auto');
  const [selectedTile, setSelectedTile] = useState(1);
  const [visibleLayers, setVisibleLayers] = useState([true, true, true, true]);
  const [lockedLayers, setLockedLayers] = useState([false, false, false, false]);
  const [paletteGroup, setPaletteGroup] = useState<'A'|'B'|'C'|'D'|'E'|'R'>('A');
  const [rectangleStart, setRectangleStart] = useState<{x:number;y:number}|null>(null);
  const [eventView, setEventView] = useState<'visual'|'json'>('visual');
  const [eventPage, setEventPage] = useState(0);
  const [newCommandType, setNewCommandType] = useState<EventCommand['type']>('text');
  const [zoom, setZoom] = useState(100);
  const [showInspector, setShowInspector] = useState(false);
  const [eventDraft, setEventDraft] = useState('{}');
  const [dataDraft, setDataDraft] = useState('[]');
  const [query, setQuery] = useState('');
  const [clipboard, setClipboard] = useState<MapEvent>();
  const [selectedCommandIndex, setSelectedCommandIndex] = useState<number | null>(null);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
  const [recordView, setRecordView] = useState<'form'|'json'>('form');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Buat proyek baru atau buka proyek NUSV.');
  const [report, setReport] = useState<ImportReport>();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [modal, setModal] = useState<
    'none' | 'newProject' | 'projectSettings' | 'unsavedConfirm' | 'eventEditor' | 'mapProperties' |
    'shiftMap' | 'generateDungeon' | 'soundTest' | 'resourceManager' | 'database' | 'quickTransfer' | 'quickDoor' | 'quickChest' | 'quickInn' | 'toolPlaceholder'
  >('none');
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [mapContextMenu, setMapContextMenu] = useState<{ x: number; y: number; mapId: string } | null>(null);
  const [cellContextMenu, setCellContextMenu] = useState<{ x: number; y: number; cellX: number; cellY: number; marker?: MapEvent } | null>(null);
  const [copiedMap, setCopiedMap] = useState<MapData | null>(null);
  const [placeholderTitle, setPlaceholderTitle] = useState('');
  const [placeholderDesc, setPlaceholderDesc] = useState('');
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!api?.readAssetData || !bundle) return;
    const pathsToLoad = [
      'assets/tilesets/World_A1.png',
      'assets/tilesets/World_A2.png',
      'assets/tilesets/World_B.png',
      'assets/tilesets/World_C.png',
      'assets/tilesets/Outside_A1.png',
      'assets/tilesets/Outside_A2.png',
      'assets/tilesets/Outside_A3.png',
      'assets/tilesets/Outside_A4.png',
      'assets/tilesets/Outside_A5.png',
      'assets/tilesets/Outside_B.png',
      'assets/tilesets/Outside_C.png',
      'assets/tilesets/Inside_A1.png',
      'assets/tilesets/Inside_A2.png',
      'assets/tilesets/Inside_B.png',
      'assets/tilesets/Dungeon_A1.png',
      'assets/tilesets/Dungeon_A2.png',
      'assets/tilesets/Dungeon_B.png',
      'assets/characters/Actor1.png',
      'assets/characters/Actor2.png',
      'assets/characters/Actor3.png',
      'assets/characters/Door1.png',
      'assets/characters/Chest.png',
      'assets/characters/Vehicle.png',
      'assets/system/IconSet.png'
    ];

    const allTilesets = [
      ...(Array.isArray(bundle.game.tilesets) ? bundle.game.tilesets : []),
      ...DEFAULT_TILESETS
    ];
    for (const ts of allTilesets) {
      if (Array.isArray(ts.tilesetNames)) {
        for (const name of ts.tilesetNames) {
          if (name) {
            const p = resolveSheetPath(name);
            if (p && !pathsToLoad.includes(p)) pathsToLoad.push(p);
          }
        }
      }
    }

    const manifestAssets = bundle.assets?.assets || [];
    for (const asset of manifestAssets) {
      if (asset.category === 'tilesets' || asset.path.includes('/tilesets/')) {
        if (!pathsToLoad.includes(asset.path)) pathsToLoad.push(asset.path);
      }
    }

    for (const p of pathsToLoad) {
      if (assetUrls[p]) continue;
      void api.readAssetData(p).then(res => {
        if (res?.dataUrl) {
          setAssetUrls(prev => prev[p] ? prev : ({ ...prev, [p]: res.dataUrl }));
          getCachedImage(res.dataUrl);
        }
      });
    }
  }, [bundle, api]);

  useEffect(() => {
    preloadImages(Object.values(assetUrls));
  }, [assetUrls]);

  // Map Shift & Dungeon Form
  const [shiftX, setShiftX] = useState(0);
  const [shiftY, setShiftY] = useState(0);
  const [shiftLoop, setShiftLoop] = useState(true);
  const [dungeonWall, setDungeonWall] = useState(6);
  const [dungeonFloor, setDungeonFloor] = useState(3);

  // Quick Event Creation Form
  const [quickTargetMap, setQuickTargetMap] = useState('');
  const [quickTargetX, setQuickTargetX] = useState(0);
  const [quickTargetY, setQuickTargetY] = useState(0);
  const [quickChestType, setQuickChestType] = useState<'gold' | 'item'>('gold');
  const [quickChestAmount, setQuickChestAmount] = useState(100);
  const [quickChestItem, setQuickChestItem] = useState('');
  const [quickInnPrice, setQuickInnPrice] = useState(10);

  // Sound Test Form
  const [soundCategory, setSoundCategory] = useState<'bgm' | 'me' | 'se'>('se');
  const [soundSelected, setSoundSelected] = useState('Decision');

  const playSoundEffect = (name: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (name === 'Decision' || name === 'Cursor') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (name === 'Cancel') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (name === 'Buzzer') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (name === 'Chest' || name === 'Open') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(554, now + 0.16);
        osc.frequency.setValueAtTime(659, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (name === 'Door') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (name === 'Attack') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (name === 'Hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (name === 'Jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (name === 'Recovery') {
        osc.type = 'triangle';
        [523, 659, 784, 1046].forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.08);
        });
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (name === 'Victory' || name === 'LevelUp') {
        osc.type = 'triangle';
        [440, 554, 659, 880].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
        });
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (name === 'Defeat') {
        osc.type = 'sawtooth';
        [392, 370, 349, 311].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
        });
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
      } else {
        osc.type = 'sine';
        const freqs = name === 'Battle' ? [220, 261, 329, 392] : name === 'Dungeon' ? [130, 155, 174, 196] : [261, 329, 392, 523];
        freqs.forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.18);
        });
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch {
      // Audio fallback
    }
  };

  // Map Properties Form
  const [mapEditId, setMapEditId] = useState('');
  const [mapEditName, setMapEditName] = useState('');
  const [mapEditWidth, setMapEditWidth] = useState(17);
  const [mapEditHeight, setMapEditHeight] = useState(13);
  const [mapEditScroll, setMapEditScroll] = useState('none');
  const [mapEditBgm, setMapEditBgm] = useState('calm');
  const [mapEditTilesetId, setMapEditTilesetId] = useState('');

  // New Project Form
  const [newTitle, setNewTitle] = useState('My RPG Game');
  const [newFolder, setNewFolder] = useState('my-rpg-game');
  const [newLocation, setNewLocation] = useState('');
  const [isFolderCustom, setIsFolderCustom] = useState(false);

  // Project Settings Form
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsResWidth, setSettingsResWidth] = useState(1080);
  const [settingsResHeight, setSettingsResHeight] = useState(720);
  const [settingsStartMap, setSettingsStartMap] = useState('');
  const [settingsStartX, setSettingsStartX] = useState(0);
  const [settingsStartY, setSettingsStartY] = useState(0);
  const [settingsParty, setSettingsParty] = useState<string[]>([]);

  // Unsaved Guard
  const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);
  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');
  const [pendingActionLabel, setPendingActionLabel] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasTick, setCanvasTick] = useState(0);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  const refreshRecent = () => {
    if (api?.getRecentProjects) {
      api.getRecentProjects().then(items => {
        if (Array.isArray(items)) setRecentProjects(items);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    refreshRecent();
    if (api?.getDefaultDirectory) {
      api.getDefaultDirectory().then(dir => {
        if (dir) setDefaultLocation(dir);
      }).catch(() => {});
    }
  }, []);

  const guardDirty = (action: () => Promise<void> | void, label: string) => {
    if (dirty) {
      setPendingAction(() => action);
      setPendingActionLabel(label);
      setModal('unsavedConfirm');
    } else {
      void action();
    }
  };

  const openNewProjectModal = async () => {
    setNewTitle('My RPG Game');
    setNewFolder('my-rpg-game');
    let loc = defaultLocation;
    if (!loc && api?.getDefaultDirectory) {
      try {
        loc = await api.getDefaultDirectory();
        setDefaultLocation(loc);
      } catch {
        // ignore
      }
    }
    setNewLocation(loc || '');
    setIsFolderCustom(false);
    setModal('newProject');
  };

  useEffect(() => {
    const handleCloseContextMenu = () => {
      setMapContextMenu(null);
      setCellContextMenu(null);
    };
    window.addEventListener('click', handleCloseContextMenu);
    return () => window.removeEventListener('click', handleCloseContextMenu);
  }, []);

  const openToolPlaceholder = (title: string, desc: string) => {
    setPlaceholderTitle(title);
    setPlaceholderDesc(desc);
    setModal('toolPlaceholder');
  };

  const handleOpenMapProperties = (id: string) => {
    if (!bundle?.maps[id]) return;
    const target = bundle.maps[id];
    setMapEditId(id);
    setMapEditName(target.name);
    setMapEditWidth(target.width);
    setMapEditHeight(target.height);
    setMapEditScroll(String(target.scrollType || 'none'));
    setMapEditBgm(String(target.bgm || 'calm'));
    setMapEditTilesetId(target.tilesetId ? String(target.tilesetId) : '');
    setModal('mapProperties');
  };

  const handleApplyMapProperties = () => {
    if (!bundle || !bundle.maps[mapEditId]) return;
    const current = bundle.maps[mapEditId];
    const newWidth = Math.max(5, Math.min(100, mapEditWidth));
    const newHeight = Math.max(5, Math.min(100, mapEditHeight));
    let nextLayers = current.layers;
    let nextCollision = current.collision;

    if (newWidth !== current.width || newHeight !== current.height) {
      nextLayers = current.layers.map(layer => {
        const newData = Array(newWidth * newHeight).fill(0);
        for (let y = 0; y < Math.min(current.height, newHeight); y++) {
          for (let x = 0; x < Math.min(current.width, newWidth); x++) {
            newData[y * newWidth + x] = layer.data[y * current.width + x] || 0;
          }
        }
        return { ...layer, data: newData };
      });
      const newColl = Array(newWidth * newHeight).fill(0) as (0 | 1)[];
      for (let y = 0; y < Math.min(current.height, newHeight); y++) {
        for (let x = 0; x < Math.min(current.width, newWidth); x++) {
          newColl[y * newWidth + x] = current.collision[y * current.width + x] || 0;
        }
      }
      nextCollision = newColl;
    }

    const updated: MapData = {
      ...current,
      name: mapEditName.trim() || current.name,
      width: newWidth,
      height: newHeight,
      scrollType: mapEditScroll,
      bgm: mapEditBgm,
      tilesetId: mapEditTilesetId || undefined,
      layers: nextLayers,
      collision: nextCollision
    };
    commit({ ...bundle, maps: { ...bundle.maps, [mapEditId]: updated } }, `Properti peta "${updated.name}" diperbarui.`);
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
    setCopiedMap(clone(bundle.maps[id]));
    setMessage(`Peta "${bundle.maps[id].name}" disalin ke clipboard peta.`);
  };

  const handlePasteMap = () => {
    if (!bundle || !copiedMap) return;
    let n = 1;
    while (bundle.project.maps.includes(`${copiedMap.id}-copy-${n}`)) n++;
    const newId = `${copiedMap.id}-copy-${n}`;
    const pasted: MapData = {
      ...clone(copiedMap),
      id: newId,
      name: `${copiedMap.name} (Copy)`
    };
    const next = {
      ...bundle,
      project: {
        ...bundle.project,
        maps: [...bundle.project.maps, newId]
      },
      maps: {
        ...bundle.maps,
        [newId]: pasted
      }
    };
    commit(next, `Salinan peta "${pasted.name}" ditempel.`);
    chooseMap(newId);
  };

  const handleDeleteMap = (id: string) => {
    if (!bundle) return;
    if (bundle.project.maps.length <= 1) {
      return setMessage('Tidak dapat menghapus peta terakhir dalam proyek.');
    }
    const remainingMaps = bundle.project.maps.filter(m => m !== id);
    const remainingMapRecords = { ...bundle.maps };
    delete remainingMapRecords[id];
    const next = {
      ...bundle,
      project: { ...bundle.project, maps: remainingMaps },
      maps: remainingMapRecords
    };
    commit(next, `Peta "${bundle.maps[id]?.name || id}" dihapus.`);
    if (selectedMap === id) {
      chooseMap(remainingMaps[0]);
    }
  };

  const handleShiftMap = (id: string, dx: number, dy: number) => {
    if (!bundle?.maps[id]) return;
    const current = bundle.maps[id];
    const { width, height } = current;
    const nextLayers = current.layers.map(layer => {
      const nextData = Array(width * height).fill(0);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const nx = (x + dx + width) % width;
          const ny = (y + dy + height) % height;
          nextData[ny * width + nx] = layer.data[y * width + x];
        }
      }
      return { ...layer, data: nextData };
    });
    const nextColl = Array(width * height).fill(0) as (0 | 1)[];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x + dx + width) % width;
        const ny = (y + dy + height) % height;
        nextColl[ny * width + nx] = current.collision[y * width + x];
      }
    }
    const nextEvents = current.events.map(ev => ({
      ...ev,
      x: (ev.x + dx + width) % width,
      y: (ev.y + dy + height) % height
    }));
    const updated: MapData = { ...current, layers: nextLayers, collision: nextColl, events: nextEvents };
    commit({ ...bundle, maps: { ...bundle.maps, [id]: updated } }, `Peta "${current.name}" digeser (${dx}, ${dy}).`);
  };

  const handleOpenShiftModal = (mapId: string) => {
    setMapEditId(mapId);
    setShiftX(0);
    setShiftY(0);
    setShiftLoop(true);
    setModal('shiftMap');
  };

  const handleApplyShiftModal = () => {
    if (!bundle || !bundle.maps[mapEditId]) return;
    const current = bundle.maps[mapEditId];
    const { layers, collision } = shiftMapData(current.layers, current.collision, current.width, current.height, shiftX, shiftY, shiftLoop);
    const events = current.events.map(ev => ({
      ...ev,
      x: shiftLoop ? ((ev.x + shiftX) % current.width + current.width) % current.width : Math.max(0, Math.min(current.width - 1, ev.x + shiftX)),
      y: shiftLoop ? ((ev.y + shiftY) % current.height + current.height) % current.height : Math.max(0, Math.min(current.height - 1, ev.y + shiftY))
    }));
    commit({ ...bundle, maps: { ...bundle.maps, [mapEditId]: { ...current, layers, collision, events } } }, `Peta "${current.name}" digeser.`);
    setModal('none');
  };

  const handleOpenGenerateDungeon = () => {
    setDungeonWall(6);
    setDungeonFloor(3);
    setModal('generateDungeon');
  };

  const handleApplyGenerateDungeon = () => {
    if (!bundle || !map) return;
    const { layers, collision } = generateDungeonData(map.width, map.height, dungeonWall, dungeonFloor);
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, layers, collision } } }, `Dungeon dihasilkan untuk peta "${map.name}".`);
    setModal('none');
  };

  const handleSetStartingPosition = (x: number, y: number) => {
    if (!bundle || !map) return;
    const next = { ...bundle, project: { ...bundle.project, start: { mapId: map.id, x, y } } };
    commit(next, `Starting Position Player diatur ke (${x}, ${y}) pada "${map.name}".`);
    setCellContextMenu(null);
  };

  const handleCreateQuickTransfer = () => {
    if (!bundle || !map || !selectedCell) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.transfer-${n}`)) n++;
    const targetMap = quickTargetMap || bundle.project.maps[0];
    const newEv: MapEvent = {
      id: `event.transfer-${n}`,
      name: `Transfer: ${bundle.maps[targetMap]?.name || targetMap}`,
      x: selectedCell.x,
      y: selectedCell.y,
      trigger: 'touch',
      pages: [{ solid: false, commands: [{ type: 'transfer', mapId: targetMap, x: quickTargetX, y: quickTargetY }] }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Transfer dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickDoor = () => {
    if (!bundle || !map || !selectedCell) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.door-${n}`)) n++;
    const targetMap = quickTargetMap || bundle.project.maps[0];
    const newEv: MapEvent = {
      id: `event.door-${n}`,
      name: `Door: ${bundle.maps[targetMap]?.name || targetMap}`,
      x: selectedCell.x,
      y: selectedCell.y,
      trigger: 'interact',
      pages: [{
        solid: true,
        commands: [
          { type: 'text', text: 'Membuka pintu...' },
          { type: 'transfer', mapId: targetMap, x: quickTargetX, y: quickTargetY }
        ]
      }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Door dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickChest = () => {
    if (!bundle || !map || !selectedCell) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.chest-${n}`)) n++;
    const switchId = `chest.${map.id}.${selectedCell.x}_${selectedCell.y}`;
    const commands: EventCommand[] = quickChestType === 'gold'
      ? [
          { type: 'text', text: `Menemukan ${quickChestAmount} G!` },
          { type: 'setSwitch', id: switchId, value: true }
        ]
      : [
          { type: 'giveItem', itemId: quickChestItem || bundle.game.items[0]?.id || 'item.potion', amount: quickChestAmount },
          { type: 'text', text: `Mendapatkan ${quickChestAmount}× ${bundle.game.items.find(i => i.id === quickChestItem)?.name || 'Item'}!` },
          { type: 'setSwitch', id: switchId, value: true }
        ];
    const newEv: MapEvent = {
      id: `event.chest-${n}`,
      name: `Peti Harta (${quickChestType})`,
      x: selectedCell.x,
      y: selectedCell.y,
      trigger: 'interact',
      pages: [
        { solid: true, commands },
        { conditions: { switchId, switchValue: true }, solid: true, commands: [{ type: 'text', text: 'Peti ini sudah kosong.' }] }
      ]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Peti Harta dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleCreateQuickInn = () => {
    if (!bundle || !map || !selectedCell) return;
    let n = 1;
    while (map.events.some(e => e.id === `event.inn-${n}`)) n++;
    const newEv: MapEvent = {
      id: `event.inn-${n}`,
      name: 'Penginapan',
      x: selectedCell.x,
      y: selectedCell.y,
      trigger: 'interact',
      pages: [{
        solid: true,
        commands: [
          { type: 'text', text: `Selamat datang di penginapan! Menginap seharga ${quickInnPrice} G?` },
          {
            type: 'choice',
            prompt: 'Menginap?',
            choices: [
              { text: 'Ya', commands: [{ type: 'inn', price: quickInnPrice }, { type: 'text', text: 'HP dan MP Anda telah pulih sepenuhnya!' }] },
              { text: 'Tidak', commands: [{ type: 'text', text: 'Sampai jumpa lagi.' }] }
            ]
          }
        ]
      }]
    };
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, newEv] } } }, `Quick Inn dibuat.`);
    setModal('none');
    setCellContextMenu(null);
  };

  const handleLaunchPlaytest = async (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (api?.launchProjectPlaytest) {
      try {
        await api.launchProjectPlaytest(path);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : String(err));
      }
    } else {
      await handleOpenProject(path);
      void api?.playtest({ debug: true });
    }
  };

  const openSettingsModal = () => {
    if (!bundle) return;
    setSettingsTitle(bundle.project.title);
    setSettingsResWidth(bundle.project.logicalResolution.width);
    setSettingsResHeight(bundle.project.logicalResolution.height);
    setSettingsStartMap(bundle.project.start.mapId);
    setSettingsStartX(bundle.project.start.x);
    setSettingsStartY(bundle.project.start.y);
    setSettingsParty(bundle.project.party ?? []);
    setModal('projectSettings');
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!isFolderCustom) {
      const slug = val.toLowerCase().normalize('NFKD').replace(/[^a-z0-9-_]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
      setNewFolder(slug);
    }
  };

  const handleBrowseLocation = async () => {
    if (api?.chooseDirectory) {
      const chosen = await api.chooseDirectory('Pilih lokasi folder proyek baru');
      if (chosen) setNewLocation(chosen);
    }
  };

  const handleCreateProject = async () => {
    if (!newTitle.trim() || !newFolder.trim()) return;
    setBusy(true);
    try {
      const created = await api!.createProject(newTitle.trim(), {
        folderName: newFolder.trim(),
        location: newLocation.trim() || undefined
      });
      if (created) {
        accept(created, `Proyek baru "${created.project.title}" siap.`);
        refreshRecent();
        setModal('none');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenProject = async (targetPath?: string) => {
    setBusy(true);
    try {
      const opened = await api!.openProject(targetPath);
      if (opened) {
        accept(opened, `Proyek "${opened.project.title}" dibuka.`);
        refreshRecent();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleCloseProject = async () => {
    setBusy(true);
    try {
      if (api?.closeProject) await api.closeProject();
      setBundle(undefined);
      setSelectedMap('');
      setSelectedEvent('');
      setEventDraft('{}');
      setPast([]);
      setFuture([]);
      setDirty(false);
      setMessage('Proyek ditutup.');
      refreshRecent();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProject = async () => {
    if (!bundle || busy) return;
    setBusy(true);
    try {
      const saved = await api!.saveProject(bundle);
      if (saved) {
        setBundle(saved);
        setDirty(false);
        const time = new Date().toLocaleTimeString();
        setMessage(`Proyek disimpan aman (${time}).`);
        refreshRecent();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveRecent = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (api?.removeRecentProject) {
      try {
        const updated = await api.removeRecentProject(path);
        setRecentProjects(updated);
      } catch {
        // ignore
      }
    }
  };

  const handleApplySettings = () => {
    if (!bundle) return;
    const nextProject = {
      ...bundle.project,
      title: settingsTitle.trim() || bundle.project.title,
      logicalResolution: { width: settingsResWidth, height: settingsResHeight },
      start: { mapId: settingsStartMap, x: settingsStartX, y: settingsStartY },
      party: settingsParty.length ? settingsParty : bundle.project.party
    };
    commit({ ...bundle, project: nextProject }, 'Pengaturan proyek diperbarui.');
    setModal('none');
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return new Date(timestamp).toLocaleDateString();
  };

  const diagnostics = useMemo(
    () => (bundle && (showInspector || !dirty) ? analyzeBundle(bundle) : []),
    [bundle, showInspector, dirty]
  );
  const references = useMemo(
    () => (bundle && mode === 'search' && query.trim() ? findReferences(bundle, query) : []),
    [bundle, mode, query]
  );
  const map = bundle?.maps[selectedMap];

  const currentTileset = useMemo<TilesetData>(() => {
    const tilesets: TilesetData[] = Array.isArray(bundle?.game.tilesets) && bundle.game.tilesets.length > 0
      ? bundle.game.tilesets
      : DEFAULT_TILESETS;

    if (map?.tilesetId) {
      const found = tilesets.find(ts => ts.id === map.tilesetId || String(ts.id) === String(map.tilesetId));
      if (found) return found;
    }
    const imgStr = typeof map?.tilesetImage === 'string' ? map.tilesetImage : '';
    if (imgStr) {
      if (imgStr.includes('World')) {
        const overworld = tilesets.find(ts => ts.id === 'tileset.overworld' || ts.mode === 0);
        if (overworld) return overworld;
      } else if (imgStr.includes('Inside')) {
        const inside = tilesets.find(ts => ts.id === 'tileset.inside');
        if (inside) return inside;
      } else if (imgStr.includes('Dungeon')) {
        const dungeon = tilesets.find(ts => ts.id === 'tileset.dungeon');
        if (dungeon) return dungeon;
      }
    }
    const isWorld = map?.name?.toLowerCase().includes('world') || map?.id?.includes('field');
    return tilesets.find(ts => isWorld ? ts.mode === 0 : ts.id === 'tileset.outside') || tilesets[0] || DEFAULT_TILESETS[0];
  }, [bundle?.game.tilesets, map?.tilesetId, map?.tilesetImage, map?.name, map?.id]);

  const paletteTiles = useMemo<TileDefinition[]>(() => {
    return getPaletteTiles(paletteGroup, currentTileset);
  }, [paletteGroup, currentTileset]);

  const currentEvent = map?.events.find(event => event.id === selectedEvent);
  const errorCount = diagnostics.filter(issue => issue.severity === 'error').length;
  const warningCount = diagnostics.filter(issue => issue.severity === 'warning').length;
  const canPlay = Boolean(bundle?.root && !dirty && !busy && !errorCount);
  const parsedEvent=useMemo(()=>{try{return JSON.parse(eventDraft) as MapEvent;}catch{return undefined;}},[eventDraft]);

  const bundleRef = useRef<ProjectBundle | undefined>(bundle);
  bundleRef.current = bundle;

  const commit = (next: ProjectBundle, status = 'Perubahan diterapkan.') => {
    const current = bundleRef.current || bundle;
    if (current) setPast(items => [...items.slice(-49), clone(current)]);
    setFuture([]);
    bundleRef.current = next;
    setBundle(next);
    setDirty(true);
    setMessage(status);
  };

  const selectEvent = (id: string, nextBundle = bundle) => {
    setSelectedEvent(id);
    setEventDraft(eventJson(nextBundle?.maps[selectedMap]?.events.find(event => event.id === id)));
    setEventPage(0);
  };

  const selectCollection = (name: Collection, nextBundle = bundle) => {
    setCollection(name);
    setDataDraft(JSON.stringify(nextBundle?.game[name] ?? [], null, 2));
  };

  const accept = (value: ProjectBundle, status: string) => {
    setBundle(value);
    setSelectedMap(value.project.start.mapId);
    setSelectedEvent('');
    setEventDraft('{}');
    setPast([]);
    setFuture([]);
    setDirty(false);
    selectCollection(collection, value);
    setMode('map');
    setMessage(status);
  };

  const run = async (work: () => Promise<ProjectBundle | null>, success: string) => {
    setBusy(true);
    try {
      const value = await work();
      if (value) {
        accept(value, success);
        refreshRecent();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (hasAutoOpenedRef.current || bundle) return;
    hasAutoOpenedRef.current = true;
    if (api?.getRecentProjects && api?.openProject) {
      api.getRecentProjects().then(items => {
        if (Array.isArray(items) && items.length > 0 && items[0]?.path) {
          void api.openProject(items[0].path).then(opened => {
            if (opened) accept(opened, `Proyek "${opened.project.title}" dibuka.`);
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [api]);

  useEffect(() => {
    if (bundle) {
      document.title = `${bundle.project.title} - RPG Maker MZ`;
    } else {
      document.title = 'NUSV Engine Next';
    }
  }, [bundle]);

  const undo = () => {
    setPast(items => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      const current = bundleRef.current || bundle;
      if (current) {
        setFuture(fItems => [clone(current), ...fItems].slice(0, 50));
      }
      bundleRef.current = previous;
      setBundle(previous);
      setDirty(true);
      setMessage('Undo diterapkan.');
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture(items => {
      if (!items.length) return items;
      const next = items[0];
      const current = bundleRef.current || bundle;
      if (current) {
        setPast(pItems => [...pItems, clone(current)].slice(-50));
      }
      bundleRef.current = next;
      setBundle(next);
      setDirty(true);
      setMessage('Redo diterapkan.');
      return items.slice(1);
    });
  };

  const isMouseDownRef = useRef(false);
  const strokeInitialBundleRef = useRef<ProjectBundle | null>(null);
  const activeStrokeBundleRef = useRef<ProjectBundle | null>(null);
  const strokeModifiedRef = useRef(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
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
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [key, url] of Object.entries(assetUrls)) {
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
            const quads = getAutotileQuadrants(tile, layer.data, index, map.width, map.height);
            for (let q = 0; q < 4; q++) {
              const quad = quads[q];
              ctx.drawImage(
                img,
                quad.srcX, quad.srcY, 24, 24,
                x + quad.left, y + quad.top, 24, 24
              );
            }
          } else if (tile.srcX !== undefined && tile.srcY !== undefined) {
            ctx.drawImage(
              img,
              tile.srcX, tile.srcY, 48, 48,
              x, y, 48, 48
            );
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
    ctx.globalAlpha = 1.0;
  }, [map?.layers, visibleLayers, activeLayer, canvasTick, assetUrls, map?.width, map?.height]);

  const toggleTile = (x: number, y: number) => {
    const targetBundle = bundleRef.current || bundle;
    if (!targetBundle) return;
    const currentMap = targetBundle.maps[selectedMap];
    if (!currentMap) return;
    const collision = [...currentMap.collision];
    collision[y * currentMap.width + x] = collision[y * currentMap.width + x] === 1 ? 0 : 1;
    commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, collision } } }, `Collision (${x}, ${y}) diubah.`);
  };

  const applyPaint = (x: number, y: number, isBatch = false) => {
    const targetBundle = isBatch ? (activeStrokeBundleRef.current ?? bundleRef.current ?? bundle) : (bundleRef.current ?? bundle);
    if (!targetBundle) return;
    const currentMap = targetBundle.maps[selectedMap];
    if (!currentMap) return;

    const cellIndex = y * currentMap.width + x;
    const isEraser = mapTool === 'eraser';
    const tileId = isEraser ? 0 : selectedTile;

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
      const layers = floodFillLayer(currentMap.layers, layerIndex, cellIndex, tileId, currentMap.width, currentMap.height);
      if (layers === currentMap.layers) return;
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Fill diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    if (mapTool === 'rectangle') {
      if (!rectangleStart) {
        setRectangleStart({ x, y });
        setMessage(`Awal rectangle: (${x}, ${y}). Pilih sudut akhir.`);
        return;
      }
      const layers = paintLayerRectangle(currentMap.layers, layerIndex, rectangleStart.x, rectangleStart.y, x, y, tileId, currentMap.width);
      setRectangleStart(null);
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Rectangle diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    if (mapTool === 'circle') {
      if (!rectangleStart) {
        setRectangleStart({ x, y });
        setMessage(`Awal Circle: (${x}, ${y}). Pilih sudut akhir.`);
        return;
      }
      const layers = paintLayerCircle(currentMap.layers, layerIndex, rectangleStart.x, rectangleStart.y, x, y, tileId, currentMap.width);
      setRectangleStart(null);
      commit({ ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } }, `Circle diterapkan pada Layer ${layerIndex + 1}.`);
      return;
    }

    const currentTile = currentMap.layers[layerIndex].data[cellIndex];
    if (currentTile === tileId) return;

    const layers = paintLayerCell(currentMap.layers, layerIndex, cellIndex, tileId);
    const next = { ...targetBundle, maps: { ...targetBundle.maps, [currentMap.id]: { ...currentMap, layers } } };
    if (isBatch) {
      activeStrokeBundleRef.current = next;
      bundleRef.current = next;
      strokeModifiedRef.current = true;
      setBundle(next);
    } else {
      commit(next, `Tile diterapkan pada Layer ${layerIndex + 1}.`);
    }
  };

  const drawTile = (x: number, y: number) => {
    applyPaint(x, y, false);
  };

  const createEventAt = (x: number, y: number) => {
    if (!bundle || !map) return;
    let n = 1;
    while (map.events.some(event => event.id === `event.new-${n}`)) n++;
    const value: MapEvent = {
      id: `event.new-${n}`,
      name: `EV${String(n).padStart(3, '0')}`,
      x,
      y,
      trigger: 'interact',
      pages: [{ solid: true, commands: [{ type: 'text', text: 'Halo! Ini event baru.' }] }]
    };
    const next = { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, value] } } };
    commit(next, `${value.name} dibuat di (${x}, ${y}).`);
    selectEvent(value.id, next);
    setSelectedCell({ x, y });
    setModal('eventEditor');
  };

  const handleMapCell = (x: number, y: number, marker?: MapEvent) => {
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
    drawTile(x, y);
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

  const pickTile = (x: number, y: number) => {
    if (!map) return;
    const cell = y * map.width + x;
    const layerIndex = activeLayer === 'auto' ? [3, 2, 1, 0].find(index => visibleLayers[index] && map.layers[index].data[cell] !== 0) ?? 0 : activeLayer;
    const tileId = map.layers[layerIndex].data[cell];
    const def = tileDefinition(tileId, currentTileset);
    setSelectedTile(tileId);
    setPaletteGroup(def.group === 'D' && tileId <= 116 ? 'R' : (def.group ?? 'A') as any);
    setMapTool(tileId === 0 ? 'eraser' : 'pencil');
    setMessage(`${def.name || `Tile ${tileId}`} diambil dari Layer ${layerIndex + 1}.`);
  };

  const clearLayer = (layerIndex:number) => {
    if(!bundle||!map||lockedLayers[layerIndex])return setMessage(`Layer ${layerIndex+1} terkunci.`);
    if(!map.layers[layerIndex].data.some(Boolean))return setMessage(`Layer ${layerIndex+1} sudah kosong.`);
    const layers=map.layers.map((layer,index)=>index===layerIndex?{...layer,data:Array(map.width*map.height).fill(0)}:layer);
    commit({...bundle,maps:{...bundle.maps,[map.id]:{...map,layers}}},`Layer ${layerIndex+1} dikosongkan.`);
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
      if (map.events.some(event => event.id === parsed.id && event.id !== selectedEvent)) throw new Error(`ID ${parsed.id} sudah dipakai.`);
      const events = map.events.map(event => event.id === selectedEvent ? parsed : event);
      commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events } } }, 'Event JSON diterapkan.');
      setSelectedEvent(parsed.id);
    } catch (error) {
      setMessage(`Event rusak: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateEventVisual=(change:(draft:MapEvent)=>void)=>{
    if(!parsedEvent)return;
    const next=clone(parsedEvent);change(next);setEventDraft(eventJson(next));
  };

  const updateCommand=(index:number,command:EventCommand)=>updateEventVisual(draft=>{draft.pages[eventPage].commands[index]=command;});
  const removeCommand=(index:number)=>updateEventVisual(draft=>{draft.pages[eventPage].commands.splice(index,1);});
  const moveCommand=(index:number,direction:-1|1)=>updateEventVisual(draft=>{const commands=draft.pages[eventPage].commands,target=index+direction;if(target<0||target>=commands.length)return;[commands[index],commands[target]]=[commands[target],commands[index]];});
  const addCommandAt=(index:number,type:EventCommand['type'])=>{if(!bundle)return;updateEventVisual(draft=>{draft.pages[eventPage].commands.splice(index,0,createCommand(type,bundle));});};
  const addCommand=()=>{if(!bundle)return;const commands=currentEvent?.pages[eventPage].commands??[];addCommandAt(commands.length,newCommandType);setSelectedCommandIndex(commands.length);};

  const copyEvent = async () => {
    const value = map?.events.find(event => event.id === selectedEvent);
    if (!value) return;
    setClipboard(clone(value));
    try { await navigator.clipboard.writeText(eventJson(value)); } catch { /* clipboard OS opsional */ }
    setMessage(`${value.name} disalin ke clipboard event.`);
  };

  const handleCutEvent = async () => {
    if (!bundle || !map || !selectedEvent) return;
    const value = map.events.find(event => event.id === selectedEvent);
    if (!value) return;
    setClipboard(clone(value));
    try { await navigator.clipboard.writeText(eventJson(value)); } catch { /* clipboard OS opsional */ }
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

  const pasteEvent = () => {
    if (!bundle || !map || !clipboard) return;
    let n = 1;
    while (map.events.some(event => event.id === `${clipboard.id}-copy-${n}`)) n++;
    const index = map.collision.findIndex((cell, i) => cell === 0 && !map.events.some(event => event.x === i % map.width && event.y === Math.floor(i / map.width)));
    if (index < 0) return setMessage('Tidak ada tile kosong untuk event salinan.');
    const value = { ...clone(clipboard), id: `${clipboard.id}-copy-${n}`, name: `${clipboard.name} Copy`, x: index % map.width, y: Math.floor(index / map.width) };
    const next = { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, value] } } };
    commit(next, 'Event ditempel dengan ID baru.');
    selectEvent(value.id, next);
    setMode('event');
  };

  const applyCollection = () => {
    if (!bundle) return;
    try {
      const parsed = JSON.parse(dataDraft);
      if (!Array.isArray(parsed)) throw new Error('Root koleksi harus array.');
      const ids = new Set<string>();
      for (const entry of parsed) {
        if (!entry || typeof entry.id !== 'string') throw new Error('Semua record wajib memiliki id string.');
        if (ids.has(entry.id)) throw new Error(`ID ganda: ${entry.id}`);
        ids.add(entry.id);
      }
      commit({ ...bundle, game: { ...bundle.game, [collection]: parsed } }, `${collection} diterapkan; validasi silang diperbarui.`);
    } catch (error) {
      setMessage(`Database rusak: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const selectRecord = (index: number) => {
    setSelectedRecordIndex(index);
    setRecordView('form');
  };

  const addRecord = () => {
    if (!bundle) return;
    const empty: Record<string, unknown> = { id: `new.${Date.now()}`, name: 'Baru' };
    const next = { ...bundle, game: { ...bundle.game, [collection]: [...(bundle.game[collection] as unknown[]), empty] } };
    commit(next, `${collectionLabel(collection)} baru ditambahkan.`);
    setSelectedRecordIndex((bundle.game[collection] as unknown[]).length);
  };

  const removeRecord = () => {
    if (!bundle || selectedRecordIndex === null) return;
    const arr = (bundle.game[collection] as unknown) as unknown[];
    const next = { ...bundle, game: { ...bundle.game, [collection]: arr.filter((_, i) => i !== selectedRecordIndex) } };
    commit(next, `${collectionLabel(collection)} dihapus.`);
    setSelectedRecordIndex(null);
  };

  const updateRecordField = (key: string, value: unknown) => {
    if (!bundle || selectedRecordIndex === null) return;
    const arr = (bundle.game[collection] as unknown) as Record<string, unknown>[];
    const next = { ...arr };
    next[selectedRecordIndex] = { ...next[selectedRecordIndex], [key]: value };
    commit({ ...bundle, game: { ...bundle.game, [collection]: next } }, `${collectionLabel(collection)} diperbarui.`);
  };

  const importMv = async () => {
    if (!bundle) return;
    setBusy(true);
    try {
      const result = await api!.importMvSubset(bundle);
      if (result) {
        commit(result.bundle, 'Subset MV diimpor ke memori. Simpan untuk menetapkan hasil.');
        setReport(result.report);
        selectCollection(collection, result.bundle);
        setModal('database');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement;
      if (!editing && mode==='map' && event.ctrlKey && event.key === 'Tab') {
        event.preventDefault();
        const choices:LayerSelection[]=['auto',0,1,2,3];
        setActiveLayer(current=>choices[(choices.indexOf(current)+1)%choices.length]);
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
        event.preventDefault(); setMode('map');
      } else if (!editing && event.key === 'F9' && bundle) {
        event.preventDefault(); setModal('database');
      } else if (!editing && event.key === 'F10' && bundle) {
        event.preventDefault(); setModal('resourceManager');
      } else if (!editing && event.key === 'F6' && canPlay) {
        event.preventDefault(); void api!.playtest({ mapId: selectedMap, debug: true });
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        if (selectedMap) handleOpenShiftModal(selectedMap);
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        handleOpenGenerateDungeon();
      } else if (!editing && mode === 'event') {
        if (event.key === ' ' || event.key === 'Spacebar') {
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!api) return <main className="editor-shell"><section className="error-card">NUSV Engine harus dijalankan sebagai aplikasi desktop.</section></main>;

  const renderModals = () => (
    <>
      {modal === 'newProject' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>New Project</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-dialog-form">
                <div className="mv-field-group">
                  <label>Game Title</label>
                  <input
                    type="text"
                    autoFocus
                    value={newTitle}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Judul Game Anda"
                  />
                </div>
                <div className="mv-field-group">
                  <label>Folder Name</label>
                  <input
                    type="text"
                    value={newFolder}
                    onChange={e => {
                      setNewFolder(e.target.value);
                      setIsFolderCustom(true);
                    }}
                    placeholder="e.g. my-rpg-adventure"
                  />
                </div>
                <div className="mv-field-group">
                  <label>Location (Parent Directory)</label>
                  <div className="mv-field-row">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      placeholder="Pilih lokasi penyimpanan (default jika kosong)"
                    />
                    <button type="button" onClick={handleBrowseLocation}>Browse…</button>
                  </div>
                </div>
                <div className="mv-field-group">
                  <label>Destination Path Preview</label>
                  <div className="mv-path-preview">
                    {`${(newLocation || defaultLocation || '[Lokasi Terpilih]').replace(/[/\\]+$/, '')}/${newFolder || 'project'}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" disabled={busy || !newTitle.trim()} onClick={handleCreateProject}>
                {busy ? 'Membuat…' : 'OK / Buat Proyek'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'projectSettings' && bundle && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Project Settings — {bundle.project.title}</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-dialog-form">
                <div className="mv-field-group">
                  <label>Game Title</label>
                  <input
                    type="text"
                    value={settingsTitle}
                    onChange={e => setSettingsTitle(e.target.value)}
                  />
                </div>
                <div className="mv-field-group">
                  <label>Logical Resolution</label>
                  <div className="mv-field-row">
                    <input
                      type="number"
                      value={settingsResWidth}
                      onChange={e => setSettingsResWidth(Number(e.target.value))}
                      style={{ width: '100px' }}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      value={settingsResHeight}
                      onChange={e => setSettingsResHeight(Number(e.target.value))}
                      style={{ width: '100px' }}
                    />
                    <div className="mv-preset-chips">
                      <button
                        type="button"
                        className={settingsResWidth === 816 && settingsResHeight === 624 ? 'active' : ''}
                        onClick={() => { setSettingsResWidth(816); setSettingsResHeight(624); }}
                      >
                        816×624
                      </button>
                      <button
                        type="button"
                        className={settingsResWidth === 1080 && settingsResHeight === 720 ? 'active' : ''}
                        onClick={() => { setSettingsResWidth(1080); setSettingsResHeight(720); }}
                      >
                        1080×720
                      </button>
                      <button
                        type="button"
                        className={settingsResWidth === 1280 && settingsResHeight === 720 ? 'active' : ''}
                        onClick={() => { setSettingsResWidth(1280); setSettingsResHeight(720); }}
                      >
                        1280×720 (HD)
                      </button>
                      <button
                        type="button"
                        className={settingsResWidth === 1920 && settingsResHeight === 1080 ? 'active' : ''}
                        onClick={() => { setSettingsResWidth(1920); setSettingsResHeight(1080); }}
                      >
                        1920×1080 (FHD)
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mv-field-group">
                  <label>Starting Map & Position</label>
                  <div className="mv-field-row">
                    <select
                      value={settingsStartMap}
                      onChange={e => setSettingsStartMap(e.target.value)}
                    >
                      {bundle.project.maps.map(id => (
                        <option key={id} value={id}>
                          {bundle.maps[id]?.name || id} ({id})
                        </option>
                      ))}
                    </select>
                    <span>X:</span>
                    <input
                      type="number"
                      value={settingsStartX}
                      onChange={e => setSettingsStartX(Number(e.target.value))}
                      style={{ width: '70px' }}
                    />
                    <span>Y:</span>
                    <input
                      type="number"
                      value={settingsStartY}
                      onChange={e => setSettingsStartY(Number(e.target.value))}
                      style={{ width: '70px' }}
                    />
                  </div>
                </div>
                <div className="mv-field-group">
                  <label>Initial Party Members</label>
                  <div className="mv-checkbox-grid">
                    {bundle.game.actors.map(actor => {
                      const isSelected = settingsParty.includes(actor.id);
                      return (
                        <label key={actor.id} className="mv-checkbox-item">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setSettingsParty(prev => [...prev, actor.id]);
                              } else {
                                setSettingsParty(prev => prev.filter(id => id !== actor.id));
                              }
                            }}
                          />
                          <span>{actor.name} ({actor.id})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleApplySettings}>Terapkan Pengaturan</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'unsavedConfirm' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Perubahan Belum Disimpan</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <p>Proyek saat ini memiliki perubahan yang belum disimpan.</p>
              <p>Apakah Anda ingin menyimpan perubahan sebelum melanjutkan tindakan <b>{pendingActionLabel}</b>?</p>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button
                onClick={async () => {
                  setModal('none');
                  if (pendingAction) {
                    const action = pendingAction;
                    setPendingAction(null);
                    await action();
                  }
                }}
              >
                Jangan Simpan
              </button>
              <button
                className="primary"
                onClick={async () => {
                  await handleSaveProject();
                  setModal('none');
                  if (pendingAction) {
                    const action = pendingAction;
                    setPendingAction(null);
                    await action();
                  }
                }}
              >
                Simpan & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'eventEditor' && bundle && currentEvent && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal event-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Event: {currentEvent.name} — ({currentEvent.x}, {currentEvent.y})</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Nama Event</label>
                  <input
                    type="text"
                    value={currentEvent.name}
                    onChange={e => {
                      const name = e.target.value;
                      updateEventVisual(draft => { draft.name = name; });
                    }}
                  />
                </div>
                <div className="mv-field-group" style={{ width: '170px' }}>
                  <label>Trigger</label>
                  <select
                    value={currentEvent.trigger}
                    onChange={e => {
                      const trigger = e.target.value as MapEvent['trigger'];
                      updateEventVisual(draft => { draft.trigger = trigger; });
                    }}
                  >
                    <option value="interact">Action Button (Tombol Aksi)</option>
                    <option value="touch">Player Touch (Sentuhan Pemain)</option>
                    <option value="event_touch">Event Touch</option>
                    <option value="autorun">Autorun (Otomatis)</option>
                    <option value="parallel">Parallel (Paralel)</option>
                  </select>
                </div>
                <div className="mv-field-group" style={{ width: '90px', display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(currentEvent.pages[eventPage]?.solid)}
                      onChange={e => {
                        const solid = e.target.checked;
                        updateEventVisual(draft => {
                          if (draft.pages[eventPage]) draft.pages[eventPage].solid = solid;
                        });
                      }}
                    />
                    <span>Solid</span>
                  </label>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <button onClick={() => void copyEvent()}>Salin</button>
                  <button onClick={() => setEventView(eventView === 'visual' ? 'json' : 'visual')}>
                    {eventView === 'visual' ? 'JSON' : 'Visual'}
                  </button>
                </div>
              </div>

              {eventView === 'visual' ? (
                <div className="mv-event-visual">
                  <div className="mv-command-bar">
                    <span>Halaman {eventPage + 1} dari {currentEvent.pages.length}</span>
                    <div className="mv-add-command">
                      <select value={newCommandType} onChange={event => setNewCommandType(event.target.value as EventCommand['type'])}>
                        {commandTypes.map(type => <option key={type} value={type}>{commandName[type]}</option>)}
                      </select>
                      <button className="primary" onClick={addCommand}>Tambah Perintah</button>
                    </div>
                  </div>
                  <div className="mv-command-list">
                    {currentEvent.pages[eventPage].commands.map((command, index) => (
                      <div
                        className={`mv-command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                        key={index}
                        onClick={() => setSelectedCommandIndex(index === selectedCommandIndex ? null : index)}
                      >
                        <div className="mv-command-header">
                          <span className="mv-command-type">{commandName[command.type]}</span>
                          <span className="mv-command-preview">{commandPreview(command)}</span>
                        </div>
                        <div className="mv-command-controls">
                          <button className="mv-icon-button" disabled={index === 0} onClick={() => { moveCommand(index, -1); setSelectedCommandIndex(index - 1); }}>↑</button>
                          <button className="mv-icon-button" disabled={index === currentEvent.pages[eventPage].commands.length - 1} onClick={() => { moveCommand(index, 1); setSelectedCommandIndex(index + 1); }}>↓</button>
                          <button className="mv-icon-button mv-delete" onClick={() => { removeCommand(index); setSelectedCommandIndex(null); }}>×</button>
                        </div>
                      </div>
                    ))}
                    {currentEvent.pages[eventPage].commands.length === 0 && (
                      <div className="mv-empty-command">Belum ada perintah. Pilih tipe dan klik Tambah Perintah.</div>
                    )}
                  </div>
                  {selectedCommandIndex !== null && currentEvent.pages[eventPage].commands[selectedCommandIndex] && (
                    <div className="mv-command-form">
                      <h4>Edit Perintah #{selectedCommandIndex + 1}</h4>
                      <CommandFields command={currentEvent.pages[eventPage].commands[selectedCommandIndex]} bundle={bundle} onChange={command => updateCommand(selectedCommandIndex, command)} />
                      <button className="mv-icon-button mv-delete" onClick={() => { removeCommand(selectedCommandIndex); setSelectedCommandIndex(null); }}>Hapus Perintah</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mv-code-panel">
                  <div className="mv-code-title"><span>Event Data</span><code>{currentEvent.id}.json</code></div>
                  <textarea className="mv-code-editor" spellCheck={false} value={eventDraft} onChange={event => setEventDraft(event.target.value)} />
                  <div className="mv-applybar">
                    <span>JSON mempertahankan setiap perintah runtime dan kondisi halaman.</span>
                    <button className="primary" onClick={applyEvent}>Terapkan JSON</button>
                  </div>
                </div>
              )}
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Tutup</button>
              <button className="primary" onClick={() => { applyEvent(); setModal('none'); }}>
                OK / Simpan Event
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'mapProperties' && bundle && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Map Properties — {mapEditName}</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-dialog-form">
                <div className="mv-field-group">
                  <label>Nama Peta</label>
                  <input
                    type="text"
                    value={mapEditName}
                    onChange={e => setMapEditName(e.target.value)}
                  />
                </div>
                <div className="mv-field-row">
                  <div className="mv-field-group" style={{ flex: 1 }}>
                    <label>Width (Lebar Tile)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={mapEditWidth}
                      onChange={e => setMapEditWidth(Number(e.target.value))}
                    />
                  </div>
                  <div className="mv-field-group" style={{ flex: 1 }}>
                    <label>Height (Tinggi Tile)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={mapEditHeight}
                      onChange={e => setMapEditHeight(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="mv-field-group">
                  <label>Tileset (Database)</label>
                  <select
                    value={mapEditTilesetId}
                    onChange={e => setMapEditTilesetId(e.target.value)}
                  >
                    <option value="">(Bawaan: {currentTileset.name})</option>
                    {(Array.isArray(bundle.game.tilesets) && bundle.game.tilesets.length > 0 ? bundle.game.tilesets : DEFAULT_TILESETS).map(ts => (
                      <option key={ts.id} value={ts.id}>
                        {ts.name} ({ts.mode === 0 ? 'World Type' : 'Area Type'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mv-field-group">
                  <label>Scroll Type</label>
                  <select
                    value={mapEditScroll}
                    onChange={e => setMapEditScroll(e.target.value)}
                  >
                    <option value="none">No Loop (Tanpa Perulangan)</option>
                    <option value="vertical">Loop Vertical</option>
                    <option value="horizontal">Loop Horizontal</option>
                    <option value="both">Loop Both (Dua Arah)</option>
                  </select>
                </div>
                <div className="mv-field-group">
                  <label>BGM (Background Music)</label>
                  <select
                    value={mapEditBgm}
                    onChange={e => setMapEditBgm(e.target.value)}
                  >
                    <option value="calm">Calm (Suasana Damai)</option>
                    <option value="danger">Danger (Ketegangan / Gua)</option>
                    <option value="boss">Boss Theme (Pertarungan)</option>
                    <option value="silence">Silence (Hening)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleApplyMapProperties}>
                OK / Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'toolPlaceholder' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>{placeholderTitle}</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: '32px' }}>⚙️</span>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px' }}>{placeholderTitle}</h4>
                  <p style={{ margin: 0, color: '#555', fontSize: '11.5px', lineHeight: 1.5 }}>{placeholderDesc}</p>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button className="primary" onClick={() => setModal('none')}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'resourceManager' && bundle && (
        <ResourceManagerModal
          bundle={bundle}
          onCommit={commit}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'database' && bundle && (
        <div className="mv-modal-backdrop mz-db-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal mz-database-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header mz-db-modal-header">
              <div className="mz-db-modal-title">
                <span style={{ fontSize: '14px' }}>▤</span>
                <strong>Database</strong>
              </div>
              <button className="mv-modal-close" onClick={() => setModal('none')} title="Tutup Database (Esc)">✕</button>
            </div>
            <div className="mz-db-modal-body">
              <DatabaseView
                bundle={bundle}
                collection={collection}
                onSelectCollection={(c) => setCollection(c)}
                onCommit={commit}
                onImportMv={() => void importMv()}
                busy={busy}
                assetUrls={assetUrls}
              />
            </div>
            {report && (
              <details className="mv-import-report" open style={{ margin: '8px 16px', maxHeight: '160px', overflowY: 'auto' }}>
                <summary>Import report — {report.source}</summary>
                <div>
                  <section><h3>Converted</h3>{report.converted.map(line => <p key={line}>{line}</p>)}</section>
                  <section><h3>Warnings & manual work</h3>{[...report.warnings, ...report.unsupported, ...report.errors].map((line, index) => <p key={index}>{line}</p>)}</section>
                </div>
              </details>
            )}
            <div className="mv-modal-footer mz-db-modal-footer">
              <div className="mz-db-modal-footer-actions">
                <button className="mz-btn-dialog primary" onClick={() => setModal('none')}>OK</button>
                <button className="mz-btn-dialog" onClick={() => setModal('none')}>Cancel</button>
                <button className="mz-btn-dialog" onClick={() => { setMessage('Perubahan database diterapkan.'); }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'shiftMap' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Shift Map</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-form-row">
                <div className="mv-field-group">
                  <label>X Offset (Horizontal)</label>
                  <input
                    type="number"
                    value={shiftX}
                    onChange={e => setShiftX(parseInt(e.target.value, 10) || 0)}
                  />
                  <small style={{ color: '#777' }}>Positif = kanan, Negatif = kiri</small>
                </div>
                <div className="mv-field-group">
                  <label>Y Offset (Vertical)</label>
                  <input
                    type="number"
                    value={shiftY}
                    onChange={e => setShiftY(parseInt(e.target.value, 10) || 0)}
                  />
                  <small style={{ color: '#777' }}>Positif = bawah, Negatif = atas</small>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={shiftLoop}
                    onChange={e => setShiftLoop(e.target.checked)}
                  />
                  <span>Loop (Putar tile yang keluar dari batas)</span>
                </label>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleApplyShiftModal}>OK / Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'generateDungeon' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Generate Dungeon</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#555' }}>
                Secara otomatis menghasilkan tata letak labirin ruangan & koridor menggunakan tileset yang dipilih.
              </p>
              <div className="mv-form-row">
                <div className="mv-field-group">
                  <label>Floor Tile</label>
                  <select
                    value={dungeonFloor}
                    onChange={e => setDungeonFloor(parseInt(e.target.value, 10) || 3)}
                  >
                    {TILE_CATALOG.filter(t => t.id !== 0).map(t => (
                      <option key={t.id} value={t.id}>{t.glyph} {t.name} (#{t.id})</option>
                    ))}
                  </select>
                </div>
                <div className="mv-field-group">
                  <label>Wall Tile</label>
                  <select
                    value={dungeonWall}
                    onChange={e => setDungeonWall(parseInt(e.target.value, 10) || 6)}
                  >
                    {TILE_CATALOG.filter(t => t.id !== 0).map(t => (
                      <option key={t.id} value={t.id}>{t.glyph} {t.name} (#{t.id})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleApplyGenerateDungeon}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'soundTest' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Sound Test</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {(['se', 'me', 'bgm'] as const).map(cat => (
                  <button
                    key={cat}
                    style={{
                      padding: '6px 16px',
                      background: soundCategory === cat ? '#0078d7' : '#e4e7eb',
                      color: soundCategory === cat ? '#fff' : '#2b3543',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                    onClick={() => {
                      setSoundCategory(cat);
                      if (cat === 'se') setSoundSelected('Decision');
                      else if (cat === 'bgm') setSoundSelected('Field');
                      else setSoundSelected('Victory');
                    }}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div style={{
                  height: '220px',
                  overflowY: 'auto',
                  border: '1px solid #c0c6cf',
                  borderRadius: '4px',
                  background: '#fff',
                  padding: '4px'
                }}>
                  {((soundCategory === 'se'
                    ? ['Cursor', 'Decision', 'Cancel', 'Buzzer', 'Chest', 'Door', 'Attack', 'Hit', 'Jump', 'Recovery']
                    : soundCategory === 'me'
                    ? ['Victory', 'Defeat', 'LevelUp', 'Item']
                    : ['Field', 'Town', 'Dungeon', 'Battle']
                  )).map(snd => (
                    <div
                      key={snd}
                      onClick={() => setSoundSelected(snd)}
                      onDoubleClick={() => playSoundEffect(snd)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        background: soundSelected === snd ? '#0078d7' : 'transparent',
                        color: soundSelected === snd ? '#fff' : '#222',
                        borderRadius: '3px',
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}
                    >
                      🔊 {snd}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="primary"
                    style={{ padding: '8px', fontSize: '13px' }}
                    onClick={() => playSoundEffect(soundSelected)}
                  >
                    ▶ Play
                  </button>
                  <button
                    style={{ padding: '8px', fontSize: '13px' }}
                    onClick={() => {}}
                  >
                    ■ Stop
                  </button>
                  <div style={{ marginTop: 'auto', padding: '8px', background: '#f5f7fa', borderRadius: '4px', border: '1px solid #e1e4e8', fontSize: '11px', color: '#555' }}>
                    <strong>Selected:</strong><br />
                    {soundSelected}
                  </div>
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button className="primary" onClick={() => setModal('none')}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'resourceManager' && bundle && (
        <ResourceManagerModal
          bundle={bundle}
          onCommit={commit}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'database' && bundle && (
        <div className="mv-modal-backdrop mz-db-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal mz-database-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header mz-db-modal-header">
              <div className="mz-db-modal-title">
                <span style={{ fontSize: '14px' }}>▤</span>
                <strong>Database</strong>
              </div>
              <button className="mv-modal-close" onClick={() => setModal('none')} title="Tutup Database (Esc)">✕</button>
            </div>
            <div className="mz-db-modal-body">
              <DatabaseView
                bundle={bundle}
                collection={collection}
                onSelectCollection={(c) => setCollection(c)}
                onCommit={commit}
                onImportMv={() => void importMv()}
                busy={busy}
                assetUrls={assetUrls}
              />
            </div>
            {report && (
              <details className="mv-import-report" open style={{ margin: '8px 16px', maxHeight: '160px', overflowY: 'auto' }}>
                <summary>Import report — {report.source}</summary>
                <div>
                  <section><h3>Converted</h3>{report.converted.map(line => <p key={line}>{line}</p>)}</section>
                  <section><h3>Warnings & manual work</h3>{[...report.warnings, ...report.unsupported, ...report.errors].map((line, index) => <p key={index}>{line}</p>)}</section>
                </div>
              </details>
            )}
            <div className="mv-modal-footer mz-db-modal-footer">
              <div className="mz-db-modal-footer-actions">
                <button className="mz-btn-dialog primary" onClick={() => setModal('none')}>OK</button>
                <button className="mz-btn-dialog" onClick={() => setModal('none')}>Cancel</button>
                <button className="mz-btn-dialog" onClick={() => { setMessage('Perubahan database diterapkan.'); }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'quickTransfer' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Quick Event Creation — Transfer</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-field-group">
                <label>Peta Tujuan (Destination Map)</label>
                <select
                  value={quickTargetMap}
                  onChange={e => setQuickTargetMap(e.target.value)}
                >
                  {bundle?.project.maps.map(id => (
                    <option key={id} value={id}>
                      {id}: {bundle.maps[id]?.name || id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mv-form-row" style={{ marginTop: '10px' }}>
                <div className="mv-field-group">
                  <label>Target X</label>
                  <input
                    type="number"
                    min="0"
                    value={quickTargetX}
                    onChange={e => setQuickTargetX(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="mv-field-group">
                  <label>Target Y</label>
                  <input
                    type="number"
                    min="0"
                    value={quickTargetY}
                    onChange={e => setQuickTargetY(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleCreateQuickTransfer}>OK</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'quickDoor' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Quick Event Creation — Door</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-field-group">
                <label>Peta Tujuan (Destination Map)</label>
                <select
                  value={quickTargetMap}
                  onChange={e => setQuickTargetMap(e.target.value)}
                >
                  {bundle?.project.maps.map(id => (
                    <option key={id} value={id}>
                      {id}: {bundle.maps[id]?.name || id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mv-form-row" style={{ marginTop: '10px' }}>
                <div className="mv-field-group">
                  <label>Target X</label>
                  <input
                    type="number"
                    min="0"
                    value={quickTargetX}
                    onChange={e => setQuickTargetX(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="mv-field-group">
                  <label>Target Y</label>
                  <input
                    type="number"
                    min="0"
                    value={quickTargetY}
                    onChange={e => setQuickTargetY(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleCreateQuickDoor}>OK</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'quickChest' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Quick Event Creation — Treasure Chest</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-field-group">
                <label>Tipe Isi Peti</label>
                <div style={{ display: 'flex', gap: '16px', margin: '6px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="chestType"
                      checked={quickChestType === 'gold'}
                      onChange={() => setQuickChestType('gold')}
                    />
                    <span>Gold (Uang)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="chestType"
                      checked={quickChestType === 'item'}
                      onChange={() => setQuickChestType('item')}
                    />
                    <span>Item / Barang</span>
                  </label>
                </div>
              </div>
              {quickChestType === 'gold' ? (
                <div className="mv-field-group" style={{ marginTop: '10px' }}>
                  <label>Jumlah Gold (G)</label>
                  <input
                    type="number"
                    min="1"
                    value={quickChestAmount}
                    onChange={e => setQuickChestAmount(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              ) : (
                <div className="mv-field-group" style={{ marginTop: '10px' }}>
                  <label>Item</label>
                  <select
                    value={quickChestItem}
                    onChange={e => setQuickChestItem(e.target.value)}
                  >
                    {bundle?.game.items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleCreateQuickChest}>OK</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'quickInn' && (
        <div className="mv-modal-backdrop" onClick={() => setModal('none')}>
          <div className="mv-modal" style={{ width: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <span>Quick Event Creation — Inn</span>
              <button className="mv-modal-close" onClick={() => setModal('none')}>×</button>
            </div>
            <div className="mv-modal-body">
              <div className="mv-field-group">
                <label>Biaya Menginap (Gold)</label>
                <input
                  type="number"
                  min="0"
                  value={quickInnPrice}
                  onChange={e => setQuickInnPrice(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
            <div className="mv-modal-footer">
              <button onClick={() => setModal('none')}>Batal</button>
              <button className="primary" onClick={handleCreateQuickInn}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!bundle) {
    const filteredProjects = recentProjects.filter(p =>
      !projectSearchQuery.trim() ||
      p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );

    return (
      <main className="godot-pm-layout">
        <header className="godot-pm-topbar">
          <div className="godot-pm-brand">
            <div className="mv-brand-mark">N</div>
            <div className="godot-pm-brand-text">
              <strong>NUSV Engine</strong>
              <span>Project Manager</span>
            </div>
          </div>

          <div className="godot-pm-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Cari proyek (judul / folder)…"
              value={projectSearchQuery}
              onChange={e => setProjectSearchQuery(e.target.value)}
            />
            {projectSearchQuery && (
              <button
                style={{ background: 'transparent', border: 0, color: '#888', cursor: 'pointer', padding: '0 4px' }}
                onClick={() => setProjectSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="godot-pm-actions">
            <button className="primary" onClick={() => guardDirty(openNewProjectModal, 'Buat Proyek')}>
              ＋ Proyek Baru
            </button>
            <button onClick={() => guardDirty(() => handleOpenProject(), 'Buka Proyek')}>
              📂 Buka File…
            </button>
          </div>
        </header>

        <div className="godot-pm-body">
          <div className="godot-pm-list">
            {filteredProjects.map(proj => (
              <div
                key={proj.path}
                className="godot-pm-card"
                onDoubleClick={() => guardDirty(() => handleOpenProject(proj.path), `Buka ${proj.title}`)}
              >
                <div className="godot-pm-card-icon">🎮</div>
                <div className="godot-pm-card-details">
                  <div className="godot-pm-card-title">{proj.title}</div>
                  <div className="godot-pm-card-path">{proj.path}</div>
                  <div className="godot-pm-card-meta">
                    <span>Terakhir dibuka: {formatRelativeTime(proj.lastOpened)}</span>
                  </div>
                </div>
                <div className="godot-pm-card-actions">
                  <button
                    className="godot-pm-btn-play"
                    title="Jalankan Playtest Langsung"
                    onClick={(e) => handleLaunchPlaytest(proj.path, e)}
                  >
                    ▶ Play
                  </button>
                  <button
                    className="godot-pm-btn-edit"
                    title="Buka di Editor"
                    onClick={() => guardDirty(() => handleOpenProject(proj.path), `Buka ${proj.title}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="godot-pm-btn-remove"
                    title="Hapus dari daftar riwayat"
                    onClick={(e) => handleRemoveRecent(proj.path, e)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="godot-pm-empty">
                <div className="godot-pm-empty-icon">📁</div>
                <h3>{projectSearchQuery ? 'Tidak ada proyek yang cocok' : 'Belum Ada Proyek'}</h3>
                <p>
                  {projectSearchQuery
                    ? `Tidak ditemukan proyek yang cocok dengan "${projectSearchQuery}".`
                    : `Mulai dengan membuat proyek game baru ke direktori default (${defaultLocation || 'project/'}) atau buka proyek yang sudah ada.`}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="primary" onClick={() => guardDirty(openNewProjectModal, 'Buat Proyek')}>
                    ＋ Buat Proyek Baru
                  </button>
                  <button onClick={() => guardDirty(() => handleOpenProject(), 'Buka Proyek Lain')}>
                    📂 Buka Proyek Lain…
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="godot-pm-footer">
          <span>Default Direktori: {defaultLocation || 'Memuat...'}</span>
          <span>NUSV Engine Next v0.1.0 • Clean-Room 2D/3D JRPG Engine</span>
        </footer>

        {renderModals()}
      </main>
    );
  }

  const chooseMap = (id: string) => {
    setSelectedMap(id);
    setSelectedEvent('');
    setEventDraft('{}');
    setMode('map');
  };

  const openEvent = (id: string) => {
    selectEvent(id);
    setMode('event');
  };

  return <main className="mv-app">
    <div className="mv-titlebar">
      <div className="mv-brand">
        <button
          className="mv-pm-switch-btn"
          title="Kembali ke Project Manager"
          onClick={() => guardDirty(handleCloseProject, 'Project Manager')}
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
        <button onClick={() => guardDirty(openNewProjectModal, 'Buat Proyek')}>New Project… <kbd>Ctrl+N</kbd></button>
        <button onClick={() => guardDirty(() => handleOpenProject(), 'Buka Proyek')}>Open Project… <kbd>Ctrl+O</kbd></button>
        <button onClick={() => guardDirty(handleCloseProject, 'Project Manager')}>Project Manager… <kbd>Esc</kbd></button>
        {recentProjects.length > 0 && <>
          <hr />
          <div className="mv-menu-section-title">Recent Projects</div>
          {recentProjects.slice(0, 5).map(proj => (
            <button
              key={proj.path}
              className="mv-recent-menu-item"
              onClick={() => guardDirty(() => handleOpenProject(proj.path), `Buka ${proj.title}`)}
            >
              <span>{proj.title}</span>
              <small>{proj.path}</small>
            </button>
          ))}
        </>}
        <button disabled={!bundle} onClick={() => guardDirty(handleCloseProject, 'Tutup Proyek')}>Close Project</button>
        <hr />
        <button disabled={!bundle || !dirty || busy} onClick={handleSaveProject}>Save Project <kbd>Ctrl+S</kbd></button>
        <hr />
        <button disabled={!bundle} onClick={openSettingsModal}>Project Settings…</button>
      </div></details>
      <details className="mv-menu"><summary>Edit</summary><div>
        <button disabled={!past.length} onClick={undo}>Undo <kbd>Ctrl+Z</kbd></button>
        <button disabled={!future.length} onClick={redo}>Redo <kbd>Ctrl+Y</kbd></button>
        <button disabled={!selectedEvent} onClick={() => void copyEvent()}>Copy Event <kbd>Ctrl+C</kbd></button>
        <button disabled={!clipboard} onClick={pasteEvent}>Paste Event <kbd>Ctrl+V</kbd></button>
      </div></details>
      <details className="mv-menu"><summary>Mode</summary><div>
        <button onClick={() => setMode('map')}>Map <kbd>F5</kbd></button>
        <button onClick={() => setMode('event')}>Events</button>
        <button onClick={() => setModal('database')}>Database <kbd>F9</kbd></button>
        <button onClick={() => setMode('search')}>Search</button>
      </div></details>
      <details className="mv-menu"><summary>Draw</summary><div>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('pencil'); setRectangleStart(null); }}>✎ Pencil</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('rectangle'); setRectangleStart(null); }}>□ Rectangle</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('circle'); setRectangleStart(null); }}>○ Circle</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('shadow'); setRectangleStart(null); }}>◐ Shadow Pen</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('fill'); setRectangleStart(null); }}>▣ Flood Fill</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('eraser'); setRectangleStart(null); }}>◇ Eraser</button>
        <button disabled={mode !== 'map'} onClick={() => { setMapTool('collision'); setRectangleStart(null); }}>▨ Collision Mark</button>
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
        <button disabled={!bundle || busy} onClick={() => void importMv()}>Import RPG Maker MV Subset…</button>
      </div></details>
      <details className="mv-menu"><summary>Game</summary><div>
        <button disabled={!canPlay} onClick={() => void api.playtest({ mapId: selectedMap, debug: true })}>
          Playtest <kbd>F6</kbd>
        </button>
      </div></details>
      <details className="mv-menu"><summary>Help</summary><div>
        <button onClick={() => alert('NUSV Engine Next - RPG Maker MZ Compatible Environment')}>About…</button>
      </div></details>
      <span className="mv-menu-spacer" />
      <span className={`mv-save-state ${dirty ? 'dirty' : ''}`}>{busy ? 'Working…' : dirty ? 'Modified' : bundle ? 'Saved' : 'No project'}</span>
    </nav>

    <section className="mv-toolbar" aria-label="Toolbar editor">
      {/* 1. File Group */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.New />} label="New Project (Ctrl+N)" disabled={busy} onClick={() => guardDirty(openNewProjectModal, 'Buat Proyek')} />
        <ToolButton icon={<MZIcons.Open />} label="Open Project (Ctrl+O)" disabled={busy} onClick={() => guardDirty(() => handleOpenProject(), 'Buka Proyek')} />
        <ToolButton icon={<MZIcons.Save />} label="Save Project (Ctrl+S)" active={dirty} disabled={!bundle || !dirty || busy} onClick={handleSaveProject} />
      </div>

      <span className="mz-tool-divider" />

      {/* 2. Clipboard Group */}
      <div className="mv-tool-group">
        <ToolButton icon={<MZIcons.Cut />} label="Cut (Ctrl+X)" disabled={!bundle || (mode === 'event' && !selectedEvent)} onClick={handleCutEvent} />
        <ToolButton icon={<MZIcons.Copy />} label="Copy (Ctrl+C)" disabled={!bundle || (mode === 'event' && !selectedEvent)} onClick={copyEvent} />
        <ToolButton icon={<MZIcons.Paste />} label="Paste (Ctrl+V)" disabled={!bundle || (mode === 'event' && !clipboard)} onClick={pasteEvent} />
        <ToolButton icon={<MZIcons.Delete />} label="Delete (Del)" disabled={!bundle || (mode === 'event' && !selectedEvent)} onClick={handleDeleteEvent} />
        <ToolButton icon={<MZIcons.Undo />} label="Undo (Ctrl+Z)" disabled={!past.length} onClick={undo} />
        <ToolButton icon={<MZIcons.Redo />} label="Redo (Ctrl+Y / Ctrl+Shift+Z)" disabled={!future.length} onClick={redo} />
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
            <ToolButton icon={<MZIcons.Pencil />} label="Pencil" active={mapTool === 'pencil'} onClick={() => { setMapTool('pencil'); setRectangleStart(null); }} />
            <ToolButton icon={<MZIcons.Rectangle />} label="Rectangle" active={mapTool === 'rectangle'} onClick={() => { setMapTool('rectangle'); setRectangleStart(null); }} />
            <ToolButton icon={<MZIcons.Circle />} label="Circle" active={mapTool === 'circle'} onClick={() => { setMapTool('circle'); setRectangleStart(null); }} />
            <ToolButton icon={<MZIcons.Fill />} label="Flood Fill" active={mapTool === 'fill'} onClick={() => { setMapTool('fill'); setRectangleStart(null); }} />
            <ToolButton icon={<MZIcons.Shadow />} label="Shadow Pen" active={mapTool === 'shadow'} onClick={() => { setMapTool('shadow'); setRectangleStart(null); }} />
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
        <ToolButton icon={<MZIcons.Playtest />} label="Playtest (F6)" primary disabled={!canPlay} onClick={() => void api.playtest({ mapId: selectedMap, debug: true })} />
      </div>
    </section>

    <section className="mv-workspace mz-layout">
      <aside className="mv-sidebar mv-project-pane">
        {mode === 'map' ? (
          <div className="mz-tile-pane">
            <div className="mz-tile-palette-body">
              <MapPaletteCanvas
                paletteGroup={paletteGroup}
                paletteTiles={paletteTiles}
                selectedTile={selectedTile}
                onSelectTile={(tileId) => {
                  setSelectedTile(tileId);
                  setMapTool(tileId === 0 ? 'eraser' : 'pencil');
                }}
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
                    onClick={() => setPaletteGroup(targetGroup)}
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
              <button className="mz-mini-add-btn" onClick={addEvent}>＋ New</button>
            </div>
            <div className="mz-events-list">
              {map?.events.map(event => (
                <button
                  className={event.id === selectedEvent ? 'selected' : ''}
                  key={event.id}
                  onClick={() => { openEvent(event.id); setSelectedCell({ x: event.x, y: event.y }); }}
                  onDoubleClick={() => { openEvent(event.id); setSelectedCell({ x: event.x, y: event.y }); setModal('eventEditor'); }}
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
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (bundle && bundle.project.maps.length > 0) {
              setMapContextMenu({ x: e.clientX, y: e.clientY, mapId: selectedMap || bundle.project.maps[0] });
            }
          }}
        >
          <div className="mz-tree-container">
            <div
              className="mz-tree-root"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (bundle && bundle.project.maps.length > 0) {
                  setMapContextMenu({ x: e.clientX, y: e.clientY, mapId: selectedMap || bundle.project.maps[0] });
                }
              }}
            >
              <span className="mz-tree-expander">－</span>
              <MZIcons.ProjectFolder />
              <b>{bundle.project.title}</b>
            </div>
            <div className="mz-tree-list">
              {bundle.project.maps.map((id, index) => (
                <button
                  className={`mz-tree-item ${id === selectedMap ? 'selected' : ''}`}
                  key={id}
                  onClick={() => chooseMap(id)}
                  onDoubleClick={() => handleOpenMapProperties(id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    chooseMap(id);
                    setMapContextMenu({ x: e.clientX, y: e.clientY, mapId: id });
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

      <section className="mv-document-area">
        <div className="mv-document-tabs">
          <button className="active"><span>{mode === 'map' ? '▦' : mode === 'event' ? '◆' : '⌕'}</span>{mode === 'map' ? map?.name ?? 'Map' : mode === 'event' ? currentEvent?.name ?? 'Event Editor' : 'Reference Search'}{dirty && <i>●</i>}</button>
        </div>

        {!map ? <div className="mv-welcome"><div className="mv-welcome-logo">N</div><h1>{bundle.project.title}</h1><p>Pilih map dari panel proyek untuk mulai menyunting.</p></div> : <div className="mv-document">
          {(mode === 'map' || mode === 'event') && (
            <div
              className="mv-map-viewport full-canvas"
              onMouseLeave={() => {
                const coordEl = document.getElementById('mz-status-coord-display');
                if (coordEl) coordEl.textContent = '';
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
                    className={`mv-map-grid ${mode === 'event' ? 'event-grid-mode' : 'map-mode-clean'} ${activeLayer !== 'auto' ? 'layer-focus' : ''}`}
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
                        return (
                          <button
                            title={mode === 'event'
                              ? `${x}, ${y}${marker ? ` — ${marker.name}` : ' (Kosong)'} · Double click untuk ${marker ? 'edit' : 'buat'} event`
                              : `${x}, ${y}${marker ? ` — ${marker.name}` : ''} · Right-click to pick tile`}
                            className={`${cell ? 'blocked' : ''} ${marker ? 'has-event' : ''} ${marker?.id === selectedEvent || isSelected ? 'selected' : ''} ${isSelected && mode === 'event' ? 'cell-selected' : ''} ${rectangleStart?.x === x && rectangleStart.y === y ? 'rectangle-origin' : ''}`}
                            key={index}
                            onDragStart={e => e.preventDefault()}
                            onMouseDown={(e) => {
                              if (e.button === 0) {
                                if (mode === 'map') {
                                  if (mapTool === 'pencil' || mapTool === 'eraser' || mapTool === 'shadow') {
                                    const curr = bundleRef.current || bundle;
                                    if (curr) {
                                      isMouseDownRef.current = true;
                                      strokeInitialBundleRef.current = clone(curr);
                                      activeStrokeBundleRef.current = clone(curr);
                                      strokeModifiedRef.current = false;
                                      applyPaint(x, y, true);
                                    }
                                  }
                                }
                              }
                            }}
                            onMouseEnter={() => {
                              const coordEl = document.getElementById('mz-status-coord-display');
                              if (coordEl) coordEl.textContent = `(X: ${x}, Y: ${y})`;
                              if (isMouseDownRef.current && mode === 'map') {
                                if (mapTool === 'pencil' || mapTool === 'eraser' || mapTool === 'shadow') {
                                  applyPaint(x, y, true);
                                }
                              }
                            }}
                            onClick={() => {
                              if (mode === 'event' || mapTool === 'collision' || mapTool === 'fill' || mapTool === 'rectangle' || mapTool === 'circle') {
                                handleMapCell(x, y, marker);
                              }
                            }}
                            onDoubleClick={() => handleCellDoubleClick(x, y, marker)}
                            onContextMenu={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (mode === 'map') {
                                pickTile(x, y);
                              } else {
                                setSelectedCell({ x, y });
                                if (marker) {
                                  selectEvent(marker.id);
                                }
                                setCellContextMenu({ x: event.clientX, y: event.clientY, cellX: x, cellY: y, marker });
                              }
                            }}
                          >
                            {mapTool === 'collision' && cell ? <span className="collision-mark">×</span> : null}
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
                            {marker && (() => {
                              let eventSprite: string | null = null;
                              let bgPos = '-48px 0px';
                              let bgSize = '576px 384px';
                              const lowerName = marker.name.toLowerCase();
                              const lowerId = marker.id.toLowerCase();

                              if (lowerId.includes('gate') || lowerName.includes('gerbang') || lowerName.includes('pintu')) {
                                eventSprite = assetUrls['assets/characters/Door1.png'];
                                bgPos = '-48px 0px';
                              } else if (lowerId.includes('chest') || lowerName.includes('peti')) {
                                eventSprite = assetUrls['assets/characters/Chest.png'];
                                bgPos = '-48px 0px';
                                bgSize = '144px 192px';
                              } else if (lowerId.includes('guide') || lowerName.includes('penjaga')) {
                                eventSprite = assetUrls['assets/characters/Actor2.png'];
                                bgPos = '-48px 0px';
                              }

                              return (
                                <span
                                  className={`mv-event-marker ${eventSprite ? 'textured-event' : ''}`}
                                  style={eventSprite ? {
                                    backgroundImage: `url("${eventSprite}")`,
                                    backgroundPosition: bgPos,
                                    backgroundSize: bgSize,
                                    imageRendering: 'pixelated'
                                  } : undefined}
                                >
                                  {!eventSprite && '◆'}
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

          {mode === 'search' && <div className="mv-search-view"><div className="mv-view-header"><div><span className="mv-kicker">PROJECT TOOLS</span><h2>Reference Search</h2><p>Find IDs, names, switches, items, and references across the project.</p></div></div><div className="mv-search-box"><span>⌕</span><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search project references…" /></div><div className="mv-results"><div className="mv-results-title">{query ? `${references.length} results` : 'Enter a search term'}</div>{references.map(hit => <article key={hit.path}><code>{hit.path}</code><p>{hit.preview}</p></article>)}{query && !references.length && <div className="mv-blank-state"><span>⌕</span><p>No references found</p></div>}</div></div>}
        </div>}
      </section>

      {showInspector && (
        <aside className="mv-sidebar mv-inspector">
          <div className="mv-pane-title"><strong>Inspector</strong><span>Properties</span></div>
          {bundle && map ? <div className="mv-inspector-content">
            <section><h3>Project</h3><dl><dt>Title</dt><dd>{bundle.project.title}</dd><dt>Project ID</dt><dd title={bundle.project.projectId}>{bundle.project.projectId}</dd><dt>Resolution</dt><dd>{bundle.project.logicalResolution.width} × {bundle.project.logicalResolution.height}</dd></dl></section>
            <section><h3>Map Properties</h3><dl><dt>Name</dt><dd>{map.name}</dd><dt>ID</dt><dd title={map.id}>{map.id}</dd><dt>Size</dt><dd>{map.width} × {map.height}</dd><dt>Tile Size</dt><dd>{map.tileSize}px</dd><dt>Events</dt><dd>{map.events.length}</dd></dl></section>
            <section className="mv-layer-inspector"><h3>Map Layers <button onClick={()=>setActiveLayer('auto')}>Auto</button></h3>{map.layers.map((layer,index)=><div className={activeLayer===index?'active':''} key={layer.id}><button className="layer-name" onClick={()=>setActiveLayer(index as 0|1|2|3)}><b>{index+1}</b><span>{layer.name}</span><small>{layer.data.filter(Boolean).length} tiles</small></button><button className={visibleLayers[index]?'enabled':''} title={visibleLayers[index]?'Hide layer':'Show layer'} onClick={()=>setVisibleLayers(values=>values.map((value,i)=>i===index?!value:value))}>{visibleLayers[index]?'◉':'○'}</button><button className={lockedLayers[index]?'enabled':''} title={lockedLayers[index]?'Unlock layer':'Lock layer'} onClick={()=>setLockedLayers(values=>values.map((value,i)=>i===index?!value:value))}>{lockedLayers[index]?'▣':'□'}</button><button title="Clear layer" disabled={lockedLayers[index]||!layer.data.some(Boolean)} onClick={()=>clearLayer(index)}>×</button></div>)}</section>
            {currentEvent && <section className="mv-event-properties"><h3>Selected Event</h3><dl><dt>Name</dt><dd>{currentEvent.name}</dd><dt>Position</dt><dd>{currentEvent.x}, {currentEvent.y}</dd><dt>Trigger</dt><dd>{currentEvent.trigger}</dd><dt>Pages</dt><dd>{currentEvent.pages.length}</dd></dl><button onClick={() => setMode('event')}>Open Event Editor</button></section>}
            <section className="mv-validation"><h3>Validation <button onClick={() => setMode('search')}>Search</button></h3><div className="mv-validation-summary"><span className={errorCount ? 'bad' : 'good'}><b>{errorCount}</b> errors</span><span className={warningCount ? 'warn' : 'good'}><b>{warningCount}</b> warnings</span></div>{diagnostics.slice(0, 5).map((issue, index) => <article className={issue.severity} key={`${issue.path}-${index}`}><b>{issue.message}</b><small>{issue.path}</small></article>)}{!diagnostics.length && <p className="mv-valid">✓ Project references are valid</p>}</section>
          </div> : <div className="mv-empty-pane"><span>ⓘ</span><p>Open a project to inspect its properties.</p></div>}
        </aside>
      )}
    </section>

    <footer className="mz-statusbar" role="status">
      <div className="mz-status-cell mz-status-map">
        {map ? `${String(bundle.project.maps.indexOf(map.id) + 1).padStart(3, '0')}:${map.name} (${map.width}x${map.height})` : '001:MAP001 (17x13)'}
      </div>
      <div className="mz-status-cell mz-status-zoom">
        {zoom}%
      </div>
      <div className="mz-status-cell mz-status-layer">
        {activeLayer === 'auto' ? 'Automatic' : `Layer ${activeLayer + 1}`}
      </div>
      <div id="mz-status-coord-display" className="mz-status-cell mz-status-coord" />
      <div className="mz-status-cell mz-status-msg">
        <span className={`mv-status-light ${errorCount ? 'error' : dirty ? 'dirty' : ''}`} />
        <span>{message}</span>
      </div>
    </footer>

    {mapContextMenu && (
      <div
        className="mv-context-menu"
        style={{ left: `${mapContextMenu.x}px`, top: `${mapContextMenu.y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => { handleOpenMapProperties(mapContextMenu.mapId); setMapContextMenu(null); }}>
          <span>Edit...</span>
          <kbd>Space</kbd>
        </button>
        <button onClick={() => { handleCreateNewMap(); setMapContextMenu(null); }}>
          <span>New...</span>
          <kbd>Return</kbd>
        </button>
        <button onClick={() => { openToolPlaceholder('Load Map', 'Memuat peta dari daftar preset bawaan.'); setMapContextMenu(null); }}>
          <span>Load...</span>
        </button>
        <hr />
        <button onClick={() => { handleCopyMap(mapContextMenu.mapId); setMapContextMenu(null); }}>
          <span>Copy</span>
          <kbd>Ctrl+C</kbd>
        </button>
        <button disabled={!copiedMap} onClick={() => { handlePasteMap(); setMapContextMenu(null); }}>
          <span>Paste</span>
          <kbd>Ctrl+V</kbd>
        </button>
        <button disabled={!bundle || bundle.project.maps.length <= 1} onClick={() => { handleDeleteMap(mapContextMenu.mapId); setMapContextMenu(null); }}>
          <span>Delete</span>
          <kbd>Del</kbd>
        </button>
        <hr />
        <button onClick={() => { setMode('search'); setMapContextMenu(null); }}>
          <span>Find...</span>
          <kbd>Ctrl+F</kbd>
        </button>
        <button disabled={true}>
          <span>Find Next</span>
          <kbd>F3</kbd>
        </button>
        <button disabled={true}>
          <span>Find Previous</span>
          <kbd>Shift+F3</kbd>
        </button>
        <hr />
        <button onClick={() => { handleOpenShiftModal(mapContextMenu.mapId); setMapContextMenu(null); }}>
          <span>Shift...</span>
          <kbd>Ctrl+T</kbd>
        </button>
        <button onClick={() => { handleOpenGenerateDungeon(); setMapContextMenu(null); }}>
          <span>Generate Dungeon...</span>
          <kbd>Ctrl+D</kbd>
        </button>
        <button onClick={() => { setMessage(`Peta "${bundle?.maps[mapContextMenu.mapId]?.name || ''}" siap diekspor sebagai gambar.`); setMapContextMenu(null); }}>
          <span>Save as Image...</span>
        </button>
      </div>
    )}

    {cellContextMenu && (
      <div
        className="mv-context-menu"
        style={{ left: `${cellContextMenu.x}px`, top: `${cellContextMenu.y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => {
          createEventAt(cellContextMenu.cellX, cellContextMenu.cellY);
          setCellContextMenu(null);
        }}>
          <span>New...</span>
          <kbd>Return</kbd>
        </button>
        <button
          disabled={!cellContextMenu.marker}
          onClick={() => {
            if (cellContextMenu.marker) {
              selectEvent(cellContextMenu.marker.id);
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
              setClipboard(clone(cellContextMenu.marker));
              removeEvent(cellContextMenu.marker.id);
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
              setClipboard(clone(cellContextMenu.marker));
              setMessage(`Event "${cellContextMenu.marker.name}" disalin.`);
            }
            setCellContextMenu(null);
          }}
        >
          <span>Copy</span>
          <kbd>Ctrl+C</kbd>
        </button>
        <button
          disabled={!clipboard}
          onClick={() => {
            if (clipboard && map) {
              let n = 1;
              while (map.events.some(e => e.id === `event.copy-${n}`)) n++;
              const pasted: MapEvent = {
                ...clone(clipboard),
                id: `event.copy-${n}`,
                name: `${clipboard.name} (Copy)`,
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
              removeEvent(cellContextMenu.marker.id);
            }
            setCellContextMenu(null);
          }}
        >
          <span>Delete</span>
          <kbd>Del</kbd>
        </button>
        <hr />
        <div className="mv-menu-section-title">Quick Event Creation</div>
        <button onClick={() => {
          setQuickTargetMap(bundle?.project.maps[0] || map?.id || '');
          setQuickTargetX(0);
          setQuickTargetY(0);
          setModal('quickTransfer');
          setCellContextMenu(null);
        }}>
          <span>Quick Transfer...</span>
        </button>
        <button onClick={() => {
          setQuickTargetMap(bundle?.project.maps[0] || map?.id || '');
          setQuickTargetX(0);
          setQuickTargetY(0);
          setModal('quickDoor');
          setCellContextMenu(null);
        }}>
          <span>Quick Door...</span>
        </button>
        <button onClick={() => {
          setQuickChestType('gold');
          setQuickChestAmount(100);
          setQuickChestItem(bundle?.game.items[0]?.id || '');
          setModal('quickChest');
          setCellContextMenu(null);
        }}>
          <span>Quick Treasure Chest...</span>
        </button>
        <button onClick={() => {
          setQuickInnPrice(10);
          setModal('quickInn');
          setCellContextMenu(null);
        }}>
          <span>Quick Inn...</span>
        </button>
        <hr />
        <button onClick={() => handleSetStartingPosition(cellContextMenu.cellX, cellContextMenu.cellY)}>
          <span>Set Starting Position: Player</span>
        </button>
      </div>
    )}

    {renderModals()}
  </main>;
}
