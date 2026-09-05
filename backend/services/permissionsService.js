const db = require('../config/db');
const auditService = require('./auditService');

const PERMISSION_KEYS = Object.freeze({
  FULL_ACCESS: 'full_access',
  IMPORT_BULK: 'import_bulk',
  VIEW_HISTORY: 'view_history',
  DELETE_HISTORY: 'delete_history',
  MANAGE_USERS: 'manage_users',
  DOWNLOAD_TEMPLATE: 'download_template',
  DELETE_GLOBAL: 'delete_global',
  ACCESS_CONFIG: 'access_config',
});

const PERMISSION_CATALOG = Object.freeze([
  { key: PERMISSION_KEYS.FULL_ACCESS, label: 'Full Akses', description: 'Akses penuh ke semua fitur (saklar utama).', category: 'master' },
  { key: PERMISSION_KEYS.IMPORT_BULK, label: 'Import Bulk Data', description: 'Mengimpor data monitoring massal via CSV.', category: 'monitoring' },
  { key: PERMISSION_KEYS.VIEW_HISTORY, label: 'Lihat History Arsip', description: 'Melihat tabel history update.', category: 'monitoring' },
  { key: PERMISSION_KEYS.DELETE_HISTORY, label: 'Hapus Semua History', description: 'Menghapus seluruh data history arsip.', category: 'monitoring' },
  { key: PERMISSION_KEYS.MANAGE_USERS, label: 'Management User', description: 'Mengelola akun user & client (block/delete).', category: 'admin' },
  { key: PERMISSION_KEYS.DOWNLOAD_TEMPLATE, label: 'Download Template CSV', description: 'Mengunduh template CSV untuk import.', category: 'monitoring' },
  { key: PERMISSION_KEYS.DELETE_GLOBAL, label: 'Hapus Data Global', description: 'Menghapus seluruh data monitoring secara permanen.', category: 'monitoring' },
  { key: PERMISSION_KEYS.ACCESS_CONFIG, label: 'Akses Konfigurasi', description: 'Membuka halaman Konfigurasi Akses user lain.', category: 'admin' },
]);

const ROLE_DEFAULTS = Object.freeze({
  super_admin: Object.freeze({
    full_access: 1,
    import_bulk: 1,
    view_history: 1,
    delete_history: 1,
    manage_users: 1,
    download_template: 1,
    delete_global: 1,
    access_config: 1,
  }),
  admin: Object.freeze({
    full_access: 1,
    import_bulk: 1,
    view_history: 1,
    delete_history: 1,
    manage_users: 1,
    download_template: 1,
    delete_global: 1,
    access_config: 1,
  }),
  user: Object.freeze({
    full_access: 1,
    import_bulk: 1,
    view_history: 1,
    delete_history: 0,
    manage_users: 0,
    download_template: 1,
    delete_global: 0,
    access_config: 0,
  }),
  client: Object.freeze({
    full_access: 0,
    import_bulk: 0,
    view_history: 0,
    delete_history: 0,
    manage_users: 0,
    download_template: 0,
    delete_global: 0,
    access_config: 0,
  }),
});

