const { Router } = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const movementsController = require('../controllers/movements.controller')

const router = Router()

router.get('/movements', requireAuth(), movementsController.list)
router.post('/movements', requireAuth(), requireRole(['Administrador']), movementsController.create)

module.exports = router
