const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/private', authenticate, chatController.getPrivateChats);

router.get('/group', authenticate, chatController.getGroupChats);

router.get('/:chatType/:chatId', authenticate, chatController.getMessages);

module.exports = router;
