const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// 🔹 użyj ich razem
router.get('/dashboard', authenticate, isAdmin, adminController.getDashboardData);

module.exports = router;
