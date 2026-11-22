import type { TileLayer } from './types.js';

export const MAP_LAYER_COUNT = 4;
export type LayerSelection = 'auto' | 0 | 1 | 2 | 3;

export interface TileDefinition {
  id:number;
  name:string;
  group:'A'|'B'|'C'|'D';
  defaultLayer:0|1|2|3;
  color:number;
  glyph:string;
}

export const TILE_CATALOG:TileDefinition[] = [
  {id:0,name:'Transparent',group:'A',defaultLayer:0,color:0x000000,glyph:''},
  {id:1,name:'Grass',group:'A',defaultLayer:0,color:0x6f9257,glyph:'·'},
  {id:2,name:'Dry Ground',group:'A',defaultLayer:0,color:0xa2865b,glyph:'·'},
  {id:3,name:'Stone Floor',group:'A',defaultLayer:0,color:0x777f83,glyph:'▦'},
  {id:4,name:'Water',group:'A',defaultLayer:0,color:0x397fab,glyph:'≈'},
  {id:5,name:'Wood Floor',group:'A',defaultLayer:0,color:0x9a7048,glyph:'═'},
  {id:6,name:'Wall',group:'A',defaultLayer:0,color:0x5d6268,glyph:'▥'},
  {id:7,name:'Flowers',group:'B',defaultLayer:1,color:0xd78aa6,glyph:'✦'},
  {id:8,name:'Bush',group:'B',defaultLayer:1,color:0x3f743f,glyph:'♣'},
  {id:9,name:'Tree',group:'B',defaultLayer:2,color:0x285e37,glyph:'♠'},
  {id:10,name:'Rock',group:'B',defaultLayer:2,color:0x74777b,glyph:'●'},
  {id:11,name:'Sign',group:'C',defaultLayer:2,color:0xa66c36,glyph:'⊤'},
  {id:12,name:'Crate',group:'C',defaultLayer:2,color:0x8b5931,glyph:'□'},
  {id:13,name:'Roof',group:'D',defaultLayer:3,color:0x874b50,glyph:'▲'},
  {id:14,name:'Window',group:'D',defaultLayer:3,color:0x78b7ce,glyph:'◇'},
  {id:15,name:'Torch',group:'D',defaultLayer:3,color:0xe89b38,glyph:'♦'}
];

export const tileDefinition = (id:number) => TILE_CATALOG.find(tile=>tile.id===id) ?? TILE_CATALOG[0];
export const layerForTile = (tileId:number,selection:LayerSelection) => selection==='auto' ? tileDefinition(tileId).defaultLayer : selection;

export function normalizeTileLayers(rawLayers:unknown[],cells:number):TileLayer[]{
  if(rawLayers.length>MAP_LAYER_COUNT)throw new Error(`map.layers: maksimal ${MAP_LAYER_COUNT} layer`);
  return Array.from({length:MAP_LAYER_COUNT},(_,index)=>{
    const raw=rawLayers[index];
    if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
      const layer=raw as Record<string,unknown>;
      return {...layer,id:String(layer.id),type:'tile' as const,name:typeof layer.name==='string'&&layer.name.trim()?layer.name:`Layer ${index+1}`,data:[...(layer.data as number[])]};
    }
    return {id:`layer.${index+1}`,type:'tile',name:`Layer ${index+1}`,data:Array(cells).fill(0)};
  });
}

export function paintLayerCell(layers:TileLayer[],layerIndex:number,cellIndex:number,tileId:number):TileLayer[]{
  return layers.map((layer,index)=>index===layerIndex?{...layer,data:layer.data.map((value,cell)=>cell===cellIndex?tileId:value)}:layer);
}

export function paintLayerRectangle(layers:TileLayer[],layerIndex:number,startX:number,startY:number,endX:number,endY:number,tileId:number,width:number):TileLayer[]{
  const left=Math.min(startX,endX),right=Math.max(startX,endX),top=Math.min(startY,endY),bottom=Math.max(startY,endY);
  const data=[...layers[layerIndex].data];
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)data[y*width+x]=tileId;
  return layers.map((layer,index)=>index===layerIndex?{...layer,data}:layer);
}

export function autotileMask(data:number[],cellIndex:number,width:number,height:number):number{
  const tileId=data[cellIndex];if(tileId===0)return 0;
  const x=cellIndex%width,y=Math.floor(cellIndex/width);let mask=0;
  if(y>0&&data[cellIndex-width]===tileId)mask|=1;
  if(x<width-1&&data[cellIndex+1]===tileId)mask|=2;
  if(y<height-1&&data[cellIndex+width]===tileId)mask|=4;
  if(x>0&&data[cellIndex-1]===tileId)mask|=8;
  return mask;
}

