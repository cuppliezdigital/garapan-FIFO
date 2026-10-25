const express = require('express');
const router = express.Router();
const gudangRuteController = require('../controllers/gudangRuteController');
const { authMiddleware } = require('../middleware/auth');

router.get('/latest-file', authMiddleware, gudangRuteController.getLatestFileInfo);
router.get('/import-status', authMiddleware, gudangRuteController.getImportStatus);
router.post('/import', authMiddleware, gudangRuteController.importExcelData);
router.post('/query', authMiddleware, gudangRuteController.queryInventory);
router.post('/trace', authMiddleware, gudangRuteController.getPodTrace);
router.post('/enrich', authMiddleware, gudangRuteController.enrichWaybill);

module.exports = router;
