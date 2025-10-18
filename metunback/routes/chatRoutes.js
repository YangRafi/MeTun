const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, chatController.getUserChats);
router.get('/:matchId', authenticate, chatController.getMessages);

module.exports = router;
