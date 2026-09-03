const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const cookies = String(req.headers.cookie || '').split(';').reduce((result, part) => {
    const separator = part.indexOf('=');
    if (separator > 0) result[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
    return result;
  }, {});
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken && bearerToken !== 'cookie-session'
    ? bearerToken
    : cookies.monitoring_session;

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      return res.status(500).json({ error: 'Konfigurasi autentikasi server belum aman' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Akses ditolak. Role Anda tidak memiliki izin.' });
    }

    next();
  };
}

module.exports = { authMiddleware, requireRole };
