# Changelog — NUSV Engine Next

Semua pembaruan dan perubahan penting pada NUSV Engine Next didokumentasikan di berkas ini. Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] — 2026-11-24

### 1. Pemetaan & Implementasi Lengkap Perintah Tab 3 RPG Maker MZ (Scene Control, System Settings, Map, Battle, Advanced)
- **31 Perintah Baru Standar RPG Maker MZ Menuntaskan 100% Paritas**:
  - **Scene Control**:
    - `Name Input Processing...` (`nameInput`): Membuka dialog input nama kustom untuk aktor dengan batasan digit karakter.
    - `Open Menu Screen` (`openMenu`): Membuka layar menu utama party langsung dari alur event.
    - `Open Save Screen` (`openSave`): Membuka layar save/load game secara langsung.
    - `Return to Title Screen` (`returnToTitle`): Mereset sesi game dan kembali ke title screen.
  - **System Settings**:
    - `Change Battle BGM...` (`changeBattleBgm`): Mengubah musik latar pertarungan secara dinamis.
    - `Change Victory ME...` (`changeVictoryMe`): Mengubah jingle ME saat pertempuran dimenangkan.
    - `Change Defeat ME...` (`changeDefeatMe`): Mengubah jingle ME saat pertempuran kalah/game over.
    - `Change Vehicle BGM...` (`changeVehicleBgm`): Mengubah BGM untuk kendaraan (`boat`, `ship`, `airship`).
    - `Change Save Access...` (`changeSaveAccess`): Mengizinkan atau melarang akses save pemain.
    - `Change Menu Access...` (`changeMenuAccess`): Mengizinkan atau melarang pembukaan menu utama.
    - `Change Encounter...` (`changeEncounter`): Mengaktifkan atau menonaktifkan encounter musuh acak di peta.
    - `Change Formation Access...` (`changeFormationAccess`): Mengizinkan atau mengunci perubahan susunan formasi party.
    - `Change Window Color...` (`changeWindowColor`): Menyesuaikan tone warna jendela dialog/UI (RGB).
    - `Change Actor Images...` (`changeActorImages`): Mengganti grafis karakter, wajah (*Face*), atau battler aktor secara dinamis.
    - `Change Vehicle Image...` (`changeVehicleImage`): Mengganti spritesheet dan frame kendaraan.
  - **Map**:
    - `Change Map Name Display...` (`changeMapNameDisplay`): Mengatur apakah nama peta ditampilkan saat transfer masuk.
    - `Change Tileset...` (`changeTileset`): Mengganti tileset aktif pada peta saat ini.
    - `Change Battle Background...` (`changeBattleBack`): Mengubah grafis latar medan dan pemandangan pertarungan (*Battleback 1 & 2*).
    - `Change Parallax...` (`changeParallax`): Mengubah gambar latar belakang parallax peta beserta opsi perulangan (*Loop X/Y*).
    - `Get Location Info...` (`getLocationInfo`): Membaca informasi sel peta (`terrainTag`, `eventId`, `tileId`, `regionId`) dan menyimpannya ke variabel.
  - **Battle**:
    - `Change Enemy HP...` (`changeEnemyHp`): Menambah/mengurangi HP musuh saat pertempuran dengan opsi knock out.
    - `Change Enemy MP...` (`changeEnemyMp`): Menambah/mengurangi MP musuh.
    - `Change Enemy TP...` (`changeEnemyTp`): Menambah/mengurangi TP musuh.
    - `Change Enemy State...` (`changeEnemyState`): Menerapkan atau mencabut status efek pada musuh.
    - `Enemy Recover All...` (`enemyRecoverAll`): Memulihkan seluruh HP/MP dan menghapus status buruk musuh.
    - `Enemy Appear...` (`enemyAppear`): Memunculkan musuh yang sebelumnya diset tersembunyi (*Hidden*).
    - `Enemy Transform...` (`enemyTransform`): Mengubah jenis musuh di slot battle menjadi musuh lain.
    - `Show Battle Animation...` (`showBattleAnimation`): Memainkan efek animasi pertempuran pada musuh tertentu atau seluruh troop.
    - `Force Action...` (`forceAction`): Memaksa battler (aktor atau musuh) mengeksekusi skill tertentu seketika.
    - `Abort Battle` (`abortBattle`): Menghentikan pertempuran aktif dan kembali ke peta.
  - **Advanced**:
    - `Plugin Command...` (`pluginCommand`): Mengeksekusi perintah plugin kustom dengan argumen terstruktur.
