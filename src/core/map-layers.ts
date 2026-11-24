import type { ProjectBundle, TileLayer, TilesetData } from './types.js';

export const MAP_LAYER_COUNT = 4;
export type LayerSelection = 'auto' | 0 | 1 | 2 | 3;

export interface TileDefinition {
  id:number;
  name:string;
  group:'A'|'B'|'C'|'D'|'E'|'R';
  defaultLayer:0|1|2|3;
  color:number;
  glyph:string;
  tileset?:string;
  srcX?:number;
  srcY?:number;
  paletteSrcX?:number;
  paletteSrcY?:number;
  autotile?:boolean;
  autotileBaseX?:number;
  autotileBaseY?:number;
}

export interface TileQuadrant {
  srcX: number;
  srcY: number;
  left: number; // 0 or 24
  top: number;  // 0 or 24
}

export function getDefaultAutotileQuadrants(
  tile: TileDefinition,
  mode: 'isolated' | 'center' = 'isolated'
): TileQuadrant[] {
  const bx = tile.autotileBaseX ?? 0;
  const by = tile.autotileBaseY ?? 0;
  const isA3A4 = tile.id >= 6000 && tile.id < 8000;
  if (mode === 'center') {
    if (isA3A4) {
      return [
        { srcX: bx + 48, srcY: by + 48, left: 0, top: 0 },
        { srcX: bx + 72, srcY: by + 48, left: 24, top: 0 },
        { srcX: bx + 48, srcY: by + 72, left: 0, top: 24 },
        { srcX: bx + 72, srcY: by + 72, left: 24, top: 24 }
      ];
    }
    return [
      { srcX: bx + 48, srcY: by + 96, left: 0, top: 0 },
      { srcX: bx + 72, srcY: by + 96, left: 24, top: 0 },
      { srcX: bx + 48, srcY: by + 120, left: 0, top: 24 },
      { srcX: bx + 72, srcY: by + 120, left: 24, top: 24 }
    ];
  }
  return [
    { srcX: bx + 0, srcY: by + 0, left: 0, top: 0 },
    { srcX: bx + 24, srcY: by + 0, left: 24, top: 0 },
    { srcX: bx + 0, srcY: by + 24, left: 0, top: 24 },
    { srcX: bx + 24, srcY: by + 24, left: 24, top: 24 }
  ];
}

/**
 * Computes the 4 sub-tile quadrants (24x24 px each) for an autotile matching the authentic RPG Maker MZ
 * 47-blob quadrant assembly specification.
 * Quadrant 0: Top-Left (d = NW)
 * Quadrant 1: Top-Right (d = NE)
 * Quadrant 2: Bottom-Left (d = SW)
 * Quadrant 3: Bottom-Right (d = SE)
 */
export function getAutotileQuadrants(
  tile: TileDefinition,
  data: number[],
  cellIndex: number,
  width: number,
  height: number,
  overrideQuads?: TileQuadrant[]
): TileQuadrant[] {
  if (overrideQuads && overrideQuads.length === 4) {
    return overrideQuads;
  }
  const bx = tile.autotileBaseX ?? 0;
  const by = tile.autotileBaseY ?? 0;
  const tileId = data[cellIndex];
  const x = cellIndex % width;
  const y = Math.floor(cellIndex / width);

  const isSame = (cx: number, cy: number): boolean => {
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) {
      // RPG Maker MZ standard: treat out-of-bounds map edges as matching the current tile
      // so autotiles seamlessly extend to map edges without creating artificial coastlines or borders
      return true;
    }
    return data[cy * width + cx] === tileId;
  };

  const N  = isSame(x, y - 1);
  const S  = isSame(x, y + 1);
  const E  = isSame(x + 1, y);
  const W  = isSame(x - 1, y);
  const NW = isSame(x - 1, y - 1);
  const NE = isSame(x + 1, y - 1);
  const SW = isSame(x - 1, y + 1);
  const SE = isSame(x + 1, y + 1);

  const isIsolated = !N && !S && !E && !W;

  // Quadrant 0: Top-Left
  let q0: [number, number];
  if (isIsolated) q0 = [0, 0];
  else if (!N && !W) q0 = [0, 2];
  else if (!N && W) q0 = [2, 2];
  else if (N && !W) q0 = [0, 4];
  else if (!NW) q0 = [2, 0];
  else q0 = [2, 4];

  // Quadrant 1: Top-Right
  let q1: [number, number];
  if (isIsolated) q1 = [1, 0];
  else if (!N && !E) q1 = [3, 2];
  else if (!N && E) q1 = [1, 2];
  else if (N && !E) q1 = [3, 4];
  else if (!NE) q1 = [3, 0];
  else q1 = [1, 4];

  // Quadrant 2: Bottom-Left
  let q2: [number, number];
  if (isIsolated) q2 = [0, 1];
  else if (!S && !W) q2 = [0, 5];
  else if (!S && W) q2 = [2, 5];
  else if (S && !W) q2 = [0, 3];
  else if (!SW) q2 = [2, 1];
  else q2 = [2, 3];

  // Quadrant 3: Bottom-Right
  let q3: [number, number];
  if (isIsolated) q3 = [1, 1];
  else if (!S && !E) q3 = [3, 5];
  else if (!S && E) q3 = [1, 5];
  else if (S && !E) q3 = [3, 3];
  else if (!SE) q3 = [3, 1];
  else q3 = [1, 3];

  const isA3A4 = tile.id >= 6000 && tile.id < 8000;
  if (isA3A4) {
    q0[1] = Math.min(q0[1], 3);
    q1[1] = Math.min(q1[1], 3);
    q2[1] = Math.min(q2[1], 3);
    q3[1] = Math.min(q3[1], 3);
  }

  return [
    { srcX: bx + q0[0] * 24, srcY: by + q0[1] * 24, left: 0, top: 0 },
    { srcX: bx + q1[0] * 24, srcY: by + q1[1] * 24, left: 24, top: 0 },
    { srcX: bx + q2[0] * 24, srcY: by + q2[1] * 24, left: 0, top: 24 },
    { srcX: bx + q3[0] * 24, srcY: by + q3[1] * 24, left: 24, top: 24 }
  ];
}

export function getTileCoordinates(tile: TileDefinition, mask = 15): { srcX: number; srcY: number } {
  if (tile.autotile && tile.autotileBaseX !== undefined && tile.autotileBaseY !== undefined) {
    const bx = tile.autotileBaseX;
    const by = tile.autotileBaseY;
    if (mask === 15) return { srcX: bx + 48, srcY: by + 96 }; // seamless center
    if (mask === 0) return { srcX: bx, srcY: by }; // isolated 1x1
    if (mask === 14) return { srcX: bx + 48, srcY: by + 48 }; // open North (top border)
    if (mask === 11) return { srcX: bx + 48, srcY: by + 120 }; // open South (bottom border)
    if (mask === 7) return { srcX: bx, srcY: by + 96 }; // open West (left border)
    if (mask === 13) return { srcX: bx + 72, srcY: by + 96 }; // open East (right border)
    if (mask === 5) return { srcX: bx, srcY: by + 96 }; // vertical path
    if (mask === 10) return { srcX: bx + 48, srcY: by + 48 }; // horizontal path
    if (mask === 6) return { srcX: bx, srcY: by + 48 }; // top-left corner
    if (mask === 12) return { srcX: bx + 72, srcY: by + 48 }; // top-right corner
    if (mask === 3) return { srcX: bx, srcY: by + 120 }; // bottom-left corner
    if (mask === 9) return { srcX: bx + 72, srcY: by + 120 }; // bottom-right corner
    return { srcX: bx + 48, srcY: by + 96 };
  }
  return { srcX: tile.srcX ?? 0, srcY: tile.srcY ?? 0 };
}

