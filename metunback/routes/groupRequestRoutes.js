const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const groupRequestController = require('../controllers/groupRequestController');

router.post('/join', authenticate, groupRequestController.requestJoin);

router.get('/pending', authenticate, groupRequestController.getJoinRequests);

router.post('/respond', authenticate, groupRequestController.respondToRequest);

module.exports = router;
