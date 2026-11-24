import React from 'react';
import { TILE_CATALOG } from '../../core/map-layers.js';

export interface DungeonGeneratorModalProps {
  dungeonFloor: number;
  dungeonWall: number;
  onFloorChange: (val: number) => void;
  onWallChange: (val: number) => void;
  onApply: () => void;
  onClose: () => void;
}

export function DungeonGeneratorModal({
  dungeonFloor,
  dungeonWall,
  onFloorChange,
  onWallChange,
  onApply,
  onClose
}: DungeonGeneratorModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Generate Dungeon</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#555' }}>
            Secara otomatis menghasilkan tata letak labirin ruangan & koridor menggunakan tileset yang dipilih.
          </p>
          <div className="mv-form-row">
            <div className="mv-field-group">
              <label>Floor Tile</label>
              <select
                value={dungeonFloor}
                onChange={e => onFloorChange(parseInt(e.target.value, 10) || 3)}
              >
                {TILE_CATALOG.filter(t => t.id !== 0).map(t => (
                  <option key={t.id} value={t.id}>{t.glyph} {t.name} (#{t.id})</option>
                ))}
              </select>
            </div>
            <div className="mv-field-group">
              <label>Wall Tile</label>
              <select
                value={dungeonWall}
                onChange={e => onWallChange(parseInt(e.target.value, 10) || 6)}
              >
                {TILE_CATALOG.filter(t => t.id !== 0).map(t => (
                  <option key={t.id} value={t.id}>{t.glyph} {t.name} (#{t.id})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onApply}>Generate</button>
        </div>
      </div>
    </div>
  );
}
