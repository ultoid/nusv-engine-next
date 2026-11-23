import type { EventCommand, MapData, ProjectBundle } from './types.js';

export type AssetCategory =
  | 'characters'
  | 'faces'
  | 'tilesets'
  | 'pictures'
  | 'enemies'
  | 'battlebacks1'
  | 'battlebacks2'
  | 'titles1'
  | 'titles2'
  | 'system'
  | 'bgm'
  | 'bgs'
  | 'me'
  | 'se'
  | 'fonts'
  | 'other';

export const ASSET_CATEGORIES: Array<{ id: AssetCategory; label: string; group: 'image' | 'audio' | 'other' }> = [
  { id: 'characters', label: 'Characters (Sprites)', group: 'image' },
  { id: 'faces', label: 'Faces (Portraits)', group: 'image' },
  { id: 'tilesets', label: 'Tilesets', group: 'image' },
  { id: 'pictures', label: 'Pictures', group: 'image' },
  { id: 'enemies', label: 'Enemies (Battlers)', group: 'image' },
  { id: 'battlebacks1', label: 'Battlebacks 1 (Floor)', group: 'image' },
  { id: 'battlebacks2', label: 'Battlebacks 2 (Backdrop)', group: 'image' },
  { id: 'titles1', label: 'Titles 1 (Background)', group: 'image' },
  { id: 'titles2', label: 'Titles 2 (Frame)', group: 'image' },
  { id: 'system', label: 'System Graphics', group: 'image' },
  { id: 'bgm', label: 'BGM (Music)', group: 'audio' },
  { id: 'bgs', label: 'BGS (Ambience)', group: 'audio' },
  { id: 'me', label: 'ME (Jingles)', group: 'audio' },
  { id: 'se', label: 'SE (Sound Effects)', group: 'audio' },
  { id: 'fonts', label: 'Fonts', group: 'other' },
  { id: 'other', label: 'Other / Data', group: 'other' }
];

export interface AssetUsageReport {
  assetId: string;
  inUse: boolean;
  references: string[];
}

export interface ResourceAudit {
  totalAssets: number;
  inUseCount: number;
  unusedCount: number;
  byCategory: Record<AssetCategory, number>;
  usageReports: Record<string, AssetUsageReport>;
}

export function inferAssetCategory(path: string, type?: string): AssetCategory {
  const normalized = path.toLowerCase().replaceAll('\\', '/');
  if (normalized.includes('/characters/') || normalized.includes('character') || normalized.includes('/sv_actors/')) return 'characters';
  if (normalized.includes('/faces/') || normalized.includes('face')) return 'faces';
  if (normalized.includes('/tilesets/') || normalized.includes('tileset')) return 'tilesets';
  if (normalized.includes('/pictures/') || normalized.includes('picture') || normalized.includes('/parallaxes/')) return 'pictures';
  if (normalized.includes('/enemies/') || normalized.includes('enemy') || normalized.includes('/sv_enemies/')) return 'enemies';
  if (normalized.includes('/battlebacks1/') || normalized.includes('battleback1')) return 'battlebacks1';
  if (normalized.includes('/battlebacks2/') || normalized.includes('battleback2')) return 'battlebacks2';
  if (normalized.includes('/titles1/') || normalized.includes('title1')) return 'titles1';
  if (normalized.includes('/titles2/') || normalized.includes('title2')) return 'titles2';
  if (normalized.includes('/system/') || normalized.includes('system') || normalized.includes('icon') || normalized.includes('/animations/')) return 'system';
  if (normalized.includes('/bgm/') || normalized.includes('bgm')) return 'bgm';
  if (normalized.includes('/bgs/') || normalized.includes('bgs')) return 'bgs';
  if (normalized.includes('/me/') || normalized.includes('me-')) return 'me';
  if (normalized.includes('/se/') || normalized.includes('se-') || normalized.includes('sfx')) return 'se';
  if (normalized.endsWith('.woff') || normalized.endsWith('.woff2') || normalized.endsWith('.ttf') || normalized.endsWith('.otf') || normalized.includes('/fonts/')) return 'fonts';

  if (type === 'audio' || normalized.endsWith('.ogg') || normalized.endsWith('.mp3') || normalized.endsWith('.wav') || normalized.endsWith('.m4a')) {
    return 'se';
  }
  if (type === 'image' || normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp') || normalized.endsWith('.svg')) {
    return 'pictures';
  }
  return 'other';
}