export const TILE_CATALOG:TileDefinition[] = [
  // Tab A: RPG Maker MZ Overworld (48 tiles: 6 rows of 8 tiles)
  // Row 0 of Tab A (World_A1: 8 water autotiles)
  { id: 19, name: 'Deep Ocean', group: 'A', defaultLayer: 0, color: 0x1e3a8a, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 0, srcY: 0, autotile: true, autotileBaseX: 0, autotileBaseY: 0, paletteSrcX: 0, paletteSrcY: 0 },
  { id: 4, name: 'Ocean Water', group: 'A', defaultLayer: 0, color: 0x2563eb, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 0, srcY: 144, autotile: true, autotileBaseX: 0, autotileBaseY: 144, paletteSrcX: 0, paletteSrcY: 144 },
  { id: 50, name: 'Coast Water', group: 'A', defaultLayer: 0, color: 0x38bdf8, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 0, srcY: 288, autotile: true, autotileBaseX: 0, autotileBaseY: 288, paletteSrcX: 0, paletteSrcY: 288 },
  { id: 51, name: 'Ice Water', group: 'A', defaultLayer: 0, color: 0x7dd3fc, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 0, srcY: 432, autotile: true, autotileBaseX: 0, autotileBaseY: 432, paletteSrcX: 0, paletteSrcY: 432 },
  { id: 52, name: 'Poison Swamp', group: 'A', defaultLayer: 0, color: 0x701a75, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 384, srcY: 0, autotile: true, autotileBaseX: 384, autotileBaseY: 0, paletteSrcX: 384, paletteSrcY: 0 },
  { id: 53, name: 'Dark Water', group: 'A', defaultLayer: 0, color: 0x4a044e, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 384, srcY: 144, autotile: true, autotileBaseX: 384, autotileBaseY: 144, paletteSrcX: 384, paletteSrcY: 144 },
  { id: 54, name: 'Magma Altar', group: 'A', defaultLayer: 0, color: 0x9a3412, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 384, srcY: 288, autotile: true, autotileBaseX: 384, autotileBaseY: 288, paletteSrcX: 384, paletteSrcY: 288 },
  { id: 55, name: 'Lava Pool', group: 'A', defaultLayer: 0, color: 0xdc2626, glyph: '≈', tileset: 'assets/tilesets/World_A1.png', srcX: 384, srcY: 432, autotile: true, autotileBaseX: 384, autotileBaseY: 432, paletteSrcX: 384, paletteSrcY: 432 },

  // Row 1 of Tab A (World_A1: 8 water/whirlpool/waterfall/cloud autotiles)
  { id: 56, name: 'Ocean Whirlpool', group: 'A', defaultLayer: 1, color: 0x1d4ed8, glyph: '◎', tileset: 'assets/tilesets/World_A1.png', srcX: 288, srcY: 0, paletteSrcX: 288, paletteSrcY: 0 },
  { id: 57, name: 'Reef Coast', group: 'A', defaultLayer: 1, color: 0x0284c7, glyph: '·', tileset: 'assets/tilesets/World_A1.png', srcX: 288, srcY: 144, paletteSrcX: 288, paletteSrcY: 144 },
  { id: 58, name: 'Ice Float', group: 'A', defaultLayer: 1, color: 0xbae6fd, glyph: '◇', tileset: 'assets/tilesets/World_A1.png', srcX: 288, srcY: 288, paletteSrcX: 288, paletteSrcY: 288 },
  { id: 59, name: 'Ice Vortex', group: 'A', defaultLayer: 1, color: 0x38bdf8, glyph: '◎', tileset: 'assets/tilesets/World_A1.png', srcX: 288, srcY: 432, paletteSrcX: 288, paletteSrcY: 432 },
  { id: 60, name: 'Swamp Waterfall', group: 'A', defaultLayer: 1, color: 0x581c87, glyph: '↓', tileset: 'assets/tilesets/World_A1.png', srcX: 672, srcY: 0, paletteSrcX: 672, paletteSrcY: 0 },
  { id: 61, name: 'Ocean Waterfall', group: 'A', defaultLayer: 1, color: 0x0ea5e9, glyph: '↓', tileset: 'assets/tilesets/World_A1.png', srcX: 672, srcY: 144, paletteSrcX: 672, paletteSrcY: 144 },
  { id: 62, name: 'Sea Clouds', group: 'A', defaultLayer: 1, color: 0xf8fafc, glyph: '☁', tileset: 'assets/tilesets/World_A1.png', srcX: 672, srcY: 288, paletteSrcX: 672, paletteSrcY: 288 },
  { id: 63, name: 'Ice Clouds', group: 'A', defaultLayer: 1, color: 0xe0f2fe, glyph: '☁', tileset: 'assets/tilesets/World_A1.png', srcX: 672, srcY: 432, paletteSrcX: 672, paletteSrcY: 432 },

  // Row 2 of Tab A (World_A2: 8 grass & mountain autotiles)
  { id: 20, name: 'World Grass', group: 'A', defaultLayer: 0, color: 0x558844, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 0, srcY: 0, autotile: true, autotileBaseX: 0, autotileBaseY: 0, paletteSrcX: 0, paletteSrcY: 0 },
  { id: 1, name: 'Lush Grass', group: 'A', defaultLayer: 0, color: 0x65a30d, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 96, srcY: 0, autotile: true, autotileBaseX: 96, autotileBaseY: 0, paletteSrcX: 96, paletteSrcY: 0 },
  { id: 64, name: 'Deciduous Forest', group: 'A', defaultLayer: 1, color: 0x15803d, glyph: '♣', tileset: 'assets/tilesets/World_A2.png', srcX: 192, srcY: 0, autotile: true, autotileBaseX: 192, autotileBaseY: 0, paletteSrcX: 192, paletteSrcY: 0 },
  { id: 65, name: 'Pine Forest', group: 'A', defaultLayer: 1, color: 0x166534, glyph: '♠', tileset: 'assets/tilesets/World_A2.png', srcX: 288, srcY: 0, autotile: true, autotileBaseX: 288, autotileBaseY: 0, paletteSrcX: 288, paletteSrcY: 0 },
  { id: 66, name: 'Green Mountain', group: 'A', defaultLayer: 1, color: 0x4ade80, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 384, srcY: 0, autotile: true, autotileBaseX: 384, autotileBaseY: 0, paletteSrcX: 384, paletteSrcY: 0 },
  { id: 21, name: 'Rocky Mountain', group: 'A', defaultLayer: 1, color: 0x887766, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 480, srcY: 0, autotile: true, autotileBaseX: 480, autotileBaseY: 0, paletteSrcX: 480, paletteSrcY: 0 },
  { id: 67, name: 'High Mountain', group: 'A', defaultLayer: 1, color: 0x64748b, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 576, srcY: 0, autotile: true, autotileBaseX: 576, autotileBaseY: 0, paletteSrcX: 576, paletteSrcY: 0 },
  { id: 68, name: 'Snow Peak', group: 'A', defaultLayer: 1, color: 0x94a3b8, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 672, srcY: 0, autotile: true, autotileBaseX: 672, autotileBaseY: 0, paletteSrcX: 672, paletteSrcY: 0 },

  // Row 3 of Tab A (World_A2: 8 wasteland & desert autotiles)
  { id: 2, name: 'Wasteland', group: 'A', defaultLayer: 0, color: 0xa2865b, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 0, srcY: 144, autotile: true, autotileBaseX: 0, autotileBaseY: 144, paletteSrcX: 0, paletteSrcY: 144 },
  { id: 69, name: 'Desert Sand', group: 'A', defaultLayer: 0, color: 0xf59e0b, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 96, srcY: 144, autotile: true, autotileBaseX: 96, autotileBaseY: 144, paletteSrcX: 96, paletteSrcY: 144 },
  { id: 70, name: 'Sand Dunes', group: 'A', defaultLayer: 0, color: 0xd97706, glyph: '≈', tileset: 'assets/tilesets/World_A2.png', srcX: 192, srcY: 144, autotile: true, autotileBaseX: 192, autotileBaseY: 144, paletteSrcX: 192, paletteSrcY: 144 },
  { id: 18, name: 'Canyon', group: 'A', defaultLayer: 0, color: 0xb45309, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 288, srcY: 144, autotile: true, autotileBaseX: 288, autotileBaseY: 144, paletteSrcX: 288, paletteSrcY: 144 },
  { id: 71, name: 'Desert Tree', group: 'A', defaultLayer: 1, color: 0x78350f, glyph: '†', tileset: 'assets/tilesets/World_A2.png', srcX: 384, srcY: 144, autotile: true, autotileBaseX: 384, autotileBaseY: 144, paletteSrcX: 384, paletteSrcY: 144 },
  { id: 72, name: 'Sand Mound', group: 'A', defaultLayer: 1, color: 0xfde047, glyph: '∩', tileset: 'assets/tilesets/World_A2.png', srcX: 480, srcY: 144, autotile: true, autotileBaseX: 480, autotileBaseY: 144, paletteSrcX: 480, paletteSrcY: 144 },
  { id: 73, name: 'Brown Rock', group: 'A', defaultLayer: 1, color: 0x92400e, glyph: '●', tileset: 'assets/tilesets/World_A2.png', srcX: 576, srcY: 144, autotile: true, autotileBaseX: 576, autotileBaseY: 144, paletteSrcX: 576, paletteSrcY: 144 },
  { id: 74, name: 'Rocky Hill', group: 'A', defaultLayer: 1, color: 0x713f12, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 672, srcY: 144, autotile: true, autotileBaseX: 672, autotileBaseY: 144, paletteSrcX: 672, paletteSrcY: 144 },

  // Row 4 of Tab A (World_A2: 8 cobblestone & volcano autotiles)
  { id: 3, name: 'Cobblestone', group: 'A', defaultLayer: 0, color: 0x777f83, glyph: '▦', tileset: 'assets/tilesets/World_A2.png', srcX: 0, srcY: 288, autotile: true, autotileBaseX: 0, autotileBaseY: 288, paletteSrcX: 0, paletteSrcY: 288 },
  { id: 17, name: 'Stone Gravel', group: 'A', defaultLayer: 0, color: 0x475569, glyph: '▦', tileset: 'assets/tilesets/World_A2.png', srcX: 96, srcY: 288, autotile: true, autotileBaseX: 96, autotileBaseY: 288, paletteSrcX: 96, paletteSrcY: 288 },
  { id: 75, name: 'Lava Fissure', group: 'A', defaultLayer: 0, color: 0xef4444, glyph: '§', tileset: 'assets/tilesets/World_A2.png', srcX: 192, srcY: 288, autotile: true, autotileBaseX: 192, autotileBaseY: 288, paletteSrcX: 192, paletteSrcY: 288 },
  { id: 76, name: 'Magma Crater', group: 'A', defaultLayer: 0, color: 0xb91c1c, glyph: '◎', tileset: 'assets/tilesets/World_A2.png', srcX: 288, srcY: 288, autotile: true, autotileBaseX: 288, autotileBaseY: 288, paletteSrcX: 288, paletteSrcY: 288 },
  { id: 77, name: 'Swamp Tree', group: 'A', defaultLayer: 1, color: 0x3f3f46, glyph: '†', tileset: 'assets/tilesets/World_A2.png', srcX: 384, srcY: 288, autotile: true, autotileBaseX: 384, autotileBaseY: 288, paletteSrcX: 384, paletteSrcY: 288 },
  { id: 78, name: 'Dirt Mound', group: 'A', defaultLayer: 1, color: 0x78716c, glyph: '∩', tileset: 'assets/tilesets/World_A2.png', srcX: 480, srcY: 288, autotile: true, autotileBaseX: 480, autotileBaseY: 288, paletteSrcX: 480, paletteSrcY: 288 },
  { id: 79, name: 'Dark Rock Crag', group: 'A', defaultLayer: 1, color: 0x334155, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 576, srcY: 288, autotile: true, autotileBaseX: 576, autotileBaseY: 288, paletteSrcX: 576, paletteSrcY: 288 },
  { id: 80, name: 'Active Volcano', group: 'A', defaultLayer: 1, color: 0x991b1b, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 672, srcY: 288, autotile: true, autotileBaseX: 672, autotileBaseY: 288, paletteSrcX: 672, paletteSrcY: 288 },

  // Row 5 of Tab A (World_A2: 8 snow & glacier autotiles)
  { id: 81, name: 'Snow Plain', group: 'A', defaultLayer: 0, color: 0xffffff, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 0, srcY: 432, autotile: true, autotileBaseX: 0, autotileBaseY: 432, paletteSrcX: 0, paletteSrcY: 432 },
  { id: 82, name: 'Snow Hills', group: 'A', defaultLayer: 1, color: 0xf1f5f9, glyph: '∩', tileset: 'assets/tilesets/World_A2.png', srcX: 96, srcY: 432, autotile: true, autotileBaseX: 96, autotileBaseY: 432, paletteSrcX: 96, paletteSrcY: 432 },
  { id: 83, name: 'Snow Field', group: 'A', defaultLayer: 0, color: 0xe2e8f0, glyph: '·', tileset: 'assets/tilesets/World_A2.png', srcX: 192, srcY: 432, autotile: true, autotileBaseX: 192, autotileBaseY: 432, paletteSrcX: 192, paletteSrcY: 432 },
  { id: 84, name: 'Ice Shelf', group: 'A', defaultLayer: 0, color: 0xcfd8dc, glyph: '═', tileset: 'assets/tilesets/World_A2.png', srcX: 288, srcY: 432, autotile: true, autotileBaseX: 288, autotileBaseY: 432, paletteSrcX: 288, paletteSrcY: 432 },
  { id: 85, name: 'Snow Pine', group: 'A', defaultLayer: 1, color: 0x94a3b8, glyph: '♠', tileset: 'assets/tilesets/World_A2.png', srcX: 384, srcY: 432, autotile: true, autotileBaseX: 384, autotileBaseY: 432, paletteSrcX: 384, paletteSrcY: 432 },
  { id: 86, name: 'Cave Entrance', group: 'A', defaultLayer: 1, color: 0x18181b, glyph: 'Ω', tileset: 'assets/tilesets/World_A2.png', srcX: 480, srcY: 432, autotile: true, autotileBaseX: 480, autotileBaseY: 432, paletteSrcX: 480, paletteSrcY: 432 },
  { id: 87, name: 'Ice Crystals', group: 'A', defaultLayer: 1, color: 0x7dd3fc, glyph: '♦', tileset: 'assets/tilesets/World_A2.png', srcX: 576, srcY: 432, autotile: true, autotileBaseX: 576, autotileBaseY: 432, paletteSrcX: 576, paletteSrcY: 432 },
  { id: 88, name: 'Glacier Peak', group: 'A', defaultLayer: 1, color: 0x38bdf8, glyph: '▲', tileset: 'assets/tilesets/World_A2.png', srcX: 672, srcY: 432, autotile: true, autotileBaseX: 672, autotileBaseY: 432, paletteSrcX: 672, paletteSrcY: 432 },

  // Legacy compatibility tiles (not shown in Overworld Tab A)
  { id: 0, name: 'Transparent', group: 'A', defaultLayer: 0, color: 0x000000, glyph: '' },
  { id: 5, name: 'Wood Floor', group: 'A', defaultLayer: 0, color: 0x9a7048, glyph: '═', tileset: 'assets/tilesets/Outside_A2.png', srcX: 288, srcY: 0, autotile: true, autotileBaseX: 288, autotileBaseY: 0, paletteSrcX: 288, paletteSrcY: 0 },
  { id: 6, name: 'Wall', group: 'A', defaultLayer: 0, color: 0x5d6268, glyph: '▥', tileset: 'assets/tilesets/Outside_A2.png', srcX: 0, srcY: 144, autotile: true, autotileBaseX: 0, autotileBaseY: 144, paletteSrcX: 0, paletteSrcY: 144 },
  { id: 16, name: 'Dark Wall', group: 'A', defaultLayer: 0, color: 0x3f4448, glyph: '▥', tileset: 'assets/tilesets/Outside_A2.png', srcX: 96, srcY: 144, autotile: true, autotileBaseX: 96, autotileBaseY: 144, paletteSrcX: 96, paletteSrcY: 144 },
  { id: 32, name: 'Bridge', group: 'A', defaultLayer: 1, color: 0x854d0e, glyph: '=', tileset: 'assets/tilesets/Outside_B.png', srcX: 288, srcY: 240 },
  { id: 33, name: 'Cobblestone Old', group: 'A', defaultLayer: 0, color: 0x64748b, glyph: '▦', tileset: 'assets/tilesets/Outside_A2.png', srcX: 480, srcY: 0, autotile: true, autotileBaseX: 480, autotileBaseY: 0, paletteSrcX: 480, paletteSrcY: 0 },
  { id: 34, name: 'Sand Ground Old', group: 'A', defaultLayer: 0, color: 0xd97706, glyph: '·', tileset: 'assets/tilesets/Outside_A2.png', srcX: 576, srcY: 0, autotile: true, autotileBaseX: 576, autotileBaseY: 0, paletteSrcX: 576, paletteSrcY: 0 },

  // Tab B: Nature, Deco & Objects (8 tiles per row)
  {id:7,name:'Flowers',group:'B',defaultLayer:1,color:0xd78aa6,glyph:'✦',tileset:'assets/tilesets/Outside_B.png',srcX:0,srcY:48},
  {id:8,name:'Bush',group:'B',defaultLayer:1,color:0x3f743f,glyph:'♣',tileset:'assets/tilesets/Outside_B.png',srcX:48,srcY:48},
  {id:9,name:'Tree',group:'B',defaultLayer:2,color:0x285e37,glyph:'♠',tileset:'assets/tilesets/Outside_B.png',srcX:0,srcY:96},
  {id:10,name:'Rock',group:'B',defaultLayer:2,color:0x74777b,glyph:'●',tileset:'assets/tilesets/Outside_B.png',srcX:192,srcY:96},
  {id:22,name:'Tall Tree',group:'B',defaultLayer:2,color:0x1b4728,glyph:'♠',tileset:'assets/tilesets/Outside_B.png',srcX:48,srcY:96},
  {id:23,name:'Big Rock',group:'B',defaultLayer:2,color:0x5e6165,glyph:'●',tileset:'assets/tilesets/Outside_B.png',srcX:240,srcY:96},
  {id:24,name:'Barrel',group:'B',defaultLayer:2,color:0x7c4e2b,glyph:'○',tileset:'assets/tilesets/Outside_B.png',srcX:384,srcY:48},
  {id:12,name:'Crate',group:'B',defaultLayer:2,color:0x8b5931,glyph:'□',tileset:'assets/tilesets/Outside_B.png',srcX:336,srcY:48},

  {id:26,name:'Fence',group:'B',defaultLayer:1,color:0xa16207,glyph:'#',tileset:'assets/tilesets/Outside_B.png',srcX:48,srcY:144},
  {id:27,name:'Lamp Post',group:'B',defaultLayer:2,color:0xd97706,glyph:'!',tileset:'assets/tilesets/Outside_B.png',srcX:192,srcY:144},
  {id:25,name:'Well',group:'B',defaultLayer:2,color:0x6b7280,glyph:'◎',tileset:'assets/tilesets/Outside_B.png',srcX:288,srcY:144},
  {id:11,name:'Sign',group:'B',defaultLayer:2,color:0xa66c36,glyph:'⊤',tileset:'assets/tilesets/Outside_B.png',srcX:288,srcY:48},
  {id:35,name:'Pot',group:'B',defaultLayer:2,color:0x9a3412,glyph:'U',tileset:'assets/tilesets/Outside_B.png',srcX:480,srcY:48},
  {id:36,name:'Bench',group:'B',defaultLayer:2,color:0x78350f,glyph:'=',tileset:'assets/tilesets/Outside_B.png',srcX:528,srcY:48},
  {id:37,name:'Grave',group:'B',defaultLayer:2,color:0x64748b,glyph:'+',tileset:'assets/tilesets/Outside_B.png',srcX:576,srcY:48},
  {id:38,name:'Stump',group:'B',defaultLayer:2,color:0x451a03,glyph:'o',tileset:'assets/tilesets/Outside_B.png',srcX:624,srcY:48},

  // Tab C: Structures, Deco & Architecture (8 tiles per row)
  {id:30,name:'Statue',group:'C',defaultLayer:2,color:0x94a3b8,glyph:'&',tileset:'assets/tilesets/Outside_B.png',srcX:384,srcY:144},
  {id:31,name:'Tent',group:'C',defaultLayer:2,color:0xe2e8f0,glyph:'^',tileset:'assets/tilesets/Outside_B.png',srcX:144,srcY:240},
  {id:13,name:'Roof',group:'C',defaultLayer:3,color:0x874b50,glyph:'▲',tileset:'assets/tilesets/Outside_B.png',srcX:480,srcY:0},
  {id:14,name:'Window',group:'C',defaultLayer:3,color:0x78b7ce,glyph:'◇',tileset:'assets/tilesets/Outside_B.png',srcX:576,srcY:96},
  {id:15,name:'Torch',group:'C',defaultLayer:3,color:0xe89b38,glyph:'♦',tileset:'assets/tilesets/Outside_B.png',srcX:672,srcY:96},
  {id:28,name:'Roof Blue',group:'C',defaultLayer:3,color:0x2563eb,glyph:'▲',tileset:'assets/tilesets/Outside_B.png',srcX:528,srcY:0},
  {id:29,name:'Chimney',group:'C',defaultLayer:3,color:0x78350f,glyph:'|',tileset:'assets/tilesets/Outside_B.png',srcX:480,srcY:144},
  {id:39,name:'Door Arch',group:'C',defaultLayer:2,color:0x475569,glyph:'n',tileset:'assets/tilesets/Outside_B.png',srcX:48,srcY:240},

  {id:40,name:'Fountain',group:'C',defaultLayer:2,color:0x38bdf8,glyph:'*',tileset:'assets/tilesets/Outside_B.png',srcX:0,srcY:240},
  {id:41,name:'Bell',group:'C',defaultLayer:2,color:0xeab308,glyph:'A',tileset:'assets/tilesets/Outside_B.png',srcX:96,srcY:240},
  {id:42,name:'Monument',group:'C',defaultLayer:2,color:0x94a3b8,glyph:'T',tileset:'assets/tilesets/Outside_B.png',srcX:192,srcY:240},
  {id:43,name:'Table',group:'C',defaultLayer:2,color:0x854d0e,glyph:'T',tileset:'assets/tilesets/Outside_B.png',srcX:336,srcY:240},
  {id:44,name:'Chair',group:'C',defaultLayer:2,color:0xa16207,glyph:'h',tileset:'assets/tilesets/Outside_B.png',srcX:384,srcY:240},
  {id:45,name:'Banner',group:'C',defaultLayer:2,color:0xdc2626,glyph:'V',tileset:'assets/tilesets/Outside_B.png',srcX:432,srcY:240},
  {id:46,name:'Chest Deco',group:'C',defaultLayer:2,color:0xb45309,glyph:'O',tileset:'assets/tilesets/Outside_B.png',srcX:480,srcY:240},
  {id:47,name:'Magic Portal',group:'C',defaultLayer:2,color:0xa855f7,glyph:'@',tileset:'assets/tilesets/Outside_B.png',srcX:528,srcY:240},

  // Tab R (Group D): Region Markers 1..16
  ...Array.from({length: 16}, (_, i) => ({
    id: 100 + i + 1,
    name: `Region ${i + 1}`,
    group: 'D' as const,
    defaultLayer: 3 as const,
    color: [0xef4444, 0xf97316, 0xf59e0b, 0xeab308, 0x84cc16, 0x22c55e, 0x10b981, 0x06b6d4, 0x0ea5e9, 0x3b82f6, 0x6366f1, 0x8b5cf6, 0xa855f7, 0xd946ef, 0xec4899, 0xf43f5e][i],
    glyph: String(i + 1)
  }))
];

