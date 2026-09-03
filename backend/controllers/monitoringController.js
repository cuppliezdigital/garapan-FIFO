const monitoringService = require('../services/monitoringService');

async function getMonitoring(req, res) {
  try {
    const data = await monitoringService.getAllMonitoring();
    res.json(data);
  } catch (error) {
    console.error('Controller getMonitoring error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server database' });
  }
}

async function createMonitoring(req, res) {
  const payload = req.body;

  if (!payload.waybill || !payload.tanggal || !payload.outlet) {
    return res.status(400).json({ error: 'Waybill, tanggal, dan outlet wajib diisi' });
  }

  try {
    const result = await monitoringService.createMonitoring(payload, req.user);
    res.status(201).json({
      message: 'Data berhasil ditambahkan',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('Controller createMonitoring error:', error);
    res.status(500).json({ error: 'Gagal menyimpan data monitoring' });
  }
}

async function updateMonitoring(req, res) {
  const waybill = req.params.waybill;

  try {
    const result = await monitoringService.updateMonitoring(waybill, req.body, req.user);

    if (!result.success) {
      return res.status(404).json({ error: 'Data monitoring tidak ditemukan' });
    }

    res.json({ message: 'Data berhasil diperbarui' });
  } catch (error) {
    console.error('Controller updateMonitoring error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data monitoring' });
  }
}

async function bulkUpdateMonitoring(req, res) {
  const waybills = Array.isArray(req.body?.waybills) ? req.body.waybills : [];
  const aksi = String(req.body?.aksi || '').trim();

  if (!waybills.length || !aksi) {
    return res.status(400).json({ error: 'Pilih data dan aksi update terlebih dahulu' });
  }

  try {
    const result = await monitoringService.bulkUpdateMonitoring(waybills, aksi, req.user);
    res.json({ message: 'Update banyak berhasil diproses', updatedCount: result.updatedCount });
  } catch (error) {
    console.error('Controller bulkUpdateMonitoring error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data monitoring secara bulk' });
  }
}

async function deleteMonitoring(req, res) {
  const waybill = req.params.waybill;

  try {
    const result = await monitoringService.deleteMonitoring(waybill, req.user);

    if (!result.success) {
      return res.status(404).json({ error: 'Data monitoring tidak ditemukan' });
    }

    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Controller deleteMonitoring error:', error);
    res.status(500).json({ error: 'Gagal menghapus data monitoring' });
  }
}

async function deleteAllMonitoring(req, res) {
  try {
    const result = await monitoringService.deleteAllMonitoring(req.user);
    res.json({ message: 'Semua data monitoring berhasil dihapus permanen', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Controller deleteAllMonitoring error:', error);
    res.status(500).json({ error: 'Gagal menghapus semua data monitoring' });
  }
}

async function getMonitoringHistory(req, res) {
  try {
    const rows = await monitoringService.getAllMonitoringHistory();
    res.json(rows);
  } catch (error) {
    console.error('Controller getMonitoringHistory error:', error);
    res.status(500).json({ error: 'Gagal mengambil history monitoring' });
  }
}

async function getMonitoringArchive(req, res) {
  try {
    res.json(await monitoringService.getAllMonitoringArchive());
  } catch (error) {
    console.error('Controller getMonitoringArchive error:', error);
    res.status(500).json({ error: 'Gagal mengambil arsip waybill' });
  }
}

async function bulkArchiveMonitoring(req, res) {
  const waybills = Array.isArray(req.body?.waybills) ? req.body.waybills : [];
  if (!waybills.length) return res.status(400).json({ error: 'Pilih waybill yang ingin diarsipkan' });
  try {
    res.json(await monitoringService.archiveMonitoring(waybills));
  } catch (error) {
    console.error('Controller bulkArchiveMonitoring error:', error);
    res.status(500).json({ error: 'Gagal mengarsipkan waybill' });
  }
}

async function bulkRestoreMonitoring(req, res) {
  const waybills = Array.isArray(req.body?.waybills) ? req.body.waybills : [];
  if (!waybills.length) return res.status(400).json({ error: 'Pilih arsip yang ingin dipulihkan' });
  try {
    res.json(await monitoringService.restoreMonitoring(waybills));
  } catch (error) {
    console.error('Controller bulkRestoreMonitoring error:', error);
    res.status(500).json({ error: 'Gagal memulihkan arsip waybill' });
  }
}

async function updateMonitoringArchive(req, res) {
  try {
    const result = await monitoringService.updateMonitoringArchive(req.params.waybill, req.body, req.user);
    if (!result.success) return res.status(404).json({ error: 'Arsip waybill tidak ditemukan' });
    res.json({ message: 'Arsip waybill berhasil diperbarui' });
  } catch (error) {
    console.error('Controller updateMonitoringArchive error:', error);
    res.status(500).json({ error: 'Gagal memperbarui arsip waybill' });
  }
}

async function deleteAllMonitoringHistory(req, res) {
  try {
    const result = await monitoringService.deleteAllMonitoringHistory(req.user);
    res.json({ message: 'Semua history monitoring berhasil dihapus', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Controller deleteAllMonitoringHistory error:', error);
    res.status(500).json({ error: 'Gagal menghapus semua history monitoring' });
  }
}

async function importMonitoringBulk(req, res) {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!rows.length) {
    return res.status(400).json({ error: 'Data import wajib diisi' });
  }

  try {
    const result = await monitoringService.bulkImportMonitoring(rows, req.user);
    res.status(200).json({
      message: 'Import data berhasil diproses',
      importedCount: result.importedCount,
      totalRows: result.rows,
      skippedCount: result.skippedCount,
      overwrittenCount: result.overwrittenCount,
      deletedCount: result.deletedCount,
      historyCount: result.historyCount,
    });
  } catch (error) {
    console.error('Controller importMonitoringBulk error:', error);
    res.status(500).json({ error: 'Gagal memproses import bulk data monitoring' });
  }
}

module.exports = {
  getMonitoring,
  createMonitoring,
  updateMonitoring,
  bulkUpdateMonitoring,
  deleteMonitoring,
  deleteAllMonitoring,
  getMonitoringHistory,
  getMonitoringArchive,
  bulkArchiveMonitoring,
  bulkRestoreMonitoring,
  updateMonitoringArchive,
  deleteAllMonitoringHistory,
  importMonitoringBulk,
};
