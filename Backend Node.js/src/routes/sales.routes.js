const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const salesController = require('../controllers/sales.controller')

const router = Router()

router.post('/sales', requireAuth(), salesController.create)
router.get('/sales', requireAuth(), salesController.list)

module.exports = router