export const DEFAULT_TILESETS: TilesetData[] = [
  { id: 'tileset.overworld', name: 'Overworld', mode: 0, tilesetNames: ['World_A1', 'World_A2', '', '', '', 'World_B', 'World_C', '', ''] },
  { id: 'tileset.outside', name: 'Outside', mode: 1, tilesetNames: ['Outside_A1', 'Outside_A2', 'Outside_A3', 'Outside_A4', 'Outside_A5', 'Outside_B', 'Outside_C', '', ''] },
  { id: 'tileset.inside', name: 'Inside', mode: 1, tilesetNames: ['Inside_A1', 'Inside_A2', '', 'Inside_A4', 'Inside_A5', 'Inside_B', 'Inside_C', '', ''] },
  { id: 'tileset.dungeon', name: 'Dungeon', mode: 1, tilesetNames: ['Dungeon_A1', 'Dungeon_A2', '', 'Dungeon_A4', 'Dungeon_A5', 'Dungeon_B', 'Dungeon_C', '', ''] },
  { id: 'tileset.sf-outside', name: 'SF Outside', mode: 1, tilesetNames: ['Outside_A1', 'Outside_A2', 'SF_Outside_A3', 'SF_Outside_A4', 'SF_Outside_A5', 'SF_Outside_B', 'SF_Outside_C', '', ''] },
  { id: 'tileset.sf-inside', name: 'SF Inside', mode: 1, tilesetNames: ['Inside_A1', 'Inside_A2', '', 'SF_Inside_A4', 'SF_Outside_A5', 'SF_Inside_B', 'SF_Inside_C', '', ''] }
];

