const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const groupRequestController = require('../controllers/groupRequestController');

// Prośba użytkownika o dołączenie
router.post('/join', authenticate, groupRequestController.requestJoin);

// Zaproszenie użytkownika (admin)
router.post('/invite', authenticate, groupRequestController.inviteUser);

// Pobranie wszystkich requestów / invite
router.get('/pending', authenticate, groupRequestController.getJoinRequests);

// Akceptacja / odrzucenie
router.post('/respond', authenticate, groupRequestController.respondToRequest);

// Pobierz zaproszenia dla danej grupy
router.get('/:groupId/invites', authenticate, groupRequestController.getGroupInvites);

// Pobierz wszystkie prośby / zaproszenia dotyczące zalogowanego użytkownika
router.get('/mine', authenticate, groupRequestController.getPendingRequestsForUser);

// Usuń zaproszenie (invite)
router.delete('/invite/:requestId', authenticate, groupRequestController.deleteInvite);

module.exports = router;
