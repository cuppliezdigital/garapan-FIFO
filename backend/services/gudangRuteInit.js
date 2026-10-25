const db = require('../config/db');

async function initGudangRuteTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS gudang_rute_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waybill VARCHAR(50) NOT NULL UNIQUE,
        tanggal_simpan VARCHAR(50) NULL,
        holding_gw VARCHAR(100) NULL,
        status_simpan VARCHAR(100) NULL,
        berat DECIMAL(10,2) DEFAULT 0,
        volume DECIMAL(10,4) DEFAULT 0,
        is_dfod VARCHAR(20) NULL,
        tgl_buka VARCHAR(50) NULL,
        outlet_asal VARCHAR(100) NULL,
        tgl_tiba VARCHAR(50) NULL,
        next_stop VARCHAR(100) NULL,
        gw_asal VARCHAR(100) NULL,
        gw_tujuan VARCHAR(100) NULL,
        outlet_tujuan VARCHAR(100) NULL,
        frekuensi_kirim INT DEFAULT 0,
        durasi_jam DECIMAL(10,1) DEFAULT 0,
        durasi_kategori VARCHAR(50) NULL,
        is_problem VARCHAR(20) NULL,
        status_penangguhan VARCHAR(100) NULL,
        rute VARCHAR(255) NULL,
        gw_tujuan_2 VARCHAR(100) NULL,
        next_gw VARCHAR(100) NULL,
        outlet_akhir VARCHAR(100) NULL,
        tipe_jalur VARCHAR(50) NULL,
        nama_barang TEXT NULL,
        pengirim VARCHAR(255) NULL,
        perusahaan_pengirim VARCHAR(255) NULL,
        no_hp_pengirim VARCHAR(50) NULL,
        penerima VARCHAR(255) NULL,
        perusahaan_penerima VARCHAR(255) NULL,
        no_hp_penerima VARCHAR(50) NULL,
        alamat_penerima TEXT NULL,
        batch_time VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_holding_gw (holding_gw),
        INDEX idx_gw_tujuan (gw_tujuan),
        INDEX idx_outlet_tujuan (outlet_tujuan),
        INDEX idx_durasi_jam (durasi_jam),
        INDEX idx_tipe_jalur (tipe_jalur),
        INDEX idx_batch_time (batch_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS gudang_rute_sync_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        batch_time VARCHAR(50) NULL,
        total_rows INT DEFAULT 0,
        new_count INT DEFAULT 0,
        updated_count INT DEFAULT 0,
        enriched_count INT DEFAULT 0,
        duration_seconds DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'success',
        message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabel gudang_rute_inventory dan gudang_rute_sync_logs berhasil dibuat / diverifikasi!');
  } catch (err) {
    console.error('❌ Gagal inisialisasi tabel gudang_rute:', err);
    throw err;
  }
}

module.exports = { initGudangRuteTables };

if (require.main === module) {
  initGudangRuteTables().then(() => process.exit(0)).catch(() => process.exit(1));
}

