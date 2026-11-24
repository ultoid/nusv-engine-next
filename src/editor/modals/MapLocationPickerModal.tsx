import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ProjectBundle, TilesetData } from '../../core/types.js';
import { tileDefinition, getAutotileQuadrants } from '../../core/map-layers.js';

export interface MapLocationPickerModalProps {
  bundle: ProjectBundle;
  initialMapId?: string;
  initialX?: number;
  initialY?: number;
  assetUrls?: Record<string, string>;
  title?: string;
  onSelect: (mapId: string, x: number, y: number) => void;
  onClose: () => void;
}

export function MapLocationPickerModal({
  bundle,
  initialMapId,
  initialX = 0,
  initialY = 0,
  assetUrls = {},
  title = 'Select Location',
  onSelect,
  onClose
}: MapLocationPickerModalProps) {
  // Available maps in the project
  const mapIds = bundle.project.maps;
  const defaultMapId = initialMapId && bundle.maps[initialMapId] ? initialMapId : mapIds[0] || '';

  const [selectedMapId, setSelectedMapId] = useState<string>(defaultMapId);
  const [selectedX, setSelectedX] = useState<number>(initialX);
  const [selectedY, setSelectedY] = useState<number>(initialY);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState<string>('');
  const [canvasTick, setCanvasTick] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  const activeMap = bundle.maps[selectedMapId];

  // Clamp selection when map changes
  useEffect(() => {
    if (activeMap) {
      setSelectedX(prev => Math.max(0, Math.min(prev, activeMap.width - 1)));
      setSelectedY(prev => Math.max(0, Math.min(prev, activeMap.height - 1)));
    }
  }, [selectedMapId, activeMap]);

  // Current tileset for the selected map
  const currentTileset: TilesetData = useMemo(() => {
    if (!activeMap) return bundle.game.tilesets?.[0] as TilesetData;
    const found = bundle.game.tilesets?.find(t => t.id === activeMap.tilesetId);
    return (found || bundle.game.tilesets?.[0]) as TilesetData;
  }, [activeMap, bundle.game.tilesets]);

  // Filtered map list
  const filteredMapIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mapIds;
    return mapIds.filter(id => {
      const name = bundle.maps[id]?.name || id;
      return id.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [mapIds, bundle.maps, search]);

  // Preload tileset images
  useEffect(() => {
    for (const [, url] of Object.entries(assetUrls)) {
      if (!imageCacheRef.current[url]) {
        const img = new Image();
        img.src = url;
        img.onload = () => setCanvasTick(t => t + 1);
        imageCacheRef.current[url] = img;
      }
    }
  }, [assetUrls]);

  // Render map layers onto the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeMap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all layers (0..3)
    activeMap.layers.forEach((layer, layerIndex) => {
      for (let index = 0; index < layer.data.length; index++) {
        const tileId = layer.data[index];
        if (tileId === 0) continue;
        const tile = tileDefinition(tileId, currentTileset);
        if (!tile || tile.id === 0) continue;

        const x = (index % activeMap.width) * 48;
        const y = Math.floor(index / activeMap.width) * 48;
        const imgUrl = tile.tileset ? assetUrls[tile.tileset] : null;

        if (imgUrl && !imageCacheRef.current[imgUrl]) {
          const newImg = new Image();
          newImg.src = imgUrl;
          newImg.onload = () => setCanvasTick(t => t + 1);
          imageCacheRef.current[imgUrl] = newImg;
        }
        const img = imgUrl ? imageCacheRef.current[imgUrl] : null;

        if (layerIndex === 0 && tile.defaultLayer === 1) {
          ctx.fillStyle = '#558844';
          ctx.fillRect(x, y, 48, 48);
        }

        if (img && img.complete && img.naturalWidth > 0) {
          if (tile.autotile && tile.autotileBaseX !== undefined && tile.autotileBaseY !== undefined) {
            const quads = getAutotileQuadrants(tile, layer.data, index, activeMap.width, activeMap.height, layer.autotileShapes?.[index]);
            for (let q = 0; q < 4; q++) {
              const quad = quads[q];
              ctx.drawImage(img, quad.srcX, quad.srcY, 24, 24, x + quad.left, y + quad.top, 24, 24);
            }
          } else if (tile.srcX !== undefined && tile.srcY !== undefined) {
            ctx.drawImage(img, tile.srcX, tile.srcY, 48, 48, x, y, 48, 48);
          }
        } else {
          ctx.fillStyle = `#${tile.color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(x, y, 48, 48);
          if (tile.glyph) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.glyph, x + 24, y + 24);
          }
        }
      }
    });

    // Draw subtle 48x48 grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let col = 0; col <= activeMap.width; col++) {
      ctx.beginPath();
      ctx.moveTo(col * 48 + 0.5, 0);
      ctx.lineTo(col * 48 + 0.5, activeMap.height * 48);
      ctx.stroke();
    }
    for (let row = 0; row <= activeMap.height; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * 48 + 0.5);
      ctx.lineTo(activeMap.width * 48, row * 48 + 0.5);
      ctx.stroke();
    }

    // Draw existing events as landmark badges
    activeMap.events.forEach(ev => {
      const ex = ev.x * 48;
      const ey = ev.y * 48;

      ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.fillRect(ex + 2, ey + 2, 44, 44);

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex + 2, ey + 2, 44, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = (ev.name || ev.id).slice(0, 6);
      ctx.fillText(label, ex + 24, ey + 24);
    });
  }, [activeMap, currentTileset, canvasTick, assetUrls]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeMap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / 48);
    const cellY = Math.floor((e.clientY - rect.top) / 48);

    if (cellX >= 0 && cellX < activeMap.width && cellY >= 0 && cellY < activeMap.height) {
      setSelectedX(cellX);
      setSelectedY(cellY);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeMap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / 48);
    const cellY = Math.floor((e.clientY - rect.top) / 48);

    if (cellX >= 0 && cellX < activeMap.width && cellY >= 0 && cellY < activeMap.height) {
      onSelect(selectedMapId, cellX, cellY);
      onClose();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeMap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor((e.clientX - rect.left) / 48);
    const cellY = Math.floor((e.clientY - rect.top) / 48);

    if (cellX >= 0 && cellX < activeMap.width && cellY >= 0 && cellY < activeMap.height) {
      setHoverCell({ x: cellX, y: cellY });
    } else {
      setHoverCell(null);
    }
  };

  const handleApply = () => {
    if (!selectedMapId) return;
    onSelect(selectedMapId, selectedX, selectedY);
    onClose();
  };

  const isSolid = activeMap ? activeMap.collision[selectedY * activeMap.width + selectedX] === 1 : false;

  return (
    <div className="mz-location-picker-backdrop" onClick={onClose}>
      <div className="mz-location-picker-dialog" onClick={e => e.stopPropagation()}>
        {/* Title bar */}
        <div className="mz-dialog-titlebar">
          <span>{title}</span>
          <button className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        {/* Main Body */}
        <div className="mz-location-picker-body">
          {/* Left panel: Map list */}
          <div className="mz-location-map-panel">
            <div className="mz-panel-header" style={{ padding: '6px 8px' }}>
              <input
                type="text"
                className="mz-input"
                style={{ width: '100%', height: '24px', fontSize: '11px' }}
                placeholder="Cari peta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="mz-location-map-list">
              {filteredMapIds.map(id => {
                const map = bundle.maps[id];
                const isSelected = id === selectedMapId;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`mz-char-file-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedMapId(id)}
                    title={`${id}: ${map?.name || id}`}
                  >
                    {id}: {map?.name || id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Visual Map Canvas Viewport */}
          <div className="mz-location-viewport-panel">
            <div className="mz-location-viewport-header">
              <span>{activeMap?.name || selectedMapId} ({activeMap?.width} × {activeMap?.height})</span>
              <span style={{ fontWeight: 'normal', color: '#64748b' }}>
                {hoverCell ? `Kursor: (${hoverCell.x}, ${hoverCell.y})` : 'Klik sel peta untuk memilih koordinat'}
              </span>
            </div>

            <div className="mz-location-canvas-scroll">
              {activeMap ? (
                <div
                  className="mz-location-canvas-wrapper"
                  style={{
                    width: `${activeMap.width * 48}px`,
                    height: `${activeMap.height * 48}px`
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={activeMap.width * 48}
                    height={activeMap.height * 48}
                    style={{
                      width: `${activeMap.width * 48}px`,
                      height: `${activeMap.height * 48}px`,
                      display: 'block',
                      imageRendering: 'pixelated'
                    }}
                    onClick={handleCanvasClick}
                    onDoubleClick={handleCanvasDoubleClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={() => setHoverCell(null)}
                  />

                  {/* High visibility selection cursor */}
                  <div
                    className="mz-location-cursor"
                    style={{
                      left: `${selectedX * 48}px`,
                      top: `${selectedY * 48}px`,
                      width: '48px',
                      height: '48px'
                    }}
                  />
                </div>
              ) : (
                <div style={{ margin: 'auto', color: '#e2e8f0' }}>Peta tidak ditemukan.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left">
            <span style={{ fontSize: '11px', color: '#334155' }}>
              Lokasi: <strong>{activeMap?.name || selectedMapId}</strong> ({selectedX}, {selectedY})
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: isSolid ? '#fee2e2' : '#dcfce7',
                color: isSolid ? '#dc2626' : '#15803d'
              }}
            >
              {isSolid ? '⚠️ Solid (Terhalang)' : '✓ Passable (Dapat Dilewati)'}
            </span>
          </div>
          <div className="mz-footer-right">
            <button type="button" className="mz-btn mz-btn-primary" onClick={handleApply}>OK</button>
            <button type="button" className="mz-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
