const mysql = require('mysql2');
require('dotenv').config();

let poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
};

// If DATABASE_URL or MYSQL_URL is provided (TiDB / Aiven / Koyeb / Railway)
const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
if (dbUri) {
    try {
        const u = new URL(dbUri);
        poolConfig.host = u.hostname;
        poolConfig.port = parseInt(u.port, 10) || 3306;
        poolConfig.user = decodeURIComponent(u.username);
        poolConfig.password = decodeURIComponent(u.password);
        poolConfig.database = u.pathname.replace(/^\//, '');
    } catch (e) {
        console.warn('Gagal mem-parsing DATABASE_URL:', e.message);
    }
}

// Enable SSL if required by cloud providers (TiDB / Aiven require SSL)
if (
    process.env.DB_SSL === 'true' || 
    poolConfig.port === 4000 || 
    (poolConfig.host && poolConfig.host.includes('tidbcloud.com')) || 
    (poolConfig.host && poolConfig.host.includes('aivencloud.com'))
) {
    poolConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

const db = mysql.createPool(poolConfig);

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal terkoneksi ke database:', err.message);
        return;
    }
    console.log(`✅ Berhasil terhubung ke database MySQL: ${poolConfig.database} (${poolConfig.host})`);
    connection.release();
});

module.exports = db.promise();