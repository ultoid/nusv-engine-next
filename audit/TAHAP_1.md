# Tahap 1 — fondasi proyek dan runtime

Tanggal penutupan: 22 November 2026. **SELESAI untuk kriteria Tahap 1 pada roadmap.**

## Hasil

- Format proyek NUSV v1 memiliki manifest, data game, map dan manifest aset. Loader memvalidasi versi, ID stabil, referensi map, ukuran layer, collision dan posisi awal dengan lokasi error.
- Layanan proyek Electron membuat proyek dari fixture aman, membuka, menyimpan dan memulihkan journal `prepared`. Data yang tidak dikenal pada manifest dipertahankan.
- Runtime mandiri memakai TypeScript dan PixiJS/WebGL. Fondasi mencakup boot, game loop, input action keyboard, scene manager, rendering 2D, audio host, logging dan penanganan error.
- Editor React dan runtime berjalan sebagai renderer sandboxed terpisah. File hanya diakses melalui API preload sempit; playtest memakai proyek tersimpan yang divalidasi ulang.
- MV dan YEP tidak dirujuk oleh core, runtime, layanan proyek atau entrypoint Electron baru.

## Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript typecheck, Vite production build, Electron compile | PASS |
| Create → save → reopen proyek baru | PASS |
| Versi/data rusak ditolak tanpa mengubah manifest | PASS |
| Unknown field dipertahankan | PASS |
| Recovery journal terputus | PASS |
| Batas bebas MV pada entrypoint baru | PASS |
| Smoke Electron: editor → API playtest → WebGL canvas | PASS; `editorLoaded`, `projectCreated`, `playtestViaEditorApi`, dan `canvas` bernilai true; tidak ada runtime error. Harness terminal dihentikan setelah receipt karena wrapper Electron tetap menahan sesi, sehingga clean-exit harness belum dianggap teruji. |
| `npm audit --audit-level=low` | PASS, 0 vulnerability setelah pembaruan Electron 45.4.1 dan Vite 8.3.8. |

## Batas

Scene Tahap 1 masih scene kosong yang menampilkan metadata proyek. Eksplorasi, event dan save progres pemain adalah cakupan Tahap 2. Packaging distribusi belum diuji. Smoke test membuktikan jalur aplikasi dan render, bukan kompatibilitas semua GPU.
