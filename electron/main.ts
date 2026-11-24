import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProject, loadProject, saveProject, getRecentProjects, saveRecentProject, removeRecentProject, getDefaultProjectsDirectory } from './project-service.js';
import { loadProgress, saveProgress } from './progress-service.js';
import { importMvSubset } from './import-service.js';
import { importAssetFile, exportAssetFile, deleteAssetFile, scanProjectAssets } from './asset-service.js';
const here = dirname(fileURLToPath(import.meta.url)); const appRoot = resolve(here, '..', '..'); const smokeTest = process.argv.includes('--smoke-test'); let smokeDirectory: string | null = smokeTest ? (process.env.NUSV_SMOKE_ROOT ?? mkdtempSync(join(tmpdir(), 'nusv-electron-smoke-'))) : null; let editor: BrowserWindow | null = null; let currentRoot: string | null = null;
let isEditorDirty = false;
let isQuitting = false;
let isDialogShowing = false;

ipcMain.on('app:set-dirty', (_event, dirty: boolean) => {
  isEditorDirty = Boolean(dirty);
});
ipcMain.on('app:close', () => {
  if (editor && !editor.isDestroyed()) {
    editor.close();
  }
});
ipcMain.on('app:confirm-close', () => {
  isQuitting = true;
  if (editor && !editor.isDestroyed()) {
    editor.close();
  }
});

