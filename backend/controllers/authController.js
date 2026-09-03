const authService = require('../services/authService');

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

function logout(req, res) {
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

module.exports = {
  register,
  login,
  logout,
  getUsers,
  toggleUserStatus,
  deleteUser,
};