export const TILE_MAP = new Map<number, TileDefinition>(TILE_CATALOG.map(tile => [tile.id, tile]));

export function resolveSheetPath(name: string): string {
  if (!name) return '';
  const clean = name.replace(/\\/g, '/').replace(/^\/+/, '');
  if (clean.startsWith('assets/tilesets/')) {
    return clean.endsWith('.png') ? clean : `${clean}.png`;
  }
  return `assets/tilesets/${clean.endsWith('.png') ? clean : `${clean}.png`}`;
}

export function tileDefinition(id: number, tileset?: TilesetData): TileDefinition {
  if (id === 0) return TILE_CATALOG[0];

  // Dynamic Sheet B (IDs 2000..2255)
  if (id >= 2000 && id < 3000) {
    const i = id - 2000;
    const r = Math.floor(i / 8);
    const c = i % 8;
    const srcX = (r < 16 ? c : c + 8) * 48;
    const srcY = (r < 16 ? r : r - 16) * 48;
    const sheetName = tileset?.tilesetNames?.[5] || 'Outside_B';
    return {
      id,
      name: i === 0 ? 'Clear / Transparent' : `Tile B #${i}`,
      group: 'B',
      defaultLayer: 1,
      color: 0x475569,
      glyph: '',
      tileset: resolveSheetPath(sheetName),
      srcX,
      srcY,
      paletteSrcX: srcX,
      paletteSrcY: srcY
    };
  }

  // Dynamic Sheet C (IDs 3000..3255)
  if (id >= 3000 && id < 4000) {
    const i = id - 3000;
    const r = Math.floor(i / 8);
    const c = i % 8;
    const srcX = (r < 16 ? c : c + 8) * 48;
    const srcY = (r < 16 ? r : r - 16) * 48;
    const sheetName = tileset?.tilesetNames?.[6] || 'Outside_C';
    return {
      id,
      name: `Tile C #${i}`,
      group: 'C',
      defaultLayer: 2,
      color: 0x64748b,
      glyph: '',
      tileset: resolveSheetPath(sheetName),
      srcX,
      srcY,
      paletteSrcX: srcX,
      paletteSrcY: srcY
    };
  }

  // Dynamic Sheet D (IDs 4000..4255)
  if (id >= 4000 && id < 5000) {
    const i = id - 4000;
    const r = Math.floor(i / 8);
    const c = i % 8;
    const srcX = (r < 16 ? c : c + 8) * 48;
    const srcY = (r < 16 ? r : r - 16) * 48;
    const sheetName = tileset?.tilesetNames?.[7] || '';
    return {
      id,
      name: `Tile D #${i}`,
      group: 'D',
      defaultLayer: 2,
      color: 0x64748b,
      glyph: '',
      tileset: resolveSheetPath(sheetName),
      srcX,
      srcY,
      paletteSrcX: srcX,
      paletteSrcY: srcY
    };
  }

  // Dynamic Sheet E (IDs 5000..5255)
  if (id >= 5000 && id < 6000) {
    const i = id - 5000;
    const r = Math.floor(i / 8);
    const c = i % 8;
    const srcX = (r < 16 ? c : c + 8) * 48;
    const srcY = (r < 16 ? r : r - 16) * 48;
    const sheetName = tileset?.tilesetNames?.[8] || '';
    return {
      id,
      name: `Tile E #${i}`,
      group: 'D',
      defaultLayer: 2,
      color: 0x64748b,
      glyph: '',
      tileset: resolveSheetPath(sheetName),
      srcX,
      srcY,
      paletteSrcX: srcX,
      paletteSrcY: srcY
    };
  }

  // Dynamic Sheet A5 (IDs 1536..1663)
  if (id >= 1536 && id < 1664) {
    const k = id - 1536;
    const srcX = (k % 8) * 48;
    const srcY = Math.floor(k / 8) * 48;
    const sheetName = tileset?.tilesetNames?.[4] || 'Outside_A5';
    return {
      id,
      name: `Tile A5 #${k}`,
      group: 'A',
      defaultLayer: 0,
      color: 0x334155,
      glyph: '',
      tileset: resolveSheetPath(sheetName),
      srcX,
      srcY,
      paletteSrcX: srcX,
      paletteSrcY: srcY
    };
  }

  // Dynamic Sheet A3: Roof & Building autotiles (IDs 6000..6031)
  if (id >= 6000 && id < 6032) {
    const i = id - 6000;
    const col = i % 8;
    const row = Math.floor(i / 8);
    const autotileBaseX = col * 96;
    const autotileBaseY = row * 96;
    const sheetName = tileset?.tilesetNames?.[2] || 'Outside_A3';
    return {
      id,
      name: `Roof A3 #${i + 1}`,
      group: 'A',
      defaultLayer: 1,
      color: 0x854d0e,
      glyph: '▲',
      tileset: resolveSheetPath(sheetName),
      srcX: autotileBaseX,
      srcY: autotileBaseY,
      paletteSrcX: autotileBaseX,
      paletteSrcY: autotileBaseY,
      autotile: true,
      autotileBaseX,
      autotileBaseY
    };
  }

  // Dynamic Sheet A4: Wall & Cliff autotiles (IDs 7000..7047)
  if (id >= 7000 && id < 7048) {
    const i = id - 7000;
    const col = i % 8;
    const row = Math.floor(i / 8);
    const autotileBaseX = col * 96;
    const autotileBaseY = row * 96;
    const sheetName = tileset?.tilesetNames?.[3] || 'Outside_A4';
    return {
      id,
      name: `Wall A4 #${i + 1}`,
      group: 'A',
      defaultLayer: 0,
      color: 0x475569,
      glyph: '▥',
      tileset: resolveSheetPath(sheetName),
      srcX: autotileBaseX,
      srcY: autotileBaseY,
      paletteSrcX: autotileBaseX,
      paletteSrcY: autotileBaseY,
      autotile: true,
      autotileBaseX,
      autotileBaseY
    };
  }

  return TILE_MAP.get(id) ?? TILE_CATALOG[0];
}

