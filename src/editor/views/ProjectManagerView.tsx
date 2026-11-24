import React, { useState } from 'react';
import type { RecentProject } from '../../core/types.js';

export interface ProjectManagerViewProps {
  recentProjects: RecentProject[];
  defaultLocation: string;
  onNewProject: () => void;
  onOpenProject: (path?: string) => void;
  onLaunchPlaytest: (projectPath: string, e: React.MouseEvent) => void;
  onRemoveRecent: (projectPath: string, e: React.MouseEvent) => void;
  renderModals?: () => React.ReactNode;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return new Date(timestamp).toLocaleDateString();
}

export function ProjectManagerView({
  recentProjects,
  defaultLocation,
  onNewProject,
  onOpenProject,
  onLaunchPlaytest,
  onRemoveRecent,
  renderModals
}: ProjectManagerViewProps) {
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  const filteredProjects = recentProjects.filter(
    p =>
      p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  return (
    <main className="godot-pm-layout">
      <header className="godot-pm-topbar">
        <div className="godot-pm-brand">
          <div className="mv-brand-mark">N</div>
          <div className="godot-pm-brand-text">
            <strong>NUSV Engine</strong>
            <span>Project Manager</span>
          </div>
        </div>

        <div className="godot-pm-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Cari proyek (judul / folder)…"
            value={projectSearchQuery}
            onChange={e => setProjectSearchQuery(e.target.value)}
          />
          {projectSearchQuery && (
            <button
              style={{ background: 'transparent', border: 0, color: '#888', cursor: 'pointer', padding: '0 4px' }}
              onClick={() => setProjectSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="godot-pm-actions">
          <button className="primary" onClick={onNewProject}>
            ＋ Proyek Baru
          </button>
          <button onClick={() => onOpenProject()}>
            📂 Buka File…
          </button>
        </div>
      </header>

      <div className="godot-pm-body">
        <div className="godot-pm-list">
          {filteredProjects.map(proj => (
            <div
              key={proj.path}
              className="godot-pm-card"
              onDoubleClick={() => onOpenProject(proj.path)}
            >
              <div className="godot-pm-card-icon">🎮</div>
              <div className="godot-pm-card-details">
                <div className="godot-pm-card-title">{proj.title}</div>
                <div className="godot-pm-card-path">{proj.path}</div>
                <div className="godot-pm-card-meta">
                  <span>Terakhir dibuka: {formatRelativeTime(proj.lastOpened)}</span>
                </div>
              </div>
              <div className="godot-pm-card-actions">
                <button
                  className="godot-pm-btn-play"
                  title="Jalankan Playtest Langsung"
                  onClick={(e) => onLaunchPlaytest(proj.path, e)}
                >
                  ▶ Play
                </button>
                <button
                  className="godot-pm-btn-edit"
                  title="Buka di Editor"
                  onClick={() => onOpenProject(proj.path)}
                >
                  Edit
                </button>
                <button
                  className="godot-pm-btn-remove"
                  title="Hapus dari daftar riwayat"
                  onClick={(e) => onRemoveRecent(proj.path, e)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="godot-pm-empty">
              <div className="godot-pm-empty-icon">📁</div>
              <h3>{projectSearchQuery ? 'Tidak ada proyek yang cocok' : 'Belum Ada Proyek'}</h3>
              <p>
                {projectSearchQuery
                  ? `Tidak ditemukan proyek yang cocok dengan "${projectSearchQuery}".`
                  : `Mulai dengan membuat proyek game baru ke direktori default (${defaultLocation || 'project/'}) atau buka proyek yang sudah ada.`}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary" onClick={onNewProject}>
                  ＋ Buat Proyek Baru
                </button>
                <button onClick={() => onOpenProject()}>
                  📂 Buka Proyek Lain…
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="godot-pm-footer">
        <span>Default Direktori: {defaultLocation || 'Memuat...'}</span>
        <span>NUSV Engine Next v0.1.0 • Clean-Room 2D/3D JRPG Engine</span>
      </footer>

      {renderModals?.()}
    </main>
  );
}
