/* eslint-disable no-console */
require('dotenv').config()

const fs = require('fs')
const path = require('path')

const config = require('../src/config')
const { createPoolFromEnv } = require('../src/database/db')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations')

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return []
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b))
}

function stripSqlComments(sql) {
  // Good enough for our simple migration files (no stored procedures).
  return sql
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('--')) return ''
      if (trimmed.startsWith('#')) return ''
      return line
    })
    .join('\n')
}

function splitStatements(sql) {
  const cleaned = stripSqlComments(sql)
  return cleaned
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isIgnorableMigrationError(err) {
  // Make migrations re-runnable against already-updated DBs.
  const code = err?.code
  const errno = err?.errno
  return (
    code === 'ER_DUP_FIELDNAME' ||
    errno === 1060 ||
    code === 'ER_DUP_KEYNAME' ||
    errno === 1061 ||
    code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
    errno === 1091
  )
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (version)
    ) ENGINE=InnoDB
  `)
}

function versionFromFilename(filename) {
  // e.g. 001_add_users.sql -> 001
  return filename.split('_')[0]
}

async function main() {
  const pool = createPoolFromEnv(config)
  const conn = await pool.getConnection()

  try {
    await ensureMigrationsTable(conn)

    const [appliedRows] = await conn.query('SELECT version FROM schema_migrations')
    const applied = new Set((appliedRows || []).map((r) => String(r.version)))

    const files = listMigrationFiles()
    if (!files.length) {
      console.log('[migrate] no migrations found')
      return
    }

    for (const file of files) {
      const version = versionFromFilename(file)
      if (applied.has(version)) continue

      const filePath = path.join(MIGRATIONS_DIR, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      const statements = splitStatements(sql)

      console.log(`[migrate] applying ${file} (${statements.length} statements)`) 

      await conn.beginTransaction()
      try {
        for (const stmt of statements) {
          try {
            await conn.query(stmt)
          } catch (err) {
            if (isIgnorableMigrationError(err)) continue
            throw err
          }
        }
        await conn.query(
          'INSERT INTO schema_migrations (version, filename) VALUES (?, ?)',
          [version, file],
        )
        await conn.commit()
      } catch (err) {
        try { await conn.rollback() } catch { /* ignore */ }
        console.error(`[migrate] failed on ${file}:`, err?.message || err)
        process.exitCode = 1
        return
      }
    }

    console.log('[migrate] done')
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[migrate] fatal:', err?.message || err)
  process.exitCode = 1
})
