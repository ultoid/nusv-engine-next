# Changelog — NUSV Engine Next

Semua pembaruan dan perubahan penting pada NUSV Engine Next didokumentasikan di berkas ini. Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] — 2026-11-23

### 1. Map Editor Backend & Sistem Undo / Redo
- **Tombol & Ikon Redo**: Menambahkan ikon `MZIcons.Redo` (panah melengkung ke kanan gaya RPG Maker MZ) dan tombol toolbar `Redo (Ctrl+Y / Ctrl+Shift+Z)` di samping `Undo (Ctrl+Z)`.
- **Keyboard Shortcuts**:
  - `Ctrl+Z` untuk Undo.
  - `Ctrl+Y` dan `Ctrl+Shift+Z` untuk Redo.
  - `Escape` untuk membatalkan titik awal pemilihan area (`rectangle` / `circle`).
- **Eliminasi Stale Closure pada History Stack**:
  - Sinkronisasi state melalui `bundleRef` dan functional state updaters (`setPast(items => ...)`, `setFuture(items => ...)`).
  - Mencegah kehilangan snapshot riwayat saat pengguna menekan Undo atau Redo secara cepat bertubi-tubi.
- **Continuous Drag Painting**:
  - Mengimplementasikan `activeStrokeBundleRef` saat melukis dengan `pencil`, `eraser`, dan `shadow`.
  - Semua tile yang dilewati sapuan mouse terakumulasi secara kontinu tanpa menimpa tile sebelumnya.
  - Tepat 1 snapshot riwayat dicatat di stack `past` saat mouse dilepas (`mouseup`), sehingga 1 kali Undo membatalkan seluruh sapuan kuas secara utuh.
- **Pemisahan Event Grid Cell (Anti Double-Fire)**:
  - Memisahkan event `onMouseDown` khusus untuk drag tools (`pencil`, `eraser`, `shadow`) dan event `onClick` untuk discrete tools (`rectangle`, `circle`, `fill`, `collision`, serta pemilihan event di Mode Event).
  - Memperbaiki bug `rectangle` dan `circle` yang sebelumnya langsung tertutup di koordinat yang sama akibat double-trigger `onMouseDown` + `onClick`.
- **Drawing Tools Connection**:
  - Menghubungkan tool `Circle` dan `Shadow Pen` di toolbar dan menu bar `Draw` langsung ke backend drawing engine.

### 2. Sistem Tileset & Passage Direction (Standar RPG Maker MZ)
- **Passage & Flags Bitmask**:
  - Passage 4-directional (`0x01` Down, `0x02` Left, `0x04` Right, `0x08` Up) serta Star passage (`0x10` untuk atap tembus pandang).
  - Ladder flag (`0x20`): Otomatis memutar hadap karakter ke atas saat berada di tangga.
  - Bush flag (`0x40`): Efek semak dengan transparansi tubuh bawah.
  - Counter flag (`0x80`): Interaksi event tembus meja/kasir.
  - Damage Floor flag (`0x100`): Pengurangan HP lantai (10 HP tanpa membunuh di bawah 1 HP).
  - Terrain Tag (`0..7`): Ekstraksi dan konfigurasi tag medan di bit 12–15.
- **Dukungan Sheet Lembar E**:
  - Dukungan ID tile 5000–5255 untuk slot lembar E di palette tab, layer paint, dan rendering canvas.
- **Optimasi Caching & Kecepatan Load**:
  - Prapemuatan seluruh aset tileset yang terdaftar di `bundle.assets` saat editor dimuat, mengeliminasi delay/lag transisi saat berganti tab (A, B, C, D, E).

### 3. Database Editor & Image Picker Modal
- **Select an Image Modal**:
  - Menghadirkan modal pemilih gambar tileset ala RPG Maker MZ (`TilesetImagePickerModal`) dengan preview grid transparan dan file selector.
- **Form Field Vertikal**:
  - Bidang `General Settings` (Name, Mode) dan slot gambar (A1–A5, B, C, D, E) diselaraskan ke tampilan vertikal dengan tombol beveled `.mz-mz-picker-field` `[...]`.
- **Penyelarasan Interface**:
  - Menghapus ikon-ikon berlebih pada sidebar kiri database editor agar bersih dan persis dengan UI bawaan RPG Maker MZ.

### 4. Pengujian & Verifikasi
- Menambahkan test suite `tests/stage12-undo-redo.test.js` untuk menguji:
  - Transisi multi-step Undo dan Redo pada map layers.
  - Akumulasi continuous drag stroke painting dan pembatalan satu sapuan utuh.
  - Operasi tool `rectangle` dan `circle` dengan Undo/Redo.
- Seluruh 64 test di test suite lulus (**64 passed, 0 failed**).
- TypeScript typecheck dan packaging build (Vite + Electron) sukses tanpa error.
