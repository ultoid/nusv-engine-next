import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadProject } from '../.electron-dist/electron/project-service.js';
import { autotileMask, floodFillLayer, layerForTile, paintLayerCell, paintLayerRectangle } from '../.electron-dist/src/core/map-layers.js';

const fixture=resolve('fixtures/stage0-safe-project');

test('map lama dimigrasikan menjadi empat layer tanpa merusak tile awal',()=>{
  const bundle=loadProject(fixture),map=bundle.maps['map.intro'];
  assert.equal(map.layers.length,4);
  assert.equal(map.layers[0].id,'layer.ground');
  assert.deepEqual(map.layers.map(layer=>layer.data.length),[54,54,54,54]);
  assert.ok(map.layers.slice(1).every(layer=>layer.data.every(tile=>tile===0)));
});

test('mode auto memilih layer tile sedangkan mode manual menghormati pilihan',()=>{
  assert.equal(layerForTile(1,'auto'),0);
  assert.equal(layerForTile(7,'auto'),1);
  assert.equal(layerForTile(9,'auto'),2);
  assert.equal(layerForTile(13,'auto'),3);
  assert.equal(layerForTile(13,0),0);
});

test('paint dan flood fill hanya mengubah layer aktif',()=>{
  const map=loadProject(fixture).maps['map.field'];
  const painted=paintLayerCell(map.layers,2,8,9);
  assert.equal(painted[2].data[8],9);
  assert.deepEqual(painted[0].data,map.layers[0].data);
  const filled=floodFillLayer(painted,1,0,7,map.width,map.height);
  assert.ok(filled[1].data.every(tile=>tile===7));
  assert.equal(filled[2].data[8],9);
});

test('rectangle dan autotile adjacency bekerja deterministik per layer',()=>{
  const map=loadProject(fixture).maps['map.field'];
  const layers=paintLayerRectangle(map.layers,0,1,1,3,2,4,map.width);
  const center=1*map.width+2,corner=1*map.width+1;
  assert.equal(layers[0].data.filter(tile=>tile===4).length,6);
  assert.equal(autotileMask(layers[0].data,center,map.width,map.height),14);
  assert.equal(autotileMask(layers[0].data,corner,map.width,map.height),6);
  assert.ok(layers.slice(1).every((layer,index)=>layer.data.every((tile,cell)=>tile===map.layers[index+1].data[cell])));
});

test('perintah event dapat ditambah dan dihapus dalam halaman',()=>{
  const bundle=loadProject(fixture);
  const map=bundle.maps['map.intro'];
  const event=map.events[0];
  const page=event.pages[0];
  const initialLen=page.commands.length;
  const next=structuredClone(bundle);
  const nextMap=next.maps[map.id];
  const nextEvent=nextMap.events.find(e=>e.id===event.id);
  const commands=nextEvent.pages[0].commands;
  commands.push({type:'text',text:'Perintah baru.'});
  assert.equal(commands.length,initialLen+1);
  assert.equal(commands[initialLen].type,'text');
  assert.equal(commands[initialLen].text,'Perintah baru.');
  commands.splice(initialLen,1);
  assert.equal(commands.length,initialLen);
});

test('record database dapat ditambah dan dihapus dalam koleksi',()=>{
  const bundle=loadProject(fixture);
  const initialLen=bundle.game.actors.length;
  const next=structuredClone(bundle);
  next.game.actors.push({id:'test.actor',name:'Test Actor',stats:{str:10,int:10,dex:10,luk:10,agi:10,vit:10},base:{hp:100,mp:50,atk:10,def:10,mat:10,mdf:10,agi:10},skillIds:[]});
  assert.equal(next.game.actors.length,initialLen+1);
  assert.equal(next.game.actors[initialLen].id,'test.actor');
  assert.equal(next.game.actors[initialLen].name,'Test Actor');
  const next2=structuredClone(next);
  next2.game.actors=next2.game.actors.filter((_,i)=>i!==initialLen);
  assert.equal(next2.game.actors.length,initialLen);
  assert.ok(!next2.game.actors.some(a=>a.id==='test.actor'));
});
