const db = require('../config/db');
const auditService = require('./auditService');

async function ensureMonitoringTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_stuck (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL UNIQUE,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0 Jam (1-12)',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang TEXT,
      updated_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.query(`
      ALTER TABLE monitoring_stuck
        MODIFY COLUMN waybill VARCHAR(150) NOT NULL,
        MODIFY COLUMN tanggal DATE NULL DEFAULT NULL,
        MODIFY COLUMN outlet VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN stuck VARCHAR(100) NULL DEFAULT '0 Jam (1-12)',
        MODIFY COLUMN tlc VARCHAR(100) NULL DEFAULT '-',
        MODIFY COLUMN status VARCHAR(50) NULL DEFAULT 'Pending',
        MODIFY COLUMN aksi VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN nama_barang TEXT NULL,
        MODIFY COLUMN updated_by VARCHAR(100) NULL DEFAULT 'System'
    `);
  } catch (err) {
    console.error('ensureMonitoringTable alter warning:', err.message);
  }

  // Optimasi index untuk performa tinggi pada puluhan ribu data
  try {
    const [indexes] = await db.query(
      `SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitoring_stuck'`
    );
    const existingIndexes = new Set(indexes.map((idx) => idx.INDEX_NAME));

    if (!existingIndexes.has('idx_tanggal_created')) {
      await db.query('ALTER TABLE monitoring_stuck ADD INDEX idx_tanggal_created (tanggal, created_at)');
    }
    if (!existingIndexes.has('idx_status')) {
      await db.query('ALTER TABLE monitoring_stuck ADD INDEX idx_status (status)');
    }
    if (!existingIndexes.has('idx_tlc')) {
      await db.query('ALTER TABLE monitoring_stuck ADD INDEX idx_tlc (tlc)');
    }
  } catch (idxErr) {
    console.error('ensureMonitoringTable index check warning:', idxErr.message);
  }
}

async function ensureMonitoringHistoryTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0 Jam (1-12)',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang TEXT,
      updated_by VARCHAR(100),
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source VARCHAR(50) DEFAULT 'system'
    )
  `);

  try {
    await db.query(`
      ALTER TABLE monitoring_history
        MODIFY COLUMN waybill VARCHAR(150) NOT NULL,
        MODIFY COLUMN tanggal DATE NULL DEFAULT NULL,
        MODIFY COLUMN outlet VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN stuck VARCHAR(100) NULL DEFAULT '0 Jam (1-12)',
        MODIFY COLUMN tlc VARCHAR(100) NULL DEFAULT '-',
        MODIFY COLUMN status VARCHAR(50) NULL DEFAULT 'Pending',
        MODIFY COLUMN aksi VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN nama_barang TEXT NULL,
        MODIFY COLUMN updated_by VARCHAR(100) NULL DEFAULT 'System',
        MODIFY COLUMN source VARCHAR(50) NULL DEFAULT 'system'
    `);
  } catch (err) {
    console.error('ensureMonitoringHistoryTable alter warning:', err.message);
  }

  try {
    const [indexes] = await db.query(
      `SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitoring_history'`
    );
    const existingIndexes = new Set(indexes.map((idx) => idx.INDEX_NAME));

    if (!existingIndexes.has('idx_history_waybill')) {
      await db.query('ALTER TABLE monitoring_history ADD INDEX idx_history_waybill (waybill)');
    }
    if (!existingIndexes.has('idx_history_archived')) {
      await db.query('ALTER TABLE monitoring_history ADD INDEX idx_history_archived (archived_at)');
    }
  } catch (idxErr) {
    console.error('ensureMonitoringHistoryTable index check warning:', idxErr.message);
  }
}

async function ensureMonitoringArchiveTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_archive (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL UNIQUE,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0 Jam (1-12)',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang TEXT,
      updated_by VARCHAR(100),
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.query(`
      ALTER TABLE monitoring_archive
        MODIFY COLUMN waybill VARCHAR(150) NOT NULL,
        MODIFY COLUMN tanggal DATE NULL DEFAULT NULL,
        MODIFY COLUMN outlet VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN stuck VARCHAR(100) NULL DEFAULT '0 Jam (1-12)',
        MODIFY COLUMN tlc VARCHAR(100) NULL DEFAULT '-',
        MODIFY COLUMN status VARCHAR(50) NULL DEFAULT 'Pending',
        MODIFY COLUMN aksi VARCHAR(150) NULL DEFAULT '-',
        MODIFY COLUMN nama_barang TEXT NULL,
        MODIFY COLUMN updated_by VARCHAR(100) NULL DEFAULT 'System'
    `);
  } catch (err) {
    console.error('ensureMonitoringArchiveTable alter warning:', err.message);
  }
}

async function initMonitoringTables() {
  await ensureMonitoringTable();
  await ensureMonitoringHistoryTable();
  await ensureMonitoringArchiveTable();
  try {
    await db.query("UPDATE monitoring_stuck SET status = 'Pending' WHERE status = 'Open' OR status IS NULL OR status = ''");
    await db.query("UPDATE monitoring_archive SET status = 'Pending' WHERE status = 'Open' OR status IS NULL OR status = ''");
  } catch (err) {
    console.error('Migration update Open to Pending warning:', err.message);
  }
}

