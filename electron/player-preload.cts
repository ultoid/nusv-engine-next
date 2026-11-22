const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nusvRuntime', { loadProject: () => ipcRenderer.invoke('runtime:load-project'), saveProgress: (state: unknown) => ipcRenderer.invoke('runtime:save-progress', state), loadProgress: () => ipcRenderer.invoke('runtime:load-progress') });
