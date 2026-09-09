const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Gagal terkoneksi ke database:', err.message);
        return;
    }
    console.log('✅ Berhasil terhubung ke database MySQL: db_monitoring_fifo');
    connection.release();
});

module.exports = db.promise();