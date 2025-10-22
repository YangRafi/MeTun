const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, isAdmin } = require('../middleware/auth');
const userUniversityController = require('../controllers/userUniversityController');

// 🔹 Konfiguracja uploadu plików (dokumenty)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/documents'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 🔸 Student - pobierz swoje aplikacje
router.get('/my', authenticate, userUniversityController.getUserUniversities);

// 🔸 Student - dodaj aplikację (z plikiem)
router.post('/', authenticate, upload.single('document'), userUniversityController.addUserUniversity);

router.post('/:id/activateTrial', authenticate, userUniversityController.activateTrial);

// 🔸 Student - edytuj swój dokument
router.put('/:id', authenticate, upload.single('document'), userUniversityController.updateDocument);

// 🔸 Student - usuń swoją aplikację
router.delete('/:id', authenticate, userUniversityController.deleteUserUniversity);

// 🔸 Admin - pobierz wszystkie aplikacje
router.get('/all', authenticate, isAdmin, userUniversityController.getAllApplications);

// 🔸 Admin - zmień status aplikacji
router.put('/:id/status', authenticate, isAdmin, userUniversityController.updateStatus);

// 🔸 Admin - wnioski pogrupowane po statusie
router.get('/requests/status', authenticate, isAdmin, userUniversityController.getApplicationsByStatus);

module.exports = router;
