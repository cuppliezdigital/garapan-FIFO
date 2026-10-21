const https = require('https');
const db = require('../config/db');
const {
  enrichKendaraanOutlets,
  fetchFollow,
  GSHEET_LOG_UPDATE_URL,
  parseCsvLine,
  parseCustomDate
} = require('../services/kendaraanInitService');

// Feishu Webhook Bot URL from Google Sheet
const FEISHU_WEBHOOK_URL = process.env.FEISHU_KENDARAAN_WEBHOOK || 'https://open.feishu.cn/open-apis/bot/v2/hook/990b847e-226e-42dd-9a97-7064a5ab6b73';

function getIndonesianDate(d = new Date()) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function computeDashboardSummary(rows) {
  let siapMuatPnkBdj = 0;
  let totalMotorDokumen = 0;
  let totalSpl = 0;
  let totalMotorHold = 0;

  const matrix = {
    PNK: { motor_bensin_dok: 0, motor_listrik_dok: 0, total_motor_dok: 0, spl_on: 0, spl_off: 0, total_spl: 0, motor_bensin_nondok: 0, motor_listrik_nondok: 0, total_nondok: 0 },
    BDJ: { motor_bensin_dok: 0, motor_listrik_dok: 0, total_motor_dok: 0, spl_on: 0, spl_off: 0, total_spl: 0, motor_bensin_nondok: 0, motor_listrik_nondok: 0, total_nondok: 0 },
    LAINNYA: { motor_bensin_dok: 0, motor_listrik_dok: 0, total_motor_dok: 0, spl_on: 0, spl_off: 0, total_spl: 0, motor_bensin_nondok: 0, motor_listrik_nondok: 0, total_nondok: 0 }
  };

  const holdList = [];

  rows.forEach(item => {
    if (item.status_muat === 'sudah_muat') return;

    let dest = (item.tlc_tujuan || 'LAINNYA').toUpperCase();
    if (!matrix[dest]) dest = 'LAINNYA';

    const tipe = (item.tipe_kendaraan || '').toLowerCase();
    const isMotorBensin = tipe.includes('bensin');
    const isMotorListrik = tipe.includes('motor') && tipe.includes('listrik');
    const isMotor = isMotorBensin || isMotorListrik || tipe.includes('motor');
    const isSpl = tipe.includes('sepeda');

    const isDokLengkap = (item.status_dokumen || '').toLowerCase() === 'lengkap';
    const isSplOn = (item.status_spl || '').toUpperCase() === 'ON';

    if (isMotor) {
      if (isDokLengkap) {
        totalMotorDokumen++;
        if (dest === 'PNK' || dest === 'BDJ') siapMuatPnkBdj++;

        if (isMotorListrik) {
          matrix[dest].motor_listrik_dok++;
        } else {
          matrix[dest].motor_bensin_dok++;
        }
        matrix[dest].total_motor_dok++;
      } else {
        totalMotorHold++;
        if (isMotorListrik) {
          matrix[dest].motor_listrik_nondok++;
        } else {
          matrix[dest].motor_bensin_nondok++;
        }
        matrix[dest].total_nondok++;
        holdList.push(item);
      }
    } else if (isSpl) {
      totalSpl++;
      if (dest === 'PNK' || dest === 'BDJ') siapMuatPnkBdj++;

      if (isSplOn) {
        matrix[dest].spl_on++;
      } else {
        matrix[dest].spl_off++;
      }
      matrix[dest].total_spl++;
    }
  });

  const totalRow = {
    motor_bensin_dok: matrix.PNK.motor_bensin_dok + matrix.BDJ.motor_bensin_dok + matrix.LAINNYA.motor_bensin_dok,
    motor_listrik_dok: matrix.PNK.motor_listrik_dok + matrix.BDJ.motor_listrik_dok + matrix.LAINNYA.motor_listrik_dok,
    total_motor_dok: matrix.PNK.total_motor_dok + matrix.BDJ.total_motor_dok + matrix.LAINNYA.total_motor_dok,
    spl_on: matrix.PNK.spl_on + matrix.BDJ.spl_on + matrix.LAINNYA.spl_on,
    spl_off: matrix.PNK.spl_off + matrix.BDJ.spl_off + matrix.LAINNYA.spl_off,
    total_spl: matrix.PNK.total_spl + matrix.BDJ.total_spl + matrix.LAINNYA.total_spl,
    motor_bensin_nondok: matrix.PNK.motor_bensin_nondok + matrix.BDJ.motor_bensin_nondok + matrix.LAINNYA.motor_bensin_nondok,
    motor_listrik_nondok: matrix.PNK.motor_listrik_nondok + matrix.BDJ.motor_listrik_nondok + matrix.LAINNYA.motor_listrik_nondok,
    total_nondok: matrix.PNK.total_nondok + matrix.BDJ.total_nondok + matrix.LAINNYA.total_nondok
  };

  const todayStr = getIndonesianDate();
  const pnkMotor = matrix.PNK.total_motor_dok;
  const pnkSpl = matrix.PNK.total_spl;
  const pnkTotal = pnkMotor + pnkSpl;
  const bdjMotor = matrix.BDJ.total_motor_dok;
  const bdjSpl = matrix.BDJ.total_spl;
  const bdjTotal = bdjMotor + bdjSpl;
  const totalKeseluruhan = pnkTotal + bdjTotal;

  const capacityWaTemplate = 
`Selamat Siang team Update instock
Update kendaraan PNK
${todayStr}
Motor : ${pnkMotor} unit
spl : ${pnkSpl} unit
total : ${pnkTotal} unit

Update Kendaraan BDJ
${todayStr}
Motor : ${bdjMotor} unit
spl : ${bdjSpl} unit
total : ${bdjTotal} unit

total keseluruhan : ${totalKeseluruhan} unit`;

  let dokumenWaTemplate = `Selamat pagi kak, tolong dibantu untuk kelengkapan dokumen kendaraan dengan awb berikut terimakasih :\n`;
  holdList.forEach(it => {
    const outlet = it.effective_outlet || '';
    const gw = it.effective_gateway ? ` ${it.effective_gateway}` : '';
    const pic = it.effective_pic ? ` ${it.effective_pic}` : '';
    dokumenWaTemplate += `${it.awb} ${outlet}${gw}${pic}\n`.replace(/\s+/g, ' ').trim() + '\n';
  });

  return {
    kpi: {
      siap_muat_pnk_bdj: siapMuatPnkBdj,
      total_motor_dokumen: totalMotorDokumen,
      total_spl: totalSpl,
      total_motor_hold: totalMotorHold,
      total_aktif: rows.length
    },
    matrix: {
      PNK: matrix.PNK,
      BDJ: matrix.BDJ,
      LAINNYA: matrix.LAINNYA,
      TOTAL: totalRow
    },
    templates: {
      capacity_wa: capacityWaTemplate,
      dokumen_wa: dokumenWaTemplate.trim()
    },
    hold_list: holdList
  };
}

