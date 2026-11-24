import React from 'react';

export interface SampleMapsModalProps {
  selectedSampleMap: 'village' | 'forest' | 'castle' | 'cave';
  onSelectSampleMap: (id: 'village' | 'forest' | 'castle' | 'cave') => void;
  onApply: () => void;
  onClose: () => void;
}

export function SampleMapsModal({
  selectedSampleMap,
  onSelectSampleMap,
  onApply,
  onClose
}: SampleMapsModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: '460px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Load Sample Map (Peta Contoh Bawaan)</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
            Pilih salah satu template peta bawaan untuk ditambahkan ke proyek Anda:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'village', title: 'Plains Village (Desa Dataran)', desc: 'Ukuran 20x15, Outside tileset, jalan setapak dan rumput hijau.' },
              { id: 'forest', title: 'Forest Sanctuary (Hutan Rimba)', desc: 'Ukuran 24x18, dikelilingi pepohonan lebat dengan jalan tengah alami.' },
              { id: 'castle', title: 'Castle Chamber (Aula Kastil)', desc: 'Ukuran 17x13, Inside tileset, lantai ubin dengan dinding batu megah.' },
              { id: 'cave', title: 'Deep Cavern (Gua Bawah Tanah)', desc: 'Ukuran 20x20, Dungeon tileset dengan labirin jalur gua alami.' },
            ].map(item => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px',
                  border: selectedSampleMap === item.id ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: selectedSampleMap === item.id ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="sampleMapChoice"
                  value={item.id}
                  checked={selectedSampleMap === item.id}
                  onChange={() => onSelectSampleMap(item.id as any)}
                />
                <div>
                  <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.title}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onApply}>
            Muat Peta
          </button>
        </div>
      </div>
    </div>
  );
}
