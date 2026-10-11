const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function ensureKendaraanTables() {
  try {
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
  } catch (err) {
    console.error('❌ Gagal ensureKendaraanTables:', err.message);
  }
}

module.exports = { ensureKendaraanTables };

