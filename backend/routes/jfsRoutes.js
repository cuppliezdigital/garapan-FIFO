const express = require('express');
const router = express.Router();
const jfsController = require('../controllers/jfsController');
const { authMiddleware, requireRole, requireAnyPermission } = require('../middleware/auth');
const { PERMISSION_KEYS } = require('../services/permissionsService');

const requireAdminOrGm = requireRole('super_admin', 'admin');

// Public to any authenticated user (for header/dashboard status chips)
router.get('/status', authMiddleware, jfsController.getStatus);

// Sync trigger (admin, GM, or users with import permission)
router.post('/sync', authMiddleware, requireAnyPermission(PERMISSION_KEYS.IMPORT_BULK, PERMISSION_KEYS.FULL_ACCESS), jfsController.triggerSync);

// Configuration & Logs (Admin & GM only)
router.post('/config', authMiddleware, requireAdminOrGm, jfsController.updateConfig);
router.post('/test', authMiddleware, requireAdminOrGm, jfsController.testConnection);
router.get('/logs', authMiddleware, requireAdminOrGm, jfsController.getLogs);
router.delete('/logs', authMiddleware, requireAdminOrGm, jfsController.clearLogs);

// Flow Summary & Trend (For PC dashboard live widget & charts)
router.get('/flow-summary', authMiddleware, jfsController.getFlowSummary);
router.get('/flow-trend', authMiddleware, jfsController.getFlowTrend);

module.exports = router;