function walkCommands(commands: EventCommand[], visitor: (cmd: EventCommand) => void) {
  for (const cmd of commands) {
    visitor(cmd);
    if (cmd.type === 'choice' && Array.isArray(cmd.choices)) {
      for (const choice of cmd.choices) {
        if (Array.isArray(choice.commands)) {
          walkCommands(choice.commands, visitor);
        }
      }
    }
  }
}

export function auditProjectResources(bundle: ProjectBundle): ResourceAudit {
  const usageReports: Record<string, AssetUsageReport> = {};
  const byCategory: Record<AssetCategory, number> = {
    characters: 0,
    faces: 0,
    tilesets: 0,
    pictures: 0,
    enemies: 0,
    battlebacks1: 0,
    battlebacks2: 0,
    titles1: 0,
    titles2: 0,
    system: 0,
    bgm: 0,
    bgs: 0,
    me: 0,
    se: 0,
    fonts: 0,
    other: 0
  };

  const assets = Array.isArray(bundle.assets?.assets) ? bundle.assets.assets : [];
  const lookup = new Map<string, string>();

  for (const asset of assets) {
    const cat = (asset.category as AssetCategory) || inferAssetCategory(asset.path, asset.type);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    usageReports[asset.id] = {
      assetId: asset.id,
      inUse: false,
      references: []
    };
    const id = asset.id.toLowerCase();
    const path = asset.path.toLowerCase().replaceAll('\\', '/');
    const filename = path.split('/').pop()?.toLowerCase() ?? '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    lookup.set(id, asset.id);
    lookup.set(path, asset.id);
    lookup.set(filename, asset.id);
    lookup.set(nameWithoutExt, asset.id);
  }

  // Scan project title screen & title BGM
  const projRec = bundle.project as unknown as Record<string, unknown>;
  if (typeof projRec.titleImage === 'string' && projRec.titleImage.trim()) {
    tagAssetMatch(lookup, usageReports, projRec.titleImage, `Project (Title Image)`);
  }
  if (typeof projRec.titleBgm === 'string' && projRec.titleBgm.trim()) {
    tagAssetMatch(lookup, usageReports, projRec.titleBgm, `Project (Title BGM)`);
  }

  // Scan database actors
  for (const actor of bundle.game.actors || []) {
    const fields = [
      { key: 'faceImage', label: 'Face' },
      { key: 'characterImage', label: 'Character' },
      { key: 'battlerImage', label: 'Battler' }
    ] as const;
    const actorRec = actor as unknown as Record<string, unknown>;
    for (const { key, label } of fields) {
      const val = actorRec[key];
      if (typeof val === 'string' && val.trim()) {
        tagAssetMatch(lookup, usageReports, val, `Actor ${actor.name} (${label})`);
      }
    }
  }

  // Scan database enemies
  for (const enemy of bundle.game.enemies || []) {
    const enemyRec = enemy as unknown as Record<string, unknown>;
    const val = enemyRec.battlerImage;
    if (typeof val === 'string' && val.trim()) {
      tagAssetMatch(lookup, usageReports, val, `Enemy ${enemy.name} (Battler)`);
    }
  }

  // Scan maps and events
  for (const [mapId, map] of Object.entries(bundle.maps || {})) {
    const mapObj = map as MapData & Record<string, unknown>;
    if (typeof mapObj.tilesetImage === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.tilesetImage, `Map ${mapObj.name} (Tileset)`);
    }
    if (typeof mapObj.bgm === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.bgm, `Map ${mapObj.name} (BGM)`);
    }
    if (typeof mapObj.bgs === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.bgs, `Map ${mapObj.name} (BGS)`);
    }
    if (typeof mapObj.parallaxImage === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.parallaxImage, `Map ${mapObj.name} (Parallax)`);
    }
    if (typeof mapObj.battleback1 === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.battleback1, `Map ${mapObj.name} (Battleback 1)`);
    }
    if (typeof mapObj.battleback2 === 'string') {
      tagAssetMatch(lookup, usageReports, mapObj.battleback2, `Map ${mapObj.name} (Battleback 2)`);
    }

    for (const ev of mapObj.events || []) {
      for (const page of ev.pages || []) {
        walkCommands(page.commands || [], (cmd) => {
          if (cmd.type === 'music') {
            tagAssetMatch(lookup, usageReports, cmd.mood, `Event ${ev.name} on ${mapObj.name} (Music: ${cmd.mood})`);
          }
          const raw = cmd as Record<string, unknown>;
          if (typeof raw.sound === 'string') {
            tagAssetMatch(lookup, usageReports, raw.sound, `Event ${ev.name} on ${mapObj.name} (SE)`);
          }
          if (typeof raw.picture === 'string') {
            tagAssetMatch(lookup, usageReports, raw.picture, `Event ${ev.name} on ${mapObj.name} (Picture)`);
          }
        });
      }
    }
  }

  // Calculate totals
  let inUseCount = 0;
  let unusedCount = 0;
  for (const rep of Object.values(usageReports)) {
    if (rep.inUse) {
      inUseCount++;
    } else {
      unusedCount++;
    }
  }

  return {
    totalAssets: assets.length,
    inUseCount,
    unusedCount,
    byCategory,
    usageReports
  };
}

