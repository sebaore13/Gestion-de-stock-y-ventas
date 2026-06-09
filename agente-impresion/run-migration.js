require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('Conectado a MySQL. Creando tabla print_jobs...')

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      saleId INT NOT NULL,
      estado ENUM('pending','printed','failed') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      printedAt DATETIME NULL,
      error VARCHAR(255) NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `)

  console.log('Tabla print_jobs creada/verificada correctamente.')
  await conn.end()
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
