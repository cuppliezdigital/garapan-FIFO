const authService = require('../services/authService');
const permissionsService = require('../services/permissionsService');

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      message: 'User berhasil dibuat',
      user,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Registrasi gagal' });
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `monitoring_session=${encodeURIComponent(result.token)}; HttpOnly; Path=/; Max-Age=1800; SameSite=Strict${secure}`);
    res.json({ user: result.user });
  } catch (error) {
    res.status(401).json({ error: error.message || 'Login gagal' });
  }
}

async function logout(req, res) {
  try {
    if (req.user && req.user.id && req.user.sid) {
      await authService.revokeSession(req.user.id, req.user.sid);
    }
  } catch (error) {
    console.error('Logout revoke error:', error.message);
  }
  res.setHeader('Set-Cookie', 'monitoring_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  res.json({ message: 'Logout berhasil' });
}

async function getUsers(req, res) {
  try {
    const includeAdmin = req.user?.role === 'super_admin';
    const users = includeAdmin
      ? await authService.getAllUsersIncludingAdmin(req.user)
      : await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Controller getUsers error:', error);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
}

async function toggleUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const nextStatus = req.body?.status === 'blocked' ? 'blocked' : 'active';
    const result = await authService.toggleUserStatus(userId, nextStatus, req.user.id, req.user.role);

    if (!result.success) {
      const map = {
        self: { status: 400, message: 'Anda tidak dapat memblokir akun Anda sendiri' },
        protected_role: { status: 403, message: 'Akun super_admin tidak dapat diblokir' },
        forbidden: { status: 403, message: 'Hanya super_admin yang dapat memblokir akun admin' },
      };
      const entry = map[result.reason] || { status: 404, message: 'User tidak ditemukan' };
      return res.status(entry.status).json({ error: entry.message });
    }

    res.json({ message: `Status user diubah ke ${nextStatus}` });
  } catch (error) {
    console.error('Controller toggleUserStatus error:', error);
    res.status(500).json({ error: 'Gagal mengubah status user' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const result = await authService.deleteUser(userId, req.user.id, req.user.role);

    if (!result.success) {
      const map = {
        self: { status: 400, message: 'Anda tidak dapat menghapus akun Anda sendiri' },
        protected_role: { status: 403, message: 'Akun super_admin tidak dapat dihapus' },
        forbidden: { status: 403, message: 'Hanya super_admin yang dapat menghapus akun admin' },
      };
      const entry = map[result.reason] || { status: 404, message: 'User tidak ditemukan' };
      return res.status(entry.status).json({ error: entry.message });
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Controller deleteUser error:', error);
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
}

async function getPermissionCatalog(req, res) {
  try {
    await permissionsService.ensurePermissionsTables();
    res.json({
      catalog: permissionsService.PERMISSION_CATALOG,
    });
  } catch (error) {
    console.error('Controller getPermissionCatalog error:', error);
    res.status(500).json({ error: 'Gagal memuat katalog izin' });
  }
}

async function getUserPermissions(req, res) {
  try {
    const userId = Number(req.params.id);
    const [rows] = await require('../config/db').query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'User tidak ditemukan' });
    const target = rows[0];
    const permissions = await permissionsService.getEffectivePermissions(userId, target.role);
    res.json({ userId, role: target.role, permissions });
  } catch (error) {
    console.error('Controller getUserPermissions error:', error);
    res.status(500).json({ error: 'Gagal memuat izin user' });
  }
}

async function updateUserPermissions(req, res) {
  try {
    const userId = Number(req.params.id);
    const payload = req.body?.permissions && typeof req.body.permissions === 'object'
      ? req.body.permissions
      : req.body;
    const result = await permissionsService.updateUserPermissions(userId, payload, req.user);
    if (!result.success) {
      const map = {
        not_found: { status: 404, message: 'User tidak ditemukan' },
        cannot_modify_super_admin: { status: 403, message: 'Role super_admin tidak dapat diubah' },
        cannot_modify_admin: { status: 403, message: 'Role admin tidak dapat diubah dari sini' },
      };
      const entry = map[result.reason] || { status: 400, message: 'Gagal memperbarui izin user' };
      return res.status(entry.status).json({ error: entry.message });
    }
    res.json({ message: 'Izin user berhasil diperbarui', permissions: result.permissions });
  } catch (error) {
    console.error('Controller updateUserPermissions error:', error);
    res.status(500).json({ error: 'Gagal memperbarui izin user' });
  }
}

async function changeUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const newRole = String(req.body?.role || '').trim();
    const result = await permissionsService.updateUserRole(userId, newRole, req.user);
    if (!result.success) {
      const map = {
        not_found: { status: 404, message: 'User tidak ditemukan' },
        invalid_role: { status: 400, message: 'Role tidak valid' },
        cannot_modify_super_admin: { status: 403, message: 'Role super_admin tidak dapat diubah' },
        cannot_modify_admin: { status: 403, message: 'Role admin tidak dapat diubah dari sini' },
        self: { status: 400, message: 'Anda tidak dapat mengubah role Anda sendiri' },
      };
      const entry = map[result.reason] || { status: 400, message: 'Gagal mengubah role' };
      return res.status(entry.status).json({ error: entry.message });
    }
    res.json({ message: `Role user diubah ke ${newRole}` });
  } catch (error) {
    console.error('Controller changeUserRole error:', error);
    res.status(500).json({ error: 'Gagal mengubah role user' });
  }
}

