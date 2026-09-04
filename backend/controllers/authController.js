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
    const users = await authService.getAllUsers();
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
    const result = await authService.toggleUserStatus(userId, nextStatus, req.user.id);

    if (!result.success) {
      if (result.reason === 'self') {
        return res.status(400).json({ error: 'Anda tidak dapat memblokir akun Anda sendiri' });
      }
      return res.status(404).json({ error: 'User tidak ditemukan' });
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
    const result = await authService.deleteUser(userId, req.user.id);

    if (!result.success) {
      if (result.reason === 'self') {
        return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
      }
      return res.status(404).json({ error: 'User tidak ditemukan' });
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
      return res.status(404).json({ error: 'User tidak ditemukan' });
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
        cannot_modify_admin: { status: 403, message: 'Role admin tidak dapat diubah' },
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
};
