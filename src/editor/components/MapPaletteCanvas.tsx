import React, { useEffect, useRef, useState } from 'react';
import type { TileDefinition } from '../../core/map-layers.js';
import { getCachedImage } from '../imageCache.js';

export interface PaletteBlockSelection {
  minCol: number;
  minRow: number;
  maxCol: number;
  maxRow: number;
  width: number;
  height: number;
  tiles: number[][]; // [row][col]
}

export interface MapPaletteCanvasProps {
  paletteGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'R';
  paletteTiles: TileDefinition[];
  selectedTile: number;
  selectedBlock?: PaletteBlockSelection;
  onSelectBlock: (block: PaletteBlockSelection) => void;
  activeSheetUrl?: string;
  assetUrls: Record<string, string>;
}

export function MapPaletteCanvas({
  paletteGroup,
  paletteTiles,
  selectedTile,
  selectedBlock,
  onSelectBlock,
  activeSheetUrl,
  assetUrls
}: MapPaletteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef<{ col: number; row: number } | null>(null);

  const rowCount = Math.max(8, Math.ceil(paletteTiles.length / 8));
  const canvasWidth = 256;
  const canvasHeight = rowCount * 32;

  const getColRow = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { col: 0, row: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.max(0, Math.min(7, Math.floor(x / 32)));
    const row = Math.max(0, Math.min(rowCount - 1, Math.floor(y / 32)));
    return { col, row };
  };

  const updateBlockSelection = (start: { col: number; row: number }, current: { col: number; row: number }) => {
    const minCol = Math.min(start.col, current.col);
    const maxCol = Math.max(start.col, current.col);
    const minRow = Math.min(start.row, current.row);
    const maxRow = Math.max(start.row, current.row);
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;

    const tiles: number[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowTiles: number[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const idx = r * 8 + c;
        rowTiles.push(paletteTiles[idx]?.id ?? 0);
      }
      tiles.push(rowTiles);
    }

    onSelectBlock({ minCol, minRow, maxCol, maxRow, width, height, tiles });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      const pos = getColRow(e);
      isMouseDownRef.current = true;
      dragStartRef.current = pos;
      updateBlockSelection(pos, pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getColRow(e);
    const idx = pos.row * 8 + pos.col;
    if (idx < paletteTiles.length) {
      if (hoverIdx !== idx) setHoverIdx(idx);
    } else if (hoverIdx !== null) {
      setHoverIdx(null);
    }

    if (isMouseDownRef.current && dragStartRef.current) {
      updateBlockSelection(dragStartRef.current, pos);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
      dragStartRef.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Background
    ctx.fillStyle = '#8b95a2';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw tiles
    if (paletteGroup === 'B' || paletteGroup === 'C' || paletteGroup === 'D' || paletteGroup === 'E') {
      if (activeSheetUrl) {
        const img = getCachedImage(activeSheetUrl, () => setRenderTick(t => t + 1));
        if (img && img.complete && img.naturalWidth > 0) {
          // Upper 16 rows (left 8 cols of 768x768 sheet)
          ctx.drawImage(img, 0, 0, 384, 768, 0, 0, 256, 512);
          // Lower 16 rows (right 8 cols of 768x768 sheet)
          ctx.drawImage(img, 384, 0, 384, 768, 0, 512, 256, 512);
        }
      }
      if (paletteGroup === 'B') {
        // Tile 0 clear / eraser
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⌫', 16, 16);
      }
    } else if (paletteGroup === 'R') {
      paletteTiles.forEach((tile, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const dx = col * 32;
        const dy = row * 32;
        ctx.fillStyle = typeof tile.color === 'string' ? tile.color : `#${tile.color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(dx, dy, 32, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile.glyph || String(tile.id), dx + 16, dy + 16);
      });
    } else {
      paletteTiles.forEach((tile, idx) => {
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        const dx = col * 32;
        const dy = row * 32;
        const imgUrl = tile.tileset ? assetUrls[tile.tileset] : null;
        if (imgUrl) {
          const img = getCachedImage(imgUrl, () => setRenderTick(t => t + 1));
          if (img && img.complete && img.naturalWidth > 0) {
            const pSrcX = tile.paletteSrcX ?? tile.srcX ?? 0;
            const pSrcY = tile.paletteSrcY ?? tile.srcY ?? 0;
            ctx.drawImage(img, pSrcX, pSrcY, 48, 48, dx, dy, 32, 32);
          } else {
            ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(dx, dy, 32, 32);
          }
        } else {
          ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(dx, dy, 32, 32);
          if (tile.glyph) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.glyph, dx + 16, dy + 16);
          }
        }
      });
    }

    // 3. Grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= 8; c++) {
      ctx.moveTo(c * 32 + 0.5, 0);
      ctx.lineTo(c * 32 + 0.5, canvasHeight);
    }
    for (let r = 0; r <= rowCount; r++) {
      ctx.moveTo(0, r * 32 + 0.5);
      ctx.lineTo(canvasWidth, r * 32 + 0.5);
    }
    ctx.stroke();

    // 4. Hover tile outline
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < paletteTiles.length) {
      const hCol = hoverIdx % 8;
      const hRow = Math.floor(hoverIdx / 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hCol * 32 + 0.5, hRow * 32 + 0.5, 31, 31);
    }

    // 5. Selected tile / block outline (Authentic RPG Maker MZ double border)
    if (selectedBlock) {
      const sx = selectedBlock.minCol * 32;
      const sy = selectedBlock.minRow * 32;
      const sw = selectedBlock.width * 32;
      const sh = selectedBlock.height * 32;

      // Outer black border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);

      // Inner white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 2.5, sy + 2.5, sw - 5, sh - 5);

      if (selectedBlock.width > 1 || selectedBlock.height > 1) {
        ctx.fillStyle = 'rgba(0, 210, 255, 0.16)';
        ctx.fillRect(sx + 3, sy + 3, sw - 6, sh - 6);
      }
    } else {
      const selIdx = paletteTiles.findIndex(t => t.id === selectedTile);
      if (selIdx !== -1) {
        const sCol = selIdx % 8;
        const sRow = Math.floor(selIdx / 8);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(sCol * 32 + 1, sRow * 32 + 1, 30, 30);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sCol * 32 + 2.5, sRow * 32 + 2.5, 27, 27);
      }
    }
  }, [paletteGroup, paletteTiles, selectedTile, selectedBlock, activeSheetUrl, assetUrls, hoverIdx, renderTick, rowCount, canvasHeight]);

  const hoverTile = hoverIdx !== null ? paletteTiles[hoverIdx] : null;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="mv-palette-canvas"
      style={{ display: 'block', margin: '0 auto', imageRendering: 'pixelated', cursor: 'pointer' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      title={hoverTile ? `${hoverTile.name} · Auto Layer ${hoverTile.defaultLayer + 1}` : undefined}
    />
  );
}
