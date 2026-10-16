const express = require('express');
const router = express.Router();
const jfsController = require('../controllers/jfsController');
const { authMiddleware, requireRole, requireAnyPermission } = require('../middleware/auth');
const { PERMISSION_KEYS } = require('../services/permissionsService');

const requireAdminOrGm = requireRole('super_admin', 'admin');

// Public to any authenticated user (for header/dashboard status chips)
router.get('/status', authMiddleware, jfsController.getStatus);

// Sync trigger (Bisa dipicu oleh semua akun terautentikasi termasuk Operator HP)
router.post('/sync', authMiddleware, jfsController.triggerSync);

// Configuration & Logs (Admin & GM only)
router.post('/config', authMiddleware, requireAdminOrGm, jfsController.updateConfig);
router.post('/test', authMiddleware, requireAdminOrGm, jfsController.testConnection);
router.get('/logs', authMiddleware, requireAdminOrGm, jfsController.getLogs);
router.delete('/logs', authMiddleware, requireAdminOrGm, jfsController.clearLogs);

// Flow Summary, Trend & Detail Waybill (For PC dashboard live widget & charts)
router.get('/flow-summary', authMiddleware, jfsController.getFlowSummary);
router.get('/flow-trend', authMiddleware, jfsController.getFlowTrend);
router.get('/flow-detail', authMiddleware, jfsController.getFlowDetail);

// Waybill Thermal Print & Preview (Bisa diakses oleh semua operator yang login)
router.post('/print-waybill', authMiddleware, jfsController.printWaybillPdf);
router.post('/preview-waybill', authMiddleware, jfsController.previewWaybills);

module.exports = router;

