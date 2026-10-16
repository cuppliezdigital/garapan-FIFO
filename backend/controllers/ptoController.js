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

// Ensure pto_orders table exists for storing 36 columns with 100% precision
let isPtoTableInitialized = false;
async function ensurePtoOrdersTable() {
  if (isPtoTableInitialized) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pto_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waybill VARCHAR(100) NOT NULL UNIQUE,
        nama_barang TEXT,
        sumber_pesanan VARCHAR(100),
        outlet_pengirim VARCHAR(100),
        kode_pos_pengirim VARCHAR(30),
        provinsi_pengirim VARCHAR(100),
        kota_pengirim VARCHAR(100),
        area_pengirim VARCHAR(100),
        alamat_lengkap_pengirim TEXT,
        pengirim VARCHAR(255),
        nomor_ponsel_pengirim VARCHAR(50),
        ten_letter_code VARCHAR(100),
        nama_outlet_delivery VARCHAR(100),
        gateway_asal VARCHAR(100),
        gateway_tujuan VARCHAR(100),
        kode_rute VARCHAR(100),
        nomor_pesanan_pelanggan VARCHAR(100),
        perusahaan_pengirim VARCHAR(255),
        telepon_rumah_pengirim VARCHAR(50),
        kelurahan_pengirim VARCHAR(100),
        penerima VARCHAR(255),
        perusahaan_penerima_paket VARCHAR(255),
        nomor_handphone_penerima VARCHAR(50),
        nomor_telepon_penerima VARCHAR(50),
        negara_penerima VARCHAR(100) DEFAULT 'Indonesia',
        provinsi_penerima VARCHAR(100),
        kota_penerima VARCHAR(100),
        area_penerima VARCHAR(100),
        kelurahan_penerima VARCHAR(100),
        jalan_penerima_paket VARCHAR(255),
        alamat_lengkap_penerima TEXT,
        kode_pos_penerima VARCHAR(30),
        jumlah_pembayaran_cod DECIMAL(14,2) DEFAULT 0,
        jenis_barang VARCHAR(100),
        jumlah_koli INT DEFAULT 1,
        berat_pickup DECIMAL(10,2) DEFAULT 0,
        waktu_input_pesanan VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_waybill (waybill),
        INDEX idx_outlet_delivery (nama_outlet_delivery),
        INDEX idx_nomor_pesanan (nomor_pesanan_pelanggan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    isPtoTableInitialized = true;
  } catch (err) {
    console.error('ensurePtoOrdersTable error:', err.message);
  }
}

// Ensure table is created at startup
ensurePtoOrdersTable().catch(() => null);

function mapPtoDbRowToRecord(r) {
  if (!r) return null;
  return {
    id: r.waybill,
    waybillId: r.waybill,
    goodsName: r.nama_barang || '-',
    goodsTypeName: r.jenis_barang || 'Lainnya',
    packageTotalWeight: String(r.berat_pickup != null ? r.berat_pickup : '0.00'),
    packageNumber: String(r.jumlah_koli || '1'),
    orderSourceName: r.sumber_pesanan || 'JFS',
    customerOrderNo: r.nomor_pesanan_pelanggan || '-',
    customerOrderId: r.nomor_pesanan_pelanggan || '-',
    senderCompanyName: r.perusahaan_pengirim || '-',
    senderName: r.pengirim || '-',
    senderMobile: r.nomor_ponsel_pengirim || '-',
    senderMobilePhone: r.nomor_ponsel_pengirim || '-',
    senderPostcode: r.kode_pos_pengirim || '',
    senderProvinceName: r.provinsi_pengirim || '',
    senderCityName: r.kota_pengirim || '',
    senderAreaName: r.area_pengirim || '',
    senderTownName: r.kelurahan_pengirim || '',
    senderTelphone: r.telepon_rumah_pengirim || '',
    senderDetailedAddress: r.alamat_lengkap_pengirim || '-',
    pickNetworkName: r.outlet_pengirim || '-',
    terminalDispatchCode: r.ten_letter_code || '-',
    dispatchNetworkCode: r.nama_outlet_delivery || '-',
    dispatchNetworkName: r.nama_outlet_delivery || '-',
    receiverCompanyName: r.perusahaan_penerima_paket || '-',
    receiverName: r.penerima || '-',
    receiverMobile: r.nomor_handphone_penerima || '-',
    receiverMobilePhone: r.nomor_handphone_penerima || '-',
    receiverTelphone: r.nomor_telepon_penerima || '',
    receiverProvinceName: r.provinsi_penerima || '',
    receiverCityName: r.kota_penerima || '',
    receiverAreaName: r.area_penerima || '',
    receiverTownName: r.kelurahan_penerima || '',
    receiverStreetName: r.jalan_penerima_paket || '',
    receiverDetailedAddress: r.alamat_lengkap_penerima || '-',
    receiverPostcode: r.kode_pos_penerima || '',
    goodsValue: String(r.jumlah_pembayaran_cod != null ? r.jumlah_pembayaran_cod : '0.00'),
    sourceNetworkCode: r.gateway_asal || '-',
    destGateway: r.gateway_tujuan || '-',
    transferPath: r.kode_rute || '-',
    inputTime: r.waktu_input_pesanan || (r.created_at ? String(r.created_at).slice(0, 10) : '-'),
    _isPtoOfficial: true
  };
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
  if (detail.senderCompanyName || detail.customerName) {
    record.senderCompanyName = detail.senderCompanyName || detail.customerName;
  }
  if (detail.receiverCompanyName) record.receiverCompanyName = detail.receiverCompanyName;
  const resolvedOrderNo = detail.customerOrderId || detail.customerOrderNo || detail.customerOrderCode || record.customerOrderId || record.customerOrderNo;
  if (resolvedOrderNo) {
    record.customerOrderNo = resolvedOrderNo;
    record.customerOrderId = resolvedOrderNo;
  }
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
  if (detail.packageTotalWeight && (!record.packageTotalWeight || record.packageTotalWeight === '0.00')) {
    record.packageTotalWeight = detail.packageTotalWeight;
  }
  if (detail.packageNumber && (!record.packageNumber || record.packageNumber === '1')) {
    record.packageNumber = detail.packageNumber;
  }
  if (detail.goodsValue || detail.codAmount) record.goodsValue = detail.goodsValue || detail.codAmount;
  if (detail.terminalDispatchCode && !record.terminalDispatchCode) record.terminalDispatchCode = detail.terminalDispatchCode;
  if (detail.dispatchNetworkCode && !record.dispatchNetworkCode) record.dispatchNetworkCode = detail.dispatchNetworkCode;
  if (detail.dispatchNetworkName && !record.dispatchNetworkName) record.dispatchNetworkName = detail.dispatchNetworkName;
  if (detail.sendNextstation) record.sourceNetworkCode = detail.sendNextstation;
  if (detail.destinationDistributionName) record.destGateway = detail.destinationDistributionName;
  if (detail.transferPath || detail.routeCode) record.transferPath = detail.transferPath || detail.routeCode;
  if (detail.senderProvinceName) record.senderProvinceName = detail.senderProvinceName;
  if (detail.senderCityName) record.senderCityName = detail.senderCityName;
  if (detail.senderAreaName) record.senderAreaName = detail.senderAreaName;
  if (detail.receiverProvinceName) record.receiverProvinceName = detail.receiverProvinceName;
  if (detail.receiverCityName) record.receiverCityName = detail.receiverCityName;
  if (detail.receiverAreaName) record.receiverAreaName = detail.receiverAreaName;
  record._isUnmasked = true;
}

