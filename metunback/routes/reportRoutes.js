const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// Tworzenie raportu (przez zalogowanego użytkownika)
router.post('/', authenticate, reportController.createReport);

module.exports = router;
