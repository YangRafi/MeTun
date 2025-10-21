const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, isAdmin } = require('../middleware/auth');
const userUniversityController = require('../controllers/userUniversityController');

const upload = multer({ dest: 'uploads/' });

// 🔸 Użytkownik
router.get('/', authenticate, userUniversityController.getUserUniversities);
router.post('/', authenticate, upload.single('document'), userUniversityController.addUserUniversity);
router.delete('/:id', authenticate, userUniversityController.deleteUserUniversity);

// 🔸 Admin
router.get('/admin/all', authenticate, isAdmin, userUniversityController.getAllApplications);
router.put('/admin/:id/status', authenticate, isAdmin, userUniversityController.updateStatus);

module.exports = router;
