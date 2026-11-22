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
