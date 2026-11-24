import React from 'react';
import type { ProjectBundle } from '../../core/types.js';

export interface ProjectSettingsModalProps {
  bundle: ProjectBundle;
  settingsTitle: string;
  settingsResWidth: number;
  settingsResHeight: number;
  settingsStartMap: string;
  settingsStartX: number;
  settingsStartY: number;
  settingsParty: string[];
  onTitleChange: (val: string) => void;
  onResChange: (w: number, h: number) => void;
  onStartMapChange: (val: string) => void;
  onStartXChange: (val: number) => void;
  onStartYChange: (val: number) => void;
  onTogglePartyMember: (id: string, checked: boolean) => void;
  onApply: () => void;
  onClose: () => void;
}

export function ProjectSettingsModal({
  bundle,
  settingsTitle,
  settingsResWidth,
  settingsResHeight,
  settingsStartMap,
  settingsStartX,
  settingsStartY,
  settingsParty,
  onTitleChange,
  onResChange,
  onStartMapChange,
  onStartXChange,
  onStartYChange,
  onTogglePartyMember,
  onApply,
  onClose
}: ProjectSettingsModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Project Settings — {bundle.project.title}</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-dialog-form">
            <div className="mv-field-group">
              <label>Game Title</label>
              <input
                type="text"
                value={settingsTitle}
                onChange={e => onTitleChange(e.target.value)}
              />
            </div>
            <div className="mv-field-group">
              <label>Logical Resolution</label>
              <div className="mv-field-row">
                <input
                  type="number"
                  value={settingsResWidth}
                  onChange={e => onResChange(Number(e.target.value), settingsResHeight)}
                  style={{ width: '100px' }}
                />
                <span>×</span>
                <input
                  type="number"
                  value={settingsResHeight}
                  onChange={e => onResChange(settingsResWidth, Number(e.target.value))}
                  style={{ width: '100px' }}
                />
                <div className="mv-preset-chips">
                  <button
                    type="button"
                    className={settingsResWidth === 816 && settingsResHeight === 624 ? 'active' : ''}
                    onClick={() => onResChange(816, 624)}
                  >
                    816×624
                  </button>
                  <button
                    type="button"
                    className={settingsResWidth === 1080 && settingsResHeight === 720 ? 'active' : ''}
                    onClick={() => onResChange(1080, 720)}
                  >
                    1080×720
                  </button>
                  <button
                    type="button"
                    className={settingsResWidth === 1280 && settingsResHeight === 720 ? 'active' : ''}
                    onClick={() => onResChange(1280, 720)}
                  >
                    1280×720 (HD)
                  </button>
                  <button
                    type="button"
                    className={settingsResWidth === 1920 && settingsResHeight === 1080 ? 'active' : ''}
                    onClick={() => onResChange(1920, 1080)}
                  >
                    1920×1080 (FHD)
                  </button>
                </div>
              </div>
            </div>
            <div className="mv-field-group">
              <label>Starting Map & Position</label>
              <div className="mv-field-row">
                <select
                  value={settingsStartMap}
                  onChange={e => onStartMapChange(e.target.value)}
                >
                  {bundle.project.maps.map(id => (
                    <option key={id} value={id}>
                      {bundle.maps[id]?.name || id} ({id})
                    </option>
                  ))}
                </select>
                <span>X:</span>
                <input
                  type="number"
                  value={settingsStartX}
                  onChange={e => onStartXChange(Number(e.target.value))}
                  style={{ width: '70px' }}
                />
                <span>Y:</span>
                <input
                  type="number"
                  value={settingsStartY}
                  onChange={e => onStartYChange(Number(e.target.value))}
                  style={{ width: '70px' }}
                />
              </div>
            </div>
            <div className="mv-field-group">
              <label>Initial Party Members</label>
              <div className="mv-checkbox-grid">
                {bundle.game.actors.map(actor => {
                  const isSelected = settingsParty.includes(actor.id);
                  return (
                    <label key={actor.id} className="mv-checkbox-item">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => onTogglePartyMember(actor.id, e.target.checked)}
                      />
                      <span>{actor.name} ({actor.id})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" onClick={onApply}>Terapkan Pengaturan</button>
        </div>
      </div>
    </div>
  );
}
