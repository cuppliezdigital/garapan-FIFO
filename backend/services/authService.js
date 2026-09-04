const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
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
      role ENUM('admin', 'user', 'client') DEFAULT 'user',
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
    await db.query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'user', 'client') DEFAULT 'user'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'client') DEFAULT 'user'");
  }

  if (!columnNames.includes('status')) {
    await db.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') DEFAULT 'active'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'blocked') DEFAULT 'active'");
  }

  if (columnNames.includes('password') && !columnNames.includes('password_hash')) {
    await db.query('UPDATE users SET password_hash = password WHERE password_hash = "" OR password_hash IS NULL');
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

async function getAllUsers() {
  await ensureUsersTable();
  const [rows] = await db.query(
    'SELECT id, username, full_name, role, status, created_at FROM users WHERE role IN (?, ?) ORDER BY created_at DESC',
    ['user', 'client']
  );
  return rows;
}

async function toggleUserStatus(userId, nextStatus, currentUserId) {
  await ensureUsersTable();
  const normalizedStatus = nextStatus === 'blocked' ? 'blocked' : 'active';

  if (Number(userId) === Number(currentUserId)) {
    return { success: false, reason: 'self' };
  }

  const [result] = await db.query(
    'UPDATE users SET status = ? WHERE id = ? AND role IN (?, ?)',
    [normalizedStatus, userId, 'user', 'client']
  );

  if (result.affectedRows > 0 && normalizedStatus === 'blocked') {
    await revokeSession(userId);
  }

  return { success: result.affectedRows > 0 };
}

async function deleteUser(userId, currentUserId) {
  await ensureUsersTable();

  if (Number(userId) === Number(currentUserId)) {
    return { success: false, reason: 'self' };
  }

  const [result] = await db.query(
    'DELETE FROM users WHERE id = ? AND role IN (?, ?)',
    [userId, 'user', 'client']
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

  const normalizedUsername = String(username || '').trim();
  const normalizedFullName = String(full_name || '').trim() || normalizedUsername;
  const allowedRoles = ['user', 'client'];
  const safeRole = allowedRoles.includes(role) ? role : 'user';

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
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    throw new Error(`Akun sementara terkunci karena terlalu banyak login gagal. Coba lagi dalam ${remainingMinutes} menit.`);
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
  await revokeOtherSessions(user.id, sessionId);

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

module.exports = {
  registerUser,
  loginUser,
  findUserByUsername,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  isSessionValid,
  touchSession,
  revokeSession,
  revokeOtherSessions,
};
