# Evaluasi Studio untuk NUSV Engine

Tanggal keputusan: 22 November 2026.

## Keputusan

Database Studio lama **tidak diintegrasikan sebagai modul runtime atau editor langsung**. Pola UI khusus-domainnya diadaptasi ke Content Workbench baru, sedangkan data selalu dibaca dan ditulis melalui kontrak NUSV v1. Animation Studio dan Battle Preview juga tidak dipindahkan sebagai kode lama pada Tahap 5; keduanya masuk backlog native NUSV setelah kontrak animation/action sequence ditetapkan.

## Bukti dan batas

- Audit Tahap 0 menemukan modul actor, class, race, skill, item, equipment, enemy, state, animation, dan battle sequence, tetapi server Studio mengharapkan folder `Tales of The Dark Time/data` yang tidak terdapat pada salinan audit. Save/round-trip Studio terhadap database produksi karena itu tidak dapat dibuktikan.
- Matriks fitur menandai Database Studio `BLOCKED_SOURCE_INCOMPLETE`. Jalur lama juga terikat schema dan ekosistem MV, sementara runtime NUSV sengaja bebas dari runtime tersebut.
- Kontrak animation/action-sequence native belum ada. Mengadopsi editor visual sebelum kontraknya stabil akan menjadikan bentuk UI sebagai format data de facto.
- Battle Preview bernilai tinggi, tetapi playtest map terpilih, battle log, dan debug overlay yang selesai pada Tahap 5 memberi jalur uji nyata tanpa membuat simulator kedua yang berpotensi menyimpang dari `BattleController`.

## Bagian yang diadaptasi sekarang

- Navigasi koleksi database khusus domain.
- Penyuntingan lossless seluruh record runtime melalui JSON, sehingga field yang belum memiliki form khusus tidak dibuang.
- Pencarian referensi, validasi silang, pesan JSON rusak, undo/redo, dan clipboard event.
- Preview map/collision/event menggunakan kontrak map yang sama dengan runtime.
- Playtest langsung pada map aktif; battle preview selalu memakai implementasi battle produksi.

## Syarat integrasi berikutnya

Animation Studio baru boleh dibangun setelah schema clip, frame/event timing, VFX, audio cue, serta fallback aset tervalidasi. Action Sequence Studio memerlukan command schema berversi dan validator. Battle Preview sebaiknya menjadi mode host untuk `BattleController`, bukan implementasi formula kedua. Kode lama tetap referensi UX read-only dan tidak menjadi dependensi distribusi.
