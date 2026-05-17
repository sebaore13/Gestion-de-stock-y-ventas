const mysql = require('mysql2/promise')

function createPoolFromEnv(env) {
  const host = env.DB_HOST || '127.0.0.1'
  const port = Number(env.DB_PORT || 3306)
  const user = env.DB_USER || 'root'
  const password = env.DB_PASSWORD || ''
  const database = env.DB_NAME || 'taller_mvp'

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Para evitar problemas comunes de charset en Windows.
    charset: 'utf8mb4',
  })
}

module.exports = { createPoolFromEnv }
