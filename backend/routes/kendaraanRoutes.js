const express = require('express');
const router = express.Router();
const kendaraanController = require('../controllers/kendaraanController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const requireAdminOrGm = requireRole('super_admin', 'admin');

// Advance / Kendaraan routes (Admin & GM only)
router.get('/kendaraan/dashboard', authMiddleware, requireAdminOrGm, kendaraanController.getDashboard);
router.get('/kendaraan/list', authMiddleware, requireAdminOrGm, kendaraanController.getList);
router.post('/kendaraan', authMiddleware, requireAdminOrGm, kendaraanController.create);
router.post('/kendaraan/clear-all', authMiddleware, requireAdminOrGm, kendaraanController.clearAll);
router.delete('/kendaraan/all', authMiddleware, requireAdminOrGm, kendaraanController.clearAll);
router.put('/kendaraan/:id', authMiddleware, requireAdminOrGm, kendaraanController.update);
router.delete('/kendaraan/:id', authMiddleware, requireAdminOrGm, kendaraanController.delete);

// Sync from Google Sheet
router.post('/kendaraan/sync-sheet', authMiddleware, requireAdminOrGm, kendaraanController.syncFromGoogleSheet);

// Push to Feishu Webhook Bot
router.post('/kendaraan/push-feishu', authMiddleware, requireAdminOrGm, kendaraanController.pushToFeishu);

// Master Gateways Management
router.get('/kendaraan/gateways', authMiddleware, requireAdminOrGm, kendaraanController.getMasterGateways);
router.put('/kendaraan/gateways/:id', authMiddleware, requireAdminOrGm, kendaraanController.updateGatewayPic);

// Feishu Generator Dedicated Endpoints
router.get('/kendaraan/feishu-hold-list', authMiddleware, requireAdminOrGm, kendaraanController.getFeishuHoldList);
router.post('/kendaraan/feishu-batch-lookup', authMiddleware, requireAdminOrGm, kendaraanController.batchLookup);
router.get('/kendaraan/pic-map', authMiddleware, requireAdminOrGm, kendaraanController.getPicMap);

module.exports = router;

