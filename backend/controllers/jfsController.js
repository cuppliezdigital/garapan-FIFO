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

module.exports = {
  getStatus,
  updateConfig,
  testConnection,
  triggerSync,
  getLogs,
  clearLogs,
  getFlowSummary,
  getFlowTrend,
};
