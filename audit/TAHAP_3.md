# Audit Tahap 3 — battle sandbox dan irisan permainan

Status 22 November 2026: **selesai untuk kriteria Tahap 3**.

## Hasil implementasi

- Model actor, enemy, troop, skill, item, action, target, reward, dan resource terpisah dari UI.
- Simulasi giliran deterministik memakai seed RNG, log hasil, urutan action speed, AI target sederhana, attack, guard, skill fisik/magis/heal, dan healing item.
- Enam base stat serta turunan HP/MP/SP, ATK/DEF/MAT/MDF, HIT/EVA/CRI/CEV, critical damage, guard, dan regen mengikuti skill otoritatif `nusvanir-combat-stats`.
- Damage melalui hit, crit, base mitigation, element multiplier, modifier, critical, guard, dan variance ±5%. SP dinamis dipertahankan setelah battle.
- Runtime memiliki overlay battle dengan pemilihan aksi dan target. Victory/defeat, gold, drop item, dan resource party kembali ke state map.
- Event map dapat memulai troop battle dan mengaktifkan switch kemenangan. Editor mengubah enam base stat actor serta power/cost skill contoh.
- Fixture memuat dua actor, dua enemy, tiga skill, potion, dan satu troop latihan.

## Bukti verifikasi

- `npm run build`: berhasil.
- `npm test`: 13/13 lulus. Tes battle mencakup rumus turunan, determinisme seed, invalid target tanpa mutasi input, item, persistensi SP, victory/reward, dan defeat.
- `npm audit --audit-level=low`: 0 kerentanan.
- `npm run smoke`: lulus dan berhenti bersih. Alur Electron membuat proyek, membuka gerbang, transfer peta, memenangkan battle, menerima 16 gold, lalu menyimpan posisi, switch, inventory, dan resource battle.

## Batas Tahap 3

Urutan battle masih round-based sederhana sesuai roadmap, belum CTB final. Status effect, afinitas target, equipment, EXP, class level, death/revive, dan action sequence adalah pekerjaan Tahap 4. Renderer battle sudah fungsional tetapi belum memakai sprite/VFX produksi.
