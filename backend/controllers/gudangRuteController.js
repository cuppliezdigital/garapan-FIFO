const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const readline = require('readline');
const db = require('../config/db');
const jfsService = require('../services/jfsService');
const auditService = require('../services/auditService');
const ptoController = require('./ptoController');

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

// Calculate duration in hours from scan time string (e.g. '2026-10-26 11:45:16') to now
function calculateDurationHours(scanTimeStr) {
  if (!scanTimeStr) return 0;
  const scanDate = new Date(String(scanTimeStr).replace(' ', 'T'));
  if (isNaN(scanDate.getTime())) return 0;
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - scanDate.getTime());
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
}

// Duration category helper
function getDurationCategory(hours) {
  const h = parseFloat(hours) || 0;
  if (h < 24) return '0-24 Jam';
  if (h < 48) return '24-48 Jam';
  if (h < 72) return '48-72 Jam';
  return '>72 Jam';
}

// Clean Chinese punctuation / trailing commas from unmasked names
function cleanPersonName(name) {
  if (!name) return '';
  return String(name).replace(/[、,，\s]+$/, '').trim();
}

// Fetch POD tracking in batches of 20 to extract holding gateway, status simpan, duration & origin
async function fetchBatchPodTracking(waybillList, token) {
  if (!Array.isArray(waybillList) || waybillList.length === 0) return new Map();
  const podMap = new Map();
  const CHUNK_SIZE = 20;

  for (let i = 0; i < waybillList.length; i += CHUNK_SIZE) {
    const chunk = waybillList.slice(i, i + CHUNK_SIZE);
    try {
      const podRes = await jfsApiRequest(
        'https://jfsgw.jtcargo.co.id/operatingplatform/podTracking/inner/query/keywordList',
        'POST',
        {
          keywordList: chunk,
          trackingTypeEnum: 'WAYBILL',
          countryId: '1'
        },
        token
      );

      if (podRes?.data && Array.isArray(podRes.data)) {
        for (const item of podRes.data) {
          const wb = String(item.billCode || item.keyword || '').trim();
          const scans = item.details || [];
          if (wb && scans.length > 0) {
            // scans[0] is latest scan, scans[scans.length - 1] is origin pickup
            const latest = scans[0];
            const earliest = scans[scans.length - 1];
            const durHours = calculateDurationHours(latest.scanTime);
            podMap.set(wb, {
              holdingGw: latest.scanNetworkName || latest.scanNetworkCode || '',
              statusSimpan: latest.scanTypeName || 'Di Gudang',
              tanggalSimpan: latest.scanTime || '',
              durasiJam: durHours,
              durasiKategori: getDurationCategory(durHours),
              outletAsal: earliest.scanNetworkName || earliest.scanNetworkCode || '',
              deskripsi: latest.waybillTrackingContent || latest.scanDesc || ''
            });
          }
        }
      }
    } catch (e) {
      console.warn('fetchBatchPodTracking chunk warning:', e.message);
    }
  }

  return podMap;
}

// Unmask OMS records via /customerplatform/omsOrderStatus/detail?id=... with routename orderTrackingView
async function unmaskAndEnrichOmsRecords(records, token) {
  if (!Array.isArray(records) || records.length === 0) return;
  const toFetch = records.filter(r => r && r.id);
  if (toFetch.length === 0) return;

  await ptoController.mapConcurrent(toFetch, 10, async (r) => {
    try {
      let detailRes = await ptoController.makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(r.id)}`, 'GET', null, token).catch(() => null);
      if (!detailRes || !detailRes.data || typeof detailRes.data !== 'object') {
        detailRes = await ptoController.makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detailByLog?id=${encodeURIComponent(r.id)}`, 'GET', null, token).catch(() => null);
      }
      if (detailRes && detailRes.data && typeof detailRes.data === 'object') {
        const d = detailRes.data;
        if (d.senderName && !d.senderName.includes('*')) {
          r.senderName = cleanPersonName(d.senderName);
        }
        if (d.receiverName && !d.receiverName.includes('*')) {
          r.receiverName = cleanPersonName(d.receiverName);
        }
        if (d.receiverDetailedAddress && !d.receiverDetailedAddress.includes('****')) {
          r.receiverDetailedAddress = d.receiverDetailedAddress;
        }
        if (d.senderDetailedAddress && !d.senderDetailedAddress.includes('****')) {
          r.senderDetailedAddress = d.senderDetailedAddress;
        }
        if (d.goodsName && (!r.goodsName || r.goodsName === '-')) {
          r.goodsName = d.goodsName;
        }
        if (d.packageChargeWeight) r.packageChargeWeight = d.packageChargeWeight;
        if (d.packageTotalWeight) r.packageTotalWeight = d.packageTotalWeight;
        if (d.packateVolume) r.packateVolume = d.packateVolume;
        if (d.pickNetworkName) r.pickNetworkName = d.pickNetworkName;
        if (d.dispatchNetworkCode) r.dispatchNetworkCode = d.dispatchNetworkCode;
        if (d.terminalDispatchCode) r.terminalDispatchCode = d.terminalDispatchCode;
        if (d.destinationDistributionName) r.destinationDistributionName = d.destinationDistributionName;

        // Auto persist into pto_orders for fast caching
        if (typeof ptoController.autoPersistOrderDetail === 'function') {
          ptoController.autoPersistOrderDetail(d).catch(() => {});
        }
      }
    } catch (_) {}
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

// In-memory cache for global inventory statistics (1.43M rows baseline)
let cachedGlobalStats = {
  totalRows: 1438253,
  totalWeight: 310799946.75,
  totalVolume: 276230.894,
  totalEnriched: 78105,
  totalProblem: 67317,
  avgDuration: 18.5
};
let lastGlobalStatsTime = Date.now();
const GLOBAL_STATS_TTL = 15 * 60 * 1000; // 15 minutes

