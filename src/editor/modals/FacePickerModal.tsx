import React, { useState } from 'react';

export interface FacePickerModalProps {
  currentFaceName?: string;
  currentFaceIndex?: number;
  faceOptions: string[];
  assetUrls?: Record<string, string>;
  onSelect: (faceName?: string, faceIndex?: number) => void;
  onClose: () => void;
}

export function FacePickerModal({
  currentFaceName,
  currentFaceIndex = 0,
  faceOptions,
  assetUrls = {},
  onSelect,
  onClose
}: FacePickerModalProps) {
  const [selectedFile, setSelectedFile] = useState<string>(currentFaceName ?? '');
  const [selectedIdx, setSelectedIdx] = useState<number>(currentFaceIndex ?? 0);

  // Resolve image URL from assetUrls with filename/basename fallback
  let imgUrl = selectedFile ? assetUrls[selectedFile] : undefined;
  if (!imgUrl && selectedFile) {
    const clean = selectedFile.split('/').pop()?.replace('.png', '').toLowerCase() ?? '';
    if (clean) {
      const matchedKey = Object.keys(assetUrls).find(k => {
        const base = k.split('/').pop()?.replace('.png', '').toLowerCase();
        return base === clean;
      });
      if (matchedKey) imgUrl = assetUrls[matchedKey];
    }
  }

  const handleApply = () => {
    if (!selectedFile) {
      onSelect(undefined, undefined);
    } else {
      onSelect(selectedFile, selectedIdx);
    }
    onClose();
  };

  const handleCellClick = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleCellDoubleClick = (idx: number) => {
    if (!selectedFile) {
      onSelect(undefined, undefined);
    } else {
      onSelect(selectedFile, idx);
    }
    onClose();
  };

  // Cursor coordinates
  const cursorCol = selectedIdx % 4;
  const cursorRow = Math.floor(selectedIdx / 4);

  return (
    <div className="mv-modal-backdrop mz-face-picker-backdrop" onClick={onClose}>
      <div className="mz-face-picker-dialog" onClick={e => e.stopPropagation()}>
        <div className="mz-dialog-titlebar">
          <span>Select an Image</span>
          <button type="button" className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        <div className="mz-face-picker-body">
          {/* Left panel: File list */}
          <div className="mz-face-file-panel">
            <div className="mz-face-file-list">
              <button
                type="button"
                className={`mz-face-file-item ${!selectedFile ? 'active' : ''}`}
                onClick={() => setSelectedFile('')}
              >
                (None)
              </button>
              {faceOptions.map(opt => {
                const displayName = opt.split('/').pop()?.replace('.png', '') ?? opt;
                const isSelected = selectedFile === opt || selectedFile.split('/').pop()?.replace('.png', '') === displayName;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`mz-face-file-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFile(opt);
                    }}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: 4x2 face sheet grid (576 x 288 px) */}
          <div className="mz-face-sheet-panel">
            <div className="mz-face-sheet-header">
              <span>{selectedFile ? selectedFile.split('/').pop() : 'Tidak ada gambar'}</span>
              <span className="mz-face-hint">Klik kotak wajah (0-7), klik ganda untuk konfirmasi</span>
            </div>

            <div className="mz-face-sheet-scroll">
              <div className="mz-face-sheet-canvas-container">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={selectedFile}
                    className="mz-face-sheet-image"
                    draggable={false}
                  />
                ) : (
                  <div className="mz-face-empty-message">
                    {selectedFile ? 'Memuat gambar...' : '(None) — Tanpa Wajah'}
                  </div>
                )}

                {/* 4x2 clickable grid overlay */}
                {Boolean(selectedFile) && (
                  <div className="mz-face-grid-overlay">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`mz-face-grid-cell ${selectedIdx === i ? 'selected' : ''}`}
                        onClick={() => handleCellClick(i)}
                        onDoubleClick={() => handleCellDoubleClick(i)}
                        title={`Face #${i}`}
                      />
                    ))}

                    {/* Black/white cursor border */}
                    <div
                      className="mz-face-cursor"
                      style={{
                        left: `${cursorCol * 144}px`,
                        top: `${cursorRow * 144}px`,
                        width: '144px',
                        height: '144px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left">
            <button
              type="button"
              className="mz-btn mz-btn-sm"
              onClick={() => {
                setSelectedFile('');
                onSelect(undefined, undefined);
                onClose();
              }}
            >
              Clear Face
            </button>
          </div>
          <div className="mz-footer-right">
            <button type="button" className="mz-btn mz-btn-primary" onClick={handleApply}>
              OK
            </button>
            <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
