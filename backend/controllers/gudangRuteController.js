const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const readline = require('readline');
const db = require('../config/db');
const jfsService = require('../services/jfsService');
const auditService = require('../services/auditService');

const DOWNLOADS_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\Yimi Cargo', 'Downloads');

// Helper to make https requests to JFS
function jfsApiRequest(endpointUrl, method, payload, token) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(endpointUrl);
      const postData = payload ? JSON.stringify(payload) : null;
      const headers = {
        'content-type': 'application/json;charset=UTF-8',
        'accept': 'application/json, text/plain, */*',
        'authtoken': token || '',
        'routename': 'trackingExpress',
        'lang': 'ID',
        'langtype': 'ID',
        'origin': 'https://jfs.jtcargo.co.id',
        'referer': 'https://jfs.jtcargo.co.id/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
      };
      if (postData) {
        headers['content-length'] = Buffer.byteLength(postData);
      }

      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: method || 'GET',
        headers: headers,
        timeout: 15000,
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            resolve({ success: false, raw: body, error: e.message });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

// Find latest matching Excel file in Downloads
function findLatestExcelFile() {
  if (!fs.existsSync(DOWNLOADS_DIR)) return null;
  const files = fs.readdirSync(DOWNLOADS_DIR);
  let latest = null;

  for (const f of files) {
    if (f.startsWith('~$')) continue;
    if (!f.toLowerCase().endsWith('.xlsx')) continue;
    if (f.includes('线路库存') || f.includes('Paket Simpan Gudang')) {
      const fullPath = path.join(DOWNLOADS_DIR, f);
      try {
        const stat = fs.statSync(fullPath);
        if (!latest || stat.mtimeMs > latest.mtimeMs) {
          latest = {
            fileName: f,
            filePath: fullPath,
            sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
            mtime: stat.mtime,
            mtimeMs: stat.mtimeMs
          };
        }
      } catch (_) {}
    }
  }
  return latest;
}

