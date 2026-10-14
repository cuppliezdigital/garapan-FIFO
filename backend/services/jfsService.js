const https = require('https');
const db = require('../config/db');
const monitoringService = require('./monitoringService');

let syncIntervalTimer = null;
let isSyncInProgress = false;

function formatStuckByHours(hours) {
  const h = Math.max(0, Math.round(Number(hours) || 0));
  if (h <= 11) return `${h} Jam (1-12)`;
  if (h <= 23) return `${h} Jam (12-24)`;
  if (h <= 35) return `${h} Jam (24-36)`;
  if (h <= 47) return `${h} Jam (36-48)`;
  if (h <= 59) return `${h} Jam (48-60)`;
  if (h <= 71) return `${h} Jam (60-72)`;
  return `${h} Jam (72 UP)`;
}

function getFormattedDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function ensureJfsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS jfs_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      config_key VARCHAR(100) NOT NULL UNIQUE,
      config_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS jfs_sync_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trigger_type VARCHAR(50) DEFAULT 'auto',
      status VARCHAR(50) DEFAULT 'success',
      total_fetched INT DEFAULT 0,
      imported_count INT DEFAULT 0,
      archived_count INT DEFAULT 0,
      deleted_count INT DEFAULT 0,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const ACTIVE_DEFAULT_TOKEN = '83ae01d5865048e08a006eba7c53a6a1';
  const initialToken = process.env.JFS_AUTH_TOKEN || ACTIVE_DEFAULT_TOKEN;

  const defaultConfigs = [
    { key: 'authtoken', value: initialToken },
    { key: 'scan_site_code', value: 'JKT99A' },
    { key: 'scan_site_code_name', value: 'GW-Jakarta' },
    { key: 'auto_sync_enabled', value: 'true' },
    { key: 'sync_interval_minutes', value: '5' },
    { key: 'last_sync_time', value: null },
    { key: 'last_sync_status', value: 'idle' },
    { key: 'last_sync_message', value: 'Sistem siap untuk sinkronisasi JFS' },
    { key: 'last_sync_count', value: '0' },
  ];

  for (const item of defaultConfigs) {
    await db.query(
      `INSERT INTO jfs_config (config_key, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_key = config_key`,
      [item.key, item.value]
    );
  }

  // Otomatis upgrade jika token di database masih token lama yang sudah expired
  await db.query(
    `UPDATE jfs_config
     SET config_value = ?
     WHERE config_key = 'authtoken' AND (config_value = '5e5f58c243c645b89385c6806310474c' OR config_value IS NULL OR config_value = '')`,
    [initialToken]
  );
}

async function getConfig() {
  await ensureJfsTables();
  const [rows] = await db.query('SELECT config_key, config_value FROM jfs_config');
  const map = {};
  for (const r of rows) {
    map[r.config_key] = r.config_value;
  }
  const ACTIVE_DEFAULT_TOKEN = '83ae01d5865048e08a006eba7c53a6a1';
  const defaultToken = process.env.JFS_AUTH_TOKEN || ACTIVE_DEFAULT_TOKEN;
  let currentToken = map.authtoken || defaultToken;
  if (currentToken === '5e5f58c243c645b89385c6806310474c' || !currentToken) {
    currentToken = defaultToken;
  }
  return {
    authtoken: currentToken,
    scanSiteCode: map.scan_site_code || 'JKT99A',
    scanSiteCodeName: map.scan_site_code_name || 'GW-Jakarta',
    autoSyncEnabled: map.auto_sync_enabled === 'true' || map.auto_sync_enabled === '1',
    syncIntervalMinutes: Math.max(1, parseInt(map.sync_interval_minutes || '5', 10)),
    lastSyncTime: map.last_sync_time || null,
    lastSyncStatus: map.last_sync_status || 'idle',
    lastSyncMessage: map.last_sync_message || 'Belum ada riwayat sinkronisasi',
    lastSyncCount: parseInt(map.last_sync_count || '0', 10),
  };
}

