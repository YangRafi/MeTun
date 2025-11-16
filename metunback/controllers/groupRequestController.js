const groupRequestService = require('../services/groupRequestService');

exports.requestJoin = async (req, res) => {
  try {
    const result = await groupRequestService.requestJoin(req.user.userId, req.body.groupId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.inviteUser = async (req, res) => {
  try {
    const result = await groupRequestService.inviteUser(req.user.userId, req.body.groupId, req.body.userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getJoinRequests = async (req, res) => {
  try {
    const requests = await groupRequestService.getJoinRequests(req.user.userId);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupInvites = async (req, res) => {
  try {
    const invites = await groupRequestService.getGroupInvites(req.params.groupId);
    res.json({ invites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    await groupRequestService.respondToRequest(req.body.requestId, req.body.action);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPendingRequestsForUser = async (req, res) => {
  try {
    const requests = await groupRequestService.getPendingRequestsForUser(req.user.userId);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInvite = async (req, res) => {
  try {
    await groupRequestService.deleteInvite(req.params.requestId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
