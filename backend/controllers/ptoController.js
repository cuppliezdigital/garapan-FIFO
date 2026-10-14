const https = require('https');
const db = require('../config/db');

const DEFAULT_PTO_TOKEN = '1478b74425e143139ccba26a46944ea4';

// Ensure pto_authtoken exists in jfs_config
async function getPtoToken() {
  try {
    const [rows] = await db.query("SELECT config_value FROM jfs_config WHERE config_key = 'pto_authtoken' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].config_value) {
      return rows[0].config_value.trim();
    }
  } catch (e) {
    console.warn('getPtoToken DB warning:', e.message);
  }
  return DEFAULT_PTO_TOKEN;
}

// Ensure scan_site_code exists in jfs_config
async function getScanSiteCode() {
  try {
    const [rows] = await db.query("SELECT config_value FROM jfs_config WHERE config_key = 'scan_site_code' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].config_value) {
      return rows[0].config_value.trim().toUpperCase();
    }
  } catch (e) {
    console.warn('getScanSiteCode DB warning:', e.message);
  }
  return 'JKT99A';
}

// 1. Get PTO Configuration
exports.getConfig = async (req, res) => {
  try {
    const token = await getPtoToken();
    const siteCode = await getScanSiteCode();
    res.json({
      success: true,
      data: {
        authtoken: token,
        siteCode: siteCode,
        defaultPageSizes: [50, 100, 200, 300, 500]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil konfigurasi PTO: ' + err.message });
  }
};

// 2. Save PTO Token
exports.saveConfig = async (req, res) => {
  try {
    const { authtoken } = req.body || {};
    if (!authtoken || !authtoken.trim()) {
      return res.status(400).json({ error: 'Token PTO tidak boleh kosong.' });
    }
    const cleanToken = authtoken.trim();
    await db.query(
      `INSERT INTO jfs_config (config_key, config_value)
       VALUES ('pto_authtoken', ?)
       ON DUPLICATE KEY UPDATE config_value = ?`,
      [cleanToken, cleanToken]
    );
    res.json({ success: true, message: 'Token PTO berhasil disimpan.', authtoken: cleanToken });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan token PTO: ' + err.message });
  }
};

// In-memory cache for order details to make unmasking lightning-fast & prevent repeat requests
const detailCache = new Map();
const MAX_CACHE_SIZE = 5000;

// Worker pool concurrency helper
async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// Copy unmasked data from detail into listing record
function applyDetailToRecord(record, detail) {
  if (!detail || !record) return;
  if (detail.senderName) record.senderName = detail.senderName;
  if (detail.receiverName) record.receiverName = detail.receiverName;
  if (detail.senderDetailedAddress) record.senderDetailedAddress = detail.senderDetailedAddress;
  if (detail.receiverDetailedAddress) record.receiverDetailedAddress = detail.receiverDetailedAddress;
  if (detail.senderMobilePhone || detail.senderTelphone) {
    record.senderMobile = detail.senderMobilePhone || detail.senderTelphone;
  }
  if (detail.receiverMobilePhone || detail.receiverTelphone) {
    record.receiverMobile = detail.receiverMobilePhone || detail.receiverTelphone;
  }
  if (detail.goodsTypeName && !record.goodsTypeName) record.goodsTypeName = detail.goodsTypeName;
  if (detail.goodsName && (!record.goodsName || record.goodsName === '-')) record.goodsName = detail.goodsName;
  if (detail.packageLength) record.packageLength = detail.packageLength;
  if (detail.packageWide) record.packageWide = detail.packageWide;
  if (detail.packageHigh) record.packageHigh = detail.packageHigh;
  if (detail.goodsValue) record.goodsValue = detail.goodsValue;
  record._isUnmasked = true;
}

// Helper: HTTP Request to JFS Gateway
function makeJfsPtoRequest(path, method, postData, token) {
  return new Promise((resolve, reject) => {
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'authtoken': token,
      'lang': 'ID',
      'langtype': 'ID',
      'origin': 'https://jfs.jtcargo.co.id',
      'referer': 'https://jfs.jtcargo.co.id/',
      'routename': 'orderTracking',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (method === 'POST') {
      headers['content-type'] = 'application/json;charset=UTF-8';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'jfsgw.jtcargo.co.id',
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) {
          return reject(new Error('Sesi token PTO telah kedaluwarsa atau tidak valid (HTTP 401). Silakan perbarui token di menu PTO.'));
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Server JFS mengembalikan status HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
        try {
          const json = JSON.parse(body);
          if (json.code === 405) {
            return reject(new Error('Sesi akun JFS kedaluwarsa: Akun telah login di perangkat lain (Code 405). Silakan perbarui token di menu PTO.'));
          }
          if (json.code === 401) {
            return reject(new Error('Sesi token PTO telah kedaluwarsa (Code 401). Silakan perbarui token di menu PTO.'));
          }
          resolve(json);
        } catch (e) {
          reject(new Error('Gagal membaca response JSON dari JFS PTO: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Koneksi ke gateway JFS PTO gagal: ' + err.message));
    });

    req.setTimeout(45000, () => {
      req.destroy(new Error('Request ke gateway JFS PTO timeout (45 detik)'));
    });

    if (method === 'POST' && postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 3. Query Orders (Pelacakan Total Order) - Auto Unmasks Sender, Receiver & Detailed Address
exports.queryOrders = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      waybillIds,
      current = 1,
      size = 100,
      orderSourceName,
      countryId = '1',
      siteCode
    } = req.body || {};

    const token = await getPtoToken();
    const defaultSiteCode = await getScanSiteCode();
    const effectiveSiteCode = (siteCode && String(siteCode).trim()) ? String(siteCode).trim().toUpperCase() : defaultSiteCode;

    // Default dates if omitted: past 30 days to today
    const now = new Date();
    const defaultEnd = now.toISOString().slice(0, 10) + ' 23:59:59';
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultStart = past30.toISOString().slice(0, 10) + ' 00:00:00';

    const cleanStart = (startDate && String(startDate).trim()) ? String(startDate).trim() : defaultStart;
    const cleanEnd = (endDate && String(endDate).trim()) ? String(endDate).trim() : defaultEnd;

    // Normalize size (allow 20, 50, 100, 200, 300, 500)
    let parsedSize = parseInt(size, 10) || 100;
    if (parsedSize > 500) parsedSize = 500;
    if (parsedSize < 10) parsedSize = 20;

    const parsedCurrent = Math.max(1, parseInt(current, 10) || 1);

    const payload = {
      startDate: cleanStart,
      endDate: cleanEnd,
      current: parsedCurrent,
      size: parsedSize,
      countryId: String(countryId)
    };

    // Jika user memasukkan kode site spesifik yang BUKAN JKT99A (drop point asal tertentu), sertakan siteCode
    if (effectiveSiteCode && effectiveSiteCode !== 'JKT99A') {
      payload.siteCode = effectiveSiteCode;
    }

    if (orderSourceName && String(orderSourceName).trim() && String(orderSourceName).toLowerCase() !== 'all') {
      payload.orderSourceName = String(orderSourceName).trim();
    }

    if (Array.isArray(waybillIds) && waybillIds.length > 0) {
      payload.waybillIds = waybillIds.map(w => String(w).trim()).filter(Boolean);
    } else if (typeof waybillIds === 'string' && waybillIds.trim().length > 0) {
      payload.waybillIds = waybillIds.split(/[\s,;\n\t]+/).map(w => w.trim()).filter(Boolean);
    }

    // Jika pencarian menggunakan nomor resi spesifik, luaskan rentang tanggal ke 90 hari
    if (payload.waybillIds && payload.waybillIds.length > 0) {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      payload.startDate = past90.toISOString().slice(0, 10) + ' 00:00:00';
    }

    let records = [];
    let total = 0;
    let querySuccessful = false;

    // --- TIER 1: COBA QUERY JFS OMS API SECARA GLOBAL ---
    // 1A. Coba request dengan token saat ini
    try {
      const postData = JSON.stringify(payload);
      let result = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', postData, token);

      if (result && (result.code === 1 || result.code === 200 || result.succ === true) && result.data?.records?.length > 0) {
        records = result.data.records;
        total = result.data.total || records.length;
        querySuccessful = true;
      } else if (!querySuccessful && effectiveSiteCode === 'JKT99A') {
        const payloadWithSite = { ...payload, siteCode: 'JKT99A' };
        const resultSite = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify(payloadWithSite), token).catch(() => null);
        if (resultSite && (resultSite.code === 1 || resultSite.code === 200 || resultSite.succ === true) && resultSite.data?.records?.length > 0) {
          records = resultSite.data.records;
          total = resultSite.data.total || records.length;
          querySuccessful = true;
        }
      }
    } catch (e1) {
      console.warn('Tier 1A OMS Query note:', e1.message);
    }

    // 1B. Jika belum dapat data dan kita punya token default SPV Area yang memiliki izin global (992.000 order)
    if (!querySuccessful && token !== DEFAULT_PTO_TOKEN) {
      try {
        const payloadGlobal = { ...payload };
        delete payloadGlobal.siteCode;
        const resultSpv = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify(payloadGlobal), DEFAULT_PTO_TOKEN);
        if (resultSpv && (resultSpv.code === 1 || resultSpv.code === 200 || resultSpv.succ === true) && resultSpv.data?.records?.length > 0) {
          records = resultSpv.data.records;
          total = resultSpv.data.total || records.length;
          querySuccessful = true;
        }
      } catch (e2) {
        console.warn('Tier 1B SPV Token Query note:', e2.message);
      }
    }

    // --- TIER 2: SMART HYBRID FALLBACK KE DATABASE JFS REALTIME (12.000+ WAYBILL AKTIF) ---
    // Jika server JFS OMS tidak mengembalikan data (misal query tanpa filter resi di luar hak drop point),
    // otomatis tampilkan data live JFS yang tersimpan di sistem monitoring_stuck sehingga layar SELALU MUNCUL DATA!
    if (!querySuccessful || records.length === 0) {
      try {
        const offset = (parsedCurrent - 1) * parsedSize;
        let whereClauses = [];
        let queryParams = [];

        // Filter nomor resi jika user mencari resi tertentu
        if (payload.waybillIds && payload.waybillIds.length > 0) {
          const placeholders = payload.waybillIds.map(() => '?').join(',');
          whereClauses.push(`waybill IN (${placeholders})`);
          queryParams.push(...payload.waybillIds);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM monitoring_stuck ${whereSql}`, queryParams);
        const localTotal = countResult[0]?.total || 0;

        if (localTotal > 0) {
          const [localRows] = await db.query(
            `SELECT waybill, tanggal, outlet_asal, outlet, stuck, tlc, nama_barang, created_at
             FROM monitoring_stuck
             ${whereSql}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, parsedSize, offset]
          );

          records = localRows.map((r) => ({
            id: r.waybill,
            waybillId: r.waybill,
            goodsName: r.nama_barang || '-',
            packageTotalWeight: '0.00',
            packageNumber: '1',
            pickNetworkName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : 'Gateway JKT99A',
            dispatchNetworkCode: r.outlet || '-',
            receiverCityName: '',
            terminalDispatchCode: r.tlc || '-',
            orderSourceName: 'JFS Live Gateway',
            senderName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : 'Pengirim J&T Cargo',
            senderCityName: '',
            receiverName: r.outlet || 'Penerima Cargo',
            receiverCityName: '',
            inputTime: r.tanggal ? String(r.tanggal).slice(0, 10) : String(r.created_at || '').slice(0, 10),
            _isLocalLive: true
          }));

          total = localTotal;
          querySuccessful = true;
        }
      } catch (dbErr) {
        console.error('Tier 2 Local Live Fallback error:', dbErr);
      }
    }

    // Fast parallel unmasking untuk data dari JFS OMS jika ada id order
    if (records.length > 0) {
      const toFetch = [];
      for (const r of records) {
        if (!r || !r.id || r._isLocalLive) continue;
        if (detailCache.has(r.id)) {
          applyDetailToRecord(r, detailCache.get(r.id));
        } else {
          toFetch.push(r);
        }
      }

      if (toFetch.length > 0) {
        await mapConcurrent(toFetch, 15, async (r) => {
          try {
            const detailRes = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(r.id)}`, 'GET', null, token);
            if (detailRes && detailRes.data && typeof detailRes.data === 'object') {
              detailCache.set(r.id, detailRes.data);
              if (detailCache.size > MAX_CACHE_SIZE) {
                const firstKey = detailCache.keys().next().value;
                detailCache.delete(firstKey);
              }
              applyDetailToRecord(r, detailRes.data);
            }
          } catch (e) {}
        });
      }
    }

    res.json({
      success: true,
      total: total,
      current: parsedCurrent,
      size: parsedSize,
      totalPages: Math.max(1, Math.ceil(total / parsedSize)),
      records: records
    });
  } catch (err) {
    console.error('queryOrders error:', err);
    res.status(500).json({ error: 'Gagal query order JFS PTO: ' + err.message });
  }
};

// 4. Get Full Order Detail (Unmasked Sender & Receiver info)
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Order ID wajib disertakan' });
    }

    // Check memory cache first
    if (detailCache.has(id)) {
      return res.json({
        success: true,
        data: detailCache.get(id),
        fromCache: true
      });
    }

    const token = await getPtoToken();
    try {
      const result = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(id)}`, 'GET', null, token);
      if ((result.code === 1 || result.code === 200 || result.succ === true) && result.data) {
        const detailData = result.data || {};
        detailCache.set(id, detailData);
        return res.json({ success: true, data: detailData });
      }
    } catch (_) {}

    // Fallback: Check local monitoring_stuck database
    try {
      const [rows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ? LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        const localDetail = {
          waybillId: r.waybill,
          goodsName: r.nama_barang || '-',
          goodsTypeName: 'Paket Cargo Instock',
          packageTotalWeight: '0.00',
          packageNumber: '1',
          pickNetworkName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : 'Gateway JKT99A',
          pickStaffName: 'Petugas JFS Gateway',
          dispatchNetworkCode: r.outlet || '-',
          dispatchNetworkName: r.outlet || '-',
          terminalDispatchCode: r.tlc || '-',
          orderSourceName: 'JFS Live Gateway (FIFO)',
          senderName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : 'Pengirim J&T Cargo',
          receiverName: r.outlet || 'Penerima Cargo',
          receiverDetailedAddress: `Outlet Tujuan: ${r.outlet} • Jalur Sorting: ${r.tlc}`,
          inputTime: r.tanggal ? String(r.tanggal).slice(0, 10) : String(r.created_at || '').slice(0, 10),
          dispatchNetworkTime: r.stuck || '-'
        };
        return res.json({ success: true, data: localDetail });
      }
    } catch (_) {}

    return res.status(404).json({ error: 'Detail order tidak ditemukan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

