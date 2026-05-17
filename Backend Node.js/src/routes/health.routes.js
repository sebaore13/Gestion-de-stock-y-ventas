const { Router } = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const healthController = require('../controllers/health.controller')

const router = Router()

router.get('/health', healthController.health)
router.get('/db/ping', healthController.dbPing)
router.get('/admin/ping', requireAuth(), requireRole(['Administrador']), healthController.adminPing)

module.exports = router
