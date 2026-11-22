import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { validateBundle } from '../src/core/validation.js';
import type { ProjectBundle } from '../src/core/types.js';

const JOURNAL = '.nusv-save';
const readJson = (file: string, label: string) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch (error) { throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`); } };
const safeTarget = (root: string, relativePath: string) => { const target = resolve(root, relativePath); const rel = relative(resolve(root), target); if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Path proyek tidak valid: ${relativePath}`); for (let item = target; item !== resolve(root); item = dirname(item)) if (lstatSync(item, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`Symbolic link tidak diizinkan: ${relativePath}`); return target; };
const publish = (directory: string, value: unknown) => { const temporary = join(directory, 'manifest.tmp'); writeFileSync(temporary, JSON.stringify(value), { flush: true }); renameSync(temporary, join(directory, 'manifest.json')); };
const retire = (root: string, journal: string) => { const trash = mkdtempSync(join(root, '.nusv-cleanup-')); renameSync(journal, join(trash, 'finished')); rmSync(trash, { recursive: true, force: true }); };

export function recoverProject(root: string) {
  const journal = join(root, JOURNAL); if (!existsSync(journal)) return;
  const manifestFile = join(journal, 'manifest.json'); if (!existsSync(manifestFile)) throw new Error(`Recovery diperlukan: manifest journal hilang di ${journal}`);
  const manifest = readJson(manifestFile, 'journal') as { state: string; files: Array<{ path: string; existed: boolean }> };
  if (!['staging', 'prepared', 'committed'].includes(manifest.state)) throw new Error(`Status journal tidak dikenal: ${manifest.state}`);
  if (manifest.state === 'prepared') manifest.files.forEach((entry, index) => { if (existsSync(join(journal, `stage-${index}`))) return; const target = safeTarget(root, entry.path); if (entry.existed) copyFileSync(join(journal, `backup-${index}`), target); else if (existsSync(target)) unlinkSync(target); });
  retire(root, journal);
}

function commitFiles(root: string, files: Array<{ path: string; content: string }>) {
  recoverProject(root); const journal = join(root, JOURNAL); const entries = files.map(file => { const target = safeTarget(root, file.path); return { path: file.path, existed: existsSync(target), target }; });
  const initial = mkdtempSync(join(root, '.nusv-init-')); const baseManifest = { state: 'staging', files: entries.map(({ path, existed }) => ({ path, existed })) };
  try { publish(initial, baseManifest); renameSync(initial, journal); } catch (error) { rmSync(initial, { recursive: true, force: true }); throw error; }
  try {
    files.forEach((file, index) => { if (entries[index].existed) copyFileSync(entries[index].target, join(journal, `backup-${index}`)); const stage = join(journal, `stage-${index}`); writeFileSync(stage, file.content, { encoding: 'utf8', flush: true }); JSON.parse(readFileSync(stage, 'utf8')); });
    publish(journal, { ...baseManifest, state: 'prepared' }); files.forEach((_file, index) => renameSync(join(journal, `stage-${index}`), entries[index].target)); publish(journal, { ...baseManifest, state: 'committed' });
  } catch (error) { try { recoverProject(root); } catch (recovery) { throw new Error(`Save gagal: ${String(error)}; recovery gagal: ${String(recovery)}`); } throw error; }
  retire(root, journal);
}

export function loadProject(root: string): ProjectBundle {
  const normalized = resolve(root); recoverProject(normalized);
  const project = readJson(join(normalized, 'nusv.project.json'), 'project');
  if (!Array.isArray(project?.maps)) throw new Error('project.maps: wajib berupa daftar');
  const maps = Object.fromEntries(project.maps.map((mapId: unknown) => { if (typeof mapId !== 'string') throw new Error('project.maps: ID tidak valid'); return [mapId, readJson(join(normalized, 'maps', `${mapId}.json`), `maps.${mapId}`)]; }));
  return validateBundle({ root: normalized, project, game: readJson(join(normalized, 'data', 'game.json'), 'game'), maps, assets: readJson(join(normalized, 'assets', 'manifest.json'), 'assets') });
}

