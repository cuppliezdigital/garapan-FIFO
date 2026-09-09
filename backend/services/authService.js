const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const permissionsService = require('./permissionsService');

const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 1 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;

function getAttemptKey(username) {
  return String(username || '').trim().toLowerCase();
}

function handleFailedAttempt(username) {
  const key = getAttemptKey(username);
  if (!key) return;

  const current = failedLoginAttempts.get(key) || { count: 0, lockUntil: 0 };
  const nextCount = current.count + 1;

  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    failedLoginAttempts.set(key, {
      count: MAX_FAILED_ATTEMPTS,
      lockUntil: Date.now() + LOCKOUT_WINDOW_MS,
    });
    return { locked: true };
  }

  failedLoginAttempts.set(key, { count: nextCount, lockUntil: 0 });
  return { locked: false, remaining: MAX_FAILED_ATTEMPTS - nextCount };
}

function resetFailedAttempts(username) {
  const key = getAttemptKey(username);
  if (key) failedLoginAttempts.delete(key);
}

async function ensureUsersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role ENUM('super_admin', 'admin', 'user', 'client') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [columns] = await db.query('SHOW COLUMNS FROM users');
  const columnNames = columns.map((column) => column.Field);

  if (columnNames.includes('password')) {
    await db.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT ''");
  }

  if (!columnNames.includes('password_hash') && columnNames.includes('password')) {
    await db.query('ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NULL DEFAULT ""');
  } else if (!columnNames.includes('password_hash')) {
    await db.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL DEFAULT ""');
  }

  if (columnNames.includes('password_hash')) {
    await db.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL DEFAULT ''");
  }

  if (!columnNames.includes('full_name')) {
    await db.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL DEFAULT ""');
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN full_name VARCHAR(150) NULL DEFAULT ''");
  }

  if (!columnNames.includes('role')) {
    await db.query("ALTER TABLE users ADD COLUMN role ENUM('super_admin', 'admin', 'user', 'client') DEFAULT 'user'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user', 'client') DEFAULT 'user'");
  }

  if (!columnNames.includes('status')) {
    await db.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') DEFAULT 'active'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'blocked') DEFAULT 'active'");
  }

  if (columnNames.includes('password') && !columnNames.includes('password_hash')) {
    await db.query('UPDATE users SET password_hash = password WHERE password_hash = "" OR password_hash IS NULL');
  }

  try {
    await db.query(
      "UPDATE users SET role = 'super_admin' WHERE username = 'admin' AND role = 'admin'"
    );
  } catch (error) {
    console.error('Migration role admin -> super_admin skipped:', error.message);
  }
}

