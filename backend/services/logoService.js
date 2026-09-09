const db = require('../config/db');

async function ensureLogoTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_logo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      logo_type VARCHAR(20) DEFAULT 'sidebar',
      logo_data MEDIUMTEXT,
      logo_mime VARCHAR(100),
      size_mode VARCHAR(20) DEFAULT 'normal',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try {
    await db.query(`ALTER TABLE app_logo ADD COLUMN logo_type VARCHAR(20) DEFAULT 'sidebar'`);
  } catch (_) {}
  try {
    await db.query(`ALTER TABLE app_logo ADD COLUMN size_mode VARCHAR(20) DEFAULT 'normal'`);
  } catch (_) {}
  try {
    await db.query(`ALTER TABLE app_logo ADD UNIQUE KEY uq_logo_type (logo_type)`);
  } catch (_) {}
  try {
    await db.query(`UPDATE app_logo SET logo_type = 'sidebar' WHERE id = 1 AND (logo_type IS NULL OR logo_type = '')`);
  } catch (_) {}
}

async function ensureBackgroundTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_background (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bg_data MEDIUMTEXT,
      bg_mime VARCHAR(100),
      bg_opacity DECIMAL(3,2) DEFAULT 0.35,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query('ALTER TABLE app_background MODIFY bg_data MEDIUMTEXT');
}

async function getLogo(type = 'sidebar') {
  await ensureLogoTable();
  const safeType = type === 'login' ? 'login' : 'sidebar';
  const [rows] = await db.query(
    'SELECT logo_data, logo_mime, size_mode FROM app_logo WHERE logo_type = ? AND logo_data IS NOT NULL LIMIT 1',
    [safeType]
  );
  if (rows.length && rows[0].logo_data) {
    return { data: rows[0].logo_data, mime: rows[0].logo_mime || 'image/png', size: rows[0].size_mode || 'normal' };
  }
  // Fallback: jika logo login belum diupload, pakai logo sidebar (agar tidak kosong)
  if (safeType === 'login') {
    const [sidebarRows] = await db.query(
      'SELECT logo_data, logo_mime, size_mode FROM app_logo WHERE (logo_type = \'sidebar\' OR id = 1) AND logo_data IS NOT NULL LIMIT 1'
    );
    if (sidebarRows.length && sidebarRows[0].logo_data) {
      return { data: sidebarRows[0].logo_data, mime: sidebarRows[0].logo_mime || 'image/png', size: sidebarRows[0].size_mode || '52', isFallback: true };
    }
  }
  return null;
}

async function getAllLogos() {
  await ensureLogoTable();
  const sidebar = await getLogo('sidebar');
  const login = await getLogo('login');
  return { sidebar, login };
}

async function saveLogo(type, logoData, logoMime, sizeMode = 'normal') {
  await ensureLogoTable();
  const safeType = type === 'login' ? 'login' : 'sidebar';
  const [existing] = await db.query('SELECT id, size_mode FROM app_logo WHERE logo_type = ? LIMIT 1', [safeType]);
  const currentSize = existing.length && existing[0].size_mode ? existing[0].size_mode : sizeMode;

  await db.query(
    `INSERT INTO app_logo (logo_type, logo_data, logo_mime, size_mode)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE logo_data = VALUES(logo_data), logo_mime = VALUES(logo_mime), size_mode = ?`,
    [safeType, logoData, logoMime, currentSize, currentSize]
  );
}

async function saveLogoSize(type, sizeMode) {
  await ensureLogoTable();
  const safeType = type === 'login' ? 'login' : 'sidebar';
  await db.query(
    `INSERT INTO app_logo (logo_type, size_mode)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE size_mode = VALUES(size_mode)`,
    [safeType, sizeMode]
  );
}

async function deleteLogo(type) {
  await ensureLogoTable();
  const safeType = type === 'login' ? 'login' : 'sidebar';
  await db.query('UPDATE app_logo SET logo_data = NULL, logo_mime = NULL WHERE logo_type = ?', [safeType]);
}

async function getBackground() {
  await ensureBackgroundTable();
  const [rows] = await db.query('SELECT bg_data, bg_mime, bg_opacity FROM app_background LIMIT 1');
  if (!rows.length || !rows[0].bg_data) return null;
  return { data: rows[0].bg_data, mime: rows[0].bg_mime || 'image/png', opacity: Number(rows[0].bg_opacity) || 0.35 };
}

async function saveBackground(bgData, bgMime, bgOpacity = 0.35) {
  await ensureBackgroundTable();
  await db.query(
    `INSERT INTO app_background (id, bg_data, bg_mime, bg_opacity) VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bg_data = VALUES(bg_data), bg_mime = VALUES(bg_mime), bg_opacity = VALUES(bg_opacity)`,
    [bgData, bgMime, bgOpacity]
  );
}

async function updateBackgroundOpacity(opacity = 0.35) {
  await ensureBackgroundTable();
  const safeOpacity = Math.max(0, Math.min(1, Number.isFinite(Number(opacity)) ? Number(opacity) : 0.35));
  await db.query('UPDATE app_background SET bg_opacity = ? WHERE id = 1', [safeOpacity]);
}

async function deleteBackground() {
  await ensureBackgroundTable();
  await db.query('UPDATE app_background SET bg_data = NULL, bg_mime = NULL, bg_opacity = 0.35 WHERE id = 1');
}

module.exports = {
  ensureLogoTable,
  ensureBackgroundTable,
  getLogo,
  getAllLogos,
  saveLogo,
  saveLogoSize,
  deleteLogo,
  getBackground,
  saveBackground,
  updateBackgroundOpacity,
  deleteBackground,
};
