const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// GET all
router.get('/', groupController.getAllGroups);

// GET by ID
router.get('/:id', groupController.getGroupById);

// CREATE
router.post('/', groupController.createGroup);

// UPDATE
router.put('/:id', groupController.updateGroup);

// DELETE
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
