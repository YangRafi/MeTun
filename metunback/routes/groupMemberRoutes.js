const express = require('express');
const router = express.Router();
const groupMemberController = require('../controllers/groupMemberController');
const { authenticate } = require('../middleware/auth');

router.get('/:groupId', authenticate, groupMemberController.getMembersByGroup);

router.post('/:groupId', authenticate, groupMemberController.addMember);

router.put('/:groupId/member/:userId', authenticate, groupMemberController.updateMember);

router.delete('/:groupId/member/:userId', authenticate,  groupMemberController.removeMember);

router.post('/:groupId/leave', authenticate, groupMemberController.leaveGroup);

module.exports = router;
