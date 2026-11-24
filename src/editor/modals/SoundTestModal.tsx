import React from 'react';

export interface SoundTestModalProps {
  soundCategory: 'se' | 'me' | 'bgm';
  soundSelected: string;
  onCategoryChange: (cat: 'se' | 'me' | 'bgm') => void;
  onSelectSound: (name: string) => void;
  onPlaySound: (name: string) => void;
  onClose: () => void;
}

export function SoundTestModal({
  soundCategory,
  soundSelected,
  onCategoryChange,
  onSelectSound,
  onPlaySound,
  onClose
}: SoundTestModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Sound Test</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {(['se', 'me', 'bgm'] as const).map(cat => (
              <button
                key={cat}
                style={{
                  padding: '6px 16px',
                  background: soundCategory === cat ? '#0078d7' : '#e4e7eb',
                  color: soundCategory === cat ? '#fff' : '#2b3543',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px'
                }}
                onClick={() => {
                  onCategoryChange(cat);
                  if (cat === 'se') onSelectSound('Decision');
                  else if (cat === 'bgm') onSelectSound('Field');
                  else onSelectSound('Victory');
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
            <div style={{
              height: '220px',
              overflowY: 'auto',
              border: '1px solid #c0c6cf',
              borderRadius: '4px',
              background: '#fff',
              padding: '4px'
            }}>
              {((soundCategory === 'se'
                ? ['Cursor', 'Decision', 'Cancel', 'Buzzer', 'Chest', 'Door', 'Attack', 'Hit', 'Jump', 'Recovery']
                : soundCategory === 'me'
                ? ['Victory', 'Defeat', 'LevelUp', 'Item']
                : ['Field', 'Town', 'Dungeon', 'Battle']
              )).map(snd => (
                <div
                  key={snd}
                  onClick={() => onSelectSound(snd)}
                  onDoubleClick={() => onPlaySound(snd)}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    background: soundSelected === snd ? '#0078d7' : 'transparent',
                    color: soundSelected === snd ? '#fff' : '#222',
                    borderRadius: '3px',
                    fontSize: '12px',
                    marginBottom: '2px'
                  }}
                >
                  🔊 {snd}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="primary"
                style={{ padding: '8px', fontSize: '13px' }}
                onClick={() => onPlaySound(soundSelected)}
              >
                ▶ Play
              </button>
              <button
                style={{ padding: '8px', fontSize: '13px' }}
                onClick={() => {}}
              >
                ■ Stop
              </button>
              <div style={{ marginTop: 'auto', padding: '8px', background: '#f5f7fa', borderRadius: '4px', border: '1px solid #e1e4e8', fontSize: '11px', color: '#555' }}>
                <strong>Selected:</strong><br />
                {soundSelected}
              </div>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button className="primary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
