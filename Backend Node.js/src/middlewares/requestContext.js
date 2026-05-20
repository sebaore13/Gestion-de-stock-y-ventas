const crypto = require('crypto')

function requestIdMiddleware() {
  return (req, res, next) => {
    const headerId = req.headers['x-request-id']
    const id = (Array.isArray(headerId) ? headerId[0] : headerId) || crypto.randomUUID()
    req.requestId = String(id)
    res.setHeader('X-Request-Id', req.requestId)
    next()
  }
}

function errorHandler() {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const requestId = req.requestId || null
    const status = Number(err?.status || err?.statusCode) || 500
    const message = err?.message || 'Internal error'

    // Minimal structured log for production.
    console.error(JSON.stringify({
      level: 'error',
      msg: message,
      status,
      requestId,
      path: req.originalUrl,
      method: req.method,
    }))

    if (res.headersSent) return
    res.status(status).json({ ok: false, error: status >= 500 ? 'Error interno' : message, requestId })
  }
}

module.exports = { requestIdMiddleware, errorHandler }