export const layerForTile = (tileId: number, selection: LayerSelection, tileset?: TilesetData) =>
  selection === 'auto' ? tileDefinition(tileId, tileset).defaultLayer : selection;

export function getPaletteTiles(
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'R',
  tileset?: TilesetData
): TileDefinition[] {
  if (group === 'B') {
    const bSheet = resolveSheetPath(tileset?.tilesetNames?.[5] || 'Outside_B');
    const list: TileDefinition[] = [];
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(i / 8);
      const c = i % 8;
      const srcX = (r < 16 ? c : c + 8) * 48;
      const srcY = (r < 16 ? r : r - 16) * 48;
      list.push({
        id: i === 0 ? 0 : 2000 + i,
        name: i === 0 ? 'Clear / Transparent' : `Tile B #${i}`,
        group: 'B',
        defaultLayer: 1,
        color: 0x475569,
        glyph: i === 0 ? '⌫' : '',
        tileset: i === 0 ? undefined : bSheet,
        srcX: i === 0 ? undefined : srcX,
        srcY: i === 0 ? undefined : srcY,
        paletteSrcX: i === 0 ? undefined : srcX,
        paletteSrcY: i === 0 ? undefined : srcY
      });
    }
    return list;
  }

  if (group === 'C') {
    const cSheet = resolveSheetPath(tileset?.tilesetNames?.[6] || 'Outside_C');
    const list: TileDefinition[] = [];
    for (let i = 0; i < 256; i++) {
      const r = Math.floor(i / 8);
      const c = i % 8;
      const srcX = (r < 16 ? c : c + 8) * 48;
      const srcY = (r < 16 ? r : r - 16) * 48;
      list.push({
        id: 3000 + i,
        name: `Tile C #${i}`,
        group: 'C',
        defaultLayer: 2,
        color: 0x64748b,
        glyph: '',
        tileset: cSheet,
        srcX,
        srcY,
        paletteSrcX: srcX,
        paletteSrcY: srcY
      });
    }
    return list;
  }

  if (group === 'D') {
    const dSheet = resolveSheetPath(tileset?.tilesetNames?.[7] || '');
    if (dSheet) {
      const list: TileDefinition[] = [];
      for (let i = 0; i < 256; i++) {
        const r = Math.floor(i / 8);
        const c = i % 8;
        const srcX = (r < 16 ? c : c + 8) * 48;
        const srcY = (r < 16 ? r : r - 16) * 48;
        list.push({
          id: 4000 + i,
          name: `Tile D #${i}`,
          group: 'D',
          defaultLayer: 2,
          color: 0x64748b,
          glyph: '',
          tileset: dSheet,
          srcX,
          srcY,
          paletteSrcX: srcX,
          paletteSrcY: srcY
        });
      }
      return list;
    }
    return TILE_CATALOG.filter(t => t.group === 'D');
  }

  if (group === 'E') {
    const eSheet = resolveSheetPath(tileset?.tilesetNames?.[8] || '');
    if (eSheet) {
      const list: TileDefinition[] = [];
      for (let i = 0; i < 256; i++) {
        const r = Math.floor(i / 8);
        const c = i % 8;
        const srcX = (r < 16 ? c : c + 8) * 48;
        const srcY = (r < 16 ? r : r - 16) * 48;
        list.push({
          id: 5000 + i,
          name: `Tile E #${i}`,
          group: 'D',
          defaultLayer: 2,
          color: 0x64748b,
          glyph: '',
          tileset: eSheet,
          srcX,
          srcY,
          paletteSrcX: srcX,
          paletteSrcY: srcY
        });
      }
      return list;
    }
    return [];
  }

  if (group === 'R') {
    return getPaletteRegions(64) as unknown as TileDefinition[];
  }

  // Group A
  if (tileset?.mode === 1) {
    const a5Sheet = resolveSheetPath(tileset.tilesetNames?.[4] || 'Outside_A5');
    const list: TileDefinition[] = [];
    for (let k = 0; k < 128; k++) {
      const srcX = (k % 8) * 48;
      const srcY = Math.floor(k / 8) * 48;
      list.push({
        id: 1536 + k,
        name: `Tile A5 #${k + 1}`,
        group: 'A',
        defaultLayer: 0,
        color: 0x334155,
        glyph: '',
        tileset: a5Sheet,
        srcX,
        srcY,
        paletteSrcX: srcX,
        paletteSrcY: srcY
      });
    }

    const a3SheetName = tileset.tilesetNames?.[2];
    const a3Tiles: TileDefinition[] = [];
    if (a3SheetName) {
      const a3Path = resolveSheetPath(a3SheetName);
      for (let i = 0; i < 32; i++) {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const bx = col * 96;
        const by = row * 96;
        a3Tiles.push({
          id: 6000 + i,
          name: `Roof A3 #${i + 1}`,
          group: 'A',
          defaultLayer: 1,
          color: 0x854d0e,
          glyph: '▲',
          tileset: a3Path,
          srcX: bx,
          srcY: by,
          paletteSrcX: bx,
          paletteSrcY: by,
          autotile: true,
          autotileBaseX: bx,
          autotileBaseY: by
        });
      }
    }

    const a4SheetName = tileset.tilesetNames?.[3];
    const a4Tiles: TileDefinition[] = [];
    if (a4SheetName) {
      const a4Path = resolveSheetPath(a4SheetName);
      for (let i = 0; i < 48; i++) {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const bx = col * 96;
        const by = row * 96;
        a4Tiles.push({
          id: 7000 + i,
          name: `Wall A4 #${i + 1}`,
          group: 'A',
          defaultLayer: 0,
          color: 0x475569,
          glyph: '▥',
          tileset: a4Path,
          srcX: bx,
          srcY: by,
          paletteSrcX: bx,
          paletteSrcY: by,
          autotile: true,
          autotileBaseX: bx,
          autotileBaseY: by
        });
      }
    }

    const a2Sheet = tileset.tilesetNames?.[1] ? resolveSheetPath(tileset.tilesetNames[1]) : undefined;
    const baseATiles = TILE_CATALOG
      .filter(t => t.group === 'A' && t.paletteSrcX !== undefined)
      .map(t => (a2Sheet && t.tileset?.includes('A2') ? { ...t, tileset: a2Sheet } : t));
    return [...list, ...a3Tiles, ...a4Tiles, ...baseATiles];
  }

  const worldA2 = tileset?.tilesetNames?.[1] ? resolveSheetPath(tileset.tilesetNames[1]) : undefined;
  return TILE_CATALOG
    .filter(tile => tile.group === 'A' && tile.paletteSrcX !== undefined)
    .map(t => (worldA2 && t.tileset?.includes('A2') ? { ...t, tileset: worldA2 } : t));
}

