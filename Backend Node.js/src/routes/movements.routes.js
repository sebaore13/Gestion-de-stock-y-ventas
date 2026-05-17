const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const movementsController = require('../controllers/movements.controller')

const router = Router()

router.get('/movements', requireAuth(), movementsController.list)

module.exports = router
