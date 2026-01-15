const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, universityController.getAllUniversities);

router.get('/:id', authenticate, universityController.getUniversityById);

router.post('/', authenticate, isAdmin, universityController.createUniversity);

router.put('/:id', authenticate, isAdmin, universityController.updateUniversity);

router.delete('/:id', authenticate, isAdmin, universityController.deleteUniversity);

module.exports = router;
