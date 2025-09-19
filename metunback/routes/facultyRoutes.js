const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

// GET all
router.get('/', facultyController.getAllFaculties);

// GET by ID
router.get('/:id', facultyController.getFacultyById);

// CREATE
router.post('/', facultyController.createFaculty);

// UPDATE
router.put('/:id', facultyController.updateFaculty);

// DELETE
router.delete('/:id', facultyController.deleteFaculty);

module.exports = router;
