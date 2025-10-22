const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

router.get('/potential', authenticate, matchController.getPotentialMatches); // pobranie potencjalnych dopasowań
router.post('/vote', authenticate, matchController.voteUser); // swipe left/right
router.post('/unlike/:id', authenticate, matchController.unlikeUser);

module.exports = router;