export function normalizeTileLayers(rawLayers:unknown[],cells:number):TileLayer[]{
  if(rawLayers.length>MAP_LAYER_COUNT)throw new Error(`map.layers: maksimal ${MAP_LAYER_COUNT} layer`);
  return Array.from({length:MAP_LAYER_COUNT},(_,index)=>{
    const raw=rawLayers[index];
    if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
      const layer=raw as Record<string,unknown>;
      return {
        ...layer,
        id:String(layer.id),
        type:'tile' as const,
        name:typeof layer.name==='string'&&layer.name.trim()?layer.name:`Layer ${index+1}`,
        data:[...(layer.data as number[])],
        autotileShapes: layer.autotileShapes && typeof layer.autotileShapes === 'object'
          ? (layer.autotileShapes as Record<number, TileQuadrant[]>)
          : undefined
      };
    }
    return {id:`layer.${index+1}`,type:'tile',name:`Layer ${index+1}`,data:Array(cells).fill(0)};
  });
}

export function paintLayerCell(
  layers: TileLayer[],
  layerIndex: number,
  cellIndex: number,
  tileId: number,
  overrideShape?: TileQuadrant[],
  preserveNeighbors = false,
  mapWidth?: number,
  mapHeight?: number,
  tileDef?: TileDefinition
): TileLayer[] {
  const currentLayer = layers[layerIndex];
  const nextData = currentLayer.data.map((value, cell) => (cell === cellIndex ? tileId : value));
  const nextShapes: Record<number, TileQuadrant[]> = currentLayer.autotileShapes
    ? { ...currentLayer.autotileShapes }
    : {};

  if (overrideShape) {
    nextShapes[cellIndex] = overrideShape;

    // Shift Mapping: preserve neighbor shapes so placing this tile does not alter adjacent autotiles
    if (preserveNeighbors && mapWidth && mapHeight) {
      const x = cellIndex % mapWidth;
      const y = Math.floor(cellIndex / mapWidth);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
            const nIndex = ny * mapWidth + nx;
            const nTileId = currentLayer.data[nIndex];
            if (nTileId > 0 && !nextShapes[nIndex]) {
              const nDef = tileDefinition(nTileId);
              if (nDef.autotile && nDef.autotileBaseX !== undefined && nDef.autotileBaseY !== undefined) {
                nextShapes[nIndex] = getAutotileQuadrants(nDef, currentLayer.data, nIndex, mapWidth, mapHeight);
              }
            }
          }
        }
      }
    }
  } else {
    if (nextShapes[cellIndex]) {
      delete nextShapes[cellIndex];
    }
  }

  return layers.map((layer, index) =>
    index === layerIndex
      ? { ...layer, data: nextData, autotileShapes: Object.keys(nextShapes).length > 0 ? nextShapes : undefined }
      : layer
  );
}

export function paintLayerRectangle(
  layers: TileLayer[],
  layerIndex: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tileId: number,
  width: number,
  overrideShape?: TileQuadrant[]
): TileLayer[] {
  const left = Math.min(startX, endX), right = Math.max(startX, endX), top = Math.min(startY, endY), bottom = Math.max(startY, endY);
  const data = [...layers[layerIndex].data];
  const nextShapes: Record<number, TileQuadrant[]> = layers[layerIndex].autotileShapes
    ? { ...layers[layerIndex].autotileShapes }
    : {};

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const cell = y * width + x;
      data[cell] = tileId;
      if (overrideShape) {
        nextShapes[cell] = overrideShape;
      } else if (nextShapes[cell]) {
        delete nextShapes[cell];
      }
    }
  }

  return layers.map((layer, index) =>
    index === layerIndex
      ? { ...layer, data, autotileShapes: Object.keys(nextShapes).length > 0 ? nextShapes : undefined }
      : layer
  );
}

export function autotileMask(data:number[],cellIndex:number,width:number,height:number):number{
  const tileId=data[cellIndex];if(tileId===0)return 0;
  const x=cellIndex%width,y=Math.floor(cellIndex/width);let mask=0;
  if(y===0||data[cellIndex-width]===tileId)mask|=1;
  if(x===width-1||data[cellIndex+1]===tileId)mask|=2;
  if(y===height-1||data[cellIndex+width]===tileId)mask|=4;
  if(x===0||data[cellIndex-1]===tileId)mask|=8;
  return mask;
}

