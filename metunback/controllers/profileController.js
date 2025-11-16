const profileService = require('../services/profileService');

exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await profileService.getAllProfiles();
    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.checkUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const hasProfile = await profileService.checkUserProfile(userId);
    res.json({ hasProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const profile = await profileService.getProfileById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await profileService.getProfileByUserId(req.params.user_id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const host = req.protocol + '://' + req.get('host');
    const profile = await profileService.createProfile(req.body, req.file, host);
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const host = req.protocol + '://' + req.get('host');
    const profile = await profileService.updateProfile(req.params.id, req.body, req.file, host);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    await profileService.deleteProfile(req.params.id);
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
};