// 1. Get Dashboard Summary & Broadcast Templates
exports.getDashboard = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        k.*,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      ORDER BY k.tanggal_input DESC
    `);

    const summary = computeDashboardSummary(rows);
    res.json({
      success: true,
      ...summary
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: 'Gagal memuat dashboard kendaraan: ' + err.message });
  }
};

// 2. Get List of Vehicles
exports.getList = async (req, res) => {
  try {
    const { tujuan, tipe, status_dokumen, status_muat, search } = req.query;

    let query = `
      SELECT 
        k.*,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      WHERE 1=1
    `;
    const params = [];

    if (tujuan && tujuan !== 'all') {
      query += ` AND k.tlc_tujuan = ?`;
      params.push(tujuan.toUpperCase());
    }

    if (tipe && tipe !== 'all') {
      query += ` AND k.tipe_kendaraan = ?`;
      params.push(tipe);
    }

    if (status_dokumen && status_dokumen !== 'all') {
      query += ` AND k.status_dokumen = ?`;
      params.push(status_dokumen);
    }

    if (status_muat && status_muat !== 'all') {
      query += ` AND k.status_muat = ?`;
      params.push(status_muat);
    }

    if (search) {
      query += ` AND (k.awb LIKE ? OR k.keterangan LIKE ? OR k.spot_petugas LIKE ? OR k.kode_outlet LIKE ? OR COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) LIKE ? OR COALESCE(k.tagging_pic, m.tagging_pic, gl.tagging_pic) LIKE ?)`;
      const kw = `%${search}%`;
      params.push(kw, kw, kw, kw, kw, kw);
    }

    query += ` ORDER BY k.tanggal_input DESC`;

    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('getList error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar kendaraan: ' + err.message });
  }
};

// 3. Create Single Kendaraan (Web Form / Scanner)
exports.create = async (req, res) => {
  try {
    const { awb, tlc_tujuan, tipe_kendaraan, status_spl, status_dokumen, koli, keterangan, kode_outlet } = req.body;

    if (!awb || !tlc_tujuan || !tipe_kendaraan) {
      return res.status(400).json({ error: 'AWB, TLC Tujuan, dan Tipe Kendaraan wajib diisi.' });
    }

    const cleanAwb = String(awb).trim();
    const cleanTlc = String(tlc_tujuan).trim().toUpperCase();
    const cleanTipe = String(tipe_kendaraan).trim();
    const cleanKoli = parseInt(koli, 10) || 1;

    // Lookup outlet & gateway if not provided
    let finalOutlet = kode_outlet ? String(kode_outlet).trim() : null;
    let finalGateway = null;
    let finalPic = null;

    if (!finalOutlet) {
      // Find from monitoring_stuck, monitoring_history, or history
      try {
        const [hist] = await db.query(`
          SELECT outlet FROM monitoring_stuck WHERE waybill = ?
          UNION ALL
          SELECT outlet FROM monitoring_history WHERE waybill = ?
          UNION ALL
          SELECT outlet FROM history WHERE waybill = ?
          LIMIT 1
        `, [cleanAwb, cleanAwb, cleanAwb]);
        if (hist && hist.length > 0 && hist[0].outlet) {
          finalOutlet = hist[0].outlet;
        }
      } catch (_) {}
    }

    if (finalOutlet) {
      const [gw] = await db.query('SELECT nama_gateway, tagging_pic FROM master_pic_gateway WHERE kode_outlet = ? LIMIT 1', [finalOutlet]);
      if (gw && gw.length > 0) {
        finalGateway = gw[0].nama_gateway;
        finalPic = gw[0].tagging_pic;
      }
    }

    let statusMuat = 'belum_muat';
    if (cleanTipe.toLowerCase().includes('motor') && status_dokumen === 'Tidak') {
      statusMuat = 'hold';
    }

    const spotPetugas = req.user ? (req.user.full_name || req.user.username || 'Admin') : 'Web App';

    const [result] = await db.query(`
      INSERT INTO kendaraan_instock
        (awb, tanggal_input, spot_petugas, tlc_tujuan, tipe_kendaraan, status_spl, status_dokumen, koli, keterangan, kode_outlet, nama_gateway, tagging_pic, status_muat)
      VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [cleanAwb, spotPetugas, cleanTlc, cleanTipe, status_spl || null, status_dokumen || null, cleanKoli, keterangan || null, finalOutlet, finalGateway, finalPic, statusMuat]);

    const [inserted] = await db.query(`
      SELECT 
        k.*,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      WHERE k.id = ?
    `, [result.insertId]);

    res.json({
      success: true,
      message: 'Data kendaraan berhasil disimpan.',
      id: result.insertId,
      data: inserted[0]
    });
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ error: 'Gagal menambahkan kendaraan: ' + err.message });
  }
};