async function promoteToAdmin(req, res) {
  try {
    const userId = Number(req.params.id);
    const result = await permissionsService.promoteToAdmin(userId, req.user);
    if (!result.success) {
      const map = {
        forbidden: { status: 403, message: 'Hanya super_admin yang dapat promote admin' },
        not_found: { status: 404, message: 'User tidak ditemukan' },
        already_super_admin: { status: 400, message: 'User sudah super_admin' },
        self: { status: 400, message: 'Anda tidak dapat mengubah role Anda sendiri' },
      };
      const entry = map[result.reason] || { status: 400, message: 'Gagal promote user' };
      return res.status(entry.status).json({ error: entry.message });
    }
    res.json({ message: 'User dipromosikan menjadi admin' });
  } catch (error) {
    console.error('Controller promoteToAdmin error:', error);
    res.status(500).json({ error: 'Gagal promote user' });
  }
}

async function createUser(req, res) {
  try {
    const { username, password, full_name, role } = req.body || {};
    const result = await authService.createUserByAdmin({ username, password, full_name, role }, req.user);
    res.status(201).json({
      message: `Akun ${result.username} (${result.role}) berhasil dibuat.`,
      user: result,
    });
  } catch (error) {
    console.error('Controller createUser error:', error);
    res.status(400).json({ error: error.message || 'Gagal membuat akun' });
  }
}

async function updateCredentials(req, res) {
  try {
    const userId = Number(req.params.id);
    const result = await authService.updateUserCredentials(userId, req.body || {}, req.user);
    if (!result.success) {
      const map = {
        not_found: { status: 404, message: 'User tidak ditemukan' },
        no_changes: { status: 400, message: 'Tidak ada perubahan yang diminta' },
        reserved_username: { status: 400, message: 'Username ini dipesan untuk sistem' },
        username_taken: { status: 400, message: 'Username sudah dipakai user lain' },
      };
      const entry = map[result.reason] || { status: 400, message: 'Gagal memperbarui kredensial' };
      return res.status(entry.status).json({ error: entry.message });
    }
    res.json({
      message: result.user.passwordChanged
        ? `Username & password untuk ${result.user.username} berhasil diperbarui. Sesi lama user ini akan berakhir.`
        : `Username untuk ${result.user.username} berhasil diperbarui.`,
      user: result.user,
    });
  } catch (error) {
    if (error.message && error.message.includes('Password minimal')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Controller updateCredentials error:', error);
    res.status(500).json({ error: 'Gagal memperbarui kredensial' });
  }
}

async function debugUsers(req, res) {
  try {
    const dbModule = require('../config/db');
    const [allUsers] = await dbModule.query('SELECT id, username, role FROM users ORDER BY id');
    const isSuperAdmin = req.user?.role === 'super_admin';
    let included = [];
    let error = null;
    try {
      included = isSuperAdmin
        ? await authService.getAllUsersIncludingAdmin(req.user)
        : await authService.getAllUsers();
    } catch (err) {
      error = err.message;
    }
    res.json({
      viewer: { id: req.user?.id, role: req.user?.role },
      dbUsers: allUsers,
      returnedUsers: included,
      error,
    });
  } catch (error) {
    console.error('debugUsers error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

module.exports = {
  register,
  login,
  logout,
  getUsers,
  toggleUserStatus,
  deleteUser,
  getPermissionCatalog,
  getUserPermissions,
  updateUserPermissions,
  changeUserRole,
  promoteToAdmin,
  debugUsers,
  createUser,
  updateCredentials,
  getLogo,
  updateLogo,
  deleteAppLogo,
  getBackground,
  updateBackground,
  deleteAppBackground,
};

async function getLogo(req, res) {
  try {
    const logo = await require('../services/logoService').getLogo();
    if (!logo) return res.json({ logo: null });
    res.json({ logo });
  } catch (error) {
    console.error('Controller getLogo error:', error);
    res.status(500).json({ error: 'Gagal memuat logo' });
  }
}

async function updateLogo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'File logo wajib diupload.' });
    const base64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/png';
    await require('../services/logoService').saveLogo(base64, mime);
    res.json({ message: 'Logo berhasil diperbarui.' });
  } catch (error) {
    console.error('Controller updateLogo error:', error);
    res.status(500).json({ error: 'Gagal menyimpan logo' });
  }
}

async function deleteAppLogo(req, res) {
  try {
    await require('../services/logoService').deleteLogo();
    res.json({ message: 'Logo berhasil dihapus.' });
  } catch (error) {
    console.error('Controller deleteAppLogo error:', error);
    res.status(500).json({ error: 'Gagal menghapus logo' });
  }
}

async function getBackground(req, res) {
  try {
    const bg = await require('../services/logoService').getBackground();
    if (!bg) return res.json({ background: null });
    res.json({ background: bg });
  } catch (error) {
    console.error('Controller getBackground error:', error);
    res.status(500).json({ error: 'Gagal memuat background' });
  }
}

async function updateBackground(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'File background wajib diupload.' });
    const base64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/png';
    const opacity = req.body.opacity !== undefined ? Number(req.body.opacity) : 0.35;
    const safeOpacity = Math.max(0, Math.min(1, Number.isFinite(opacity) ? opacity : 0.35));
    await require('../services/logoService').saveBackground(base64, mime, safeOpacity);
    res.json({ message: 'Background berhasil diperbarui.' });
  } catch (error) {
    console.error('Controller updateBackground error:', error);
    res.status(500).json({ error: 'Gagal menyimpan background' });
  }
}

async function deleteAppBackground(req, res) {
  try {
    await require('../services/logoService').deleteBackground();
    res.json({ message: 'Background berhasil dihapus.' });
  } catch (error) {
    console.error('Controller deleteAppBackground error:', error);
    res.status(500).json({ error: 'Gagal menghapus background' });
  }
}
