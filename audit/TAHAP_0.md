# Tahap 0 — inventaris dan keputusan teknis

Tanggal penutupan: 21 November 2026. **SELESAI untuk kriteria Tahap 0 pada roadmap.** Penutupan berarti deliverable keputusan tersedia dan batas bukti dicatat; ini bukan klaim bahwa game lama lengkap, semua fitur bekerja, atau lisensi distribusi seluruh aset sudah bersih.

Pemeriksaan tidak mengubah proyek `Tales of The Dark Time`. Build dan pengujian memakai editor REA serta fixture terpisah. Analisis statis REA yang sempat dimulai tidak menghasilkan Evidence karena terputus; tidak ada kesimpulan di laporan ini yang bergantung pada panggilan tersebut. Karena source JavaScript tersedia, inventaris final menggunakan parser, pencarian sumber, hash, dan tes repository.

## Deliverable

| Kriteria roadmap | Hasil |
| --- | --- |
| Matriks fitur editor | [FEATURE_MATRIX.csv](FEATURE_MATRIX.csv), dengan status `WORKING_LIMITED`, `PARTIAL`, `NOT_TESTED`, `BLOCKED_SOURCE_INCOMPLETE`, dan keterikatan MV. |
| Dependensi, plugin, aset dan lisensi | [plugin-inventory.json](plugin-inventory.json) dan [DEPENDENCY_AND_LICENSE_MATRIX.csv](DEPENDENCY_AND_LICENSE_MATRIX.csv). |
| Percobaan runtime mandiri | Prototipe JavaScript tanpa MV memuat data, input, collision, switch dan event; tujuh tes keseluruhan lulus termasuk kontrak v1. Keterbatasannya dicatat, sehingga ia menjadi bukti feasibility, bukan engine final. |
| Keputusan teknologi | [TECH_DECISION.md](TECH_DECISION.md): TypeScript + PixiJS/WebGL + React/Electron, dengan batas paket yang memisahkan core, runtime, editor, player, rules dan importer. |
| Kontrak proyek, resolusi, input dan save | [PROJECT_CONTRACT_V1.md](PROJECT_CONTRACT_V1.md) serta fixture `fixtures/stage0-safe-project`. Resolusi logis 1080 × 720; input berbasis action; save pemain terpisah dan berversi. |
| Daftar risiko | [RISK_REGISTER.md](RISK_REGISTER.md), termasuk database sumber yang tidak ada, konflik versi MV, lisensi dan dependensi plugin. |
| Proyek contoh aman | `fixtures/stage0-safe-project`; hanya JSON buatan dan tidak membawa aset lama. Loader memvalidasi fixture dan memberi lokasi error. |

## Temuan editor

- Build editor lama lulus pada 21 November 2026. Output memberi peringatan bundle JavaScript sekitar 947 kB dan belum membuktikan kesiapan produksi.
- Sebelas tes save/recovery lama lulus: lima fixture round-trip, 38 titik interupsi, path Unicode panjang, parser plugin literal, rollback dan penolakan data rusak. Bukti ini mendukung adaptasi pola transaksi setelah diuji ulang untuk format baru.
- Editor map, database, event, search, resource dan deployment masih memakai struktur MV. Detail status dan keputusan reuse ada di matriks fitur; komponen UI tidak dianggap domain engine.
- Database Studio memiliki modul actor, class, race, skill, item, equipment, enemy, state, animation dan battle sequence. Server mengharapkan `Tales of The Dark Time/data`, tetapi folder tersebut tidak ada pada salinan yang diperiksa, sehingga pengujian save Studio tidak dilakukan.

## Temuan game dan dependensi

- `js/plugins.js` memiliki 77 entri, 67 aktif dan semua file aktif ditemukan: 41 nama aktif berawalan `NUSV_`, 24 berawalan `YEP_`, serta dua lainnya. Urutan, hash dan penyebutan tekstual YEP direkam di inventaris. Penyebutan teks bukan bukti jalur eksekusi.
- `js/rpg_core.js` menetapkan `Utils.RPGMAKER_VERSION = "1.6.1"`; README game menyebut 1.6.2. Konflik dicatat dan hash runtime harus menjadi identitas pembanding migrasi.
- Klaim fitur dalam README dan roadmap game tidak otomatis menjadi bukti runtime. Migrasi akan memakai fixture dan tes per sistem.
- Pixel Art Atlas memiliki dedikasi CC0 yang dibatasi pada hak yang dimiliki pembuat serta menyebut syarat Krea; dataset tidak akan dibundel. PixelFX memiliki lisensi MIT pada sumber sementara, tetapi hubungan setiap hasil salinan ke sumber masih harus diverifikasi. Font, gambar dan film lain tetap `UNKNOWN` dan dikeluarkan dari fixture aman.
- Runtime MV dan YEP tidak masuk runtime NUSV. Keduanya hanya dipakai sebagai referensi perilaku/import sampai hak serta kebutuhan spesifik diverifikasi.

## Verifikasi penutupan

| Pemeriksaan | Hasil |
| --- | --- |
| `npm.cmd run build` pada editor lama | PASS |
| Tes save/recovery editor lama | PASS, 11 tes dan 38 titik interupsi |
| `npm.cmd test` pada fondasi baru | PASS, 7 tes |
| Loader kontrak v1 pada fixture aman | PASS |
| Penolakan posisi awal terhalang dengan lokasi error | PASS |
| Godot executable pada mesin audit | Tidak tersedia; evaluasi Godot dibatasi pada dokumentasi resmi dan biaya integrasi yang teramati. |

## Keputusan untuk tahap berikutnya

Tahap 1 boleh dimulai memakai kontrak dan arsitektur yang telah ditetapkan. Proyek game lama tetap read-only. Database game yang tidak tersedia bukan blocker untuk fondasi baru karena fixture aman memenuhi kriteria contoh Tahap 0; hal itu tetap menjadi blocker khusus migrasi data nyata pada Tahap 5.
