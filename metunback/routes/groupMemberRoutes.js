const express = require('express');
const router = express.Router();
const groupMemberController = require('../controllers/groupMemberController');

// GET all members of a group
router.get('/:groupId', groupMemberController.getMembersByGroup);

// ADD new member
router.post('/:groupId', groupMemberController.addMember);

// UPDATE member (e.g. role)
router.put('/:groupId/member/:userId', groupMemberController.updateMember);

// REMOVE member
router.delete('/:groupId/member/:userId', groupMemberController.removeMember);

module.exports = router;
