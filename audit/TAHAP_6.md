# Audit Tahap 6 — sistem JRPG lanjutan

Status 22 November 2026: **selesai untuk kriteria Tahap 6**.

## Vertical slice representatif

Fixture aman sekarang memiliki empat map: Gerbang Uji, Padang Uji, Desa Gerbang, dan Reruntuhan Abu. Alurnya memulai quest **Abu di Timur**, menyelesaikan encounter biasa, membuka jalur ke desa, menyediakan toko dan penginapan, lalu berakhir pada boss **Ash Warden** dua fase. Quest memberi gold dan item; seluruh hasil, posisi event, formation, class, settings, telemetry, inventory, resource, dan progres quest dapat dilanjutkan dari save.

Tes end-to-end menjalankan command event asli dari fixture: quest start → encounter → transaksi ekonomi → inn → boss → quest completion → save → load. Ini bukan simulasi state yang berdiri sendiri.

## Sistem yang selesai

- Quest/jurnal dengan objective counter, status active/completed, reward gold/item, dan state persisten.
- Shop dengan harga dan inventory; transaksi menolak gold tidak cukup. Inn memulihkan HP, MP, dan SP dinamis sesuai derived stats Nusvanir.
- Formation order persisten dan dipakai langsung saat membuat battle party.
- Class change memakai daftar class actor, tier/cap, pertumbuhan class aktif, dan progres level/EXP permanen per class.
- Cutscene mendukung dialog berurutan, VFX flash/shake, dan movement route event empat arah. Movement menghormati batas/collision, dirender bertahap, dan posisinya disimpan.
- Audio mood adaptif `calm`, `danger`, `boss`, dan `silence`, dengan master/music mix. Implementasi fixture memakai nada prosedural agar tidak membawa aset audio tanpa lisensi.
- Action sequence skill memakai langkah terbatas `approach`, `cast`, `impact`, `return`. Langkah menghasilkan animasi battle card dan menghormati reduced-motion; tidak mengeksekusi script bebas.
- Boss phase mengganti skill/bonus pada threshold HP. AI mendukung aggressive/caster/guardian, skill resource, heal priority, dan weighted target rate.
- Simulator balance deterministik 100 seed tersedia melalui `npm.cmd run balance`. Telemetry lokal menyimpan battle, victory, turn, dan damage received serta tampil pada overlay F3.
- Gamepad: D-pad, confirm/cancel, party, journal, dan settings. Keyboard tetap tersedia.
- Aksesibilitas: high contrast, reduced motion, text scale 80–160%, volume mix, dan kontrol tombol/label DOM.
- Lokalisasi memiliki locale `id`/`en`, translation catalog pada data game, dan pergantian bahasa persisten. Konten fixture tetap berbahasa Indonesia kecuali label yang memiliki padanan katalog.

## Kepatuhan aturan Nusvanir

Implementasi memakai skill otoritatif `nusvanir-combat-stats`. Boss dan AI tidak memiliki formula damage khusus: semua actor/enemy tetap memakai enam Base Stats; derived stats, cap HIT/EVA/CRI, SP dinamis, CTB, elemental rate, status, guard, dan delapan langkah damage pipeline yang sama. Phase hanya menambah bonus/skill yang masuk kembali ke pipeline tersebut.

Hasil balance fixture 100 seed:

| Encounter | Win | Rata-rata turn | Rata-rata damage diterima |
| --- | ---: | ---: | ---: |
| Makhluk Padang | 100% | 1,2 | 0,9 |
| Ash Warden | 100% | 7,8 | 155,7 |

Encounter pertama sengaja menjadi tutorial. Boss lebih panjang dan menguras resource namun tidak memblokir penyelesaian fixture.

## Batas yang ditetapkan

- Crafting tidak dimasukkan karena vertical slice tidak memiliki resep atau loop gathering; roadmap menyatakannya opsional bila dibutuhkan. Menambah sistem tanpa kebutuhan konten akan memperluas schema tanpa bukti.
- Movement route Tahap 6 hanya empat arah dan collision-aware; pathfinding, follower choreography, dan parallel route belum diperlukan oleh adegan fixture.
- Action sequence bersifat deklaratif dan terbatas. Camera track, projectile timeline, skeletal animation, dan editor timeline visual ditunda sampai ada kebutuhan adegan produksi.
- Audio adaptif fixture memakai oscillator; streaming/crossfade aset audio berlisensi adalah pekerjaan content pipeline, bukan perubahan formula/domain.
- Lokalisasi engine dan katalog sudah persisten, tetapi terjemahan lengkap seluruh naskah game membutuhkan naskah final produksi.

## Verifikasi

- `npm.cmd run build`: PASS.
- `npm.cmd test`: PASS, 32/32.
- `npm.cmd run balance`: PASS, tabel 100 seed per encounter.
- `npm.cmd run smoke`: PASS setelah action sequence dan movement route; canvas aktif, tanpa runtime error, alur editor→event→battle→save tetap selesai.
- `npm.cmd audit --omit=dev`: 0 kerentanan.