// 4. Update Kendaraan
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { tlc_tujuan, tipe_kendaraan, status_spl, status_dokumen, status_muat, koli, keterangan, kode_outlet } = req.body;

    const [existing] = await db.query('SELECT * FROM kendaraan_instock WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Data kendaraan tidak ditemukan.' });
    }

    let finalMuat = status_muat || existing[0].status_muat;
    const newDokumen = status_dokumen !== undefined ? status_dokumen : existing[0].status_dokumen;
    const curTipe = tipe_kendaraan || existing[0].tipe_kendaraan;

    if (curTipe.toLowerCase().includes('motor')) {
      if (newDokumen === 'Lengkap' && finalMuat === 'hold') {
        finalMuat = 'belum_muat';
      } else if (newDokumen === 'Tidak') {
        finalMuat = 'hold';
      }
    }

    await db.query(`
      UPDATE kendaraan_instock
      SET 
        tlc_tujuan = COALESCE(?, tlc_tujuan),
        tipe_kendaraan = COALESCE(?, tipe_kendaraan),
        status_spl = ?,
        status_dokumen = ?,
        status_muat = ?,
        koli = COALESCE(?, koli),
        keterangan = ?,
        kode_outlet = COALESCE(?, kode_outlet)
      WHERE id = ?
    `, [
      tlc_tujuan ? tlc_tujuan.toUpperCase() : null,
      tipe_kendaraan || null,
      status_spl || null,
      newDokumen,
      finalMuat,
      koli || null,
      keterangan || null,
      kode_outlet || null,
      id
    ]);

    const [updated] = await db.query(`
      SELECT 
        k.*,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      WHERE k.id = ?
    `, [id]);

    res.json({ success: true, message: 'Data kendaraan berhasil diperbarui.', data: updated[0] });
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ error: 'Gagal memperbarui kendaraan: ' + err.message });
  }
};