function normalizeMonitoringRow(raw = {}) {
  const waybill = String(raw.waybill || raw.Waybill || '').trim();
  if (!waybill) return null;

  const tanggal = normalizeMonitoringDate(raw.tanggal || raw.Tanggal || raw.date || '');
  const outlet = raw.outlet || raw.Outlet || raw.outlet_name || '';
  const status = (raw.status || raw.Status || 'Pending').toString().trim() || 'Pending';
  const aksi = raw.aksi || raw.Aksi || '-';
  const namaBarang = raw.nama_barang || raw.NamaBarang || raw.namaBarang || '-';
  const updatedBy = raw.updated_by || raw.UpdatedBy || raw.updatedBy || 'System';
  const tlc = raw.tlc || raw.TLC || raw.tlc_value || '-';
  const rawStuck = String(raw.stuck ?? raw.Stuck ?? '0').trim() || '0';
  const stuck = normalizeStuckCategory(rawStuck);

  return {
    waybill,
    tanggal,
    outlet,
    stuck,
    tlc: String(tlc || '-').trim() || '-',
    status,
    aksi: String(aksi || '-').trim() || '-',
    nama_barang: String(namaBarang || '-').trim() || '-',
    updated_by: String(updatedBy || 'System').trim() || 'System',
  };
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeMonitoringDate(value) {
  if (!value) return getTodayDateString();

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const raw = String(value || '').trim();
  if (!raw || raw === '-' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined' || raw.toLowerCase() === 'n/a') {
    return getTodayDateString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const toSqlDate = (year, month, day) => {
    const y = Number(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    if (Number.isNaN(y) || Number.isNaN(Number(month)) || Number.isNaN(Number(day))) return getTodayDateString();
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return getTodayDateString();
    return `${y}-${m}-${d}`;
  };

  const datePart = raw.includes('T') ? raw.split('T')[0] : raw.split(' ')[0];
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return toSqlDate(year, month, day);
  }
  const slashParts = datePart.split('/');
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    const [day, month, year] = slashParts;
    return toSqlDate(year, month, day);
  }
  if (slashParts.length === 3 && slashParts[0].length === 4) {
    const [year, month, day] = slashParts;
    return toSqlDate(year, month, day);
  }
  const dotParts = datePart.split('.');
  if (dotParts.length === 3 && dotParts[2].length === 4) {
    const [day, month, year] = dotParts;
    return toSqlDate(year, month, day);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return getTodayDateString();
}

function formatStuckByHours(hours) {
  const h = Math.round(Number(hours));
  if (h <= 11) return `${h} Jam (1-12)`;
  if (h <= 23) return `${h} Jam (12-24)`;
  if (h <= 35) return `${h} Jam (24-36)`;
  if (h <= 47) return `${h} Jam (36-48)`;
  if (h <= 59) return `${h} Jam (48-60)`;
  if (h <= 71) return `${h} Jam (60-72)`;
  return `${h} Jam (72 UP)`;
}

function normalizeStuckCategory(value) {
  if (value === null || value === undefined) return '0 Jam (1-12)';

  const rawStr = String(value).trim();
  if (!rawStr) return '0 Jam (1-12)';

  const normalized = rawStr.toLowerCase().replace(/\s+/g, ' ');

  // 1. Dukungan format teks lama dan baru dengan penomoran (1. 1-12 Jam, 4. 36-48 Jam, dsb)
  if (/^(?:1\.\s*)?(?:12\s*jam$|1-12)/.test(normalized)) return '12 Jam (1-12)';
  if (/^(?:2\.\s*)?(?:12\s*jam\s*-\s*24\s*jam|12-24)/.test(normalized)) return '24 Jam (12-24)';
  if (/^(?:3\.\s*)?(?:24\s*jam\s*-\s*36\s*jam|24-36)/.test(normalized)) return '36 Jam (24-36)';
  if (/^(?:4\.\s*)?(?:36\s*jam\s*-\s*48\s*jam|36-48)/.test(normalized)) return '48 Jam (36-48)';
  if (/^(?:5\.\s*)?(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '60 Jam (48-60)';
  if (/^(?:6\.\s*)?(?:(?:48|60)\s*jam\s*-\s*72\s*jam|(?:48-72|60-72))/.test(normalized)) return '72 Jam (60-72)';
  if (/^(?:7\.\s*)?(?:72(?:\s*jam)?\s*(?:up|\+)|72-up)/.test(normalized)) return '72 Jam (72 UP)';

  // Dukungan teks format lama tanpa penomoran
  if (/^36\s*jam\s*-\s*48\s*jam$/.test(normalized)) return '48 Jam (36-48)';
  if (/^48\s*jam\s*-\s*60\s*jam$/.test(normalized)) return '60 Jam (48-60)';
  if (/^(?:48|60)\s*jam\s*-\s*72\s*jam$/.test(normalized)) return '72 Jam (60-72)';
  if (/^72(?:\s*jam)?\s*(?:up|\+)$/.test(normalized)) return '72 Jam (72 UP)';
  if (/^12\s*jam\s*-\s*24\s*jam$/.test(normalized)) return '24 Jam (12-24)';
  if (/^24\s*jam\s*-\s*36\s*jam$/.test(normalized)) return '36 Jam (24-36)';
  if (/^12\s*jam$/.test(normalized)) return '12 Jam (1-12)';

  // Backward compatibility jika ada data lama berformat "4. 48-60" sebelum 36-48 dipisah
  if (/^4\.\s*(?:48\s*jam\s*-\s*60\s*jam|48-60)/.test(normalized)) return '60 Jam (48-60)';

  // 2. Input jam numerik (e.g. 5, 14, 45, 45 Jam, 45h, 45 Jam (48-60))
  // Cegah mencocokkan range seperti "48-72" sebagai single number 48
  if (!/^\d+\s*-\s*\d+/.test(rawStr)) {
    const numMatch = rawStr.match(/^(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const hours = parseFloat(numMatch[1]);
      return formatStuckByHours(hours);
    }
  }

  return rawStr;
}

async function archiveMonitoringRecord(record, source = 'archive', client = null) {
  if (!record || !record.waybill) return;

  const dbClient = client || db;
  await dbClient.query(
    `INSERT INTO monitoring_history
      (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.waybill,
      normalizeMonitoringDate(record.tanggal),
      record.outlet || '-',
      String(record.stuck || '0 Jam (1-12)').trim() || '0 Jam (1-12)',
      record.tlc || '-',
      record.status || 'Pending',
      record.aksi || '-',
      record.nama_barang || '-',
      record.updated_by || 'System',
      source,
    ]
  );
}

async function getAllMonitoring() {
  const [rows] = await db.query('SELECT * FROM monitoring_stuck ORDER BY tanggal DESC, created_at DESC');
  return rows;
}

async function getAllMonitoringHistory() {
  const [rows] = await db.query('SELECT * FROM monitoring_history ORDER BY archived_at DESC');
  return rows;
}

async function getAllMonitoringArchive() {
  const [rows] = await db.query('SELECT * FROM monitoring_archive ORDER BY archived_at DESC');
  return rows;
}

async function archiveMonitoring(waybills) {
  let archivedCount = 0;

  for (const waybill of waybills) {
    const [rows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ?', [waybill]);
    const record = rows[0];
    if (!record) continue;
    await db.query(
      `INSERT INTO monitoring_archive
       (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tanggal = VALUES(tanggal), outlet = VALUES(outlet), stuck = VALUES(stuck),
       tlc = VALUES(tlc), status = VALUES(status), aksi = VALUES(aksi), nama_barang = VALUES(nama_barang),
       updated_by = VALUES(updated_by), archived_at = CURRENT_TIMESTAMP`,
      [record.waybill, record.tanggal, record.outlet, record.stuck, record.tlc, record.status, record.aksi, record.nama_barang, record.updated_by]
    );
    await db.query('DELETE FROM monitoring_stuck WHERE waybill = ?', [waybill]);
    archivedCount += 1;
  }
  return { archivedCount };
}

async function restoreMonitoring(waybills) {
  let restoredCount = 0;

  for (const waybill of waybills) {
    const [rows] = await db.query('SELECT * FROM monitoring_archive WHERE waybill = ?', [waybill]);
    const record = rows[0];
    if (!record) continue;
    await db.query(
      `INSERT INTO monitoring_stuck
       (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tanggal = VALUES(tanggal), outlet = VALUES(outlet), stuck = VALUES(stuck),
       tlc = VALUES(tlc), status = VALUES(status), aksi = VALUES(aksi), nama_barang = VALUES(nama_barang), updated_by = VALUES(updated_by)`,
      [record.waybill, record.tanggal, record.outlet, record.stuck, record.tlc, record.status, record.aksi, record.nama_barang, record.updated_by]
    );
    await db.query('DELETE FROM monitoring_archive WHERE waybill = ?', [waybill]);
    restoredCount += 1;
  }
  return { restoredCount };
}

async function restoreMonitoringUpdate(waybills, actor = null) {
  const list = Array.isArray(waybills) ? waybills.filter(Boolean) : [waybills].filter(Boolean);
  if (!list.length) return { restoredCount: 0, waybills: [] };

  const actorName = actor
    ? (actor.role === 'super_admin' ? 'System' : `${actor.username || actor.full_name || 'User'} (${actor.role || 'user'})`)
    : 'System';

  let restoredCount = 0;
  for (const waybill of list) {
    const [result] = await db.query(
      `UPDATE monitoring_stuck
       SET aksi = '-', status = 'Pending', updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE waybill = ?`,
      [actorName, waybill]
    );
    if (result.affectedRows > 0) {
      restoredCount += 1;
    }
  }

  if (actor && restoredCount > 0) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'restore_monitoring_update',
      entityType: 'monitoring',
      entityId: list.length === 1 ? String(list[0]) : 'BULK_RESTORE',
      details: {
        restoredCount,
        waybills: list.slice(0, 50),
        newStatus: 'Pending',
        newAksi: '-',
        restoredBy: actorName,
        actorRole: actor.role,
      },
    });
  }

  return { restoredCount, waybills: list };
}

async function updateMonitoringArchive(waybillParam, payload, actor = null) {
  const normalized = normalizeMonitoringRow({ ...payload, waybill: waybillParam });
  if (!normalized) return { success: false };
  const actorName = actor ? (actor.role === 'super_admin' ? 'System' : `${actor.username || actor.full_name || 'User'} (${actor.role || 'user'})`) : 'System';
  const [result] = await db.query(
    `UPDATE monitoring_archive SET tanggal = ?, outlet = ?, stuck = ?, tlc = ?, status = ?, aksi = ?, nama_barang = ?, updated_by = ? WHERE waybill = ?`,
    [normalized.tanggal || null, normalized.outlet || '-', normalized.stuck, normalized.tlc || '-', normalized.status || 'Pending', normalized.aksi || '-', normalized.nama_barang || '-', actorName, waybillParam]
  );
  return { success: result.affectedRows > 0 };
}

async function deleteAllMonitoringHistory(actor = null) {
  const connection = await db.getConnection();
  let deletedCount = 0;

  try {
    await connection.beginTransaction();
    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM monitoring_history');
    deletedCount = Number(countRows[0]?.total || 0);
    await connection.query('DELETE FROM monitoring_history');

    const [remainingRows] = await connection.query('SELECT COUNT(*) AS total FROM monitoring_history');
    if (Number(remainingRows[0]?.total || 0) !== 0) {
      throw new Error('History monitoring masih tersisa setelah penghapusan');
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'bulk_delete_history',
      entityType: 'monitoring_history',
      entityId: 'ALL',
      details: { deletedCount, actorRole: actor.role },
    });
  }

  return { deletedCount };
}

async function createMonitoring(payload, actor = null) {
  const normalized = normalizeMonitoringRow(payload);
  if (!normalized) {
    throw new Error('Data monitoring tidak valid');
  }

  const [result] = await db.query(
    `INSERT INTO monitoring_stuck
     (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       tanggal = VALUES(tanggal),
       outlet = VALUES(outlet),
       stuck = VALUES(stuck),
       tlc = VALUES(tlc),
       status = VALUES(status),
       aksi = VALUES(aksi),
       nama_barang = VALUES(nama_barang),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
    [
      normalized.waybill,
      normalized.tanggal || null,
      normalized.outlet || '-',
      normalized.stuck || 0,
      normalized.tlc || '-',
      normalized.status || 'Pending',
      normalized.aksi || '-',
      normalized.nama_barang || '-',
      normalized.updated_by || 'System',
    ]
  );

  if (actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'create',
      entityType: 'monitoring',
      entityId: normalized.waybill,
      details: {
        waybill: normalized.waybill,
        tanggal: normalized.tanggal,
        outlet: normalized.outlet,
        status: normalized.status,
        updated_by: normalized.updated_by,
        actorRole: actor.role,
      },
    });
  }

  return { insertedId: result.insertId || normalized.waybill };
}

async function updateMonitoring(waybillParam, payload, actor = null) {
  const [existingRows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ?', [waybillParam]);
  const before = existingRows[0] || null;

  const actorName = actor
    ? (actor.role === 'super_admin' ? 'System' : `${actor.username || actor.full_name || 'User'} (${actor.role || 'user'})`)
    : 'System';
  const normalized = normalizeMonitoringRow({ ...payload, waybill: waybillParam });
  if (!normalized) {
    throw new Error('Data monitoring tidak valid');
  }
  const beforeAksi = String(before?.aksi || '').trim();
  const newAksi = String(normalized.aksi || '-').trim();
  const aksiChanged = beforeAksi !== newAksi;

  const finalStatus = (newAksi && newAksi !== '-' && newAksi !== '')
    ? 'Sudah Diupdate'
    : (normalized.status || before?.status || 'Pending');

  const preservedTanggal = (before && before.tanggal)
    ? (before.tanggal instanceof Date
      ? `${before.tanggal.getFullYear()}-${String(before.tanggal.getMonth() + 1).padStart(2, '0')}-${String(before.tanggal.getDate()).padStart(2, '0')}`
      : String(before.tanggal).split('T')[0].split(' ')[0])
    : (normalized.tanggal || null);

  const [result] = await db.query(
    `UPDATE monitoring_stuck
     SET tanggal = ?, outlet = ?, stuck = ?, tlc = ?, status = ?, aksi = ?, nama_barang = ?, updated_by = ?
     WHERE waybill = ?`,
    [
      preservedTanggal,
      normalized.outlet || before?.outlet || '-',
      normalized.stuck || before?.stuck || '0',
      normalized.tlc || before?.tlc || '-',
      finalStatus,
      newAksi || '-',
      normalized.nama_barang || before?.nama_barang || '-',
      actorName,
      waybillParam,
    ]
  );
  const recordExists = Boolean(before);

  if (result.affectedRows > 0 && before && aksiChanged && beforeAksi !== '-' && beforeAksi !== '') {
    await archiveMonitoringRecord({ ...before, source: 'updated_before_replacement' }, 'history');
  }

  if (recordExists && actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'update',
      entityType: 'monitoring',
      entityId: waybillParam,
      details: {
        before,
        after: {
          waybill: waybillParam,
          tanggal: normalized.tanggal,
          outlet: normalized.outlet,
          stuck: normalized.stuck,
          tlc: normalized.tlc,
          status: normalized.status,
          aksi: normalized.aksi,
          nama_barang: normalized.nama_barang,
          updated_by: normalized.updated_by,
        },
        actorRole: actor.role,
      },
    });
  }

  return { success: recordExists };
}

async function bulkUpdateMonitoring(waybills, aksi, actor = null) {
  const normalizedAksi = String(aksi || '').trim();
  if (!normalizedAksi || normalizedAksi === '-') {
    throw new Error('Aksi bulk update wajib diisi dan tidak boleh "-".');
  }

  let updatedCount = 0;

  for (const waybill of waybills) {
    const [rows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ?', [waybill]);
    const current = rows[0];
    if (!current) continue;

    const preservedTanggal = current.tanggal instanceof Date
      ? `${current.tanggal.getFullYear()}-${String(current.tanggal.getMonth() + 1).padStart(2, '0')}-${String(current.tanggal.getDate()).padStart(2, '0')}`
      : String(current.tanggal || '').split('T')[0].split(' ')[0];

    const result = await updateMonitoring(waybill, {
      ...current,
      tanggal: preservedTanggal,
      aksi: normalizedAksi,
      status: 'Sudah Diupdate',
    }, actor);
    if (result.success) updatedCount += 1;
  }

  if (actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'bulk_update',
      entityType: 'monitoring',
      entityId: 'BULK_UPDATE',
      details: { updatedCount, aksi, actorRole: actor.role },
    });
  }

  return { updatedCount };
}

async function deleteMonitoring(waybillParam, actor = null) {
  const [existingRows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ?', [waybillParam]);
  const existing = existingRows[0] || null;
  const [result] = await db.query('DELETE FROM monitoring_stuck WHERE waybill = ?', [waybillParam]);

  if (result.affectedRows > 0 && existing) {
    await archiveMonitoringRecord(existing, 'deleted');
  }

  if (result.affectedRows > 0 && actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'delete',
      entityType: 'monitoring',
      entityId: waybillParam,
      details: {
        deletedRecord: existing,
        actorRole: actor.role,
      },
    });
  }

  return { success: result.affectedRows > 0 };
}

async function bulkDeleteMonitoring(waybills, actor = null) {
  const list = Array.isArray(waybills)
    ? Array.from(new Set(waybills.map((w) => String(w || '').trim()).filter(Boolean)))
    : [];

  if (!list.length) {
    return { deletedCount: 0, waybills: [] };
  }

  const connection = await db.getConnection();
  let deletedCount = 0;

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      'SELECT * FROM monitoring_stuck WHERE waybill IN (?)',
      [list]
    );

    for (const record of existingRows) {
      await archiveMonitoringRecord(record, 'deleted_selected', connection);
    }

    const [result] = await connection.query(
      'DELETE FROM monitoring_stuck WHERE waybill IN (?)',
      [list]
    );
    deletedCount = result.affectedRows || 0;

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (actor && deletedCount > 0) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'bulk_delete_selected',
      entityType: 'monitoring',
      entityId: list.length === 1 ? String(list[0]) : 'BULK_DELETE_SELECTED',
      details: {
        deletedCount,
        waybills: list.slice(0, 100),
        actorRole: actor.role,
      },
    });
  }

  return { deletedCount, waybills: list };
}

