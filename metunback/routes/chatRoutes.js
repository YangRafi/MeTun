const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

// Prywatne czaty 1:1
router.get('/private', authenticate, chatController.getPrivateChats);

// Grupowe czaty
router.get('/group', authenticate, chatController.getGroupChats);

// Pobranie wiadomości dla czatu
router.get('/:chatType/:chatId', authenticate, chatController.getMessages);

// Wysłanie wiadomości
router.post('/:chatType/:chatId', authenticate, chatController.sendMessage);

module.exports = router;
