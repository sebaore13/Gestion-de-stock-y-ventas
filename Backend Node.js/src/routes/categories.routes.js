const { Router } = require('express')
const { requireAuth } = require('../middlewares/auth')
const categoriesController = require('../controllers/categories.controller')

const router = Router()

router.get('/categories', requireAuth(), categoriesController.list)

module.exports = router