// Auto-persist live detail to pto_orders database
async function autoPersistOrderDetail(detailData) {
  if (!detailData || !detailData.waybillId) return;
  try {
    await ensurePtoOrdersTable();
    await db.query(`
      INSERT INTO pto_orders (
        waybill, nama_barang, sumber_pesanan, outlet_pengirim, kode_pos_pengirim,
        provinsi_pengirim, kota_pengirim, area_pengirim, alamat_lengkap_pengirim,
        pengirim, nomor_ponsel_pengirim, ten_letter_code, nama_outlet_delivery,
        nomor_pesanan_pelanggan, perusahaan_pengirim,
        penerima, perusahaan_penerima_paket, nomor_handphone_penerima,
        negara_penerima, provinsi_penerima, kota_penerima, area_penerima,
        alamat_lengkap_penerima, kode_pos_penerima, jumlah_pembayaran_cod,
        jenis_barang, jumlah_koli, berat_pickup, waktu_input_pesanan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama_barang = VALUES(nama_barang),
        sumber_pesanan = VALUES(sumber_pesanan),
        outlet_pengirim = VALUES(outlet_pengirim),
        pengirim = VALUES(pengirim),
        nomor_ponsel_pengirim = VALUES(nomor_ponsel_pengirim),
        ten_letter_code = VALUES(ten_letter_code),
        nama_outlet_delivery = VALUES(nama_outlet_delivery),
        nomor_pesanan_pelanggan = VALUES(nomor_pesanan_pelanggan),
        penerima = VALUES(penerima),
        nomor_handphone_penerima = VALUES(nomor_handphone_penerima),
        alamat_lengkap_penerima = VALUES(alamat_lengkap_penerima),
        jenis_barang = VALUES(jenis_barang),
        berat_pickup = VALUES(berat_pickup),
        waktu_input_pesanan = VALUES(waktu_input_pesanan)
    `, [
      detailData.waybillId,
      detailData.goodsName || '',
      detailData.orderSourceName || '',
      detailData.pickNetworkName || detailData.sendCode || '',
      detailData.senderPostalCode || '',
      detailData.senderProvinceName || '',
      detailData.senderCityName || '',
      detailData.senderAreaName || '',
      detailData.senderDetailedAddress || '',
      detailData.senderName || '',
      detailData.senderMobilePhone || detailData.senderTelphone || '',
      detailData.terminalDispatchCode || detailData.receiverSortingCode || '',
      detailData.dispatchNetworkCode || detailData.dispatchCode || '',
      detailData.customerOrderId || detailData.customerOrderNo || String(detailData.id || ''),
      detailData.senderCompany || '',
      detailData.receiverName || '',
      detailData.receiverCompany || '',
      detailData.receiverMobilePhone || detailData.receiverTelphone || '',
      detailData.receiverCountryName || 'Indonesia',
      detailData.receiverProvinceName || '',
      detailData.receiverCityName || '',
      detailData.receiverAreaName || '',
      detailData.receiverDetailedAddress || '',
      detailData.receiverPostalCode || '',
      parseFloat(detailData.codMoney || detailData.goodsValue || 0) || 0,
      detailData.goodsTypeName || '',
      parseInt(detailData.packageNumber || 1, 10) || 1,
      parseFloat(detailData.packageTotalWeight || 0) || 0,
      detailData.customerOrderTime || detailData.inputTime || ''
    ]);
  } catch (e) {
    console.warn('autoPersistOrderDetail warning:', e.message);
  }
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
      'routename': path.includes('/detail') ? 'orderTrackingView' : 'orderTracking',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36'
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

    // --- TIER 0: CEK DATABASE RESMI PTO (pto_orders - DATA LENGKAP 36 KOLOM JFS PTO) ---
    await ensurePtoOrdersTable();
    try {
      let ptoWhereClauses = [];
      let ptoQueryParams = [];

      if (payload.waybillIds && payload.waybillIds.length > 0) {
        const clauses = [];
        const params = [];
        for (const term of payload.waybillIds) {
          clauses.push(`(waybill = ? OR nomor_pesanan_pelanggan = ? OR nomor_pesanan_pelanggan LIKE ? OR waybill LIKE ?)`);
          params.push(term, term, `%${term}%`, `%${term}%`);
        }
        ptoWhereClauses.push(`(${clauses.join(' OR ')})`);
        ptoQueryParams.push(...params);
      }

      const ptoWhereSql = ptoWhereClauses.length > 0 ? `WHERE ${ptoWhereClauses.join(' AND ')}` : '';
      const [ptoCountResult] = await db.query(`SELECT COUNT(*) AS total FROM pto_orders ${ptoWhereSql}`, ptoQueryParams);
      const ptoTotal = ptoCountResult[0]?.total || 0;

      if (ptoTotal > 0) {
        const offset = (parsedCurrent - 1) * parsedSize;
        const [ptoRows] = await db.query(
          `SELECT * FROM pto_orders
           ${ptoWhereSql}
           ORDER BY id DESC
           LIMIT ? OFFSET ?`,
          [...ptoQueryParams, parsedSize, offset]
        );

        if (ptoRows.length > 0) {
          records = ptoRows.map(mapPtoDbRowToRecord);
          total = ptoTotal;
          querySuccessful = true;

          // Jika pencarian nomor resi spesifik:
          // 1. Cek apakah ada data di DB yang masih mengandung bintang (*) -> unmask dari JFS
          // 2. Cek apakah jumlah yang ditemukan di DB lebih sedikit dari total nomor yang dicari -> tarik sisanya dari JFS
          if (payload.waybillIds && payload.waybillIds.length > 0) {
            const hasMasked = ptoRows.some(r => (r.penerima && r.penerima.includes('*')) || (r.pengirim && r.pengirim.includes('*')));
            const isMissingSome = ptoRows.length < payload.waybillIds.length;
            if (hasMasked || isMissingSome) {
              querySuccessful = false;
            }
          }
        }
      }
    } catch (ptoDbErr) {
      console.warn('Tier 0 pto_orders query note:', ptoDbErr.message);
    }

    // --- TIER 1: COBA QUERY JFS OMS API JIKA BELUM ADA DI DATABASE PTO ---
    if (!querySuccessful) {
      // 1A. Jika user mencari nomor resi tertentu (AWB Hunter / Multi-AWB):
      if (payload.waybillIds && payload.waybillIds.length > 0) {
        const foundLiveRecords = [];
        const liveFoundSet = new Set();

        // Cari mana saja yang belum ada di records Tier 0 lokal (atau yang masih bermasker)
        const unmaskedDbWaybills = new Set(
          records
            .filter(r => r.waybillId && !r.receiverName?.includes('*'))
            .map(r => r.waybillId)
        );
        const targetWbs = payload.waybillIds.filter(wb => !unmaskedDbWaybills.has(wb));
        const wbsToQuery = targetWbs.length > 0 ? targetWbs : payload.waybillIds;

        // Pisahkan AWB standar numerik (10-16 digit) untuk batching super cepat
        const numericAwbs = wbsToQuery.filter(w => /^\d{10,16}$/.test(w));
        const otherTerms = wbsToQuery.filter(w => !/^\d{10,16}$/.test(w));

        // 1. Batch Query untuk AWB numerik (maksimal 20 resi per request via p_billNo koma)
        if (numericAwbs.length > 0) {
          for (let i = 0; i < numericAwbs.length; i += 20) {
            const chunk = numericAwbs.slice(i, i + 20);
            try {
              const awbPayload = {
                siteCode: effectiveSiteCode || 'JKT99A',
                startDate: payload.startDate,
                endDate: payload.endDate,
                p_billType: 1,
                p_billNo: chunk.join(','),
                current: 1,
                size: Math.max(20, chunk.length * 2),
                lowerSiteQuery: true,
                countryId: String(countryId)
              };
              const res = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify(awbPayload), token).catch(() => null);
              if (res && (res.code === 1 || res.succ === true) && res.data?.records?.length > 0) {
                for (const r of res.data.records) {
                  if (r.waybillId && !liveFoundSet.has(r.waybillId)) {
                    liveFoundSet.add(r.waybillId);
                    foundLiveRecords.push(r);
                  }
                }
              }
            } catch (batchErr) {
              console.warn('Batch AWB Query warning:', batchErr.message);
            }
          }
        }

        // 2. Query untuk nomor pesanan marketplace (Shopee, TikTok, ID Booking, dll.) atau nomor yang belum terjaring batch
        const missingWbs = wbsToQuery.filter(w => !liveFoundSet.has(w));
        if (missingWbs.length > 0) {
          await mapConcurrent(missingWbs, 4, async (wb) => {
            try {
              const isCustomerOrderFormat = /^[a-zA-Z]/.test(wb) || wb.startsWith('ID') || wb.startsWith('26') || /[a-zA-Z]/.test(wb);
              const billTypesToTry = isCustomerOrderFormat ? [3, 1, 0] : [1, 3, 0];

              for (const bt of billTypesToTry) {
                const awbPayload = {
                  siteCode: effectiveSiteCode || 'JKT99A',
                  startDate: payload.startDate,
                  endDate: payload.endDate,
                  p_billType: bt,
                  p_billNo: wb,
                  current: 1,
                  size: 20,
                  lowerSiteQuery: true,
                  countryId: String(countryId)
                };
                const res = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify(awbPayload), token).catch(() => null);
                if (res && (res.code === 1 || res.succ === true) && res.data?.records?.length > 0) {
                  for (const r of res.data.records) {
                    if (r.waybillId && !liveFoundSet.has(r.waybillId)) {
                      liveFoundSet.add(r.waybillId);
                      foundLiveRecords.push(r);
                    }
                  }
                  break;
                }
              }
            } catch (awbErr) {
              console.warn(`Individual query error for ${wb}:`, awbErr.message);
            }
          });
        }

        // 3. Unmask detail live records secara paralel (maksimal 5 worker konkuren)
        if (foundLiveRecords.length > 0) {
          await mapConcurrent(foundLiveRecords, 5, async (r) => {
            if (r.customerOrderId && !r.customerOrderNo) {
              r.customerOrderNo = r.customerOrderId;
            }
            if (r.id) {
              const detailRes = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(r.id)}`, 'GET', null, token, 'orderTrackingView').catch(() => null);
              if (detailRes && (detailRes.code === 1 || detailRes.succ === true) && detailRes.data) {
                applyDetailToRecord(r, detailRes.data);
                await autoPersistOrderDetail(detailRes.data);
              }
            }
            if (!r.customerOrderNo && r.customerOrderId) {
              r.customerOrderNo = r.customerOrderId;
            }
          });

          // Merge hasil live dengan hasil Tier 0 lokal agar semua resi yang dicari tampil lengkap
          const mergedMap = new Map();
          for (const r of records) {
            if (r.waybillId) mergedMap.set(r.waybillId, r);
          }
          for (const r of foundLiveRecords) {
            if (r.waybillId) mergedMap.set(r.waybillId, r);
          }
          records = Array.from(mergedMap.values());
          total = records.length;
          querySuccessful = true;
        }
      }

      // 1B. Jika pencarian umum (tanpa nomor resi) atau 1A belum menghasilkan:
      if (!querySuccessful) {
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
          console.warn('Tier 1B OMS Query note:', e1.message);
        }

        // 1C. Jika belum dapat data dan kita punya token default SPV Area
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
            console.warn('Tier 1C SPV Token Query note:', e2.message);
          }
        }
      }
    }

    // --- TIER 2: SMART HYBRID FALLBACK KE DATABASE JFS REALTIME (12.000+ WAYBILL FIFO) ---
    // Jangan pernah memasukkan kode outlet (seperti SIN020B / KUB003A) ke dalam nama orang Pengirim/Penerima!
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
            goodsTypeName: '-',
            packageTotalWeight: '0.00',
            packageNumber: '1',
            orderSourceName: 'Monitoring FIFO (Belum di-import PTO)',
            customerOrderNo: '-',
            senderCompanyName: '-',
            senderName: '-',
            senderMobile: '-',
            senderMobilePhone: '-',
            senderProvinceName: '',
            senderCityName: '',
            senderAreaName: '',
            senderDetailedAddress: '-',
            pickNetworkName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : '-',
            terminalDispatchCode: r.tlc || '-',
            dispatchNetworkCode: r.outlet || '-',
            dispatchNetworkName: r.outlet || '-',
            receiverCompanyName: '-',
            receiverName: '-',
            receiverMobile: '-',
            receiverMobilePhone: '-',
            receiverProvinceName: '',
            receiverCityName: '',
            receiverAreaName: '',
            receiverDetailedAddress: '-',
            goodsValue: '0.00',
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
            let detailRes = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detailByLog?id=${encodeURIComponent(r.id)}`, 'GET', null, token).catch(() => null);
            if (!detailRes || !detailRes.data || typeof detailRes.data !== 'object') {
              detailRes = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(r.id)}`, 'GET', null, token).catch(() => null);
            }
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

    // Check memory cache first (hanya jika data sudah unmasked / tanpa bintang)
    if (detailCache.has(id)) {
      const cached = detailCache.get(id);
      const isClean = cached && cached.receiverName && !cached.receiverName.includes('*') && cached.senderName && !cached.senderName.includes('*');
      if (isClean) {
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }
    }

    // 1. Cek pto_orders database resmi JFS PTO terlebih dahulu (hanya jika nama sudah terbuka tanpa bintang)
    try {
      await ensurePtoOrdersTable();
      const [ptoRows] = await db.query(
        'SELECT * FROM pto_orders WHERE waybill = ? OR nomor_pesanan_pelanggan = ? OR nomor_pesanan_pelanggan LIKE ? LIMIT 1',
        [id, id, `%${id}%`]
      );
      if (ptoRows && ptoRows.length > 0) {
        const row = ptoRows[0];
        const isReceiverClean = row.penerima && !row.penerima.includes('*') && row.penerima !== '-';
        const isSenderClean = row.pengirim && !row.pengirim.includes('*') && row.pengirim !== '-';
        if (isReceiverClean && isSenderClean) {
          const detailData = mapPtoDbRowToRecord(row);
          detailCache.set(id, detailData);
          return res.json({ success: true, data: detailData, fromPtoDb: true });
        }
      }
    } catch (e) {
      console.warn('pto_orders lookup warning:', e.message);
    }

    // 2. Coba request ke JFS OMS API
    const token = await getPtoToken();
    try {
      let result = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(id)}`, 'GET', null, token, 'orderTrackingView').catch(() => null);
      if (!result || (result.code !== 1 && result.code !== 200 && result.succ !== true) || !result.data) {
        result = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detailByLog?id=${encodeURIComponent(id)}`, 'GET', null, token, 'orderTrackingView').catch(() => null);
      }

      if (!result || (result.code !== 1 && result.code !== 200 && result.succ !== true) || !result.data) {
        const now = new Date();
        const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const cleanTargetId = String(id).trim();
        const isCustomerOrderFormat = /^[a-zA-Z]/.test(cleanTargetId) || cleanTargetId.startsWith('ID') || cleanTargetId.startsWith('26') || /[a-zA-Z]/.test(cleanTargetId);
        const billTypesToTry = isCustomerOrderFormat ? [3, 1, 0] : [1, 3, 0];

        let searchStatusRes = null;
        for (const bt of billTypesToTry) {
          const res = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify({
            siteCode: 'JKT99A',
            startDate: past90.toISOString().slice(0, 10) + ' 00:00:00',
            endDate: now.toISOString().slice(0, 10) + ' 23:59:59',
            p_billType: bt,
            p_billNo: cleanTargetId,
            current: 1,
            size: 20,
            lowerSiteQuery: true,
            countryId: '1'
          }), token).catch(() => null);

          if (res && res.code === 1 && res.data?.records?.length > 0) {
            searchStatusRes = res;
            break;
          }
        }

        if (searchStatusRes && searchStatusRes.code === 1 && searchStatusRes.data?.records?.length > 0) {
          const internalId = searchStatusRes.data.records[0].id;
          if (internalId) {
            result = await makeJfsPtoRequest(`/customerplatform/omsOrderStatus/detail?id=${encodeURIComponent(internalId)}`, 'GET', null, token, 'orderTrackingView').catch(() => null);
          }
        }
      }

      if (result && (result.code === 1 || result.code === 200 || result.succ === true) && result.data) {
        const detailData = result.data || {};
        detailCache.set(id, detailData);
        if (detailData.waybillId) detailCache.set(detailData.waybillId, detailData);

        // Auto-persist live detail to pto_orders database
        await autoPersistOrderDetail(detailData);

        return res.json({ success: true, data: detailData });
      }
    } catch (_) {}

    // 3. Fallback: Check local monitoring_stuck database (FIFO) tanpa membuat-buat nama palsu
    try {
      const [rows] = await db.query('SELECT * FROM monitoring_stuck WHERE waybill = ? LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        const localDetail = {
          waybillId: r.waybill,
          goodsName: r.nama_barang || '-',
          goodsTypeName: '-',
          packageTotalWeight: '0.00',
          packageNumber: '1',
          orderSourceName: 'Monitoring FIFO (Belum di-import PTO)',
          customerOrderNo: '-',
          senderCompanyName: '-',
          senderName: '-',
          senderMobilePhone: '-',
          senderProvinceName: '-',
          senderCityName: '-',
          senderAreaName: '-',
          senderDetailedAddress: '-',
          pickNetworkName: (r.outlet_asal && r.outlet_asal !== '-') ? r.outlet_asal : '-',
          pickStaffName: '-',
          dispatchNetworkCode: r.outlet || '-',
          dispatchNetworkName: r.outlet || '-',
          terminalDispatchCode: r.tlc || '-',
          receiverCompanyName: '-',
          receiverName: '-',
          receiverMobilePhone: '-',
          receiverProvinceName: '-',
          receiverCityName: '-',
          receiverAreaName: '-',
          receiverDetailedAddress: '-',
          goodsValue: '0.00',
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

// 5. Import PTO Orders (36 Kolom Lengkap dari Excel JFS Pelacakan Total Order)
exports.importOrders = async (req, res) => {
  try {
    await ensurePtoOrdersTable();
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data order yang dikirim untuk diimport.' });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const r of rows) {
      const waybill = String(r.waybill || r.waybillId || r['Waybill Utama'] || r['Waybill'] || r['No Resi'] || '').trim();
      if (!waybill) continue;

      const namaBarang = r.nama_barang || r.goodsName || r['Nama Barang'] || '';
      const sumberPesanan = r.sumber_pesanan || r.orderSourceName || r['Sumber Pesanan'] || '';
      const outletPengirim = r.outlet_pengirim || r.pickNetworkName || r['Outlet Pengirim'] || '';
      const kodePosPengirim = r.kode_pos_pengirim || r.senderPostcode || r['Kode Pos Pengirim'] || '';
      const provinsiPengirim = r.provinsi_pengirim || r.senderProvinceName || r['Provinsi Pengirim'] || '';
      const kotaPengirim = r.kota_pengirim || r.senderCityName || r['Kota Pengirim'] || '';
      const areaPengirim = r.area_pengirim || r.senderAreaName || r['Area Pengirim'] || '';
      const alamatLengkapPengirim = r.alamat_lengkap_pengirim || r.senderDetailedAddress || r['Alamat Lengkap Pengirim'] || '';
      const pengirim = r.pengirim || r.senderName || r['Pengirim'] || '';
      const nomorPonselPengirim = r.nomor_ponsel_pengirim || r.senderMobile || r['nomor ponsel pengirim'] || '';
      const tenLetterCode = r.ten_letter_code || r.terminalDispatchCode || r['Ten letter code'] || '';
      const namaOutletDelivery = r.nama_outlet_delivery || r.dispatchNetworkCode || r['Nama Outlet Delivery'] || '';
      const gatewayAsal = r.gateway_asal || r.sourceNetworkCode || r['Gateway asal'] || '';
      const gatewayTujuan = r.gateway_tujuan || r.destGateway || r['Gateway tujuan'] || '';
      const kodeRute = r.kode_rute || r.transferPath || r['Kode rute'] || '';
      const nomorPesananPelanggan = r.nomor_pesanan_pelanggan || r.customerOrderId || r.customerOrderNo || r['Nomor pesanan pelanggan'] || r['No. Pesanan'] || r['No Pesanan'] || r['Order SN'] || r['Order ID'] || r['No Order'] || r['Nomor Pesanan'] || '';
      const perusahaanPengirim = r.perusahaan_pengirim || r.senderCompanyName || r['Perusahaan pengirim'] || '';
      const teleponRumahPengirim = r.telepon_rumah_pengirim || r['Telepon rumah pengirim'] || '';
      const kelurahanPengirim = r.kelurahan_pengirim || r['Kelurahan Pengirim'] || '';
      const penerima = r.penerima || r.receiverName || r['Penerima'] || '';
      const perusahaanPenerimaPaket = r.perusahaan_penerima_paket || r.receiverCompanyName || r['perusahaan penerima paket'] || '';
      const nomorHandphonePenerima = r.nomor_handphone_penerima || r.receiverMobile || r['nomor handphone penerima'] || '';
      const nomorTeleponPenerima = r.nomor_telepon_penerima || r['nomor telepon penerima'] || '';
      const negaraPenerima = r.negara_penerima || r['negara penerima'] || 'Indonesia';
      const provinsiPenerima = r.provinsi_penerima || r.receiverProvinceName || r['Provinsi penerima'] || '';
      const kotaPenerima = r.kota_penerima || r.receiverCityName || r['Kota penerima'] || '';
      const areaPenerima = r.area_penerima || r.receiverAreaName || r['area penerima'] || '';
      const kelurahanPenerima = r.kelurahan_penerima || r['Kelurahan Penerima'] || '';
      const jalanPenerimaPaket = r.jalan_penerima_paket || r['jalan penerima paket'] || '';
      const alamatLengkapPenerima = r.alamat_lengkap_penerima || r.receiverDetailedAddress || r['Alamat Lengkap Penerima'] || '';
      const kodePosPenerima = r.kode_pos_penerima || r.receiverPostcode || r['Kode Pos Penerima'] || '';
      const jumlahPembayaranCod = parseFloat(String(r.jumlah_pembayaran_cod || r.goodsValue || r['jumlah pembayaran COD'] || 0).replace(/,/g, '')) || 0;
      const jenisBarang = r.jenis_barang || r.goodsTypeName || r['Jenis Barang'] || '';
      const jumlahKoli = parseInt(r.jumlah_koli || r.packageNumber || r['Jumlah Koli'] || 1, 10) || 1;
      const beratPickup = parseFloat(String(r.berat_pickup || r.packageTotalWeight || r['Berat Pick-up'] || 0).replace(/,/g, '')) || 0;
      const waktuInputPesanan = r.waktu_input_pesanan || r.inputTime || r['Waktu Input Pesanan'] || '';

      const [res] = await db.query(
        `INSERT INTO pto_orders (
          waybill, nama_barang, sumber_pesanan, outlet_pengirim, kode_pos_pengirim,
          provinsi_pengirim, kota_pengirim, area_pengirim, alamat_lengkap_pengirim,
          pengirim, nomor_ponsel_pengirim, ten_letter_code, nama_outlet_delivery,
          gateway_asal, gateway_tujuan, kode_rute, nomor_pesanan_pelanggan,
          perusahaan_pengirim, telepon_rumah_pengirim, kelurahan_pengirim,
          penerima, perusahaan_penerima_paket, nomor_handphone_penerima,
          nomor_telepon_penerima, negara_penerima, provinsi_penerima, kota_penerima,
          area_penerima, kelurahan_penerima, jalan_penerima_paket,
          alamat_lengkap_penerima, kode_pos_penerima, jumlah_pembayaran_cod,
          jenis_barang, jumlah_koli, berat_pickup, waktu_input_pesanan
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        ) ON DUPLICATE KEY UPDATE
          nama_barang = VALUES(nama_barang),
          sumber_pesanan = VALUES(sumber_pesanan),
          outlet_pengirim = VALUES(outlet_pengirim),
          kode_pos_pengirim = VALUES(kode_pos_pengirim),
          provinsi_pengirim = VALUES(provinsi_pengirim),
          kota_pengirim = VALUES(kota_pengirim),
          area_pengirim = VALUES(area_pengirim),
          alamat_lengkap_pengirim = VALUES(alamat_lengkap_pengirim),
          pengirim = VALUES(pengirim),
          nomor_ponsel_pengirim = VALUES(nomor_ponsel_pengirim),
          ten_letter_code = VALUES(ten_letter_code),
          nama_outlet_delivery = VALUES(nama_outlet_delivery),
          gateway_asal = VALUES(gateway_asal),
          gateway_tujuan = VALUES(gateway_tujuan),
          kode_rute = VALUES(kode_rute),
          nomor_pesanan_pelanggan = VALUES(nomor_pesanan_pelanggan),
          perusahaan_pengirim = VALUES(perusahaan_pengirim),
          telepon_rumah_pengirim = VALUES(telepon_rumah_pengirim),
          kelurahan_pengirim = VALUES(kelurahan_pengirim),
          penerima = VALUES(penerima),
          perusahaan_penerima_paket = VALUES(perusahaan_penerima_paket),
          nomor_handphone_penerima = VALUES(nomor_handphone_penerima),
          nomor_telepon_penerima = VALUES(nomor_telepon_penerima),
          negara_penerima = VALUES(negara_penerima),
          provinsi_penerima = VALUES(provinsi_penerima),
          kota_penerima = VALUES(kota_penerima),
          area_penerima = VALUES(area_penerima),
          kelurahan_penerima = VALUES(kelurahan_penerima),
          jalan_penerima_paket = VALUES(jalan_penerima_paket),
          alamat_lengkap_penerima = VALUES(alamat_lengkap_penerima),
          kode_pos_penerima = VALUES(kode_pos_penerima),
          jumlah_pembayaran_cod = VALUES(jumlah_pembayaran_cod),
          jenis_barang = VALUES(jenis_barang),
          jumlah_koli = VALUES(jumlah_koli),
          berat_pickup = VALUES(berat_pickup),
          waktu_input_pesanan = VALUES(waktu_input_pesanan)`,
        [
          waybill, namaBarang, sumberPesanan, outletPengirim, kodePosPengirim,
          provinsiPengirim, kotaPengirim, areaPengirim, alamatLengkapPengirim,
          pengirim, nomorPonselPengirim, tenLetterCode, namaOutletDelivery,
          gatewayAsal, gatewayTujuan, kodeRute, nomorPesananPelanggan,
          perusahaanPengirim, teleponRumahPengirim, kelurahanPengirim,
          penerima, perusahaanPenerimaPaket, nomorHandphonePenerima,
          nomorTeleponPenerima, negaraPenerima, provinsiPenerima, kotaPenerima,
          areaPenerima, kelurahanPenerima, jalanPenerimaPaket,
          alamatLengkapPenerima, kodePosPenerima, jumlahPembayaranCod,
          jenisBarang, jumlahKoli, beratPickup, waktuInputPesanan
        ]
      );

      if (res.affectedRows === 1) insertedCount++;
      else if (res.affectedRows === 2) updatedCount++;
    }

    res.json({
      success: true,
      message: `Berhasil mengimport data PTO: ${insertedCount} order baru, ${updatedCount} order diperbarui.`,
      insertedCount,
      updatedCount,
      totalProcessed: rows.length
    });
  } catch (err) {
    console.error('importOrders error:', err);
    res.status(500).json({ error: 'Gagal mengimport data PTO: ' + err.message });
  }
};

// 6. PTO Automatic Background Synchronizer
let isPtoSyncInProgress = false;
let ptoSyncTimer = null;

async function syncPtoOrdersAutomatically(triggerType = 'auto') {
  if (isPtoSyncInProgress) {
    return { success: false, message: 'Sinkronisasi PTO sedang berlangsung di latar belakang.' };
  }
  isPtoSyncInProgress = true;
  await ensurePtoOrdersTable();

  try {
    const token = await getPtoToken();
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10) + ' 23:59:59';
    const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = past7.toISOString().slice(0, 10) + ' 00:00:00';

    let totalFetched = 0;
    let insertedCount = 0;
    let updatedCount = 0;

    // Helper: upsert batch of OMS records to pto_orders
    async function saveBatch(records) {
      for (const r of records) {
        if (!r || !r.waybillId) continue;
        const res = await db.query(`
          INSERT INTO pto_orders (
            waybill, nama_barang, sumber_pesanan, outlet_pengirim, kode_pos_pengirim,
            provinsi_pengirim, kota_pengirim, area_pengirim, alamat_lengkap_pengirim,
            pengirim, nomor_ponsel_pengirim, ten_letter_code, nama_outlet_delivery,
            nomor_pesanan_pelanggan, perusahaan_pengirim,
            penerima, perusahaan_penerima_paket, nomor_handphone_penerima,
            negara_penerima, provinsi_penerima, kota_penerima, area_penerima,
            alamat_lengkap_penerima, kode_pos_penerima, jumlah_pembayaran_cod,
            jenis_barang, jumlah_koli, berat_pickup, waktu_input_pesanan
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nama_barang = VALUES(nama_barang),
            sumber_pesanan = VALUES(sumber_pesanan),
            outlet_pengirim = VALUES(outlet_pengirim),
            pengirim = VALUES(pengirim),
            ten_letter_code = VALUES(ten_letter_code),
            nama_outlet_delivery = VALUES(nama_outlet_delivery),
            penerima = VALUES(penerima),
            alamat_lengkap_penerima = VALUES(alamat_lengkap_penerima),
            berat_pickup = VALUES(berat_pickup),
            waktu_input_pesanan = VALUES(waktu_input_pesanan)
        `, [
          r.waybillId,
          r.goodsName || '',
          r.orderSourceName || '',
          r.pickNetworkName || r.sendCode || '',
          r.senderPostalCode || '',
          r.senderProvinceName || '',
          r.senderCityName || '',
          r.senderAreaName || '',
          r.senderDetailedAddress || '',
          r.senderName || '',
          r.senderMobilePhone || r.senderTelphone || '',
          r.terminalDispatchCode || '',
          r.dispatchNetworkName || r.dispatchNetworkCode || '',
          r.customerOrderId || '',
          r.senderCompany || '',
          r.receiverName || '',
          r.receiverCompany || '',
          r.receiverMobilePhone || r.receiverTelphone || '',
          r.receiverCountryName || 'Indonesia',
          r.receiverProvinceName || '',
          r.receiverCityName || '',
          r.receiverAreaName || '',
          r.receiverDetailedAddress || '',
          r.receiverPostalCode || '',
          parseFloat(r.codMoney || r.goodsValue || 0) || 0,
          r.goodsTypeName || '',
          parseInt(r.packageNumber || 1, 10) || 1,
          parseFloat(r.packageTotalWeight || 0) || 0,
          r.inputTime || ''
        ]);
        if (res[0].affectedRows === 1) insertedCount++;
        else if (res[0].affectedRows === 2) updatedCount++;
      }
    }

    // 1. Coba Global Query (Khusus jika token SPV / Akun Indra terpasang)
    let isGlobalQueryWorking = false;
    try {
      const globalRes = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify({
        startDate,
        endDate,
        current: 1,
        size: 200,
        countryId: '1'
      }), token);

      if (globalRes && (globalRes.code === 1 || globalRes.succ === true) && globalRes.data?.records?.length > 0) {
        isGlobalQueryWorking = true;
        totalFetched += globalRes.data.records.length;
        await saveBatch(globalRes.data.records);
      }
    } catch (_) {}

    // 2. Jika bukan token SPV global (misal token akun user / outlet), sedot per outlet aktif
    if (!isGlobalQueryWorking) {
      let outletList = [];
      try {
        const [outletRows] = await db.query(`
          SELECT outlet_asal, COUNT(*) as cnt
          FROM monitoring_stuck
          WHERE outlet_asal IS NOT NULL AND outlet_asal != '-' AND outlet_asal != '' AND outlet_asal != 'JKT99A'
          GROUP BY outlet_asal
          ORDER BY cnt DESC
          LIMIT 25
        `);
        outletList = outletRows.map(r => r.outlet_asal).filter(Boolean);
      } catch (_) {}

      if (outletList.length === 0) {
        outletList = ['JKT006J', 'JKT085A', 'JKT160A', 'JKT187A', 'JKT218A', 'JKT157A', 'JKT219A', 'JKT256A', 'JKT081A', 'JKT109B', 'JKT114A', 'JKT074A'];
      }

      for (const outlet of outletList) {
        try {
          const res = await makeJfsPtoRequest('/customerplatform/omsOrderStatus/statusQuery', 'POST', JSON.stringify({
            startDate,
            endDate,
            current: 1,
            size: 100,
            countryId: '1',
            siteCode: outlet
          }), token);

          if (res && res.code === 1 && res.data?.records?.length > 0) {
            totalFetched += res.data.records.length;
            await saveBatch(res.data.records);
          }
        } catch (_) {}
      }
    }

    // 3. Simpan status sinkronisasi ke jfs_config
    const [totalRows] = await db.query('SELECT COUNT(*) as cnt FROM pto_orders');
    const currentTotal = totalRows[0]?.cnt || 0;
    const msg = `Sinkronisasi PTO sukses: ${insertedCount} order baru, ${updatedCount} diperbarui (Total: ${currentTotal} order)`;

    await db.query(`
      INSERT INTO jfs_config (config_key, config_value)
      VALUES ('pto_last_sync_time', NOW()),
             ('pto_last_sync_status', 'success'),
             ('pto_last_sync_message', ?),
             ('pto_last_sync_count', ?)
      ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
    `, [msg, String(currentTotal)]);

    console.log(`🤖 [PTO Sync] ${msg}`);
    return {
      success: true,
      message: msg,
      totalFetched,
      insertedCount,
      updatedCount,
      totalInDatabase: currentTotal
    };
  } catch (err) {
    console.error('⚠️ [PTO Sync] Error:', err.message);
    try {
      await db.query(`
        INSERT INTO jfs_config (config_key, config_value)
        VALUES ('pto_last_sync_time', NOW()),
               ('pto_last_sync_status', 'error'),
               ('pto_last_sync_message', ?)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [`Sinkronisasi PTO gagal: ${err.message}`]);
    } catch (_) {}
    return { success: false, message: err.message };
  } finally {
    isPtoSyncInProgress = false;
  }
}