- **Tata Letak Otentik 2-Kolom Tab 3 (`EventCommandPickerModal`)**:
  - Kolom Kiri: `Scene Control` dan `System Settings`.
  - Kolom Kanan: `Map`, `Battle`, dan `Advanced`.
- **Form Editor Visual di `CommandFields.tsx`**:
  - UI terintegrasi untuk seluruh 31 perintah baru di Tab 3.
- **Pengujian & Validasi**:
  - Penambahan skenario test lengkap di `tests/stage17-mz-scene-and-battle-commands.test.js` (total 110/110 unit test lulus).

### 2. Pemetaan & Implementasi Lengkap Perintah Tab 2 RPG Maker MZ (Movement, Character, Picture, Timing, Screen, Audio & Video)
- **11 Perintah Baru Standar RPG Maker MZ**:
  - **Movement**:
    - `Set Vehicle Location...` (`setVehicleLocation`): Menetapkan lokasi kendaraan (`boat`, `ship`, `airship`) ke koordinat peta tertentu.
    - `Get on/off Vehicle` (`getOnOffVehicle`): Memungkinkan pemain menaiki atau turun dari kendaraan yang berada di petak pemain.
  - **Character**:
    - `Change Player Followers...` (`changePlayerFollowers`): Menampilkan atau menyembunyikan pengikut pemain (*Party Followers*).
    - `Gather Followers` (`gatherFollowers`): Mengumpulkan seluruh pengikut ke petak posisi pemain saat ini.
  - **Picture**:
    - `Rotate Picture...` (`rotatePicture`): Mengatur kecepatan rotasi kontinyu gambar (kecepatan -90 hingga 90).
    - `Tint Picture...` (`tintPicture`): Mengubah pewarnaan gambar dengan kurva warna RGBA (Red, Green, Blue, Gray) beserta durasi frame dan opsi wait.
  - **Audio & Video**:
    - `Play BGM...` (`playBgm`): Memainkan musik latar (*Background Music*) dengan path berkas, volume, dan pitch.
    - `Fadeout BGM...` (`fadeoutBgm`): Meredupkan dan menghentikan BGM secara bertahap dalam detik.
    - `Save BGM` (`saveBgm`): Menyimpan lagu BGM yang sedang aktif saat ini ke memori audio.
    - `Replay BGM` (`replayBgm`): Memutar kembali BGM yang sebelumnya disimpan dengan `saveBgm`.
    - `Play Movie...` (`playMovie`): Memainkan berkas video/cutscene (*Movie*).
- **Tata Letak Otentik 2-Kolom Tab 2 (`EventCommandPickerModal`)**:
  - Kolom Kiri:
    - **Movement**: Transfer Player, Set Vehicle Location, Set Event Location, Scroll Map, Set Movement Route, Get on/off Vehicle, Cutscene Movement.
    - **Character**: Change Transparency, Change Player Followers, Gather Followers, Show Animation, Show Balloon Icon, Erase Event.
    - **Picture**: Show Picture, Move Picture, Rotate Picture, Tint Picture, Erase Picture.
  - Kolom Kanan:
    - **Timing**: Wait.
    - **Screen**: Fadeout Screen, Fadein Screen, Tint Screen, Flash Screen, Shake Screen, Set Weather Effect.
    - **Audio & Video**: Play BGM, Fadeout BGM, Save BGM, Replay BGM, Play BGS, Fadeout BGS, Play ME, Play SE, Stop SE, Play Movie.
- **Form Editor Perintah di `CommandFields.tsx`**:
  - Input form lengkap untuk seluruh 11 perintah baru dengan validasi nilai default yang aman.
