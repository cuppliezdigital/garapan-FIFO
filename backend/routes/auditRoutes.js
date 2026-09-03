const express = require('express');

const auditController = require('../controllers/auditController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/audit', authMiddleware, requireRole('admin'), auditController.getAuditLogs);
router.delete('/audit', authMiddleware, requireRole('admin'), auditController.deleteAllAuditLogs);

module.exports = router;