// 5. Delete Kendaraan
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID kendaraan tidak valid.' });
    }
    await db.query('DELETE FROM kendaraan_instock WHERE id = ?', [id]);
    res.json({ success: true, message: 'Data kendaraan berhasil dihapus.' });
  } catch (err) {
    console.error('delete error:', err);
    res.status(500).json({ error: 'Gagal menghapus kendaraan: ' + err.message });
  }
};

// 5b. Clear All Kendaraan Instock
exports.clearAll = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM kendaraan_instock');
    res.json({
      success: true,
      message: `Semua data kendaraan instock (${result.affectedRows || 0} unit) berhasil dihapus.`,
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error('clearAll error:', err);
    res.status(500).json({ error: 'Gagal menghapus semua data kendaraan: ' + err.message });
  }
};


// 6. Realtime Sync from Google Sheet (AppSheet LOG_UPDATE)
exports.syncFromGoogleSheet = async (req, res) => {
  try {
    const csvContent = await fetchFollow(GSHEET_LOG_UPDATE_URL);
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);

    const sheetRows = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const appsheetId = (row[0] || '').trim();
      const awb = (row[3] || '').trim();
      if (!awb) continue;

      const timestamp = parseCustomDate(row[1]);
      const spotPetugas = (row[2] || '').trim() || null;
      let tlcTujuan = (row[4] || 'LAINNYA').trim().toUpperCase();
      if (tlcTujuan !== 'PNK' && tlcTujuan !== 'BDJ') tlcTujuan = 'LAINNYA';

      const tipeKendaraan = (row[5] || 'Motor Bensin').trim();
      const statusSpl = (row[6] || '').trim() || null;
      const statusDokumen = (row[7] || '').trim() || null;
      const koli = parseInt(row[8], 10) || 1;
      const keterangan = (row[9] || '').trim() || null;

      let statusMuat = 'belum_muat';
      if (tipeKendaraan.toLowerCase().includes('motor') && statusDokumen === 'Tidak') {
        statusMuat = 'hold';
      }

      sheetRows.push({
        appsheetId,
        awb,
        timestamp,
        spotPetugas,
        tlcTujuan,
        tipeKendaraan,
        statusSpl,
        statusDokumen,
        koli,
        keterangan,
        statusMuat
      });
    }

    if (sheetRows.length === 0) {
      // 1:1 synchronization with AppSheet / Google Sheet:
      // If Google Sheet has 0 rows, clear database table kendaraan_instock as well
      await db.query('DELETE FROM kendaraan_instock');
      const summary = computeDashboardSummary([]);

      return res.json({
        success: true,
        message: 'Sinkronisasi sukses! Google Sheet saat ini kosong (0 unit aktif). Data instock di database telah dikosongkan.',
        synced_count: 0,
        kpi: summary.kpi,
        matrix: summary.matrix,
        templates: summary.templates,
        data: []
      });
    }

    // Full 1:1 synchronization with AppSheet / Google Sheet
    await db.query('DELETE FROM kendaraan_instock');

    const insertValues = sheetRows.map(r => [
      r.appsheetId,
      r.awb,
      r.timestamp,
      r.spotPetugas,
      r.tlcTujuan,
      r.tipeKendaraan,
      r.statusSpl,
      r.statusDokumen,
      r.koli,
      r.keterangan,
      r.statusMuat
    ]);

    await db.query(`
      INSERT INTO kendaraan_instock
        (appsheet_id, awb, tanggal_input, spot_petugas, tlc_tujuan, tipe_kendaraan, status_spl, status_dokumen, koli, keterangan, status_muat)
      VALUES ?
    `, [insertValues]);

    // Collation-safe outlet & gateway enrichment
    await enrichKendaraanOutlets();

    // Query refreshed dataset to return in same response (eliminates multiple HTTP roundtrips)
    const [refreshedRows] = await db.query(`
      SELECT 
        k.*,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      ORDER BY k.tanggal_input DESC
    `);

    const summary = computeDashboardSummary(refreshedRows);

    res.json({
      success: true,
      message: `Sinkronisasi sukses! ${sheetRows.length} unit kendaraan berhasil disinkronkan 1:1 dengan Google Sheet.`,
      synced_count: sheetRows.length,
      kpi: summary.kpi,
      matrix: summary.matrix,
      templates: summary.templates,
      data: refreshedRows
    });
  } catch (err) {
    console.error('sync error:', err);
    res.status(500).json({ error: 'Gagal sinkronisasi Google Sheet: ' + err.message });
  }
};

