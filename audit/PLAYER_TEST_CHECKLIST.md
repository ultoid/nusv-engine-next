# Checklist pengujian pemain dan rilis

## Alur wajib

- Buat/buka proyek, edit lalu simpan.
- Playtest map terpilih; buka party, jurnal, settings, serta debug overlay.
- Mulai quest Abu di Timur, selesaikan encounter biasa, beli item, gunakan inn, dan kalahkan Ash Warden.
- Save, tutup runtime, buka kembali, load, dan pastikan quest/reward/class/formation/settings tetap sama.
- Uji keyboard dan gamepad; high contrast, reduced motion, text scale, master/music volume.

## Failure/recovery

- Data proyek rusak harus memberi lokasi error dan tidak menimpa proyek valid.
- Save primary korup harus pulih dari `.bak`.
- Importer tidak boleh mengubah hash sumber.
- Runtime tidak boleh membuka popup/navigasi eksternal.

## Bukti otomatis saat ini

Regression test menjalankan vertical slice hingga continue-from-save. Smoke Electron menggerakkan input nyata dan menyelesaikan event→battle→save. Package verifier menyalin paket ke folder temporary terisolasi tanpa `node_modules` workspace, lalu menjalankan executable paket dengan alur smoke yang sama. Sesi manusia eksternal belum dicatat; checklist ini menjadi acceptance sheet ketika playtest produksi dengan pemain dilakukan.