function tagAssetMatch(
  lookup: Map<string, string>,
  usageReports: Record<string, AssetUsageReport>,
  needle: string,
  location: string
) {
  const cleanNeedle = needle.trim().toLowerCase().replaceAll('\\', '/');
  if (!cleanNeedle) return;

  const targetId =
    lookup.get(cleanNeedle) ||
    lookup.get(cleanNeedle.split('/').pop() ?? '') ||
    Array.from(lookup.entries()).find(([k]) => k.endsWith('/' + cleanNeedle))?.[1];

  if (targetId && usageReports[targetId]) {
    const rep = usageReports[targetId];
    rep.inUse = true;
    if (!rep.references.includes(location)) {
      rep.references.push(location);
    }
  }
}

export function filterAssets(
  assets: Array<{ id: string; type: string; path: string; category?: string; [key: string]: unknown }>,
  options: {
    category?: AssetCategory | 'all';
    query?: string;
    status?: 'all' | 'in-use' | 'unused';
    usageReports?: Record<string, AssetUsageReport>;
  }
) {
  const { category = 'all', query = '', status = 'all', usageReports } = options;
  const q = query.trim().toLowerCase();

  return assets.filter((asset) => {
    const cat = (asset.category as AssetCategory) || inferAssetCategory(asset.path, asset.type);
    if (category !== 'all' && cat !== category) {
      return false;
    }

    if (q) {
      const matchId = asset.id.toLowerCase().includes(q);
      const matchPath = asset.path.toLowerCase().includes(q);
      const matchCat = cat.toLowerCase().includes(q);
      if (!matchId && !matchPath && !matchCat) {
        return false;
      }
    }

    if (status !== 'all' && usageReports) {
      const rep = usageReports[asset.id];
      const isInUse = rep ? rep.inUse : false;
      if (status === 'in-use' && !isInUse) return false;
      if (status === 'unused' && isInUse) return false;
    }

    return true;
  });
}

export function addAssetToBundle(
  bundle: ProjectBundle,
  entry: { id: string; type: string; path: string; category?: string; license?: string; size?: number; [key: string]: unknown }
): ProjectBundle {
  const current = bundle.assets?.assets || [];
  const category = entry.category || inferAssetCategory(entry.path, entry.type);
  const normalizedEntry = { ...entry, category };
  const existingIndex = current.findIndex((a) => a.id === entry.id);

  let nextAssets: typeof current;
  if (existingIndex >= 0) {
    nextAssets = [...current];
    nextAssets[existingIndex] = normalizedEntry;
  } else {
    nextAssets = [...current, normalizedEntry];
  }

  return {
    ...bundle,
    assets: {
      ...bundle.assets,
      assets: nextAssets
    }
  };
}

export function removeAssetFromBundle(bundle: ProjectBundle, assetId: string): ProjectBundle {
  const current = bundle.assets?.assets || [];
  return {
    ...bundle,
    assets: {
      ...bundle.assets,
      assets: current.filter((a) => a.id !== assetId)
    }
  };
}

export function cleanUnusedAssetsFromBundle(bundle: ProjectBundle): { nextBundle: ProjectBundle; removedCount: number } {
  const audit = auditProjectResources(bundle);
  const current = bundle.assets?.assets || [];
  const kept = current.filter((a) => {
    const rep = audit.usageReports[a.id];
    return rep ? rep.inUse : true;
  });

  return {
    nextBundle: {
      ...bundle,
      assets: {
        ...bundle.assets,
        assets: kept
      }
    },
    removedCount: current.length - kept.length
  };
}
