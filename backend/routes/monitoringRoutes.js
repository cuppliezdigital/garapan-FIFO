const express = require('express');
const monitoringController = require('../controllers/monitoringController');
const { validateMonitoringPayload } = require('../middleware/monitoringValidation');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/monitoring', authMiddleware, monitoringController.getMonitoring);
router.get('/monitoring/history', authMiddleware, requireRole('admin'), monitoringController.getMonitoringHistory);
router.get('/monitoring/archive', authMiddleware, requireRole('admin'), monitoringController.getMonitoringArchive);
router.delete('/monitoring/history', authMiddleware, requireRole('admin'), monitoringController.deleteAllMonitoringHistory);
router.post('/monitoring', authMiddleware, requireRole('admin'), validateMonitoringPayload, monitoringController.createMonitoring);
router.post('/monitoring/import', authMiddleware, requireRole('admin'), monitoringController.importMonitoringBulk);
router.patch('/monitoring/bulk-update', authMiddleware, requireRole('admin'), monitoringController.bulkUpdateMonitoring);
router.patch('/monitoring/archive', authMiddleware, requireRole('admin'), monitoringController.bulkArchiveMonitoring);
router.patch('/monitoring/archive/restore', authMiddleware, requireRole('admin'), monitoringController.bulkRestoreMonitoring);
router.put('/monitoring/archive/:waybill', authMiddleware, requireRole('admin'), validateMonitoringPayload, monitoringController.updateMonitoringArchive);
router.delete('/monitoring/all', authMiddleware, requireRole('admin'), monitoringController.deleteAllMonitoring);
router.put('/monitoring/:waybill', authMiddleware, requireRole('admin'), validateMonitoringPayload, monitoringController.updateMonitoring);
router.delete('/monitoring/:waybill', authMiddleware, requireRole('admin'), monitoringController.deleteMonitoring);

module.exports = router;
