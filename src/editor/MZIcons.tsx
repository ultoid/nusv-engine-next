import React from 'react';

export const MZIcons = {
  // 1. New Project (Kertas dokumen putih dengan sudut terlipat dan bintang kuning berkilau)
  New: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8ecef" />
        </linearGradient>
        <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff382" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Kertas */}
      <path d="M4 2.5C4 2.22 4.22 2 4.5 2H12L16 6V17.5C16 17.78 15.78 18 15.5 18H4.5C4.22 18 4 17.78 4 17.5V2.5Z" fill="url(#paperGrad)" stroke="#475569" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Sudut lipatan */}
      <path d="M12 2V5.5C12 5.78 12.22 6 12.5 6H16" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Garis teks samar */}
      <line x1="6.5" y1="9" x2="13.5" y2="9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="12" x2="13.5" y2="12" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="15" x2="11" y2="15" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      {/* Bintang berkilau emas */}
      <path d="M3.5 6.5C4.5 6.5 5.5 5.5 5.5 4.5C5.5 5.5 6.5 6.5 7.5 6.5C6.5 6.5 5.5 7.5 5.5 8.5C5.5 7.5 4.5 6.5 3.5 6.5Z" fill="url(#starGrad)" stroke="#d97706" strokeWidth="0.6" />
    </svg>
  ),

  // 2. Open Project (Folder kuning terbuka)
  Open: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="folderBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="folderFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Tab belakang */}
      <path d="M2.5 4.5C2.5 4.22 2.72 4 3 4H7.2L8.8 5.5H16.5C16.78 5.5 17 5.72 17 6V15C17 15.28 16.78 15.5 16.5 15.5H3C2.72 15.5 2.5 15.28 2.5 15V4.5Z" fill="url(#folderBack)" stroke="#92400e" strokeWidth="1" />
      {/* Kertas putih di dalam folder */}
      <rect x="5" y="5" width="10" height="7" rx="0.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
      {/* Daun depan folder miring */}
      <path d="M2 8.5H17.2L15.4 16H2.8C2.5 16 2.2 15.8 2.1 15.5L1.5 9.5C1.4 8.9 1.9 8.5 2 8.5Z" fill="url(#folderFront)" stroke="#b45309" strokeWidth="1" />
    </svg>
  ),

  // 3. Save Project (Disket 3.5" biru)
  Save: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bodi disket biru */}
      <path d="M3 3C3 2.45 3.45 2 4 2H14.5L17 4.5V17C17 17.55 16.55 18 16 18H4C3.45 18 3 17.55 3 17V3Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
      {/* Label putih */}
      <rect x="5.5" y="2" width="9" height="6.5" rx="0.5" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.8" />
      <rect x="7" y="3.2" width="6" height="1.2" fill="#ef4444" />
      {/* Slider logam perak di bawah */}
      <rect x="5.5" y="11.5" width="9" height="6.5" rx="0.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      <rect x="7.5" y="13" width="2" height="3.5" rx="0.3" fill="#334155" />
    </svg>
  ),

  // 4. Cut (Gunting perak & biru)
  Cut: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5.5" cy="14.5" r="2.5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.6" />
      <circle cx="5.5" cy="5.5" r="2.5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.6" />
      <path d="M7.5 6.5L16 14M7.5 13.5L16 6" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.2" fill="#334155" />
    </svg>
  ),

  // 5. Copy (Dua lembar dokumen bertumpuk)
  Copy: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lembar belakang */}
      <rect x="3" y="3" width="10" height="12" rx="0.8" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      {/* Lembar depan */}
      <rect x="6.5" y="6" width="10.5" height="12" rx="0.8" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
      <line x1="8.5" y1="9" x2="14.5" y2="9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.5" y1="12" x2="14.5" y2="12" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.5" y1="15" x2="12.5" y2="15" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),

  // 6. Paste (Clipboard kayu cokelat dengan kertas putih)
  Paste: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Papan kayu */}
      <rect x="3.5" y="3.5" width="13" height="14.5" rx="1.2" fill="#a16207" stroke="#713f12" strokeWidth="1" />
      {/* Kertas */}
      <rect x="5.5" y="5.5" width="9" height="11" rx="0.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="7.5" y1="9" x2="12.5" y2="9" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="11.5" x2="12.5" y2="11.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="14" x2="11" y2="14" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      {/* Klip logam */}
      <rect x="7" y="2" width="6" height="3" rx="0.8" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      <circle cx="10" cy="3.5" r="0.8" fill="#ffffff" />
    </svg>
  ),

  // 7. Delete (Kertas dengan tanda silang merah tebal)
  Delete: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2.5" width="12" height="15" rx="0.8" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <line x1="6" y1="5.5" x2="11" y2="5.5" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
      {/* X merah tebal */}
      <path d="M6 7L14 15M14 7L6 15" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),

  // 8. Undo (Panah lengkung biru tebal ke kiri)
  Undo: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 6L2.5 10.5L7 15V11.5C11.5 11.5 15.5 12.8 17.5 16C16.8 10 13.5 6 7 6V6Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  ),

  // 9. Map Mode (Ikon landscape pemandangan alam)
  MapMode: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Langit */}
      <rect x="2" y="2" width="16" height="16" rx="1.5" fill="#60a5fa" stroke="#2563eb" strokeWidth="1" />
      {/* Matahari */}
      <circle cx="14" cy="5.5" r="2" fill="#fbbf24" />
      {/* Bukit gunung */}
      <path d="M2 13L6.5 8L11 13.5L14 10.5L18 15V16.5C18 17.3 17.3 18 16.5 18H3.5C2.7 18 2 17.3 2 16.5V13Z" fill="#22c55e" />
      <path d="M7 14L10 10.5L14 15.5L18 11.5V17C18 17.55 17.55 18 17 18H3C2.45 18 2 17.55 2 17V15L7 14Z" fill="#15803d" />
    </svg>
  ),

  // 10. Event Mode (Ikon bidak / karakter event catur)
  EventMode: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Kepala bidak */}
      <circle cx="10" cy="5.5" r="3" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.2" />
      <circle cx="9" cy="4.5" r="0.8" fill="#ffffff" />
      {/* Leher & Badan bidak */}
      <path d="M8 8.5C8 8.5 7 11.5 5.5 14C5 14.8 5.5 15.5 6.5 15.5H13.5C14.5 15.5 15 14.8 14.5 14C13 11.5 12 8.5 12 8.5H8Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.2" />
      {/* Alas melengkung */}
      <rect x="4.5" y="15.5" width="11" height="2.5" rx="1" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
    </svg>
  ),

  // 11. Pencil Tool (Pensil kuning runcing dengan penghapus)
  Pencil: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ujung grafit hitam */}
      <polygon points="3,17 3,13 7,17" fill="#1e293b" />
      <polygon points="4.5,14 7,11.5 8.5,13 6,15.5" fill="#fde047" />
      {/* Bodi kayu pensil kuning */}
      <path d="M6 12.5L13.5 5L15 6.5L7.5 14L6 12.5Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
      {/* Cincin logam */}
      <path d="M13 4.5L14.5 3L16.5 5L15 6.5L13 4.5Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      {/* Penghapus merah muda */}
      <path d="M14.5 3L16 1.5C16.5 1 17.5 1 18 1.5C18.5 2 18.5 3 18 3.5L16.5 5L14.5 3Z" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
    </svg>
  ),

  // 12. Rectangle Tool (Persegi panjang berbingkai biru)
  Rectangle: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="4" width="15" height="12" rx="0.5" fill="#3b82f6" fillOpacity="0.15" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 1.5" />
      <rect x="1.5" y="3" width="3" height="3" fill="#1d4ed8" />
      <rect x="15.5" y="3" width="3" height="3" fill="#1d4ed8" />
      <rect x="1.5" y="14" width="3" height="3" fill="#1d4ed8" />
      <rect x="15.5" y="14" width="3" height="3" fill="#1d4ed8" />
    </svg>
  ),

  // 13. Circle Tool (Lingkaran / elips berbingkai biru)
  Circle: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="10" rx="7.5" ry="6.5" fill="#3b82f6" fillOpacity="0.15" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 1.5" />
      <circle cx="10" cy="3.5" r="1.5" fill="#1d4ed8" />
      <circle cx="17.5" cy="10" r="1.5" fill="#1d4ed8" />
      <circle cx="10" cy="16.5" r="1.5" fill="#1d4ed8" />
      <circle cx="2.5" cy="10" r="1.5" fill="#1d4ed8" />
    </svg>
  ),

  // 14. Flood Fill (Ember cat tumpah dengan cairan cat mengalir)
  Fill: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ember cat miring */}
      <path d="M8 2.5L14 8.5L9.5 13L3.5 7L8 2.5Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      <path d="M3.5 7L9.5 13C8.5 14 6.5 14 5 12.5L2 9.5L3.5 7Z" fill="#3b82f6" />
      {/* Gagang ember */}
      <path d="M8.5 2L13 6.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
      {/* Tetesan cat tumpah */}
      <path d="M14.5 13C14.5 13 17 15.5 17 16.5C17 17.3 16.3 18 15.5 18C14.7 18 14 17.3 14 16.5C14 15.5 14.5 13 14.5 13Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
    </svg>
  ),

  // 15. Shadow Pen (Kuas / bayangan dinding tebing)
  Shadow: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="15" height="15" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
      {/* Bayangan diagonal transparan */}
      <polygon points="2.5,2.5 17.5,17.5 2.5,17.5" fill="#334155" fillOpacity="0.55" />
      <line x1="2.5" y1="2.5" x2="17.5" y2="17.5" stroke="#1e293b" strokeWidth="1.2" />
    </svg>
  ),

  // 16. Zoom In (Kaca pembesar +)
  ZoomIn: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="8.5" r="5.5" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.8" />
      {/* Tanda + */}
      <line x1="8.5" y1="5.5" x2="8.5" y2="11.5" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="5.5" y1="8.5" x2="11.5" y2="8.5" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
      {/* Gagang */}
      <line x1="12.5" y1="12.5" x2="17.5" y2="17.5" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),

  // 17. Zoom Out (Kaca pembesar -)
  ZoomOut: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="8.5" r="5.5" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.8" />
      {/* Tanda - */}
      <line x1="5.5" y1="8.5" x2="11.5" y2="8.5" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
      {/* Gagang */}
      <line x1="12.5" y1="12.5" x2="17.5" y2="17.5" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),

  // 18. Actual Size 1:1 (Kaca pembesar 1:1)
  ActualSize: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="8.5" r="6" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.6" />
      <text x="8.5" y="11" textAnchor="middle" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" fill="#0369a1">1:1</text>
      <line x1="13" y1="13" x2="17.5" y2="17.5" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),

  // 19. Database (Dua roda gigi gerigi bertaut)
  Database: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Roda gigi besar emas */}
      <circle cx="8" cy="8" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
      <circle cx="8" cy="8" r="2.2" fill="#ffffff" stroke="#b45309" strokeWidth="1" />
      {/* Gigi-gigi besar */}
      <rect x="7" y="1.5" width="2" height="2" rx="0.3" fill="#f59e0b" stroke="#b45309" strokeWidth="0.6" />
      <rect x="7" y="12.5" width="2" height="2" rx="0.3" fill="#f59e0b" stroke="#b45309" strokeWidth="0.6" />
      <rect x="1.5" y="7" width="2" height="2" rx="0.3" fill="#f59e0b" stroke="#b45309" strokeWidth="0.6" />
      <rect x="12.5" y="7" width="2" height="2" rx="0.3" fill="#f59e0b" stroke="#b45309" strokeWidth="0.6" />
      {/* Roda gigi kecil perak di kanan bawah */}
      <circle cx="13.5" cy="13.5" r="3.5" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
      <circle cx="13.5" cy="13.5" r="1.3" fill="#ffffff" stroke="#475569" strokeWidth="0.8" />
      <rect x="12.7" y="9" width="1.6" height="1.5" rx="0.2" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <rect x="12.7" y="16.5" width="1.6" height="1.5" rx="0.2" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <rect x="9" y="12.7" width="1.5" height="1.6" rx="0.2" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <rect x="16.5" y="12.7" width="1.5" height="1.6" rx="0.2" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
    </svg>
  ),

  // 20. Event Searcher (Kaca pembesar di atas dokumen bergaris)
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dokumen bergaris */}
      <rect x="2.5" y="2" width="11" height="14" rx="0.8" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <line x1="4.5" y1="5" x2="11.5" y2="5" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.5" y1="7.5" x2="11.5" y2="7.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.5" y1="10" x2="9.5" y2="10" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      {/* Kaca pembesar di kanan bawah */}
      <circle cx="12" cy="12" r="4" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />
      <line x1="15" y1="15" x2="18.5" y2="18.5" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),

  // 21. Sound Test (Speaker audio & nada musik)
  Sound: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Speaker box */}
      <rect x="2.5" y="6" width="3.5" height="8" rx="0.5" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
      <polygon points="6,6 11,2.5 11,17.5 6,14" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
      {/* Nada musik / gelombang suara */}
      <path d="M13.5 6C14.8 7.2 15.5 8.5 15.5 10C15.5 11.5 14.8 12.8 13.5 14" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M16 4C17.8 5.8 18.5 7.8 18.5 10C18.5 12.2 17.8 14.2 16 16" stroke="#60a5fa" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  ),

  // 22. Character Generator (Wajah anime chibi)
  Chara: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rambut belakang */}
      <circle cx="10" cy="10" r="7.5" fill="#2563eb" />
      {/* Wajah kulit krem */}
      <ellipse cx="10" cy="11.5" rx="5.5" ry="5" fill="#fed7aa" />
      {/* Poni rambut */}
      <path d="M4.5 9C6 11 8 11.5 10 9C12 11.5 14 11 15.5 9C14.5 5 12 3 10 3C8 3 5.5 5 4.5 9Z" fill="#1d4ed8" />
      {/* Dua mata */}
      <ellipse cx="8" cy="12" rx="0.8" ry="1.2" fill="#1e293b" />
      <ellipse cx="12" cy="12" rx="0.8" ry="1.2" fill="#1e293b" />
      {/* Senyum */}
      <path d="M9 14.5C9.5 15 10.5 15 11 14.5" stroke="#e11d48" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  ),

  // 23. Resource Manager (Kotak arsip / folder lemari berkas)
  Resource: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Laci atas */}
      <rect x="2.5" y="3" width="15" height="6.5" rx="1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
      <rect x="7" y="5.5" width="6" height="1.8" rx="0.5" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.6" />
      {/* Laci bawah */}
      <rect x="2.5" y="10.5" width="15" height="6.5" rx="1" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
      <rect x="7" y="13" width="6" height="1.8" rx="0.5" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.6" />
    </svg>
  ),

  // 24. Plugin Manager (Kepingan puzzle biru)
  Plugin: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.5 3C8.5 4.1 9.4 5 10.5 5C11.6 5 12.5 4.1 12.5 3H16C16.55 3 17 3.45 17 4V7.5C15.9 7.5 15 8.4 15 9.5C15 10.6 15.9 11.5 17 11.5V15C17 15.55 16.55 16 16 16H12.5C12.5 14.9 11.6 14 10.5 14C9.4 14 8.5 14.9 8.5 16H4C3.45 16 3 15.55 3 15V11.5C4.1 11.5 5 10.6 5 9.5C5 8.4 4.1 7.5 3 7.5V4C3 3.45 3.45 3 4 3H8.5Z"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // 25. Playtest (Layar monitor dengan segitiga hijau)
  Playtest: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Layar monitor */}
      <rect x="2" y="2.5" width="16" height="12.5" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
      <rect x="3.5" y="4" width="13" height="9.5" rx="0.8" fill="#0f172a" />
      {/* Segitiga Play hijau cerah */}
      <polygon points="8,5.5 14,8.75 8,12" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
      {/* Kaki monitor */}
      <path d="M7.5 17.5H12.5M10 15V17.5" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),

  // Folder Project di Tree
  ProjectFolder: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3C1.5 2.45 1.95 2 2.5 2H6L7.5 3.5H13.5C14.05 3.5 14.5 3.95 14.5 4.5V12.5C14.5 13.05 14.05 13.5 13.5 13.5H2.5C1.95 13.5 1.5 13.05 1.5 12.5V3Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
    </svg>
  ),

  // Map Item di Tree
  MapItem: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 2.5H10.5L13.5 5.5V13.5H2.5V2.5Z" fill="#ffffff" stroke="#3b82f6" strokeWidth="1" />
      <path d="M10.5 2.5V5.5H13.5" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="4.5" y="7" width="7" height="4" fill="#93c5fd" />
    </svg>
  )
};

