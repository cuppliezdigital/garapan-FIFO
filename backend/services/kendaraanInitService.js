const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const https = require('https');

const GSHEET_LOG_UPDATE_URL = 'https://docs.google.com/spreadsheets/d/1D3X7nGt90xKdY_BBa2i5-8DyKEvAHUHgS0CeAGHcGE0/export?format=csv&gid=2';

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCustomDate(str) {
  if (!str) return new Date();
  const parts = str.split(' ');
  if (parts.length < 2) return new Date();
  const [d, m, y] = parts[0].split('/').map(Number);
  const [hh, mm, ss] = parts[1].replace(/\./g, ':').split(':').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  return isNaN(date.getTime()) ? new Date() : date;
}

function fetchFollow(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    https.get(url, (resp) => {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        return resolve(fetchFollow(resp.headers.location, redirectCount + 1));
      }
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function ensureKendaraanTables() {
  try {
    // 0. history table (for backwards compatibility across environments)
    await db.query(`
      CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waybill VARCHAR(150) NOT NULL,
        tanggal DATE NULL,
        outlet VARCHAR(150) NULL,
        stuck VARCHAR(100) NULL,
        tlc VARCHAR(100) NULL,
        status VARCHAR(50) NULL,
        aksi VARCHAR(150) NULL,
        nama_barang TEXT NULL,
        updated_by VARCHAR(100) NULL,
        waktu_dipindah DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_history_waybill (waybill)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 1. kendaraan_instock table
    await db.query(`
      CREATE TABLE IF NOT EXISTS kendaraan_instock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appsheet_id VARCHAR(50) NULL,
        awb VARCHAR(50) NOT NULL,
        tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP,
        spot_petugas VARCHAR(100) NULL,
        tlc_tujuan VARCHAR(30) NOT NULL,
        tipe_kendaraan VARCHAR(50) NOT NULL,
        status_spl VARCHAR(20) NULL,
        status_dokumen VARCHAR(20) NULL,
        koli INT DEFAULT 1,
        keterangan TEXT NULL,
        kode_outlet VARCHAR(50) NULL,
        nama_gateway VARCHAR(100) NULL,
        tagging_pic VARCHAR(100) NULL,
        status_muat ENUM('belum_muat', 'sudah_muat', 'hold') DEFAULT 'belum_muat',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_awb (awb),
        INDEX idx_tlc_tujuan (tlc_tujuan),
        INDEX idx_status_muat (status_muat),
        INDEX idx_status_dokumen (status_dokumen),
        INDEX idx_appsheet_id (appsheet_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. master_gateway_list table
    await db.query(`
      CREATE TABLE IF NOT EXISTS master_gateway_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_gateway VARCHAR(100) NOT NULL,
        tagging_pic VARCHAR(100) DEFAULT NULL,
        feishu_open_id VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_nama_gateway (nama_gateway)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. master_pic_gateway table
    await db.query(`
      CREATE TABLE IF NOT EXISTS master_pic_gateway (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode_outlet VARCHAR(50) NOT NULL,
        nama_gateway VARCHAR(100) NOT NULL,
        tagging_pic VARCHAR(100) DEFAULT NULL,
        display_gateway_pic VARCHAR(150) DEFAULT NULL,
        feishu_open_id VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_kode_outlet (kode_outlet),
        INDEX idx_kode_outlet (kode_outlet),
        INDEX idx_nama_gateway (nama_gateway)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Seed master tables if empty
    const seedPath = path.join(__dirname, '../data/kendaraan_master_seed.json');
    if (fs.existsSync(seedPath)) {
      const [gwCount] = await db.query('SELECT COUNT(*) as c FROM master_gateway_list');
      const [picCount] = await db.query('SELECT COUNT(*) as c FROM master_pic_gateway');

      if (gwCount[0].c === 0 || picCount[0].c === 0) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        if (gwCount[0].c === 0 && Array.isArray(seedData.gateways) && seedData.gateways.length > 0) {
          console.log(`🌱 Seeding ${seedData.gateways.length} Master Gateways...`);
          for (let i = 0; i < seedData.gateways.length; i += 100) {
            const chunk = seedData.gateways.slice(i, i + 100);
            const values = chunk.map(g => [g.nama_gateway, g.tagging_pic || null]);
            await db.query('INSERT IGNORE INTO master_gateway_list (nama_gateway, tagging_pic) VALUES ?', [values]);
          }
          console.log('✅ Master Gateways seeded successfully.');
        }

        if (picCount[0].c === 0 && Array.isArray(seedData.pic_mapping) && seedData.pic_mapping.length > 0) {
          console.log(`🌱 Seeding ${seedData.pic_mapping.length} Master PIC Gateway mappings...`);
          for (let i = 0; i < seedData.pic_mapping.length; i += 500) {
            const chunk = seedData.pic_mapping.slice(i, i + 500);
            const values = chunk.map(p => [p.kode_outlet, p.nama_gateway, p.tagging_pic || null]);
            await db.query('INSERT IGNORE INTO master_pic_gateway (kode_outlet, nama_gateway, tagging_pic) VALUES ?', [values]);
          }
          console.log('✅ Master PIC Gateway mappings seeded successfully.');
        }
      }
    }

    // 5. Auto-seed kendaraan_instock from Google Sheet if table is empty (e.g., initial cloud deploy)
    const [kCount] = await db.query('SELECT COUNT(*) as c FROM kendaraan_instock');
    if (kCount[0].c === 0) {
      console.log('🌱 Table kendaraan_instock kosong. Memulai inisialisasi sync otomatis dari Google Sheet...');
      try {
        const csvContent = await fetchFollow(GSHEET_LOG_UPDATE_URL);
        const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
        const sheetRows = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCsvLine(lines[i]);
          const appsheetId = (row[0] || '').trim();
          const awb = (row[3] || '').trim();
          if (!awb) continue;

          const timestamp = parseCustomDate(row[1]);
          const spotPetugas = (row[2] || '').trim() || null;
          let tlcTujuan = (row[4] || 'LAINNYA').trim().toUpperCase();
          if (tlcTujuan !== 'PNK' && tlcTujuan !== 'BDJ') tlcTujuan = 'LAINNYA';

          const tipeKendaraan = (row[5] || 'Motor Bensin').trim();
          const statusSpl = (row[6] || '').trim() || null;
          const statusDokumen = (row[7] || '').trim() || null;
          const koli = parseInt(row[8], 10) || 1;
          const keterangan = (row[9] || '').trim() || null;

          let statusMuat = 'belum_muat';
          if (tipeKendaraan.toLowerCase().includes('motor') && statusDokumen === 'Tidak') {
            statusMuat = 'hold';
          }

          sheetRows.push([
            appsheetId,
            awb,
            timestamp,
            spotPetugas,
            tlcTujuan,
            tipeKendaraan,
            statusSpl,
            statusDokumen,
            koli,
            keterangan,
            statusMuat
          ]);
        }

        if (sheetRows.length > 0) {
          await db.query(`
            INSERT INTO kendaraan_instock
              (appsheet_id, awb, tanggal_input, spot_petugas, tlc_tujuan, tipe_kendaraan, status_spl, status_dokumen, koli, keterangan, status_muat)
            VALUES ?
          `, [sheetRows]);
          console.log(`✅ Berhasil inisialisasi awal ${sheetRows.length} unit kendaraan dari Google Sheet.`);
        }
      } catch (syncErr) {
        console.warn('⚠️ Gagal auto-sync awal kendaraan (akan dicoba saat user klik tombol sync):', syncErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Gagal ensureKendaraanTables:', err.message);
  }
}

module.exports = { ensureKendaraanTables };
