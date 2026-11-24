import { test } from 'node:test'; import assert from 'node:assert/strict'; import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'; import { tmpdir } from 'node:os'; import { join } from 'node:path'; import { fileURLToPath } from 'node:url';
import { createProject, loadProject, saveProject, getRecentProjects, saveRecentProject, removeRecentProject, getDefaultProjectsDirectory, scanProjectsDirectory } from '../.electron-dist/electron/project-service.js';
const template = fileURLToPath(new URL('../fixtures/stage0-safe-project', import.meta.url));
test('project dibuat, disimpan, dibuka ulang tanpa MV', async () => { const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-')); const created = createProject(parent, 'First NUSV', template); assert.equal(created.project.title, 'First NUSV'); created.project.title = 'Saved NUSV'; const saved = saveProject(created.root, created); assert.equal(saved.project.title, 'Saved NUSV'); assert.equal(loadProject(created.root).project.title, 'Saved NUSV'); });
test('project dapat dibuat dengan custom folder slug', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-slug-'));
  const created = createProject(parent, 'Awesome RPG Game', template, 'awesome-rpg');
  assert.equal(created.project.title, 'Awesome RPG Game');
  assert.equal(created.project.projectId, 'game.awesome-rpg');
  assert.ok(created.root?.endsWith('awesome-rpg'));
  assert.equal(loadProject(created.root).project.title, 'Awesome RPG Game');
});
test('riwayat recent projects tersimpan dan dapat dimanipulasi', async () => {
  const userDir = await mkdtemp(join(tmpdir(), 'nusv-user-data-'));
  const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-recent-'));
  const p1 = createProject(parent, 'Game Alpha', template, 'alpha');
  const p2 = createProject(parent, 'Game Beta', template, 'beta');
  saveRecentProject(userDir, p1.root, p1.project.title);
  saveRecentProject(userDir, p2.root, p2.project.title);
  let recents = getRecentProjects(userDir);
  assert.equal(recents.length, 2);
  assert.equal(recents[0].title, 'Game Beta');
  assert.equal(recents[1].title, 'Game Alpha');
  removeRecentProject(userDir, p1.root);
  recents = getRecentProjects(userDir);
  assert.equal(recents.length, 1);
  assert.equal(recents[0].title, 'Game Beta');
});
test('default projects directory dan auto-scan mendeteksi proyek di folder project', async () => {
  const rootWorkspace = await mkdtemp(join(tmpdir(), 'nusv-workspace-'));
  const projectsDir = getDefaultProjectsDirectory(rootWorkspace);
  assert.equal(projectsDir, join(rootWorkspace, 'project'));
  createProject(projectsDir, 'Auto Scanned Game', template, 'auto-game');
  const found = scanProjectsDirectory(projectsDir);
  assert.equal(found.length, 1);
  assert.equal(found[0].title, 'Auto Scanned Game');
  assert.ok(found[0].path.endsWith('auto-game'));
  const userDir = await mkdtemp(join(tmpdir(), 'nusv-user-data2-'));
  const recents = getRecentProjects(userDir, projectsDir);
  assert.equal(recents.length, 1);
  assert.equal(recents[0].title, 'Auto Scanned Game');
});
test('data rusak ditolak dan save invalid tidak mengubah manifest', async () => { const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-invalid-')); const created = createProject(parent, 'Guarded Project', template); const manifestFile = join(created.root, 'nusv.project.json'); const before = await readFile(manifestFile, 'utf8'); await assert.rejects(async () => saveProject(created.root, { ...created, project: { ...created.project, schemaVersion: 9 } }), /schemaVersion/); assert.equal(await readFile(manifestFile, 'utf8'), before); const mapFile = join(created.root, 'maps', 'map.intro.json'); await writeFile(mapFile, '{bad json'); assert.throws(() => loadProject(created.root), /maps\.map\.intro:/); });
test('runtime dan editor baru tidak merujuk runtime MV', async () => { const root = fileURLToPath(new URL('../', import.meta.url)); const files = ['src/runtime/Runtime.ts','src/runtime/WorldScene.ts','electron/main.ts','electron/project-service.ts']; for (const relative of files) { const text = await readFile(join(root, relative), 'utf8'); assert.doesNotMatch(text, /RPG Maker|rpg_core|rpg_managers|YEP_/i, relative); } });
test('field manifest yang belum dikenal dipertahankan saat save', async () => { const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-fields-')); const created = createProject(parent, 'Future Fields', template); created.project.extensionData = { future: 7 }; const saved = saveProject(created.root, created); assert.deepEqual(saved.project.extensionData, { future: 7 }); });
test('load memulihkan journal prepared yang terputus', async () => { const parent = await mkdtemp(join(tmpdir(), 'nusv-stage1-recover-')); const created = createProject(parent, 'Recoverable', template); const target = join(created.root, 'nusv.project.json'); const original = await readFile(target, 'utf8'); const changed = JSON.parse(original); changed.title = 'Partial Write'; await writeFile(target, JSON.stringify(changed)); const journal = join(created.root, '.nusv-save'); await mkdir(journal); await writeFile(join(journal, 'backup-0'), original); await writeFile(join(journal, 'manifest.json'), JSON.stringify({ state: 'prepared', files: [{ path: 'nusv.project.json', existed: true }] })); assert.equal(loadProject(created.root).project.title, 'Recoverable'); });
test('alert konfirmasi tutup aplikasi tanpa save memiliki opsi Save, Tidak, dan Cancel', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const mainTs = await readFile(join(root, 'electron/main.ts'), 'utf8');
  assert.match(mainTs, /buttons:\s*\['Save',\s*'Tidak',\s*'Cancel'\]/);
  assert.match(mainTs, /app:request-save-and-close/);
  assert.match(mainTs, /app:confirm-close/);
  assert.match(mainTs, /app:set-dirty/);

  const preloadCts = await readFile(join(root, 'electron/editor-preload.cts'), 'utf8');
  assert.match(preloadCts, /onRequestSaveAndClose/);
  assert.match(preloadCts, /confirmClose/);
  assert.match(preloadCts, /setDirty/);

  const modalTsx = await readFile(join(root, 'src/editor/modals/UnsavedConfirmModal.tsx'), 'utf8');
  assert.match(modalTsx, /saveLabel\s*=\s*'Save'/);
  assert.match(modalTsx, /discardLabel\s*=\s*'Tidak'/);
  assert.match(modalTsx, /cancelLabel\s*=\s*'Cancel'/);
});
