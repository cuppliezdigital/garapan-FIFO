require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const monitoringRoutes = require('./routes/monitoringRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');
const kendaraanRoutes = require('./routes/kendaraanRoutes');
const jfsRoutes = require('./routes/jfsRoutes');
const ptoRoutes = require('./routes/ptoRoutes');
const fifoReportRoutes = require('./routes/fifoReportRoutes');

const app = express();
app.set('trust proxy', 1);

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || '';

if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'change_this_to_a_strong_random_secret')) {
  throw new Error('JWT_SECRET production wajib diisi dengan secret acak minimal 32 karakter.');
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://chedu2.tailad5890.ts.net',
  process.env.CLIENT_URL,
].filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin || origin === 'null') return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) return true;
    if (host.endsWith('.ts.net')) return true;
    if (host.endsWith('.trycloudflare.com') || host.endsWith('.cloudflare.com')) return true;
    if (host.endsWith('.up.railway.app') || host.endsWith('.railway.app')) return true;
    if (host.endsWith('.koyeb.app')) return true;
    if (host.endsWith('.onrender.com')) return true;
    if (host.endsWith('.vercel.app')) return true;
    if (process.env.ALLOWED_ORIGINS) {
      const extra = process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim().toLowerCase());
      if (extra.includes(origin.toLowerCase()) || extra.includes(host)) return true;
    }
  } catch (_) {}
  return false;
}

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https:', 'http:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    console.log('CORS Blocked Origin:', origin);
    callback(new Error('Origin tidak diizinkan oleh CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = /\.(png|jpe?g|webp)$/i;
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const ext = path.extname(file.originalname || '');
    if (allowedExts.test(ext) && allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Format file tidak diizinkan. Hanya file .png, .jpg, .jpeg, dan .webp yang diperbolehkan.'));
  },
});

app.use((req, res, next) => {
  req.upload = upload;
  next();
});

app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  const hostOrigins = host ? [`http://${host}`, `https://${host}`] : [];

  const isAllowedOrigin = isOriginAllowed(origin) || hostOrigins.includes(origin);
  const isAllowedReferer = !referer || isOriginAllowed(referer) || hostOrigins.some((item) => referer.startsWith(item));

  if (!isAllowedOrigin && !isAllowedReferer) {
    console.log('Security Blocked API Access:', { origin, referer, host, method: req.method });
    return res.status(403).json({ error: 'Permintaan lintas situs tidak diizinkan' });
  }
  next();
});
app.use('/api', monitoringRoutes);
app.use('/api', auditRoutes);
app.use('/api', kendaraanRoutes);
app.use('/api/jfs', jfsRoutes);
app.use('/api/pto', ptoRoutes);
app.use('/api/reports/fifo-spot', fifoReportRoutes);
app.use('/api/auth', authRoutes);

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir, {
  index: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  },
}));

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  if (err) {
    console.error('Unhandled error:', err.message);
    if (err.message && err.message.includes('Format file tidak diizinkan')) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 2MB.' });
      return;
    }
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'File import terlalu besar. Maksimal ukuran import adalah 50MB.' });
      return;
    }
    if (err.status === 429) {
      res.status(429).json({ error: err.message || 'Terlalu banyak request, silakan coba lagi nanti.' });
      return;
    }
    res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server' });
    return;
  }

  next();
});

async function initDatabase() {
  try {
    await require('./services/permissionsService').ensurePermissionsTables();
    await require('./services/authService').initAuthTables();
    await require('./services/monitoringService').initMonitoringTables();
    await require('./services/auditService').ensureAuditTable();
    await require('./services/logoService').ensureLogoTable();
    await require('./services/logoService').ensureBackgroundTable();
    await require('./services/kendaraanInitService').ensureKendaraanTables();
    await require('./services/jfsService').initJfs();
    require('./controllers/ptoController').initPtoScheduler();
    console.log('✅ Inisialisasi struktur database selesai.');
  } catch (err) {
    console.error('❌ Gagal inisialisasi database:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  await initDatabase();
});