- **Runtime Audio & WorldScene**:
  - Dukungan `fadeoutBgm`, `saveBgm`, dan `replayBgm` di `AudioManager.ts` serta integrasi `EventIO` di `WorldScene.ts`.
- **Pengujian & Validasi**:
  - Penambahan skenario unit test baru di `tests/stage16-mz-movement-routes-and-commands.test.js` (total 107/107 unit test lulus).

### 2. Pemetaan & Implementasi Lengkap Perintah Tab 1 RPG Maker MZ (Message, Progression, Flow Control, Party, Actor)
- **16 Perintah Baru Standar RPG Maker MZ**:
  - **Message**:
    - `Input Number...` (`inputNumber`): Membuka dialog input angka numerik dengan batas digit (1–8) dan menyimpan hasilnya ke ID variabel terpilih.
    - `Select Item...` (`selectItem`): Membuka dialog pemilih item inventaris berdasarkan kategori (`regular`, `key`, `hiddenA`, `hiddenB`) dan menyimpan ID item ke variabel.
    - `Show Scrolling Text...` (`scrollingText`): Menampilkan teks bergulir vertikal dengan pengaturan kecepatan (1–8) dan opsi larangan percepat (*No Fast Forward*).
  - **Game Progression**:
    - `Control Timer...` (`controlTimer`): Memulai (*Start*) dan menghentikan (*Stop*) timer hitung mundur global dengan durasi dalam detik.
  - **Flow Control**:
    - `Common Event...` (`commonEvent`): Memanggil dan mengeksekusi subrutin *Common Event* dari database proyek secara deterministik.
    - `Comment...` (`comment`): Dokumentasi/catatan anotasi baris perintah event tanpa memengaruhi runtime.
  - **Party**:
    - `Change Weapons...` (`changeWeapons`): Menambah atau mengurangi senjata inventaris dengan opsi *Include Equipment*.
    - `Change Armors...` (`changeArmors`): Menambah atau mengurangi perisai/baju zirah/aksesori dengan opsi *Include Equipment*.
  - **Actor**:
    - `Change TP...` (`changeTp`): Penambahan/pengurangan Technical Points (SP/TP) untuk aktor tertentu atau seluruh party.
    - `Change State...` (`changeState`): Penerapan (*Add*) atau pencabutan (*Remove*) status efek (*State*) pada aktor/party.
    - `Change Parameter...` (`changeParameter`): Modifikasi langsung stat dasar aktor (`atk`, `def`, `mat`, `mdf`, `agi`, `luk`).
    - `Change Equipment...` (`changeEquipment`): Pemasangan atau pencopotan perlengkapan pada slot senjata, perisai, kepala, badan, atau aksesori.
    - `Change Name...` (`changeName`): Perubahan nama dinamis aktor.
    - `Change Class...` (`changeClass`): Pergantian class/pekerjaan aktor dengan opsi mempertahankan level.
    - `Change Nickname...` (`changeNickname`): Pembaruan julukan karakter.
    - `Change Profile...` (`changeProfile`): Pembaruan teks biografi/profil karakter.
- **Frontend & Event Editor UX**:
  - Rekonstruksi palet pemilih `EventCommandPickerModal` menjadi tata letak otentik 2-kolom persis RPG Maker MZ (Kiri: Message, Game Progression, Flow Control; Kanan: Party, Actor, Quests & Story).
  - Penambahan form visual interaktif di `CommandFields.tsx` untuk seluruh 16 perintah baru.
  - Penambahan modal dan event handler di runtime `DialogueController.ts` dan `WorldScene.ts`.
- **Validasi & Pengujian**:
  - Validasi skema deterministik di `src/core/validation.ts`.
  - Penambahan unit test baru di `tests/stage16-mz-movement-routes-and-commands.test.js` (105/105 tests pass).

