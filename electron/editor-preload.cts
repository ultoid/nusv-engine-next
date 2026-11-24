const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nusvEditor', {
  createProject: (title: string, options?: { folderName?: string; location?: string }) => ipcRenderer.invoke('project:create', title, options),
  chooseDirectory: (title?: string) => ipcRenderer.invoke('project:choose-directory', title),
  getDefaultDirectory: () => ipcRenderer.invoke('project:get-default-directory'),
  openProject: (path?: string) => ipcRenderer.invoke('project:open', path),
  closeProject: () => ipcRenderer.invoke('project:close'),
  saveProject: (bundle: unknown) => ipcRenderer.invoke('project:save', bundle),
  getRecentProjects: () => ipcRenderer.invoke('project:get-recent'),
  removeRecentProject: (path: string) => ipcRenderer.invoke('project:remove-recent', path),
  playtest: (options?: { mapId?: string; debug?: boolean }) => ipcRenderer.invoke('playtest:start', options),
  launchProjectPlaytest: (path: string) => ipcRenderer.invoke('playtest:launch-path', path),
  importMvSubset: (bundle: unknown) => ipcRenderer.invoke('import:mv-subset', bundle),
  importAsset: (options?: { sourcePath?: string; category?: string; customId?: string }) => ipcRenderer.invoke('assets:import', options),
  exportAsset: (assetPath: string) => ipcRenderer.invoke('assets:export', assetPath),
  deleteAsset: (assetPath: string, assetId?: string) => ipcRenderer.invoke('assets:delete', assetPath, assetId),
  scanAssets: () => ipcRenderer.invoke('assets:scan'),
  openAssetFolder: (folder?: string) => ipcRenderer.invoke('assets:open-folder', folder),
  readAssetData: (path: string) => ipcRenderer.invoke('assets:read-data', path),
  setDirty: (dirty: boolean) => ipcRenderer.send('app:set-dirty', dirty),
  closeApp: () => ipcRenderer.send('app:close'),
  confirmClose: () => ipcRenderer.send('app:confirm-close'),
  onRequestSaveAndClose: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app:request-save-and-close', handler);
    return () => ipcRenderer.removeListener('app:request-save-and-close', handler);
  }
});
