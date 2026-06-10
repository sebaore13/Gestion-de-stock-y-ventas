const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const quotations = require('../controllers/quotations.controller')

const router = Router()

router.post('/quotations', requireAuth(), quotations.create)
router.get('/quotations', requireAuth(), quotations.list)
router.get('/quotations/:id', requireAuth(), quotations.getById)
router.post('/quotations/:id/reprint', requireAuth(), quotations.reprint)

module.exports = router