async function ensurePermissionsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions_master (
      id INT AUTO_INCREMENT PRIMARY KEY,
      permission_key VARCHAR(50) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      description VARCHAR(255),
      category VARCHAR(50) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS role_default_permissions (
      role ENUM('super_admin', 'admin', 'user', 'client') NOT NULL,
      permission_key VARCHAR(50) NOT NULL,
      allowed TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (role, permission_key)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id INT NOT NULL,
      permission_key VARCHAR(50) NOT NULL,
      allowed TINYINT(1) NOT NULL,
      granted_by INT,
      granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, permission_key),
      INDEX idx_user_id (user_id)
    )
  `);

  for (const entry of PERMISSION_CATALOG) {
    await db.query(
      `INSERT INTO permissions_master (permission_key, label, description, category)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), category = VALUES(category)`,
      [entry.key, entry.label, entry.description, entry.category]
    );
  }

  for (const [role, defaults] of Object.entries(ROLE_DEFAULTS)) {
    for (const [key, allowed] of Object.entries(defaults)) {
      await db.query(
        `INSERT INTO role_default_permissions (role, permission_key, allowed)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)`,
        [role, key, allowed]
      );
    }
  }
}

function normalizeAllowed(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return 1;
  if (value === false || value === 0 || value === '0' || value === 'false') return 0;
  return 0;
}

async function resolveUserPermissions(userId, role) {
  try {
    await ensurePermissionsTables();
  } catch (error) {
    console.error('ensurePermissionsTables failed:', error.message);
    return PERMISSION_CATALOG.map((entry) => ({
      key: entry.key,
      label: entry.label,
      description: entry.description,
      category: entry.category,
      allowed: role === 'admin',
    }));
  }
  try {
    const [rows] = await db.query(
      `SELECT pm.permission_key AS \`key\`,
              COALESCE(up.allowed, rdp.allowed, 0) AS allowed,
              pm.label, pm.description, pm.category
       FROM permissions_master pm
       LEFT JOIN role_default_permissions rdp
         ON rdp.role = ? AND rdp.permission_key = pm.permission_key
       LEFT JOIN user_permissions up
         ON up.user_id = ? AND up.permission_key = pm.permission_key
       ORDER BY pm.id ASC`,
      [role, userId]
    );

    return rows.map((row) => ({
      key: row.key,
      label: row.label,
      description: row.description,
      category: row.category,
      allowed: Number(row.allowed) === 1,
    }));
  } catch (error) {
    console.error('resolveUserPermissions query failed:', error.message);
    return PERMISSION_CATALOG.map((entry) => ({
      key: entry.key,
      label: entry.label,
      description: entry.description,
      category: entry.category,
      allowed: role === 'admin',
    }));
  }
}

async function userHasPermission(userId, role, permissionKey) {
  if (!permissionKey) return false;
  if (role === 'admin' || role === 'super_admin') return true;

  await ensurePermissionsTables();
  const [rows] = await db.query(
    `SELECT COALESCE(up.allowed, rdp.allowed, 0) AS allowed
     FROM permissions_master pm
     LEFT JOIN role_default_permissions rdp
       ON rdp.role = ? AND rdp.permission_key = pm.permission_key
     LEFT JOIN user_permissions up
       ON up.user_id = ? AND up.permission_key = pm.permission_key
     WHERE pm.permission_key = ?
     LIMIT 1`,
    [role, userId, permissionKey]
  );

  if (!rows.length) return false;
  return Number(rows[0].allowed) === 1;
}

function expandFullAccess(permissions) {
  const hasFull = permissions.some((p) => p.key === PERMISSION_KEYS.FULL_ACCESS && p.allowed);
  if (!hasFull) return permissions;
  return permissions.map((p) => ({ ...p, allowed: true }));
}

async function getEffectivePermissions(userId, role) {
  const raw = await resolveUserPermissions(userId, role);
  const expanded = expandFullAccess(raw);
  const map = {};
  for (const p of expanded) map[p.key] = p.allowed;
  if (role === 'admin' || role === 'super_admin') {
    for (const key of Object.values(PERMISSION_KEYS)) map[key] = true;
  }
  return expanded.map((p) => ({
    ...p,
    allowed: (role === 'admin' || role === 'super_admin') ? true : Boolean(map[p.key]),
  }));
}

