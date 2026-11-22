# Audit Tahap 7 — stabilitas, distribusi, dan perluasan

Status 22 November 2026: **selesai untuk kriteria teknis Tahap 7**.

## Stabilitas dan compatibility

- Regression suite mencakup project transaction recovery, save v1→v2, save v2 awal→field terbaru, backup recovery, combat deterministik, vertical slice, importer read-only, dan content tooling.
- Save memakai temporary write/flush/parse/rename dan mempertahankan `.bak`. Primary yang hilang atau korup dipulihkan otomatis hanya setelah backup lolos validator.
- Budget test menjalankan 250 validasi save dan 100 simulasi boss; keduanya memiliki batas 2,5 detik pada mesin pengujian dan lulus.
- CSP aktif tanpa `unsafe-eval`. Pixi memakai fallback statis `pixi.js/unsafe-eval`. Sandbox, context isolation, popup deny, navigation guard, dan preload API sempit tetap aktif.

## Distribusi Windows

`npm.cmd run package:win` menghasilkan `release/win-unpacked/NUSV Engine.exe`. Paket membawa runtime Electron, build frontend, compiled main/preload/core, fixture aman, Chromium/Electron licenses, third-party notice, dan manifest SHA-256. Source, tests, compiler, legacy runtime/plugin/aset, serta workspace `node_modules` tidak dibawa sebagai app content.

Build terverifikasi berisi 112 file dan sekitar 375 MB. `npm.cmd run verify:package` menyalin paket ke folder temporary terisolasi, menjalankan executable hasil paket, membuka editor/playtest, merender canvas, menyelesaikan alur event/battle, dan menyimpan progres tanpa memakai instalasi workspace.

Save/settings berada di Electron `userData`, bukan folder instalasi. Detail format dan API ada di [FORMAT_AND_API.md](FORMAT_AND_API.md).

## Lisensi dan aset

`audit/DISTRIBUTION_LICENSES.json` mencatat Electron 45.4.1, PixiJS 8.16.0, React 18.3.1, dan ReactDOM 18.3.1 sebagai MIT. Electron membawa `LICENSE` dan `LICENSES.chromium.html`; paket membawa `THIRD_PARTY_NOTICES.txt`.

Legacy MV runtime, YEP/NUSV plugins lama, font/gambar/film lama, dan Pixel Art Atlas tidak dibundel. Fixture hanya berisi JSON dan visual geometris internal. Asset importer tetap memerlukan allowlist lisensi eksplisit.

## Extension/modding

Keputusan v1 ada di [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md): content JSON tervalidasi didukung; code plugin, DLL, formula/script bebas, remote content, dan executable mod tidak didukung. Batas ini mencegah sistem plugin lama kembali menjadi bagian trusted runtime.

## Bukti penutupan

- `npm.cmd run build`: PASS.
- `npm.cmd test`: PASS, 36 test setelah penambahan suite stabilitas.
- `npm.cmd run smoke`: PASS.
- `npm.cmd run package:win`: PASS.
- `npm.cmd run verify:package`: PASS dari salinan paket terisolasi.
- `npm.cmd run balance`: PASS, 100 seed per encounter.
- `npm.cmd audit --omit=dev`: 0 kerentanan.

## Batas klaim

Paket diuji di Windows x64 pada mesin pengembangan dan dari folder temporary terisolasi tanpa dependency workspace. Ini membuktikan paket self-contained, tetapi bukan pengganti matriks perangkat fisik yang luas atau code signing publik. Sesi manusia eksternal belum dicatat dan tidak diklaim; checklist playtest sudah tersedia. Platform selain Windows belum ditargetkan atau diuji.
