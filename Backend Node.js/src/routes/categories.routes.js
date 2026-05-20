const { Router } = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const categoriesController = require('../controllers/categories.controller')

const router = Router()

router.get('/categories', requireAuth(), categoriesController.list)
router.post('/categories', requireAuth(), requireRole(['Administrador']), categoriesController.create)
router.put('/categories/:id', requireAuth(), requireRole(['Administrador']), categoriesController.update)
router.delete('/categories/:id', requireAuth(), requireRole(['Administrador']), categoriesController.remove)

module.exports = router
