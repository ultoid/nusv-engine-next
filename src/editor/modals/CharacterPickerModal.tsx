import React, { useState } from 'react';
import type { EventGraphic } from '../../core/types.js';

export interface CharacterPickerModalProps {
  currentGraphic?: EventGraphic;
  characterOptions: string[];
  assetUrls?: Record<string, string>;
  onSelect: (graphic?: EventGraphic) => void;
  onClose: () => void;
}

export function CharacterPickerModal({
  currentGraphic,
  characterOptions,
  assetUrls = {},
  onSelect,
  onClose
}: CharacterPickerModalProps) {
  const [selectedFile, setSelectedFile] = useState<string>(currentGraphic?.characterName ?? '');
  const [selectedIdx, setSelectedIdx] = useState<number>(currentGraphic?.characterIndex ?? 0);
  const [selectedDir, setSelectedDir] = useState<'down' | 'left' | 'right' | 'up'>(currentGraphic?.direction ?? 'down');
  const [selectedPattern, setSelectedPattern] = useState<number>(currentGraphic?.pattern ?? 1);

  const isSingle = selectedFile.split('/').pop()?.startsWith('$');
  const imgUrl = selectedFile ? assetUrls[selectedFile] : undefined;

  const handleApply = () => {
    if (!selectedFile) {
      onSelect(undefined);
    } else {
      onSelect({
        characterName: selectedFile,
        characterIndex: isSingle ? 0 : selectedIdx,
        direction: selectedDir,
        pattern: selectedPattern
      });
    }
    onClose();
  };

  const getPreviewStyle = () => {
    if (!selectedFile || !imgUrl) return null;
    const charIdx = isSingle ? 0 : selectedIdx;
    const colChar = isSingle ? 0 : charIdx % 4;
    const rowChar = isSingle ? 0 : Math.floor(charIdx / 4);

    const dirMap: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
    const dirIdx = dirMap[selectedDir] ?? 0;

    const frameX = (colChar * 3 + selectedPattern) * 48;
    const frameY = (rowChar * 4 + dirIdx) * 48;

    return {
      backgroundImage: `url("${imgUrl}")`,
      backgroundPosition: `-${frameX}px -${frameY}px`,
      backgroundSize: isSingle ? '144px 192px' : '576px 384px',
      width: '48px',
      height: '48px',
      imageRendering: 'pixelated' as const,
    };
  };

  return (
    <div className="mv-modal-backdrop mz-char-picker-backdrop" onClick={onClose}>
      <div className="mz-char-picker-dialog" onClick={e => e.stopPropagation()}>
        <div className="mz-dialog-titlebar">
          <span>Select an Image</span>
          <button className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        <div className="mz-char-picker-body">
          {/* Left panel: File list */}
          <div className="mz-char-file-panel">
            <div className="mz-panel-header">Characters</div>
            <div className="mz-char-file-list">
              <button
                type="button"
                className={`mz-char-file-item ${!selectedFile ? 'active' : ''}`}
                onClick={() => setSelectedFile('')}
              >
                (None)
              </button>
              {characterOptions.map(opt => {
                const name = opt.split('/').pop() ?? opt;
                const isSelected = selectedFile === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`mz-char-file-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFile(opt);
                      if (opt.split('/').pop()?.startsWith('$')) {
                        setSelectedIdx(0);
                      }
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Spritesheet preview & character grid */}
          <div className="mz-char-sheet-panel">
            <div className="mz-panel-header">
              <span>{selectedFile ? selectedFile.split('/').pop() : '(Tidak ada gambar)'}</span>
              {selectedFile && !isSingle && (
                <span className="mz-char-hint">Klik kotak karakter untuk memilih index (0–7)</span>
              )}
            </div>

            <div className="mz-char-sheet-viewport">
              {!selectedFile ? (
                <div className="mz-char-empty-msg">
                  <div className="mz-checkerboard-box mz-preview-large">
                    <span className="mz-image-placeholder">None</span>
                  </div>
                  <p>Event ini tidak memiliki visual karakter (transparan/kosong).</p>
                </div>
              ) : imgUrl ? (
                <div className="mz-char-sheet-container">
                  <div
                    className="mz-char-spritesheet"
                    style={{
                      backgroundImage: `url("${imgUrl}")`,
                      width: isSingle ? '144px' : '576px',
                      height: isSingle ? '192px' : '384px',
                      backgroundSize: isSingle ? '144px 192px' : '576px 384px',
                      imageRendering: 'pixelated',
                      position: 'relative'
                    }}
                  >
                    {/* Grid overlays for selecting character (4 columns x 2 rows of 3x4 tiles) */}
                    {!isSingle && Array.from({ length: 8 }).map((_, cIdx) => {
                      const col = cIdx % 4;
                      const row = Math.floor(cIdx / 4);
                      const isTarget = selectedIdx === cIdx;
                      return (
                        <div
                          key={cIdx}
                          className={`mz-char-block-target ${isTarget ? 'selected' : ''}`}
                          style={{
                            position: 'absolute',
                            left: `${col * 144}px`,
                            top: `${row * 192}px`,
                            width: '144px',
                            height: '192px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedIdx(cIdx)}
                          title={`Karakter #${cIdx}`}
                        >
                          {isTarget && <span className="mz-char-badge">#{cIdx}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mz-char-empty-msg">
                  <p>Memuat sprite sheet {selectedFile}...</p>
                </div>
              )}
            </div>

            {/* Bottom Controls: Direction, Pattern, and Selected Preview */}
            {selectedFile && (
              <div className="mz-char-controls-row">
                <div className="mz-preview-single">
                  <label>Preview:</label>
                  <div className="mz-checkerboard-box">
                    <div style={getPreviewStyle() ?? undefined} />
                  </div>
                </div>

                <div className="mz-control-group">
                  <label>Direction (Arah Hadap):</label>
                  <div className="mz-btn-group">
                    {(['down', 'left', 'right', 'up'] as const).map(dir => (
                      <button
                        key={dir}
                        type="button"
                        className={`mz-btn mz-btn-sm ${selectedDir === dir ? 'mz-btn-primary' : ''}`}
                        onClick={() => setSelectedDir(dir)}
                      >
                        {dir.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mz-control-group">
                  <label>Pattern (Frame Animasi):</label>
                  <div className="mz-btn-group">
                    {[0, 1, 2].map(pat => (
                      <button
                        key={pat}
                        type="button"
                        className={`mz-btn mz-btn-sm ${selectedPattern === pat ? 'mz-btn-primary' : ''}`}
                        onClick={() => setSelectedPattern(pat)}
                      >
                        Frame {pat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left">
            <button
              type="button"
              className="mz-btn"
              onClick={() => {
                setSelectedFile('');
              }}
            >
              Clear Image
            </button>
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
