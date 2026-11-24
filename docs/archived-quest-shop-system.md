# Dokumentasi Arsip: Sistem Quest & Shop (Tahap Awal)

> **Catatan Penyimpanan:**
> Sistem Quest dan Shop dasar telah dinonaktifkan / dihapus dari navigasi tab Database utama NUSV Engine Next agar layout database sepenuhnya identik dengan RPG Maker MZ (Actors hingga Terms).
> Seluruh skema, kode komponen, dan logika runtime diarsipkan di sini untuk dijadikan fondasi saat merancang sistem Quest & Shop yang jauh lebih kompleks dan mendalam di masa depan.

---

## 1. Komponen Editor yang Diarsipkan
- **File:** `src/editor/archived/LegacyQuestShopComponents.tsx`
- **Isi Komponen:**
  - `LegacyQuestDetailForm`: Form informasi quest (ID, Nama, Deskripsi alur cerita) dan tabel tujuan quest dinamis (*objectives*: ID, Teks deskripsi tujuan, Target angka pemenuhan).
  - `LegacyShopDetailForm`: Form informasi toko (ID, Nama toko) dan tabel barang dagangan (*shop goods*: Pilihan item dari database, Harga dalam satuan Gold).

---

## 2. Skema Data (Data Model)

### QuestData (`src/core/types.ts`)
```typescript
export interface QuestObjective {
  id: string;
  text: string;
  target: number;
}

export interface QuestRewards {
  gold?: number;
  exp?: number;
  items?: Record<string, number>;
}

export interface QuestData {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards?: QuestRewards;
}
```

### ShopData (`src/core/types.ts`)
```typescript
export interface ShopGood {
  itemId: string;
  price: number;
}

export interface ShopData {
  id: string;
  name: string;
  items: ShopGood[];
}
```

---

## 3. Logika Runtime Petualangan (`src/core/adventure.ts`)
- `startQuest(bundle, state, questId)`: Mengaktifkan quest dan menginisialisasi dictionary progres objectives menjadi 0.
- `advanceQuest(bundle, state, questId, objectiveId, amount)`: Menambahkan nilai pemenuhan target objective secara deterministik.
- `completeQuest(bundle, state, questId)`: Memvalidasi seluruh objective selesai, menandai status quest `completed`, dan mendistribusikan reward (Gold, Item inventory).
- `buyItem(bundle, state, shopId, itemId, quantity)` & `sellItem(bundle, state, itemId, quantity)`: Logika transaksi perniagaan dan kalkulasi saldo Gold pemain.

---

## 4. Rencana Pengembangan Masa Depan (Sistem Kompleks)
Ide fitur untuk sistem Quest & Shop tingkat lanjut mendatang:
1. **Quest Branches & Multi-path Outcomes:** Cabang alur cerita dengan pilihan moral dan akhir cerita bercabang.
2. **Reputasi Faksi (Faction Standing):** Quest mempengaruhi reputasi dengan faksi-faksi dalam dunia game.
3. **Syarat Level & Waktu (Time-gated Quests):** Batas waktu dalam game (*day/night cycle*) dan prasyarat kelas/level.
4. **Dynamic Economy & Barter Shops:**
   - Fluktuasi harga pasar berdasarkan ketersediaan barang (*supply & demand*).
   - Toko barter yang menukar material crafting alih-alih uang biasa.
   - Diskon berdasarkan hubungan pertemanan dengan NPC pedagang.
