import React from 'react';
import { DEFAULT_TILESETS } from '../../core/map-layers.js';
import type { ProjectBundle, TilesetData } from '../../core/types.js';

export interface MapPropertiesModalProps {
  bundle: ProjectBundle;
  currentTileset: TilesetData;
  mapEditName: string;
  mapEditDisplayName: string;
  mapEditWidth: number;
  mapEditHeight: number;
  mapEditTilesetId: string;
  mapEditScroll: string;
  mapEditBgm: string;
  mapEditParallaxName: string;
  mapEditParallaxLoopX: boolean;
  mapEditParallaxLoopY: boolean;
  mapEditParallaxSx: number;
  mapEditParallaxSy: number;
  mapEditBattleback1: string;
  mapEditBattleback2: string;
  mapEditEncounterStep: number;
  mapEditDisableDash: boolean;
  mapEditNote: string;
  setMapEditName: (v: string) => void;
  setMapEditDisplayName: (v: string) => void;
  setMapEditWidth: (v: number) => void;
  setMapEditHeight: (v: number) => void;
  setMapEditTilesetId: (v: string) => void;
  setMapEditScroll: (v: string) => void;
  setMapEditBgm: (v: string) => void;
  setMapEditParallaxName: (v: string) => void;
  setMapEditParallaxLoopX: (v: boolean) => void;
  setMapEditParallaxLoopY: (v: boolean) => void;
  setMapEditParallaxSx: (v: number) => void;
  setMapEditParallaxSy: (v: number) => void;
  setMapEditBattleback1: (v: string) => void;
  setMapEditBattleback2: (v: string) => void;
  setMapEditEncounterStep: (v: number) => void;
  setMapEditDisableDash: (v: boolean) => void;
  setMapEditNote: (v: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export function MapPropertiesModal({
  bundle,
  currentTileset,
  mapEditName,
  mapEditDisplayName,
  mapEditWidth,
  mapEditHeight,
  mapEditTilesetId,
  mapEditScroll,
  mapEditBgm,
  mapEditParallaxName,
  mapEditParallaxLoopX,
  mapEditParallaxLoopY,
  mapEditParallaxSx,
  mapEditParallaxSy,
  mapEditBattleback1,
  mapEditBattleback2,
  mapEditEncounterStep,
  mapEditDisableDash,
  mapEditNote,
  setMapEditName,
  setMapEditDisplayName,
  setMapEditWidth,
  setMapEditHeight,
  setMapEditTilesetId,
  setMapEditScroll,
  setMapEditBgm,
  setMapEditParallaxName,
  setMapEditParallaxLoopX,
  setMapEditParallaxLoopY,
  setMapEditParallaxSx,
  setMapEditParallaxSy,
  setMapEditBattleback1,
  setMapEditBattleback2,
  setMapEditEncounterStep,
  setMapEditDisableDash,
  setMapEditNote,
  onApply,
  onClose
}: MapPropertiesModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Map Properties — {mapEditName}</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ overflowY: 'auto' }}>
          <div className="mv-dialog-form">
            <div className="mv-field-row">
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Nama Peta</label>
                <input
                  type="text"
                  value={mapEditName}
                  onChange={e => setMapEditName(e.target.value)}
                />
              </div>
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Display Name (Tampilan di Game)</label>
                <input
                  type="text"
                  placeholder="Misal: Desa Tenang, Hutan Kuno..."
                  value={mapEditDisplayName}
                  onChange={e => setMapEditDisplayName(e.target.value)}
                />
              </div>
            </div>
            <div className="mv-field-row">
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Width (Lebar Tile)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={mapEditWidth}
                  onChange={e => setMapEditWidth(Number(e.target.value))}
                />
              </div>
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Height (Tinggi Tile)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={mapEditHeight}
                  onChange={e => setMapEditHeight(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mv-field-row">
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Tileset (Database)</label>
                <select
                  value={mapEditTilesetId}
                  onChange={e => setMapEditTilesetId(e.target.value)}
                >
                  <option value="">(Bawaan: {currentTileset.name})</option>
                  {(Array.isArray(bundle.game.tilesets) && bundle.game.tilesets.length > 0 ? bundle.game.tilesets : DEFAULT_TILESETS).map(ts => (
                    <option key={ts.id} value={ts.id}>
                      {ts.name} ({ts.mode === 0 ? 'World Type' : 'Area Type'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mv-field-group" style={{ flex: 1 }}>
                <label>Scroll Type</label>
                <select
                  value={mapEditScroll}
                  onChange={e => setMapEditScroll(e.target.value)}
                >
                  <option value="none">No Loop (Tanpa Perulangan)</option>
                  <option value="vertical">Loop Vertical</option>
                  <option value="horizontal">Loop Horizontal</option>
                  <option value="both">Loop Both (Dua Arah)</option>
                </select>
              </div>
            </div>
            <div className="mv-field-group">
              <label>BGM (Background Music)</label>
              <select
                value={mapEditBgm}
                onChange={e => setMapEditBgm(e.target.value)}
              >
                <option value="calm">Calm (Suasana Damai)</option>
                <option value="danger">Danger (Ketegangan / Gua)</option>
                <option value="boss">Boss Theme (Pertarungan)</option>
                <option value="silence">Silence (Hening)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0', paddingTop: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#334155', marginBottom: '8px' }}>Parallax Background</div>
              <div className="mv-field-row">
                <div className="mv-field-group" style={{ flex: 2 }}>
                  <label>Gambar Parallax</label>
                  <input
                    type="text"
                    placeholder="Misal: Mountains, Sunset..."
                    value={mapEditParallaxName}
                    onChange={e => setMapEditParallaxName(e.target.value)}
                  />
                </div>
                <div className="mv-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                    <input type="checkbox" checked={mapEditParallaxLoopX} onChange={e => setMapEditParallaxLoopX(e.target.checked)} /> Loop X
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                    <input type="checkbox" checked={mapEditParallaxLoopY} onChange={e => setMapEditParallaxLoopY(e.target.checked)} /> Loop Y
                  </label>
                </div>
              </div>
              <div className="mv-field-row">
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Scroll Speed X</label>
                  <input type="number" min={-32} max={32} value={mapEditParallaxSx} onChange={e => setMapEditParallaxSx(Number(e.target.value))} />
                </div>
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Scroll Speed Y</label>
                  <input type="number" min={-32} max={32} value={mapEditParallaxSy} onChange={e => setMapEditParallaxSy(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0', paddingTop: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#334155', marginBottom: '8px' }}>Battle Background & Encounters</div>
              <div className="mv-field-row">
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Battleback 1 (Lantai)</label>
                  <input type="text" placeholder="Misal: Grassland, DirtCave..." value={mapEditBattleback1} onChange={e => setMapEditBattleback1(e.target.value)} />
                </div>
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Battleback 2 (Langit/Tembok)</label>
                  <input type="text" placeholder="Misal: GrassMaze, Forest..." value={mapEditBattleback2} onChange={e => setMapEditBattleback2(e.target.value)} />
                </div>
              </div>
              <div className="mv-field-row">
                <div className="mv-field-group" style={{ flex: 1 }}>
                  <label>Encounter Step (Langkah Musuh Acak)</label>
                  <input type="number" min={1} max={999} value={mapEditEncounterStep} onChange={e => setMapEditEncounterStep(Number(e.target.value))} />
                </div>
                <div className="mv-field-group" style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}>
                    <input type="checkbox" checked={mapEditDisableDash} onChange={e => setMapEditDisableDash(e.target.checked)} /> Disable Dashing (Lari Nonaktif)
                  </label>
                </div>
              </div>
            </div>

            <div className="mv-field-group">
              <label>Note (Catatan / Metadata)</label>
              <textarea
                rows={2}
                value={mapEditNote}
                onChange={e => setMapEditNote(e.target.value)}
                placeholder="Catatan editor atau tag metadata (misal: <light: ambient>)..."
              />
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onApply}>
            OK / Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