// 7. Push Notification to Feishu Webhook Bot
exports.pushToFeishu = async (req, res) => {
  try {
    let bodyText = req.body && req.body.text ? String(req.body.text).trim() : '';

    if (!bodyText) {
      const [holdRows] = await db.query(`
        SELECT 
          k.awb,
          k.tlc_tujuan,
          k.tipe_kendaraan,
          k.kode_outlet as effective_outlet,
          COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
          COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
        FROM kendaraan_instock k
        LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
        LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
        WHERE k.status_muat = 'hold' OR (k.tipe_kendaraan LIKE '%Motor%' AND k.status_dokumen = 'Tidak')
        ORDER BY k.tanggal_input DESC
      `);

      if (holdRows.length === 0) {
        return res.json({ success: true, message: 'Tidak ada unit kendaraan yang berstatus HOLD (Non-Dokumen).' });
      }

      bodyText = `🚨 **UPDATE KENDARAAN HOLD (DOKUMEN TIDAK LENGKAP)**\n` +
        `📅 Waktu: ${getIndonesianDate()} | Total: ${holdRows.length} Unit\n\n` +
        `Tolong dibantu kelengkapan dokumen kendaraan berikut:\n`;

      holdRows.forEach((item, idx) => {
        const outlet = item.effective_outlet || '-';
        const gw = item.effective_gateway || '-';
        const pic = item.effective_pic ? ` (${item.effective_pic})` : '';
        bodyText += `${idx + 1}. **${item.awb}** | ${item.tlc_tujuan} | ${outlet} | ${gw}${pic}\n`;
      });
    }

    const payload = JSON.stringify({
      msg_type: 'text',
      content: {
        text: bodyText
      }
    });

    const url = new URL(FEISHU_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const feishuReq = https.request(options, (feishuRes) => {
      let respData = '';
      feishuRes.on('data', chunk => respData += chunk);
      feishuRes.on('end', () => {
        try {
          const json = JSON.parse(respData);
          if (json.StatusCode === 0 || json.code === 0) {
            res.json({ success: true, message: 'Pesan berhasil terkirim ke Bot Feishu!', feishu_response: json });
          } else {
            res.status(400).json({ error: 'Gagal kirim ke Feishu: ' + (json.msg || json.message || respData) });
          }
        } catch (e) {
          res.json({ success: true, message: 'Pesan berhasil terkirim ke Bot Feishu.' });
        }
      });
    });

    feishuReq.on('error', (e) => {
      res.status(500).json({ error: 'Koneksi ke Feishu gagal: ' + e.message });
    });

    feishuReq.write(payload);
    feishuReq.end();
  } catch (err) {
    console.error('pushToFeishu error:', err);
    res.status(500).json({ error: 'Gagal memproses Feishu: ' + err.message });
  }
};

// 8. Master Gateways List
exports.getMasterGateways = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM master_gateway_list ORDER BY nama_gateway ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat master gateway: ' + err.message });
  }
};

// 9. Update Master Gateway PIC
exports.updateGatewayPic = async (req, res) => {
  try {
    const { id } = req.params;
    const { tagging_pic } = req.body;

    const [gw] = await db.query('SELECT nama_gateway FROM master_gateway_list WHERE id = ?', [id]);
    await db.query(`
      UPDATE master_gateway_list
      SET tagging_pic = ?
      WHERE id = ?
    `, [tagging_pic || null, id]);

    if (gw && gw.length > 0 && gw[0].nama_gateway) {
      const gwName = gw[0].nama_gateway;
      const cleanPic = tagging_pic ? String(tagging_pic).trim() : null;
      const displayPic = cleanPic ? (cleanPic.startsWith('@') ? cleanPic : `@${cleanPic}`) : '';
      const display = gwName + (displayPic ? ` ${displayPic}` : '');

      await db.query('UPDATE master_pic_gateway SET tagging_pic = ?, display_gateway_pic = ? WHERE nama_gateway = ?', [cleanPic, display, gwName]).catch(() => null);
      await db.query('UPDATE kendaraan_instock SET tagging_pic = ? WHERE nama_gateway = ?', [cleanPic, gwName]).catch(() => null);
    }

    res.json({ success: true, message: 'PIC Gateway berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update PIC Gateway: ' + err.message });
  }
};

