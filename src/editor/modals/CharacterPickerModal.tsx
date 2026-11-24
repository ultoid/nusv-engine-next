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

  const isSingle = Boolean(selectedFile.split('/').pop()?.startsWith('$'));

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

  const dirNames: Array<'down' | 'left' | 'right' | 'up'> = ['down', 'left', 'right', 'up'];
  const dirMap: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };

  // Calculate current cursor coordinate on the spritesheet
  const patCol = Math.max(0, Math.min(2, selectedPattern));
  const dirRow = dirMap[selectedDir] ?? 0;
  let cursorCol = 0;
  let cursorRow = 0;

  if (isSingle) {
    cursorCol = patCol;
    cursorRow = dirRow;
  } else {
    const charIdx = selectedIdx ?? 0;
    const charCol = charIdx % 4;
    const charRow = Math.floor(charIdx / 4);
    cursorCol = charCol * 3 + patCol;
    cursorRow = charRow * 4 + dirRow;
  }

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

  const handleCellClick = (col: number, row: number) => {
    if (isSingle) {
      setSelectedIdx(0);
      setSelectedPattern(col);
      setSelectedDir(dirNames[row] ?? 'down');
    } else {
      const charCol = Math.floor(col / 3);
      const charRow = Math.floor(row / 4);
      setSelectedIdx(charRow * 4 + charCol);
      setSelectedPattern(col % 3);
      setSelectedDir(dirNames[row % 4] ?? 'down');
    }
  };

  const handleCellDoubleClick = (col: number, row: number) => {
    let cIdx = 0;
    let pat = 0;
    let dir: 'down' | 'left' | 'right' | 'up' = 'down';

    if (isSingle) {
      cIdx = 0;
      pat = col;
      dir = dirNames[row] ?? 'down';
    } else {
      const charCol = Math.floor(col / 3);
      const charRow = Math.floor(row / 4);
      cIdx = charRow * 4 + charCol;
      pat = col % 3;
      dir = dirNames[row % 4] ?? 'down';
    }

    onSelect({
      characterName: selectedFile,
      characterIndex: cIdx,
      direction: dir,
      pattern: pat
    });
    onClose();
  };

  const totalCols = isSingle ? 3 : 12;
  const totalRows = isSingle ? 4 : 8;

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
            <div className="mz-char-file-list">
              <button
                type="button"
                className={`mz-char-file-item ${!selectedFile ? 'active' : ''}`}
                onClick={() => setSelectedFile('')}
              >
                (None)
              </button>
              {characterOptions.map(opt => {
                const displayName = opt.split('/').pop()?.replace('.png', '') ?? opt;
                const isSelected = selectedFile === opt || selectedFile.split('/').pop()?.replace('.png', '') === displayName;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`mz-char-file-item ${isSelected ? 'active' : ''}`}
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

          {/* Right panel: Spritesheet frame grid */}
          <div className="mz-char-sheet-panel">
            <div className="mz-char-sheet-viewport">
              {!selectedFile ? (
                <div className="mz-char-empty-msg">
                  <p>(None)</p>
                </div>
              ) : imgUrl ? (
                <div className="mz-char-sheet-container">
                  <div
                    className="mz-char-spritesheet"
                    style={{
                      backgroundImage: `url("${imgUrl}")`,
                      width: `${totalCols * 48}px`,
                      height: `${totalRows * 48}px`,
                      backgroundSize: `${totalCols * 48}px ${totalRows * 48}px`,
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      position: 'relative'
                    }}
                  >
                    {/* Clickable 48x48 individual frame cells */}
                    {Array.from({ length: totalRows }).map((_, r) =>
                      Array.from({ length: totalCols }).map((_, c) => {
                        const isSelected = c === cursorCol && r === cursorRow;
                        return (
                          <div
                            key={`${c}-${r}`}
                            className={`mz-char-frame-cell ${isSelected ? 'active-frame' : ''}`}
                            style={{
                              left: `${c * 48}px`,
                              top: `${r * 48}px`
                            }}
                            onClick={() => handleCellClick(c, r)}
                            onDoubleClick={() => handleCellDoubleClick(c, r)}
                            title={`Frame [${c}, ${r}] — Klik untuk memilih, klik ganda untuk konfirmasi`}
                          />
                        );
                      })
                    )}

                    {/* Authentic RPG Maker MZ 48x48 Selection Cursor Box */}
                    <div
                      className="mz-char-cell-cursor"
                      style={{
                        left: `${cursorCol * 48}px`,
                        top: `${cursorRow * 48}px`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mz-char-empty-msg">
                  <p>Memuat sprite sheet {selectedFile.split('/').pop()}...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left" />
          <div className="mz-footer-right">
            <button type="button" className="mz-btn mz-btn-primary" onClick={handleApply}>OK</button>
            <button type="button" className="mz-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
