import { useMemo, useState } from 'react';
import type { ProjectBundle, AssetEntry } from '../core/types.js';
import {
  ASSET_CATEGORIES,
  auditProjectResources,
  filterAssets,
  inferAssetCategory,
  removeAssetFromBundle,
  cleanUnusedAssetsFromBundle,
  addAssetToBundle,
  type AssetCategory
} from '../core/resource-manager.js';

interface ResourceManagerModalProps {
  bundle: ProjectBundle;
  onCommit: (nextBundle: ProjectBundle, message: string) => void;
  onClose: () => void;
}

export function ResourceManagerModal({ bundle, onCommit, onClose }: ResourceManagerModalProps) {
  const api = typeof window !== 'undefined' ? window.nusvEditor : undefined;
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-use' | 'unused'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Run resource audit
  const audit = useMemo(() => auditProjectResources(bundle), [bundle]);
  const allAssets = bundle.assets?.assets || [];

  const filteredAssets = useMemo(() => {
    return filterAssets(allAssets, {
      category: selectedCategory,
      query: searchQuery,
      status: statusFilter,
      usageReports: audit.usageReports
    });
  }, [allAssets, selectedCategory, searchQuery, statusFilter, audit]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return filteredAssets[0] || null;
    return allAssets.find((a) => a.id === selectedAssetId) || null;
  }, [selectedAssetId, filteredAssets, allAssets]);

  const selectedUsage = selectedAsset ? audit.usageReports[selectedAsset.id] : null;

  const formatSize = (bytes?: number) => {
    if (bytes == null || isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleImportAsset = async () => {
    if (!api?.importAsset) {
      // Mock / fallback import for browser or tests
      const dummyId = `asset.${selectedCategory === 'all' ? 'other' : selectedCategory}.${Date.now().toString(36)}`;
      const ext = selectedCategory === 'bgm' || selectedCategory === 'se' ? '.ogg' : '.png';
      const dummyPath = `assets/${selectedCategory === 'all' ? 'other' : selectedCategory}/${dummyId}${ext}`;
      const dummyEntry: AssetEntry = {
        id: dummyId,
        type: ext === '.ogg' ? 'audio' : 'image',
        path: dummyPath,
        category: selectedCategory === 'all' ? 'other' : selectedCategory,
        size: 1024 * 16,
        license: 'user-import'
      };
      const nextBundle = addAssetToBundle(bundle, dummyEntry);
      onCommit(nextBundle, `Aset ${dummyId} berhasil diimpor.`);
      setSelectedAssetId(dummyId);
      setStatusNotice(`Aset ${dummyId} berhasil diimpor.`);
      return;
    }

    setBusy(true);
    setStatusNotice(null);
    try {
      const cat = selectedCategory === 'all' ? 'other' : selectedCategory;
      const result = await api.importAsset({ category: cat });
      if (result) {
        const nextBundle = addAssetToBundle(bundle, result);
        onCommit(nextBundle, `Aset ${result.id} berhasil diimpor.`);
        setSelectedAssetId(result.id);
        setStatusNotice(`Aset "${result.id}" berhasil diimpor ke ${result.path}`);
      }
    } catch (err) {
      setStatusNotice(`Gagal mengimpor aset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportAsset = async () => {
    if (!selectedAsset) return;
    if (!api?.exportAsset) {
      setStatusNotice(`Ekspor aset: ${selectedAsset.path} (Siap disalin)`);
      return;
    }
    setBusy(true);
    try {
      const ok = await api.exportAsset(selectedAsset.path);
      if (ok) {
        setStatusNotice(`Aset ${selectedAsset.id} berhasil diekspor.`);
      }
    } catch (err) {
      setStatusNotice(`Gagal mengekspor aset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    const isUsed = selectedUsage?.inUse;
    const confirmMsg = isUsed
      ? `PERINGATAN: Aset "${selectedAsset.id}" saat ini aktif digunakan dalam proyek (${selectedUsage?.references.length} referensi):\n${selectedUsage?.references.join('\n')}\n\nYakin ingin tetap menghapusnya?`
      : `Hapus aset "${selectedAsset.id}" dari proyek?`;

    if (!confirm(confirmMsg)) return;

    setBusy(true);
    try {
      if (api?.deleteAsset) {
        await api.deleteAsset(selectedAsset.path, selectedAsset.id);
      }
      const nextBundle = removeAssetFromBundle(bundle, selectedAsset.id);
      onCommit(nextBundle, `Aset ${selectedAsset.id} dihapus dari proyek.`);
      setSelectedAssetId(null);
      setStatusNotice(`Aset ${selectedAsset.id} berhasil dihapus.`);
    } catch (err) {
      setStatusNotice(`Gagal menghapus aset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleCleanUnused = () => {
    if (audit.unusedCount === 0) {
      alert('Tidak ada aset yang tidak terpakai.');
      return;
    }
    if (
      !confirm(
        `Ditemukan ${audit.unusedCount} aset yang tidak digunakan dalam database atau map manapun.\n\nBersihkan dan hapus dari manifest proyek?`
      )
    ) {
      return;
    }

    const { nextBundle, removedCount } = cleanUnusedAssetsFromBundle(bundle);
    onCommit(nextBundle, `${removedCount} aset tidak terpakai dibersihkan dari proyek.`);
    setSelectedAssetId(null);
    setStatusNotice(`${removedCount} aset tidak terpakai berhasil dibersihkan.`);
  };

  const handleOpenFolder = () => {
    if (api?.openAssetFolder) {
      const folder = selectedCategory === 'all' ? 'assets' : `assets/${selectedCategory}`;
      api.openAssetFolder(folder);
    }
  };

  return (
    <div className="mv-modal-backdrop mz-rm-backdrop" onClick={onClose}>
      <div className="mv-modal mz-resource-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mv-modal-header mz-rm-header">
          <div className="mz-rm-header-left">
            <span className="mz-rm-icon">📁</span>
            <strong>Resource Manager</strong>
            <span className="mz-badge-total">{audit.totalAssets} Berkas</span>
            <span className="mz-badge-inuse">{audit.inUseCount} Digunakan</span>
            <span className="mz-badge-unused">{audit.unusedCount} Belum Dipakai</span>
          </div>
          <button className="mv-modal-close" onClick={onClose} title="Tutup Resource Manager (Esc)">
            ✕
          </button>
        </div>

        {/* Notice bar */}
        {statusNotice && (
          <div className="mz-rm-notice">
            <span>ℹ️ {statusNotice}</span>
            <button onClick={() => setStatusNotice(null)}>×</button>
          </div>
        )}

        {/* Main Body (3-pane layout) */}
        <div className="mz-rm-body">
          {/* Left: Category Navigation */}
          <aside className="mz-rm-categories">
            <div className="mz-rm-cat-header">Kategori Aset</div>
            <button
              className={`mz-rm-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>📂</span>
              <span className="mz-rm-cat-title">Semua Aset</span>
              <small>{allAssets.length}</small>
            </button>

            <div className="mz-rm-cat-section">GAMBAR (IMAGES)</div>
            {ASSET_CATEGORIES.filter((c) => c.group === 'image').map((cat) => (
              <button
                key={cat.id}
                className={`mz-rm-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>🖼️</span>
                <span className="mz-rm-cat-title">{cat.label}</span>
                <small>{audit.byCategory[cat.id] ?? 0}</small>
              </button>
            ))}

            <div className="mz-rm-cat-section">AUDIO & SUARA</div>
            {ASSET_CATEGORIES.filter((c) => c.group === 'audio').map((cat) => (
              <button
                key={cat.id}
                className={`mz-rm-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>🔊</span>
                <span className="mz-rm-cat-title">{cat.label}</span>
                <small>{audit.byCategory[cat.id] ?? 0}</small>
              </button>
            ))}

            <div className="mz-rm-cat-section">LAIN-LAIN</div>
            {ASSET_CATEGORIES.filter((c) => c.group === 'other').map((cat) => (
              <button
                key={cat.id}
                className={`mz-rm-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>📄</span>
                <span className="mz-rm-cat-title">{cat.label}</span>
                <small>{audit.byCategory[cat.id] ?? 0}</small>
              </button>
            ))}
          </aside>

          {/* Center: File List Table */}
          <section className="mz-rm-file-list-pane">
            <div className="mz-rm-filter-bar">
              <input
                type="text"
                placeholder="Cari aset berdasarkan ID atau nama berkas…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mz-rm-search-input"
              />
              <div className="mz-rm-status-tabs">
                <button
                  className={statusFilter === 'all' ? 'active' : ''}
                  onClick={() => setStatusFilter('all')}
                >
                  Semua ({allAssets.length})
                </button>
                <button
                  className={statusFilter === 'in-use' ? 'active' : ''}
                  onClick={() => setStatusFilter('in-use')}
                >
                  Digunakan ({audit.inUseCount})
                </button>
                <button
                  className={statusFilter === 'unused' ? 'active' : ''}
                  onClick={() => setStatusFilter('unused')}
                >
                  Unused ({audit.unusedCount})
                </button>
              </div>
            </div>

            <div className="mz-rm-files-scroll">
              {filteredAssets.length === 0 ? (
                <div className="mz-rm-empty-files">
                  <span>⌕</span>
                  <p>Tidak ada berkas aset yang cocok dalam kategori ini.</p>
                </div>
              ) : (
                <table className="mz-rm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}></th>
                      <th>Nama Aset / ID</th>
                      <th>Kategori</th>
                      <th>Ukuran</th>
                      <th>Status Penggunaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => {
                      const rep = audit.usageReports[asset.id];
                      const isSelected = selectedAsset?.id === asset.id;
                      const cat = (asset.category as AssetCategory) || inferAssetCategory(asset.path, asset.type);
                      const isImg = asset.type === 'image' || ['png', 'jpg', 'svg'].some((ext) => asset.path.endsWith(ext));
                      const isAud = asset.type === 'audio' || ['ogg', 'mp3', 'wav'].some((ext) => asset.path.endsWith(ext));

                      return (
                        <tr
                          key={asset.id}
                          className={`mz-rm-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedAssetId(asset.id)}
                        >
                          <td className="mz-rm-cell-icon">{isImg ? '🖼️' : isAud ? '🎵' : '📄'}</td>
                          <td className="mz-rm-cell-name">
                            <strong>{asset.id}</strong>
                            <span className="mz-rm-subpath">{asset.path}</span>
                          </td>
                          <td className="mz-rm-cell-cat">
                            <span className="mz-rm-cat-tag">{cat}</span>
                          </td>
                          <td className="mz-rm-cell-size">{formatSize(asset.size as number | undefined)}</td>
                          <td className="mz-rm-cell-status">
                            {rep?.inUse ? (
                              <span className="mz-status-badge in-use">
                                ● In Use ({rep.references.length})
                              </span>
                            ) : (
                              <span className="mz-status-badge unused">○ Unused</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Right: Asset Inspector & Live Previewer */}
          <aside className="mz-rm-preview-pane">
            {selectedAsset ? (
              <div className="mz-rm-inspector-content">
                <div className="mz-rm-inspector-header">
                  <h3>Preview & Info Aset</h3>
                  <span className="mz-rm-badge-type">{selectedAsset.type.toUpperCase()}</span>
                </div>

                {/* Viewport Live Preview */}
                <div className="mz-rm-preview-box">
                  {selectedAsset.type === 'image' ||
                  ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].some((ext) =>
                    selectedAsset.path.toLowerCase().endsWith(ext)
                  ) ? (
                    <div className="mz-rm-img-preview-container">
                      <img
                        src={selectedAsset.path}
                        alt={selectedAsset.id}
                        className="mz-rm-preview-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : selectedAsset.type === 'audio' ||
                    ['ogg', 'mp3', 'wav', 'm4a'].some((ext) =>
                      selectedAsset.path.toLowerCase().endsWith(ext)
                    ) ? (
                    <div className="mz-rm-audio-preview-container">
                      <div className="mz-rm-audio-icon">🎧</div>
                      <audio
                        controls
                        src={selectedAsset.path}
                        className="mz-rm-audio-player"
                        onError={() => {
                          // Gracefully handle missing or unloaded audio file
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mz-rm-generic-preview">
                      <span style={{ fontSize: '48px' }}>📄</span>
                      <p>Berkas Biner / Teks</p>
                    </div>
                  )}
                </div>

                {/* Metadata Details */}
                <div className="mz-rm-meta-card">
                  <h4>Metadata Aset</h4>
                  <dl className="mz-rm-dl">
                    <dt>ID Aset</dt>
                    <dd>{selectedAsset.id}</dd>
                    <dt>Path Berkas</dt>
                    <dd title={selectedAsset.path}>{selectedAsset.path}</dd>
                    <dt>Kategori</dt>
                    <dd>{(selectedAsset.category as string) || inferAssetCategory(selectedAsset.path)}</dd>
                    <dt>Ukuran</dt>
                    <dd>{formatSize(selectedAsset.size as number | undefined)}</dd>
                    <dt>Lisensi</dt>
                    <dd>{String(selectedAsset.license || 'Tidak ditentukan')}</dd>
                  </dl>
                </div>

                {/* References Card */}
                <div className="mz-rm-refs-card">
                  <h4>
                    Status Penggunaan{' '}
                    {selectedUsage?.inUse ? `(${selectedUsage.references.length} Tempat)` : '(0)'}
                  </h4>
                  {selectedUsage?.inUse ? (
                    <ul className="mz-rm-refs-list">
                      {selectedUsage.references.map((ref, idx) => (
                        <li key={idx}>✓ {ref}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mz-rm-no-refs">
                      <p>⚠️ Aset ini belum digunakan di map, event, maupun database.</p>
                      <small>Dapat dibersihkan atau ditambahkan ke karakter/tileset.</small>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mz-rm-empty-inspector">
                <span>📁</span>
                <p>Pilih berkas dari daftar untuk melihat preview dan dependensinya.</p>
              </div>
            )}
          </aside>
        </div>

        {/* Footer */}
        <div className="mv-modal-footer mz-rm-footer">
          <div className="mz-rm-footer-left">
            <button className="mz-btn-action" disabled={busy} onClick={handleImportAsset}>
              📥 Impor Berkas…
            </button>
            <button
              className="mz-btn-action"
              disabled={busy || !selectedAsset}
              onClick={handleExportAsset}
            >
              📤 Ekspor Berkas…
            </button>
            <button
              className="mz-btn-action mz-btn-danger"
              disabled={busy || !selectedAsset}
              onClick={handleDeleteAsset}
            >
              🗑️ Hapus Aset
            </button>
            <button className="mz-btn-action mz-btn-subtle" onClick={handleOpenFolder}>
              📂 Buka Folder
            </button>
          </div>

          <div className="mz-rm-footer-right">
            <button
              className="mz-btn-action mz-btn-clean"
              disabled={busy || audit.unusedCount === 0}
              onClick={handleCleanUnused}
              title="Hapus aset yang tidak dipakai dalam game"
            >
              🧹 Bersihkan Unused ({audit.unusedCount})
            </button>
            <button className="mz-btn-action primary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
