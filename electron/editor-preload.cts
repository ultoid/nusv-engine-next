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
  importMvSubset: (bundle: unknown) => ipcRenderer.invoke('import:mv-subset', bundle)
});
