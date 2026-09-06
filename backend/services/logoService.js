const db = require('../config/db');

async function ensureLogoTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_logo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      logo_data MEDIUMTEXT,
      logo_mime VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query('ALTER TABLE app_logo MODIFY logo_data MEDIUMTEXT');
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

async function getLogo() {
  await ensureLogoTable();
  const [rows] = await db.query('SELECT logo_data, logo_mime FROM app_logo WHERE id = 1');
  if (!rows.length || !rows[0].logo_data) return null;
  return { data: rows[0].logo_data, mime: rows[0].logo_mime || 'image/png' };
}

async function saveLogo(logoData, logoMime) {
  await ensureLogoTable();
  await db.query(
    `INSERT INTO app_logo (id, logo_data, logo_mime) VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE logo_data = VALUES(logo_data), logo_mime = VALUES(logo_mime)`,
    [logoData, logoMime]
  );
}

async function deleteLogo() {
  await ensureLogoTable();
  await db.query('UPDATE app_logo SET logo_data = NULL, logo_mime = NULL WHERE id = 1');
}

async function getBackground() {
  await ensureBackgroundTable();
  const [rows] = await db.query('SELECT bg_data, bg_mime, bg_opacity FROM app_background LIMIT 1');
  if (!rows.length) return null;
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

async function deleteBackground() {
  await ensureBackgroundTable();
  await db.query('UPDATE app_background SET bg_data = NULL, bg_mime = NULL, bg_opacity = 0.35 WHERE id = 1');
}

module.exports = {
  getLogo,
  saveLogo,
  deleteLogo,
  getBackground,
  saveBackground,
  deleteBackground,
};
