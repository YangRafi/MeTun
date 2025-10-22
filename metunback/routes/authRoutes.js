const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/refresh-token', authController.refreshToken);

router.get('/check', authenticate, authController.check);

router.get('/me', authenticate, authController.me);

router.post('/logout', authController.logout);

module.exports = router;
