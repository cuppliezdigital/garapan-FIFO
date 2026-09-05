const db = require('../backend/config/db');

async function fixAllEnums() {
  try {
    const tables = [
      {
        name: 'users',
        query: "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user', 'client') DEFAULT 'user'",
      },
      {
        name: 'role_default_permissions',
        query: "ALTER TABLE role_default_permissions MODIFY COLUMN role ENUM('super_admin', 'admin', 'user', 'client') NOT NULL",
      },
    ];

    for (const t of tables) {
      try {
        const [cols] = await db.query(`SHOW COLUMNS FROM ${t.name}`);
        console.log(`\nTable: ${t.name}`);
        cols.forEach((c) => {
          if (c.Field === 'role') console.log(`  role ENUM: ${c.Type}`);
        });
      } catch (error) {
        console.log(`Table ${t.name} belum ada, akan dibuat otomatis nanti.`);
        continue;
      }

      console.log(`  → Running ALTER...`);
      try {
        await db.query(t.query);
        console.log(`  ✓ ENUM updated.`);
      } catch (error) {
        console.error(`  ✗ ALTER failed:`, error.message);
      }
    }

    console.log('\n✓ Semua ENUM selesai diproses.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

fixAllEnums();
