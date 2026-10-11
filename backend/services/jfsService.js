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

  const defaultConfigs = [
    { key: 'authtoken', value: '5e5f58c243c645b89385c6806310474c' },
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
}

async function getConfig() {
  await ensureJfsTables();
  const [rows] = await db.query('SELECT config_key, config_value FROM jfs_config');
  const map = {};
  for (const r of rows) {
    map[r.config_key] = r.config_value;
  }
  return {
    authtoken: map.authtoken || '5e5f58c243c645b89385c6806310474c',
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
    await setConfigValue('authtoken', newConfig.authtoken.trim());
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

function requestJfsApi(token, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'jfsgw.jtcargo.co.id',
      port: 443,
      path: '/jfs-report-leader/report/dynamicReport/findByPagination?sqlCode=realtime_inv_man_dtl',
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authtoken': token,
        'content-type': 'application/json;charset=UTF-8',
        'lang': 'ID',
        'langtype': 'ID',
        'origin': 'https://jfs.jtcargo.co.id',
        'referer': 'https://jfs.jtcargo.co.id/',
        'routename': 'Bd-theme-4d718ae8-fa85-4edc-b98c-1a0f75e5f9f3|businessIndicatorIndex',
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
    const outlet = r.destination_site_name || r.take_site_name || '-';
    const stuck = formatStuckByHours(r.inventoryHours);
    const tlc = r.destination_distribution_name || r.SEND_NEXTSTATION || siteName || 'GW-Jakarta';
    const namaBarang = r.goods_name || '-';

    normalizedRows.push({
      waybill,
      tanggal,
      outlet,
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

async function syncJfsToDatabase(triggerType = 'auto', actor = null) {
  if (isSyncInProgress) {
    return {
      success: false,
      message: 'Proses sinkronisasi JFS sedang berjalan. Mohon tunggu...',
    };
  }

  isSyncInProgress = true;
  const startTime = Date.now();

  try {
    const { rawCount, rows } = await fetchAllJfsWaybills();

    const importActor = actor || {
      id: 0,
      username: triggerType === 'auto' ? 'JFS Auto-Sync' : 'Admin JFS',
      role: 'system',
    };

    const importResult = await monitoringService.bulkImportMonitoring(rows, importActor);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const successMsg = `Sinkronisasi sukses (${duration}s): ${rows.length.toLocaleString('id-ID')} waybill JFS (${importResult.importedCount} dimuat, ${importResult.historyCount} diarsip, ${importResult.deletedCount} dibersihkan)`;

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
        importResult.historyCount || 0,
        importResult.deletedCount || 0,
        successMsg,
      ]
    );

    return {
      success: true,
      message: successMsg,
      totalFetched: rows.length,
      importedCount: importResult.importedCount,
      historyCount: importResult.historyCount,
      deletedCount: importResult.deletedCount,
      skippedCount: importResult.skippedCount,
      overwrittenCount: importResult.overwrittenCount,
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
  }
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
  getRecentLogs,
  restartScheduler,
};
