const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, isAdmin, userController.getAllUsers);

router.get('/stats', authenticate, userController.getStats);

router.put('/change-email', authenticate, userController.changeEmail);

router.get('/:id', authenticate, userController.getUserById);

router.post('/', userController.createUser);

router.patch('/:id/password', authenticate, userController.changePassword);

router.put('/:id', authenticate, userController.updateUser);

router.delete('/me', authenticate, userController.deleteMe);

router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

router.put('/:id/role', authenticate, isAdmin, userController.changeUserRole);

router.put('/:id/ban', authenticate, isAdmin, userController.banUser);

router.put('/:id/unban', authenticate, isAdmin, userController.unbanUser);

module.exports = router;
