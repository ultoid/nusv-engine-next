import React from 'react';
import type { QuestData, ShopData, ProjectBundle } from '../../core/types.js';

/**
 * ARCHIVED: Legacy Quest and Shop Editor Components
 * 
 * Disimpan untuk digunakan di masa depan ketika merancang sistem Quest & Shop yang lebih kompleks.
 * Versi awal ini mencakup:
 * - Quest info (id, name, description), dynamic objectives list (id, text, target).
 * - Shop info (id, name), goods list (itemId, price in Gold).
 */

export interface LegacyQuestFormProps {
  quest: QuestData;
  onUpdate: (patch: Partial<QuestData>) => void;
  textInput: (key: string, value: unknown) => React.ReactNode;
}

export function LegacyQuestDetailForm({ quest, onUpdate, textInput }: LegacyQuestFormProps) {
  const objectives = quest.objectives || [];

  const handleAddObjective = () => {
    const objId = `obj.${Date.now().toString(36)}`;
    onUpdate({
      objectives: [...objectives, { id: objId, text: 'Tujuan quest baru', target: 1 }]
    });
  };

  const handleRemoveObjective = (idx: number) => {
    onUpdate({
      objectives: objectives.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="mz-db-grid-sections">
      <div className="mz-form-card">
        <h3>Informasi Quest</h3>
        <div className="mz-form-row">
          <label className="mz-form-field">
            <span>ID</span>
            {textInput('id', quest.id)}
          </label>
          <label className="mz-form-field">
            <span>Nama Quest</span>
            {textInput('name', quest.name)}
          </label>
        </div>
        <label className="mz-form-field">
          <span>Deskripsi / Alur Cerita</span>
          <textarea
            value={quest.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={3}
          />
        </label>
      </div>

      <div className="mz-form-card">
        <div className="mz-card-header-actions">
          <h3>Tujuan Quest (Objectives)</h3>
          <button type="button" className="mz-btn-small" onClick={handleAddObjective}>
            ＋ Tambah Tujuan
          </button>
        </div>
        <div className="mz-learning-table">
          {objectives.map((obj, idx) => (
            <div key={idx} className="mz-learning-row">
              <span>Teks:</span>
              <input
                type="text"
                value={obj.text}
                onChange={(e) => {
                  const next = [...objectives];
                  next[idx] = { ...next[idx], text: e.target.value };
                  onUpdate({ objectives: next });
                }}
                style={{ flex: 1 }}
              />
              <span>Target:</span>
              <input
                type="number"
                min={1}
                value={obj.target}
                onChange={(e) => {
                  const next = [...objectives];
                  next[idx] = { ...next[idx], target: Number(e.target.value) };
                  onUpdate({ objectives: next });
                }}
                style={{ width: '60px' }}
              />
              <button type="button" className="mz-btn-del-sm" onClick={() => handleRemoveObjective(idx)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface LegacyShopFormProps {
  shop: ShopData;
  bundle: ProjectBundle;
  onUpdate: (patch: Partial<ShopData>) => void;
  textInput: (key: string, value: unknown) => React.ReactNode;
}

export function LegacyShopDetailForm({ shop, bundle, onUpdate, textInput }: LegacyShopFormProps) {
  const items = shop.items || [];

  const handleAddItem = () => {
    const defaultItem = bundle.game.items[0]?.id || 'item.potion';
    onUpdate({
      items: [...items, { itemId: defaultItem, price: 10 }]
    });
  };

  const handleRemoveItem = (idx: number) => {
    onUpdate({
      items: items.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="mz-db-grid-sections">
      <div className="mz-form-card">
        <h3>Informasi Toko (Shop Settings)</h3>
        <div className="mz-form-row">
          <label className="mz-form-field">
            <span>ID</span>
            {textInput('id', shop.id)}
          </label>
          <label className="mz-form-field">
            <span>Nama Toko</span>
            {textInput('name', shop.name)}
          </label>
        </div>
      </div>

      <div className="mz-form-card">
        <div className="mz-card-header-actions">
          <h3>Daftar Barang Dagangan (Shop Goods)</h3>
          <button type="button" className="mz-btn-small" onClick={handleAddItem}>
            ＋ Tambah Barang
          </button>
        </div>
        <div className="mz-learning-table">
          {items.map((it, idx) => (
            <div key={idx} className="mz-learning-row">
              <span>Barang:</span>
              <select
                value={it.itemId}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], itemId: e.target.value };
                  onUpdate({ items: next });
                }}
                style={{ flex: 1 }}
              >
                {bundle.game.items.map((itm) => (
                  <option key={itm.id} value={itm.id}>
                    {itm.name} ({itm.id})
                  </option>
                ))}
              </select>
              <span>Harga:</span>
              <input
                type="number"
                min={0}
                value={it.price}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], price: Number(e.target.value) };
                  onUpdate({ items: next });
                }}
                style={{ width: '80px' }}
              />
              <span>Gold</span>
              <button type="button" className="mz-btn-del-sm" onClick={() => handleRemoveItem(idx)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
