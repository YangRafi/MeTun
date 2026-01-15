const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, isAdmin } = require('../middleware/auth');
const userUniversityController = require('../controllers/userUniversityController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/documents'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.get('/my', authenticate, userUniversityController.getUserUniversities);

router.post('/', authenticate, upload.single('document'), userUniversityController.addUserUniversity);

router.post('/:id/activateTrial', authenticate, userUniversityController.activateTrial);

router.put('/:id', authenticate, upload.single('document'), userUniversityController.updateDocument);

router.delete('/:id', authenticate, userUniversityController.deleteUserUniversity);

router.get('/all', authenticate, isAdmin, userUniversityController.getAllApplications);

router.put('/:id/status', authenticate, isAdmin, userUniversityController.updateStatus);

router.get('/requests/status', authenticate, isAdmin, userUniversityController.getApplicationsByStatus);

module.exports = router;