// 1. Fast info on latest sync and DB status (instant 2ms response time)
async function getLatestFileInfo(req, res) {
  try {
    const [lastSyncRows] = await db.query('SELECT * FROM gudang_rute_sync_logs ORDER BY id DESC LIMIT 1');
    const [batchRes] = await db.query('SELECT batch_time FROM gudang_rute_inventory WHERE batch_time IS NOT NULL AND batch_time != "" ORDER BY id DESC LIMIT 1');

    res.json({
      success: true,
      stats: {
        totalInventory: cachedGlobalStats.totalRows,
        totalEnriched: cachedGlobalStats.totalEnriched,
        latestBatchTime: lastSyncRows[0]?.batch_time || batchRes[0]?.batch_time || '-',
        lastSync: lastSyncRows[0] || null
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
      fileName: (req.body && req.body.manualFileName) || path.basename(targetPath),
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
    const BATCH_SIZE = 2500;
    let totalInserted = 0;
    let isFlushing = false;

    async function flushBuffer() {
      if (buffer.length === 0 || isFlushing) return;
      isFlushing = true;
      const recordsToInsert = buffer;
      buffer = [];

      try {
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
        const elapsedSec = Math.round((Date.now() - startTime) / 1000) || 1;
        const speed = Math.round(totalInserted / elapsedSec);
        importProgress.message = `Mengimpor waybill seluruh Indonesia: ${totalInserted.toLocaleString('id-ID')} waybill (${speed.toLocaleString('id-ID')} baris/dtk, ${elapsedSec}s)...`;
      } catch (insertErr) {
        console.error('Error inserting batch into gudang_rute_inventory:', insertErr.message);
      } finally {
        isFlushing = false;
      }
    }

    rl.on('line', async (line) => {
      if (!line.trim()) return;
      try {
        const item = JSON.parse(line);
        buffer.push([
          item.waybill, item.tanggal_simpan, item.holding_gw, item.status_simpan, item.berat, item.volume, item.is_dfod,
          item.tgl_buka, item.outlet_asal, item.tgl_tiba, item.next_stop, item.gw_asal, item.gw_tujuan, item.outlet_tujuan,
          item.frekuensi_kirim, item.durasi_jam, item.durasi_kategori, item.is_problem, item.status_penangguhan,
          item.rute, item.gw_tujuan_2, item.next_gw, item.outlet_akhir, item.tipe_jalur, item.batch_time
        ]);
        if (buffer.length >= BATCH_SIZE) {
          rl.pause();
          await flushBuffer();
          rl.resume();
        }
      } catch (err) {
        console.error('Error parsing line from excel_stream:', err);
      }
    });

    let stderrText = '';
    py.stderr.on('data', (data) => {
      const msg = data.toString();
      stderrText += msg;
      console.warn('excel_stream.py stderr:', msg);
    });

    py.on('close', async (code) => {
      try {
        if (buffer.length > 0) {
          await flushBuffer();
        }

        if (code !== 0) {
          console.error(`excel_stream.py exited with error code ${code}: ${stderrText}`);
          const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
          await db.query(`
            INSERT INTO gudang_rute_sync_logs (
              filename, batch_time, total_rows, new_count, updated_count,
              enriched_count, duration_seconds, status, message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'error', ?)
          `, [
            targetFile.fileName,
            batchTime,
            totalInserted,
            0,
            totalInserted,
            0,
            durationSec,
            `Gagal sebagian / terhenti (exit code ${code}) setelah ${totalInserted.toLocaleString('id-ID')} waybill (${durationSec} detik): ${stderrText.slice(0, 200)}`
          ]);

          importProgress = {
            status: 'error',
            fileName: targetFile.fileName,
            batchTime,
            totalProcessed: totalInserted,
            message: `Proses impor terhenti (kode ${code}). Berhasil menyimpan ${totalInserted.toLocaleString('id-ID')} waybill.`
          };
          return;
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

        // Auto-trigger background unmasking runner for remaining unenriched waybills
        try {
          const [emptyWbs] = await db.query(`
            SELECT waybill FROM gudang_rute_inventory
            WHERE (nama_barang IS NULL OR nama_barang = '' OR nama_barang = '-')
            LIMIT 50000
          `);
          if (emptyWbs.length > 0) {
            const targets = emptyWbs.map(r => r.waybill);
            startBackgroundEnrichRunner(targets);
            console.log(`[Auto-Enrich] Triggered background unmasking runner for ${targets.length} waybills.`);
          }
        } catch (bgErr) {
          console.warn('Auto background enrich error:', bgErr.message);
        }
      } catch (postErr) {
        console.error('Error during post-import enrichment:', postErr);
        importProgress = {
          status: 'error',
          message: 'Error saat menyimpan data: ' + postErr.message
        };
      } finally {
        if (manualPath && fs.existsSync(manualPath)) {
          try { fs.unlinkSync(manualPath); } catch (_) {}
        }
        isImporting = false;
      }
    });

    py.on('error', (err) => {
      console.error('Error spawning excel_stream.py:', err);
      if (manualPath && fs.existsSync(manualPath)) {
        try { fs.unlinkSync(manualPath); } catch (_) {}
      }
      isImporting = false;
      importProgress = { status: 'error', message: 'Gagal menjalankan streaming python: ' + err.message };
    });
  })();
}

// 2c. Direct File Upload (.xlsx, .csv, .txt)
async function uploadFileGudangData(req, res) {
  if (isImporting) {
    return res.status(409).json({ success: false, message: 'Proses impor sedang berjalan, harap tunggu hingga selesai.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();

  // If TXT file, parse as waybill list or TSV
  if (ext === '.txt') {
    try {
      const rawText = fs.readFileSync(filePath, 'utf8');
      try { fs.unlinkSync(filePath); } catch (_) {}

      req.body = {
        rawText,
        batchTime: req.body?.batchTime || '',
        autoEnrichJfs: req.body?.autoEnrichJfs !== 'false',
        importMode: req.body?.importMode || 'all'
      };
      return pasteImportGudangData(req, res);
    } catch (txtErr) {
      try { fs.unlinkSync(filePath); } catch (_) {}
      return res.status(500).json({ success: false, message: 'Gagal membaca file TXT: ' + txtErr.message });
    }
  }

  // If XLSX or CSV file, stream directly through streaming engine
  if (ext === '.xlsx' || ext === '.csv') {
    req.body = {
      manualPath: filePath,
      manualFileName: originalName,
      filterGw: req.body?.filterGw || 'ALL'
    };
    return importExcelData(req, res);
  }

  try { fs.unlinkSync(filePath); } catch (_) {}
  return res.status(400).json({ success: false, message: 'Format file tidak didukung. Harap unggah file .xlsx, .csv, atau .txt.' });
}

// 2b. Fast Quick Paste & Auto-Enrich Parser
function parseClipboardText(rawText, batchTime = '') {
  if (!rawText || !rawText.trim()) return [];

  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\t' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  const parsedRecords = [];
  const waybillsSet = new Set();

  for (const cols of rows) {
    if (!cols || cols.length === 0) continue;
    const firstCol = cols[0] || '';

    // Check if header row
    if (
      firstCol.includes('运单号') || 
      firstCol.toLowerCase().includes('waybill') || 
      firstCol.toLowerCase().includes('nomor')
    ) {
      continue;
    }

    // Must be a valid waybill (alphanumeric, at least 5 chars)
    const waybill = firstCol.replace(/[^a-zA-Z0-9]/g, '');
    if (!waybill || waybill.length < 5) continue;
    if (waybillsSet.has(waybill)) continue;
    waybillsSet.add(waybill);

    // If single column pasted (just a list of waybills):
    if (cols.length === 1) {
      parsedRecords.push({
        waybill,
        tanggal_simpan: '',
        holding_gw: '',
        status_simpan: '',
        berat: 0,
        volume: 0,
        is_dfod: '',
        tgl_buka: '',
        outlet_asal: '',
        tgl_tiba: '',
        next_stop: '',
        gw_asal: '',
        gw_tujuan: '',
        outlet_tujuan: '',
        frekuensi_kirim: 0,
        durasi_jam: 0,
        durasi_kategori: '',
        is_problem: '',
        status_penangguhan: '',
        rute: '',
        gw_tujuan_2: '',
        next_gw: '',
        outlet_akhir: '',
        tipe_jalur: '',
        batch_time: batchTime
      });
      continue;
    }

    // Multi-column pasted (Standard Feishu / Excel 19+ columns)
    const berat = parseFloat((cols[4] || '0').replace(',', '.')) || 0;
    const vol = parseFloat((cols[5] || '0').replace(',', '.')) || 0;
    const durasi = parseFloat((cols[15] || '0').replace(',', '.')) || 0;
    const freq = parseInt(cols[14] || '0', 10) || 0;

    const gwAsal = cols[11] || '';
    const gwTujuan = cols[12] || '';
    const nextStop = cols[10] || '';
    const outletTujuan = cols[13] || '';

    const rute = cols[19] || (gwAsal && gwTujuan ? `${gwAsal} - ${gwTujuan}` : '');
    const nextGw = cols[22] || (nextStop.startsWith('GW-') ? nextStop : '');
    const outletAkhir = cols[23] || outletTujuan;
    const tipeJalur = cols[26] || (gwAsal && gwTujuan && gwAsal === gwTujuan ? 'Lokal' : 'Antar Gateway');

    parsedRecords.push({
      waybill,
      tanggal_simpan: cols[1] || '',
      holding_gw: cols[2] || '',
      status_simpan: cols[3] || '',
      berat,
      volume: vol,
      is_dfod: cols[6] || '',
      tgl_buka: cols[7] || '',
      outlet_asal: cols[8] || '',
      tgl_tiba: cols[9] || '',
      next_stop: nextStop,
      gw_asal: gwAsal,
      gw_tujuan: gwTujuan,
      outlet_tujuan: outletTujuan,
      frekuensi_kirim: freq,
      durasi_jam: durasi,
      durasi_kategori: cols[18] || '',
      is_problem: cols[16] || '',
      status_penangguhan: cols[17] || '',
      rute,
      gw_tujuan_2: cols[20] || '',
      next_gw: nextGw,
      outlet_akhir: outletAkhir,
      tipe_jalur: tipeJalur,
      batch_time: batchTime
    });
  }

  return parsedRecords;
}

// 2c. Controller: Paste Import & Auto-Enrich
async function pasteImportGudangData(req, res) {
  try {
    const { rawText, batchTime: customBatchTime, autoEnrichJfs = true, importMode = 'all' } = req.body || {};
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Data yang ditempel kosong. Silakan copy data dari Feishu atau Excel lalu tempel di kolom yang disediakan.' });
    }

    const now = new Date();
    const defaultBatchTime = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const batchTime = customBatchTime && customBatchTime.trim() ? customBatchTime.trim() : defaultBatchTime;

    let records = parseClipboardText(rawText, batchTime);
    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada baris waybill yang valid terdeteksi dari teks yang ditempel.' });
    }

    const totalRaw = records.length;
    const allWbs = records.map(r => r.waybill);

    // Fast check existing vs new in database
    const existingWbs = [];
    try {
      const CHUNK = 5000;
      for (let i = 0; i < allWbs.length; i += CHUNK) {
        const [exRows] = await db.query(
          'SELECT waybill FROM gudang_rute_inventory WHERE waybill IN (?)',
          [allWbs.slice(i, i + CHUNK)]
        );
        exRows.forEach(r => existingWbs.push(r.waybill));
      }
    } catch (_) {}

    const existingSet = new Set(existingWbs);
    const existingCount = existingWbs.length;
    const newCount = totalRaw - existingCount;

    // Filter if user specifically selected 'only_new'
    if (importMode === 'only_new') {
      records = records.filter(r => !existingSet.has(r.waybill));
      if (records.length === 0) {
        return res.json({
          success: true,
          message: `Semua ${totalRaw.toLocaleString('id-ID')} waybill yang ditempel sudah ada di database. Tidak ada data baru yang diimpor karena memilih mode 'Hanya Resi Baru'.`,
          totalPasted: totalRaw,
          importedCount: 0,
          newCount: 0,
          existingCount,
          localEnrichedCount: 0,
          jfsEnrichedCount: 0,
          skippedExisting: true
        });
      }
    }

    const startTime = Date.now();
    const waybills = records.map(r => r.waybill);

    // 0. Auto POD Tracking for missing holding_gw (e.g. single-column waybill paste)
    const needsPodTracking = records.filter(r => !r.holding_gw || r.holding_gw.trim() === '' || r.holding_gw === '-');
    if (needsPodTracking.length > 0) {
      try {
        const token = await ptoController.getPtoToken();
        const podWbs = needsPodTracking.map(r => r.waybill);
        const podMap = await fetchBatchPodTracking(podWbs, token);
        for (const r of needsPodTracking) {
          const pod = podMap.get(r.waybill);
          if (pod) {
            if (pod.holdingGw) r.holding_gw = pod.holdingGw;
            if (pod.statusSimpan) r.status_simpan = pod.statusSimpan;
            if (pod.tanggalSimpan) r.tanggal_simpan = pod.tanggalSimpan;
            if (pod.durasiJam !== undefined) r.durasi_jam = pod.durasiJam;
            if (pod.durasiKategori) r.durasi_kategori = pod.durasiKategori;
            if (pod.outletAsal && !r.outlet_asal) r.outlet_asal = pod.outletAsal;
          }
        }
      } catch (podErr) {
        console.warn('pasteImport POD fetch warning:', podErr.message);
      }
    }

    // 1. Bulk insert in chunks of 1,000 with ON DUPLICATE KEY UPDATE (preserves existing enrichments)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const values = chunk.map(item => [
        item.waybill, item.tanggal_simpan, item.holding_gw, item.status_simpan, item.berat, item.volume, item.is_dfod,
        item.tgl_buka, item.outlet_asal, item.tgl_tiba, item.next_stop, item.gw_asal, item.gw_tujuan, item.outlet_tujuan,
        item.frekuensi_kirim, item.durasi_jam, item.durasi_kategori, item.is_problem, item.status_penangguhan,
        item.rute, item.gw_tujuan_2, item.next_gw, item.outlet_akhir, item.tipe_jalur, item.batch_time
      ]);

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
          rute = COALESCE(NULLIF(VALUES(rute), ''), rute),
          gw_tujuan_2 = COALESCE(NULLIF(VALUES(gw_tujuan_2), ''), gw_tujuan_2),
          next_gw = COALESCE(NULLIF(VALUES(next_gw), ''), next_gw),
          outlet_akhir = COALESCE(NULLIF(VALUES(outlet_akhir), ''), outlet_akhir),
          tipe_jalur = COALESCE(NULLIF(VALUES(tipe_jalur), ''), tipe_jalur),
          batch_time = VALUES(batch_time),
          updated_at = NOW()
      `;
      await db.query(sql, [values]);
    }

    // Invalidate dropdown caches so UI immediately sees new gateways
    cachedHoldingGws = null;
    cachedDestGws = null;
    if (cachedGlobalStats) {
      cachedGlobalStats.totalRows += records.length;
    }

    // 2. Fast Instant Local DB Sync (PTO + Monitoring Stuck) for these waybills
    let localEnrichedCount = 0;
    try {
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < waybills.length; i += CHUNK_SIZE) {
        const wbChunk = waybills.slice(i, i + CHUNK_SIZE);

        // Fast index query on PTO orders (<5ms)
        const [ptoMatches] = await db.query(`
          SELECT waybill, nama_barang, pengirim, perusahaan_pengirim, nomor_ponsel_pengirim, penerima, perusahaan_penerima_paket, nomor_handphone_penerima, alamat_lengkap_penerima
          FROM pto_orders
          WHERE waybill IN (?) AND nama_barang IS NOT NULL AND nama_barang != ''
        `, [wbChunk]);

        for (const p of ptoMatches) {
          const [uRes] = await db.query(`
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
            WHERE waybill = ? AND (nama_barang IS NULL OR nama_barang = '')
          `, [
            p.nama_barang, p.pengirim, p.perusahaan_pengirim, p.nomor_ponsel_pengirim,
            p.penerima, p.perusahaan_penerima_paket, p.nomor_handphone_penerima, p.alamat_lengkap_penerima,
            p.waybill
          ]);
          localEnrichedCount += (uRes?.affectedRows || 0);
        }

        // Fast index query on Monitoring Stuck (<5ms)
        const [stuckMatches] = await db.query(`
          SELECT waybill, nama_barang, client_name
          FROM monitoring_stuck
          WHERE waybill IN (?) AND nama_barang IS NOT NULL AND nama_barang != ''
        `, [wbChunk]);

        for (const m of stuckMatches) {
          const [uRes] = await db.query(`
            UPDATE gudang_rute_inventory
            SET 
              nama_barang = COALESCE(NULLIF(nama_barang, ''), ?),
              pengirim = COALESCE(NULLIF(pengirim, ''), ?)
            WHERE waybill = ? AND (nama_barang IS NULL OR nama_barang = '')
          `, [m.nama_barang, m.client_name, m.waybill]);
          localEnrichedCount += (uRes?.affectedRows || 0);
        }
      }
    } catch (dbSyncErr) {
      console.warn('pasteImport local DB sync warning:', dbSyncErr.message);
    }

    // 3. Find waybills still lacking goodsName, containing asterisks, or missing gateway info
    const [unenrichedRows] = await db.query(`
      SELECT waybill 
      FROM gudang_rute_inventory 
      WHERE waybill IN (?) 
        AND (
          nama_barang IS NULL OR nama_barang = '' OR nama_barang = '-' OR
          penerima LIKE '%*%' OR pengirim LIKE '%*%' OR alamat_penerima LIKE '%*%' OR
          gw_tujuan IS NULL OR gw_tujuan = '' OR
          holding_gw IS NULL OR holding_gw = '' OR holding_gw = '-'
        )
    `, [waybills]);

    const remainingUnenriched = unenrichedRows.map(r => r.waybill);
    let jfsEnrichedCount = 0;
    let backgroundTriggered = false;

    // 4. JFS OMS Auto-Enrichment & Unmasking if requested
    if (autoEnrichJfs && remainingUnenriched.length > 0) {
      if (remainingUnenriched.length <= 100) {
        // Fast path: In-flight OMS query (completes in ~500ms - 1.2s for up to 50 resi)
        try {
          const token = await ptoController.getPtoToken();
          const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const omsNow = new Date();

          for (let i = 0; i < remainingUnenriched.length; i += 20) {
            const rawChunk = remainingUnenriched.slice(i, i + 20);
            const mainWbs = [...new Set(rawChunk.map(w => extractMainWaybill(w)).filter(Boolean))];
            if (mainWbs.length === 0) continue;

            const payload = {
              siteCode: 'JKT99A',
              startDate: past90.toISOString().slice(0, 10) + ' 00:00:00',
              endDate: omsNow.toISOString().slice(0, 10) + ' 23:59:59',
              p_billType: 1,
              p_billNo: mainWbs.join(','),
              current: 1,
              size: 50,
              lowerSiteQuery: true,
              countryId: '1'
            };

            const omsRes = await ptoController.makeJfsPtoRequest(
              '/customerplatform/omsOrderStatus/statusQuery',
              'POST',
              JSON.stringify(payload),
              token
            ).catch(() => null);

            const records = omsRes?.data?.records || [];

            // UNMASK sender, receiver, and address via OMS detail (no asterisks!)
            await unmaskAndEnrichOmsRecords(records, token);

            for (const r of records) {
              if (!r.waybillId) continue;
              const gName = r.goodsName || r.goodsTypeName || null;
              if (gName || (r.senderName && !r.senderName.includes('*')) || (r.receiverName && !r.receiverName.includes('*'))) {
                await db.query(`
                  UPDATE gudang_rute_inventory
                  SET 
                    nama_barang = COALESCE(NULLIF(?, ''), nama_barang),
                    pengirim = COALESCE(NULLIF(?, ''), pengirim),
                    perusahaan_pengirim = COALESCE(NULLIF(?, ''), perusahaan_pengirim),
                    no_hp_pengirim = COALESCE(NULLIF(?, ''), no_hp_pengirim),
                    penerima = COALESCE(NULLIF(?, ''), penerima),
                    perusahaan_penerima = COALESCE(NULLIF(?, ''), perusahaan_penerima),
                    no_hp_penerima = COALESCE(NULLIF(?, ''), no_hp_penerima),
                    alamat_penerima = COALESCE(NULLIF(?, ''), alamat_penerima),
                    outlet_asal = COALESCE(NULLIF(outlet_asal, ''), ?),
                    outlet_tujuan = COALESCE(NULLIF(outlet_tujuan, ''), ?),
                    outlet_akhir = COALESCE(NULLIF(outlet_akhir, ''), ?),
                    gw_asal = COALESCE(NULLIF(gw_asal, ''), ?),
                    gw_tujuan = COALESCE(NULLIF(gw_tujuan, ''), ?),
                    tgl_buka = COALESCE(NULLIF(tgl_buka, ''), ?),
                    berat = CASE WHEN berat = 0 OR berat IS NULL THEN ? ELSE berat END,
                    volume = CASE WHEN volume = 0 OR volume IS NULL THEN ? ELSE volume END
                  WHERE waybill = ? OR waybill LIKE ?
                `, [
                  gName,
                  cleanPersonName(r.senderName || ''),
                  r.senderCompany || r.customerName || '',
                  r.senderMobilePhone || r.senderTelphone || '',
                  cleanPersonName(r.receiverName || ''),
                  r.receiverCompany || '',
                  r.receiverMobilePhone || r.receiverTelphone || '',
                  r.receiverDetailedAddress || '',
                  r.pickNetworkName || r.realPickNetworkName || '',
                  r.dispatchNetworkCode || r.dispatchNetworkName || (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? r.terminalDispatchCode.split('-')[1].trim() : ''),
                  r.dispatchNetworkCode || (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? r.terminalDispatchCode.split('-')[1].trim() : ''),
                  r.proxyAreaName ? ('GW-' + r.proxyAreaName) : '',
                  r.destinationDistributionName ? ('GW-' + r.destinationDistributionName.replace(/^GW-/, '')) : (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? ('GW-' + r.terminalDispatchCode.split('-')[0].trim()) : ''),
                  r.customerOrderTime || r.inputTime || '',
                  parseFloat(r.packageChargeWeight || r.packageTotalWeight || 0),
                  parseFloat(r.packateVolume || 0),
                  r.waybillId,
                  r.waybillId + '%'
                ]);
                jfsEnrichedCount++;
              }
            }
          }

          // Safety check: ensure any waybill with missing holding_gw or 0 durasi is resolved via POD
          try {
            const [stillNeedPod] = await db.query(`
              SELECT waybill FROM gudang_rute_inventory
              WHERE waybill IN (?) AND (holding_gw IS NULL OR holding_gw = '' OR holding_gw = '-' OR durasi_jam = 0)
            `, [waybills]);
            if (stillNeedPod.length > 0) {
              const podMap = await fetchBatchPodTracking(stillNeedPod.map(r => r.waybill), token);
              for (const [wb, pod] of podMap.entries()) {
                await db.query(`
                  UPDATE gudang_rute_inventory
                  SET 
                    holding_gw = COALESCE(NULLIF(?, ''), holding_gw),
                    status_simpan = COALESCE(NULLIF(?, ''), status_simpan),
                    tanggal_simpan = COALESCE(NULLIF(?, ''), tanggal_simpan),
                    durasi_jam = CASE WHEN durasi_jam = 0 THEN ? ELSE durasi_jam END,
                    durasi_kategori = COALESCE(NULLIF(?, ''), durasi_kategori),
                    outlet_asal = COALESCE(NULLIF(outlet_asal, ''), ?)
                  WHERE waybill = ? OR waybill LIKE ?
                `, [
                  pod.holdingGw, pod.statusSimpan, pod.tanggalSimpan, pod.durasiJam, pod.durasiKategori, pod.outletAsal, wb, wb + '%'
                ]);
              }
            }
          } catch (_) {}

        } catch (omsErr) {
          console.warn('pasteImport in-flight OMS error:', omsErr.message);
        }
      } else {
        // High count: Trigger background worker for remaining unenriched waybills
        backgroundTriggered = true;
        startBackgroundEnrichRunner(remainingUnenriched);
      }
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    // 5. Log sync operation to database
    try {
      await db.query(`
        INSERT INTO gudang_rute_sync_logs (
          filename, batch_time, total_rows, new_count, updated_count, enriched_count, duration_seconds, status, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `Quick Paste (${records.length.toLocaleString('id-ID')} Resi)`,
        batchTime,
        records.length,
        records.length,
        0,
        localEnrichedCount + jfsEnrichedCount,
        durationSec,
        'success',
        `Quick Paste selesai. ${localEnrichedCount} ter-enrich database lokal, ${jfsEnrichedCount} dari OMS.`
      ]);
    } catch (_) {}

    if (cachedGlobalStats) {
      cachedGlobalStats.totalEnriched += (localEnrichedCount + jfsEnrichedCount);
    }

    // Fetch preview rows of the pasted waybills
    let previewRows = [];
    try {
      const [pRows] = await db.query(`
        SELECT waybill, nama_barang, pengirim, penerima, berat, volume, holding_gw, status_simpan, durasi_jam
        FROM gudang_rute_inventory
        WHERE waybill IN (?)
        LIMIT 100
      `, [waybills.slice(0, 100)]);
      previewRows = pRows || [];
    } catch (_) {}

    res.json({
      success: true,
      message: importMode === 'only_new'
        ? `Berhasil mengimpor ${records.length.toLocaleString('id-ID')} waybill baru (${existingCount.toLocaleString('id-ID')} resi lama dilewati) dalam ${durationSec} detik!`
        : `Berhasil memproses ${totalRaw.toLocaleString('id-ID')} waybill (${newCount.toLocaleString('id-ID')} baru, ${existingCount.toLocaleString('id-ID')} diperbarui) dalam ${durationSec} detik!`,
      totalPasted: totalRaw,
      importedCount: records.length,
      newCount,
      existingCount,
      importMode,
      localEnrichedCount,
      jfsEnrichedCount,
      totalEnriched: localEnrichedCount + jfsEnrichedCount,
      backgroundTriggered,
      remainingUnenriched: remainingUnenriched.length - jfsEnrichedCount,
      batchTime,
      previewRows,
      pastedWaybills: waybills
    });

  } catch (error) {
    console.error('pasteImportGudangData error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengimpor data tempel: ' + error.message });
  }
}