export function floodFillLayer(layers:TileLayer[],layerIndex:number,start:number,tileId:number,width:number,height:number):TileLayer[]{
  const source=layers[layerIndex].data;
  const target=source[start];
  if(target===tileId)return layers;
  const data=[...source],queue=[start],visited=new Uint8Array(width*height);
  while(queue.length){
    const cell=queue.pop()!;
    if(visited[cell]||data[cell]!==target)continue;
    visited[cell]=1;data[cell]=tileId;
    const x=cell%width,y=Math.floor(cell/width);
    if(x>0)queue.push(cell-1);if(x<width-1)queue.push(cell+1);if(y>0)queue.push(cell-width);if(y<height-1)queue.push(cell+width);
  }
  return layers.map((layer,index)=>index===layerIndex?{...layer,data}:layer);
}

export function paintLayerCircle(layers:TileLayer[],layerIndex:number,startX:number,startY:number,endX:number,endY:number,tileId:number,width:number):TileLayer[]{
  const left=Math.min(startX,endX),right=Math.max(startX,endX),top=Math.min(startY,endY),bottom=Math.max(startY,endY);
  const rx=(right-left)/2, ry=(bottom-top)/2;
  const cx=left+rx, cy=top+ry;
  const data=[...layers[layerIndex].data];
  for(let y=top;y<=bottom;y++){
    for(let x=left;x<=right;x++){
      const dx=rx>0?(x-cx)/rx:0, dy=ry>0?(y-cy)/ry:0;
      if(dx*dx+dy*dy<=1.08){
        data[y*width+x]=tileId;
      }
    }
  }
  return layers.map((layer,index)=>index===layerIndex?{...layer,data}:layer);
}

export function shiftMapData(
  layers: TileLayer[],
  collision: Array<0 | 1>,
  width: number,
  height: number,
  dx: number,
  dy: number,
  loop: boolean
): { layers: TileLayer[]; collision: Array<0 | 1> } {
  const nextLayers = layers.map(layer => {
    const data = Array(width * height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let nx = x + dx;
        let ny = y + dy;
        if (loop) {
          nx = ((nx % width) + width) % width;
          ny = ((ny % height) + height) % height;
        }
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          data[ny * width + nx] = layer.data[y * width + x];
        }
      }
    }
    return { ...layer, data };
  });

  const nextCollision = Array(width * height).fill(0) as (0 | 1)[];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nx = x + dx;
      let ny = y + dy;
      if (loop) {
        nx = ((nx % width) + width) % width;
        ny = ((ny % height) + height) % height;
      }
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        nextCollision[ny * width + nx] = collision[y * width + x];
      }
    }
  }

  return { layers: nextLayers, collision: nextCollision };
}

export function generateDungeonData(
  width: number,
  height: number,
  wallTile: number = 6,
  floorTile: number = 3
): { layers: TileLayer[]; collision: Array<0 | 1> } {
  const cells = width * height;
  const l1 = Array(cells).fill(wallTile);
  const coll = Array(cells).fill(1) as (0 | 1)[];

  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];
  const roomCount = Math.max(2, Math.floor((width * height) / 45));

  for (let i = 0; i < roomCount; i++) {
    const rw = Math.floor(Math.random() * 4) + 3;
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (width - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - rh - 2)) + 1;

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const idx = y * width + x;
        l1[idx] = floorTile;
        coll[idx] = 0;
      }
    }
    rooms.push({ x: rx + Math.floor(rw / 2), y: ry + Math.floor(rh / 2), w: rw, h: rh });
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i], b = rooms[i + 1];
    let cx = a.x, cy = a.y;
    while (cx !== b.x) {
      const idx = cy * width + cx;
      l1[idx] = floorTile;
      coll[idx] = 0;
      cx += cx < b.x ? 1 : -1;
    }
    while (cy !== b.y) {
      const idx = cy * width + cx;
      l1[idx] = floorTile;
      coll[idx] = 0;
      cy += cy < b.y ? 1 : -1;
    }
  }

  const layers: TileLayer[] = [
    { id: 'layer.1', type: 'tile', name: 'Layer 1', data: l1 },
    { id: 'layer.2', type: 'tile', name: 'Layer 2', data: Array(cells).fill(0) },
    { id: 'layer.3', type: 'tile', name: 'Layer 3', data: Array(cells).fill(0) },
    { id: 'layer.4', type: 'tile', name: 'Layer 4', data: Array(cells).fill(0) }
  ];

  return { layers, collision: coll };
}
