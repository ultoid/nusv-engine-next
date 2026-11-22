# Audit Tahap 8 — editor produksi (Production Editor)

Status 22 November 2026: **selesai untuk kriteria editor visual Tahap 8.**

## Tujuan

Mengubah NUSV Engine dari fondasi teknis menjadi alat pembuatan game yang layak produksi, dengan editor visual bergaya RPG Maker MV/MZ yang memungkinkan pembuat konten bekerja tanpa menyentuh JSON secara langsung.

## Fitur yang selesai

### 1. Workspace editor ala RPG Maker MV

- Menu bar utama (File, Edit, Mode, Tools, Game) dengan shortcut keyboard (`Ctrl+S`, `Ctrl+Z`, `Ctrl+Y`, `F6`).
- Toolbar dengan tombol New, Open, Save, Undo, Redo, Playtest.
- Panel kiri: Project tree dengan Maps dan Events.
- Panel kanan: Inspector dengan Project properties, Map properties, Layer inspector, Validation.
- Status bar di bawah dengan pesan status, informasi map, dan jumlah error/warning.
- Status dirty-tracking (`*` di judul) dan undo/redo hingga 50 perubahan.

### 2. Map editor (Tahap 8a — selesai sebelumnya)

- Empat tile layer per map (Auto, L1, L2, L3, L4) mengadaptasi konsep RPG Maker MZ.
- Mode Auto menentukan layer berdasarkan kategori tile; mode manual hanya mengubah layer terpilih.
- Tool Pencil, Rectangle, Eraser, Fill, Collision, Events.
- Visibility dan lock per layer; layer nonaktif diredupkan.
- Empat tile dapat ditumpuk pada satu koordinat.
- Shortcut `Ctrl+Tab` untuk berpindah layer.
- Proyek lama 1–3 layer otomatis dimigrasikan menjadi empat layer.

### 3. Event editor visual (baru pada Tahap 8)

- Daftar perintah visual per halaman event dengan preview singkat per perintah.
- Tombol Tambah Perintah dengan dropdown tipe (Dialog, Pilihan, Switch, Variabel, Item, Transfer, Battle, Quest, Shop, Inn, Cutscene, Music).
- Tombol Naikkan/Turunkan/Hapus per perintah untuk pengurutan dan pengeditan.
- Form visual untuk mengedit parameter setiap perintah (menggunakan `CommandFields` yang sudah ada).
- Toggle antara tampilan Visual dan JSON mentah.
- Copy/paste event dengan ID baru dan clipboard sistem.
- Validasi JSON event saat diterapkan (id wajib unik, pages harus array).

### 4. Database editor

- Navigasi koleksi: Actors, Enemies, Equipment, Skills, States, Troops, Items, Classes, Quests, Shops.
- JSON editor per koleksi dengan validasi ID unik dan referensi silang.
- Import subset RPG Maker MV (read-only) dengan laporan konversi dan pekerjaan manual.

### 5. Search dan diagnostik

- Pencarian referensi di seluruh project (ID, nama, switch, item, referensi).
- Diagnostic lint: transfer map/koordinat/collision yang rusak, item/troop yang tidak ditemukan, skill yang tidak direferensikan.
- Ringkasan error dan warning di Inspector.

### 6. Playtest dan runtime

- Tombol Playtest (F6) meluncurkan runtime NUSV mandiri tanpa MV/YEP.
- Debug overlay F3 dengan posisi, switch, variabel, event log, battle log.
- Save/load progres (F5/F9) di runtime.

## Bukti verifikasi

- `npm run build`: berhasil (typecheck, Vite, Electron).
- `npm test`: 41/41 lulus (40 regression + 1 baru untuk manipulasi perintah event).
- `npm run smoke`: lulus — editor → playtest → event → battle → save.
- `npm audit --omit=dev`: 0 kerentanan.
- Paket Windows (`package:win` + `verify:package`) dibangun dan diverifikasi dari folder terisolasi.

## Batas yang disengaja

- Database editor masih berbentuk JSON per koleksi; form per-field untuk setiap record adalah perluasan berikutnya.
- Tile palette masih menggunakan glyph geometris; dukungan spritesheet gambar nyata dan autotile visual adalah perluasan berikutnya.
- Animation Studio dan Action Sequence Studio visual belum diimplementasikan; action sequence tetap deklaratif terbatas.

## Dokumen terkait

- [FORMAT_AND_API.md](FORMAT_AND_API.md): format proyek dan peta.
- [PROJECT_CONTRACT_V1.md](PROJECT_CONTRACT_V1.md): kontrak data NUSV v1.
- [TAHAP_7.md](TAHAP_7.md): stabilitas, distribusi, dan paket Windows.
- [TAHAP_6.md](TAHAP_6.md): sistem JRPG lanjutan (quest, toko, boss, cutscene).

## Komponen utama

- [`src/editor/App.tsx`](<../src/editor/App.tsx>): workspace editor, visual event editor, map editor, database editor.
- [`src/core/map-layers.ts`](<../src/core/map-layers.ts>): sistem empat layer, paint, fill, rectangle, autotile mask.
- [`src/core/validation.ts`](<../src/core/validation.ts>): validasi bundle, map, event, command.
- [`src/core/diagnostics.ts`](<../src/core/diagnostics.ts>): analisis referensi dan pesan kerusakan data.
- [`src/runtime/WorldScene.ts`](<../src/runtime/WorldScene.ts>): runtime playtest dengan rendering layer.
- [`tests/stage8-map-layers.test.js`](<../tests/stage8-map-layers.test.js>): uji layer, paint, fill, rectangle, dan manipulasi perintah event.