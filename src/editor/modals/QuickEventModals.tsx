import React from 'react';
import type { ProjectBundle } from '../../core/types.js';

export interface QuickTransferModalProps {
  bundle?: ProjectBundle;
  quickTargetMap: string;
  quickTargetX: number;
  quickTargetY: number;
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
  onTargetMapChange,
  onTargetXChange,
  onTargetYChange,
  onCreate,
  onClose
}: QuickTransferModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Transfer</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Peta Tujuan (Destination Map)</label>
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
          <div className="mv-form-row" style={{ marginTop: '10px' }}>
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
  onTargetMapChange,
  onTargetXChange,
  onTargetYChange,
  onCreate,
  onClose
}: QuickDoorModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Quick Event Creation — Door</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-field-group">
            <label>Peta Tujuan (Destination Map)</label>
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
          <div className="mv-form-row" style={{ marginTop: '10px' }}>
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
