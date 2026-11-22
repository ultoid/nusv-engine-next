# Proses upgrade NUSV Engine

1. Simpan fixture dari setiap schema yang pernah dirilis; jangan memperbarui fixture lama di tempat.
2. Tambahkan migrator murni satu arah `N → N+1`. Migrator tidak boleh mengakses UI, network, atau menjalankan kode proyek.
3. Jalankan migrator berantai sampai versi aktif, lalu validasi hasil dengan validator versi aktif.
4. Pertahankan backup save terakhir. Jangan menimpa primary sebelum output migrasi lolos parse dan validasi.
5. Tambahkan regression test untuk state sebelum/sesudah, ID stabil, resource cap, quest, formation, event position, dan unknown-field policy.
6. Jalankan `npm.cmd run release:verify`; distribusi gagal bila build, test, smoke workspace, packaging, atau smoke paket gagal.
7. Bandingkan `release-manifest.json` dan `audit/DISTRIBUTION_LICENSES.json`. Aset/dependency baru memerlukan keputusan lisensi sebelum rilis.

Rollback dilakukan dengan executable versi sebelumnya dan `slot-01.bak`. Downgrade save yang sudah benar-benar naik schema tidak dijanjikan; pengguna harus memulihkan backup dari sebelum upgrade.
