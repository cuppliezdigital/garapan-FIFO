const db = require('../config/db');
const auditService = require('./auditService');

async function ensureMonitoringTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_stuck (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL UNIQUE,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang VARCHAR(200),
      updated_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [columns] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitoring_stuck'`
  );
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));
  const alterations = [];

  if (!existing.has('updated_at')) {
    alterations.push('ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  }
  if (!existing.has('aksi')) {
    alterations.push('ADD COLUMN aksi VARCHAR(150)');
  }
  if (!existing.has('nama_barang')) {
    alterations.push('ADD COLUMN nama_barang VARCHAR(200)');
  }
  if (!existing.has('updated_by')) {
    alterations.push('ADD COLUMN updated_by VARCHAR(100)');
  }
  if (existing.has('stuck')) {
    alterations.push("MODIFY COLUMN stuck VARCHAR(100) DEFAULT '0'");
  }

  if (alterations.length) {
    await db.query(`ALTER TABLE monitoring_stuck ${alterations.join(', ')}`);
  }
}

async function ensureMonitoringHistoryTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang VARCHAR(200),
      updated_by VARCHAR(100),
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source VARCHAR(50) DEFAULT 'system'
    )
  `);

  const [columns] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'monitoring_history'`
  );
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));
  const alterations = [];

  if (!existing.has('aksi')) {
    alterations.push('ADD COLUMN aksi VARCHAR(150)');
  }
  if (!existing.has('nama_barang')) {
    alterations.push('ADD COLUMN nama_barang VARCHAR(200)');
  }
  if (!existing.has('updated_by')) {
    alterations.push('ADD COLUMN updated_by VARCHAR(100)');
  }
  if (!existing.has('source')) {
    alterations.push('ADD COLUMN source VARCHAR(50) DEFAULT "system"');
  }
  if (existing.has('stuck')) {
    alterations.push("MODIFY COLUMN stuck VARCHAR(100) DEFAULT '0'");
  }

  if (alterations.length) {
    await db.query(`ALTER TABLE monitoring_history ${alterations.join(', ')}`);
  }
}

async function ensureMonitoringArchiveTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS monitoring_archive (
      id INT AUTO_INCREMENT PRIMARY KEY,
      waybill VARCHAR(150) NOT NULL UNIQUE,
      tanggal DATE,
      outlet VARCHAR(150),
      stuck VARCHAR(100) DEFAULT '0',
      tlc VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Pending',
      aksi VARCHAR(150),
      nama_barang VARCHAR(200),
      updated_by VARCHAR(100),
      archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
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

function normalizeMonitoringDate(value) {
  if (!value) return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const toSqlDate = (year, month, day) => {
    const y = Number(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
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
  return datePart;
}

function normalizeStuckCategory(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (/^(?:4\.\s*)?48\s*jam\s*-\s*60\s*jam$/.test(normalized)) {
    return '4. 48 Jam - 60 Jam';
  }
  if (/^(?:5\.\s*)?48\s*jam\s*-\s*72\s*jam$/.test(normalized)) {
    return '5. 48 Jam - 72 Jam';
  }
  if (/^(?:6\.\s*)?72(?:\s*jam)?\s*(?:up|\+)$/.test(normalized)) {
    return '6. 72 Jam UP';
  }

  return String(value || '0').trim() || '0';
}

async function archiveMonitoringRecord(record, source = 'archive', client = null) {
  if (!record || !record.waybill) return;

  const dbClient = client || db;
  await dbClient.query(
    `INSERT INTO monitoring_history
      (waybill, tanggal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       tanggal = VALUES(tanggal),
       outlet = VALUES(outlet),
       stuck = VALUES(stuck),
       tlc = VALUES(tlc),
       status = VALUES(status),
       aksi = VALUES(aksi),
       nama_barang = VALUES(nama_barang),
       updated_by = VALUES(updated_by),
       source = VALUES(source),
       archived_at = CURRENT_TIMESTAMP`,
    [
      record.waybill,
      record.tanggal || null,
      record.outlet || '-',
      String(record.stuck || '0').trim() || '0',
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
    skippedCount = normalizedRows.filter((row) => historyWaybills.has(row.waybill)).length;
    importRows = normalizedRows.filter((row) => !historyWaybills.has(row.waybill));
    const incomingWaybills = new Set(importRows.map((row) => row.waybill));

    for (const existing of existingRows) {
      const oldAksi = String(existing.aksi || '').trim();
      const oldStatus = String(existing.status || 'Pending').trim().toLowerCase();
      const isUpdated = (oldAksi && oldAksi !== '-') || oldStatus === 'sudah diupdate' || oldStatus === 'sudah scan kirim';

      if (historyWaybills.has(String(existing.waybill)) && isUpdated) {
        await connection.query('DELETE FROM monitoring_stuck WHERE waybill = ?', [existing.waybill]);
        continue;
      }

      if (!incomingWaybills.has(existing.waybill) && !historyWaybills.has(String(existing.waybill))) {
        await connection.query('DELETE FROM monitoring_stuck WHERE waybill = ?', [existing.waybill]);
        deletedCount += 1;
        continue;
      }

      if (isUpdated && incomingWaybills.has(existing.waybill)) {
        await archiveMonitoringRecord(existing, 'import_replace', connection);
        historyCount += 1;
      } else if (incomingWaybills.has(existing.waybill)) {
        overwrittenCount += 1;
      }
    }

    for (const item of importRows) {
      const [result] = await connection.query(
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
          item.waybill,
          item.tanggal || null,
          item.outlet || '-',
          item.stuck || 0,
          item.tlc || '-',
          item.status || 'Pending',
          item.aksi || '-',
          item.nama_barang || '-',
          item.updated_by || 'System',
        ]
      );

      importedCount += result.affectedRows || 1;
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
  deleteAllMonitoring,
  bulkImportMonitoring,
  initMonitoringTables,
};
