const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const gudangRuteController = require('../controllers/gudangRuteController');
const { authMiddleware } = require('../middleware/auth');

// Multer storage for uploaded Excel / CSV / TXT files
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}_${safeName}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 } // 300MB
});

router.get('/latest-file', authMiddleware, gudangRuteController.getLatestFileInfo);
router.get('/import-status', authMiddleware, gudangRuteController.getImportStatus);
router.post('/import', authMiddleware, gudangRuteController.importExcelData);
router.post('/upload-import', authMiddleware, upload.single('file'), gudangRuteController.uploadFileGudangData);
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