// 9b. Bulk Import Master Gateway PIC
exports.bulkImportGatewayPic = async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Data baris CSV/Excel tidak boleh kosong' });
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (const r of rows) {
      const namaGateway = String(r.nama_gateway || r.gateway || r.Gateway || r['Nama Gateway'] || '').trim();
      const taggingPic = String(r.tagging_pic || r.pic || r.PIC || r['Nama PIC'] || '').trim();

      if (!namaGateway) continue;

      // Update or insert into master_gateway_list
      const [existingGw] = await db.query('SELECT id FROM master_gateway_list WHERE UPPER(nama_gateway) = UPPER(?) LIMIT 1', [namaGateway]);
      if (existingGw && existingGw.length > 0) {
        await db.query('UPDATE master_gateway_list SET tagging_pic = ? WHERE id = ?', [taggingPic || null, existingGw[0].id]);
        updatedCount++;
      } else {
        await db.query('INSERT INTO master_gateway_list (nama_gateway, tagging_pic) VALUES (?, ?)', [namaGateway, taggingPic || null]);
        insertedCount++;
      }

      // Also update master_pic_gateway if present so outlets inherit this PIC
      await db.query('UPDATE master_pic_gateway SET tagging_pic = ? WHERE UPPER(nama_gateway) = UPPER(?)', [taggingPic || null, namaGateway]).catch(() => null);
    }

    res.json({
      success: true,
      message: `Berhasil mengimpor PIC Gateway: ${updatedCount} diperbarui, ${insertedCount} baru ditambahkan.`,
      updatedCount,
      insertedCount,
    });
  } catch (err) {
    console.error('bulkImportGatewayPic error:', err);
    res.status(500).json({ error: 'Gagal import massal PIC Gateway: ' + err.message });
  }
};

// 10. Lookup AWB or Outlet for Auto-fill
exports.lookup = async (req, res) => {
  try {
    const { query } = req.params;
    const cleanQ = String(query).trim();

    // 1. Try finding outlet from monitoring or history by waybill (prioritizing outlet_asal)
    let outlet = null;
    try {
      const [hist] = await db.query(`
        SELECT COALESCE(NULLIF(outlet_asal, ''), outlet) AS outlet FROM monitoring_stuck WHERE waybill = ?
        UNION ALL
        SELECT COALESCE(NULLIF(outlet_asal, ''), outlet) AS outlet FROM monitoring_history WHERE waybill = ?
        UNION ALL
        SELECT outlet FROM history WHERE waybill = ?
        LIMIT 1
      `, [cleanQ, cleanQ, cleanQ]);
      if (hist && hist.length > 0 && hist[0].outlet) {
        outlet = hist[0].outlet;
      } else {
        outlet = cleanQ;
      }
    } catch (_) {
      outlet = cleanQ;
    }

    // 2. Lookup gateway & PIC from master_pic_gateway
    const [gw] = await db.query('SELECT kode_outlet, nama_gateway, tagging_pic FROM master_pic_gateway WHERE kode_outlet = ? LIMIT 1', [outlet]);
    if (gw && gw.length > 0) {
      return res.json({
        success: true,
        found: true,
        kode_outlet: gw[0].kode_outlet,
        nama_gateway: gw[0].nama_gateway,
        tagging_pic: gw[0].tagging_pic
      });
    }

    // 3. Fallback: check if cleanQ matches a gateway name directly
    const [gwList] = await db.query('SELECT nama_gateway, tagging_pic FROM master_gateway_list WHERE nama_gateway LIKE ? LIMIT 1', [`%${cleanQ}%`]);
    if (gwList && gwList.length > 0) {
      return res.json({
        success: true,
        found: true,
        kode_outlet: outlet !== cleanQ ? outlet : null,
        nama_gateway: gwList[0].nama_gateway,
        tagging_pic: gwList[0].tagging_pic
      });
    }

    res.json({
      success: true,
      found: false,
      kode_outlet: outlet !== cleanQ ? outlet : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Lookup error: ' + err.message });
  }
};

// 11. Get Feishu Hold List (with full Gateway & PIC mapping)
exports.getFeishuHoldList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        k.id,
        k.awb,
        k.tlc_tujuan,
        k.tipe_kendaraan,
        k.status_dokumen,
        k.tanggal_input,
        k.keterangan,
        k.kode_outlet as effective_outlet,
        COALESCE(k.nama_gateway, m.nama_gateway, gl.nama_gateway) as effective_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic, k.tagging_pic) as effective_pic
      FROM kendaraan_instock k
      LEFT JOIN master_pic_gateway m ON k.kode_outlet = m.kode_outlet
      LEFT JOIN master_gateway_list gl ON COALESCE(k.nama_gateway, m.nama_gateway) = gl.nama_gateway
      WHERE (k.tipe_kendaraan LIKE '%Motor%' AND k.status_dokumen != 'Lengkap') OR k.status_muat = 'hold'
      ORDER BY k.tanggal_input DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('getFeishuHoldList error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar tagihan dokumen: ' + err.message });
  }
};

