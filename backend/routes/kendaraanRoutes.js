const express = require('express');
const router = express.Router();
const kendaraanController = require('../controllers/kendaraanController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public/authenticated routes for all users with access
router.get('/kendaraan/dashboard', authMiddleware, kendaraanController.getDashboard);
router.get('/kendaraan/list', authMiddleware, kendaraanController.getList);
router.post('/kendaraan', authMiddleware, kendaraanController.create);
router.put('/kendaraan/:id', authMiddleware, kendaraanController.update);
router.delete('/kendaraan/:id', authMiddleware, kendaraanController.delete);

// Sync from Google Sheet
router.post('/kendaraan/sync-sheet', authMiddleware, kendaraanController.syncFromGoogleSheet);

// Push to Feishu Webhook Bot
router.post('/kendaraan/push-feishu', authMiddleware, kendaraanController.pushToFeishu);

// Master Gateways Management
router.get('/kendaraan/gateways', authMiddleware, kendaraanController.getMasterGateways);
router.put('/kendaraan/gateways/:id', authMiddleware, kendaraanController.updateGatewayPic);

// Feishu Generator Dedicated Endpoints
router.get('/kendaraan/feishu-hold-list', authMiddleware, kendaraanController.getFeishuHoldList);
router.post('/kendaraan/feishu-batch-lookup', authMiddleware, kendaraanController.batchLookup);
router.get('/kendaraan/pic-map', authMiddleware, kendaraanController.getPicMap);

module.exports = router;
