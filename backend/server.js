require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const monitoringRoutes = require('./routes/monitoringRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || '';

if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'change_this_to_a_strong_random_secret')) {
  throw new Error('JWT_SECRET production wajib diisi dengan secret acak minimal 32 karakter.');
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

app.use((req, res, next) => {
  req.upload = upload;
  next();
});

app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowed = !origin || allowedOrigins.includes(origin) || (referer && allowedOrigins.some((item) => referer.startsWith(item)));
  
  if (!allowed) {
    console.log('Security Blocked API Access:', { origin, referer, method: req.method });
    return res.status(403).json({ error: 'Permintaan lintas situs tidak diizinkan' });
  }
  next();
});
app.use('/api', monitoringRoutes);
app.use('/api', auditRoutes);
app.use('/api/auth', authRoutes);

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir, {
  index: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  },
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  if (err) {
    console.error('Unhandled error:', err.message);
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'File import terlalu besar. Maksimal ukuran import adalah 50MB.' });
      return;
    }
    if (err.status === 429) {
      res.status(429).json({ error: 'Terlalu banyak request, silakan coba lagi nanti.' });
      return;
    }
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    return;
  }

  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
