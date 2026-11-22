const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nusvEditor', {
  createProject: (title: string) => ipcRenderer.invoke('project:create', title),
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (bundle: unknown) => ipcRenderer.invoke('project:save', bundle),
  playtest: (options?: { mapId?: string; debug?: boolean }) => ipcRenderer.invoke('playtest:start', options),
  importMvSubset: (bundle: unknown) => ipcRenderer.invoke('import:mv-subset', bundle)
});
