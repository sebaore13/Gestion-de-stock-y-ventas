const mysql = require('mysql2/promise')

let pool = null

function createPoolFromEnv(config) {
  pool = mysql.createPool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 10000,
    acquireTimeout: 10000,
  })
  return pool
}

function getPool() {
  return pool
}

function setPool(p) {
  pool = p
}

module.exports = { createPoolFromEnv, getPool, setPool }
