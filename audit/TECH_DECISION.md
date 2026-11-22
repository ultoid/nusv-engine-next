# Keputusan teknologi NUSV Engine v1

Tanggal keputusan: 21 November 2026. Keputusan ini menutup pilihan teknologi Tahap 0 untuk target awal Windows; keputusan dapat ditinjau kembali setelah irisan permainan Tahap 3 memberi data performa nyata.

## Keputusan

Gunakan **TypeScript untuk domain/runtime, PixiJS 8 dengan WebGL sebagai renderer produksi, React untuk UI editor, dan Electron sebagai shell editor serta host playtest awal**. Logika game, scene, event, save, battle dan format proyek tetap kode NUSV; PixiJS hanya menangani rendering 2D dan input pointer. MV tidak menjadi dependensi runtime.

Alasan utamanya bersifat praktis: editor, layanan file, tes, dan pengalaman proyek saat ini berada di ekosistem JavaScript. Electron memang memisahkan main dan renderer; akses file tetap harus melalui preload/API yang sempit, sesuai pola yang sudah dipakai editor. Dokumentasi resmi Electron menjelaskan model proses tersebut. PixiJS menyediakan scene graph dan renderer GPU; dokumentasi resminya merekomendasikan WebGL untuk produksi sementara WebGPU dan Canvas masih memiliki batas. Referensi: [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [PixiJS rendering](https://pixijs.com/8.x/guides/components/renderers), dan [PixiJS application](https://pixijs.com/8.x/guides/components/application).

Godot tetap pilihan yang kuat untuk tilemap dan ekspor Windows. Dokumentasi resminya menyediakan `TileMapLayer` dan pipeline export tersendiri. Namun, memilihnya sekarang berarti menulis ulang integrasi editor, membuat jembatan format/tooling kedua, dan memindahkan seluruh tes JavaScript. Godot juga tidak tersedia pada mesin audit ini, sehingga belum ada prototipe setara. Referensi: [Godot TileMapLayer](https://docs.godotengine.org/en/stable/classes/class_tilemaplayer.html) dan [Windows export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html).

## Perbandingan berbobot

Skala 1–5; skor adalah bobot × nilai. Nilai mencatat kesesuaian untuk proyek ini, bukan mutu umum teknologi.

| Kriteria | Bobot | TypeScript/Pixi/Electron | Godot 4 | Native C++/Rust kustom |
| --- | ---: | ---: | ---: | ---: |
| Integrasi editor dan kode yang sudah terbukti | 25 | 5 | 2 | 1 |
| Packaging Windows | 20 | 4 | 5 | 4 |
| Rendering JRPG 2D | 20 | 5 | 5 | 5 |
| Kendali atas aturan engine | 15 | 5 | 4 | 5 |
| Pengujian deterministik dan tooling | 10 | 5 | 4 | 3 |
| Portabilitas masa depan | 10 | 4 | 4 | 5 |
| **Total / 500** | **100** | **470** | **390** | **380** |

## Batas arsitektur

- `packages/core`: model data, validasi, migrasi, event dan battle deterministik; tidak mengimpor Electron, React atau PixiJS.
- `packages/runtime`: scene, loop, input action, audio, dan adaptor PixiJS.
- `apps/editor`: React dan layanan proyek melalui preload Electron.
- `apps/player`: host game Windows; awalnya Electron, dengan domain/runtime yang tetap bebas Electron agar shell dapat diganti.
- `packages/nusvanir-rules`: aturan stat dan battle Nusvanir terpisah dari core umum.
- `packages/mv-importer`: pembacaan legacy read-only; tidak masuk jalur normal runtime.

WebGL menjadi backend produksi awal. WebGPU baru boleh diaktifkan setelah fixture visual, fallback, dan perangkat target diuji. Canvas hanya untuk fallback diagnostik. Semua paket dipin melalui lockfile dan lisensinya dicatat sebelum distribusi.
