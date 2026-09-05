const db = require('../backend/config/db');

async function fixRoleEnum() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM users WHERE Field = 'role'");
    if (!columns.length) {
      console.error('Kolom role tidak ditemukan.');
      process.exit(1);
    }

    const currentType = columns[0].Type;
    console.log('Current ENUM:', currentType);

    if (currentType.includes('super_admin')) {
      console.log('ENUM sudah include super_admin.');
    } else {
      console.log('ALTER ENUM untuk tambah super_admin...');
      await db.query(
        "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user', 'client') DEFAULT 'user'"
      );
      console.log('✓ ENUM berhasil diupdate.');

      const [roles] = await db.query('SELECT id, username, role FROM users');
      console.log('\nUser saat ini:');
      roles.forEach((r) => console.log(`  ID ${r.id} | ${r.username} | ${r.role}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixRoleEnum();
