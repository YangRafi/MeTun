const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { authenticate, isAdmin } = require('../middleware/auth');

// 🔹 GET - lista wszystkich uczelni (dostępna dla zalogowanych)
router.get('/', authenticate, universityController.getAllUniversities);

// 🔹 GET - jedna uczelnia po ID (również tylko dla zalogowanych)
router.get('/:id', authenticate, universityController.getUniversityById);

// 🔹 POST - dodawanie uczelni (tylko dla administratorów)
router.post('/', authenticate, isAdmin, universityController.createUniversity);

// 🔹 PUT - aktualizacja uczelni (tylko dla administratorów)
router.put('/:id', authenticate, isAdmin, universityController.updateUniversity);

// 🔹 DELETE - usunięcie uczelni (tylko dla administratorów)
router.delete('/:id', authenticate, isAdmin, universityController.deleteUniversity);

module.exports = router;