export function floodFillLayer(
  layers: TileLayer[],
  layerIndex: number,
  start: number,
  tileId: number,
  width: number,
  height: number,
  overrideShape?: TileQuadrant[]
): TileLayer[] {
  const source = layers[layerIndex].data;
  const target = source[start];
  if (target === tileId && !overrideShape) return layers;
  const data = [...source], queue = [start], visited = new Uint8Array(width * height);
  const nextShapes: Record<number, TileQuadrant[]> = layers[layerIndex].autotileShapes
    ? { ...layers[layerIndex].autotileShapes }
    : {};

  while (queue.length) {
    const cell = queue.pop()!;
    if (visited[cell] || data[cell] !== target) continue;
    visited[cell] = 1;
    data[cell] = tileId;
    if (overrideShape) {
      nextShapes[cell] = overrideShape;
    } else if (nextShapes[cell]) {
      delete nextShapes[cell];
    }
    const x = cell % width, y = Math.floor(cell / width);
    if (x > 0) queue.push(cell - 1);
    if (x < width - 1) queue.push(cell + 1);
    if (y > 0) queue.push(cell - width);
    if (y < height - 1) queue.push(cell + width);
  }

  return layers.map((layer, index) =>
    index === layerIndex
      ? { ...layer, data, autotileShapes: Object.keys(nextShapes).length > 0 ? nextShapes : undefined }
      : layer
  );
}

export function paintLayerCircle(
  layers: TileLayer[],
  layerIndex: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tileId: number,
  width: number,
  overrideShape?: TileQuadrant[]
): TileLayer[] {
  const left = Math.min(startX, endX), right = Math.max(startX, endX), top = Math.min(startY, endY), bottom = Math.max(startY, endY);
  const rx = (right - left) / 2, ry = (bottom - top) / 2;
  const cx = left + rx, cy = top + ry;
  const data = [...layers[layerIndex].data];
  const nextShapes: Record<number, TileQuadrant[]> = layers[layerIndex].autotileShapes
    ? { ...layers[layerIndex].autotileShapes }
    : {};

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const dx = rx > 0 ? (x - cx) / rx : 0, dy = ry > 0 ? (y - cy) / ry : 0;
      if (dx * dx + dy * dy <= 1.08) {
        const cell = y * width + x;
        data[cell] = tileId;
        if (overrideShape) {
          nextShapes[cell] = overrideShape;
        } else if (nextShapes[cell]) {
          delete nextShapes[cell];
        }
      }
    }
  }

  return layers.map((layer, index) =>
    index === layerIndex
      ? { ...layer, data, autotileShapes: Object.keys(nextShapes).length > 0 ? nextShapes : undefined }
      : layer
  );
}

export interface TileBlock {
  width: number;
  height: number;
  tiles: number[][]; // [row][col]
}

export function paintLayerBlock(
  layers: TileLayer[],
  layerSelection: LayerSelection,
  startX: number,
  startY: number,
  block: TileBlock | number[][],
  mapWidth: number,
  mapHeight: number,
  tileset?: TilesetData,
  lockedLayers?: boolean[]
): TileLayer[] {
  const grid: number[][] = Array.isArray(block) ? block : block.tiles;
  const blockH = grid.length;
  if (blockH === 0) return layers;
  const blockW = grid[0].length;
  if (blockW === 0) return layers;

  const nextLayers = layers.map(l => ({
    ...l,
    data: [...l.data],
    autotileShapes: l.autotileShapes ? { ...l.autotileShapes } : undefined
  }));

  for (let dy = 0; dy < blockH; dy++) {
    const y = startY + dy;
    if (y < 0 || y >= mapHeight) continue;
    for (let dx = 0; dx < blockW; dx++) {
      const x = startX + dx;
      if (x < 0 || x >= mapWidth) continue;

      const tileId = grid[dy][dx];
      const targetLayer = layerForTile(tileId, layerSelection, tileset);
      if (lockedLayers?.[targetLayer]) continue;

      const cell = y * mapWidth + x;
      nextLayers[targetLayer].data[cell] = tileId;
      if (nextLayers[targetLayer].autotileShapes?.[cell]) {
        delete nextLayers[targetLayer].autotileShapes[cell];
      }
    }
  }

  return nextLayers;
}

export function paintLayerBlockRectangle(
  layers: TileLayer[],
  layerSelection: LayerSelection,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  block: TileBlock | number[][],
  mapWidth: number,
  mapHeight: number,
  tileset?: TilesetData,
  lockedLayers?: boolean[]
): TileLayer[] {
  const grid: number[][] = Array.isArray(block) ? block : block.tiles;
  const blockH = grid.length;
  if (blockH === 0) return layers;
  const blockW = grid[0].length;
  if (blockW === 0) return layers;

  const left = Math.min(startX, endX), right = Math.max(startX, endX), top = Math.min(startY, endY), bottom = Math.max(startY, endY);
  const nextLayers = layers.map(l => ({
    ...l,
    data: [...l.data],
    autotileShapes: l.autotileShapes ? { ...l.autotileShapes } : undefined
  }));

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const tileId = grid[(y - top) % blockH][(x - left) % blockW];
      const targetLayer = layerForTile(tileId, layerSelection, tileset);
      if (lockedLayers?.[targetLayer]) continue;

      const cell = y * mapWidth + x;
      nextLayers[targetLayer].data[cell] = tileId;
      if (nextLayers[targetLayer].autotileShapes?.[cell]) {
        delete nextLayers[targetLayer].autotileShapes[cell];
      }
    }
  }

  return nextLayers;
}

export function shiftMapData(
  layers: TileLayer[],
  collision: Array<0 | 1>,
  width: number,
  height: number,
  dx: number,
  dy: number,
  loop: boolean,
  regions?: number[]
): { layers: TileLayer[]; collision: Array<0 | 1>; regions?: number[] } {
  const nextLayers = layers.map(layer => {
    const data = Array(width * height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let nx = x + dx;
        let ny = y + dy;
        if (loop) {
          nx = ((nx % width) + width) % width;
          ny = ((ny % height) + height) % height;
        }
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          data[ny * width + nx] = layer.data[y * width + x];
        }
      }
    }
    return { ...layer, data };
  });

  const nextCollision = Array(width * height).fill(0) as (0 | 1)[];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nx = x + dx;
      let ny = y + dy;
      if (loop) {
        nx = ((nx % width) + width) % width;
        ny = ((ny % height) + height) % height;
      }
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        nextCollision[ny * width + nx] = collision[y * width + x];
      }
    }
  }

  let nextRegions: number[] | undefined;
  if (Array.isArray(regions)) {
    nextRegions = Array(width * height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let nx = x + dx;
        let ny = y + dy;
        if (loop) {
          nx = ((nx % width) + width) % width;
          ny = ((ny % height) + height) % height;
        }
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          nextRegions[ny * width + nx] = regions[y * width + x];
        }
      }
    }
  }

  return { layers: nextLayers, collision: nextCollision, regions: nextRegions };
}

export function generateDungeonData(
  width: number,
  height: number,
  wallTile: number = 6,
  floorTile: number = 3
): { layers: TileLayer[]; collision: Array<0 | 1>; regions: number[] } {
  const cells = width * height;
  const l1 = Array(cells).fill(wallTile);
  const coll = Array(cells).fill(1) as (0 | 1)[];

  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];
  const roomCount = Math.max(2, Math.floor((width * height) / 45));

  for (let i = 0; i < roomCount; i++) {
    const rw = Math.floor(Math.random() * 4) + 3;
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (width - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - rh - 2)) + 1;

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const idx = y * width + x;
        l1[idx] = floorTile;
        coll[idx] = 0;
      }
    }
    rooms.push({ x: rx + Math.floor(rw / 2), y: ry + Math.floor(rh / 2), w: rw, h: rh });
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i], b = rooms[i + 1];
    let cx = a.x, cy = a.y;
    while (cx !== b.x) {
      const idx = cy * width + cx;
      l1[idx] = floorTile;
      coll[idx] = 0;
      cx += cx < b.x ? 1 : -1;
    }
    while (cy !== b.y) {
      const idx = cy * width + cx;
      l1[idx] = floorTile;
      coll[idx] = 0;
      cy += cy < b.y ? 1 : -1;
    }
  }

  const layers: TileLayer[] = [
    { id: 'layer.1', type: 'tile', name: 'Layer 1', data: l1 },
    { id: 'layer.2', type: 'tile', name: 'Layer 2', data: Array(cells).fill(0) },
    { id: 'layer.3', type: 'tile', name: 'Layer 3', data: Array(cells).fill(0) },
    { id: 'layer.4', type: 'tile', name: 'Layer 4', data: Array(cells).fill(0) }
  ];

  return { layers, collision: coll, regions: Array(cells).fill(0) };
}

export interface RegionDefinition {
  id: number;
  name: string;
  color: string;
  glyph: string;
}

