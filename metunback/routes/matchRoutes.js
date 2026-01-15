const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

router.get('/potential', authenticate, matchController.getPotentialMatches);

router.post('/vote', authenticate, matchController.voteUser);

router.post('/unlike/:id', authenticate, matchController.unlikeUser);

module.exports = router;
