# Audit Tahap 5 — perangkat produksi konten

Status 22 November 2026: **selesai untuk kriteria Tahap 5**.

## Perangkat yang selesai

- Content Workbench menyunting peta collision, event beserta seluruh command/page, dan tujuh koleksi database runtime: actor, enemy, equipment, skill, state, troop, dan item.
- Event dan database memakai editor JSON lossless dengan pesan kerusakan yang menunjukkan sebab. ID ganda dan bentuk root yang salah ditolak sebelum masuk state editor.
- History 50 perubahan menyediakan undo/redo. Event dapat disalin dan ditempel dengan ID serta posisi baru; clipboard sistem dipakai bila tersedia.
- Pencarian referensi menelusuri project, game, map, event command, dan asset manifest. Diagnostic lint memeriksa transfer map/koordinat/collision, item, troop, skill yang tidak terpakai, dan equipment default.
- Tombol playtest map aktif membuat sesi terisolasi dengan start point aman tanpa mengubah manifest proyek. F3 membuka/menutup overlay map, posisi, facing, switch, variable, gold, event log, dan battle log.

## Importer legacy read-only

- Subset `Actors.json`, `Enemies.json`, `Skills.json`, `Items.json`, `States.json`, dan `Troops.json` dibaca tanpa pernah ditulis kembali.
- ID numerik dipetakan deterministik menjadi `mv.actor.N`, `mv.enemy.N`, `mv.skill.N`, `mv.item.N`, `mv.state.N`, dan `mv.troop.N`; seluruh peta ID tampil dalam laporan.
- Enam notetag Base Stats, parameter enemy, reward, troop member, cost, scope, dan tipe dasar skill dikonversi. Formula bebas lama sengaja menjadi power `1.0` dan dilaporkan untuk review manual, bukan dieksekusi.
- Map/event, plugin/notetag lain, dan formula khusus masuk daftar manual.
- Aset hanya disalin bila `nusv-import-assets.json` memberi `approved: true`, ID/type/path, dan catatan lisensi. Path traversal ditolak. Aset masuk `assets/imported` proyek serta asset manifest; tanpa inventaris berlisensi, importer tidak menyalin aset.
- Fixture `fixtures/mv-import-sample` berisi data buatan dan satu SVG CC0 untuk membuktikan alur. Hash seluruh sumber sebelum/sesudah import harus identik.

## Evaluasi studio

Keputusan lengkap ada di [STUDIO_EVALUATION.md](STUDIO_EVALUATION.md). Database Studio lama tidak disambungkan langsung karena sumber database produksi tidak lengkap dan kontraknya terikat schema lama. Pola UX yang berguna sudah diadaptasi. Animation Studio dan Action Sequence Studio menunggu kontrak native; Battle Preview akan memakai `BattleController` produksi, bukan formula duplikat.

## Bukti acceptance

- `npm.cmd run build`: PASS.
- `npm.cmd test`: PASS, 27/27.
- Tes Tahap 5 membuktikan konversi subset, pemetaan referensi troop→enemy, impor aset allowlist, hash sumber tetap identik, diagnostic referensi rusak, dan pencarian command.
- `npm.cmd run smoke`: PASS; editor → playtest → equipment → eksplorasi → event → transfer → battle → reward → save. Hasil: canvas aktif, tidak ada runtime error, story selesai, switch/token/reward/equipment tersimpan.
- `npm.cmd audit --omit=dev`: 0 kerentanan.

## Batas yang disengaja

Importer adalah subset aman, bukan kompatibilitas penuh. Data produksi lama yang tidak tersedia belum dapat dimigrasikan atau dibandingkan. Editing database menggunakan JSON lossless alih-alih form khusus untuk setiap field; ini menjaga cakupan seluruh kontrak runtime tanpa membuang data. Form domain bertingkat dan studio animasi adalah perluasan berikutnya, bukan syarat acceptance Tahap 5.
