import React from 'react';

export interface UnsavedConfirmModalProps {
  pendingActionLabel: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveAndContinue: () => void;
}

export function UnsavedConfirmModal({
  pendingActionLabel,
  onCancel,
  onDiscard,
  onSaveAndContinue
}: UnsavedConfirmModalProps) {
  return (
    <div className="mv-modal-backdrop" onClick={onCancel}>
      <div className="mv-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Perubahan Belum Disimpan</span>
          <button className="mv-modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="mv-modal-body">
          <p>Proyek saat ini memiliki perubahan yang belum disimpan.</p>
          <p>Apakah Anda ingin menyimpan perubahan sebelum melanjutkan tindakan <b>{pendingActionLabel}</b>?</p>
        </div>
        <div className="mv-modal-footer">
          <button onClick={onCancel}>Batal</button>
          <button onClick={onDiscard}>Jangan Simpan</button>
          <button className="primary" onClick={onSaveAndContinue}>
            Simpan & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
