# Audit Tahap 4 — aturan tempur dan progresi Nusvanir

Status 22 November 2026: **selesai untuk kriteria Tahap 4**.

## Aturan aktif

- Enam atribut STR, INT, DEX, LUK, AGI, VIT dan derived stats mengikuti skill otoritatif `nusvanir-combat-stats`.
- Damage memakai pipeline hit, critical, base mitigation, affinity elemen, PDR/MDR, critical multiplier, guard, lalu variance ±5%.
- HIT, EVA, dan CRI memiliki cap resmi; seluruh stat akhir dan damage dibulatkan menjadi integer.
- SP dinamis dipertahankan antar-battle. Guard memulihkan SP, menerima damage menghasilkan adrenaline SP, dan regen berjalan setelah status tick.
- CTB memiliki threshold 1000, charge berdasarkan Action Speed, carry antar-cycle, modifier priority/cast delay, tie berdasarkan charge lalu speed lalu ID, preview delapan aksi, dan aksi tambahan nyata ketika battler cepat masih memiliki charge penuh.
- Element affinity target mendukung 0×, 0.5×, 1×, dan 2×. Immunity 0× juga mencegah status elemental dari hit tanpa damage.
- Status memiliki durasi, PDR/MDR, damage-per-turn, dan `preventsAction`. State dibersihkan ketika battler mati.
- Healing, death, revive skill/item, guard, physical, magical, armor piercing, item, skill cost, dan invalid target memiliki aturan eksplisit.
- Equipment memberi bonus enam stat dan derived stat; tipe weapon menentukan formula melee/finesse/ranged. Menu party `X` dapat memasang/melepas equipment.
- Base Level memberi 3 stat point. Menu party dapat mengalokasikan dan mereset point dengan item. Class Level memiliki EXP permanen, cap tier 10/30/40/50/60, fixed growth, dan class learning.
- Save progres v2 menyimpan equipment, allocated stats, Base/Class progression, dan resource. Save lama dinormalisasi/migrasi tanpa kehilangan state eksplorasi.

## Keputusan deterministik

- CTB priority modifier dipakai saat menentukan kesiapan tetapi tidak menjadi charge permanen.
- Jika charge tersisa menghasilkan aksi tambahan dalam satu cycle, runtime dasar memakai basic attack otomatis; pemilihan ulang per slot dapat dikembangkan bersama action-sequence UI.
- Status tick dan durasi diproses sesudah action queue, lalu regen. Guard di-reset pada awal cycle.
- Actor tumbang tidak menerima Base/Class EXP. Class EXP level 2+ memakai `round(35 × (level-1)^1.65)` sesuai implementasi lama yang diaudit.

## Bukti verifikasi

- `npm run build`: berhasil.
- `npm test`: 25/25 lulus.
- Tes mencakup hit, miss, critical, guard, immunity, affinity, status/durasi, resource, equipment, stat reset, class learning, invalid target, defeat, death/revive, reward, deterministic seed, CTB priority/carry/repeated action, serta save migration.
- `npm run smoke`: editor → menu party/equipment → eksplorasi → dialog/pilihan → transfer → battle → reward → save berhasil. Accessory yang dipasang tetap ada di save.
- `npm audit --audit-level=low`: 0 kerentanan.

## Batas

Database aktif game lama tidak tersedia pada salinan audit, sehingga pembandingan dilakukan terhadap skill resmi dan plugin stat/class/stamina yang tersedia, bukan seluruh konfigurasi produksi. Visual, animation sequence, dan pilihan command ulang untuk setiap extra CTB slot adalah pengembangan presentasi/perangkat produksi berikutnya, bukan ketidaklengkapan model aturan Tahap 4.
