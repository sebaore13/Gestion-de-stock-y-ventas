const config = {
  port: Number(process.env.PORT || 3001),
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'gestion_stock',
  // Comma-separated list, e.g. "http://192.168.1.10:5173,http://localhost:5173"
  frontendOrigins: process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  allowNoOrigin: process.env.ALLOW_NO_ORIGIN === '1',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  bootstrapPassword: process.env.BOOTSTRAP_PASSWORD || null,
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  logLevel: process.env.LOG_LEVEL || 'info',
  agentKey: process.env.AGENT_KEY || '',
}

module.exports = config
