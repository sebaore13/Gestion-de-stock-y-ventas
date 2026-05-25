const { Router } = require('express')
const { requireAuth, requireRole } = require('../middlewares/auth')
const usersController = require('../controllers/users.controller')

const router = Router()

// Admin
router.get('/users', requireAuth(), requireRole(['Administrador']), usersController.list)
router.post('/users', requireAuth(), requireRole(['Administrador']), usersController.create)
router.put('/users/:id', requireAuth(), requireRole(['Administrador']), usersController.update)
router.delete('/users/:id', requireAuth(), requireRole(['Administrador']), usersController.remove)
router.post('/users/:id/reset-password', requireAuth(), requireRole(['Administrador']), usersController.resetPassword)

// Self-service
router.post('/me/change-password', requireAuth(), usersController.changeMyPassword)

module.exports = router
