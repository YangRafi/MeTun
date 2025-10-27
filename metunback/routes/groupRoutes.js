const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

// GET all groups - public
router.get('/', authenticate, groupController.getAllGroups);

// GET group by ID - public
router.get('/:id', authenticate, groupController.getGroupById);

// CREATE group
router.post('/', authenticate, groupController.createGroup);

// UPDATE group
router.put('/:id', authenticate, groupController.updateGroup);

// DELETE group
router.delete('/:id', authenticate, groupController.deleteGroup);

module.exports = router;
