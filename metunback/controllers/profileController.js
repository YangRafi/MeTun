const Profile = require('../models/Profile');
const User = require('../models/User');
const path = require('path');

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


// CHECK if user has a profile
exports.checkUserProfile = async (req, res) => {
   try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await Profile.findOne({ where: { user_id: userId } });
    res.json({ hasProfile: !!profile });
  } catch (err) {
    console.error('Error checking profile:', err);
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

// GET profile by user_id
exports.getProfileByUserId = async (req, res) => {
  try {
    const userId = req.params.user_id;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile by user_id:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// CREATE profile
exports.createProfile = async (req, res) => {
  try {
    const { user_id, name, bio, date_of_birth, gender, location } = req.body;

    // Walidacja podstawowych danych
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name are required' });
    }

    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
    }

    const user = await User.findByPk(user_id);
    if (!user) return res.status(400).json({ error: 'Invalid user_id' });

    const existing = await Profile.findOne({ where: { user_id } });
    if (existing) return res.status(400).json({ error: 'Profile already exists for this user' });

    // 🔹 Pełny URL dla zdjęcia
    const host = req.protocol + '://' + req.get('host');
    const profile_picture = req.file
      ? `${host}/uploads/profile_pictures/${req.file.filename}`
      : null;

    const newProfile = await Profile.create({
      user_id,
      name,
      bio: bio || null,
      profile_picture,
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
    const { name, bio, date_of_birth, gender, location } = req.body;

    const profile = await Profile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` });
    }

    // 🔹 Pełny URL dla nowego zdjęcia
    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      profile.profile_picture = `${host}/uploads/profile_pictures/${req.file.filename}`;
    }

    if (name !== undefined) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
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

