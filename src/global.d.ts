import type { ProjectBundle } from './core/types.js';
export interface ImportReport { source:string;converted:string[];warnings:string[];unsupported:string[];errors:string[];idMap:Record<string,string> }
export interface RecentProject { path: string; title: string; lastOpened: number; }
declare global {
  interface Window {
    nusvEditor?: {
      createProject(title: string, options?: { folderName?: string; location?: string }): Promise<ProjectBundle | null>;
      chooseDirectory(title?: string): Promise<string | null>;
      getDefaultDirectory(): Promise<string>;
      openProject(path?: string): Promise<ProjectBundle | null>;
      closeProject(): Promise<boolean>;
      saveProject(bundle: ProjectBundle): Promise<ProjectBundle>;
      getRecentProjects(): Promise<RecentProject[]>;
      removeRecentProject(path: string): Promise<RecentProject[]>;
      playtest(options?: { mapId?: string; debug?: boolean }): Promise<void>;
      launchProjectPlaytest(path: string): Promise<void>;
      importMvSubset(bundle: ProjectBundle): Promise<{ bundle: ProjectBundle; report: ImportReport } | null>;
    };
    nusvRuntime?: {
      loadProject(): Promise<ProjectBundle>;
      saveProgress(state: import('./core/types.js').ProgressState): Promise<import('./core/types.js').ProgressState>;
      loadProgress(): Promise<import('./core/types.js').ProgressState | null>;
    };
  }
}
export {};
