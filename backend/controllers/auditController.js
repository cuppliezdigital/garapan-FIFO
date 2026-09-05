const auditService = require('../services/auditService');

async function getAuditLogs(req, res) {
  try {
    const logs = await auditService.getAuditLogs(req.user?.role);
    res.json(logs);
  } catch (error) {
    console.error('Controller getAuditLogs error:', error);
    res.status(500).json({ error: 'Gagal mengambil log audit' });
  }
}

async function deleteAllAuditLogs(req, res) {
  try {
    const result = await auditService.deleteAllAuditLogs();
    res.json({ message: 'Semua audit log berhasil dihapus permanen', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Controller deleteAllAuditLogs error:', error);
    res.status(500).json({ error: 'Gagal menghapus semua audit log' });
  }
}

module.exports = {
  getAuditLogs,
  deleteAllAuditLogs,
};