// 12. Batch Lookup Multi AWB for Feishu Generator
exports.batchLookup = async (req, res) => {
  try {
    const { awb_list } = req.body;
    if (!awb_list || !Array.isArray(awb_list) || awb_list.length === 0) {
      return res.status(400).json({ error: 'Daftar AWB wajib diisi berupa array.' });
    }

    const cleanAwbs = [...new Set(awb_list.map(a => String(a).trim()).filter(Boolean))];
    if (cleanAwbs.length === 0) {
      return res.status(400).json({ error: 'Tidak ada nomor AWB yang valid.' });
    }

    // 1. Fetch outlets from monitoring tables or history
    let historyRows = [];
    try {
      const [rows] = await db.query(`
        SELECT waybill, outlet FROM monitoring_stuck WHERE waybill IN (?)
        UNION ALL
        SELECT waybill, outlet FROM monitoring_history WHERE waybill IN (?)
        UNION ALL
        SELECT waybill, outlet FROM history WHERE waybill IN (?)
      `, [cleanAwbs, cleanAwbs, cleanAwbs]);
      historyRows = rows || [];
    } catch (_) {}

    const awbToOutlet = {};
    const outletsSet = new Set();
    historyRows.forEach(r => {
      if (r.waybill && r.outlet) {
        awbToOutlet[r.waybill] = r.outlet;
        outletsSet.add(r.outlet);
      }
    });

    // 2. Fetch gateways and PICs from master_pic_gateway
    const outletToGw = {};
    if (outletsSet.size > 0) {
      const [picRows] = await db.query(
        `SELECT m.kode_outlet, m.nama_gateway, m.tagging_pic
         FROM master_pic_gateway m
         WHERE m.kode_outlet IN (?)`,
        [[...outletsSet]]
      );
      picRows.forEach(p => {
        outletToGw[p.kode_outlet] = {
          nama_gateway: p.nama_gateway,
          tagging_pic: p.tagging_pic
        };
      });
    }

    // 3. Assemble response preserving input order
    const result = cleanAwbs.map(awb => {
      const outlet = awbToOutlet[awb] || null;
      const gwInfo = outlet ? outletToGw[outlet] : null;

      return {
        awb,
        outlet,
        nama_gateway: gwInfo ? gwInfo.nama_gateway : null,
        tagging_pic: gwInfo ? gwInfo.tagging_pic : null
      };
    });

    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (err) {
    console.error('batchLookup error:', err);
    res.status(500).json({ error: 'Gagal melakukan batch lookup: ' + err.message });
  }
};

// 13. Get Entire Outlet to PIC Map (for instantaneous Excel-like client lookup)
exports.getPicMap = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.kode_outlet,
        m.nama_gateway,
        COALESCE(gl.tagging_pic, m.tagging_pic) as tagging_pic,
        m.display_gateway_pic
      FROM master_pic_gateway m
      LEFT JOIN master_gateway_list gl ON m.nama_gateway = gl.nama_gateway
    `);

    const map = {};
    rows.forEach(r => {
      if (r.kode_outlet) {
        const cleanOutlet = String(r.kode_outlet).toUpperCase().trim();
        const gw = r.nama_gateway || '';
        const pic = r.tagging_pic || 'PIC';
        map[cleanOutlet] = {
          nama_gateway: gw,
          tagging_pic: pic,
          display: r.display_gateway_pic || (gw ? `${gw} @${pic}` : '')
        };
      }
    });

    res.json({
      success: true,
      count: Object.keys(map).length,
      data: map
    });
  } catch (err) {
    console.error('getPicMap error:', err);
    res.status(500).json({ error: 'Gagal memuat mapping PIC: ' + err.message });
  }
};

// 14. Register / Add New Outlet Mapping to Master PIC Gateway
exports.registerOutlet = async (req, res) => {
  try {
    const { kode_outlet, nama_gateway, tagging_pic } = req.body || {};
    if (!kode_outlet || !nama_gateway) {
      return res.status(400).json({ error: 'Kode outlet dan Nama Gateway wajib diisi.' });
    }

    const cleanOutlet = String(kode_outlet).trim().toUpperCase();
    const cleanGateway = String(nama_gateway).trim();
    let finalPic = tagging_pic ? String(tagging_pic).trim() : null;

    // Jika tagging_pic tidak diisi manual, warisi dari master_gateway_list
    if (!finalPic) {
      const [gwRows] = await db.query(
        'SELECT tagging_pic FROM master_gateway_list WHERE UPPER(nama_gateway) = UPPER(?) LIMIT 1',
        [cleanGateway]
      );
      if (gwRows && gwRows.length > 0 && gwRows[0].tagging_pic) {
        finalPic = gwRows[0].tagging_pic;
      }
    }

    const display = cleanGateway + (finalPic ? ` @${finalPic}` : '');

    await db.query(`
      INSERT INTO master_pic_gateway (kode_outlet, nama_gateway, tagging_pic, display_gateway_pic)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama_gateway = VALUES(nama_gateway),
        tagging_pic = VALUES(tagging_pic),
        display_gateway_pic = VALUES(display_gateway_pic)
    `, [cleanOutlet, cleanGateway, finalPic, display]);

    res.json({
      success: true,
      message: `Outlet ${cleanOutlet} berhasil didaftarkan ke ${cleanGateway}${finalPic ? ` (PIC: @${finalPic})` : ''}`,
      data: {
        kode_outlet: cleanOutlet,
        nama_gateway: cleanGateway,
        tagging_pic: finalPic || 'PIC',
        display_gateway_pic: display,
      }
    });
  } catch (err) {
    console.error('registerOutlet error:', err);
    res.status(500).json({ error: 'Gagal mendaftarkan outlet: ' + err.message });
  }
};

// 15. Get AWB Report Counts
exports.getReportCounts = async (req, res) => {
  try {
    const { awbs } = req.body || {};
    if (!Array.isArray(awbs) || awbs.length === 0) {
      return res.json({ success: true, counts: {} });
    }
    const cleanAwbs = [...new Set(awbs.map(a => String(a).trim()).filter(Boolean))];
    if (cleanAwbs.length === 0) {
      return res.json({ success: true, counts: {} });
    }
    const [rows] = await db.query(
      'SELECT awb, report_count, last_reported_at FROM kendaraan_report_tracking WHERE awb IN (?)',
      [cleanAwbs]
    );
    const counts = {};
    rows.forEach(r => {
      counts[r.awb] = {
        count: r.report_count || 1,
        lastReportedAt: r.last_reported_at,
      };
    });
    res.json({ success: true, counts });
  } catch (err) {
    console.error('getReportCounts error:', err);
    res.status(500).json({ error: 'Gagal membaca riwayat report: ' + err.message });
  }
};

// 16. Increment AWB Report Counts (when user copies/dispatches report)
exports.incrementReportCounts = async (req, res) => {
  try {
    const { awbs } = req.body || {};
    if (!Array.isArray(awbs) || awbs.length === 0) {
      return res.json({ success: true, message: 'Tidak ada AWB diproses' });
    }
    const cleanAwbs = [...new Set(awbs.map(a => String(a).trim()).filter(Boolean))];
    if (cleanAwbs.length === 0) {
      return res.json({ success: true, message: 'Tidak ada AWB valid' });
    }

    for (const awb of cleanAwbs) {
      await db.query(`
        INSERT INTO kendaraan_report_tracking (awb, report_count, first_reported_at, last_reported_at)
        VALUES (?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          report_count = report_count + 1,
          last_reported_at = NOW()
      `, [awb]);
    }

    res.json({
      success: true,
      message: `Berhasil mencatat riwayat penagihan untuk ${cleanAwbs.length} resi.`,
    });
  } catch (err) {
    console.error('incrementReportCounts error:', err);
    res.status(500).json({ error: 'Gagal menyimpan riwayat penagihan: ' + err.message });
  }
};





