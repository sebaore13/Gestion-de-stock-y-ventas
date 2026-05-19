const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const authController = require('../controllers/auth.controller')
const { jsonRateLimit } = require('../middlewares/rateLimit')
const { ipKeyGenerator } = require('express-rate-limit')

const router = Router()

const loginIpLimiter = jsonRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
})

const loginEmailLimiter = jsonRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    return email ? `email:${email}` : `email:missing:${ipKeyGenerator(req)}`
  },
})

router.post('/auth/login', loginIpLimiter, loginEmailLimiter, authController.login)
router.get('/me', requireAuth(), authController.me)

module.exports = router