### 2. Show Text & Face Graphic Picker (Standar RPG Maker MZ)
- **Face Graphic Picker Modal (`FacePickerModal`)**:
  - Implementasi modal pemilih potret wajah otentik RPG Maker MZ (`Select an Image`):
    - Kolom kiri: Daftar berkas wajah (`(None)`, `Actor1`, `Actor2`, `People1`, `SF_Actor1`, dst.) tanpa ekstensi.
    - Kolom kanan: Tampilan spritesheet 4x2 berukuran 576x288 px dengan latar kotak catur transparan, grid pemisah 144x144 px, dan kursor seleksi berkontur ganda hitam-putih khas MZ.
    - Interaksi intuitif: Klik satu kali untuk memilih nomor indeks wajah (0–7), klik ganda untuk konfirmasi langsung dan menutup dialog, tombol *Clear Face* untuk menghapus wajah.
- **Show Text Command Editor (`CommandFields`)**:
  - Rekonstruksi tampilan dialog perintah *Show Text* agar identik dengan RPG Maker MZ:
    - Baris atas: Kotak pratinjau *Face* (klik untuk membuka picker, tombol hapus) berdampingan dengan kotak teks dialog multi-baris.
    - Baris bawah: Input *Name* (nama karakter pembicara), dropdown *Background* (`Window`, `Dim`, `Transparent`), dan dropdown *Window Position* (`Top`, `Middle`, `Bottom`).
  - Pratinjau perintah di baris Contents menampilkan format standar: `[Face(idx)] Name: "Text"`.
- **Runtime Dialogue Box & Rendering (`DialogueController` & `WorldScene`)**:
  - Ekstraksi dan pemotongan otomatis potret 144x144 px dari spritesheet 4x2 secara instan via `TextureManager.getFaceDataUrl`.
  - Rendering kotak nama pembicara (*Name Window*) yang menempel di atas jendela dialog utama.
  - Dukungan penuh untuk posisi vertikal jendela dialog (`pos-top`, `pos-middle`, `pos-bottom`).
  - Dukungan variasi latar belakang jendela (`bg-window` dengan border emas klasik, `bg-dim` semi-transparan gelap, dan `bg-transparent` teks tanpa jendela).
  - Tombol indikator panah lanjut (`▼`) beranimasi dan navigasi tombol aksi (`Enter`, `Space`, `Z`, `X`).
- **Pemuatan Aset & Pengujian**:
  - Preloader aset otomatis untuk kategori `faces` di `useAssetLoader` dan ekspos `faceOptions` di `useEventEditor`.
  - Penambahan unit test verifikasi penerusan parameter `speakerName`, `faceName`, `faceIndex`, `background`, dan `positionType` ke `EventIO` (103/103 tests pass).

### 2. Event System & Movement Route Engine (Standar RPG Maker MZ)
- **Autonomous Movement & Custom Route Runner (`runMoveRoute`)**:
  - Implementasi runner rute pergerakan kustom dengan dukungan:
    - Langkah koordinat: `moveDown`, `moveLeft`, `moveRight`, `moveUp`, `moveLowerLeft`, `moveLowerRight`, `moveUpperLeft`, `moveUpperRight`, `moveRandom`, `moveTowardPlayer`, `moveAwayFromPlayer`, `stepForward`, `stepBackward`, `jump`, dan `wait`.
    - Arah hadap (*Turn*): `turnDown`, `turnLeft`, `turnRight`, `turnUp`, `turn90Right`, `turn90Left`, `turn180`, `turn90RightOrLeft`, `turnRandom`, `turnTowardPlayer`, `turnAwayFromPlayer`.
    - Pengaturan bendera & sakelar: `walkAnimeOn/Off`, `stepAnimeOn/Off`, `directionFixOn/Off`, `throughOn/Off`, `switchOn/Off`, serta eksekusi kode `script`.
    - Opsi loop rute (`repeat`), proteksi jalan buntu (`skippable`), dan sinkronisasi eksekusi (`wait`).
