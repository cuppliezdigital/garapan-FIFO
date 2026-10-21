const jfsService = require('../services/jfsService');
const auditService = require('../services/auditService');

async function getStatus(req, res) {
  try {
    const config = await jfsService.getConfig();
    res.json({
      success: true,
      config: {
        scanSiteCode: config.scanSiteCode,
        scanSiteCodeName: config.scanSiteCodeName,
        autoSyncEnabled: config.autoSyncEnabled,
        syncIntervalMinutes: config.syncIntervalMinutes,
        lastSyncTime: config.lastSyncTime,
        lastSyncStatus: config.lastSyncStatus,
        lastSyncMessage: config.lastSyncMessage,
        lastSyncCount: config.lastSyncCount,
        authtoken: config.authtoken,
      },
    });
  } catch (error) {
    console.error('jfsController getStatus error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil status JFS' });
  }
}

async function updateConfig(req, res) {
  try {
    const payload = req.body || {};
    const updated = await jfsService.updateConfig(payload);

    if (req.user) {
      await auditService.logAudit({
        userId: req.user.id,
        username: req.user.username,
        action: 'jfs_config_update',
        entityType: 'jfs_config',
        entityId: 'CONFIG',
        details: {
          scanSiteCode: updated.scanSiteCode,
          autoSyncEnabled: updated.autoSyncEnabled,
          syncIntervalMinutes: updated.syncIntervalMinutes,
          tokenUpdated: Boolean(payload.authtoken),
          actorRole: req.user.role,
        },
      });
    }

    res.json({
      success: true,
      message: 'Pengaturan JFS berhasil disimpan',
      config: updated,
    });
  } catch (error) {
    console.error('jfsController updateConfig error:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan pengaturan JFS' });
  }
}

async function testConnection(req, res) {
  try {
    const { authtoken, scanSiteCode } = req.body || {};
    const result = await jfsService.testJfsConnection(authtoken, scanSiteCode);
    res.json(result);
  } catch (error) {
    console.error('jfsController testConnection error:', error);
    res.status(400).json({ success: false, error: error.message || 'Koneksi ke JFS gagal' });
  }
}

async function triggerSync(req, res) {
  try {
    const result = await jfsService.syncJfsToDatabase('manual', req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    if (req.user) {
      await auditService.logAudit({
        userId: req.user.id,
        username: req.user.username,
        action: 'jfs_manual_sync',
        entityType: 'monitoring',
        entityId: 'JFS_SYNC',
        details: {
          totalFetched: result.totalFetched,
          importedCount: result.importedCount,
          historyCount: result.historyCount,
          deletedCount: result.deletedCount,
          durationSeconds: result.durationSeconds,
          actorRole: req.user.role,
        },
      });
    }

    res.json(result);
  } catch (error) {
    console.error('jfsController triggerSync error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal melakukan sinkronisasi JFS' });
  }
}

async function getLogs(req, res) {
  try {
    const limit = req.query.limit || 15;
    const logs = await jfsService.getRecentLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('jfsController getLogs error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil log sinkronisasi JFS' });
  }
}

async function clearLogs(req, res) {
  try {
    const result = await jfsService.clearLogs(req.user);
    if (req.user) {
      await auditService.logAudit({
        userId: req.user.id,
        username: req.user.username,
        action: 'jfs_clear_logs',
        entityType: 'jfs_sync_logs',
        entityId: 'ALL',
        details: { actorRole: req.user.role },
      });
    }
    res.json(result);
  } catch (error) {
    console.error('jfsController clearLogs error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menghapus log sinkronisasi JFS' });
  }
}

async function getFlowSummary(req, res) {
  try {
    const { siteCode, date } = req.query || {};
    const result = await jfsService.getJfsFlowSummary(siteCode, date);
    res.json(result);
  } catch (error) {
    console.error('jfsController getFlowSummary error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal mengambil ringkasan beban muat JFS' });
  }
}

async function getFlowTrend(req, res) {
  try {
    const { siteCode, beginDate, endDate } = req.query || {};
    const result = await jfsService.getJfsFlowTrend(siteCode, beginDate, endDate);
    res.json(result);
  } catch (error) {
    console.error('jfsController getFlowTrend error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal mengambil tren beban muat JFS' });
  }
}

async function getFlowDetail(req, res) {
  try {
    const result = await jfsService.getJfsFlowDetail(req.query);
    res.json(result);
  } catch (error) {
    console.error('jfsController getFlowDetail error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal mengambil rincian data waybill JFS' });
  }
}

