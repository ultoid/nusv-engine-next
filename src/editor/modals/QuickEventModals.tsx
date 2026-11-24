import React, { useState } from 'react';
import type { ProjectBundle } from '../../core/types.js';
import { MapLocationPickerModal } from './MapLocationPickerModal.js';

export interface QuickTransferModalProps {
  bundle?: ProjectBundle;
  quickTargetMap: string;
  quickTargetX: number;
  quickTargetY: number;
  assetUrls?: Record<string, string>;
  onTargetMapChange: (mapId: string) => void;
  onTargetXChange: (x: number) => void;
  onTargetYChange: (y: number) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function QuickTransferModal({
  bundle,
  quickTargetMap,
  quickTargetX,
  quickTargetY,
  assetUrls,
  onTargetMapChange,
  onTargetXChange,
  onTargetYChange,
  onCreate,
  onClose
}: QuickTransferModalProps) {
  const [pickingLocation, setPickingLocation] = useState(false);
  const targetMapName = bundle?.maps[quickTargetMap]?.name || quickTargetMap;

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Transfer</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Peta Tujuan & Koordinat (Destination)</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                className="mz-btn"
                style={{ flex: 1, textAlign: 'left', background: '#fff', fontSize: '13px' }}
                onClick={() => setPickingLocation(true)}
              >
                🗺️ {targetMapName} ({quickTargetX}, {quickTargetY})
              </button>
              <button
                type="button"
                className="mz-btn mz-btn-primary"
                style={{ width: '38px', fontWeight: 'bold' }}
                onClick={() => setPickingLocation(true)}
                title="Pilih lokasi di peta secara visual..."
              >
                ...
              </button>
            </div>
          </div>
          <div className="mv-form-row" style={{ marginTop: '10px' }}>
            <div className="mv-field-group">
              <label>Peta (ID)</label>
              <select
                value={quickTargetMap}
                onChange={e => onTargetMapChange(e.target.value)}
              >
                {bundle?.project.maps.map(id => (
                  <option key={id} value={id}>
                    {id}: {bundle.maps[id]?.name || id}
                  </option>
                ))}
              </select>
            </div>
            <div className="mv-field-group">
              <label>Target X</label>
              <input
                type="number"
                min="0"
                value={quickTargetX}
                onChange={e => onTargetXChange(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="mv-field-group">
              <label>Target Y</label>
              <input
                type="number"
                min="0"
                value={quickTargetY}
                onChange={e => onTargetYChange(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          {pickingLocation && bundle && (
            <MapLocationPickerModal
              bundle={bundle}
              initialMapId={quickTargetMap}
              initialX={quickTargetX}
              initialY={quickTargetY}
              assetUrls={assetUrls}
              title="Select Location (Quick Transfer)"
              onSelect={(mapId, x, y) => {
                onTargetMapChange(mapId);
                onTargetXChange(x);
                onTargetYChange(y);
              }}
              onClose={() => setPickingLocation(false)}
            />
          )}
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onCreate}>OK</button>
        </div>
      </div>
    </div>
  );
}

export interface QuickDoorModalProps {
  bundle?: ProjectBundle;
  quickTargetMap: string;
  quickTargetX: number;
  quickTargetY: number;
  assetUrls?: Record<string, string>;
  onTargetMapChange: (mapId: string) => void;
  onTargetXChange: (x: number) => void;
  onTargetYChange: (y: number) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function QuickDoorModal({
  bundle,
  quickTargetMap,
  quickTargetX,
  quickTargetY,
  assetUrls,
  onTargetMapChange,
  onTargetXChange,
  onTargetYChange,
  onCreate,
  onClose
}: QuickDoorModalProps) {
  const [pickingLocation, setPickingLocation] = useState(false);
  const targetMapName = bundle?.maps[quickTargetMap]?.name || quickTargetMap;

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Door</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Peta Tujuan & Koordinat (Destination)</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                className="mz-btn"
                style={{ flex: 1, textAlign: 'left', background: '#fff', fontSize: '13px' }}
                onClick={() => setPickingLocation(true)}
              >
                🗺️ {targetMapName} ({quickTargetX}, {quickTargetY})
              </button>
              <button
                type="button"
                className="mz-btn mz-btn-primary"
                style={{ width: '38px', fontWeight: 'bold' }}
                onClick={() => setPickingLocation(true)}
                title="Pilih lokasi di peta secara visual..."
              >
                ...
              </button>
            </div>
          </div>
          <div className="mv-form-row" style={{ marginTop: '10px' }}>
            <div className="mv-field-group">
              <label>Peta (ID)</label>
              <select
                value={quickTargetMap}
                onChange={e => onTargetMapChange(e.target.value)}
              >
                {bundle?.project.maps.map(id => (
                  <option key={id} value={id}>
                    {id}: {bundle.maps[id]?.name || id}
                  </option>
                ))}
              </select>
            </div>
            <div className="mv-field-group">
              <label>Target X</label>
              <input
                type="number"
                min="0"
                value={quickTargetX}
                onChange={e => onTargetXChange(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="mv-field-group">
              <label>Target Y</label>
              <input
                type="number"
                min="0"
                value={quickTargetY}
                onChange={e => onTargetYChange(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          {pickingLocation && bundle && (
            <MapLocationPickerModal
              bundle={bundle}
              initialMapId={quickTargetMap}
              initialX={quickTargetX}
              initialY={quickTargetY}
              assetUrls={assetUrls}
              title="Select Location (Quick Door)"
              onSelect={(mapId, x, y) => {
                onTargetMapChange(mapId);
                onTargetXChange(x);
                onTargetYChange(y);
              }}
              onClose={() => setPickingLocation(false)}
            />
          )}
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onCreate}>OK</button>
        </div>
      </div>
    </div>
  );
}

export interface QuickChestModalProps {
  bundle?: ProjectBundle;
  quickChestType: 'gold' | 'item';
  quickChestAmount: number;
  quickChestItem: string;
  onChestTypeChange: (type: 'gold' | 'item') => void;
  onChestAmountChange: (amount: number) => void;
  onChestItemChange: (itemId: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function QuickChestModal({
  bundle,
  quickChestType,
  quickChestAmount,
  quickChestItem,
  onChestTypeChange,
  onChestAmountChange,
  onChestItemChange,
  onCreate,
  onClose
}: QuickChestModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Treasure Chest</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Tipe Isi Peti</label>
            <div style={{ display: 'flex', gap: '16px', margin: '6px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="chestType"
                  checked={quickChestType === 'gold'}
                  onChange={() => onChestTypeChange('gold')}
                />
                <span>Gold (Uang)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="chestType"
                  checked={quickChestType === 'item'}
                  onChange={() => onChestTypeChange('item')}
                />
                <span>Item / Barang</span>
              </label>
            </div>
          </div>
          {quickChestType === 'gold' ? (
            <div className="mv-field-group" style={{ marginTop: '10px' }}>
              <label>Jumlah Gold (G)</label>
              <input
                type="number"
                min="1"
                value={quickChestAmount}
                onChange={e => onChestAmountChange(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          ) : (
            <div className="mv-field-group" style={{ marginTop: '10px' }}>
              <label>Item</label>
              <select
                value={quickChestItem}
                onChange={e => onChestItemChange(e.target.value)}
              >
                {bundle?.game.items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onCreate}>OK</button>
        </div>
      </div>
    </div>
  );
}

export interface QuickInnModalProps {
  quickInnPrice: number;
  onPriceChange: (price: number) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function QuickInnModal({
  quickInnPrice,
  onPriceChange,
  onCreate,
  onClose
}: QuickInnModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '380px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Inn</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Biaya Menginap (Gold)</label>
            <input
              type="number"
              min="0"
              value={quickInnPrice}
              onChange={e => onPriceChange(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onCreate}>OK</button>
        </div>
      </div>
    </div>
  );
}
