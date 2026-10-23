/**
 * GARAPAN-FIFO - Automated Database Backup Utility
 * Melakukan dump database MySQL lokal secara mandiri tanpa memerlukan path mysqldump OS.
 *
 * Jalankan via: npm run db:backup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const BACKUP_DIR = path.resolve(__dirname, '../backups');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `'${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())} ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  // String escaping
  const escaped = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
  return `'${escaped}'`;
}

async function runBackup() {
  const startTime = Date.now();
  console.log('📦 Memulai backup database MySQL...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_monitoring_fifo',
    port: Number(process.env.DB_PORT) || 3306,
  };

  const connection = await mysql.createConnection(dbConfig);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `backup_${dbConfig.database}_${dateStr}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });

  // Header SQL
  writeStream.write(`-- ========================================================\n`);
  writeStream.write(`-- GARAPAN-FIFO AUTOMATED DATABASE BACKUP\n`);
  writeStream.write(`-- Database: ${dbConfig.database}\n`);
  writeStream.write(`-- Host:     ${dbConfig.host}\n`);
  writeStream.write(`-- Waktu:    ${now.toISOString()}\n`);
  writeStream.write(`-- ========================================================\n\n`);
  writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
  writeStream.write(`SET NAMES utf8mb4;\n\n`);

  const [tables] = await connection.query(`SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'`);
  const tableProp = Object.keys(tables[0])[0];
  const tableList = tables.map((t) => t[tableProp]);

  console.log(`📋 Ditemukan ${tableList.length} tabel dalam database.`);

  let totalRowsDumped = 0;

  for (const tableName of tableList) {
    // 1. Create table schema
    const [[createRes]] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSql = createRes['Create Table'];

    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`-- Struktur Tabel: \`${tableName}\`\n`);
    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
    writeStream.write(`${createSql};\n\n`);

    // 2. Dump data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      writeStream.write(`-- Data untuk Tabel: \`${tableName}\` (${rows.length} baris)\n`);
      writeStream.write(`LOCK TABLES \`${tableName}\` WRITE;\n`);

      const chunkSize = 250;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const columns = Object.keys(chunk[0]).map((c) => `\`${c}\``).join(', ');
        const valuesList = chunk
          .map((row) => `(${Object.values(row).map(escapeSqlValue).join(', ')})`)
          .join(',\n');
        writeStream.write(`INSERT INTO \`${tableName}\` (${columns}) VALUES\n${valuesList};\n`);
      }

      writeStream.write(`UNLOCK TABLES;\n\n`);
    }
    totalRowsDumped += rows.length;
    console.log(`  ✔ Tabel \`${tableName}\`: ${rows.length} baris dicadangkan.`);
  }

  writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  writeStream.write(`-- Backup selesai: ${new Date().toISOString()}\n`);
  writeStream.end();

  await connection.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));

  const stats = fs.statSync(filePath);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n🎉 Backup Database Berhasil!`);
  console.log(`   - File:    ${path.relative(process.cwd(), filePath)}`);
  console.log(`   - Ukuran:  ${formatBytes(stats.size)}`);
  console.log(`   - Data:    ${totalRowsDumped} baris dari ${tableList.length} tabel`);
  console.log(`   - Durasi:  ${duration} detik`);

  // Retention: Auto-clean backups older than 7 days
  cleanOldBackups();
}

function cleanOldBackups(maxDays = 7) {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    files.forEach((file) => {
      if (file.startsWith('backup_') && file.endsWith('.sql')) {
        const full = path.join(BACKUP_DIR, file);
        const stat = fs.statSync(full);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(full);
          deletedCount++;
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 Auto-Cleanup: Menghapus ${deletedCount} file backup lama (> ${maxDays} hari).`);
    }
  } catch (err) {
    console.warn('⚠️ Gagal membersihkan backup lama:', err.message);
  }
}

if (require.main === module) {
  runBackup().catch((err) => {
    console.error('✖ Error backup database:', err);
    process.exit(1);
  });
}

module.exports = { runBackup };