async function ensureUserSessionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_id VARCHAR(128) NOT NULL UNIQUE,
      revoked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_session_id (session_id)
    )
  `);
}

function generateSessionId() {
  return crypto.randomBytes(24).toString('hex');
}

async function registerSession(userId, sessionId) {
  await ensureUserSessionsTable();
  await db.query(
    'INSERT INTO user_sessions (user_id, session_id, revoked) VALUES (?, ?, 0)',
    [userId, sessionId]
  );
}

async function revokeOtherSessions(userId, currentSessionId) {
  await ensureUserSessionsTable();
  await db.query(
    'UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND session_id != ? AND revoked = 0',
    [userId, currentSessionId]
  );
}

async function isSessionValid(userId, sessionId) {
  await ensureUserSessionsTable();
  const [rows] = await db.query(
    `SELECT revoked, last_seen_at FROM user_sessions WHERE user_id = ? AND session_id = ? LIMIT 1`,
    [userId, sessionId]
  );
  const session = rows[0];
  if (!session) return false;
  if (Number(session.revoked) === 1) return false;
  const lastSeen = new Date(session.last_seen_at).getTime();
  if (Number.isNaN(lastSeen)) return false;
  if (Date.now() - lastSeen > SESSION_TTL_MS) return false;
  return true;
}

async function touchSession(userId, sessionId) {
  await ensureUserSessionsTable();
  await db.query(
    `UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE user_id = ? AND session_id = ? AND revoked = 0`,
    [userId, sessionId]
  );
}

async function revokeSession(userId, sessionId) {
  await ensureUserSessionsTable();
  if (!sessionId) {
    await db.query('UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND revoked = 0', [userId]);
    return;
  }
  await db.query('UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND session_id = ?', [userId, sessionId]);
}

async function updateUserCredentials(targetUserId, payload, actor) {
  await ensureUsersTable();

  const [targetRows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [targetUserId]);
  if (!targetRows.length) return { success: false, reason: 'not_found' };
  const target = targetRows[0];

  const newUsername = payload?.username ? String(payload.username).trim().toLowerCase() : null;
  const newPassword = payload?.password ? String(payload.password) : null;

  if (!newUsername && !newPassword) {
    return { success: false, reason: 'no_changes' };
  }

  const reservedUsernames = ['admin', 'superadmin', 'root', 'super_admin'];
  if (newUsername && reservedUsernames.includes(newUsername)) {
    return { success: false, reason: 'reserved_username' };
  }

  if (newUsername && newUsername !== target.username) {
    const [conflict] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, targetUserId]);
    if (conflict.length) {
      return { success: false, reason: 'username_taken' };
    }
  }

  if (newPassword) {
    validatePasswordStrength(newPassword);
  }

  const updates = [];
  const params = [];

  if (newUsername && newUsername !== target.username) {
    updates.push('username = ?');
    params.push(newUsername);
  }

  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push('password_hash = ?');
    params.push(hash);
  }

  params.push(targetUserId);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  if (newPassword) {
    await revokeSession(targetUserId);
  }

  const auditService = require('./auditService');
  await auditService.logAudit({
    userId: actor?.id,
    username: actor?.username,
    action: 'update_credentials',
    entityType: 'user',
    entityId: String(targetUserId),
    details: {
      targetUserId,
      oldUsername: target.username,
      newUsername: newUsername || target.username,
      passwordChanged: Boolean(newPassword),
      actorRole: actor?.role,
    },
  });

  return {
    success: true,
    user: {
      id: target.id,
      username: newUsername || target.username,
      role: target.role,
    },
  };
}

async function ensureDefaultAdmin() {
  await ensureUsersTable();

  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
  if (rows.length > 0 || process.env.ALLOW_DEFAULT_ADMIN !== 'true') {
    return;
  }

  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!defaultAdminPassword) {
    throw new Error('DEFAULT_ADMIN_PASSWORD wajib diisi saat ALLOW_DEFAULT_ADMIN=true');
  }
  const hash = await bcrypt.hash(defaultAdminPassword, 12);
  const [columns] = await db.query('SHOW COLUMNS FROM users');
  const columnNames = columns.map((column) => column.Field);

  if (columnNames.includes('password')) {
    await db.query(
      'INSERT INTO users (username, password, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['admin', hash, hash, 'Administrator', 'admin']
    );
    return;
  }

  await db.query(
    'INSERT INTO users (username, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
    ['admin', hash, 'Administrator', 'admin']
  );
}

async function findUserByUsername(username) {
  await ensureUsersTable();
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function createUserByAdmin({ username, password, full_name, role }, actor) {
  await ensureUsersTable();

  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedFullName = String(full_name || '').trim() || normalizedUsername;
  const allowedRoles = ['admin', 'user', 'client'];
  const safeRole = allowedRoles.includes(role) ? role : 'user';

  const reservedUsernames = ['admin', 'superadmin', 'root', 'super_admin'];
  if (reservedUsernames.includes(normalizedUsername)) {
    throw new Error('Username ini dipesan untuk sistem dan tidak dapat digunakan.');
  }

  if (!normalizedUsername || !password) {
    throw new Error('Username dan password wajib diisi');
  }

  validatePasswordStrength(password);

  const existingUser = await findUserByUsername(normalizedUsername);
  if (existingUser) {
    throw new Error('Username sudah terdaftar');
  }

  if (safeRole === 'super_admin') {
    throw new Error('Tidak dapat membuat akun super_admin baru.');
  }

  const hash = await bcrypt.hash(String(password), 12);

  const [result] = await db.query(
    'INSERT INTO users (username, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
    [normalizedUsername, hash, normalizedFullName, safeRole]
  );

  const auditService = require('./auditService');
  await auditService.logAudit({
    userId: actor?.id,
    username: actor?.username,
    action: 'create_user',
    entityType: 'user',
    entityId: String(result.insertId),
    details: {
      createdUserId: result.insertId,
      createdUsername: normalizedUsername,
      createdRole: safeRole,
      actorRole: actor?.role,
    },
  });

  return { id: result.insertId, username: normalizedUsername, full_name: normalizedFullName, role: safeRole };
}

async function getAllUsers() {
  await ensureUsersTable();
  const [rows] = await db.query(
    'SELECT id, username, full_name, role, status, created_at FROM users WHERE role IN (?, ?) ORDER BY created_at DESC',
    ['user', 'client']
  );
  return rows;
}

async function getAllUsersIncludingAdmin(currentUser) {
  await ensureUsersTable();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const includeRoles = isSuperAdmin ? ['super_admin', 'admin', 'user', 'client'] : ['admin', 'user', 'client'];
  const placeholders = includeRoles.map(() => '?').join(', ');
  try {
    const [rows] = await db.query(
      `SELECT id, username, full_name, role, status, created_at FROM users WHERE role IN (${placeholders}) ORDER BY
         CASE role
           WHEN 'super_admin' THEN 0
           WHEN 'admin' THEN 1
           WHEN 'user' THEN 2
           WHEN 'client' THEN 3
           ELSE 4
         END, created_at DESC`,
      includeRoles
    );
    return rows;
  } catch (error) {
    console.error('getAllUsersIncludingAdmin error:', error.message, 'roles:', includeRoles);
    return [];
  }
}

async function toggleUserStatus(userId, nextStatus, currentUserId, currentUserRole) {
  await ensureUsersTable();
  const normalizedStatus = nextStatus === 'blocked' ? 'blocked' : 'active';

  if (Number(userId) === Number(currentUserId)) {
    return { success: false, reason: 'self' };
  }

  const [targetRows] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
  if (!targetRows.length) return { success: false, reason: 'not_found' };
  const targetRole = targetRows[0].role;
  if (targetRole === 'super_admin') {
    return { success: false, reason: 'protected_role' };
  }
  if (targetRole === 'admin' && currentUserRole !== 'super_admin') {
    return { success: false, reason: 'forbidden' };
  }

  const [result] = await db.query(
    'UPDATE users SET status = ? WHERE id = ?',
    [normalizedStatus, userId]
  );

  if (result.affectedRows > 0 && normalizedStatus === 'blocked') {
    await revokeSession(userId);
  }

  return { success: result.affectedRows > 0 };
}

async function deleteUser(userId, currentUserId, currentUserRole) {
  await ensureUsersTable();

  if (Number(userId) === Number(currentUserId)) {
    return { success: false, reason: 'self' };
  }

  const [targetRows] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
  if (!targetRows.length) return { success: false, reason: 'not_found' };
  const targetRole = targetRows[0].role;
  if (targetRole === 'super_admin') {
    return { success: false, reason: 'protected_role' };
  }
  if (targetRole === 'admin' && currentUserRole !== 'super_admin') {
    return { success: false, reason: 'forbidden' };
  }

  const [result] = await db.query(
    'DELETE FROM users WHERE id = ?',
    [userId]
  );

  if (result.affectedRows > 0) {
    await revokeSession(userId);
  }

  return { success: result.affectedRows > 0 };
}

function validatePasswordStrength(password) {
  const value = String(password || '');
  const hasStrongFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

  if (!hasStrongFormat) {
    throw new Error('Password minimal 8 karakter, harus ada huruf besar, kecil, dan angka.');
  }
}

async function registerUser({ username, password, full_name, role = 'user' }) {
  await ensureUsersTable();

  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedFullName = String(full_name || '').trim() || normalizedUsername;
  const allowedRoles = ['user', 'client'];
  const safeRole = allowedRoles.includes(role) ? role : 'user';

  const reservedUsernames = ['admin', 'superadmin', 'root', 'super_admin'];
  if (reservedUsernames.includes(normalizedUsername)) {
    throw new Error('Username ini dipesan dan tidak dapat didaftarkan.');
  }

  if (!normalizedUsername || !password) {
    throw new Error('Username dan password wajib diisi');
  }

  validatePasswordStrength(password);

  const existingUser = await findUserByUsername(normalizedUsername);
  if (existingUser) {
    throw new Error('Username sudah terdaftar');
  }

  const hash = await bcrypt.hash(String(password), 12);

  const [result] = await db.query(
    'INSERT INTO users (username, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
    [normalizedUsername, hash, normalizedFullName, safeRole]
  );

  return { id: result.insertId, username: normalizedUsername, full_name: normalizedFullName, role: safeRole };
}

async function loginUser({ username, password }) {
  await ensureUsersTable();
  await ensureDefaultAdmin();

  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername || !password) {
    throw new Error('Username dan password wajib diisi');
  }

  const key = getAttemptKey(normalizedUsername);
  const lockedState = failedLoginAttempts.get(key);
  if (lockedState && lockedState.lockUntil && Date.now() < lockedState.lockUntil) {
    const remainingMs = Math.max(0, lockedState.lockUntil - Date.now());
    const totalSeconds = Math.ceil(remainingMs / 1000);
    let remainingLabel;
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      remainingLabel = seconds > 0 ? `${minutes} menit ${seconds} detik` : `${minutes} menit`;
    } else {
      remainingLabel = `${totalSeconds} detik`;
    }
    throw new Error(`Akun sementara terkunci karena terlalu banyak login gagal. Coba lagi dalam ${remainingLabel}.`);
  }

  const user = await findUserByUsername(normalizedUsername);
  if (!user) {
    handleFailedAttempt(normalizedUsername);
    throw new Error('Username atau password salah');
  }

  if ((user.status || 'active') === 'blocked') {
    throw new Error('Akun Anda diblokir oleh admin');
  }

  const validPassword = await bcrypt.compare(String(password), user.password_hash);
  if (!validPassword) {
    handleFailedAttempt(normalizedUsername);
    throw new Error('Username atau password salah');
  }

  resetFailedAttempts(normalizedUsername);

  const sessionId = generateSessionId();
  await registerSession(user.id, sessionId);

  const canMultiSession = await permissionsService.userHasPermission(
    user.id,
    user.role,
    permissionsService.PERMISSION_KEYS.MULTI_SESSION
  );

  if (!canMultiSession) {
    await revokeOtherSessions(user.id, sessionId);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      sid: sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      status: user.status || 'active',
    },
  };
}

async function cleanupExpiredSessions() {
  try {
    const [result] = await db.query(`
      DELETE FROM user_sessions
      WHERE revoked = 1 OR last_seen_at < (NOW() - INTERVAL 2 DAY)
    `);
    if (result && result.affectedRows > 0) {
      console.log(`🧹 [Auto-Cleanup] Berhasil membersihkan ${result.affectedRows} sesi kadaluarsa (> 2 hari / revoked).`);
    }
  } catch (error) {
    console.error('Pembersihan user_sessions gagal:', error.message);
  }
}

async function initAuthTables() {
  await ensureUsersTable();
  await ensureDefaultAdmin();
  await ensureUserSessionsTable();
  await cleanupExpiredSessions();
}

module.exports = {
  initAuthTables,
  registerUser,
  loginUser,
  findUserByUsername,
  getAllUsers,
  getAllUsersIncludingAdmin,
  createUserByAdmin,
  updateUserCredentials,
  toggleUserStatus,
  deleteUser,
  isSessionValid,
  touchSession,
  revokeSession,
  revokeOtherSessions,
};
