// databasePool.js

const mysql = require('mysql2/promise');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: '15.204.248.117',
    user: 'root',
    password: 'percocet30', // Ensure your password is secure and handled safely
    database: 'CinemaBookingDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