- **13 Perintah Event Baru RPG Maker MZ**:
  - `setMovementRoute`: Menjalankan rute gerakan kustom pada pemain atau event tertentu di peta.
  - `changeHp`: Pengurangan/penambahan HP dengan opsi proteksi *knockout clamping*.
  - `changeMp` & `recoverAll`: Pengelolaan MP dan pemulihan status penuh seluruh aktor/party.
  - `changeLevel` & `changeExp`: Penambahan/pengurangan level dan akumulasi EXP.
  - `changePartyMember` & `changeSkill`: Rekrut/lepas aktor party serta pelajari/lupakan skill.
  - `setEventLocation` & `scrollMap`: Pemindahan posisi event seketika dan pergeseran kamera peta halus.
  - `eraseEvent` & `gameOver`: Penghapusan sementara event hingga pindah peta dan transisi Game Over.
  - `script`: Menjalankan kode JavaScript arbitrer di dalam konteks event.
- **Validasi Skema Lengkap**:
  - Skema validasi di `src/core/validation.ts` diperluas untuk memvalidasi struktur `MoveRoute` dan seluruh 48 tipe perintah event secara deterministik.

### 2. Frontend UI Event Editor & Alur Kerja Penambahan Event (100% RPG Maker MZ Style)
- **Alur Kerja Pembuatan Event Baru (Pure MZ Lifecycle)**:
  - **Draft Terisolasi Tanpa Premature Commit**: Event baru tidak lagi langsung di-commit ke data peta saat dialog dibuka. Jika pengguna menekan tombol *Cancel* atau menutup dialog `[X]`, draft dibuang bersih dan peta tidak mengalami perubahan.
  - **Penomoran ID & Nama Otomatis**: Menghitung ID numerik terkecil yang belum terpakai pada peta (`ID:001 - Event Editor`, nama otomatis `EV001`, `EV002`, dst).
  - **State Awal Bersih**: Event baru dimulai dengan halaman kosong bersih (`commands: []`), tanpa teks dummy, dengan konfigurasi default RPG Maker MZ (`priorityType: 'same'`, `walkAnime: true`, `trigger: 'interact'`).
  - **Tampilan Spreadsheet Contents Murni**: Menghapus toolbar tombol berlebih di atas kotak Contents agar tampilan identik dengan RPG Maker MZ; penambahan perintah dilakukan secara natural via klik ganda baris `◆`, tombol `Enter`, atau menu klik kanan.
  - **Penyelarasan Shortcut Global**: `F5` untuk Map Mode, `F6` untuk Event Mode, dan `Ctrl+R` untuk Playtest.
- **Autonomous Movement Route Modal (`MoveRouteModal`)**:
  - Menambahkan tombol `Route...` di seksi *Autonomous Movement* pada `EventEditorModal` (aktif saat `Type: Custom`).
  - Modal dialog 2-kolom khas RPG Maker MZ: daftar urutan langkah di kiri dengan tombol hapus/bersihkan, dan tombol palet perintah gerakan, hadap, sakelar, dan skrip di kanan.
- **Palet Pemilih Perintah 3 Tab (`EventCommandPickerModal`)**:
  - **Tab 1:** Messages, Game Progression, Flow Control, Party & Actor, Quests.
  - **Tab 2:** Movement, Character Visuals, Picture, Screen Effects.
  - **Tab 3:** Audio, Scenes & Battle, Advanced.
  - Pencarian perintah instan dengan filter real-time.
- **Form Edit Perintah & Perbaikan Kontras Input**:
  - Penataan form kontrol input (`CommandFields.tsx`) dengan tema kontras tinggi (background putih `#ffffff`, teks gelap `#0f172a`) untuk memastikan seluruh teks dan nilai field terbaca jelas.
- **Penanda Visual Event di Peta**:
  - Kotak event tanpa grafik diselaraskan dengan visual RPG Maker MZ (border bergaris biru muda transparan dan highlight seleksi).
  - Penutupan context menu peta seketika saat pengguna menekan tombol klik di luar atau tombol `Escape`.

