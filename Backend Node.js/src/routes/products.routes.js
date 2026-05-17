const { Router } = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const productsController = require('../controllers/products.controller')

const router = Router()

router.get('/products', requireAuth(), productsController.list)
router.get('/products/by-codigo/:codigo', requireAuth(), productsController.getByCodigo)
router.post('/products', requireAuth(), requireRole(['Administrador']), productsController.create)
router.put('/products/:id', requireAuth(), requireRole(['Administrador']), productsController.update)
router.delete('/products/:id', requireAuth(), requireRole(['Administrador']), productsController.remove)

module.exports = router
