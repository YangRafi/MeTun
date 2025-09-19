// controllers/profileController.js
const Profile = require('../models/Profile');
const User = require('../models/User'); // optional check if user exists

const ALLOWED_GENDERS = ['male', 'female', 'other'];

// GET all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll();
    res.json(profiles);
  } catch (err) {
    console.error('Error fetching profiles:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// CREATE profile
exports.createProfile = async (req, res) => {
  try {
    const { user_id, name, bio, profile_picture, date_of_birth, gender, location } = req.body;

    // basic required fields
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name are required' });
    }

    // check gender
    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
    }

    // optional: check that user exists
    const user = await User.findByPk(user_id);
    if (!user) return res.status(400).json({ error: 'Invalid user_id' });

    // optional: ensure one profile per user (if desired)
    const existing = await Profile.findOne({ where: { user_id } });
    if (existing) return res.status(400).json({ error: 'Profile already exists for this user' });

    const newProfile = await Profile.create({
      user_id,
      name,
      bio: bio || null,
      profile_picture: profile_picture || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      location: location || null
    });

    return res.status(201).json(newProfile);
  } catch (err) {
    console.error('Error creating profile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, bio, profile_picture, date_of_birth, gender, location } = req.body;

    const profile = await Profile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
    }

    // allow partial updates
    if (name !== undefined) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
    if (profile_picture !== undefined) profile.profile_picture = profile_picture;
    if (date_of_birth !== undefined) profile.date_of_birth = date_of_birth;
    if (gender !== undefined) profile.gender = gender;
    if (location !== undefined) profile.location = location;

    await profile.save();
    return res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE profile
exports.deleteProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const profile = await Profile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await profile.destroy();
    return res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error('Error deleting profile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
