# Batas kepercayaan extension dan modding

NUSV Engine v1 hanya mendukung **content extension deklaratif** melalui data proyek tervalidasi. Engine tidak memuat plugin JavaScript, DLL native, script event, formula bebas, atau package dari proyek game.

## Zona kepercayaan

- **Trusted:** binary NUSV Engine yang dibangun pipeline rilis dan core data fixture internal.
- **Validated content:** JSON proyek, map, database, translation, dan asset manifest. Data dianggap tidak tepercaya sampai seluruh schema, ID, referensi, path, dan range lolos validator.
- **Untrusted/excluded:** legacy plugin, executable, dynamic library, HTML, remote URL, symbolic link, serta aset tanpa provenance/lisensi.

Importer legacy read-only tidak mengeksekusi formula atau plugin. Aset hanya disalin dari allowlist `approved: true`; path traversal ditolak. Renderer tidak mempunyai akses filesystem langsung.

Jika code extension dibutuhkan kelak, ia harus memakai capability API berversi, izin eksplisit, signature/publisher identity, process terpisah, timeout/resource limits, dan tidak mendapat token/network/filesystem default. Sampai host tersebut tersedia, code mod dinyatakan tidak didukung.