### 3. Perbaikan Visual Event di Peta & Kontras Dialog Perintah
- **Perbaikan Rendering Sprite Event Terpilih (`MapViewport.tsx` & `style.css`)**:
  - Mengatasi masalah sprite karakter event yang hilang / tidak tampil saat event dipilih di peta. Akar masalah berasal dari shorthand CSS `background: rgba(...) !important;` pada tombol yang dipilih yang menimpa `backgroundImage`. Diganti dengan `background-color` terpisah dan mempertahankan `background-color: transparent !important;` untuk `.textured-event`.
  - Mendukung pencarian grafik dari halaman aktif maupun multi-halaman (`ev.pages?.find(...)`) serta normalisasi path/basename yang fleksibel terhadap ekstensi `.png` maupun prefiks direktori.
- **Perbaikan Kontras Input Dialog Perintah (`Edit Command / Show Choices`)**:
  - Memastikan dialog popover edit perintah (`.mz-edit-popover`, `.mz-command-fields`) menggunakan `color-scheme: light;` dengan background input putih bersih `#ffffff`, teks gelap `#0f172a`, border abu-abu `#94a3b8`, dan label navy `#1e3a5f` dengan kontras tinggi sehingga teks pilihan atau dialog selalu terbaca jelas.
- **Penyelarasan Latar Peta Kosong**:
  - Mengubah latar panggung kanvas peta (`.mv-map-stage`) dari warna putih pekat `#ffffff` menjadi latar slate gelap `#20242a`, mencegah ubin yang belum terisi atau terhapus tampak seperti kotak putih menyilaukan.

- **Pemilihan Frame Karakter Per-Kotak 48x48 (`CharacterPickerModal.tsx` & `style.css`)**:
  - Mengubah sistem pemilihan grafik karakter dari sebelumnya blok karakter 3x4 menjadi pemilihan frame individual 48x48 persis seperti RPG Maker MZ.
  - Pengguna dapat mengklik langsung frame pose / arah mana pun pada spritesheet untuk memilih arah hadap (*direction*) dan pola animasi (*pattern*), dengan kotak kursor hitam-putih khas MZ.
  - Mendukung klik ganda (*double-click*) pada sel frame untuk langsung mengonfirmasi dan menutup dialog.
  - Menyederhanakan daftar file di panel kiri tanpa ekstensi `.png` (`Actor1`, `Actor2`, dst) dan menghapus tombol kontrol bawah yang redundan agar tata letak dialog murni seperti RPG Maker MZ.

### 4. Pengujian & Verifikasi
- Menambahkan suite pengujian `tests/stage16-mz-movement-routes-and-commands.test.js`.
- Seluruh 102 unit test otomatis lulus (**102 passed, 0 failed**).
- Verifikasi kompilasi `npm run build` (typecheck TypeScript, bundling Vite, dan kompilasi Electron) lulus 100%.

---

## [Unreleased] — 2026-11-23

### 1. Map Editor Backend & Sistem Undo / Redo
- **Tombol & Ikon Redo**: Menambahkan ikon `MZIcons.Redo` (panah melengkung ke kanan gaya RPG Maker MZ) dan tombol toolbar `Redo (Ctrl+Y / Ctrl+Shift+Z)` di samping `Undo (Ctrl+Z)`.
- **Keyboard Shortcuts**:
  - `Ctrl+Z` untuk Undo.
  - `Ctrl+Y` dan `Ctrl+Shift+Z` untuk Redo.
  - `Escape` untuk membatalkan titik awal pemilihan area (`rectangle` / `circle`).
- **Eliminasi Stale Closure pada History Stack**:
  - Sinkronisasi state melalui `bundleRef` dan functional state updaters (`setPast(items => ...)`, `setFuture(items => ...)`).
  - Mencegah kehilangan snapshot riwayat saat pengguna menekan Undo atau Redo secara cepat bertubi-tubi.
- **Continuous Drag Painting**:
  - Mengimplementasikan `activeStrokeBundleRef` saat melukis dengan `pencil`, `eraser`, dan `shadow`.
  - Semua tile yang dilewati sapuan mouse terakumulasi secara kontinu tanpa menimpa tile sebelumnya.
  - Tepat 1 snapshot riwayat dicatat di stack `past` saat mouse dilepas (`mouseup`), sehingga 1 kali Undo membatalkan seluruh sapuan kuas secara utuh.