// 2d. Controller: Fast Live Check Existing vs New Waybills for Quick Paste
async function checkExistingWaybills(req, res) {
  try {
    const { waybills } = req.body || {};
    if (!Array.isArray(waybills) || waybills.length === 0) {
      return res.json({
        success: true,
        totalChecked: 0,
        existingCount: 0,
        newCount: 0,
        existingWaybills: [],
        newWaybills: []
      });
    }

    // Deduplicate and sanitize
    const cleanList = [...new Set(waybills.map(w => String(w).trim()).filter(Boolean))].slice(0, 10000);
    if (cleanList.length === 0) {
      return res.json({
        success: true,
        totalChecked: 0,
        existingCount: 0,
        newCount: 0,
        existingWaybills: [],
        newWaybills: []
      });
    }

    // Fast indexed query
    const foundWaybills = [];
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < cleanList.length; i += CHUNK_SIZE) {
      const chunk = cleanList.slice(i, i + CHUNK_SIZE);
      const [rows] = await db.query(
        'SELECT waybill FROM gudang_rute_inventory WHERE waybill IN (?)',
        [chunk]
      );
      rows.forEach(r => foundWaybills.push(r.waybill));
    }

    const existingSet = new Set(foundWaybills);
    const newWaybills = cleanList.filter(w => !existingSet.has(w));

    res.json({
      success: true,
      totalChecked: cleanList.length,
      existingCount: foundWaybills.length,
      newCount: newWaybills.length,
      existingWaybills: foundWaybills,
      newWaybills: newWaybills
    });
  } catch (error) {
    console.error('checkExistingWaybills error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}


// In-memory cache for holdingGateways & destGateways (avoids 2 heavy DISTINCT queries on 1.4M rows per keystroke)
let cachedHoldingGws = null;
let cachedDestGws = null;
let lastDropdownCacheTime = 0;
const DROPDOWN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getCachedDropdowns() {
  const now = Date.now();
  if (cachedHoldingGws && cachedDestGws && (now - lastDropdownCacheTime < DROPDOWN_CACHE_TTL)) {
    return { holdingGws: cachedHoldingGws, destGws: cachedDestGws };
  }
  try {
    const [hRows] = await db.query('SELECT DISTINCT holding_gw FROM gudang_rute_inventory WHERE holding_gw IS NOT NULL AND holding_gw != "" ORDER BY holding_gw ASC LIMIT 100');
    const [dRows] = await db.query('SELECT DISTINCT gw_tujuan FROM gudang_rute_inventory WHERE gw_tujuan IS NOT NULL AND gw_tujuan != "" ORDER BY gw_tujuan ASC LIMIT 100');
    cachedHoldingGws = hRows.map(x => x.holding_gw);
    cachedDestGws = dRows.map(x => x.gw_tujuan);
    lastDropdownCacheTime = now;
  } catch (err) {
    console.warn('getCachedDropdowns error:', err.message);
    if (!cachedHoldingGws) cachedHoldingGws = [];
    if (!cachedDestGws) cachedDestGws = [];
  }
  return { holdingGws: cachedHoldingGws, destGws: cachedDestGws };
}

// Helper to format search words for MySQL FULLTEXT boolean search (+word*)
function formatFulltextQuery(queryStr) {
  if (!queryStr || typeof queryStr !== 'string') return '';
  const cleaned = queryStr.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return '';
  return words.map(w => `+${w}*`).join(' ');
}

// 3. Query inventory with filters and pagination
async function queryInventory(req, res) {
  try {
    const {
      search = '',
      col_waybill = '',
      col_nama_barang = '',
      col_pengirim = '',
      col_penerima = '',
      col_alamat = '',
      col_asal = '',
      col_tujuan = '',
      col_holding_gw = '',
      col_rute = '',
      col_durasi_min = '',
      col_durasi_max = '',
      col_status = '',
      operational_status = 'active',
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

    const rawLimit = (req.body && (req.body.limit || req.body.pageSize)) || limit || 50;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(rawLimit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['1=1'];
    const params = [];

    // Operational status filter (Default: 'active' packages in warehouse/transit)
    // When user searches a specific waybill number or waybill list, allow finding it across all statuses
    const isWaybillTargeted = Boolean((col_waybill && col_waybill.trim()) || (/^\d{6,15}$/.test(search.trim())));
    if (!isWaybillTargeted) {
      if (operational_status === 'active') {
        conditions.push("(g.status_simpan IS NULL OR g.status_simpan NOT IN ('Tanda Terima', 'TTD', 'TTD Pengembalian'))");
      } else if (operational_status === 'ttd') {
        conditions.push("g.status_simpan IN ('Tanda Terima', 'TTD', 'TTD Pengembalian')");
      }
    }

    // Helper to process multi-token waybills (supports newline, comma, semicolon, space)
    function parseWaybillFilter(inputStr) {
      if (!inputStr || !inputStr.trim()) return null;
      const tokens = inputStr.split(/[\r\n,;\s]+/).map(s => s.trim()).filter(Boolean);
      if (tokens.length === 0) return null;

      const exacts = [];
      const wildcards = [];
      tokens.forEach(t => {
        if (t.includes('*')) {
          wildcards.push(t.replace(/\*/g, '%'));
        } else {
          exacts.push(t);
        }
      });

      const subConds = [];
      const subParams = [];
      if (exacts.length === 1) {
        const raw = exacts[0];
        if (/^\d{8,15}$/.test(raw)) {
          subConds.push('(g.waybill = ? OR g.waybill LIKE ?)');
          subParams.push(raw, `${raw}%`);
        } else if (/^\d{3,7}$/.test(raw)) {
          subConds.push('g.waybill LIKE ?');
          subParams.push(`${raw}%`);
        } else {
          subConds.push('g.waybill LIKE ?');
          subParams.push(`%${raw}%`);
        }
      } else if (exacts.length > 1) {
        subConds.push('g.waybill IN (?)');
        subParams.push(exacts);
      }
      wildcards.forEach(w => {
        subConds.push('g.waybill LIKE ?');
        subParams.push(w);
      });

      if (subConds.length === 0) return null;
      return { clause: `(${subConds.join(' OR ')})`, params: subParams };
    }

    // 1. Generic Search (with multi-waybill paste detection)
    if (search && search.trim()) {
      const q = search.trim();
      const tokens = q.split(/[\r\n,;\s]+/).map(s => s.trim()).filter(Boolean);
      
      // If multiple tokens and they look like waybills/numbers, do multi-waybill search
      if (tokens.length > 1 && tokens.every(t => /^[0-9A-Za-z*]{5,}$/.test(t))) {
        const wbFilter = parseWaybillFilter(q);
        if (wbFilter) {
          conditions.push(wbFilter.clause);
          params.push(...wbFilter.params);
        }
      } else if (/^\d{6,15}$/.test(q)) {
        // Pure waybill number (or piece barcode): Index exact or prefix match (10-20ms)
        conditions.push('(g.waybill = ? OR g.waybill LIKE ?)');
        params.push(q, `${q}%`);
      } else if (/^\d{3,5}$/.test(q)) {
        // Waybill prefix (e.g. 2018 or 570): Index prefix match (15-30ms)
        conditions.push('g.waybill LIKE ?');
        params.push(`${q}%`);
      } else if (q.includes('*')) {
        const pattern = q.replace(/\*/g, '%');
        conditions.push('(g.waybill LIKE ? OR g.nama_barang LIKE ?)');
        params.push(pattern, pattern);
      } else {
        const ft = formatFulltextQuery(q);
        if (ft) {
          conditions.push('MATCH(g.nama_barang, g.pengirim, g.penerima, g.alamat_penerima) AGAINST(? IN BOOLEAN MODE)');
          params.push(ft);
        } else {
          conditions.push(`(
            g.nama_barang LIKE ? OR 
            g.pengirim LIKE ? OR 
            g.perusahaan_pengirim LIKE ? OR 
            g.penerima LIKE ? OR 
            g.perusahaan_penerima LIKE ? OR
            g.outlet_tujuan LIKE ?
          )`);
          const searchPattern = `%${q}%`;
          params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }
      }
    }

    // 2. Specific Per-Column Filter: Waybill (Multi-waybill support)
    if (col_waybill && col_waybill.trim()) {
      const wbFilter = parseWaybillFilter(col_waybill);
      if (wbFilter) {
        conditions.push(wbFilter.clause);
        params.push(...wbFilter.params);
      }
    }

    // 3. Per-Column Filter: Nama Barang (Full-text index)
    if (col_nama_barang && col_nama_barang.trim()) {
      const ft = formatFulltextQuery(col_nama_barang);
      if (ft) {
        conditions.push('MATCH(g.nama_barang) AGAINST(? IN BOOLEAN MODE)');
        params.push(ft);
      } else {
        const tokens = col_nama_barang.split('|').map(s => s.trim()).filter(Boolean);
        if (tokens.length > 0) {
          const subConds = tokens.map(() => 'g.nama_barang LIKE ?');
          conditions.push(`(${subConds.join(' OR ')})`);
          tokens.forEach(t => params.push(`%${t}%`));
        }
      }
    }

    // 4. Per-Column Filter: Pengirim & Toko (Full-text index)
    if (col_pengirim && col_pengirim.trim()) {
      const ft = formatFulltextQuery(col_pengirim);
      if (ft) {
        conditions.push('MATCH(g.pengirim) AGAINST(? IN BOOLEAN MODE)');
        params.push(ft);
      } else {
        const p = `%${col_pengirim.trim()}%`;
        conditions.push('(g.pengirim LIKE ? OR g.perusahaan_pengirim LIKE ? OR g.no_hp_pengirim LIKE ?)');
        params.push(p, p, p);
      }
    }

    // 5. Per-Column Filter: Penerima & HP (Full-text index)
    if (col_penerima && col_penerima.trim()) {
      const ft = formatFulltextQuery(col_penerima);
      if (ft) {
        conditions.push('MATCH(g.penerima) AGAINST(? IN BOOLEAN MODE)');
        params.push(ft);
      } else {
        const p = `%${col_penerima.trim()}%`;
        conditions.push('(g.penerima LIKE ? OR g.perusahaan_penerima LIKE ? OR g.no_hp_penerima LIKE ?)');
        params.push(p, p, p);
      }
    }

    // 6. Per-Column Filter: Alamat Penerima (Full-text index)
    if (col_alamat && col_alamat.trim()) {
      const ft = formatFulltextQuery(col_alamat);
      if (ft) {
        conditions.push('MATCH(g.alamat_penerima) AGAINST(? IN BOOLEAN MODE)');
        params.push(ft);
      } else {
        conditions.push('g.alamat_penerima LIKE ?');
        params.push(`%${col_alamat.trim()}%`);
      }
    }

    // 6b. Per-Column Filter: Asal (GW Asal & Outlet Asal)
    if (col_asal && col_asal.trim()) {
      const p = `%${col_asal.trim()}%`;
      conditions.push('(g.gw_asal LIKE ? OR g.outlet_asal LIKE ?)');
      params.push(p, p);
    }

    // 6c. Per-Column Filter: Tujuan (GW Tujuan, Outlet Tujuan & Akhir)
    if (col_tujuan && col_tujuan.trim()) {
      const p = `%${col_tujuan.trim()}%`;
      conditions.push('(g.gw_tujuan LIKE ? OR g.outlet_tujuan LIKE ? OR g.outlet_akhir LIKE ? OR g.gw_tujuan_2 LIKE ?)');
      params.push(p, p, p, p);
    }

    // 6d. Per-Column Filter: Holding Gateway
    if (col_holding_gw && col_holding_gw.trim()) {
      conditions.push('g.holding_gw LIKE ?');
      params.push(`%${col_holding_gw.trim()}%`);
    }

    // 6e. Per-Column Filter: Status (Problem / Normal)
    if (col_status === 'ya') {
      conditions.push("(g.is_problem = 'ya' OR g.is_problem = '1')");
    } else if (col_status === 'tidak') {
      conditions.push("(g.is_problem IS NULL OR (g.is_problem != 'ya' AND g.is_problem != '1'))");
    }

    // 7. Per-Column Filter: Rute & Outlet Tujuan
    if (col_rute && col_rute.trim()) {
      const p = `%${col_rute.trim()}%`;
      conditions.push('(g.rute LIKE ? OR g.outlet_tujuan LIKE ? OR g.gw_tujuan LIKE ? OR g.outlet_asal LIKE ?)');
      params.push(p, p, p, p);
    }

    // 8. Per-Column Filter: Durasi Jam Range (Min & Max)
    if (col_durasi_min !== '' && col_durasi_min !== null && !isNaN(Number(col_durasi_min))) {
      conditions.push('g.durasi_jam >= ?');
      params.push(Number(col_durasi_min));
    }
    if (col_durasi_max !== '' && col_durasi_max !== null && !isNaN(Number(col_durasi_max))) {
      conditions.push('g.durasi_jam <= ?');
      params.push(Number(col_durasi_max));
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

    // Fast-path: If no specific filter active (whereClause is '1=1'), reuse cached global stats (0ms)
    const isUnfiltered = (conditions.length === 1 && conditions[0] === '1=1');
    let statsPromise;
    if (isUnfiltered) {
      statsPromise = Promise.resolve([[cachedGlobalStats]]);
    } else {
      // Filtered query: Run fast subquery capped COUNT to avoid freezing 1.4M rows
      const fastCountSql = `SELECT COUNT(*) as totalRows FROM (SELECT g.id FROM gudang_rute_inventory g WHERE ${whereClause} LIMIT 1001) as sub`;
      statsPromise = db.query(fastCountSql, params).then(([res]) => {
        return [res];
      });
    }

    // Concurrently run Data Query, Stats Query, and get Cached Dropdowns in PARALLEL
    const [[rows], [statsRes], dropdowns] = await Promise.all([
      db.query(dataSql, [...params, limitNum, offset]),
      statsPromise,
      getCachedDropdowns()
    ]);

    const stats = isUnfiltered ? { ...cachedGlobalStats } : {
      totalRows: statsRes[0]?.totalRows || 0,
      totalWeight: 0,
      totalVolume: 0,
      totalEnriched: 0,
      totalProblem: 0,
      avgDuration: 0
    };

    // If filtered and rows are returned, compute metrics from page rows (exact if totalRows <= rows.length, or extrapolated)
    if (!isUnfiltered && rows && rows.length > 0) {
      const pageWeight = rows.reduce((acc, r) => acc + (parseFloat(r.berat) || 0), 0);
      const pageVol = rows.reduce((acc, r) => acc + (parseFloat(r.volume) || 0), 0);
      const pageEnriched = rows.filter(r => r.nama_barang && r.nama_barang.trim()).length;
      const pageProblem = rows.filter(r => r.is_problem === 'ya' || r.is_problem === '1').length;
      const pageDurasi = rows.reduce((acc, r) => acc + (parseFloat(r.durasi_jam) || 0), 0) / rows.length;

      const ratio = stats.totalRows <= rows.length ? 1 : (stats.totalRows / rows.length);
      stats.totalWeight = (pageWeight * ratio).toFixed(2);
      stats.totalVolume = (pageVol * ratio).toFixed(4);
      stats.totalEnriched = Math.round(pageEnriched * ratio);
      stats.totalProblem = Math.round(pageProblem * ratio);
      stats.avgDuration = pageDurasi.toFixed(1);
    }

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
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
      holdingGateways: dropdowns.holdingGws,
      destGateways: dropdowns.destGws
    });
  } catch (error) {
    console.error('queryInventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}


// Helper to extract 12-digit main waybill from a 15-digit piece barcode
function extractMainWaybill(waybill) {
  if (!waybill) return '';
  const clean = String(waybill).trim();
  if (clean.length === 15 && /^\d+$/.test(clean)) {
    return clean.slice(0, 12);
  }
  return clean;
}

// Multi-tier resolver for waybill details:
// Tier 1: Local pto_orders table (56,000+ orders with full unmasked customer & goods details)
// Tier 2: Local monitoring_stuck table (12,000+ waybills with goods name & client)
// Tier 3: Live JFS OMS via ptoController.getOrderDetail (unthrottled, unmasked, auto-persists to pto_orders)
async function resolveWaybillInfo(rawWaybill) {
  if (!rawWaybill) return null;
  const cleanWb = String(rawWaybill).trim();
  const mainWb = extractMainWaybill(cleanWb);

  // 1. Check local pto_orders
  try {
    const [ptoRows] = await db.query(
      'SELECT * FROM pto_orders WHERE waybill IN (?, ?) LIMIT 1',
      [cleanWb, mainWb]
    );
    if (ptoRows && ptoRows.length > 0) {
      const p = ptoRows[0];
      const hasGoods = p.nama_barang && p.nama_barang.trim() !== '' && p.nama_barang !== '-';
      const hasPerson = (p.penerima && p.penerima.trim() !== '' && p.penerima !== '-') ||
                        (p.pengirim && p.pengirim.trim() !== '' && p.pengirim !== '-');
      if (hasGoods || hasPerson) {
        return {
          source: 'pto_orders',
          goodsName: p.nama_barang || p.jenis_barang || '',
          senderName: p.pengirim || '',
          senderCompany: p.perusahaan_pengirim || '',
          senderPhone: p.nomor_ponsel_pengirim || '',
          receiverName: p.penerima || '',
          receiverCompany: p.perusahaan_penerima_paket || '',
          receiverPhone: p.nomor_handphone_penerima || '',
          receiverAddress: p.alamat_lengkap_penerima || ''
        };
      }
    }
  } catch (err) {
    console.warn('pto_orders lookup warning:', err.message);
  }

  // 2. Check local monitoring_stuck
  try {
    const [stuckRows] = await db.query(
      'SELECT waybill, nama_barang, client_name FROM monitoring_stuck WHERE waybill COLLATE utf8mb4_unicode_ci IN (?, ?) LIMIT 1',
      [cleanWb, mainWb]
    );
    if (stuckRows && stuckRows.length > 0) {
      const s = stuckRows[0];
      if ((s.nama_barang && s.nama_barang.trim()) || (s.client_name && s.client_name.trim())) {
        return {
          source: 'monitoring_stuck',
          goodsName: s.nama_barang || '',
          senderName: s.client_name || '',
          senderCompany: '',
          senderPhone: '',
          receiverName: '',
          receiverCompany: '',
          receiverPhone: '',
          receiverAddress: ''
        };
      }
    }
  } catch (err) {
    console.warn('monitoring_stuck lookup warning:', err.message);
  }

  // 3. Query JFS OMS via ptoController.getOrderDetail (unthrottled, unmasked)
  return new Promise((resolve) => {
    const fakeReq = { params: { id: mainWb } };
    let done = false;

    const fakeRes = {
      json: (payload) => {
        if (done) return;
        done = true;
        if (payload && payload.success && payload.data) {
          const d = payload.data;
          const bestGoods = d.goodsName || d.goodsTypeName || d.remarks || '';
          resolve({
            source: payload.fromPtoDb ? 'pto_orders' : 'jfs_oms',
            goodsName: bestGoods,
            senderName: d.senderName || '',
            senderCompany: d.senderCompany || d.senderCompanyName || d.customerName || '',
            senderPhone: d.senderMobilePhone || d.senderTelphone || d.senderMobile || '',
            receiverName: d.receiverName || '',
            receiverCompany: d.receiverCompany || d.receiverCompanyName || '',
            receiverPhone: d.receiverMobilePhone || d.receiverTelphone || d.receiverMobile || '',
            receiverAddress: d.receiverDetailedAddress || ''
          });
        } else {
          resolve(null);
        }
      },
      status: () => fakeRes
    };

    try {
      ptoController.getOrderDetail(fakeReq, fakeRes).catch((err) => {
        if (!done) {
          done = true;
          console.warn('getOrderDetail catch warning:', err.message);
          resolve(null);
        }
      });
    } catch (callErr) {
      if (!done) {
        done = true;
        console.warn('getOrderDetail exception:', callErr.message);
        resolve(null);
      }
    }

    setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, 12000);
  });
}

// 4. Get POD Trace (100% matches screenshot!)
async function getPodTrace(req, res) {
  try {
    const waybillNo = (req.params?.waybill || req.body?.waybillNo || req.body?.waybill || req.query?.waybillNo || req.query?.waybill || '').trim();
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

    // Check if JFS session token has expired on J&T Cargo server
    const isTokenExpired = Boolean(
      (keywordListRes && keywordListRes.code === 401) ||
      (dynamicRouteRes && dynamicRouteRes.code === 401) ||
      (actualRouteRes && actualRouteRes.code === 401) ||
      (keywordListRes && keywordListRes.msg && (keywordListRes.msg.includes('重新登录') || keywordListRes.msg.includes('401')))
    );

    // Fetch local waybill details from database as immediate fallback
    let localInfo = null;
    try {
      const [localRows] = await db.query(`
        SELECT 
          g.waybill, g.holding_gw, g.rute, g.status_simpan, g.tanggal_simpan, g.tgl_tiba, g.tgl_buka,
          g.outlet_asal, g.outlet_tujuan, g.gw_asal, g.gw_tujuan, g.berat, g.volume,
          COALESCE(NULLIF(g.nama_barang, ''), p.nama_barang) AS nama_barang,
          COALESCE(NULLIF(g.pengirim, ''), p.pengirim) AS pengirim,
          COALESCE(NULLIF(g.penerima, ''), p.penerima) AS penerima,
          COALESCE(NULLIF(g.alamat_penerima, ''), p.alamat_lengkap_penerima) AS alamat_penerima
        FROM gudang_rute_inventory g
        LEFT JOIN pto_orders p ON g.waybill = p.waybill
        WHERE g.waybill = ? OR g.waybill LIKE ?
        LIMIT 1
      `, [waybillNo, waybillNo + '%']);
      localInfo = localRows[0] || null;
    } catch (_) {}

    // Fallback routes from local database if live API was blocked
    if (!dynamicRouteString && localInfo) {
      if (localInfo.gw_asal && localInfo.gw_tujuan) {
        dynamicRouteString = `${localInfo.gw_asal} → ${localInfo.holding_gw || localInfo.gw_tujuan} → ${localInfo.outlet_tujuan || localInfo.gw_tujuan}`;
      } else if (localInfo.rute) {
        dynamicRouteString = localInfo.rute;
      }
    }
    if (!plannedRouteString && localInfo?.rute) {
      plannedRouteString = localInfo.rute;
    }

    const payloadData = {
      waybillNo,
      tokenExpired: isTokenExpired,
      localInfo,
      routes: {
        dynamicRoute: dynamicRouteString || localInfo?.rute || '-',
        plannedRoute: plannedRouteString || localInfo?.rute || '-',
        actualRoute: actualRouteString || (localInfo?.holding_gw ? `Saat ini di ${localInfo.holding_gw}` : '-'),
        returnRoute: returnRouteString || '-'
      },
      scans: scanItems,
      abnormalScans: abnormalRes?.data?.records || abnormalRes?.data || [],
      abnormalList: abnormalRes?.data?.records || abnormalRes?.data || [],
      orderDetail: orderDetailRes?.data || null
    };

    res.json({
      success: true,
      tokenExpired: isTokenExpired,
      message: isTokenExpired 
        ? 'Sesi Token JFS telah kedaluwarsa (HTTP 401). Silakan perbarui Auth Token agar live 18-step scan POD dapat diambil dari J&T Cargo.' 
        : 'Berhasil memuat jejak POD',
      data: payloadData,
      ...payloadData
    });
  } catch (error) {
    console.error('getPodTrace error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// 5. Enrich single waybill using Multi-Tier Resolver
async function enrichWaybill(req, res) {
  try {
    const rawWaybill = (req.body?.waybillNo || req.body?.waybill || req.body?.id || '').trim();
    if (!rawWaybill) {
      return res.status(400).json({ success: false, message: 'Nomor waybill wajib diisi' });
    }

    const resolved = await resolveWaybillInfo(rawWaybill);
    if (!resolved || (!resolved.goodsName && !resolved.senderName && !resolved.receiverName)) {
      return res.status(404).json({
        success: false,
        message: 'Data rincian barang & customer belum ditemukan di JFS PTO / OMS untuk resi ini.'
      });
    }

    const mainWb = extractMainWaybill(rawWaybill);
    await db.query(`
      UPDATE gudang_rute_inventory
      SET 
        nama_barang = COALESCE(NULLIF(?, ''), nama_barang),
        pengirim = COALESCE(NULLIF(?, ''), pengirim),
        perusahaan_pengirim = COALESCE(NULLIF(?, ''), perusahaan_pengirim),
        no_hp_pengirim = COALESCE(NULLIF(?, ''), no_hp_pengirim),
        penerima = COALESCE(NULLIF(?, ''), penerima),
        perusahaan_penerima = COALESCE(NULLIF(?, ''), perusahaan_penerima),
        no_hp_penerima = COALESCE(NULLIF(?, ''), no_hp_penerima),
        alamat_penerima = COALESCE(NULLIF(?, ''), alamat_penerima)
      WHERE waybill = ? OR (LENGTH(waybill) = 15 AND LEFT(waybill, 12) = ?)
    `, [
      resolved.goodsName || '',
      resolved.senderName || '',
      resolved.senderCompany || '',
      resolved.senderPhone || '',
      resolved.receiverName || '',
      resolved.receiverCompany || '',
      resolved.receiverPhone || '',
      resolved.receiverAddress || '',
      rawWaybill,
      mainWb
    ]);

    res.json({
      success: true,
      message: `Berhasil memperkaya rincian barang dari ${resolved.source}!`,
      data: {
        waybill: rawWaybill,
        goodsName: resolved.goodsName,
        senderName: resolved.senderName,
        receiverName: resolved.receiverName,
        receiverAddress: resolved.receiverAddress,
        source: resolved.source
      }
    });
  } catch (error) {
    console.error('enrichWaybill error:', error);
    res.status(500).json({ success: false, message: error.message, error: error.message });
  }
}

// 6. Bulk Enrich Worker (Blazing Fast 20-Waybill Batching + Background Runner for All)
let isBulkEnriching = false;
let bulkEnrichProgress = { current: 0, total: 0, successCount: 0, status: 'idle', message: '' };

async function getBulkEnrichStatus(req, res) {
  res.json({
    success: true,
    isBulkEnriching,
    isRunning: isBulkEnriching,
    progress: bulkEnrichProgress
  });
}

async function cancelBulkEnrich(req, res) {
  if (!isBulkEnriching) {
    return res.json({ success: true, message: 'Tidak ada proses enrich yang sedang berjalan.' });
  }
  isBulkEnriching = false;
  bulkEnrichProgress.status = 'cancelled';
  bulkEnrichProgress.message = `Proses enrich dihentikan oleh pengguna. (${bulkEnrichProgress.successCount} waybill berhasil diperkaya)`;
  res.json({ success: true, message: 'Auto-enrich berhasil dihentikan.' });
}

function startBackgroundEnrichRunner(targetWaybills) {
  if (isBulkEnriching) return false;
  isBulkEnriching = true;
  bulkEnrichProgress = {
    current: 0,
    total: targetWaybills.length,
    successCount: 0,
    status: 'running',
    message: `Memulai auto-enrich batch untuk ${targetWaybills.length.toLocaleString('id-ID')} waybill...`
  };

  // Background Runner
  (async () => {
    try {
      const token = await ptoController.getPtoToken();
      const now = new Date();
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      let enrichedCount = 0;

      // Process in chunks of 20 waybills (blazing fast OMS batch query)
      const BATCH_SIZE = 20;
      for (let i = 0; i < targetWaybills.length; i += BATCH_SIZE) {
        if (!isBulkEnriching) break;

        const rawChunk = targetWaybills.slice(i, i + BATCH_SIZE);
        const mainWbChunk = rawChunk.map(w => extractMainWaybill(w)).filter(Boolean);
        const uniqueMainWbs = [...new Set(mainWbChunk)];

        if (uniqueMainWbs.length > 0) {
          try {
            const payload = {
              siteCode: 'JKT99A',
              startDate: past90.toISOString().slice(0, 10) + ' 00:00:00',
              endDate: now.toISOString().slice(0, 10) + ' 23:59:59',
              p_billType: 1,
              p_billNo: uniqueMainWbs.join(','),
              current: 1,
              size: 50,
              lowerSiteQuery: true,
              countryId: '1'
            };

            const omsRes = await ptoController.makeJfsPtoRequest(
              '/customerplatform/omsOrderStatus/statusQuery',
              'POST',
              JSON.stringify(payload),
              token
            ).catch(() => null);

            const records = omsRes?.data?.records || [];

            // UNMASK sender, receiver, and address via OMS detail (no asterisks!)
            await unmaskAndEnrichOmsRecords(records, token);

            for (const r of records) {
              if (!r.waybillId) continue;
              const gName = r.goodsName || r.goodsTypeName || null;
              if (gName || (r.senderName && !r.senderName.includes('*')) || (r.receiverName && !r.receiverName.includes('*'))) {
                await db.query(`
                  UPDATE gudang_rute_inventory
                  SET 
                    nama_barang = COALESCE(NULLIF(?, ''), nama_barang),
                    pengirim = COALESCE(NULLIF(?, ''), pengirim),
                    perusahaan_pengirim = COALESCE(NULLIF(?, ''), perusahaan_pengirim),
                    no_hp_pengirim = COALESCE(NULLIF(?, ''), no_hp_pengirim),
                    penerima = COALESCE(NULLIF(?, ''), penerima),
                    perusahaan_penerima = COALESCE(NULLIF(?, ''), perusahaan_penerima),
                    no_hp_penerima = COALESCE(NULLIF(?, ''), no_hp_penerima),
                    alamat_penerima = COALESCE(NULLIF(?, ''), alamat_penerima),
                    outlet_asal = COALESCE(NULLIF(outlet_asal, ''), ?),
                    outlet_tujuan = COALESCE(NULLIF(outlet_tujuan, ''), ?),
                    outlet_akhir = COALESCE(NULLIF(outlet_akhir, ''), ?),
                    gw_asal = COALESCE(NULLIF(gw_asal, ''), ?),
                    gw_tujuan = COALESCE(NULLIF(gw_tujuan, ''), ?),
                    tgl_buka = COALESCE(NULLIF(tgl_buka, ''), ?),
                    berat = CASE WHEN berat = 0 OR berat IS NULL THEN ? ELSE berat END,
                    volume = CASE WHEN volume = 0 OR volume IS NULL THEN ? ELSE volume END
                  WHERE waybill = ? OR waybill LIKE ?
                `, [
                  gName,
                  cleanPersonName(r.senderName || ''),
                  r.senderCompany || r.customerName || '',
                  r.senderMobilePhone || r.senderTelphone || '',
                  cleanPersonName(r.receiverName || ''),
                  r.receiverCompany || '',
                  r.receiverMobilePhone || r.receiverTelphone || '',
                  r.receiverDetailedAddress || '',
                  r.pickNetworkName || r.realPickNetworkName || '',
                  r.dispatchNetworkCode || r.dispatchNetworkName || (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? r.terminalDispatchCode.split('-')[1].trim() : ''),
                  r.dispatchNetworkCode || (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? r.terminalDispatchCode.split('-')[1].trim() : ''),
                  r.proxyAreaName ? ('GW-' + r.proxyAreaName) : '',
                  r.destinationDistributionName ? ('GW-' + r.destinationDistributionName.replace(/^GW-/, '')) : (r.terminalDispatchCode && r.terminalDispatchCode.includes('-') ? ('GW-' + r.terminalDispatchCode.split('-')[0].trim()) : ''),
                  r.customerOrderTime || r.inputTime || '',
                  parseFloat(r.packageChargeWeight || r.packageTotalWeight || 0),
                  parseFloat(r.packateVolume || 0),
                  r.waybillId,
                  r.waybillId + '%'
                ]);
                enrichedCount++;
              }
            }

            // Also check if any in this chunk has missing holding_gw
            try {
              const [chunkNeedPod] = await db.query(`
                SELECT waybill FROM gudang_rute_inventory
                WHERE waybill IN (?) AND (holding_gw IS NULL OR holding_gw = '' OR holding_gw = '-' OR durasi_jam = 0)
              `, [uniqueMainWbs]);
              if (chunkNeedPod.length > 0) {
                const podMap = await fetchBatchPodTracking(chunkNeedPod.map(w => w.waybill), token);
                for (const [wb, pod] of podMap.entries()) {
                  await db.query(`
                    UPDATE gudang_rute_inventory
                    SET 
                      holding_gw = COALESCE(NULLIF(?, ''), holding_gw),
                      status_simpan = COALESCE(NULLIF(?, ''), status_simpan),
                      tanggal_simpan = COALESCE(NULLIF(?, ''), tanggal_simpan),
                      durasi_jam = CASE WHEN durasi_jam = 0 THEN ? ELSE durasi_jam END,
                      durasi_kategori = COALESCE(NULLIF(?, ''), durasi_kategori),
                      outlet_asal = COALESCE(NULLIF(outlet_asal, ''), ?)
                    WHERE waybill = ? OR waybill LIKE ?
                  `, [
                    pod.holdingGw, pod.statusSimpan, pod.tanggalSimpan, pod.durasiJam, pod.durasiKategori, pod.outletAsal, wb, wb + '%'
                  ]);
                }
              }
            } catch (_) {}
          } catch (batchErr) {
            console.warn('Batch OMS chunk warning:', batchErr.message);
          }
        }

        bulkEnrichProgress.current = Math.min(targetWaybills.length, i + BATCH_SIZE);
        bulkEnrichProgress.successCount = enrichedCount;
        bulkEnrichProgress.message = `Memproses ${bulkEnrichProgress.current.toLocaleString('id-ID')} / ${targetWaybills.length.toLocaleString('id-ID')} waybill (${enrichedCount.toLocaleString('id-ID')} berhasil diperkaya)`;

        // Small 80ms pause to ensure smooth network I/O
        await new Promise(r => setTimeout(r, 80));
      }

      if (isBulkEnriching) {
        bulkEnrichProgress.status = 'success';
        bulkEnrichProgress.message = `Selesai! Berhasil meng-enrich ${enrichedCount.toLocaleString('id-ID')} dari ${targetWaybills.length.toLocaleString('id-ID')} waybill.`;
      }
    } catch (err) {
      console.error('bulkEnrichWorker error:', err);
      bulkEnrichProgress.status = 'error';
      bulkEnrichProgress.message = 'Terjadi kesalahan: ' + err.message;
    } finally {
      isBulkEnriching = false;
    }
  })();

  return true;
}

async function bulkEnrichWaybills(req, res) {
  if (isBulkEnriching) {
    return res.status(409).json({ success: false, message: 'Proses auto-enrich sedang berjalan di latar belakang.' });
  }

  const { waybills = [], limit = 100, mode = 'normal' } = req.body || {};
  let targetWaybills = [];

  // Step 1: Run instant DB update first (PTO & Monitoring Stuck)
  try {
    await db.query(`
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

    await db.query(`
      UPDATE gudang_rute_inventory g
      JOIN monitoring_stuck m ON g.waybill = m.waybill COLLATE utf8mb4_unicode_ci
      SET 
        g.nama_barang = COALESCE(NULLIF(g.nama_barang, ''), m.nama_barang),
        g.pengirim = COALESCE(NULLIF(g.pengirim, ''), m.client_name)
      WHERE (g.nama_barang IS NULL OR g.nama_barang = '') 
        AND (m.nama_barang IS NOT NULL AND m.nama_barang != '')
    `);
  } catch (dbErr) {
    console.warn('bulkEnrich instant DB update warning:', dbErr.message);
  }

  // Step 2: Determine target waybills
  if (Array.isArray(waybills) && waybills.length > 0) {
    targetWaybills = waybills.map(w => String(w).trim()).filter(Boolean);
  } else if (mode === 'all') {
    // Mode ALL: Fetch up to 10,000 unenriched or masked waybills in this session
    const [rows] = await db.query(`
      SELECT waybill 
      FROM gudang_rute_inventory 
      WHERE (nama_barang IS NULL OR nama_barang = '' OR penerima LIKE '%*%' OR pengirim LIKE '%*%')
      ORDER BY id ASC
      LIMIT 10000
    `);
    targetWaybills = rows.map(r => r.waybill);
  } else {
    const parsedLimit = Math.min(5000, Math.max(10, parseInt(limit, 10) || 100));
    const [rows] = await db.query(`
      SELECT waybill 
      FROM gudang_rute_inventory 
      WHERE (nama_barang IS NULL OR nama_barang = '' OR penerima LIKE '%*%' OR pengirim LIKE '%*%')
      ORDER BY id ASC
      LIMIT ?
    `, [parsedLimit]);
    targetWaybills = rows.map(r => r.waybill);
  }

  if (targetWaybills.length === 0) {
    return res.json({
      success: true,
      message: 'Semua waybill target sudah terisi rincian nama barang.',
      enrichedCount: 0
    });
  }

  startBackgroundEnrichRunner(targetWaybills);

  res.json({
    success: true,
    message: `Memulai auto-enrich untuk ${targetWaybills.length.toLocaleString('id-ID')} waybill di latar belakang...`,
    total: targetWaybills.length
  });
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
  pasteImportGudangData,
  checkExistingWaybills,
  queryInventory,
  getPodTrace,
  enrichWaybill,
  bulkEnrichWaybills,
  getBulkEnrichStatus,
  cancelBulkEnrich,
  instantDbEnrich,
  uploadFileGudangData
};