async function deleteAllMonitoring(actor = null) {
  const connection = await db.getConnection();
  let deletedCount = 0;

  try {
    await connection.beginTransaction();
    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM monitoring_stuck');
    deletedCount = Number(countRows[0]?.total || 0);
    await connection.query('DELETE FROM monitoring_stuck');

    const [remainingRows] = await connection.query('SELECT COUNT(*) AS total FROM monitoring_stuck');
    if (Number(remainingRows[0]?.total || 0) !== 0) {
      throw new Error('Data monitoring masih tersisa setelah penghapusan global');
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (actor) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'bulk_delete_all',
      entityType: 'monitoring',
      entityId: 'ALL',
      details: {
        deletedCount,
        permanent: true,
        actorRole: actor.role,
      },
    });
  }

  return { deletedCount };
}

async function bulkImportMonitoring(rows, actor = null) {
  const normalizedRows = [];
  const seen = new Map();

  for (const row of rows || []) {
    const normalized = normalizeMonitoringRow(row);
    if (!normalized) continue;
    if (!seen.has(normalized.waybill)) {
      seen.set(normalized.waybill, normalized);
      normalizedRows.push(normalized);
    }
  }

  const connection = await db.getConnection();
  let importedCount = 0;
  let deletedCount = 0;
  let overwrittenCount = 0;
  let historyCount = 0;
  let skippedCount = 0;
  let importRows = [];

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT * FROM monitoring_stuck');
    const [historyRows] = await connection.query('SELECT waybill FROM monitoring_history');
    const historyWaybills = new Set(historyRows.map((row) => String(row.waybill)));

    // Resi yang sudah pernah diupdate/diproses di hari-hari sebelumnya dan sudah masuk ke tabel History
    // dianggap sudah beres, sehingga dilewati (skip) agar tidak perlu discan ulang oleh operator.
    skippedCount = normalizedRows.filter((row) => historyWaybills.has(row.waybill)).length + Math.max(0, rows.length - normalizedRows.length);
    importRows = normalizedRows.filter((row) => !historyWaybills.has(row.waybill));
    const incomingWaybills = new Set(importRows.map((row) => row.waybill));

    const toArchive = [];
    const toDelete = [];

    for (const existing of existingRows) {
      const oldAksi = String(existing.aksi || '').trim();
      const oldStatus = String(existing.status || 'Pending').trim().toLowerCase();
      const isUpdated = (oldAksi && oldAksi !== '-') || oldStatus === 'sudah diupdate' || oldStatus === 'sudah scan kirim';

      if (isUpdated) {
        // SEMUA data yang berstatus 'Sudah Diupdate' / sudah ada aksi WAJIB masuk ke History!
        const source = incomingWaybills.has(existing.waybill) ? 'import_replace' : 'import_resolved';
        toArchive.push({ ...existing, source });
        historyCount += 1;

        // Jika resi ini sudah TIDAK ADA di file CSV baru (paket sudah beres/selesai keluar dari stuck),
        // hapus dari tabel monitoring aktif
        if (!incomingWaybills.has(existing.waybill)) {
          toDelete.push(existing.waybill);
        }
      } else {
        // Data yang BELUM diupdate (masih Pending dan aksi '-'):
        if (!incomingWaybills.has(existing.waybill)) {
          // Data lama yang belum pernah diupdate dan hilang dari laporan baru dihapus permanen
          toDelete.push(existing.waybill);
          deletedCount += 1;
        } else {
          // Masih ada di file baru -> ditimpa
          overwrittenCount += 1;
        }
      }
    }

    const CHUNK_SIZE = 500;

    // 1. Batch archive ke monitoring_history (chunks of 500)
    for (let i = 0; i < toArchive.length; i += CHUNK_SIZE) {
      const chunk = toArchive.slice(i, i + CHUNK_SIZE);
      const values = chunk.map((r) => [
        r.waybill,
        normalizeMonitoringDate(r.tanggal),
        r.outlet || '-',
        String(r.stuck || '0 Jam (1-12)').trim() || '0 Jam (1-12)',
        r.tlc || '-',
        r.status || 'Pending',
        r.aksi || '-',
        r.nama_barang || '-',
        r.updated_by || 'System',
        r.source || 'system',
      ]);
      await connection.query(
        `INSERT INTO monitoring_history
          (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by, source)
         VALUES ?`,
        [values]
      );
    }

    // 2. Batch delete dari monitoring_stuck (chunks of 500)
    for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
      const chunk = toDelete.slice(i, i + CHUNK_SIZE);
      await connection.query(
        'DELETE FROM monitoring_stuck WHERE waybill IN (?)',
        [chunk]
      );
    }

    // 3. Batch insert / upsert ke monitoring_stuck (chunks of 500)
    for (let i = 0; i < importRows.length; i += CHUNK_SIZE) {
      const chunk = importRows.slice(i, i + CHUNK_SIZE);
      const values = chunk.map((item) => [
        item.waybill,
        normalizeMonitoringDate(item.tanggal),
        item.outlet || '-',
        item.stuck || '0 Jam (1-12)',
        item.tlc || '-',
        item.status || 'Pending',
        item.aksi || '-',
        item.nama_barang || '-',
        item.updated_by || 'System',
      ]);
      await connection.query(
        `INSERT INTO monitoring_stuck
         (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           tanggal = VALUES(tanggal),
           outlet = VALUES(outlet),
           stuck = VALUES(stuck),
           tlc = VALUES(tlc),
           status = VALUES(status),
           aksi = VALUES(aksi),
           nama_barang = VALUES(nama_barang),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
        [values]
      );
      importedCount += chunk.length;
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (actor) {
    try {
      await auditService.logAudit({
        userId: actor.id,
        username: actor.username,
        action: 'bulk_import',
        entityType: 'monitoring',
        entityId: 'BULK_IMPORT',
        details: {
          importedCount,
          rows: importRows.length,
          actorRole: actor.role,
          skippedCount,
          overwrittenCount,
          deletedCount,
          historyCount,
        },
      });
    } catch (auditErr) {
      console.error('bulkImportMonitoring audit log warning:', auditErr.message);
    }
  }

  return { importedCount, rows: importRows.length, skippedCount, overwrittenCount, deletedCount, historyCount };
}

module.exports = {
  getAllMonitoring,
  getAllMonitoringHistory,
  getAllMonitoringArchive,
  archiveMonitoring,
  restoreMonitoring,
  restoreMonitoringUpdate,
  updateMonitoringArchive,
  deleteAllMonitoringHistory,
  createMonitoring,
  updateMonitoring,
  bulkUpdateMonitoring,
  deleteMonitoring,
  bulkDeleteMonitoring,
  deleteAllMonitoring,
  bulkImportMonitoring,
  initMonitoringTables,
  normalizeStuckCategory,
  formatStuckByHours,
};
