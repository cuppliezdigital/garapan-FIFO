const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const permissionsService = require('../services/permissionsService');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const cookies = String(req.headers.cookie || '').split(';').reduce((result, part) => {
    const separator = part.indexOf('=');
    if (separator > 0) result[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
    return result;
  }, {});
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken && bearerToken !== 'cookie-session' && bearerToken !== 'null' && bearerToken !== ''
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

    if (!decoded.sid) {
      return res.status(401).json({ error: 'Sesi tidak valid. Silakan login ulang.' });
    }

    authService.isSessionValid(decoded.id, decoded.sid)
      .then((valid) => {
        if (!valid) {
          return res.status(401).json({ error: 'Sesi Anda telah berakhir atau digunakan di perangkat lain. Silakan login ulang.' });
        }
        return authService.touchSession(decoded.id, decoded.sid).catch(() => null);
      })
      .then(async () => {
        if (res.writableEnded) return;
        try {
          req.user = decoded;
          try {
            req.permissions = await permissionsService.getEffectivePermissions(decoded.id, decoded.role);
          } catch (permError) {
            console.error('Permission resolve error (fallback to empty):', permError.message);
            req.permissions = [];
          }
          next();
        } catch (error) {
          console.error('Auth middleware post-session error:', error.message);
          return res.status(500).json({ error: 'Gagal memuat data sesi' });
        }
      })
      .catch((error) => {
        console.error('Session validation error:', error.message);
        return res.status(500).json({ error: 'Gagal memvalidasi sesi' });
      });
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    const effectiveRoles = allowedRoles.includes('super_admin') || allowedRoles.includes('admin')
      ? [...allowedRoles, 'super_admin']
      : allowedRoles;

    if (!effectiveRoles.includes(role)) {
      return res.status(403).json({ error: 'Akses ditolak. Role Anda tidak memiliki izin.' });
    }

    next();
  };
}

function requirePermission(...permissionKeys) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Sesi tidak ditemukan' });
    }
    if (req.user.role === 'super_admin') {
      req.permissionKeys = permissionKeys;
      return next();
    }
    if (!permissionKeys.length) {
      return next();
    }

    try {
      const checks = await Promise.all(
        permissionKeys.map((key) => permissionsService.userHasPermission(req.user.id, req.user.role, key))
      );
      const allGranted = checks.every(Boolean);
      if (!allGranted) {
        return res.status(403).json({ error: 'Akses ditolak. Izin Anda tidak mencukupi.' });
      }
      req.permissionKeys = permissionKeys;
      next();
    } catch (error) {
      console.error('Permission check error:', error.message);
      return res.status(500).json({ error: 'Gagal memeriksa izin' });
    }
  };
}

module.exports = { authMiddleware, requireRole, requirePermission };
