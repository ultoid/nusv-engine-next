import React from 'react';

export interface ShiftMapModalProps {
  shiftX: number;
  shiftY: number;
  shiftLoop: boolean;
  onShiftXChange: (val: number) => void;
  onShiftYChange: (val: number) => void;
  onShiftLoopChange: (val: boolean) => void;
  onApply: () => void;
  onClose: () => void;
}

export function ShiftMapModal({
  shiftX,
  shiftY,
  shiftLoop,
  onShiftXChange,
  onShiftYChange,
  onShiftLoopChange,
  onApply,
  onClose
}: ShiftMapModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '380px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Shift Map</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-form-row">
            <div className="mv-field-group">
              <label>X Offset (Horizontal)</label>
              <input
                type="number"
                value={shiftX}
                onChange={e => onShiftXChange(parseInt(e.target.value, 10) || 0)}
              />
              <small style={{ color: '#777' }}>Positif = kanan, Negatif = kiri</small>
            </div>
            <div className="mv-field-group">
              <label>Y Offset (Vertical)</label>
              <input
                type="number"
                value={shiftY}
                onChange={e => onShiftYChange(parseInt(e.target.value, 10) || 0)}
              />
              <small style={{ color: '#777' }}>Positif = bawah, Negatif = atas</small>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={shiftLoop}
                onChange={e => onShiftLoopChange(e.target.checked)}
              />
              <span>Loop (Putar tile yang keluar dari batas)</span>
            </label>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onApply}>OK / Terapkan</button>
        </div>
      </div>
    </div>
  );
}
