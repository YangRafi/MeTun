const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profile_pictures'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.get('/', profileController.getAllProfiles);

router.get('/check', authenticate, profileController.checkUserProfile);

router.get('/:id', profileController.getProfileById);

router.get('/user/:user_id', authenticate, profileController.getProfileByUserId);

router.post('/', authenticate, upload.single('profile_picture'), profileController.createProfile);

router.put('/:id', authenticate, upload.single('profile_picture'), profileController.updateProfile);

router.delete('/:id', authenticate, profileController.deleteProfile);

module.exports = router;
