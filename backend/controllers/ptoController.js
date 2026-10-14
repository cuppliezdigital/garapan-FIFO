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

    // Default dates if omitted: past 15 days to today
    const now = new Date();
    const defaultEnd = now.toISOString().slice(0, 10) + ' 23:59:59';
    const past15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const defaultStart = past15.toISOString().slice(0, 10) + ' 00:00:00';

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
      countryId: String(countryId),
      siteCode: effectiveSiteCode
    };

    if (orderSourceName && String(orderSourceName).trim() && String(orderSourceName).toLowerCase() !== 'all') {
      payload.orderSourceName = String(orderSourceName).trim();
    }

    if (Array.isArray(waybillIds) && waybillIds.length > 0) {
      payload.waybillIds = waybillIds.map(w => String(w).trim()).filter(Boolean);
    } else if (typeof waybillIds === 'string' && waybillIds.trim().length > 0) {
      payload.waybillIds = waybillIds.split(/[\s,;\n\t]+/).map(w => w.trim()).filter(Boolean);
    }

    const postData = JSON.stringify(payload);
    const result = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', postData, token);

    if (result.code === 405) {
      return res.status(401).json({
        error: 'Sesi akun JFS kedaluwarsa (Akun telah login di perangkat lain). Silakan buka JFS dan perbarui authtoken melalui tombol "Atur Token PTO".',
        code: 405
      });
    }
    if (result.code === 401) {
      return res.status(401).json({
        error: 'Sesi token PTO tidak valid atau telah habis masa berlakunya (HTTP 401). Silakan perbarui authtoken melalui tombol "Atur Token PTO".',
        code: 401
      });
    }
    if (result.code !== 1 && result.code !== 200 && result.succ !== true) {
      let friendlyError = result.msg || result.message || 'Gagal mengambil data dari JFS PTO';
      if (friendlyError.includes('取件网点编码不能为空')) {
        friendlyError = 'Kode Gateway / Site Asal (siteCode) tidak boleh kosong.';
      } else if (friendlyError.includes('非法查询')) {
        friendlyError = `Akses ditolak oleh server JFS (Kode Site tidak sesuai hak akses akun). Gunakan Kode Site ${effectiveSiteCode} yang sesuai dengan akun login JFS Anda.`;
      }
      return res.status(400).json({
        error: friendlyError,
        raw: result
      });
    }

    const records = result?.data?.records || [];
    const total = result?.data?.total || records.length;

    // Fast parallel unmasking: replace masked asterisks ('h*t', 'm*、') with full clear text
    if (records.length > 0) {
      const toFetch = [];
      for (const r of records) {
        if (!r || !r.id) continue;
        if (detailCache.has(r.id)) {
          applyDetailToRecord(r, detailCache.get(r.id));
        } else {
          toFetch.push(r);
        }
      }

      if (toFetch.length > 0) {
        // Run concurrent detail requests (pool size: 15)
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
          } catch (e) {
            // Silently ignore individual detail errors so list still loads smoothly
          }
        });
      }
    }

    res.json({
      success: true,
      total: total,
      current: parsedCurrent,
      size: parsedSize,
      totalPages: Math.ceil(total / parsedSize),
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
    const result = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(id)}`, 'GET', null, token);

    if (result.code !== 1 && result.code !== 200 && result.succ !== true) {
      return res.status(400).json({
        error: result.msg || result.message || 'Gagal memuat detail order',
        raw: result
      });
    }

    const detailData = result.data || {};
    detailCache.set(id, detailData);

    res.json({
      success: true,
      data: detailData
    });
  } catch (err) {
    console.error('getOrderDetail error:', err);
    res.status(500).json({ error: 'Gagal memuat detail order: ' + err.message });
  }
};