export function createProject(parent: string, title: string, templateRoot: string, customFolderName?: string): ProjectBundle {
  const cleanTitle = title.trim() || 'NUSV Project';
  const slug = (customFolderName?.trim() || cleanTitle).toLowerCase().normalize('NFKD').replace(/[^a-z0-9-_]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'project';
  const root = join(resolve(parent), slug);
  if (existsSync(root)) throw new Error(`Folder proyek sudah ada: ${root}`);
  mkdirSync(root, { recursive: false });
  try {
    cpSync(templateRoot, root, { recursive: true, errorOnExist: true });
    const manifestFile = join(root, 'nusv.project.json');
    const manifest = readJson(manifestFile, 'project');
    manifest.title = cleanTitle;
    manifest.projectId = `game.${slug}`;
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n', { flush: true });
    return loadProject(root);
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

export function saveProject(root: string, raw: unknown): ProjectBundle {
  loadProject(root); const candidate = validateBundle(raw);
  const files = [
    { path: 'nusv.project.json', content: JSON.stringify(candidate.project, null, 2) + '\n' },
    { path: 'data/game.json', content: JSON.stringify(candidate.game, null, 2) + '\n' },
    { path: 'assets/manifest.json', content: JSON.stringify(candidate.assets, null, 2) + '\n' },
    ...candidate.project.maps.map(mapId => ({ path: `maps/${mapId}.json`, content: JSON.stringify(candidate.maps[mapId], null, 2) + '\n' }))
  ];
  commitFiles(root, files); return loadProject(root);
}

const RECENT_FILE = 'recent-projects.json';

export interface RecentProjectItem {
  path: string;
  title: string;
  lastOpened: number;
}

export function getDefaultProjectsDirectory(workspaceRoot: string): string {
  const defaultDir = join(resolve(workspaceRoot), 'project');
  if (!existsSync(defaultDir)) {
    mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

export function scanProjectsDirectory(projectsDir: string): RecentProjectItem[] {
  if (!existsSync(projectsDir)) return [];
  try {
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    const discovered: RecentProjectItem[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projRoot = join(projectsDir, entry.name);
        const manifestPath = join(projRoot, 'nusv.project.json');
        if (existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            const stat = statSync(manifestPath);
            discovered.push({
              path: projRoot,
              title: typeof manifest?.title === 'string' ? manifest.title : entry.name,
              lastOpened: stat.mtimeMs
            });
          } catch {
            // ignore
          }
        }
      }
    }
    return discovered;
  } catch {
    return [];
  }
}

export function getRecentProjects(userDataDir: string, defaultProjectsDir?: string): RecentProjectItem[] {
  const file = join(userDataDir, RECENT_FILE);
  let list: unknown[] = [];
  if (existsSync(file)) {
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }
  const verified = list
    .filter((item): item is RecentProjectItem => Boolean(item && typeof (item as RecentProjectItem).path === 'string' && existsSync(join((item as RecentProjectItem).path, 'nusv.project.json'))))
    .map(item => ({ ...item, path: resolve(item.path) }));

  if (defaultProjectsDir && existsSync(defaultProjectsDir)) {
    const scanned = scanProjectsDirectory(defaultProjectsDir);
    for (const item of scanned) {
      if (!verified.some(v => resolve(v.path) === resolve(item.path))) {
        verified.push(item);
      }
    }
  }
  return verified.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 30);
}

export function saveRecentProject(userDataDir: string, root: string, title: string): RecentProjectItem[] {
  const normalized = resolve(root);
  const current = getRecentProjects(userDataDir);
  const updated = [
    { path: normalized, title: title.trim() || 'NUSV Project', lastOpened: Date.now() },
    ...current.filter(item => resolve(item.path) !== normalized)
  ].slice(0, 25);
  try {
    writeFileSync(join(userDataDir, RECENT_FILE), JSON.stringify(updated, null, 2) + '\n', { flush: true });
  } catch {
    // ignore
  }
  return updated;
}

export function removeRecentProject(userDataDir: string, root: string): RecentProjectItem[] {
  const normalized = resolve(root);
  const current = getRecentProjects(userDataDir);
  const updated = current.filter(item => resolve(item.path) !== normalized);
  try {
    writeFileSync(join(userDataDir, RECENT_FILE), JSON.stringify(updated, null, 2) + '\n', { flush: true });
  } catch {
    // ignore
  }
  return updated;
}
