import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import type { AssetEntry, AssetManifest } from '../src/core/types.js';
import { inferAssetCategory, type AssetCategory } from '../src/core/resource-manager.js';

const safeTarget = (root: string, relativePath: string) => {
  const target = resolve(root, relativePath);
  const rel = relative(resolve(root), target);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path proyek tidak valid: ${relativePath}`);
  }
  for (let item = target; item !== resolve(root); item = dirname(item)) {
    if (lstatSync(item, { throwIfNoEntry: false })?.isSymbolicLink()) {
      throw new Error(`Symbolic link tidak diizinkan: ${relativePath}`);
    }
  }
  return target;
};

function readManifest(projectRoot: string): AssetManifest {
  const manifestPath = join(projectRoot, 'assets', 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { schemaVersion: 1, assets: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!parsed || !Array.isArray(parsed.assets)) {
      return { schemaVersion: 1, assets: [] };
    }
    return parsed as AssetManifest;
  } catch {
    return { schemaVersion: 1, assets: [] };
  }
}

function writeManifest(projectRoot: string, manifest: AssetManifest) {
  const manifestPath = safeTarget(projectRoot, 'assets/manifest.json');
  const dir = dirname(manifestPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { encoding: 'utf8', flush: true });
}

export function importAssetFile(
  projectRoot: string,
  sourcePath: string,
  category: AssetCategory | string = 'other',
  customId?: string
): AssetEntry {
  const source = resolve(sourcePath);
  if (!existsSync(source)) {
    throw new Error(`File sumber tidak ditemukan: ${sourcePath}`);
  }

  const ext = extname(source).toLowerCase();
  const rawBase = basename(source, ext);
  const slug = rawBase
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'asset';

  const cat = (category as AssetCategory) || inferAssetCategory(source);
  const targetRelDir = join('assets', cat);
  const targetDir = safeTarget(projectRoot, targetRelDir);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const finalFileName = `${slug}${ext}`;
  const targetRelPath = join(targetRelDir, finalFileName).replaceAll('\\', '/');
  const targetFullPath = safeTarget(projectRoot, targetRelPath);

  copyFileSync(source, targetFullPath);
  const stats = statSync(targetFullPath);

  const type =
    ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)
      ? 'image'
      : ['.ogg', '.mp3', '.wav', '.m4a', '.flac'].includes(ext)
      ? 'audio'
      : ['.woff', '.woff2', '.ttf', '.otf'].includes(ext)
      ? 'font'
      : 'binary';

  const assetId = customId?.trim() || `asset.${cat}.${slug}`;

  const manifest = readManifest(projectRoot);
  const newEntry: AssetEntry = {
    id: assetId,
    type,
    path: targetRelPath,
    category: cat,
    size: stats.size,
    license: 'user-import'
  };

  const existingIndex = manifest.assets.findIndex((a) => a.id === assetId || a.path === targetRelPath);
  if (existingIndex >= 0) {
    manifest.assets[existingIndex] = newEntry;
  } else {
    manifest.assets.push(newEntry);
  }

  writeManifest(projectRoot, manifest);
  return newEntry;
}

export function exportAssetFile(projectRoot: string, assetPath: string, destinationFilePath: string): void {
  const fullSource = safeTarget(projectRoot, assetPath);
  if (!existsSync(fullSource)) {
    throw new Error(`Aset tidak ditemukan di proyek: ${assetPath}`);
  }
  const destDir = dirname(destinationFilePath);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(fullSource, destinationFilePath);
}

export function deleteAssetFile(projectRoot: string, assetPath: string, assetId?: string): void {
  const fullPath = safeTarget(projectRoot, assetPath);
  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
  }
  const manifest = readManifest(projectRoot);
  manifest.assets = manifest.assets.filter((a) => {
    if (assetId && a.id === assetId) return false;
    if (a.path === assetPath.replaceAll('\\', '/')) return false;
    return true;
  });
  writeManifest(projectRoot, manifest);
}

export function scanProjectAssets(projectRoot: string): AssetEntry[] {
  const manifest = readManifest(projectRoot);
  const assetsDir = join(projectRoot, 'assets');
  if (!existsSync(assetsDir)) return manifest.assets;

  const foundFiles: string[] = [];
  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && ent.name !== 'manifest.json' && ent.name !== 'manifest.tmp') {
        foundFiles.push(relative(projectRoot, full).replaceAll('\\', '/'));
      }
    }
  }
  walk(assetsDir);

  const entries: AssetEntry[] = [...manifest.assets];
  for (const relPath of foundFiles) {
    if (!entries.some((e) => e.path === relPath)) {
      const ext = extname(relPath).toLowerCase();
      const rawBase = basename(relPath, ext);
      const cat = inferAssetCategory(relPath);
      const type =
        ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)
          ? 'image'
          : ['.ogg', '.mp3', '.wav', '.m4a'].includes(ext)
          ? 'audio'
          : 'binary';
      let size = 0;
      try {
        size = statSync(join(projectRoot, relPath)).size;
      } catch {}
      entries.push({
        id: `asset.${cat}.${rawBase.toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'file'}`,
        type,
        path: relPath,
        category: cat,
        size
      });
    }
  }
  return entries;
}
