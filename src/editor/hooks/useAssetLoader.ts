import { useEffect, useState } from 'react';
import { DEFAULT_TILESETS, resolveSheetPath } from '../../core/map-layers.js';
import type { ProjectBundle, TilesetData } from '../../core/types.js';
import { getCachedImage, preloadImages } from '../imageCache.js';

export interface UseAssetLoaderParams {
  api: typeof window.nusvEditor;
  bundle?: ProjectBundle;
}

export function useAssetLoader({ api, bundle }: UseAssetLoaderParams) {
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  // Reset when project root changes
  useEffect(() => {
    setAssetUrls({});
  }, [bundle?.root]);

  useEffect(() => {
    if (!api?.readAssetData || !bundle) return;

    const pathsToLoad = [
      'assets/tilesets/World_A1.png',
      'assets/tilesets/World_A2.png',
      'assets/tilesets/World_B.png',
      'assets/tilesets/World_C.png',
      'assets/tilesets/Outside_A1.png',
      'assets/tilesets/Outside_A2.png',
      'assets/tilesets/Outside_A3.png',
      'assets/tilesets/Outside_A4.png',
      'assets/tilesets/Outside_A5.png',
      'assets/tilesets/Outside_B.png',
      'assets/tilesets/Outside_C.png',
      'assets/tilesets/Inside_A1.png',
      'assets/tilesets/Inside_A2.png',
      'assets/tilesets/Inside_B.png',
      'assets/tilesets/Dungeon_A1.png',
      'assets/tilesets/Dungeon_A2.png',
      'assets/tilesets/Dungeon_B.png',
      'assets/characters/Actor1.png',
      'assets/characters/Actor2.png',
      'assets/characters/Actor3.png',
      'assets/characters/Door1.png',
      'assets/characters/Chest.png',
      'assets/characters/Vehicle.png',
      'assets/faces/Actor1.png',
      'assets/faces/Actor2.png',
      'assets/faces/Actor3.png',
      'assets/faces/Evil.png',
      'assets/faces/Monster.png',
      'assets/faces/Nature.png',
      'assets/faces/People1.png',
      'assets/faces/People2.png',
      'assets/faces/People3.png',
      'assets/faces/People4.png',
      'assets/faces/SF_Actor1.png',
      'assets/faces/SF_Actor2.png',
      'assets/faces/SF_Actor3.png',
      'assets/system/IconSet.png'
    ];

    const allTilesets: TilesetData[] = [
      ...(Array.isArray(bundle.game.tilesets) ? (bundle.game.tilesets as unknown as TilesetData[]) : []),
      ...DEFAULT_TILESETS
    ];
    for (const ts of allTilesets) {
      if (Array.isArray(ts.tilesetNames)) {
        for (const name of ts.tilesetNames) {
          if (name) {
            const p = resolveSheetPath(name);
            if (p && !pathsToLoad.includes(p)) pathsToLoad.push(p);
          }
        }
      }
    }

    const manifestAssets = bundle.assets?.assets || [];
    for (const asset of manifestAssets) {
      if (asset.category === 'tilesets' || asset.path.includes('/tilesets/') ||
          asset.category === 'characters' || asset.path.includes('/characters/') ||
          asset.category === 'faces' || asset.path.includes('/faces/')) {
        if (!pathsToLoad.includes(asset.path)) pathsToLoad.push(asset.path);
      }
    }

    for (const p of pathsToLoad) {
      if (assetUrls[p]) continue;
      void api.readAssetData(p).then(res => {
        if (res?.dataUrl) {
          setAssetUrls(prev => (prev[p] ? prev : { ...prev, [p]: res.dataUrl }));
          getCachedImage(res.dataUrl);
        }
      });
    }
  }, [bundle, api]);

  useEffect(() => {
    preloadImages(Object.values(assetUrls));
  }, [assetUrls]);

  return { assetUrls, setAssetUrls };
}