- **Pemisahan Event Grid Cell (Anti Double-Fire)**:
  - Memisahkan event `onMouseDown` khusus untuk drag tools (`pencil`, `eraser`, `shadow`) dan event `onClick` untuk discrete tools (`rectangle`, `circle`, `fill`, `collision`, serta pemilihan event di Mode Event).
  - Memperbaiki bug `rectangle` dan `circle` yang sebelumnya langsung tertutup di koordinat yang sama akibat double-trigger `onMouseDown` + `onClick`.
- **Drawing Tools Connection**:
  - Menghubungkan tool `Circle` dan `Shadow Pen` di toolbar dan menu bar `Draw` langsung ke backend drawing engine.

### 2. Sistem Tileset & Passage Direction (Standar RPG Maker MZ)
- **Passage & Flags Bitmask**:
  - Passage 4-directional (`0x01` Down, `0x02` Left, `0x04` Right, `0x08` Up) serta Star passage (`0x10` untuk atap tembus pandang).
  - Ladder flag (`0x20`): Otomatis memutar hadap karakter ke atas saat berada di tangga.
  - Bush flag (`0x40`): Efek semak dengan transparansi tubuh bawah.
  - Counter flag (`0x80`): Interaksi event tembus meja/kasir.
  - Damage Floor flag (`0x100`): Pengurangan HP lantai (10 HP tanpa membunuh di bawah 1 HP).
  - Terrain Tag (`0..7`): Ekstraksi dan konfigurasi tag medan di bit 12–15.
- **Dukungan Sheet Lembar E**:
  - Dukungan ID tile 5000–5255 untuk slot lembar E di palette tab, layer paint, dan rendering canvas.
- **Optimasi Caching & Kecepatan Load**:
  - Prapemuatan seluruh aset tileset yang terdaftar di `bundle.assets` saat editor dimuat, mengeliminasi delay/lag transisi saat berganti tab (A, B, C, D, E).

### 3. Database Editor & Image Picker Modal
- **Select an Image Modal**:
  - Menghadirkan modal pemilih gambar tileset ala RPG Maker MZ (`TilesetImagePickerModal`) dengan preview grid transparan dan file selector.
- **Form Field Vertikal**:
  - Bidang `General Settings` (Name, Mode) dan slot gambar (A1–A5, B, C, D, E) diselaraskan ke tampilan vertikal dengan tombol beveled `.mz-mz-picker-field` `[...]`.
- **Penyelarasan Interface**:
  - Menghapus ikon-ikon berlebih pada sidebar kiri database editor agar bersih dan persis dengan UI bawaan RPG Maker MZ.

- **Pemilihan Frame Karakter Per-Kotak 48x48 (`CharacterPickerModal.tsx` & `style.css`)**:
  - Mengubah sistem pemilihan grafik karakter dari sebelumnya blok karakter 3x4 menjadi pemilihan frame individual 48x48 persis seperti RPG Maker MZ.
  - Pengguna dapat mengklik langsung frame pose / arah mana pun pada spritesheet untuk memilih arah hadap (*direction*) dan pola animasi (*pattern*), dengan kotak kursor hitam-putih khas MZ.
  - Mendukung klik ganda (*double-click*) pada sel frame untuk langsung mengonfirmasi dan menutup dialog.
  - Menyederhanakan daftar file di panel kiri tanpa ekstensi `.png` (`Actor1`, `Actor2`, dst) dan menghapus tombol kontrol bawah yang redundan agar tata letak dialog murni seperti RPG Maker MZ.

### 4. Pengujian & Verifikasi
- Menambahkan test suite `tests/stage12-undo-redo.test.js` untuk menguji:
  - Transisi multi-step Undo dan Redo pada map layers.
  - Akumulasi continuous drag stroke painting dan pembatalan satu sapuan utuh.
  - Operasi tool `rectangle` dan `circle` dengan Undo/Redo.
- Seluruh 64 test di test suite lulus (**64 passed, 0 failed**).
- TypeScript typecheck dan packaging build (Vite + Electron) sukses tanpa error.
