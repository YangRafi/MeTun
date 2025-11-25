const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const groupRequestController = require('../controllers/groupRequestController');

// 🔹 GET - pobranie wszystkich requestów (admin)
router.get('/all', authenticate, isAdmin, groupRequestController.getAllRequests);

// 🔹 Pobranie wszystkich requestów / invite (dla admina)
router.get('/pending', authenticate, groupRequestController.getJoinRequests);

// 🔹 Pobierz wszystkie prośby / zaproszenia dotyczące zalogowanego użytkownika
router.get('/mine', authenticate, groupRequestController.getPendingRequestsForUser);

// 🔹 Prośba użytkownika o dołączenie
router.post('/join', authenticate, groupRequestController.requestJoin);

// 🔹 Zaproszenie użytkownika (admin)
router.post('/invite', authenticate, groupRequestController.inviteUser);

// 🔹 Akceptacja / odrzucenie requestu
router.post('/respond', authenticate, groupRequestController.respondToRequest);

// 🔹 Usuń prośbę (request)
router.delete('/request/:requestId', authenticate, groupRequestController.deleteRequest);

// 🔹 Usuń zaproszenie (invite)
router.delete('/invite/:requestId', authenticate, groupRequestController.deleteInvite);

// 🔹 Pobierz zaproszenia dla danej grupy (dynamiczne :groupId)
router.get('/:groupId/invites', authenticate, groupRequestController.getGroupInvites);

module.exports = router;
