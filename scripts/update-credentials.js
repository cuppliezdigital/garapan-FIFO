const bcrypt = require('bcryptjs');
const db = require('../backend/config/db');

async function updateUser(currentUsername, newUsername, newPassword) {
  if (!currentUsername || !newUsername) {
    console.error('Usage: node scripts/update-credentials.js <currentUsername> <newUsername> [newPassword]');
    process.exit(1);
  }

  try {
    const [rows] = await db.query('SELECT id, role FROM users WHERE username = ?', [currentUsername]);
    if (!rows.length) {
      console.error(`User "${currentUsername}" tidak ditemukan.`);
      process.exit(1);
    }

    const target = rows[0];

    if (newPassword) {
      const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!pattern.test(newPassword)) {
        console.error('Password minimal 8 karakter, harus ada huruf besar, kecil, dan angka.');
        process.exit(1);
      }
    }

    const updates = [];
    const params = [];

    if (newUsername !== currentUsername) {
      const [conflict] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, target.id]);
      if (conflict.length) {
        console.error(`Username "${newUsername}" sudah dipakai user lain.`);
        process.exit(1);
      }
      updates.push('username = ?');
      params.push(newUsername);
    }

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 12);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (!updates.length) {
      console.log('Tidak ada perubahan.');
      process.exit(0);
    }

    params.push(target.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    console.log(`✓ User berhasil diperbarui.`);
    console.log(`  Username lama : ${currentUsername}`);
    console.log(`  Username baru : ${newUsername}`);
    console.log(`  Role          : ${target.role}`);
    if (newPassword) console.log(`  Password baru : ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const [,, currentUsername, newUsername, ...passwordParts] = process.argv;
const newPassword = passwordParts.join(' ').trim() || null;
updateUser(currentUsername, newUsername, newPassword);