// 1. Get info on latest file and current DB stats
async function getLatestFileInfo(req, res) {
  try {
    const latestFile = findLatestExcelFile();
    const [totalRowsRes] = await db.query('SELECT COUNT(*) as count FROM gudang_rute_inventory');
    const [totalEnrichedRes] = await db.query("SELECT COUNT(*) as count FROM gudang_rute_inventory WHERE nama_barang IS NOT NULL AND nama_barang != ''");
    const [lastSyncRows] = await db.query('SELECT * FROM gudang_rute_sync_logs ORDER BY id DESC LIMIT 1');
    const [batchRes] = await db.query('SELECT batch_time FROM gudang_rute_inventory WHERE batch_time IS NOT NULL AND batch_time != "" ORDER BY id DESC LIMIT 1');
    const [holdingGwRows] = await db.query(`
      SELECT holding_gw, COUNT(*) as cnt 
      FROM gudang_rute_inventory 
      WHERE holding_gw IS NOT NULL AND holding_gw != ''
      GROUP BY holding_gw 
      ORDER BY cnt DESC 
      LIMIT 15
    `);

    res.json({
      success: true,
      latestFile: latestFile,
      stats: {
        totalInventory: totalRowsRes[0]?.count || 0,
        totalEnriched: totalEnrichedRes[0]?.count || 0,
        latestBatchTime: batchRes[0]?.batch_time || (lastSyncRows[0]?.batch_time || '-'),
        lastSync: lastSyncRows[0] || null,
        topGateways: holdingGwRows
      }
    });
  } catch (error) {
    console.error('getLatestFileInfo error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Stream-import Excel and auto-enrich
let isImporting = false;
let importProgress = { status: 'idle', totalProcessed: 0, enriched: 0, message: '' };

async function getImportStatus(req, res) {
  res.json({
    success: true,
    isImporting,
    progress: importProgress
  });
}

async function importExcelData(req, res) {
  if (isImporting) {
    return res.status(409).json({ success: false, message: 'Proses impor sedang berjalan, harap tunggu hingga selesai.' });
  }

  const { filterGw = 'ALL', manualPath = null } = req.body || {};
  let targetPath = manualPath;
  let targetFile = null;

  if (!targetPath) {
    targetFile = findLatestExcelFile();
    if (!targetFile) {
      return res.status(404).json({ success: false, message: 'Tidak ditemukan file Excel 线路库存 (Paket Simpan Gudang) di folder Downloads.' });
    }
    targetPath = targetFile.filePath;
  } else {
    targetFile = {
      fileName: path.basename(targetPath),
      filePath: targetPath
    };
  }

  // Extract batch time from filename, e.g. "14.00 线路库存... 25.10.2026.xlsx" -> "14.00 25.10.2026"
  let batchTime = '';
  const batchMatch = targetFile.fileName.match(/^(\d{2}\.\d{2}).*?(\d{2}\.\d{2}\.\d{4})/);
  if (batchMatch) {
    batchTime = `${batchMatch[1]} ${batchMatch[2]}`;
  } else {
    const timeMatch = targetFile.fileName.match(/(\d{2}\.\d{2})/);
    batchTime = timeMatch ? timeMatch[1] : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  isImporting = true;
  importProgress = {
    status: 'running',
    fileName: targetFile.fileName,
    filterGw,
    batchTime,
    totalProcessed: 0,
    newCount: 0,
    updatedCount: 0,
    enrichedCount: 0,
    startTime: Date.now(),
    message: 'Memulai pembacaan streaming file Excel...'
  };

  // Run in background and respond immediately or await
  // We respond immediately so UI can poll or show live progress bar
  res.json({
    success: true,
    message: 'Proses impor berhasil dimulai di latar belakang.',
    file: targetFile.fileName,
    batchTime
  });

  // Background execution
  (async () => {
    const startTime = Date.now();
    const scriptPath = path.join(__dirname, '..', 'services', 'excel_stream.py');
    const py = spawn('python', ['-u', scriptPath, targetPath, filterGw, batchTime], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    const rl = readline.createInterface({ input: py.stdout, terminal: false });

    let buffer = [];
    const BATCH_SIZE = 1000;
    let totalInserted = 0;

    async function flushBuffer() {
      if (buffer.length === 0) return;
      const recordsToInsert = buffer.map(r => [
        r.waybill, r.tanggal_simpan, r.holding_gw, r.status_simpan, r.berat, r.volume, r.is_dfod,
        r.tgl_buka, r.outlet_asal, r.tgl_tiba, r.next_stop, r.gw_asal, r.gw_tujuan, r.outlet_tujuan,
        r.frekuensi_kirim, r.durasi_jam, r.durasi_kategori, r.is_problem, r.status_penangguhan,
        r.rute, r.gw_tujuan_2, r.next_gw, r.outlet_akhir, r.tipe_jalur, r.batch_time
      ]);
      buffer = [];

      const sql = `
        INSERT INTO gudang_rute_inventory (
          waybill, tanggal_simpan, holding_gw, status_simpan, berat, volume, is_dfod,
          tgl_buka, outlet_asal, tgl_tiba, next_stop, gw_asal, gw_tujuan, outlet_tujuan,
          frekuensi_kirim, durasi_jam, durasi_kategori, is_problem, status_penangguhan,
          rute, gw_tujuan_2, next_gw, outlet_akhir, tipe_jalur, batch_time
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
          tanggal_simpan = VALUES(tanggal_simpan),
          holding_gw = VALUES(holding_gw),
          status_simpan = VALUES(status_simpan),
          berat = VALUES(berat),
          volume = VALUES(volume),
          is_dfod = VALUES(is_dfod),
          tgl_buka = VALUES(tgl_buka),
          outlet_asal = VALUES(outlet_asal),
          tgl_tiba = VALUES(tgl_tiba),
          next_stop = VALUES(next_stop),
          gw_asal = VALUES(gw_asal),
          gw_tujuan = VALUES(gw_tujuan),
          outlet_tujuan = VALUES(outlet_tujuan),
          frekuensi_kirim = VALUES(frekuensi_kirim),
          durasi_jam = VALUES(durasi_jam),
          durasi_kategori = VALUES(durasi_kategori),
          is_problem = VALUES(is_problem),
          status_penangguhan = VALUES(status_penangguhan),
          rute = VALUES(rute),
          gw_tujuan_2 = VALUES(gw_tujuan_2),
          next_gw = VALUES(next_gw),
          outlet_akhir = VALUES(outlet_akhir),
          tipe_jalur = VALUES(tipe_jalur),
          batch_time = VALUES(batch_time),
          updated_at = NOW()
      `;

      await db.query(sql, [recordsToInsert]);
      totalInserted += recordsToInsert.length;
      importProgress.totalProcessed = totalInserted;
      importProgress.message = `Mengimpor data... (${totalInserted.toLocaleString('id-ID')} waybill diproses)`;
    }

    rl.on('line', async (line) => {
      if (!line.trim()) return;
      try {
        const item = JSON.parse(line);
        buffer.push(item);
        if (buffer.length >= BATCH_SIZE) {
          rl.pause();
          await flushBuffer();
          rl.resume();
        }
      } catch (err) {
        console.error('Error parsing line from excel_stream:', err);
      }
    });

    py.stderr.on('data', (data) => {
      console.warn('excel_stream.py stderr:', data.toString());
    });

    py.on('close', async (code) => {
      try {
        if (buffer.length > 0) {
          await flushBuffer();
        }

        importProgress.message = 'Menjalankan auto-enrichment nama barang & customer dari PTO...';

        // Instant auto-enrichment via UPDATE JOIN with pto_orders & monitoring_stuck
        const [enrichRes] = await db.query(`
          UPDATE gudang_rute_inventory g
          JOIN pto_orders p ON g.waybill = p.waybill
          SET 
            g.nama_barang = COALESCE(NULLIF(g.nama_barang, ''), p.nama_barang),
            g.pengirim = COALESCE(NULLIF(g.pengirim, ''), p.pengirim),
            g.perusahaan_pengirim = COALESCE(NULLIF(g.perusahaan_pengirim, ''), p.perusahaan_pengirim),
            g.no_hp_pengirim = COALESCE(NULLIF(g.no_hp_pengirim, ''), p.nomor_ponsel_pengirim),
            g.penerima = COALESCE(NULLIF(g.penerima, ''), p.penerima),
            g.perusahaan_penerima = COALESCE(NULLIF(g.perusahaan_penerima, ''), p.perusahaan_penerima_paket),
            g.no_hp_penerima = COALESCE(NULLIF(g.no_hp_penerima, ''), p.nomor_handphone_penerima),
            g.alamat_penerima = COALESCE(NULLIF(g.alamat_penerima, ''), p.alamat_lengkap_penerima)
          WHERE (g.nama_barang IS NULL OR g.nama_barang = '')
        `);

        const [enrichStuckRes] = await db.query(`
          UPDATE gudang_rute_inventory g
          JOIN monitoring_stuck m ON g.waybill = m.waybill COLLATE utf8mb4_unicode_ci
          SET 
            g.nama_barang = COALESCE(NULLIF(g.nama_barang, ''), m.nama_barang),
            g.pengirim = COALESCE(NULLIF(g.pengirim, ''), m.client_name)
          WHERE (g.nama_barang IS NULL OR g.nama_barang = '') 
            AND (m.nama_barang IS NOT NULL AND m.nama_barang != '')
        `);

        const enrichedCount = (enrichRes?.affectedRows || 0) + (enrichStuckRes?.affectedRows || 0);
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

        // Record sync log
        await db.query(`
          INSERT INTO gudang_rute_sync_logs (
            filename, batch_time, total_rows, new_count, updated_count,
            enriched_count, duration_seconds, status, message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?)
        `, [
          targetFile.fileName,
          batchTime,
          totalInserted,
          0,
          totalInserted,
          enrichedCount,
          durationSec,
          `Berhasil impor ${totalInserted.toLocaleString('id-ID')} waybill (${durationSec} detik). Ter-enrich otomatis: ${enrichedCount.toLocaleString('id-ID')}`
        ]);

        importProgress = {
          status: 'success',
          fileName: targetFile.fileName,
          batchTime,
          totalProcessed: totalInserted,
          enrichedCount,
          durationSec,
          message: `Selesai! ${totalInserted.toLocaleString('id-ID')} waybill berhasil diimpor & ${enrichedCount.toLocaleString('id-ID')} ter-enrich otomatis.`
        };
      } catch (postErr) {
        console.error('Error during post-import enrichment:', postErr);
        importProgress = {
          status: 'error',
          message: 'Error saat menyimpan data: ' + postErr.message
        };
      } finally {
        isImporting = false;
      }
    });

    py.on('error', (err) => {
      console.error('Error spawning excel_stream.py:', err);
      isImporting = false;
      importProgress = { status: 'error', message: 'Gagal menjalankan streaming python: ' + err.message };
    });
  })();
}

// 3. Query inventory with filters and pagination
async function queryInventory(req, res) {
  try {
    const {
      search = '',
      holding_gw = '',
      gw_tujuan = '',
      tipe_jalur = '',
      durasi_kategori = '',
      is_problem = '',
      enrich_status = 'all',
      page = 1,
      limit = 50,
      sortBy = 'durasi_jam',
      sortDir = 'DESC'
    } = req.body || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['1=1'];
    const params = [];

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      if (q.includes('*')) {
        const pattern = q.replace(/\*/g, '%');
        conditions.push('(g.waybill LIKE ?)');
        params.push(pattern);
      } else {
        conditions.push(`(
          g.waybill LIKE ? OR 
          g.nama_barang LIKE ? OR 
          g.pengirim LIKE ? OR 
          g.perusahaan_pengirim LIKE ? OR 
          g.penerima LIKE ? OR 
          g.perusahaan_penerima LIKE ? OR 
          g.outlet_tujuan LIKE ? OR
          g.rute LIKE ?
        )`);
        const searchPattern = `%${q}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
    }

    if (holding_gw && holding_gw !== 'ALL') {
      conditions.push('g.holding_gw = ?');
      params.push(holding_gw);
    }

    if (gw_tujuan && gw_tujuan !== 'ALL') {
      conditions.push('g.gw_tujuan = ?');
      params.push(gw_tujuan);
    }

    if (tipe_jalur && tipe_jalur !== 'ALL') {
      conditions.push('g.tipe_jalur LIKE ?');
      params.push(`%${tipe_jalur}%`);
    }

    if (durasi_kategori && durasi_kategori !== 'ALL') {
      conditions.push('g.durasi_kategori LIKE ?');
      params.push(`%${durasi_kategori}%`);
    }

    if (is_problem && is_problem !== 'ALL') {
      conditions.push('g.is_problem = ?');
      params.push(is_problem);
    }

    if (enrich_status === 'enriched') {
      conditions.push('(g.nama_barang IS NOT NULL AND g.nama_barang != "")');
    } else if (enrich_status === 'unenriched') {
      conditions.push('(g.nama_barang IS NULL OR g.nama_barang = "")');
    }

    const whereClause = conditions.join(' AND ');

    // Allowed sort columns
    const allowedSortCols = ['durasi_jam', 'tanggal_simpan', 'berat', 'volume', 'waybill', 'holding_gw', 'gw_tujuan', 'id'];
    const safeSortCol = allowedSortCols.includes(sortBy) ? sortBy : 'durasi_jam';
    const safeSortDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count and KPI aggregation
    const countSql = `
      SELECT 
        COUNT(*) as totalRows,
        COALESCE(SUM(g.berat), 0) as totalWeight,
        COALESCE(SUM(g.volume), 0) as totalVolume,
        COALESCE(SUM(CASE WHEN g.nama_barang IS NOT NULL AND g.nama_barang != '' THEN 1 ELSE 0 END), 0) as totalEnriched,
        COALESCE(SUM(CASE WHEN g.is_problem = 'ya' OR g.is_problem = '1' THEN 1 ELSE 0 END), 0) as totalProblem,
        COALESCE(AVG(g.durasi_jam), 0) as avgDuration
      FROM gudang_rute_inventory g
      WHERE ${whereClause}
    `;

    const [statsRes] = await db.query(countSql, params);
    const stats = statsRes[0] || {
      totalRows: 0,
      totalWeight: 0,
      totalVolume: 0,
      totalEnriched: 0,
      totalProblem: 0,
      avgDuration: 0
    };

    // Query records
    const dataSql = `
      SELECT 
        g.id, g.waybill, g.tanggal_simpan, g.holding_gw, g.status_simpan,
        g.berat, g.volume, g.is_dfod, g.tgl_buka, g.outlet_asal, g.tgl_tiba,
        g.next_stop, g.gw_asal, g.gw_tujuan, g.outlet_tujuan, g.frekuensi_kirim,
        g.durasi_jam, g.durasi_kategori, g.is_problem, g.status_penangguhan,
        g.rute, g.gw_tujuan_2, g.next_gw, g.outlet_akhir, g.tipe_jalur,
        g.nama_barang, g.pengirim, g.perusahaan_pengirim, g.no_hp_pengirim,
        g.penerima, g.perusahaan_penerima, g.no_hp_penerima, g.alamat_penerima,
        g.batch_time, g.updated_at
      FROM gudang_rute_inventory g
      WHERE ${whereClause}
      ORDER BY g.${safeSortCol} ${safeSortDir}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataSql, [...params, limitNum, offset]);

    // Unique holding gateways and dest gateways for filter dropdowns
    const [holdingGws] = await db.query(`
      SELECT DISTINCT holding_gw 
      FROM gudang_rute_inventory 
      WHERE holding_gw IS NOT NULL AND holding_gw != '' 
      ORDER BY holding_gw ASC
      LIMIT 100
    `);

    const [destGws] = await db.query(`
      SELECT DISTINCT gw_tujuan 
      FROM gudang_rute_inventory 
      WHERE gw_tujuan IS NOT NULL AND gw_tujuan != '' 
      ORDER BY gw_tujuan ASC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRows: stats.totalRows,
        totalPages: Math.ceil(stats.totalRows / limitNum) || 1
      },
      stats: {
        totalRows: stats.totalRows,
        totalWeight: Number(stats.totalWeight).toFixed(2),
        totalVolume: Number(stats.totalVolume).toFixed(4),
        totalEnriched: stats.totalEnriched,
        totalProblem: stats.totalProblem,
        avgDuration: Number(stats.avgDuration).toFixed(1)
      },
      holdingGateways: holdingGws.map(x => x.holding_gw),
      destGateways: destGws.map(x => x.gw_tujuan)
    });
  } catch (error) {
    console.error('queryInventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// 4. Get POD Trace (100% matches screenshot!)
async function getPodTrace(req, res) {
  try {
    const { waybillNo } = req.body || req.query || {};
    if (!waybillNo) {
      return res.status(400).json({ success: false, message: 'Nomor waybill wajib diisi' });
    }

    const jfsConfig = await jfsService.getConfig();
    const token = jfsConfig.authtoken;

    // Concurrently fetch:
    // 1. Waybill scan list (18 steps)
    // 2. Dynamic route
    // 3. Segment code compare list (planned vs actual)
    // 4. Return route
    // 5. Abnormal scan list
    // 6. Order detail for backup goods name / person

    const [keywordListRes, dynamicRouteRes, actualRouteRes, rebackRes, abnormalRes, orderDetailRes] = await Promise.all([
      jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/keywordList', 'POST', {
        keywordList: [waybillNo],
        trackingTypeEnum: 'WAYBILL',
        countryId: '1'
      }, token),
      jfsApiRequest(`https://jfsgw.jtcargo.co.id/transportation/dynamicRoute/listByWaybillNo?waybillNo=${encodeURIComponent(waybillNo)}`, 'GET', null, token),
      jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/actualRoute', 'POST', {
        keywordList: [waybillNo],
        trackingTypeEnum: 'WAYBILL',
        countryId: '1'
      }, token),
      jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/rebackTransferExpress/queryRebackRoute', 'POST', {
        keywordList: [waybillNo],
        trackingTypeEnum: 'WAYBILL',
        countryId: '1'
      }, token),
      jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/abnormalPieceScanList/pageList', 'POST', {
        current: 1,
        size: 50,
        waybillId: waybillNo,
        countryId: '1'
      }, token),
      jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/order/getOrderDetail', 'POST', {
        waybillNo: waybillNo,
        countryId: '1'
      }, token)
    ]);

    // 1. Dynamic Route arrow string
    let dynamicRouteString = '';
    if (dynamicRouteRes && dynamicRouteRes.data && Array.isArray(dynamicRouteRes.data)) {
      dynamicRouteString = dynamicRouteRes.data.map(item => item.siteCodeName || item.siteName || item.siteCode).filter(Boolean).join(' → ');
    }

    // 2. Planned & Actual Route strings (matching screenshot exact names)
    let plannedRouteString = '';
    let actualRouteString = '';
    if (actualRouteRes && actualRouteRes.data) {
      plannedRouteString = actualRouteRes.data.planRouteName || actualRouteRes.data.planRouteCode || '';
      actualRouteString = actualRouteRes.data.realityRouteName || actualRouteRes.data.realityRouteCode || '';
    }

    // 3. Return Route string (matching screenshot 4th line)
    let returnRouteString = '';
    if (rebackRes && rebackRes.data) {
      if (Array.isArray(rebackRes.data) && rebackRes.data.length > 0) {
        returnRouteString = rebackRes.data[0].planRouteName || rebackRes.data[0].planRouteCode || '';
      } else if (typeof rebackRes.data === 'string') {
        returnRouteString = rebackRes.data;
      }
    }

    // 4. Scan Records Table (matching screenshot: No, Waktu scan, waktu unggah, Jenis scan, Tipe scan, deskripsi track record, Berat, berat volumetrik)
    const scanItems = [];
    let rawScans = [];
    if (keywordListRes && keywordListRes.data && Array.isArray(keywordListRes.data) && keywordListRes.data.length > 0) {
      rawScans = keywordListRes.data[0].details || [];
    }

    // Reverse if needed to match chronological 1..N order (from earliest pickup to latest arrival)
    // In keywordList, details is sorted latest first or earliest first.
    // In screenshot: No 1 is 2026-10-21 17:36:55 (pickup), No 18 is 2026-10-25 16:28:36 (latest).
    // Let's sort by scanTime ascending
    rawScans.sort((a, b) => (a.scanTime || '').localeCompare(b.scanTime || ''));

    rawScans.forEach((scan, index) => {
      // Determine description
      let desc = scan.waybillTrackingContent || scan.scanDesc || '';
      if (!desc) {
        desc = `[ ${scan.scanNetworkName || scan.scanNetworkCode || ''} ] ${scan.scanTypeName || ''}`;
      }

      scanItems.push({
        no: index + 1,
        scanTime: scan.scanTime || scan.createTime || '-',
        uploadTime: scan.uploadTime || scan.createTime || '-',
        scanType: scan.scanTypeName || scan.scanType || '-',
        scanDeviceType: scan.scanMode ? (scan.scanMode + ' - -') : 'PDA - -',
        scanDesc: desc,
        weight: scan.weight !== undefined && scan.weight !== null && scan.weight !== '' ? scan.weight : '--',
        volumeWeight: scan.volumeWeight !== undefined && scan.volumeWeight !== null && scan.volumeWeight !== '' ? scan.volumeWeight : '--',
        isProblem: Boolean(
          (scan.scanTypeName && (scan.scanTypeName.toLowerCase().includes('masalah') || scan.scanTypeName.toLowerCase().includes('retur') || scan.scanTypeName.toLowerCase().includes('penangguhan'))) ||
          (desc && (desc.toLowerCase().includes('masalah') || desc.toLowerCase().includes('retur')))
        )
      });
    });

    // If orderDetail returned goods name and customer, auto-save to DB if missing
    if (orderDetailRes && orderDetailRes.data) {
      const d = orderDetailRes.data;
      if (d.goodsName || d.senderName || d.receiverName) {
        db.query(`
          UPDATE gudang_rute_inventory
          SET 
            nama_barang = COALESCE(NULLIF(nama_barang, ''), ?),
            pengirim = COALESCE(NULLIF(pengirim, ''), ?),
            perusahaan_pengirim = COALESCE(NULLIF(perusahaan_pengirim, ''), ?),
            no_hp_pengirim = COALESCE(NULLIF(no_hp_pengirim, ''), ?),
            penerima = COALESCE(NULLIF(penerima, ''), ?),
            perusahaan_penerima = COALESCE(NULLIF(perusahaan_penerima, ''), ?),
            no_hp_penerima = COALESCE(NULLIF(no_hp_penerima, ''), ?),
            alamat_penerima = COALESCE(NULLIF(alamat_penerima, ''), ?)
          WHERE waybill = ?
        `, [
          d.goodsName || '',
          d.senderName || '',
          d.senderCompany || d.customerName || '',
          d.senderMobilePhone || d.senderTelphone || '',
          d.receiverName || '',
          d.receiverCompany || '',
          d.receiverMobilePhone || d.receiverTelphone || '',
          d.receiverDetailedAddress || '',
          waybillNo
        ]).catch(err => console.warn('Auto update from orderDetail failed:', err.message));
      }
    }

    res.json({
      success: true,
      waybillNo,
      routes: {
        dynamicRoute: dynamicRouteString || '-',
        plannedRoute: plannedRouteString || '-',
        actualRoute: actualRouteString || '-',
        returnRoute: returnRouteString || '-'
      },
      scans: scanItems,
      abnormalList: abnormalRes?.data?.records || abnormalRes?.data || [],
      orderDetail: orderDetailRes?.data || null
    });
  } catch (error) {
    console.error('getPodTrace error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// 5. Enrich single waybill or batch from JFS API
async function enrichWaybill(req, res) {
  try {
    const { waybillNo } = req.body || {};
    if (!waybillNo) {
      return res.status(400).json({ success: false, message: 'Nomor waybill wajib diisi' });
    }

    const jfsConfig = await jfsService.getConfig();
    const token = jfsConfig.authtoken;

    const orderDetailRes = await jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/order/getOrderDetail', 'POST', {
      waybillNo,
      countryId: '1'
    }, token);

    if (!orderDetailRes || !orderDetailRes.data) {
      return res.status(404).json({ success: false, message: 'Data pesanan tidak ditemukan di JFS' });
    }

    const d = orderDetailRes.data;
    await db.query(`
      UPDATE gudang_rute_inventory
      SET 
        nama_barang = COALESCE(?, nama_barang),
        pengirim = COALESCE(?, pengirim),
        perusahaan_pengirim = COALESCE(?, perusahaan_pengirim),
        no_hp_pengirim = COALESCE(?, no_hp_pengirim),
        penerima = COALESCE(?, penerima),
        perusahaan_penerima = COALESCE(?, perusahaan_penerima),
        no_hp_penerima = COALESCE(?, no_hp_penerima),
        alamat_penerima = COALESCE(?, alamat_penerima)
      WHERE waybill = ?
    `, [
      d.goodsName || null,
      d.senderName || null,
      d.senderCompany || d.customerName || null,
      d.senderMobilePhone || d.senderTelphone || null,
      d.receiverName || null,
      d.receiverCompany || null,
      d.receiverMobilePhone || d.receiverTelphone || null,
      d.receiverDetailedAddress || null,
      waybillNo
    ]);

    res.json({
      success: true,
      message: 'Berhasil memperbarui rincian barang & customer dari JFS!',
      data: {
        waybill: waybillNo,
        goodsName: d.goodsName,
        senderName: d.senderName,
        receiverName: d.receiverName
      }
    });
  } catch (error) {
    console.error('enrichWaybill error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}


// 6. Bulk Enrich Worker via JFS API (Processes 50, 100, 500 at once in background!)
let isBulkEnriching = false;
let bulkEnrichProgress = { current: 0, total: 0, successCount: 0, status: 'idle', message: '' };

async function getBulkEnrichStatus(req, res) {
  res.json({
    success: true,
    isBulkEnriching,
    progress: bulkEnrichProgress
  });
}

async function bulkEnrichWaybills(req, res) {
  if (isBulkEnriching) {
    return res.status(409).json({ success: false, message: 'Proses bulk enrich sedang berjalan.' });
  }

  const { waybills = [], limit = 100 } = req.body || {};
  let targetWaybills = [];

  if (Array.isArray(waybills) && waybills.length > 0) {
    targetWaybills = waybills;
  } else {
    const maxLimit = Math.min(1000, Math.max(10, parseInt(limit, 10) || 100));
    const [rows] = await db.query(`
      SELECT waybill 
      FROM gudang_rute_inventory 
      WHERE nama_barang IS NULL OR nama_barang = ''
      ORDER BY id ASC
      LIMIT ?
    `, [maxLimit]);
    targetWaybills = rows.map(r => r.waybill);
  }

  if (targetWaybills.length === 0) {
    return res.json({ success: true, message: 'Semua waybill sudah memiliki rincian barang.', enrichedCount: 0 });
  }

  isBulkEnriching = true;
  bulkEnrichProgress = {
    current: 0,
    total: targetWaybills.length,
    successCount: 0,
    status: 'running',
    message: `Memulai auto-enrich untuk ${targetWaybills.length} waybill...`
  };

  res.json({
    success: true,
    message: `Memulai auto-enrich massal untuk ${targetWaybills.length} waybill di latar belakang...`,
    total: targetWaybills.length
  });

  (async () => {
    try {
      const jfsConfig = await jfsService.getConfig();
      const token = jfsConfig.authtoken;
      const CONCURRENCY = 5;
      let enrichedCount = 0;

      for (let i = 0; i < targetWaybills.length; i += CONCURRENCY) {
        if (!isBulkEnriching) break;
        const chunk = targetWaybills.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(async (wb) => {
          try {
            const resp = await jfsApiRequest('https://jfsgw.jtcargo.co.id/operatingplatform/order/getOrderDetail', 'POST', {
              waybillNo: wb,
              countryId: '1'
            }, token);

            if (resp && resp.data && resp.data.goodsName) {
              const d = resp.data;
              await db.query(`
                UPDATE gudang_rute_inventory
                SET 
                  nama_barang = COALESCE(?, nama_barang),
                  pengirim = COALESCE(?, pengirim),
                  perusahaan_pengirim = COALESCE(?, perusahaan_pengirim),
                  no_hp_pengirim = COALESCE(?, no_hp_pengirim),
                  penerima = COALESCE(?, penerima),
                  perusahaan_penerima = COALESCE(?, perusahaan_penerima),
                  no_hp_penerima = COALESCE(?, no_hp_penerima),
                  alamat_penerima = COALESCE(?, alamat_penerima)
                WHERE waybill = ?
              `, [
                d.goodsName || null,
                d.senderName || null,
                d.senderCompany || d.customerName || null,
                d.senderMobilePhone || d.senderTelphone || null,
                d.receiverName || null,
                d.receiverCompany || null,
                d.receiverMobilePhone || d.receiverTelphone || null,
                d.receiverDetailedAddress || null,
                wb
              ]);
              enrichedCount++;
            }
          } catch (_) {}
          bulkEnrichProgress.current++;
          bulkEnrichProgress.successCount = enrichedCount;
          bulkEnrichProgress.message = `Meng-enrich waybill: ${bulkEnrichProgress.current} / ${bulkEnrichProgress.total} (${enrichedCount} berhasil)`;
        }));
      }

      bulkEnrichProgress.status = 'success';
      bulkEnrichProgress.message = `Selesai! Berhasil meng-enrich ${enrichedCount} waybill dari JFS.`;
    } catch (err) {
      console.error('bulkEnrichWorker error:', err);
      bulkEnrichProgress.status = 'error';
      bulkEnrichProgress.message = 'Terjadi kesalahan: ' + err.message;
    } finally {
      isBulkEnriching = false;
    }
  })();
}

// 7. Instant Local DB Enrich (PTO + Monitoring Stuck)
async function instantDbEnrich(req, res) {
  try {
    const [resPto] = await db.query(`
      UPDATE gudang_rute_inventory g
      JOIN pto_orders p ON g.waybill = p.waybill
      SET 
        g.nama_barang = COALESCE(NULLIF(g.nama_barang, ''), p.nama_barang),
        g.pengirim = COALESCE(NULLIF(g.pengirim, ''), p.pengirim),
        g.perusahaan_pengirim = COALESCE(NULLIF(g.perusahaan_pengirim, ''), p.perusahaan_pengirim),
        g.no_hp_pengirim = COALESCE(NULLIF(g.no_hp_pengirim, ''), p.nomor_ponsel_pengirim),
        g.penerima = COALESCE(NULLIF(g.penerima, ''), p.penerima),
        g.perusahaan_penerima = COALESCE(NULLIF(g.perusahaan_penerima, ''), p.perusahaan_penerima_paket),
        g.no_hp_penerima = COALESCE(NULLIF(g.no_hp_penerima, ''), p.nomor_handphone_penerima),
        g.alamat_penerima = COALESCE(NULLIF(g.alamat_penerima, ''), p.alamat_lengkap_penerima)
      WHERE (g.nama_barang IS NULL OR g.nama_barang = '')
    `);

    const [resStuck] = await db.query(`
      UPDATE gudang_rute_inventory g
      JOIN monitoring_stuck m ON g.waybill = m.waybill COLLATE utf8mb4_unicode_ci
      SET 
        g.nama_barang = COALESCE(NULLIF(g.nama_barang, ''), m.nama_barang),
        g.pengirim = COALESCE(NULLIF(g.pengirim, ''), m.client_name)
      WHERE (g.nama_barang IS NULL OR g.nama_barang = '') 
        AND (m.nama_barang IS NOT NULL AND m.nama_barang != '')
    `);

    const totalEnriched = (resPto?.affectedRows || 0) + (resStuck?.affectedRows || 0);
    const [totalRes] = await db.query(`
      SELECT COUNT(*) as count 
      FROM gudang_rute_inventory 
      WHERE nama_barang IS NOT NULL AND nama_barang != ''
    `);

    res.json({
      success: true,
      message: `Sinkronisasi database sukses! ${totalEnriched.toLocaleString('id-ID')} waybill diperbarui.`,
      newlyEnriched: totalEnriched,
      totalEnriched: totalRes[0]?.count || 0
    });
  } catch (err) {
    console.error('instantDbEnrich error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getLatestFileInfo,
  getImportStatus,
  importExcelData,
  queryInventory,
  getPodTrace,
  enrichWaybill,
  bulkEnrichWaybills,
  getBulkEnrichStatus,
  instantDbEnrich
};
