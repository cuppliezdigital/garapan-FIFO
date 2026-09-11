const express = require('express');
const monitoringController = require('../controllers/monitoringController');
const { validateMonitoringPayload } = require('../middleware/monitoringValidation');
const { authMiddleware, requirePermission, requireAnyPermission } = require('../middleware/auth');
const { PERMISSION_KEYS } = require('../services/permissionsService');

const router = express.Router();

router.get('/monitoring', authMiddleware, monitoringController.getMonitoring);

router.get('/monitoring/history', authMiddleware, requirePermission(PERMISSION_KEYS.VIEW_HISTORY), monitoringController.getMonitoringHistory);
router.delete('/monitoring/history', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_HISTORY), monitoringController.deleteAllMonitoringHistory);

router.get('/monitoring/archive', authMiddleware, requirePermission(PERMISSION_KEYS.VIEW_HISTORY), monitoringController.getMonitoringArchive);

router.post('/monitoring', authMiddleware, requireAnyPermission(PERMISSION_KEYS.EDIT_MONITORING, PERMISSION_KEYS.IMPORT_BULK), validateMonitoringPayload, monitoringController.createMonitoring);
router.post('/monitoring/import', authMiddleware, requirePermission(PERMISSION_KEYS.IMPORT_BULK), monitoringController.importMonitoringBulk);

router.patch('/monitoring/bulk-update', authMiddleware, requirePermission(PERMISSION_KEYS.EDIT_MONITORING), monitoringController.bulkUpdateMonitoring);
router.patch('/monitoring/restore-update', authMiddleware, requirePermission(PERMISSION_KEYS.RESTORE_UPDATED), monitoringController.restoreMonitoringUpdate);
router.patch('/monitoring/:waybill/restore-update', authMiddleware, requirePermission(PERMISSION_KEYS.RESTORE_UPDATED), monitoringController.restoreMonitoringUpdate);

router.patch('/monitoring/archive', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_GLOBAL), monitoringController.bulkArchiveMonitoring);
router.patch('/monitoring/archive/restore', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_GLOBAL), monitoringController.bulkRestoreMonitoring);
router.put('/monitoring/archive/:waybill', authMiddleware, requirePermission(PERMISSION_KEYS.VIEW_HISTORY), validateMonitoringPayload, monitoringController.updateMonitoringArchive);

router.delete('/monitoring/all', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_GLOBAL), monitoringController.deleteAllMonitoring);
router.delete('/monitoring/bulk', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_SELECTED), monitoringController.bulkDeleteMonitoring);

router.put('/monitoring/:waybill', authMiddleware, requirePermission(PERMISSION_KEYS.EDIT_MONITORING), validateMonitoringPayload, monitoringController.updateMonitoring);
router.delete('/monitoring/:waybill', authMiddleware, requirePermission(PERMISSION_KEYS.DELETE_GLOBAL), monitoringController.deleteMonitoring);

module.exports = router;
