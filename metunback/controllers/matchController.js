const matchService = require('../services/matchService');

exports.getPotentialMatches = async (req, res) => {
  try {
    const matches = await matchService.getPotentialMatches(req.user.userId, req.query);
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.voteUser = async (req, res) => {
  try {
    const { userId: otherUserId, like } = req.body;
    const result = await matchService.voteUser(req.user.userId, otherUserId, like);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.unlikeUser = async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId = req.user.userId; // <-- tu bierzesz zalogowanego użytkownika
    const result = await matchService.unlikeUser(userId, matchId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};