interface PlaytestSession { root:string;mapId?:string;debug?:boolean }
const playtestRoots = new Map<number, PlaytestSession>();
if (smokeDirectory) app.setPath('userData', join(smokeDirectory, 'user-data'));
const page = (name: string) => join(appRoot, 'dist', name); const template = () => join(appRoot, 'fixtures', 'stage0-safe-project');
function harden(win:BrowserWindow){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file://'))event.preventDefault();});}
function createEditor(show = true) {
  editor = new BrowserWindow({
    show,
    width: 1180,
    height: 760,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: '#091118',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(here, 'editor-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  harden(editor);

  editor.on('close', async (event) => {
    if (smokeTest || isQuitting) {
      return;
    }
    if (!currentRoot || !isEditorDirty) {
      return;
    }
    event.preventDefault();
    if (isDialogShowing) {
      return;
    }
    isDialogShowing = true;
    try {
      const choice = await dialog.showMessageBox(editor!, {
        type: 'question',
        buttons: ['Save', 'Tidak', 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
        title: 'Perubahan Belum Disimpan',
        message: 'Apakah Anda ingin menyimpan perubahan sebelum menutup aplikasi?',
        detail: 'Pilih "Save" untuk menyimpan proyek, "Tidak" untuk menutup tanpa menyimpan, atau "Cancel" untuk membatalkan.'
      });
      if (choice.response === 0) {
        editor!.webContents.send('app:request-save-and-close');
      } else if (choice.response === 1) {
        isQuitting = true;
        editor!.close();
      }
    } finally {
      isDialogShowing = false;
    }
  });

  void editor.loadFile(page('index.html'));
  return editor;
}
function createPlaytest(session: PlaytestSession, show = true) { const win = new BrowserWindow({ show, width: 1100, height: 760, backgroundColor: '#020609', autoHideMenuBar: true, webPreferences: { preload: join(here, 'player-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });harden(win); const webContentsId=win.webContents.id;playtestRoots.set(webContentsId, session); win.on('closed', () => playtestRoots.delete(webContentsId)); if (smokeTest) verifySmokePlayer(win); void win.loadFile(page('player.html')); return win; }
function finishSmoke(code: number, result?: unknown) { if (result) console.log(JSON.stringify(result)); process.exitCode=code; for (const window of BrowserWindow.getAllWindows()) window.destroy(); app.quit(); }
function verifySmokePlayer(player: BrowserWindow) {
  player.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        // Chromium discards native input sent to a hidden BrowserWindow. The
        // smoke runner therefore briefly focuses the real playtest window.
        player.show();
        player.focus();
        player.webContents.focus();
        const result = await player.webContents.executeJavaScript(`({canvas:!!document.querySelector('#game canvas'), error:document.querySelector('#runtime-error')?.textContent || ''})`);
        const press = async (code: string) => {
          const keyCode = ({ArrowRight:'RIGHT',ArrowLeft:'LEFT',ArrowUp:'UP',ArrowDown:'DOWN',Enter:'ENTER',KeyX:'X',F5:'F5'} as Record<string,string>)[code] ?? code;
          player.webContents.sendInputEvent({type:'keyDown',keyCode});
          player.webContents.sendInputEvent({type:'keyUp',keyCode});
          await new Promise(resolve => setTimeout(resolve, 250));
        };
        const finishDialogueChain = async () => {
          for (let step=0;step<12;step++) {
            const open=await player.webContents.executeJavaScript(`document.querySelector('.dialogue')?.classList.contains('open')||false`);
            if (open) { await player.webContents.executeJavaScript(`document.querySelector('.dialogue button')?.click()`);await new Promise(resolve=>setTimeout(resolve,200));continue; }
            await new Promise(resolve=>setTimeout(resolve,250));
            const reopened=await player.webContents.executeJavaScript(`document.querySelector('.dialogue')?.classList.contains('open')||false`);
            if (!reopened) return;
          }
        };
        if (result.canvas && !result.error) {
          await press('KeyX');
          await player.webContents.executeJavaScript(`(()=>{const select=[...document.querySelectorAll('.party-equipment select')].find(node=>[...node.options].some(option=>option.value==='equip.wind-charm'));if(!select)return false;select.value='equip.wind-charm';select.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
          await new Promise(resolve=>setTimeout(resolve,150));
          await player.webContents.executeJavaScript(`[...document.querySelectorAll('.party-menu-actions button')].find(button=>button.textContent==='Tutup')?.click()`);
          await new Promise(resolve=>setTimeout(resolve,150));
          await press('ArrowRight');
          await press('Enter');
          await finishDialogueChain();
          for (const code of ['ArrowDown','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowUp','ArrowRight']) await press(code);
          await press('ArrowRight');
          await press('Enter');
          await finishDialogueChain();
          for (let step=0;step<200;step++) {
            const battle = await player.webContents.executeJavaScript(`({open:document.querySelector('.battle-overlay')?.classList.contains('open')||false,button:document.querySelector('.battle-actions button')?.textContent||''})`);
            if (!battle.open) break;
            if (battle.button) await player.webContents.executeJavaScript(`document.querySelector('.battle-actions button')?.click()`);
            await new Promise(resolve=>setTimeout(resolve,100));
          }
          await press('F5');
        }
        const ui = await player.webContents.executeJavaScript(`({dialogue:document.querySelector('.dialogue')?.innerText||'',open:document.querySelector('.dialogue')?.classList.contains('open')||false})`);
        const bundle = currentRoot ? loadProject(currentRoot) : null;
        const saveBase = join(app.getPath('userData'), 'saves');
        const saved = bundle ? loadProgress(saveBase, bundle) : null;
        const storyCompleted = !!saved && saved.mapId === 'map.field' && saved.switches['door.open'] === true && saved.inventory['item.token'] === 1 && saved.switches['battle.training-won'] === true && saved.gold === 16 && saved.actorProgress['actor.arka']?.equipment.accessory === 'equip.wind-charm';
        if (bundle) rmSync(join(saveBase, bundle.project.projectId), { recursive: true, force: true });
        finishSmoke(result.canvas && !result.error && storyCompleted ? 0 : 1, { editorLoaded:true, projectCreated:true, playtestViaEditorApi:true, ...result, ...ui, storyCompleted, savedMap:saved?.mapId??null, savedPosition:saved?{x:saved.x,y:saved.y}:null, switchOpen:saved?.switches['door.open']??false, token:saved?.inventory['item.token']??0, battleWon:saved?.switches['battle.training-won']??false, gold:saved?.gold??0, accessory:saved?.actorProgress['actor.arka']?.equipment.accessory??null });
      } catch (error) { console.error(error); finishSmoke(1); }
    }, 700);
  });
}
ipcMain.handle('project:create', async (_event, title: string, options?: { folderName?: string; location?: string }) => {
  let location = options?.location;
  if (!location) {
    location = getDefaultProjectsDirectory(appRoot);
  }
  const bundle = createProject(location, title, template(), options?.folderName);
  currentRoot = bundle.root!;
  saveRecentProject(app.getPath('userData'), currentRoot, bundle.project.title);
  return bundle;
});
ipcMain.handle('project:choose-directory', async (_event, title?: string) => {
  const choice = await dialog.showOpenDialog(editor!, {
    title: title || 'Pilih folder',
    defaultPath: getDefaultProjectsDirectory(appRoot),
    properties: ['openDirectory', 'createDirectory']
  });
  if (choice.canceled || !choice.filePaths[0]) return null;
  return choice.filePaths[0];
});
ipcMain.handle('project:get-default-directory', () => {
  return getDefaultProjectsDirectory(appRoot);
});
ipcMain.handle('project:open', async (_event, targetPath?: string) => {
  let root = targetPath;
  if (!root) {
    const choice = await dialog.showOpenDialog(editor!, {
      title: 'Buka proyek NUSV',
      defaultPath: getDefaultProjectsDirectory(appRoot),
      properties: ['openFile'],
      filters: [{ name: 'NUSV Project', extensions: ['json'] }]
    });
    if (choice.canceled || !choice.filePaths[0]) return null;
    const selected = choice.filePaths[0];
    root = selected.endsWith('nusv.project.json') ? dirname(selected) : selected;
  } else if (root.endsWith('nusv.project.json')) {
    root = dirname(root);
  }
  const bundle = loadProject(root);
  currentRoot = bundle.root!;
  saveRecentProject(app.getPath('userData'), currentRoot, bundle.project.title);
  return bundle;
});
ipcMain.handle('project:close', () => {
  currentRoot = null;
  isEditorDirty = false;
  return true;
});
ipcMain.handle('project:get-recent', () => {
  return getRecentProjects(app.getPath('userData'), getDefaultProjectsDirectory(appRoot));
});
ipcMain.handle('project:remove-recent', (_event, path: string) => {
  return removeRecentProject(app.getPath('userData'), path);
});
ipcMain.handle('playtest:launch-path', async (_event, projectPath: string) => {
  const normalized = resolve(projectPath);
  const bundle = loadProject(normalized);
  createPlaytest({ root: normalized, mapId: bundle.project.start.mapId, debug: true }, true);
  saveRecentProject(app.getPath('userData'), normalized, bundle.project.title);
});
ipcMain.handle('project:save', (_event, bundle: unknown) => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  const saved = saveProject(currentRoot, bundle);
  isEditorDirty = false;
  saveRecentProject(app.getPath('userData'), currentRoot, saved.project.title);
  return saved;
});
ipcMain.handle('import:mv-subset', async (_event, bundle: unknown) => { const choice=await dialog.showOpenDialog(editor!,{title:'Pilih folder proyek MV atau folder data',properties:['openDirectory']});if(choice.canceled)return null;if(!currentRoot)throw new Error('Tidak ada proyek aktif');return importMvSubset(choice.filePaths[0],bundle as never,currentRoot); });
ipcMain.handle('assets:import', async (_event, options?: { sourcePath?: string; category?: string; customId?: string }) => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  let source = options?.sourcePath;
  if (!source) {
    const choice = await dialog.showOpenDialog(editor!, {
      title: 'Pilih file aset untuk diimpor',
      properties: ['openFile'],
      filters: [
        { name: 'Media Files', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ogg', 'mp3', 'wav', 'm4a', 'woff', 'ttf'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] },
        { name: 'Audio', extensions: ['ogg', 'mp3', 'wav', 'm4a'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (choice.canceled || !choice.filePaths[0]) return null;
    source = choice.filePaths[0];
  }
  return importAssetFile(currentRoot, source, options?.category || 'other', options?.customId);
});
ipcMain.handle('assets:export', async (_event, assetPath: string) => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  const filename = assetPath.split(/[/\\]/).pop() || 'asset';
  const ext = filename.split('.').pop() || '';
  const choice = await dialog.showSaveDialog(editor!, {
    title: 'Ekspor file aset',
    defaultPath: filename,
    filters: ext ? [{ name: 'Asset File', extensions: [ext] }] : undefined
  });
  if (choice.canceled || !choice.filePath) return false;
  exportAssetFile(currentRoot, assetPath, choice.filePath);
  return true;
});
ipcMain.handle('assets:delete', async (_event, assetPath: string, assetId?: string) => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  deleteAssetFile(currentRoot, assetPath, assetId);
  return true;
});
ipcMain.handle('assets:scan', async () => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  return scanProjectAssets(currentRoot);
});
ipcMain.handle('assets:open-folder', async (_event, relativeFolder = 'assets') => {
  if (!currentRoot) throw new Error('Tidak ada proyek aktif');
  const target = join(currentRoot, relativeFolder);
  await shell.openPath(target);
  return true;
});
ipcMain.handle('assets:read-data', async (_event, relativePath: string) => {
  if (!currentRoot) return null;
  const full = join(currentRoot, relativePath);
  if (!existsSync(full)) return null;
  const ext = extname(full).toLowerCase().replace('.', '');
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'ogg' ? 'audio/ogg' : ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'application/octet-stream';
  const buf = readFileSync(full);
  return {
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
    buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  };
});
ipcMain.handle('runtime:read-asset', (event, relativePath: string) => {
  const session = playtestRoots.get(event.sender.id);
  if (!session) return null;
  const full = join(session.root, relativePath);
  if (!existsSync(full)) return null;
  const ext = extname(full).toLowerCase().replace('.', '');
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'ogg' ? 'audio/ogg' : ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'application/octet-stream';
  const buf = readFileSync(full);
  return {
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
    buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  };
});
ipcMain.handle('playtest:start', (_event, options?:{mapId?:string;debug?:boolean}) => { if (!currentRoot) throw new Error('Tidak ada proyek aktif'); const bundle=loadProject(currentRoot);if(options?.mapId&&!bundle.maps[options.mapId])throw new Error(`Map ${options.mapId} tidak ditemukan`); createPlaytest({root:currentRoot,mapId:options?.mapId,debug:options?.debug}, !smokeTest); });
ipcMain.handle('runtime:load-project', event => { const session = playtestRoots.get(event.sender.id); if (!session) throw new Error('Sesi playtest tidak dikenal'); const bundle=loadProject(session.root);if(session.mapId){const map=bundle.maps[session.mapId];let x=1,y=1;const same=bundle.project.start.mapId===map.id;if(same&&map.collision[bundle.project.start.y*map.width+bundle.project.start.x]===0){x=bundle.project.start.x;y=bundle.project.start.y;}else{const index=map.collision.findIndex(value=>value===0);if(index<0)throw new Error(`Map ${map.id} tidak memiliki tile yang dapat dilalui`);x=index%map.width;y=Math.floor(index/map.width);}bundle.project={...bundle.project,start:{mapId:map.id,x,y},debug:!!session.debug};}else if(session.debug)bundle.project={...bundle.project,debug:true};return bundle; });
ipcMain.handle('runtime:save-progress', (event, state: unknown) => { const session = playtestRoots.get(event.sender.id); if (!session) throw new Error('Sesi playtest tidak dikenal'); const bundle = loadProject(session.root); return saveProgress(join(app.getPath('userData'), 'saves'), bundle, state); });
ipcMain.handle('runtime:load-progress', event => { const session = playtestRoots.get(event.sender.id); if (!session) throw new Error('Sesi playtest tidak dikenal'); const bundle = loadProject(session.root); return loadProgress(join(app.getPath('userData'), 'saves'), bundle); });
app.whenReady().then(() => {
  if (smokeTest) { currentRoot = createProject(smokeDirectory!, `Smoke Project ${Date.now()}`, template()).root!; const editorWindow = createEditor(false); editorWindow.webContents.once('did-finish-load', () => { void editorWindow.webContents.executeJavaScript(`window.nusvEditor.playtest()`); }); return; }
  createEditor(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createEditor(); });
});
app.on('window-all-closed', () => { if (!smokeTest && process.platform !== 'darwin') app.quit(); });
