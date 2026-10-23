const express = require('express');
const router = express.Router();
const fifoReportController = require('../controllers/fifoReportController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const requireAdminOrGm = requireRole('super_admin', 'admin', 'admin-gm', 'gm');

// Akses dibatasi khusus super_admin dan admin
router.get('/', authMiddleware, requireAdminOrGm, fifoReportController.getFifoSpotReport);
router.post('/sync', authMiddleware, requireAdminOrGm, fifoReportController.syncFifoSpotData);
router.get('/mappings', authMiddleware, requireAdminOrGm, fifoReportController.getSpotMappings);
router.post('/mappings', authMiddleware, requireAdminOrGm, fifoReportController.saveSpotMapping);
router.delete('/mappings/:id', authMiddleware, requireAdminOrGm, fifoReportController.deleteSpotMapping);

module.exports = router;

