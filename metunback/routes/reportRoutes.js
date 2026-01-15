const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Tworzenie raportu przez użytkownika
router.post('/', authenticate, reportController.createReport);

// Pobranie raportów (tylko admin)
router.get('/', authenticate, isAdmin, reportController.getReports);

// Aktualizacja statusu raportu i opcjonalnej odpowiedzi (tylko admin)
router.patch('/:id', authenticate, isAdmin, reportController.updateReport);

module.exports = router;