async function updateUserPermissions(targetUserId, payload, actor) {
  await ensurePermissionsTables();

  const [userRows] = await db.query('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
  if (!userRows.length) return { success: false, reason: 'not_found' };
  const targetRole = userRows[0].role;
  const safeRole = ['user', 'client'].includes(targetRole) ? targetRole : 'user';

  if (targetRole === 'admin') {
    return { success: true, permissions: await getEffectivePermissions(targetUserId, targetRole) };
  }

  const overrides = payload && typeof payload === 'object' ? payload : {};
  const catalog = await resolveUserPermissions(targetUserId, safeRole);

  const connection = await db.getConnection();
  const previousState = {};
  try {
    await connection.beginTransaction();
    for (const entry of catalog) {
      const incoming = Object.prototype.hasOwnProperty.call(overrides, entry.key)
        ? overrides[entry.key]
        : null;
      if (incoming === null) continue;
      const next = normalizeAllowed(incoming);
      previousState[entry.key] = await readUserOverride(connection, targetUserId, entry.key);
      await connection.query(
        `INSERT INTO user_permissions (user_id, permission_key, allowed, granted_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE allowed = VALUES(allowed), granted_by = VALUES(granted_by)`,
        [targetUserId, entry.key, next, actor?.id || null]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await auditService.logAudit({
    userId: actor?.id,
    username: actor?.username,
    action: 'update_permissions',
    entityType: 'user_permissions',
    entityId: String(targetUserId),
    details: {
      targetUserId,
      previousState,
      newState: overrides,
      actorRole: actor?.role,
    },
  });

  return { success: true, permissions: await getEffectivePermissions(targetUserId, safeRole) };
}

async function readUserOverride(connection, userId, key) {
  const conn = connection || db;
  const [rows] = await conn.query(
    'SELECT allowed FROM user_permissions WHERE user_id = ? AND permission_key = ? LIMIT 1',
    [userId, key]
  );
  return rows.length ? Number(rows[0].allowed) === 1 : null;
}

async function updateUserRole(targetUserId, newRole, actor) {
  const allowedRoles = ['user', 'client'];
  if (!allowedRoles.includes(newRole)) {
    return { success: false, reason: 'invalid_role' };
  }

  const [targetRows] = await db.query('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
  if (!targetRows.length) return { success: false, reason: 'not_found' };
  if (targetRows[0].role === 'super_admin') return { success: false, reason: 'cannot_modify_super_admin' };
  if (targetRows[0].role === 'admin') return { success: false, reason: 'cannot_modify_admin' };

  if (Number(targetUserId) === Number(actor?.id)) {
    return { success: false, reason: 'self' };
  }

  const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, targetUserId]);
  if (result.affectedRows > 0) {
    await auditService.logAudit({
      userId: actor?.id,
      username: actor?.username,
      action: 'change_role',
      entityType: 'user',
      entityId: String(targetUserId),
      details: { targetUserId, oldRole: targetRows[0].role, newRole, actorRole: actor?.role },
    });
  }

  return { success: result.affectedRows > 0 };
}

async function promoteToAdmin(targetUserId, actor) {
  if (actor?.role !== 'super_admin') return { success: false, reason: 'forbidden' };

  const [targetRows] = await db.query('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
  if (!targetRows.length) return { success: false, reason: 'not_found' };
  if (targetRows[0].role === 'super_admin') return { success: false, reason: 'already_super_admin' };

  if (Number(targetUserId) === Number(actor?.id)) {
    return { success: false, reason: 'self' };
  }

  const oldRole = targetRows[0].role;
  const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', ['admin', targetUserId]);
  if (result.affectedRows > 0) {
    await auditService.logAudit({
      userId: actor.id,
      username: actor.username,
      action: 'promote_to_admin',
      entityType: 'user',
      entityId: String(targetUserId),
      details: { targetUserId, oldRole, newRole: 'admin', actorRole: actor.role },
    });
  }
  return { success: result.affectedRows > 0 };
}

module.exports = {
  PERMISSION_KEYS,
  PERMISSION_CATALOG,
  ensurePermissionsTables,
  resolveUserPermissions,
  userHasPermission,
  getEffectivePermissions,
  updateUserPermissions,
  updateUserRole,
  promoteToAdmin,
};
