# Format dan API NUSV Engine v1

## Struktur proyek

Satu proyek adalah folder dengan berkas berikut:

```text
nusv.project.json
data/game.json
maps/<map-id>.json
assets/manifest.json
assets/imported/*
```

Semua dokumen utama memakai `schemaVersion: 1`. ID stabil menggunakan huruf kecil, angka, titik, dan tanda hubung. Loader menolak path di luar root, symbolic link pada target save, ID duplikat, referensi battle/item yang hilang, posisi awal terhalang, serta bentuk data yang tidak sesuai kontrak.

`nusv.project.json` menyimpan identitas, resolusi logis, daftar map, party, dan start position. `game.json` menyimpan actor, enemy, equipment, skill, state, troop, item, class, quest, shop, dan translation catalog. Map menyimpan tile layer, collision, event/page, serta command. Asset manifest hanya mencatat aset yang sudah lolos keputusan lisensi.

## Tile layer map

Setiap map tervalidasi memiliki empat tile layer berurutan (`layers[0]` sampai `layers[3]`). Setiap layer memiliki `id`, `type: "tile"`, `name`, dan `data`; panjang `data` wajib sama dengan `width * height`, menggunakan urutan baris dari kiri atas. Nilai `0` berarti transparan dan nilai positif merupakan ID tile NUSV.

Editor menyediakan `Auto`, `Layer 1`, `Layer 2`, `Layer 3`, dan `Layer 4`. Auto memilih layer default berdasarkan jenis tile, sedangkan pilihan manual hanya mengubah layer tersebut. Visibility dan lock merupakan state editor dan tidak mengubah hasil runtime. Proyek lama dengan 1–3 layer dinormalisasi menjadi empat layer transparan saat load; data layer yang sudah ada tidak dipindahkan atau ditimpa.

## Event command v1

Command yang didukung: `text`, `choice`, `setSwitch`, `setVariable`, `giveItem`, `transfer`, `battle`, `questStart`, `questAdvance`, `questComplete`, `shop`, `inn`, `cutscene`, dan `music`.

`cutscene` dapat memiliki `vfx: flash|shake` dan movement route event empat arah. `battle` menunjuk troop dan opsional victory switch. Command tidak boleh memuat JavaScript atau expression bebas. Formula battle tidak berasal dari command/event.

## Save pemain

Save berada di Electron `userData/saves/<projectId>/slot-01.json`, bukan folder instalasi. Schema aktif adalah save v2. Save memuat eksplorasi, switch/variable, inventory/gold, actor resource dan progression, quest, formation, settings, telemetry, serta posisi event dinamis.

`slot-01.bak` mempertahankan save valid sebelumnya. Jika primary korup atau hilang, loader memvalidasi backup lalu memulihkan primary. Save ditulis melalui temporary file, flush, parse verification, dan rename.

## API host

Renderer tidak mendapat Node.js. API yang diekspos preload:

- Editor: `createProject`, `openProject`, `saveProject`, `playtest`, `importMvSubset`.
- Runtime: `loadProject`, `saveProgress`, `loadProgress`.

IPC selalu berakhir pada validator/service main process. Popup dan navigasi eksternal ditolak. Renderer memakai context isolation, sandbox, CSP, dan `nodeIntegration: false`.

## Compatibility promise v1

- Field manifest yang belum dikenal dipertahankan saat round-trip.
- Save v1 dimigrasikan ke v2; save v2 awal mendapat field Tahap 6–7 secara default tanpa kehilangan field inti.
- ID yang sudah dipublikasikan tidak boleh diganti tanpa tabel migrasi.
- Penambahan field opsional kompatibel. Mengubah arti field, menghapus enum, atau mengubah formula memerlukan schema/migration baru dan fixture versi lama.
