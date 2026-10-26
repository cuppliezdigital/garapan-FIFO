const express = require('express');
const router = express.Router();
const gudangRuteController = require('../controllers/gudangRuteController');
const { authMiddleware } = require('../middleware/auth');

router.get('/latest-file', authMiddleware, gudangRuteController.getLatestFileInfo);
router.get('/import-status', authMiddleware, gudangRuteController.getImportStatus);
router.post('/import', authMiddleware, gudangRuteController.importExcelData);
router.post('/paste-import', authMiddleware, gudangRuteController.pasteImportGudangData);
router.post('/check-existing', authMiddleware, gudangRuteController.checkExistingWaybills);
router.post('/query', authMiddleware, gudangRuteController.queryInventory);

// POD Tracking & Scanning History
router.get('/pod-trace/:waybill', authMiddleware, gudangRuteController.getPodTrace);
router.post('/pod-trace/:waybill', authMiddleware, gudangRuteController.getPodTrace);
router.post('/pod-trace', authMiddleware, gudangRuteController.getPodTrace);
router.get('/trace/:waybill', authMiddleware, gudangRuteController.getPodTrace);
router.post('/trace', authMiddleware, gudangRuteController.getPodTrace);

// Waybill Goods & Customer Enrichment
router.post('/enrich', authMiddleware, gudangRuteController.enrichWaybill);
router.post('/bulk-enrich', authMiddleware, gudangRuteController.bulkEnrichWaybills);
router.get('/bulk-enrich-status', authMiddleware, gudangRuteController.getBulkEnrichStatus);
router.post('/bulk-enrich-stop', authMiddleware, gudangRuteController.cancelBulkEnrich);
router.post('/sync-local-db', authMiddleware, gudangRuteController.instantDbEnrich);
router.post('/instant-db-enrich', authMiddleware, gudangRuteController.instantDbEnrich);

module.exports = router;
