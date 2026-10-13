const express = require('express');
const router = express.Router();
const ptoController = require('../controllers/ptoController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const requireAdminOrGm = requireRole('super_admin', 'admin');

router.post('/query', authMiddleware, requireAdminOrGm, ptoController.queryOrders);
router.get('/detail/:id', authMiddleware, requireAdminOrGm, ptoController.getOrderDetail);
router.get('/config', authMiddleware, requireAdminOrGm, ptoController.getConfig);
router.post('/config', authMiddleware, requireAdminOrGm, ptoController.saveConfig);

module.exports = router;
