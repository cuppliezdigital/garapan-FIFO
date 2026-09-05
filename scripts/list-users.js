const db = require('../backend/config/db');

async function listAllUsers() {
  try {
    const [rows] = await db.query(
      'SELECT id, username, full_name, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    console.log(`Total user di DB: ${rows.length}\n`);
    console.log('ID | Username | Nama | Role | Status | Created At');
    console.log('---|---|---|---|---|---|');
    rows.forEach((u) => {
      console.log(`${u.id} | ${u.username} | ${u.full_name || '-'} | ${u.role} | ${u.status || 'active'} | ${u.created_at}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listAllUsers();
