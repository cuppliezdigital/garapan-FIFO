const bcrypt = require('bcryptjs');
const db = require('../backend/config/db');

async function resetPassword(username, newPassword) {
  if (!username || !newPassword) {
    console.error('Usage: node scripts/reset-password.js <username> <new_password>');
    process.exit(1);
  }

  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!pattern.test(newPassword)) {
    console.error('Password minimal 8 karakter, harus ada huruf besar, kecil, dan angka.');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(newPassword, 12);
    const [result] = await db.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [hash, username]
    );

    if (result.affectedRows === 0) {
      console.error(`User "${username}" tidak ditemukan.`);
      process.exit(1);
    }

    console.log(`✓ Password untuk user "${username}" berhasil direset.`);
    console.log(`  Password baru: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const [,, username, ...passwordParts] = process.argv;
const newPassword = passwordParts.join(' ');
resetPassword(username, newPassword);
