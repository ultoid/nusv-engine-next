import React from 'react';

export interface NewProjectModalProps {
  newTitle: string;
  newFolder: string;
  newLocation: string;
  defaultLocation: string;
  busy: boolean;
  onTitleChange: (val: string) => void;
  onFolderChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onBrowseLocation: () => void;
  onCreateProject: () => void;
  onClose: () => void;
}

export function NewProjectModal({
  newTitle,
  newFolder,
  newLocation,
  defaultLocation,
  busy,
  onTitleChange,
  onFolderChange,
  onLocationChange,
  onBrowseLocation,
  onCreateProject,
  onClose
}: NewProjectModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>New Project</span>
          <button className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body">
          <div className="mv-dialog-form">
            <div className="mv-field-group">
              <label>Game Title</label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="Judul Game Anda"
              />
            </div>
            <div className="mv-field-group">
              <label>Folder Name</label>
              <input
                type="text"
                value={newFolder}
                onChange={e => onFolderChange(e.target.value)}
                placeholder="e.g. my-rpg-adventure"
              />
            </div>
            <div className="mv-field-group">
              <label>Location (Parent Directory)</label>
              <div className="mv-field-row">
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => onLocationChange(e.target.value)}
                  placeholder="Pilih lokasi penyimpanan (default jika kosong)"
                />
                <button type="button" onClick={onBrowseLocation}>Browse…</button>
              </div>
            </div>
            <div className="mv-field-group">
              <label>Destination Path Preview</label>
              <div className="mv-path-preview">
                {`${(newLocation || defaultLocation || '[Lokasi Terpilih]').replace(/[/\\]+$/, '')}/${newFolder || 'project'}`}
              </div>
            </div>
          </div>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onClose}>Batal</button>
          <button className="primary" disabled={busy || !newTitle.trim()} onClick={onCreateProject}>
            {busy ? 'Membuat…' : 'OK / Buat Proyek'}
          </button>
        </div>
      </div>
    </div>
  );
}
