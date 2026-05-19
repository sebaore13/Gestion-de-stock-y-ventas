const rateLimit = require('express-rate-limit')

function jsonRateLimit({ windowMs, max, keyGenerator }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
      res.status(429).json({ ok: false, error: 'Demasiados intentos, intenta mas tarde' })
    },
  })
}

module.exports = { jsonRateLimit }