export const REGION_COLORS: string[] = [
  'rgba(0,0,0,0)', // 0: clear
  'rgba(239, 68, 68, 0.65)',   // 1: red
  'rgba(249, 115, 22, 0.65)',  // 2: orange
  'rgba(245, 158, 11, 0.65)',  // 3: amber
  'rgba(234, 179, 8, 0.65)',   // 4: yellow
  'rgba(132, 204, 22, 0.65)',  // 5: lime
  'rgba(34, 197, 94, 0.65)',   // 6: green
  'rgba(16, 185, 129, 0.65)',  // 7: emerald
  'rgba(6, 182, 212, 0.65)',   // 8: cyan
  'rgba(14, 165, 233, 0.65)',  // 9: sky
  'rgba(59, 130, 246, 0.65)',  // 10: blue
  'rgba(99, 102, 241, 0.65)',  // 11: indigo
  'rgba(139, 92, 246, 0.65)',  // 12: violet
  'rgba(168, 85, 247, 0.65)',  // 13: purple
  'rgba(217, 70, 239, 0.65)',  // 14: fuchsia
  'rgba(236, 72, 153, 0.65)',  // 15: pink
  'rgba(244, 63, 94, 0.65)'    // 16: rose
];

export function getRegionColor(regionId: number): string {
  if (regionId <= 0) return 'rgba(0,0,0,0)';
  if (regionId < REGION_COLORS.length) return REGION_COLORS[regionId];
  const hue = Math.round(((regionId - 1) * 137.508) % 360);
  return `hsla(${hue}, 80%, 45%, 0.65)`;
}

export function getPaletteRegions(count = 64): RegionDefinition[] {
  const list: RegionDefinition[] = [
    { id: 0, name: 'Clear Region', color: 'rgba(0,0,0,0.15)', glyph: '⌫' }
  ];
  for (let r = 1; r <= count; r++) {
    list.push({
      id: r,
      name: `Region ${r}`,
      color: getRegionColor(r),
      glyph: String(r)
    });
  }
  return list;
}

export function paintRegionCell(
  regions: number[],
  cellIndex: number,
  regionId: number
): number[] {
  const next = [...regions];
  next[cellIndex] = Math.max(0, Math.min(255, regionId));
  return next;
}

export function paintRegionRectangle(
  regions: number[],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  regionId: number,
  width: number
): number[] {
  const left = Math.min(startX, endX), right = Math.max(startX, endX);
  const top = Math.min(startY, endY), bottom = Math.max(startY, endY);
  const next = [...regions];
  const reg = Math.max(0, Math.min(255, regionId));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      next[y * width + x] = reg;
    }
  }
  return next;
}

export function paintRegionCircle(
  regions: number[],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  regionId: number,
  width: number
): number[] {
  const left = Math.min(startX, endX), right = Math.max(startX, endX);
  const top = Math.min(startY, endY), bottom = Math.max(startY, endY);
  const rx = (right - left) / 2, ry = (bottom - top) / 2;
  const cx = left + rx, cy = top + ry;
  const next = [...regions];
  const reg = Math.max(0, Math.min(255, regionId));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const dx = rx > 0 ? (x - cx) / rx : 0, dy = ry > 0 ? (y - cy) / ry : 0;
      if (dx * dx + dy * dy <= 1.08) {
        next[y * width + x] = reg;
      }
    }
  }
  return next;
}

export function floodFillRegion(
  regions: number[],
  start: number,
  regionId: number,
  width: number,
  height: number
): number[] {
  const target = regions[start];
  const reg = Math.max(0, Math.min(255, regionId));
  if (target === reg) return regions;
  const next = [...regions];
  const queue = [start];
  const visited = new Uint8Array(width * height);
  while (queue.length) {
    const cell = queue.pop()!;
    if (visited[cell] || next[cell] !== target) continue;
    visited[cell] = 1;
    next[cell] = reg;
    const x = cell % width, y = Math.floor(cell / width);
    if (x > 0) queue.push(cell - 1);
    if (x < width - 1) queue.push(cell + 1);
    if (y > 0) queue.push(cell - width);
    if (y < height - 1) queue.push(cell + width);
  }
  return next;
}

// ------------------------------------------------------------------------------------------------
// RPG Maker MZ Standard Tileset Flags & Passage Resolution
// 0x0001 (1)   : Impassable DOWN
// 0x0002 (2)   : Impassable LEFT
// 0x0004 (4)   : Impassable RIGHT
// 0x0008 (8)   : Impassable UP
// 0x000f (15)  : Impassable in all 4 directions (×)
// 0x0010 (16)  : Star (☆) Overhead / Roof (transparent to passage)
// 0x0020 (32)  : Ladder (▲) Always face UP
// 0x0040 (64)  : Bush (～) Lower sprite depth / semi-transparency
// 0x0080 (128) : Counter (◆) Action button reaches 1 tile beyond
// 0x0100 (256) : Damage floor (⚡) Inflicts 10 HP floor damage
// 0x7000 (bits 12-14): Terrain Tag (0..7)
// ------------------------------------------------------------------------------------------------

export function getTileFlag(tileId: number, tileset?: TilesetData): number {
  if (tileId === 0) return 0x10; // Clear tile is Star (transparent)

  let flagIndex = tileId;
  if (tileId >= 2000 && tileId < 3000) {
    flagIndex = tileId - 2000; // Sheet B (0..255)
    if (flagIndex === 0) return 0x10; // Tile 0 of sheet B is Star by default
  } else if (tileId >= 3000 && tileId < 4000) {
    flagIndex = 256 + (tileId - 3000); // Sheet C (256..511)
  } else if (tileId >= 4000 && tileId < 5000) {
    flagIndex = 512 + (tileId - 4000); // Sheet D (512..767)
  } else if (tileId >= 5000 && tileId < 6000) {
    flagIndex = 768 + (tileId - 5000); // Sheet E (768..1023)
  }

  if (Array.isArray(tileset?.flags) && tileset.flags[flagIndex] !== undefined) {
    return tileset.flags[flagIndex];
  }

  // Fallback defaults based on catalog definition
  if (tileId === 8) return 0x40; // Bush
  if (tileId === 43) return 0x80 | 0x0f; // Counter table (solid + counter)
  if (tileId === 13 || tileId === 28) return 0x10; // Roof (Star)
  if (tileId >= 101 && tileId <= 116) return 0x10; // Region tags (transparent)
  if (tileId >= 6000 && tileId < 6032) return 0x00; // Roofs passable by default
  if (tileId >= 7000 && tileId < 7048) return 0x0f; // Walls impassable by default
  if ([1, 2, 3, 4, 6, 9, 10, 16, 22, 23, 24, 25, 26, 27, 30, 31, 35, 40, 42].includes(tileId)) {
    return 0x0f; // Impassable
  }
  return 0x00; // Default passable
}

export function getHighestTileFlagAt(bundle: ProjectBundle, mapId: string, x: number, y: number): number {
  const map = bundle.maps[mapId];
  if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) return 0x0f;

  const tilesets = (bundle.game.tilesets && bundle.game.tilesets.length > 0)
    ? bundle.game.tilesets
    : DEFAULT_TILESETS;
  const currentTileset = (map.tilesetId ? tilesets.find(ts => ts.id === map.tilesetId) : undefined)
    || tilesets.find(ts => ts.mode === (map.name?.toLowerCase().includes('world') ? 0 : 1))
    || tilesets[0];

  const cell = y * map.width + x;
  let groundFlag = 0;

  for (let l = map.layers.length - 1; l >= 0; l--) {
    const tileId = map.layers[l].data[cell];
    if (tileId === 0) continue;
    const flag = getTileFlag(tileId, currentTileset);
    if (l === 0) groundFlag = flag;
    if ((flag & 0x10) !== 0) continue; // Star tile is transparent to passage
    return flag;
  }

  return groundFlag;
}

export function isLadderTile(bundle: ProjectBundle, mapId: string, x: number, y: number): boolean {
  return (getHighestTileFlagAt(bundle, mapId, x, y) & 0x20) !== 0;
}

export function isBushTile(bundle: ProjectBundle, mapId: string, x: number, y: number): boolean {
  return (getHighestTileFlagAt(bundle, mapId, x, y) & 0x40) !== 0;
}

export function isCounterTile(bundle: ProjectBundle, mapId: string, x: number, y: number): boolean {
  return (getHighestTileFlagAt(bundle, mapId, x, y) & 0x80) !== 0;
}

export function isDamageFloorTile(bundle: ProjectBundle, mapId: string, x: number, y: number): boolean {
  return (getHighestTileFlagAt(bundle, mapId, x, y) & 0x100) !== 0;
}

export function terrainTag(bundle: ProjectBundle, mapId: string, x: number, y: number): number {
  return (getHighestTileFlagAt(bundle, mapId, x, y) >> 12) & 0x07;
}
