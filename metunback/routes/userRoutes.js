const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

// 📋 tylko administrator może widzieć wszystkich
router.get('/', authenticate, isAdmin, userController.getAllUsers);

// Statystyki zalogowanego użytkownika
router.get('/stats', authenticate, userController.getStats);

// 🔄 zmiana e-maila zalogowanego użytkownika
router.put('/change-email', authenticate, userController.changeEmail);

// 📋 dostęp do danych konkretnego użytkownika
router.get('/:id', authenticate, userController.getUserById);

// ➕ rejestracja (bez autoryzacji)
router.post('/', userController.createUser);

// 🔐 zmiana hasła
router.patch('/:id/password', authenticate, userController.changePassword);

// ✏️ edycja danych
router.put('/:id', authenticate, userController.updateUser);

// 🧍‍♂️ usunięcie własnego konta
router.delete('/me', authenticate, userController.deleteMe);

// ❌ usunięcie użytkownika
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

// 🔁 zmiana roli
router.put('/:id/role', authenticate, isAdmin, userController.changeUserRole);

// 🚫 banowanie użytkownika
router.put('/:id/ban', authenticate, isAdmin, userController.banUser);

// 🔓 odbanowanie użytkownika
router.put('/:id/unban', authenticate, isAdmin, userController.unbanUser);

module.exports = router;
