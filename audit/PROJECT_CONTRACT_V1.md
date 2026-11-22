# Kontrak proyek NUSV v1

Kontrak ini adalah format aktif untuk fondasi dan eksplorasi dasar engine.

## Struktur

```text
project/
  nusv.project.json
  data/game.json
  maps/<map-id>.json
  assets/manifest.json
  assets/<type>/...
```

Semua JSON menggunakan UTF-8, `schemaVersion: 1`, dan ID string stabil dengan pola `^[a-z][a-z0-9.-]{2,63}$`. Referensi memakai ID, bukan indeks array. Loader menolak versi yang tidak didukung dan data yang tidak konsisten dengan lokasi field yang jelas. Field manifest yang belum dikenal dipertahankan saat penyimpanan.

`nusv.project.json` memuat identitas proyek, judul, resolusi logis, daftar ID peta, serta spawn awal. Resolusi logis awal adalah **1080 × 720**. Renderer memakai koordinat simulasi tetap dan kamera menempatkan peta kecil di tengah atau mengikuti pemain pada peta besar.

Setiap peta memiliki ukuran grid, ukuran tile, layer tile, collision mask, dan event. Event memiliki trigger `interact` atau `touch`, halaman berurutan, kondisi switch opsional, sifat solid, dan perintah. Runtime v1 mendukung `text`, `choice`, `setSwitch`, `setVariable`, `giveItem`, dan `transfer`; validator menolak opcode lain.

Data battle berada di `data/game.json`: actor, enemy, equipment, skill, state, troop, dan item memakai ID stabil. Semua battler memiliki enam atribut `str`, `int`, `dex`, `luk`, `agi`, `vit` dan base combat stats. Equipment, allocated stat, class growth, dan class learning menghasilkan snapshot combatant efektif ketika battle dimulai. Event `battle` merujuk troop serta dapat mengaktifkan switch kemenangan. Simulasi menerima seed RNG dan action eksplisit agar hasil dapat direproduksi.

CTB memakai charge threshold 1000. Action Speed menambah charge, priority/cast modifier memengaruhi kesiapan, dan tie diselesaikan dengan charge, speed, lalu ID stabil. Damage affinity hanya menerima matriks 0×/0.5×/1×/2×. Urutan status adalah action resolution, damage-over-time/duration, lalu regen.

Input memakai aksi semantik (`move.*`, `confirm`, `cancel`, `menu`, `save`, `load`). Default keyboard: panah/WASD, Enter/Space, Escape, X, F5, dan F9. Simulasi menerima aksi, bukan keycode mentah.

## Project data dan player save

Data proyek tidak dicampur dengan progres pemain. Save berada di direktori data aplikasi Windows di bawah ID proyek. State progres v2 menyimpan `projectId`, peta/posisi/facing, switch, variabel, jumlah item, gold, HP/MP/SP, equipment, allocated stats, Base EXP/Level, stat point, serta Class EXP/Level setiap actor party. SP dipertahankan antar-battle. Save v1 dimigrasikan ke v2 dan save v2 lama dinormalisasi ketika dibaca. Penulisan memakai file sementara dan backup rollback; save korup ditolak tanpa mengubah data proyek.

Perubahan skema berikutnya wajib menambah migrasi eksplisit. Implementasi tidak boleh menimpa satu-satunya save valid ketika validasi atau commit gagal.

## MV dan import

MV hanya sumber import dan pembanding. Importer kelak membaca salinan, menghasilkan laporan `converted`, `unsupported`, `warning`, dan `error`, serta tidak mengubah sumber. Opcode, notetag, plugin, atau field yang tidak didukung tidak dieksekusi diam-diam.

Fixture aman berada di `fixtures/stage0-safe-project`. Isinya JSON dan bentuk geometris buatan untuk engine ini; tidak mengambil aset game lama.
