const express = require('express');
const router = express.Router();
const groupMemberController = require('../controllers/groupMemberController');
const { authenticate } = require('../middleware/auth');

// GET all members of a group
router.get('/:groupId', authenticate, groupMemberController.getMembersByGroup);

// ADD new member
router.post('/:groupId', authenticate, groupMemberController.addMember);

// UPDATE member (e.g. role)
router.put('/:groupId/member/:userId', authenticate, groupMemberController.updateMember);

// REMOVE member
router.delete('/:groupId/member/:userId', authenticate,  groupMemberController.removeMember);

// LEAVE group
router.post('/:groupId/leave', authenticate, groupMemberController.leaveGroup);

module.exports = router;
