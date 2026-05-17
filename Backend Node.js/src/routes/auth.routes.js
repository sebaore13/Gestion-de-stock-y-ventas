const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const authController = require('../controllers/auth.controller')

const router = Router()

router.post('/auth/login', authController.login)
router.get('/me', requireAuth(), authController.me)

module.exports = router
