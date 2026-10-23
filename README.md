# 📦 MONITORING FIFO — REALTIME INVENTORY & LOGISTICS SUITE

> **Enterprise Operations System untuk Monitoring Aging Inventaris Gudang, Integrasi JFS Cargo REST API, Rekonsiliasi Manifest Scan, dan Otomasi Logistik (J&T Cargo GW-Jakarta).**

---

## 📑 Daftar Isi
- [Ringkasan Arsitektur](#-ringkasan-arsitektur)
- [Fitur Utama Sistem](#-fitur-utama-sistem)
- [Struktur Direktori](#-struktur-direktori)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)
- [Perintah Script & Quality Guard](#-perintah-script--quality-guard)
- [Peran Pengguna & Hak Akses (RBAC)](#-peran-pengguna--hak-akses-rbac)

---

## 🏗️ Ringkasan Arsitektur

Sistem dirancang dengan arsitektur **Zero-Build Vanilla SPA** di frontend yang ringan dan responsif, didukung oleh backend **Node.js Express & MySQL** dengan background worker realtime.

```
GARAPAN-FIFO
├── 🖥️ BACKEND (Node.js + Express + MySQL)
│   ├── config/              # Konfigurasi database & environment
│   ├── controllers/         # Handler endpoint API (Audit, Auth, FIFO, JFS, PTO, Kendaraan)
│   ├── middleware/          # JWT Auth guard & monitoring input validation
│   ├── routes/              # Express routing terisolasi per domain
│   ├── services/            # Background worker & REST API bridge JFS/PTO
│   └── server.js            # Main entry point & live HTML compiler hook
│
└── 🌐 FRONTEND (Modular Vanilla SPA)
    ├── public/index.template.html # Template induk bersih & ramping (1.700 baris)
    ├── public/index.html          # Output assembly terkompilasi siap saji
    ├── public/style.css           # Styling operasional utama
    ├── public/themes-retro.css    # 10+ tema retro terisolasi (Win95, XP, DOS, dll)
    └── public/partials/           # Komponen HTML modular per modul:
        ├── views/                 # Laporan FIFO Spot matriks A4
        ├── advance/               # 8 Sub-Tab Menu Advance (Rekonsiliasi s/d Wajib Kirim)
        └── modals/                # Seluruh popup modal & dialog sistem
```

---

## ⚡ Fitur Utama Sistem

1. **Dashboard Monitoring FIFO Realtime**:
   - Pemantauan aging waybill (Level 1: 1-12 Jam, Level 2: 12-24 Jam, Level 3: 24-36 Jam, Level 4: 48-60 Jam, Level 5: 48-72 Jam, Level 6: 72 Jam UP).
   - Filter cepat, pencarian waybill, export Excel, dan status stuck paket.

2. **Laporan FIFO Spot (Presisi A4 Portrait)**:
   - Matriks inventaris 43 SPOT loading bay / TLC tujuan.
   - Tombol 1-klik salin gambar ke Clipboard resolusi tinggi (siap paste di WhatsApp / Feishu).
   - Mode cetak dokumen resmi ukuran kertas A4.

3. **Advance Operations & Intelligence (8 Modul)**:
   - **Rekonsiliasi Scan**: Pencocokan manifest muat vs bongkar & pelacakan transit multi-gateway.
   - **Monitoring Kendaraan**: Kapasitas instock truk & utilisasi kubikasi/tonase.
   - **Generator Feishu**: Ekspor tagihan & rekonsiliasi dokumen otomatis ke format spreadsheet Feishu.
   - **Integrasi JFS**: REST API bridge langsung ke server `jfsgw.jtcargo.co.id` dengan bookmarklet 1-klik sync token.
   - **Pelacakan PTO**: Pelacakan Total Order langsung dari sistem OMS logistik.
   - **Barcode Generator**: Pembuat barcode Code 128 standar industri J&T Cargo.
   - **Cetak AWB Resmi**: Cetak label resi utama, koli, dan tanda terima thermal/PDF.
   - **Wajib Kirim (Must-Go)**: Quality control prioritas kirim armada harian.

4. **Keamanan & Administrasi**:
   - Role-Based Access Control (Super Admin GM, Admin, Operator).
   - Full Audit Logging & Session auto-cleanup.

---

## 📁 Struktur Direktori

```
├── backend/                 # Source code backend Node.js
├── docs/
│   └── presentations/       # Dokumen panduan eksekutif & presentasi (PDF/XLS/CSV)
├── public/                  # Aset statis & frontend application
│   ├── partials/            # Komponen template HTML modular
│   │   ├── advance/         # 8 partials menu Advance
│   │   ├── modals/          # Partials modal popups
│   │   └── views/           # Partials view halaman utama
│   └── vendor/              # Library pihak ketiga (xlsx, html2canvas, jsbarcode)
├── scripts/
│   ├── backup-db.js         # Automated MySQL database backup engine
│   ├── build-html.js        # Compiler assembly template HTML
│   └── check-integrity.js   # Automated DOM Integrity Guard test
├── backups/                 # Arsip snapshot database (.sql)
└── samples/                 # Contoh data testing (.xlsx)
```

---

## 🚀 Instalasi & Menjalankan

### 1. Prasyarat
- Node.js versi 18+ atau lebih baru.
- MySQL Server aktif dengan database `db_monitoring_fifo`.

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` lalu sesuaikan kredensial database:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_monitoring_fifo
JWT_SECRET=super_secret_jwt_key_here
```

### 3. Menjalankan Aplikasi
```bash
# Install dependency
npm install

# Jalankan server
npm start

# Mode development (auto-reload saat file backend berubah)
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🛡️ Perintah Script & Quality Guard

| Perintah | Deskripsi |
| :--- | :--- |
| `npm test` atau `npm run check` | **Automated Integrity Guard**: Menguji keutuhan 100% tag HTML, hierarki kontainer, 8 sub-tab advance, dan keseimbangan CSS dalam 0.2 detik. |
| `npm run build:html` | Merangkai `index.template.html` beserta seluruh partials menjadi `index.html`. *(Server Express juga otomatis menjalankan ini saat runtime).* |
| `npm run db:backup` | **Database Backup Engine**: Dump 23 tabel MySQL secara instan ke folder `backups/` dengan auto-retention 7 hari. |
| `npm start` | Menjalankan server produksi di port 3000. |

> 🩺 **Diagnosa Kesehatan Server**: Akses endpoint `GET http://localhost:3000/api/health` untuk memantau status koneksi MySQL, latency database, status scheduler JFS & PTO, serta penggunaan memori Node.js secara realtime.

---

## 👥 Peran Pengguna & Hak Akses (RBAC)

| Menu / Fitur | Super Admin (GM) | Admin Operasional | Operator / User |
| :--- | :---: | :---: | :---: |
| Dashboard FIFO Monitoring | ✔ Full Akses | ✔ Full Akses | ✔ Baca & Scan |
| Laporan FIFO Spot (A4 Matrix) | ✔ Full Akses | ✔ Full Akses | ❌ Terproteksi |
| Advance Operations (8 Modul) | ✔ Full Akses | ✔ Full Akses | ❌ Terproteksi |
| Manajemen User & Hak Akses | ✔ Full Akses | ❌ Dibatasi | ❌ Dibatasi |
| Audit Trail & Log Keamanan | ✔ Full Akses | ✔ Baca Saja | ❌ Dibatasi |

---

*Dikembangkan dengan standar performa tinggi untuk operasional logistik J&T Cargo.*

