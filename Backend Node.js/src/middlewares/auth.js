const jwt = require('jsonwebtoken')
const config = require('../config')

function getTokenFromRequest(req) {
  const h = req.headers.authorization
  if (!h) return null
  const [scheme, token] = String(h).split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function signToken({ userId, rol }) {
  const secret = config.jwtSecret
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return jwt.sign({ sub: String(userId), rol }, secret, { expiresIn: config.jwtExpiresIn })
}

function decodeToken(token) {
  const secret = config.jwtSecret
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return jwt.verify(token, secret)
}

function requireAuth() {
  const secret = config.jwtSecret
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return (req, res, next) => {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ ok: false, error: 'No autorizado' })
    try {
      const payload = jwt.verify(token, secret)
      req.auth = { userId: Number(payload.sub), rol: payload.rol }
      next()
    } catch {
      return res.status(401).json({ ok: false, error: 'Token invalido' })
    }
  }
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  return (req, res, next) => {
    const rol = req.auth?.rol
    if (!rol) return res.status(401).json({ ok: false, error: 'No autorizado' })
    if (!allowed.includes(rol)) return res.status(403).json({ ok: false, error: 'Prohibido' })
    next()
  }
}

module.exports = { signToken, decodeToken, requireAuth, requireRole }