function initPtoScheduler() {
  if (ptoSyncTimer) {
    clearInterval(ptoSyncTimer);
    ptoSyncTimer = null;
  }

  // Interval check every 5 minutes
  ptoSyncTimer = setInterval(async () => {
    try {
      console.log('⏰ [PTO Worker] Menjalankan auto-sync PTO terjadwal...');
      await syncPtoOrdersAutomatically('auto');
    } catch (e) {
      console.warn('⚠️ [PTO Worker] Scheduler error:', e.message);
    }
  }, 5 * 60 * 1000);

  // Trigger once on startup after 15 seconds
  setTimeout(async () => {
    try {
      console.log('🔄 [PTO Startup] Memulai auto-sync awal PTO...');
      await syncPtoOrdersAutomatically('startup');
    } catch (e) {
      console.warn('⚠️ [PTO Startup] Error:', e.message);
    }
  }, 15000);

  console.log('🤖 PTO Background Scheduler telah aktif (interval: 5 menit).');
}

exports.triggerSync = async (req, res) => {
  try {
    const result = await syncPtoOrdersAutomatically('manual');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSyncStatus = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT config_key, config_value
      FROM jfs_config
      WHERE config_key IN ('pto_last_sync_time', 'pto_last_sync_status', 'pto_last_sync_message', 'pto_last_sync_count')
    `);
    const statusMap = {};
    for (const r of rows) {
      statusMap[r.config_key] = r.config_value;
    }
    const [countRows] = await db.query('SELECT COUNT(*) as cnt FROM pto_orders');
    res.json({
      success: true,
      lastSyncTime: statusMap.pto_last_sync_time || null,
      lastSyncStatus: statusMap.pto_last_sync_status || 'idle',
      lastSyncMessage: statusMap.pto_last_sync_message || 'Belum ada riwayat sinkronisasi PTO.',
      totalOrders: countRows[0]?.cnt || 0,
      isSyncInProgress: isPtoSyncInProgress
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.syncPtoOrdersAutomatically = syncPtoOrdersAutomatically;
exports.initPtoScheduler = initPtoScheduler;