async function printWaybillPdf(req, res) {
  try {
    const { waybillNo, waybillNos, type = [4, 5], isRetur = false } = req.body || {};
    const checkIsRetur = isRetur === true || type === 'retur' || (Array.isArray(type) && type.includes('retur'));

    // MODE KHUSUS RETUR / PENGEMBALIAN BARANG
    if (checkIsRetur) {
      if (Array.isArray(waybillNos) && waybillNos.length > 0) {
        const cleanList = waybillNos
          .map(w => String(w).trim())
          .filter(Boolean)
          .map(w => (w.length === 15 ? w.slice(0, 12) : w));

        const uniqueList = [...new Set(cleanList)];
        const results = [];
        const CONCURRENCY = 5;
        for (let i = 0; i < uniqueList.length; i += CONCURRENCY) {
          const batch = uniqueList.slice(i, i + CONCURRENCY);
          const batchPromises = batch.map(wb => jfsService.getReturWaybillPrint(wb));
          const batchRes = await Promise.all(batchPromises);
          results.push(...batchRes);
        }

        return res.json({
          success: true,
          isRetur: true,
          total: results.length,
          results
        });
      }

      const cleanWb = String(waybillNo || '').trim();
      const targetWb = cleanWb.length === 15 ? cleanWb.slice(0, 12) : cleanWb;
      const result = await jfsService.getReturWaybillPrint(targetWb);
      return res.json(result);
    }

    // Jika dipanggil dengan array nomor resi (Mode Batch Multi-AWB)
    if (Array.isArray(waybillNos) && waybillNos.length > 0) {
      const cleanList = waybillNos
        .map(w => String(w).trim())
        .filter(Boolean)
        .map(w => (w.length === 15 ? w.slice(0, 12) : w));

      const uniqueList = [...new Set(cleanList)];
      const results = [];

      // Eksekusi secara konkuren maksimal 5 request sekaligus
      const CONCURRENCY = 5;
      for (let i = 0; i < uniqueList.length; i += CONCURRENCY) {
        const batch = uniqueList.slice(i, i + CONCURRENCY);
        const batchPromises = batch.map(async (wb) => {
          try {
            const r = await jfsService.getWaybillPrintPdf(wb, type);
            return { waybillNo: wb, success: true, pdfUrl: r.pdfUrl };
          } catch (err) {
            return { waybillNo: wb, success: false, error: err.message };
          }
        });
        const batchRes = await Promise.all(batchPromises);
        results.push(...batchRes);
      }

      return res.json({
        success: true,
        total: results.length,
        results
      });
    }

    // Mode single waybill
    const cleanWb = String(waybillNo || '').trim();
    const targetWb = cleanWb.length === 15 ? cleanWb.slice(0, 12) : cleanWb;
    const result = await jfsService.getWaybillPrintPdf(targetWb, type);
    res.json(result);
  } catch (error) {
    console.error('jfsController printWaybillPdf error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal membuat URL cetak waybill' });
  }
}

async function previewWaybills(req, res) {
  try {
    const { waybillNos } = req.body || {};
    const result = await jfsService.getWaybillPrintPreview(waybillNos);
    res.json(result);
  } catch (error) {
    console.error('jfsController previewWaybills error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal membaca preview waybill' });
  }
}

async function getWajibKirimList(req, res) {
  try {
    const result = await jfsService.getWajibKirimData(req.query);
    res.json(result);
  } catch (error) {
    console.error('❌ jfsController getWajibKirimList error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memuat data Wajib Kirim' });
  }
}

async function syncWajibKirim(req, res) {
  try {
    console.log(`⚡ [JFS Wajib Kirim] Menerima request sinkronisasi manual dari user: ${req.user?.username || 'unknown'} (role: ${req.user?.role})`);
    const result = await jfsService.syncWajibKirimData(req.body);
    console.log(`✅ [JFS Wajib Kirim] Sinkronisasi selesai: ${result.upsertCount} koli disimpan.`);
    res.json(result);
  } catch (error) {
    console.error('❌ jfsController syncWajibKirim error:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menyinkronkan data Wajib Kirim' });
  }
}

module.exports = {
  getWajibKirimList,
  syncWajibKirim,
  getStatus,
  updateConfig,
  testConnection,
  triggerSync,
  getLogs,
  clearLogs,
  getFlowSummary,
  getFlowTrend,
  getFlowDetail,
  printWaybillPdf,
  previewWaybills,
};

