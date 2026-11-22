import { useEffect, useMemo, useState } from 'react';
import { analyzeBundle, findReferences } from '../core/diagnostics.js';
import { autotileMask, floodFillLayer, layerForTile, paintLayerCell, paintLayerRectangle, TILE_CATALOG, type LayerSelection } from '../core/map-layers.js';
import type { EventCommand, MapEvent, ProjectBundle } from '../core/types.js';
import type { ImportReport } from '../global.js';

type Collection = 'actors' | 'enemies' | 'equipment' | 'skills' | 'states' | 'troops' | 'items' | 'classes' | 'quests' | 'shops';
type EditorMode = 'map' | 'event' | 'database' | 'search';
type MapTool = 'pencil' | 'rectangle' | 'eraser' | 'fill' | 'collision' | 'event';

const collections: Collection[] = ['actors', 'enemies', 'equipment', 'skills', 'states', 'troops', 'items', 'classes', 'quests', 'shops'];
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
  glyph: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
}

function ToolButton({ glyph, label, active, disabled, primary, onClick }: ToolButtonProps) {
  return <button className={`mv-tool ${active ? 'active' : ''} ${primary ? 'play' : ''}`} disabled={disabled} onClick={onClick} title={label}>
    <span aria-hidden="true">{glyph}</span><small>{label}</small>
  </button>;
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

function RecordForm({ collection, record, bundle, onChange }: { collection: Collection; record: Record<string, unknown>; bundle: ProjectBundle; onChange: (key: string, value: unknown) => void }) {
  const field = (label: string, key: string, input: React.ReactNode) => <label className="mv-form-field"><span>{label}</span>{input}</label>;
  const numberInput = (key: string, value: unknown, min?: number) => <input type="number" min={min ?? undefined} value={value == null ? '' : String(value)} onChange={event => onChange(key, Number(event.target.value))} />;
  const textInput = (key: string, value: unknown) => <input value={value == null ? '' : String(value)} onChange={event => onChange(key, event.target.value)} />;
  const selectInput = (key: string, value: unknown, options: Array<{ value: string; label: string }>) => <select value={String(value ?? '')} onChange={event => onChange(key, event.target.value)}>{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>;
  const checkbox = (key: string, value: unknown) => <input type="checkbox" checked={Boolean(value)} onChange={event => onChange(key, event.target.checked)} />;

  if (collection === 'actors') {
    const stats = (record.stats as Record<string, number> ?? {}) as Record<string, number>;
    const base = (record.base as Record<string, number> ?? {}) as Record<string, number>;
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      <div className="mv-form-section"><h4>Base Stats</h4>
        {['str','int','dex','luk','agi','vit'].map(k => field(k.toUpperCase(), `stats.${k}`, numberInput(`stats.${k}`, stats[k], 0)))}
      </div>
      <div className="mv-form-section"><h4>Combat Base</h4>
        {['hp','mp','atk','def','mat','mdf','agi'].map(k => field(k.toUpperCase(), `base.${k}`, numberInput(`base.${k}`, base[k], 0)))}
      </div>
      {field('Weapon Type', 'weaponType', selectInput('weaponType', record.weaponType, [{value:'melee',label:'Melee'},{value:'finesse',label:'Finesse'},{value:'ranged',label:'Ranged'}]))}
      {field('Class ID', 'classId', textInput('classId', record.classId))}
      {field('Class Tier', 'classTier', selectInput('classTier', record.classTier, [{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'}]))}
      {field('Skill IDs', 'skillIds', textInput('skillIds', Array.isArray(record.skillIds) ? record.skillIds.join(',') : ''))}
      <small className="mv-form-hint">Skill IDs dipisahkan koma.</small>
    </div>;
  }

  if (collection === 'classes') {
    const growth = (record.growth as Record<string, number> ?? {}) as Record<string, number>;
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Tier', 'tier', selectInput('tier', record.tier, [{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'}]))}
      <div className="mv-form-section"><h4>Growth (Base Stats)</h4>
        {['str','int','dex','luk','agi','vit'].map(k => field(k.toUpperCase(), `growth.${k}`, numberInput(`growth.${k}`, growth[k], 0)))}
      </div>
    </div>;
  }

  if (collection === 'skills') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Kind', 'kind', selectInput('kind', record.kind, [{value:'physical',label:'Physical'},{value:'magical',label:'Magical'},{value:'heal',label:'Heal'},{value:'revive',label:'Revive'}]))}
      {field('Power', 'power', numberInput('power', record.power, 0))}
      {field('MP Cost', 'mpCost', numberInput('mpCost', record.mpCost, 0))}
      {field('SP Cost', 'spCost', numberInput('spCost', record.spCost, 0))}
      {field('Speed', 'speed', numberInput('speed', record.speed, 0))}
      {field('Target', 'target', selectInput('target', record.target, [{value:'enemy',label:'Enemy'},{value:'ally',label:'Ally'}]))}
      {field('Element', 'element', textInput('element', record.element))}
      {field('State ID', 'stateId', textInput('stateId', record.stateId))}
      {field('State Chance', 'stateChance', numberInput('stateChance', record.stateChance, 0))}
    </div>;
  }

  if (collection === 'items') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Kind', 'kind', selectInput('kind', record.kind, [{value:'key',label:'Key'},{value:'heal',label:'Heal'},{value:'revive',label:'Revive'},{value:'stat-reset',label:'Stat Reset'}]))}
      {field('Heal HP', 'healHp', numberInput('healHp', record.healHp, 0))}
      {field('Revive HP Ratio', 'reviveHpRatio', numberInput('reviveHpRatio', record.reviveHpRatio, 0))}
    </div>;
  }

  if (collection === 'equipment') {
    const stats = (record.stats as Record<string, number> ?? {}) as Record<string, number>;
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Slot', 'slot', selectInput('slot', record.slot, [{value:'weapon',label:'Weapon'},{value:'head',label:'Head'},{value:'body',label:'Body'},{value:'accessory',label:'Accessory'}]))}
      {field('Weapon Type', 'weaponType', selectInput('weaponType', record.weaponType, [{value:'melee',label:'Melee'},{value:'finesse',label:'Finesse'},{value:'ranged',label:'Ranged'}]))}
      <div className="mv-form-section"><h4>Stat Bonuses</h4>
        {['str','int','dex','luk','agi','vit'].map(k => field(k.toUpperCase(), `stats.${k}`, numberInput(`stats.${k}`, stats[k], 0)))}
      </div>
    </div>;
  }

  if (collection === 'enemies') {
    const stats = (record.stats as Record<string, number> ?? {}) as Record<string, number>;
    const base = (record.base as Record<string, number> ?? {}) as Record<string, number>;
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      <div className="mv-form-section"><h4>Base Stats</h4>
        {['str','int','dex','luk','agi','vit'].map(k => field(k.toUpperCase(), `stats.${k}`, numberInput(`stats.${k}`, stats[k], 0)))}
      </div>
      <div className="mv-form-section"><h4>Combat Base</h4>
        {['hp','mp','atk','def','mat','mdf','agi'].map(k => field(k.toUpperCase(), `base.${k}`, numberInput(`base.${k}`, base[k], 0)))}
      </div>
      {field('AI', 'ai', selectInput('ai', record.ai, [{value:'aggressive',label:'Aggressive'},{value:'caster',label:'Caster'},{value:'guardian',label:'Guardian'}]))}
      <small className="mv-form-hint">Reward dan boss phases dapat diedit melalui JSON.</small>
    </div>;
  }

  if (collection === 'states') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Duration (turns)', 'duration', numberInput('duration', record.duration, 1))}
      {field('PDR', 'pdr', numberInput('pdr', record.pdr, 0))}
      {field('MDR', 'mdr', numberInput('mdr', record.mdr, 0))}
      {field('Damage Per Turn', 'damagePerTurn', numberInput('damagePerTurn', record.damagePerTurn, 0))}
      {field('Prevents Action', 'preventsAction', checkbox('preventsAction', record.preventsAction))}
    </div>;
  }

  if (collection === 'troops') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Enemy IDs', 'enemyIds', textInput('enemyIds', Array.isArray(record.enemyIds) ? record.enemyIds.join(',') : ''))}
      <small className="mv-form-hint">Enemy IDs dipisahkan koma.</small>
    </div>;
  }

  if (collection === 'quests') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      {field('Description', 'description', textInput('description', record.description))}
      <small className="mv-form-hint">Objectives dan rewards dapat diedit melalui JSON.</small>
    </div>;
  }

  if (collection === 'shops') {
    return <div className="mv-form-grid">
      {field('ID', 'id', textInput('id', record.id))}
      {field('Name', 'name', textInput('name', record.name))}
      <small className="mv-form-hint">Item daftar dapat diedit melalui JSON.</small>
    </div>;
  }

  return <div className="mv-form-grid">{field('ID', 'id', textInput('id', record.id))}{field('Name', 'name', textInput('name', record.name))}</div>;
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
  const [paletteGroup, setPaletteGroup] = useState<'A'|'B'|'C'|'D'>('A');
  const [rectangleStart, setRectangleStart] = useState<{x:number;y:number}|null>(null);
  const [eventView, setEventView] = useState<'visual'|'json'>('visual');
  const [eventPage, setEventPage] = useState(0);
  const [newCommandType, setNewCommandType] = useState<EventCommand['type']>('text');
  const [zoom, setZoom] = useState(100);
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

  const diagnostics = useMemo(() => bundle ? analyzeBundle(bundle) : [], [bundle]);
  const references = useMemo(() => bundle ? findReferences(bundle, query) : [], [bundle, query]);
  const map = bundle?.maps[selectedMap];
  const currentEvent = map?.events.find(event => event.id === selectedEvent);
  const errorCount = diagnostics.filter(issue => issue.severity === 'error').length;
  const warningCount = diagnostics.filter(issue => issue.severity === 'warning').length;
  const canPlay = Boolean(bundle?.root && !dirty && !busy && !errorCount);
  const parsedEvent=useMemo(()=>{try{return JSON.parse(eventDraft) as MapEvent;}catch{return undefined;}},[eventDraft]);

  const commit = (next: ProjectBundle, status = 'Perubahan diterapkan.') => {
    if (bundle) setPast(items => [...items.slice(-49), clone(bundle)]);
    setFuture([]);
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
      if (value) accept(value, success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (!bundle || !past.length) return;
    const previous = past.at(-1)!;
    setPast(past.slice(0, -1));
    setFuture(items => [clone(bundle), ...items].slice(0, 50));
    setBundle(previous);
    setDirty(true);
    setMessage('Undo diterapkan.');
  };

  const redo = () => {
    if (!bundle || !future.length) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast(items => [...items, clone(bundle)].slice(-50));
    setBundle(next);
    setDirty(true);
    setMessage('Redo diterapkan.');
  };

  const toggleTile = (x: number, y: number) => {
    if (!bundle || !map) return;
    const collision = [...map.collision];
    collision[y * map.width + x] = collision[y * map.width + x] === 1 ? 0 : 1;
    commit({ ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, collision } } }, `Collision (${x}, ${y}) diubah.`);
  };

  const drawTile = (x:number,y:number) => {
    if(!bundle||!map)return;
    const tileId=mapTool==='eraser'?0:selectedTile;
    const layerIndex=layerForTile(tileId,activeLayer);
    if(lockedLayers[layerIndex])return setMessage(`Layer ${layerIndex+1} terkunci.`);
    if(mapTool==='rectangle'){
      if(!rectangleStart){setRectangleStart({x,y});setMessage(`Awal rectangle: (${x}, ${y}). Pilih sudut akhir.`);return;}
      const layers=paintLayerRectangle(map.layers,layerIndex,rectangleStart.x,rectangleStart.y,x,y,tileId,map.width);
      setRectangleStart(null);
      commit({...bundle,maps:{...bundle.maps,[map.id]:{...map,layers}}},`Rectangle diterapkan pada Layer ${layerIndex+1}.`);
      return;
    }
    const cellIndex=y*map.width+x;
    const layers=mapTool==='fill'
      ?floodFillLayer(map.layers,layerIndex,cellIndex,tileId,map.width,map.height)
      :paintLayerCell(map.layers,layerIndex,cellIndex,tileId);
    if(layers===map.layers||layers[layerIndex].data[cellIndex]===map.layers[layerIndex].data[cellIndex])return;
    commit({...bundle,maps:{...bundle.maps,[map.id]:{...map,layers}}},`${mapTool==='fill'?'Fill':'Tile'} diterapkan pada Layer ${layerIndex+1}.`);
  };

  const handleMapCell = (x:number,y:number,marker?:MapEvent) => {
    if(mapTool==='event')return marker?openEvent(marker.id):setMessage(`Tidak ada event pada (${x}, ${y}).`);
    if(mapTool==='collision')return toggleTile(x,y);
    drawTile(x,y);
  };

  const pickTile = (x:number,y:number) => {
    if(!map)return;
    const cell=y*map.width+x;
    const layerIndex=activeLayer==='auto'?[3,2,1,0].find(index=>visibleLayers[index]&&map.layers[index].data[cell]!==0)??0:activeLayer;
    const tileId=map.layers[layerIndex].data[cell];
    setSelectedTile(tileId);setPaletteGroup(TILE_CATALOG.find(tile=>tile.id===tileId)?.group??'A');setMapTool(tileId===0?'eraser':'pencil');
    setMessage(`${TILE_CATALOG.find(tile=>tile.id===tileId)?.name??`Tile ${tileId}`} diambil dari Layer ${layerIndex+1}.`);
  };

  const clearLayer = (layerIndex:number) => {
    if(!bundle||!map||lockedLayers[layerIndex])return setMessage(`Layer ${layerIndex+1} terkunci.`);
    if(!map.layers[layerIndex].data.some(Boolean))return setMessage(`Layer ${layerIndex+1} sudah kosong.`);
    const layers=map.layers.map((layer,index)=>index===layerIndex?{...layer,data:Array(map.width*map.height).fill(0)}:layer);
    commit({...bundle,maps:{...bundle.maps,[map.id]:{...map,layers}}},`Layer ${layerIndex+1} dikosongkan.`);
  };

  const addEvent = () => {
    if (!bundle || !map) return;
    const index = map.collision.findIndex((cell, i) => cell === 0 && !map.events.some(event => event.x === i % map.width && event.y === Math.floor(i / map.width)));
    if (index < 0) return setMessage('Tidak ada tile kosong untuk event baru.');
    let n = 1;
    while (map.events.some(event => event.id === `event.new-${n}`)) n++;
    const value: MapEvent = { id: `event.new-${n}`, name: `Event ${n}`, x: index % map.width, y: Math.floor(index / map.width), trigger: 'interact', pages: [{ solid: true, commands: [{ type: 'text', text: 'Event baru.' }] }] };
    const next = { ...bundle, maps: { ...bundle.maps, [map.id]: { ...map, events: [...map.events, value] } } };
    commit(next, `${value.name} ditambahkan.`);
    selectEvent(value.id, next);
    setMode('event');
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
        setMode('database');
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
        if (bundle && dirty && !busy) void run(() => api!.saveProject(bundle), 'Proyek disimpan aman.');
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); undo();
      } else if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); redo();
      } else if (!editing && event.key === 'F6' && canPlay) {
        event.preventDefault(); void api!.playtest({ mapId: selectedMap, debug: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!api) return <main className="editor-shell"><section className="error-card">NUSV Engine harus dijalankan sebagai aplikasi desktop.</section></main>;

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
      <div className="mv-brand"><span className="mv-brand-mark">N</span><strong>NUSV Engine</strong><span>— {bundle?.project.title ?? 'Project Manager'}</span>{dirty && <i>*</i>}</div>
      <div className="mv-window-caption">Nusvanir JRPG Development Environment</div>
    </div>

    <nav className="mv-menubar" aria-label="Menu utama">
      <details className="mv-menu"><summary>File</summary><div><button onClick={() => void run(() => api.createProject('NUSV Project'), 'Proyek baru siap.')}>New Project</button><button onClick={() => void run(api.openProject, 'Proyek dibuka dan divalidasi.')}>Open Project…</button><button disabled={!bundle || !dirty || busy} onClick={() => void run(() => api.saveProject(bundle!), 'Proyek disimpan aman.')}>Save Project <kbd>Ctrl+S</kbd></button></div></details>
      <details className="mv-menu"><summary>Edit</summary><div><button disabled={!past.length} onClick={undo}>Undo <kbd>Ctrl+Z</kbd></button><button disabled={!future.length} onClick={redo}>Redo <kbd>Ctrl+Y</kbd></button><button disabled={!selectedEvent} onClick={() => void copyEvent()}>Copy Event</button><button disabled={!clipboard} onClick={pasteEvent}>Paste Event</button></div></details>
      <details className="mv-menu"><summary>Mode</summary><div><button onClick={() => setMode('map')}>Map</button><button onClick={() => setMode('event')}>Events</button><button onClick={() => setMode('database')}>Database</button><button onClick={() => setMode('search')}>Search</button></div></details>
      <details className="mv-menu"><summary>Tools</summary><div><button disabled={!bundle || busy} onClick={() => void importMv()}>Import RPG Maker MV Subset…</button><button onClick={() => setMode('search')}>Reference Search</button></div></details>
      <details className="mv-menu"><summary>Game</summary><div><button disabled={!canPlay} onClick={() => void api.playtest({ mapId: selectedMap, debug: true })}>Playtest <kbd>F6</kbd></button></div></details>
      <span className="mv-menu-spacer" />
      <span className={`mv-save-state ${dirty ? 'dirty' : ''}`}>{busy ? 'Working…' : dirty ? 'Modified' : bundle ? 'Saved' : 'No project'}</span>
    </nav>

    <section className="mv-toolbar" aria-label="Toolbar editor">
      <div className="mv-tool-group">
        <ToolButton glyph="＋" label="New" disabled={busy} onClick={() => void run(() => api.createProject('NUSV Project'), 'Proyek baru siap.')} />
        <ToolButton glyph="□" label="Open" disabled={busy} onClick={() => void run(api.openProject, 'Proyek dibuka dan divalidasi.')} />
        <ToolButton glyph="▣" label="Save" disabled={!bundle || !dirty || busy} onClick={() => void run(() => api.saveProject(bundle!), 'Proyek disimpan aman.')} />
      </div>
      <div className="mv-tool-group">
        <ToolButton glyph="↶" label="Undo" disabled={!past.length} onClick={undo} />
        <ToolButton glyph="↷" label="Redo" disabled={!future.length} onClick={redo} />
      </div>
      <div className="mv-tool-group mode-tools">
        <ToolButton glyph="▦" label="Map" active={mode === 'map'} disabled={!bundle} onClick={() => setMode('map')} />
        <ToolButton glyph="◆" label="Events" active={mode === 'event'} disabled={!bundle} onClick={() => setMode('event')} />
        <ToolButton glyph="▤" label="Database" active={mode === 'database'} disabled={!bundle} onClick={() => setMode('database')} />
        <ToolButton glyph="⌕" label="Search" active={mode === 'search'} disabled={!bundle} onClick={() => setMode('search')} />
      </div>
      <div className="mv-tool-group mv-play-group">
        <ToolButton glyph="▶" label="Playtest" primary disabled={!canPlay} onClick={() => void api.playtest({ mapId: selectedMap, debug: true })} />
      </div>
    </section>

    <section className="mv-workspace">
      <aside className="mv-sidebar mv-project-pane">
        <div className="mv-pane-title"><strong>Project</strong><span>{bundle ? bundle.project.maps.length : 0} maps</span></div>
        {bundle ? <div className="mv-tree">
          <div className="mv-tree-root"><span>▾</span><b>{bundle.project.title}</b></div>
          <div className="mv-tree-folder"><span>▾</span><b>Maps</b></div>
          {bundle.project.maps.map((id, index) => <button className={id === selectedMap ? 'selected' : ''} key={id} onClick={() => chooseMap(id)}><span className="tree-icon">▧</span><span>{String(index + 1).padStart(3, '0')}: {bundle.maps[id].name}</span></button>)}
          <div className="mv-tree-folder events"><span>▾</span><b>Events — {map?.name}</b></div>
          {map?.events.map(event => <button className={event.id === selectedEvent ? 'selected' : ''} key={event.id} onClick={() => openEvent(event.id)}><span className="event-dot">◆</span><span>{event.name}</span><small>{event.x}, {event.y}</small></button>)}
          {!map?.events.length && <p className="mv-empty-tree">No events on this map</p>}
        </div> : <div className="mv-empty-pane"><span>▧</span><p>No project loaded</p><button onClick={() => void run(() => api.createProject('NUSV Project'), 'Proyek baru siap.')}>Create Project</button></div>}
      </aside>

      <section className="mv-document-area">
        <div className="mv-document-tabs">
          <button className="active"><span>{mode === 'map' ? '▦' : mode === 'event' ? '◆' : mode === 'database' ? '▤' : '⌕'}</span>{mode === 'map' ? map?.name ?? 'Map' : mode === 'event' ? currentEvent?.name ?? 'Event Editor' : mode === 'database' ? 'Database' : 'Reference Search'}{dirty && <i>●</i>}</button>
        </div>

        {!bundle || !map ? <div className="mv-welcome">
          <div className="mv-welcome-logo">N</div><h1>NUSV Engine</h1><p>JRPG development environment for Nusvanir.</p>
          <div><button className="primary" onClick={() => void run(() => api.createProject('NUSV Project'), 'Proyek baru siap.')}>Create New Project</button><button onClick={() => void run(api.openProject, 'Proyek dibuka dan divalidasi.')}>Open Existing Project</button></div>
        </div> : <div className="mv-document">
          {mode === 'map' && <>
            <div className="mv-contextbar mv-map-tools">
              <div className="mv-segmented">
                <button className={mapTool==='pencil'?'active':''} onClick={()=>setMapTool('pencil')}>✎ Pencil</button>
                <button className={mapTool==='rectangle'?'active':''} onClick={()=>{setMapTool('rectangle');setRectangleStart(null);}}>□ Rectangle</button>
                <button className={mapTool==='eraser'?'active':''} onClick={()=>setMapTool('eraser')}>◇ Eraser</button>
                <button className={mapTool==='fill'?'active':''} onClick={()=>setMapTool('fill')}>▣ Fill</button>
                <button className={mapTool==='collision'?'active':''} onClick={()=>setMapTool('collision')}>▨ Collision</button>
                <button className={mapTool==='event'?'active':''} onClick={()=>setMapTool('event')}>◆ Events</button>
              </div>
              <div className="mv-layer-switcher" aria-label="Map layer selection">
                {(['auto',0,1,2,3] as LayerSelection[]).map(layer=><button className={activeLayer===layer?'active':''} key={String(layer)} onClick={()=>setActiveLayer(layer)}>{layer==='auto'?'Auto':`L${layer+1}`}</button>)}
              </div>
              <span className="mv-context-help">{activeLayer==='auto'?'Auto chooses a layer from the tile type':`Editing Layer ${activeLayer+1} only`} · Ctrl+Tab</span>
              <label className="mv-zoom">Zoom <select value={zoom} onChange={event => setZoom(Number(event.target.value))}><option>75</option><option>100</option><option>125</option><option>150</option></select>%</label>
            </div>
            <div className="mv-map-editor-layout">
              <aside className="mv-tile-palette">
                <div className="mv-palette-title"><b>Tile Palette</b><span>{TILE_CATALOG.find(tile=>tile.id===selectedTile)?.name}</span></div>
                <div className="mv-palette-tabs">{(['A','B','C','D'] as const).map(group=><button className={paletteGroup===group?'active':''} key={group} onClick={()=>setPaletteGroup(group)}>{group}</button>)}</div>
                <div className="mv-palette-grid">{TILE_CATALOG.filter(tile=>tile.group===paletteGroup&&(tile.id!==0||paletteGroup==='A')).map(tile=><button className={selectedTile===tile.id?'selected':''} key={tile.id} title={`${tile.name} · Auto Layer ${tile.defaultLayer+1}`} onClick={()=>{setSelectedTile(tile.id);setMapTool(tile.id===0?'eraser':'pencil');}} style={{'--tile-color':`#${tile.color.toString(16).padStart(6,'0')}`} as React.CSSProperties}><span>{tile.glyph}</span><small>{tile.name}</small></button>)}</div>
                <div className="mv-palette-note"><b>{activeLayer==='auto'?'Automatic placement':`Manual Layer ${activeLayer+1}`}</b><span>{activeLayer==='auto'?'A tile uses its assigned layer. B–D decorations stack above it.':'Only the selected layer will change.'}</span></div>
              </aside>
              <div className="mv-map-viewport">
                <div className="mv-map-stage" style={{ width: `${Math.max(520, map.width * 34 * zoom / 100)}px` }}>
                  <div className="mv-ruler horizontal">{Array.from({ length: map.width }, (_, x) => <span key={x}>{x}</span>)}</div>
                  <div className="mv-map-row"><div className="mv-ruler vertical">{Array.from({ length: map.height }, (_, y) => <span key={y}>{y}</span>)}</div>
                    <div className={`mv-map-grid ${activeLayer!=='auto'?'layer-focus':''}`} style={{ gridTemplateColumns: `repeat(${map.width}, minmax(20px, 1fr))` }}>
                      {map.collision.map((cell, index) => {
                        const x=index%map.width,y=Math.floor(index/map.width),marker=map.events.find(event=>event.x===x&&event.y===y);
                        return <button title={`${x}, ${y}${marker?` — ${marker.name}`:''} · Right-click to pick tile`} className={`${cell?'blocked':''} ${marker?'has-event':''} ${marker?.id===selectedEvent?'selected':''} ${rectangleStart?.x===x&&rectangleStart.y===y?'rectangle-origin':''}`} key={index} onClick={()=>handleMapCell(x,y,marker)} onContextMenu={event=>{event.preventDefault();pickTile(x,y);}}>
                          <span className="mv-tile-stack">{map.layers.map((layer,layerIndex)=>{const tileId=layer.data[index],tile=TILE_CATALOG.find(entry=>entry.id===tileId),mask=layerIndex===0?autotileMask(layer.data,index,map.width,map.height):15;const edges=[!(mask&1)?'inset 0 2px #ffffff55':'',!(mask&2)?'inset -2px 0 #00000030':'',!(mask&4)?'inset 0 -2px #00000045':'',!(mask&8)?'inset 2px 0 #ffffff35':''].filter(Boolean).join(',');return tileId!==0&&visibleLayers[layerIndex]?<i className={`map-layer layer-${layerIndex} ${activeLayer!=='auto'&&activeLayer!==layerIndex?'dimmed':''}`} key={layer.id} style={{'--tile-color':`#${(tile?.color??0).toString(16).padStart(6,'0')}`,boxShadow:edges} as React.CSSProperties}>{tile?.glyph}</i>:null;})}</span>
                          {mapTool==='collision'&&cell?<span className="collision-mark">×</span>:null}
                          {marker&&<span className="mv-event-marker">◆<small>{marker.name}</small></span>}
                        </button>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>}

          {mode === 'event' && <div className="mv-editor-view">
            <div className="mv-view-header"><div><span className="mv-kicker">EVENT EDITOR</span><h2>{currentEvent?.name ?? 'Select an event'}</h2><p>{currentEvent ? `${currentEvent.id} · (${currentEvent.x}, ${currentEvent.y}) · ${currentEvent.trigger}` : 'Choose an event from the Project panel or create a new one.'}</p></div><div className="mv-header-actions"><button onClick={addEvent}>＋ New Event</button><button disabled={!currentEvent} onClick={() => void copyEvent()}>Copy</button><button disabled={!clipboard} onClick={pasteEvent}>Paste</button><button disabled={!currentEvent} onClick={() => setEventView(eventView === 'visual' ? 'json' : 'visual')}>{eventView === 'visual' ? 'JSON' : 'Visual'}</button></div></div>
            {currentEvent
              ? eventView === 'visual'
                ? (
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
                )
                : (
                  <div className="mv-code-panel">
                    <div className="mv-code-title"><span>Event Data</span><code>{currentEvent.id}.json</code></div>
                    <textarea className="mv-code-editor" spellCheck={false} value={eventDraft} onChange={event => setEventDraft(event.target.value)} />
                    <div className="mv-applybar"><span>JSON preserves every runtime command and page condition.</span><button className="primary" onClick={applyEvent}>Apply Event</button></div>
                  </div>
                )
              : (
                <div className="mv-blank-state"><span>◆</span><p>No event selected</p><button onClick={addEvent}>Create Event</button></div>
              )}
          </div>}

          {mode === 'database' && <div className="mv-database-view">
            <aside className="mv-database-nav"><div className="mv-subtitle">Data Types</div>{collections.map(name => <button className={collection === name ? 'active' : ''} key={name} onClick={() => { selectCollection(name); setSelectedRecordIndex(null); setRecordView('form'); }}><span>▤</span>{collectionLabel(name)}<small>{Array.isArray(bundle.game[name]) ? bundle.game[name].length : 0}</small></button>)}</aside>
            <section className="mv-database-editor"><div className="mv-view-header"><div><span className="mv-kicker">DATABASE</span><h2>{collectionLabel(collection)}</h2><p>Runtime records and cross-reference validation</p></div><div className="mv-header-actions"><button onClick={addRecord}>＋ New Record</button><button disabled={selectedRecordIndex === null} onClick={removeRecord}>× Delete</button><button disabled={!currentEvent && selectedRecordIndex === null} onClick={() => setRecordView(recordView === 'form' ? 'json' : 'form')}>{recordView === 'form' ? 'JSON' : 'Form'}</button><button disabled={busy} onClick={() => void importMv()}>Import MV Subset…</button></div></div>
              {bundle && selectedRecordIndex !== null && recordView === 'form' ? (
                <div className="mv-record-form">
                  <div className="mv-record-header">
                    <span>{collectionLabel(collection)} #{selectedRecordIndex + 1}</span>
                    <button className="mv-icon-button mv-delete" onClick={() => { setRecordView('json'); }}>JSON</button>
                  </div>
                  <RecordForm collection={collection} record={(bundle.game[collection] as unknown[])[selectedRecordIndex] as Record<string, unknown>} bundle={bundle} onChange={updateRecordField} />
                </div>
              ) : (
                <div className="mv-code-panel"><div className="mv-code-title"><span>{collectionLabel(collection)} Records</span><code>{collection}.json</code></div>
                  {bundle ? <div className="mv-record-list">
                    {(bundle.game[collection] as unknown[]).map((record, index) => (
                      <div className={`mv-record-item ${index === selectedRecordIndex ? 'selected' : ''}`} key={index} onClick={() => selectRecord(index)}>
                        <span className="mv-record-id">{String(record && typeof record === 'object' && 'id' in record ? (record as Record<string, unknown>).id : index)}</span>
                        <span className="mv-record-name">{String(record && typeof record === 'object' && 'name' in record ? (record as Record<string, unknown>).name : '')}</span>
                      </div>
                    ))}
                  </div> : null}
                  <textarea className="mv-code-editor" spellCheck={false} value={dataDraft} onChange={event => setDataDraft(event.target.value)} />
                  <div className="mv-applybar"><span>Each record requires a unique string ID.</span><button className="primary" onClick={applyCollection}>Apply Collection</button></div>
                </div>
              )}
            </section>
          </div>}

          {mode === 'search' && <div className="mv-search-view"><div className="mv-view-header"><div><span className="mv-kicker">PROJECT TOOLS</span><h2>Reference Search</h2><p>Find IDs, names, switches, items, and references across the project.</p></div></div><div className="mv-search-box"><span>⌕</span><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search project references…" /></div><div className="mv-results"><div className="mv-results-title">{query ? `${references.length} results` : 'Enter a search term'}</div>{references.map(hit => <article key={hit.path}><code>{hit.path}</code><p>{hit.preview}</p></article>)}{query && !references.length && <div className="mv-blank-state"><span>⌕</span><p>No references found</p></div>}</div></div>}

          {report && mode === 'database' && <details className="mv-import-report" open><summary>Import report — {report.source}</summary><div><section><h3>Converted</h3>{report.converted.map(line => <p key={line}>{line}</p>)}</section><section><h3>Warnings & manual work</h3>{[...report.warnings, ...report.unsupported, ...report.errors].map((line, index) => <p key={index}>{line}</p>)}</section></div></details>}
        </div>}
      </section>

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
    </section>

    <footer className="mv-statusbar" role="status"><span className={`mv-status-light ${errorCount ? 'error' : dirty ? 'dirty' : ''}`} /> <span className="mv-status-message">{message}</span>{map && <><span>Map: {map.name}</span><span>{map.width} × {map.height}</span>{mode==='map'&&<span>{activeLayer==='auto'?'Auto Layer':`Layer ${activeLayer+1}`} · {mapTool}</span>}<span>{map.events.length} events</span></>}<span>{errorCount} errors · {warningCount} warnings</span></footer>
  </main>;
}
