const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');

// GET all universities
router.get('/', universityController.getAllUniversities);

// GET one university by ID
router.get('/:id', universityController.getUniversityById);

// POST - create a new university
router.post('/', universityController.createUniversity);

// PUT - update an existing university
router.put('/:id', universityController.updateUniversity);

// DELETE - remove a university
router.delete('/:id', universityController.deleteUniversity);

module.exports = router;