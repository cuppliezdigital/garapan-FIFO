const db = require('../backend/config/db');

async function demoteUser(targetId) {
  if (!targetId) {
    console.error('Usage: node scripts/demote-user.js <user_id>');
    process.exit(1);
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [targetId]);
    if (!rows.length) {
      console.error(`User ID ${targetId} tidak ditemukan.`);
      process.exit(1);
    }

    const target = rows[0];
    if (target.role !== 'super_admin') {
      console.log(`User "${target.username}" (ID ${target.id}) sudah role ${target.role}, tidak perlu diubah.`);
      process.exit(0);
    }

    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', ['user', targetId]);
    if (result.affectedRows > 0) {
      console.log(`✓ User "${target.username}" (ID ${target.id}) berhasil di-demote dari super_admin → user.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const [,, targetId] = process.argv;
demoteUser(Number(targetId));
