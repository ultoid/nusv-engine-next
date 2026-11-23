# NUSV Engine Next

![GitHub language](https://img.shields.io/badge/language-TypeScript-blue.svg)
![GitHub version](https://img.shields.io/badge/version-0.1.0-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Deskripsi

**NUSV Engine Next** adalah engine JRPG 2D mandiri untuk Nusvanir. Aplikasi desktop menyatukan Content Workbench, format proyek tervalidasi, importer legacy read-only, runtime PixiJS/WebGL, battle Nusvanir, perangkat quest/ekonomi/cutscene, save recovery, debug dan balancing tooling. Runtime **tidak memuat** RPG Maker MV atau YEP.

Vertical slice yang aman mencakup:
- Eksplorasi empat map, quest dan jurnal
- Toko/inn
- Formation/class progression
- Encounter biasa, boss dua fase
- Cutscene, audio, VFX, action sequence
- Accessibility, gamepad, lokalisasi foundation
- Save/continue, telemetry lokal

Editor mendukung:
- Empat tile layer, mode Auto/L1–L4, palette tile NUSV
- Pencil, eraser, flood fill
- Collision overlay, visibility/lock layer
- Rendering layer yang sama pada playtest
- Migrasi non-destruktif proyek satu-layer lama

## Perintah

| Command | Deskripsi |
|---|---|
| `npm start` | build lalu buka editor desktop |
| `npm run build` | typecheck, build editor/player, dan compile Electron |
| `npm test` | seluruh regression test core/editor host/save/import/adventure/release |
| `npm run smoke` | alur Electron editor→playtest→event→battle→save |
| `npm run balance` | tabel simulasi deterministik 100 seed |
| `npm run package:win` | build paket Windows self-contained dan manifest SHA-256 |
| `npm run verify:package` | salin paket ke folder terisolasi lalu smoke executable paket |
| `npm run release:verify` | gerbang release lengkap |

Eksekutable Windows ada di `release/win-unpacked/NUSV Engine.exe`. Proyek pemain dan save **tidak** ditulis ke folder instalasi; save berada di Electron `userData`.

## Dokumentasi Utama

- [Changelog](CHANGELOG.md)
- [Tahap 7](audit/TAHAP_7.md)
- [Format dan API](audit/FORMAT_AND_API.md)
- [Upgrade Guide](audit/UPGRADE_GUIDE.md)
- [Extension Security](audit/EXTENSION_SECURITY.md)
- [Player Test Checklist](audit/PLAYER_TEST_CHECKLIST.md)

Audit Tahap 0–6 tersedia di folder `audit`.

## Struktur Proyek

- `src/` — source kode
- `audit/` — dokumen tahap perangko
- `examples/` — contoh penggunaan
- `scripts/` — utilitas bantu (smoke, balance, package, verify)
- `electron/` — konfigurasi Electron
- `dist/` — output build
- `release/` — rilis paket

## Lisensi

Distributed under the MIT License. Lihat `LICENSE` untuk lebih detail.

## Kontribusi

1. Fork the project (`git clone https://github.com/ultoid/nusvanir.git`)
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Contact

Project Link: [https://github.com/ultoid/nusvanir](https://github.com/ultoid/nusvanir)
