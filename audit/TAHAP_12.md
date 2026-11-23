# Audit Tahap 12 — Sistem Undo / Redo & Map Editor Backend (RPG Maker MZ Standard)

Status 23 November 2026: **selesai dan terverifikasi 64/64 test.**

## 1. Tujuan
Memperbaiki dan menyelaraskan arsitektur Map Editor backend serta sistem Undo/Redo agar identik dengan pengalaman dan keandalan RPG Maker MZ, mencakup penanganan input mouse, shortcut keyboard, toolbar visual, serta stack riwayat per-stroke yang deterministik.

## 2. Fitur & Perbaikan Utama

### A. Toolbar Visual & Redo Tool
- Menambahkan ikon `MZIcons.Redo` ke [MZIcons.tsx](file:///e:/Ananto/Emulatoid/Nusvanir/Game%20Project/NUSV%20Engine%20Next/src/editor/MZIcons.tsx).
- Menambahkan tombol fisik `Redo (Ctrl+Y / Ctrl+Shift+Z)` di toolbar mendampingi `Undo (Ctrl+Z)`.
- Mengaktifkan tool `Circle` dan `Shadow Pen` langsung ke backend layer painting di [App.tsx](file:///e:/Ananto/Emulatoid/Nusvanir/Game%20Project/NUSV%20Engine%20Next/src/editor/App.tsx).

### B. Shortcut Keyboard
- `Ctrl+Z`: Menjalankan Undo.
- `Ctrl+Y` dan `Ctrl+Shift+Z`: Menjalankan Redo.
- `Escape`: Membatalkan titik awal pemilihan bentuk area (`rectangle` / `circle`).

### C. History Stack & Drag-Stroke Painting
- Mengeliminasi race condition dan *stale closure* pada stack `past` dan `future` menggunakan mutable refs (`bundleRef`) dan functional state updaters.
- Menggunakan `activeStrokeBundleRef` selama continuous drag painting (`pencil`, `eraser`, `shadow`) sehingga seluruh sel terlukis sempurna tanpa menimpa sel sebelumnya dalam satu sapuan kuas.
- Menghasilkan tepat 1 entri snapshot di stack `past` per sapuan kuas (`onMouseDown` -> `onMouseEnter` -> `window.mouseup`), sehingga satu aksi Undo membatalkan seluruh sapuan kuas secara utuh.

### D. Eliminasi Double-Trigger pada Grid Cells
- Memisahkan event `onMouseDown` (khusus drag tools: pencil, eraser, shadow) dari event `onClick` (khusus discrete tools: rectangle, circle, fill, collision, event selection).
- Menghilangkan bug di mana tool `rectangle` dan `circle` langsung mengeksekusi kotak 1x1 pada klik pertama karena terpicu ganda oleh `onMouseDown` dan `onClick`.

## 3. Bukti Verifikasi
- Test suite baru [stage12-undo-redo.test.js](file:///e:/Ananto/Emulatoid/Nusvanir/Game%20Project/NUSV%20Engine%20Next/tests/stage12-undo-redo.test.js) menguji multi-step undo/redo, continuous drag painting, serta area tools.
- Seluruh 64 test di test suite lulus (**64 passed, 0 failed**).
- TypeScript typecheck lulus tanpa error.
- Vite build dan Electron build sukses.
