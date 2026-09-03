const db = require('../config/db');

async function ensureAuditTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      username VARCHAR(100) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(150) NOT NULL,
      details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function logAudit({ userId, username, action, entityType, entityId, details = {} }) {
  await ensureAuditTable();

  await db.query(
    `INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      username,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
    ]
  );
}

async function getAuditLogs() {
  await ensureAuditTable();
  const [rows] = await db.query(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100'
  );

  return rows.map((row) => {
    let parsedDetails = {};

    if (row.details) {
      if (typeof row.details === 'string') {
        try {
          parsedDetails = JSON.parse(row.details);
        } catch (error) {
          parsedDetails = {};
        }
      } else if (typeof row.details === 'object') {
        parsedDetails = row.details;
      }
    }

    return {
      ...row,
      details: parsedDetails,
    };
  });
}

async function deleteAllAuditLogs() {
  await ensureAuditTable();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM audit_log');
    const deletedCount = Number(countRows[0]?.total || 0);
    await connection.query('DELETE FROM audit_log');

    const [remainingRows] = await connection.query('SELECT COUNT(*) AS total FROM audit_log');
    if (Number(remainingRows[0]?.total || 0) !== 0) {
      throw new Error('Audit log masih tersisa setelah penghapusan');
    }

    await connection.commit();
    return { deletedCount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  logAudit,
  getAuditLogs,
  deleteAllAuditLogs,
};