async function setConfigValue(key, value) {
  await db.query(
    `INSERT INTO jfs_config (config_key, config_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
    [key, String(value ?? '')]
  );
}

async function updateConfig(newConfig = {}) {
  await ensureJfsTables();
  if (newConfig.authtoken !== undefined) {
    const cleanToken = newConfig.authtoken.trim();
    await setConfigValue('authtoken', cleanToken);
    await setConfigValue('pto_authtoken', cleanToken);
  }
  if (newConfig.scanSiteCode !== undefined) {
    await setConfigValue('scan_site_code', newConfig.scanSiteCode.trim().toUpperCase());
  }
  if (newConfig.scanSiteCodeName !== undefined) {
    await setConfigValue('scan_site_code_name', newConfig.scanSiteCodeName.trim());
  }
  if (newConfig.autoSyncEnabled !== undefined) {
    await setConfigValue('auto_sync_enabled', newConfig.autoSyncEnabled ? 'true' : 'false');
  }
  if (newConfig.syncIntervalMinutes !== undefined) {
    const mins = Math.max(1, Math.min(1440, parseInt(newConfig.syncIntervalMinutes, 10) || 5));
    await setConfigValue('sync_interval_minutes', mins);
  }

  // Restart scheduler with new config
  restartScheduler();
  return getConfig();
}

function requestJfsApi(token, payload, sqlCode = 'realtime_inv_man_dtl', customRoute = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const route = customRoute || (sqlCode === 'realtime_sca_cen_flo_sum' || sqlCode === 'realtime_sca_cen_flo_dtl'
      ? 'Bd-theme-12f31774-6788-4f80-bd84-ad623f38c693|businessIndicatorIndex'
      : 'Bd-theme-4d718ae8-fa85-4edc-b98c-1a0f75e5f9f3|businessIndicatorIndex');

    const options = {
      hostname: 'jfsgw.jtcargo.co.id',
      port: 443,
      path: `/jfs-report-leader/report/dynamicReport/findByPagination?sqlCode=${encodeURIComponent(sqlCode)}&dcr_key=57b048fb-bc8c-4d24-982b-a750b7ce8693`,
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authtoken': token,
        'content-type': 'application/json;charset=UTF-8',
        'lang': 'ID',
        'langtype': 'ID',
        'origin': 'https://jfs.jtcargo.co.id',
        'referer': 'https://jfs.jtcargo.co.id/',
        'routename': route,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401) {
          return reject(new Error('Token JFS tidak valid atau telah kedaluwarsa (HTTP 401). Silakan perbarui JFS Auth Token.'));
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Server JFS mengembalikan status HTTP ${res.statusCode}`));
        }
        try {
          const json = JSON.parse(rawData);
          if (json.succ === false || json.fail === true) {
            return reject(new Error(json.msg || 'Gagal mengambil data dari API JFS'));
          }
          resolve(json);
        } catch (parseErr) {
          reject(new Error(`Gagal membaca respon JFS: ${parseErr.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Koneksi ke server JFS gagal: ${err.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy(new Error('Request ke server JFS timeout (30 detik)'));
    });

    req.write(postData);
    req.end();
  });
}

async function testJfsConnection(authTokenParam = null, scanSiteCodeParam = null) {
  const cfg = await getConfig();
  const token = authTokenParam || cfg.authtoken;
  const siteCode = scanSiteCodeParam || cfg.scanSiteCode;

  const now = new Date();
  const endDate = `${getFormattedDate(now)} 23:59:59`;
  const past = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const beginDate = `${getFormattedDate(past)} 00:00:00`;

  const payload = {
    beginDate,
    endDate,
    scanSiteCode: siteCode,
    queryFlag: '2',
    billCode: '',
    scanSiteCodeName: cfg.scanSiteCodeName || 'GW-Jakarta',
    isOverDate: '',
    operateSiteType: 'all',
    expressTypeCode: '',
    codNeed: '',
    invOverTm: '',
    shipHour: '',
    customerCode: '',
    isRefund: '',
    sqlCode: 'realtime_inv_man_dtl',
    current: 1,
    size: 2,
    convertResultFromDictionCode: 'is_receiver_pay|124,isProblemPiece|124,cod_need|124,is_refund|124',
    convertResultFromDictionOriCode: '',
    paginationSearchType: 'list',
    countryId: '1',
  };

  const response = await requestJfsApi(token, payload);
  const count = response?.data?.records?.length || 0;
  return {
    success: true,
    message: `Koneksi JFS Terhubung! Berhasil membaca respon dari Gateway ${siteCode}.`,
    sampleCount: count,
  };
}

async function fetchAllJfsWaybills() {
  const cfg = await getConfig();
  const token = cfg.authtoken;
  const siteCode = cfg.scanSiteCode;
  const siteName = cfg.scanSiteCodeName;

  const now = new Date();
  const endDate = `${getFormattedDate(now)} 23:59:59`;
  const past = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const beginDate = `${getFormattedDate(past)} 00:00:00`;

  const PAGE_SIZE = 1000;
  let currentPage = 1;
  const allRecords = [];
  const maxPages = 50; // Safety cap (up to 50,000 waybills)

  while (currentPage <= maxPages) {
    const payload = {
      beginDate,
      endDate,
      scanSiteCode: siteCode,
      queryFlag: '2',
      billCode: '',
      scanSiteCodeName: siteName,
      isOverDate: '',
      operateSiteType: 'all',
      expressTypeCode: '',
      codNeed: '',
      invOverTm: '',
      shipHour: '',
      customerCode: '',
      isRefund: '',
      sqlCode: 'realtime_inv_man_dtl',
      current: currentPage,
      size: PAGE_SIZE,
      convertResultFromDictionCode: 'is_receiver_pay|124,isProblemPiece|124,cod_need|124,is_refund|124',
      convertResultFromDictionOriCode: '',
      paginationSearchType: 'list',
      countryId: '1',
    };

    const result = await requestJfsApi(token, payload);
    const records = result?.data?.records || [];
    if (!records.length) {
      break;
    }

    allRecords.push(...records);

    // If fetched less than PAGE_SIZE, we reached the end
    if (records.length < PAGE_SIZE) {
      break;
    }

    currentPage += 1;
  }

  // Map to FIFO format
  const todayStr = getFormattedDate(now);
  const normalizedRows = [];

  for (const r of allRecords) {
    const waybill = String(r.billcode || '').trim();
    if (!waybill) continue;

    const rawTime = r.operate_scantime_1 || r.operate_scantime_2 || r.take_scantime || '';
    const tanggal = rawTime ? rawTime.split(' ')[0] : todayStr;
    const outletAsal = r.take_site_name || r.first_distribution_name || r.take_proxy_area_name || '-';
    const outletTujuan = r.destination_site_name || r.destination_distribution_name || '-';
    const stuck = formatStuckByHours(r.inventoryHours);
    const tlc = r.destination_distribution_name || r.SEND_NEXTSTATION || siteName || 'GW-Jakarta';
    const namaBarang = r.goods_name || '-';

    normalizedRows.push({
      waybill,
      tanggal,
      outlet_asal: outletAsal,
      outlet: outletTujuan,
      stuck,
      tlc,
      status: 'Pending',
      aksi: '-',
      nama_barang: namaBarang,
      updated_by: 'JFS Realtime',
    });
  }

  return { rawCount: allRecords.length, rows: normalizedRows };
}

async function syncJfsWaybillsToMonitoring(rows, actor = null) {
  const connection = await db.getConnection();
  let importedCount = 0;
  let skippedUpdatedCount = 0;
  let skippedHistoryCount = 0;
  let updatedAgingCount = 0;

  try {
    await connection.beginTransaction();

    // 1. Ambil seluruh data aktif yang ada di monitoring_stuck saat ini
    const [existingRows] = await connection.query(
      'SELECT waybill, tanggal, outlet_asal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by FROM monitoring_stuck'
    );
    const existingMap = new Map();
    existingRows.forEach(r => existingMap.set(String(r.waybill), r));

    // 2. Ambil riwayat yang sudah pernah diselesaikan
    const [historyRows] = await connection.query('SELECT waybill FROM monitoring_history');
    const historySet = new Set(historyRows.map(r => String(r.waybill)));

    // 3. Normalisasi data baru dari JFS
    const incomingMap = new Map();
    for (const row of rows || []) {
      const wb = String(row.waybill || '').trim();
      if (!wb) continue;
      if (!incomingMap.has(wb)) {
        incomingMap.set(wb, row);
      }
    }

    // 4. Deteksi paket yang SUDAH KELUAR dari inventaris stuck JFS (sudah berangkat / terkirim / beres di Gateway Jakarta)
    const toArchive = [];
    const toDelete = [];

    for (const existing of existingRows) {
      const wb = String(existing.waybill);
      if (!incomingMap.has(wb)) {
        const oldAksi = String(existing.aksi || '').trim();
        const oldStatus = String(existing.status || '').trim().toLowerCase();
        const isUpdated = (oldAksi && oldAksi !== '-') || oldStatus === 'sudah diupdate' || oldStatus === 'sudah scan kirim';

        if (isUpdated) {
          // Data yang sudah dikerjakan/diupdate operator diarsipkan ke History agar catatan tidak hilang
          toArchive.push({ ...existing, source: 'jfs_resolved' });
        } else {
          // Paket lama yang sudah tidak tertahan di gudang JFS dibersihkan dari antrean aktif monitoring
          toDelete.push(wb);
        }
      }
    }

    const CHUNK_SIZE = 500;

    // 5. Arsipkan data yang sudah diupdate ke monitoring_history (chunks of 500)
    for (let i = 0; i < toArchive.length; i += CHUNK_SIZE) {
      const chunk = toArchive.slice(i, i + CHUNK_SIZE);
      const values = chunk.map((r) => [
        r.waybill,
        r.tanggal ? new Date(r.tanggal).toISOString().slice(0, 10) : null,
        r.outlet_asal || '-',
        r.outlet || '-',
        String(r.stuck || '0 Jam (1-12)').trim() || '0 Jam (1-12)',
        r.tlc || '-',
        r.status || 'Sudah Diupdate',
        r.aksi || '-',
        r.nama_barang || '-',
        r.updated_by || 'JFS Realtime',
        r.source || 'jfs_resolved',
      ]);
      await connection.query(
        `INSERT INTO monitoring_history
          (waybill, tanggal, outlet_asal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by, source)
         VALUES ?`,
        [values]
      );
    }

    // 6. Hapus paket yang sudah keluar/beres dari monitoring_stuck (chunks of 500)
    const allLeftWaybills = [...toArchive.map(r => r.waybill), ...toDelete];
    for (let i = 0; i < allLeftWaybills.length; i += CHUNK_SIZE) {
      const chunk = allLeftWaybills.slice(i, i + CHUNK_SIZE);
      await connection.query(
        'DELETE FROM monitoring_stuck WHERE waybill IN (?)',
        [chunk]
      );
    }

    // 7. Kategorikan paket incoming JFS
    const validIncoming = [];
    for (const [wb, incoming] of incomingMap.entries()) {
      if (historySet.has(wb)) {
        skippedHistoryCount++;
        continue;
      }

      if (existingMap.has(wb)) {
        const existing = existingMap.get(wb);
        const oldAksi = String(existing.aksi || '').trim();
        const oldStatus = String(existing.status || '').trim().toLowerCase();
        const isUpdated = (oldAksi && oldAksi !== '-') || oldStatus === 'sudah diupdate' || oldStatus === 'sudah scan kirim';
        if (isUpdated) {
          skippedUpdatedCount++;
        } else {
          updatedAgingCount++;
        }
      } else {
        importedCount++;
      }
      validIncoming.push(incoming);
    }

    // 8. Eksekusi batch upsert dengan chunks of 500
    for (let i = 0; i < validIncoming.length; i += CHUNK_SIZE) {
      const chunk = validIncoming.slice(i, i + CHUNK_SIZE);
      const values = chunk.map((r) => [
        r.waybill,
        r.tanggal || null,
        r.outlet_asal || '-',
        r.outlet || '-',
        r.stuck || '0 Jam (1-12)',
        r.tlc || '-',
        'Pending',
        '-',
        r.nama_barang || '-',
        'JFS Realtime',
      ]);

      await connection.query(
        `INSERT INTO monitoring_stuck
           (waybill, tanggal, outlet_asal, outlet, stuck, tlc, status, aksi, nama_barang, updated_by)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           tanggal = VALUES(tanggal),
           outlet_asal = CASE
             WHEN monitoring_stuck.outlet_asal IS NULL OR monitoring_stuck.outlet_asal = '-' OR monitoring_stuck.outlet_asal = ''
             THEN VALUES(outlet_asal)
             WHEN VALUES(outlet_asal) IS NOT NULL AND VALUES(outlet_asal) != '-' AND VALUES(outlet_asal) != ''
             THEN VALUES(outlet_asal)
             ELSE monitoring_stuck.outlet_asal
           END,
           outlet = CASE
             WHEN VALUES(outlet) IS NOT NULL AND VALUES(outlet) != '-' AND VALUES(outlet) != ''
             THEN VALUES(outlet)
             ELSE monitoring_stuck.outlet
           END,
           stuck = VALUES(stuck),
           tlc = CASE
             WHEN VALUES(tlc) IS NOT NULL AND VALUES(tlc) != '-' AND VALUES(tlc) != ''
             THEN VALUES(tlc)
             ELSE monitoring_stuck.tlc
           END,
           nama_barang = CASE
             WHEN VALUES(nama_barang) IS NOT NULL AND VALUES(nama_barang) != '-' AND VALUES(nama_barang) != ''
             THEN VALUES(nama_barang)
             ELSE monitoring_stuck.nama_barang
           END,
           status = CASE
             WHEN (monitoring_stuck.aksi IS NOT NULL AND monitoring_stuck.aksi != '-' AND monitoring_stuck.aksi != '')
                  OR LOWER(monitoring_stuck.status) = 'sudah diupdate'
                  OR LOWER(monitoring_stuck.status) = 'sudah scan kirim'
             THEN 'Sudah Diupdate'
             ELSE VALUES(status)
           END,
           aksi = CASE
             WHEN (monitoring_stuck.aksi IS NOT NULL AND monitoring_stuck.aksi != '-' AND monitoring_stuck.aksi != '')
             THEN monitoring_stuck.aksi
             ELSE VALUES(aksi)
           END,
           updated_at = CURRENT_TIMESTAMP`,
        [values]
      );
    }

    await connection.commit();
    return {
      importedCount,
      skippedUpdatedCount,
      skippedHistoryCount,
      updatedAgingCount,
      archivedCount: toArchive.length,
      deletedCount: toDelete.length,
      totalIncoming: incomingMap.size,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

let syncStartedAt = 0;

async function syncJfsToDatabase(triggerType = 'auto', actor = null) {
  if (isSyncInProgress) {
    if (Date.now() - syncStartedAt < 120000) {
      return {
        success: false,
        message: 'Proses sinkronisasi JFS sedang berjalan. Mohon tunggu beberapa saat...',
      };
    }
    console.warn('[JFS Sync] Lock sinkronisasi kedaluwarsa (> 2 menit). Melepas safety lock.');
  }

  isSyncInProgress = true;
  syncStartedAt = Date.now();
  const startTime = Date.now();

  try {
    const { rawCount, rows } = await fetchAllJfsWaybills();

    const importActor = actor || {
      id: 0,
      username: triggerType === 'auto' ? 'JFS Auto-Sync' : 'Admin JFS',
      role: 'system',
    };

    const importResult = await syncJfsWaybillsToMonitoring(rows, importActor);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const successMsg = `Sinkronisasi sukses (${duration}s): ${rows.length.toLocaleString('id-ID')} waybill JFS (${importResult.importedCount} baru, ${importResult.updatedAgingCount} diperbarui, ${importResult.archivedCount} diarsip, ${importResult.deletedCount} dibersihkan)`;

    const nowIso = new Date().toISOString();
    await setConfigValue('last_sync_time', nowIso);
    await setConfigValue('last_sync_status', 'success');
    await setConfigValue('last_sync_message', successMsg);
    await setConfigValue('last_sync_count', rows.length);

    await db.query(
      `INSERT INTO jfs_sync_logs
        (trigger_type, status, total_fetched, imported_count, archived_count, deleted_count, message)
       VALUES (?, 'success', ?, ?, ?, ?, ?)`,
      [
        triggerType,
        rows.length,
        importResult.importedCount || 0,
        importResult.archivedCount || 0,
        importResult.deletedCount || 0,
        successMsg,
      ]
    );

    return {
      success: true,
      message: successMsg,
      totalFetched: rows.length,
      importedCount: importResult.importedCount,
      archivedCount: importResult.archivedCount,
      deletedCount: importResult.deletedCount,
      skippedUpdatedCount: importResult.skippedUpdatedCount,
      skippedHistoryCount: importResult.skippedHistoryCount,
      updatedAgingCount: importResult.updatedAgingCount,
      durationSeconds: duration,
      lastSyncTime: nowIso,
    };
  } catch (err) {
    const errorMsg = `Gagal sinkronisasi JFS: ${err.message}`;
    console.error('❌ syncJfsToDatabase Error:', err.message);

    await setConfigValue('last_sync_status', 'error');
    await setConfigValue('last_sync_message', errorMsg);

    await db.query(
      `INSERT INTO jfs_sync_logs
        (trigger_type, status, total_fetched, imported_count, archived_count, deleted_count, message)
       VALUES (?, 'error', 0, 0, 0, 0, ?)`,
      [triggerType, errorMsg]
    );

    return {
      success: false,
      message: errorMsg,
      error: err.message,
    };
  } finally {
    isSyncInProgress = false;
    syncStartedAt = 0;
  }
}

async function clearLogs(actor = null) {
  await ensureJfsTables();
  await db.query('TRUNCATE TABLE jfs_sync_logs');
  return { success: true, message: 'Riwayat log sinkronisasi JFS berhasil dibersihkan' };
}

async function getJfsFlowSummary(siteCodeParam = null, dateParam = null) {
  const cfg = await getConfig();
  const token = cfg.authtoken;
  const siteCode = siteCodeParam || cfg.scanSiteCode || 'JKT99A';
  const siteName = cfg.scanSiteCodeName || 'GW-Jakarta';

  const todayStr = getFormattedDate(new Date());
  const queryDate = dateParam || todayStr;

  const payload = {
    beginDate: queryDate,
    endDate: queryDate,
    scanSiteCode: siteCode,
    scanSiteCodeName: siteName,
    scanSiteCodeTypeId: 335,
    scanSiteCodeId: 220,
    sqlCode: 'realtime_sca_cen_flo_sum',
    current: 1,
    size: 20,
    convertResultFromDictionCode: '',
    convertResultFromDictionOriCode: '',
    paginationSearchType: 'list',
    countryId: '1',
  };

  const response = await requestJfsApi(
    token,
    payload,
    'realtime_sca_cen_flo_sum',
    'Bd-theme-12f31774-6788-4f80-bd84-ad623f38c693|businessIndicatorIndex'
  );

  const records = response?.data?.records || [];
  const totalResult = response?.data?.totalResult || {};
  const record = records[0] || {};

  return {
    success: true,
    siteCode,
    siteName,
    date: queryDate,
    summary: {
      arrival_qty: Number(record.arrival_qty ?? totalResult.arrival_qty ?? 0),
      arrival_pcs: Number(record.arrival_pcs ?? totalResult.arrival_pcs ?? 0),
      arrival_weight: Number(record.arrival_weight ?? totalResult.arrival_weight ?? 0),
      send_qty: Number(record.send_qty ?? totalResult.send_qty ?? 0),
      send_pcs: Number(record.send_pcs ?? totalResult.send_pcs ?? 0),
      send_weight: Number(record.send_weight ?? totalResult.send_weight ?? 0),
      arrival_no_send_qty: Number(record.arrival_no_send_qty ?? totalResult.arrival_no_send_qty ?? 0),
      arrival_no_send_pcs: Number(record.arrival_no_send_pcs ?? totalResult.arrival_no_send_pcs ?? 0),
      arrival_no_send_weight: Number(record.arrival_no_send_weight ?? totalResult.arrival_no_send_weight ?? 0),
      send_no_arrival_qty: Number(record.send_no_arrival_qty ?? totalResult.send_no_arrival_qty ?? 0),
      send_no_arrival_pcs: Number(record.send_no_arrival_pcs ?? totalResult.send_no_arrival_pcs ?? 0),
      send_no_arrival_weight: Number(record.send_no_arrival_weight ?? totalResult.send_no_arrival_weight ?? 0),
      stay_storage_qty: Number(record.stay_storage_qty ?? totalResult.stay_storage_qty ?? 0),
    },
  };
}

async function getJfsFlowTrend(siteCodeParam = null, beginDateParam = null, endDateParam = null) {
  const cfg = await getConfig();
  const token = cfg.authtoken;
  const siteCode = siteCodeParam || cfg.scanSiteCode || 'JKT99A';
  const siteName = cfg.scanSiteCodeName || 'GW-Jakarta';

  const now = new Date();
  const todayStr = getFormattedDate(now);
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const bDate = beginDateParam || firstDayOfMonth;
  const eDate = endDateParam || todayStr;

  const payload = {
    beginDate: bDate,
    endDate: eDate,
    scanSiteCode: siteCode,
    scanSiteCodeName: siteName,
    scanSiteCodeTypeId: 335,
    scanSiteCodeId: 220,
    sqlCode: 'realtime_sca_cen_flo_sum',
    current: 1,
    size: 50,
    convertResultFromDictionCode: '',
    convertResultFromDictionOriCode: '',
    paginationSearchType: 'list',
    countryId: '1',
  };

  const response = await requestJfsApi(
    token,
    payload,
    'realtime_sca_cen_flo_sum',
    'Bd-theme-12f31774-6788-4f80-bd84-ad623f38c693|businessIndicatorIndex'
  );

  return {
    success: true,
    siteCode,
    siteName,
    beginDate: bDate,
    endDate: eDate,
    records: response?.data?.records || [],
    totalResult: response?.data?.totalResult || null,
  };
}

async function getJfsFlowDetail(options = {}) {
  const cfg = await getConfig();
  const token = cfg.authtoken;
  const siteCode = options.siteCode || cfg.scanSiteCode || 'JKT99A';
  const siteName = options.scanSiteCodeName || cfg.scanSiteCodeName || 'GW-Jakarta';
  const date = options.date || getFormattedDate(new Date());

  // Mapping tipe: 'inbound' / 'backlog' -> 'arr'; 'outbound' / 'transit' -> 'sen'
  let type = options.type || 'arr';
  if (type === 'inbound' || type === 'backlog') type = 'arr';
  if (type === 'outbound' || type === 'transit') type = 'sen';

  const page = Math.max(1, parseInt(options.page || '1', 10));
  const size = Math.min(100, Math.max(10, parseInt(options.size || '20', 10)));
  const billCode = (options.search || options.billCode || '').trim();

  const basePayload = {
    beginDate: date,
    endDate: date,
    scanSiteCode: siteCode,
    scanSiteCodeName: siteName,
    scanSiteCodeTypeId: 335,
    scanSiteCodeId: 220,
    type: type,
    billCode: billCode,
    sqlCode: 'realtime_sca_cen_flo_dtl',
    convertResultFromDictionCode: '',
    convertResultFromDictionOriCode: '',
    countryId: '1',
  };

  const route = 'Bd-theme-12f31774-6788-4f80-bd84-ad623f38c693|businessIndicatorIndex';

  // Jalankan request count dan list secara paralel untuk response cepat
  const [countRes, listRes] = await Promise.all([
    requestJfsApi(
      token,
      { ...basePayload, current: 1, size: 10, paginationSearchType: 'count' },
      'realtime_sca_cen_flo_dtl',
      route
    ).catch(err => {
      console.warn('getJfsFlowDetail count warning:', err.message);
      return null;
    }),
    requestJfsApi(
      token,
      { ...basePayload, current: page, size: size, paginationSearchType: 'list' },
      'realtime_sca_cen_flo_dtl',
      route
    ).catch(err => {
      console.error('getJfsFlowDetail list error:', err.message);
      throw err;
    }),
  ]);

  const records = listRes?.data?.records || [];
  const total = countRes?.data?.total || records.length;

  return {
    success: true,
    siteCode,
    siteName,
    date,
    type,
    page,
    size,
    total,
    pages: Math.ceil(total / size),
    records,
  };
}

async function getRecentLogs(limit = 10) {
  await ensureJfsTables();
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const [rows] = await db.query(
    `SELECT * FROM jfs_sync_logs ORDER BY created_at DESC LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

function startScheduler() {
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
    syncIntervalTimer = null;
  }

  // Check every 60 seconds
  syncIntervalTimer = setInterval(async () => {
    try {
      const cfg = await getConfig();
      if (!cfg.autoSyncEnabled) return;

      const lastSync = cfg.lastSyncTime ? new Date(cfg.lastSyncTime).getTime() : 0;
      const intervalMs = cfg.syncIntervalMinutes * 60 * 1000;
      const now = Date.now();

      if (now - lastSync >= intervalMs) {
        console.log(`⏰ [JFS Worker] Menjalankan auto-sync terjadwal (interval: ${cfg.syncIntervalMinutes} menit)...`);
        const result = await syncJfsToDatabase('auto');
        console.log(`✅ [JFS Worker] Hasil:`, result.message);
      }
    } catch (schedErr) {
      console.error('⚠️ [JFS Worker] Scheduler error:', schedErr.message);
    }
  }, 60 * 1000);

  console.log('🤖 JFS Background Scheduler telah aktif.');
}

function restartScheduler() {
  startScheduler();
}

async function initJfs() {
  try {
    await ensureJfsTables();
    startScheduler();
    console.log('✅ Inisialisasi JFS Realtime Service selesai.');

    // Auto-sync langsung saat startup jika terdeteksi data di database belum punya outlet_asal
    setTimeout(async () => {
      try {
        const [missing] = await db.query(
          "SELECT COUNT(*) as cnt FROM monitoring_stuck WHERE outlet_asal IS NULL OR outlet_asal = '-' OR outlet_asal = ''"
        );
        if (missing && missing[0] && missing[0].cnt > 0) {
          console.log(`🔄 [JFS Startup Auto-Sync] Mendeteksi ${missing[0].cnt} waybill dengan outlet asal kosong. Menjalankan sinkronisasi penyegaran realtime...`);
          const result = await syncJfsToDatabase('auto');
          console.log(`✅ [JFS Startup Auto-Sync] Selesai:`, result.message);
        }
      } catch (syncErr) {
        console.error('⚠️ [JFS Startup Auto-Sync] Error:', syncErr.message);
      }
    }, 4000);
  } catch (err) {
    console.error('❌ Gagal inisialisasi JFS Service:', err.message);
  }
}

module.exports = {
  initJfs,
  getConfig,
  updateConfig,
  testJfsConnection,
  fetchAllJfsWaybills,
  syncJfsToDatabase,
  getJfsFlowSummary,
  getJfsFlowTrend,
  getJfsFlowDetail,
  getRecentLogs,
  clearLogs,
  restartScheduler,
};
