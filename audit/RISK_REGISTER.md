# Register risiko awal

| ID | Risiko | Dampak | Mitigasi / gerbang |
| --- | --- | --- | --- |
| R-01 | Folder game yang diperiksa tidak memiliki `data/`, sementara Database Studio mengharapkannya. | Migrasi database tidak dapat divalidasi dari salinan ini. | Jangan menulis sumber; gunakan fixture aman sampai sumber data lengkap tersedia dan di-hash. |
| R-02 | Versi runtime bertentangan: kode menyatakan MV 1.6.1, README menyebut 1.6.2. | Perbandingan perilaku dapat memakai acuan salah. | Identifikasi runtime lewat hash dan isi file; dokumentasi bukan sumber versi utama. |
| R-03 | 67 plugin aktif dengan urutan dan monkey patch saling bergantung. | Porting langsung membawa perilaku tersirat dan regresi. | Migrasi per sistem dengan tes perilaku; tidak menyalin arsitektur plugin. |
| R-04 | Lisensi YEP, font, gambar dan film belum lengkap. | Distribusi dapat tertahan. | Semua aset default engine baru berasal dari fixture internal; audit lisensi menjadi gerbang import/build. |
| R-05 | Klaim fitur README lebih luas daripada bukti eksekusi. | Roadmap dan estimasi menjadi terlalu optimistis. | Status fitur hanya naik berdasarkan fixture, tes dan playtest terkontrol. |
| R-06 | Electron menambah ukuran paket dan surface keamanan. | Distribusi lebih berat dan IPC berisiko bila longgar. | API preload sempit, context isolation, validasi path; domain/runtime bebas Electron agar shell dapat diganti. |
| R-07 | PixiJS/WebGL berbeda dari MV/Pixi lama. | Efek, blending dan timing bisa berubah. | Fixture visual dan golden screenshot pada perangkat target; pin versi renderer. |
| R-08 | Kontrak data awal dapat berubah selama vertical slice. | Migrasi proyek dan save diperlukan dini. | `schemaVersion`, migrasi eksplisit, ID stabil, fixture lama dipertahankan. |
| R-09 | Dataset Pixel Art Atlas sangat besar dan memiliki batas provenance tambahan. | Ukuran repo, kualitas dan hak pakai sulit dikendalikan. | Jangan bundle dataset; pilih aset satu per satu setelah review provenance. |
| R-10 | Tahap 0 belum mengukur performa battle/map representatif. | Keputusan renderer dapat memerlukan revisi. | Gerbang review setelah irisan Tahap 3; core tetap renderer-agnostic. |
