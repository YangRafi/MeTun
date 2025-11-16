const Profile = require('../models/Profile');
const User = require('../models/User');

const ALLOWED_GENDERS = ['male', 'female', 'other'];
const MIN_AGE = 16;

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

class ProfileService {
  async getAllProfiles() {
    return await Profile.findAll();
  }

  async getProfileById(profileId) {
    return await Profile.findByPk(profileId);
  }

  async getProfileByUserId(userId) {
    return await Profile.findOne({ where: { user_id: userId } });
  }

  async checkUserProfile(userId) {
    const profile = await this.getProfileByUserId(userId);
    return !!profile;
  }

  async createProfile(data, file, host) {
    const { user_id, name, bio, date_of_birth, gender, location } = data;

    if (!user_id || !name) throw { status: 400, message: 'user_id and name are required' };
    if (gender && !ALLOWED_GENDERS.includes(gender)) throw { status: 400, message: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` };
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      if (dob > new Date()) throw { status: 400, message: 'date_of_birth cannot be in the future' };
      const age = calculateAge(dob);
      if (age < MIN_AGE) throw { status: 400, message: `User must be at least ${MIN_AGE} years old` };
    }

    const user = await User.findByPk(user_id);
    if (!user) throw { status: 400, message: 'Invalid user_id' };

    const existing = await this.getProfileByUserId(user_id);
    if (existing) throw { status: 400, message: 'Profile already exists for this user' };

    const profile_picture = file ? `${host}/uploads/profile_pictures/${file.filename}` : null;

    return await Profile.create({
      user_id,
      name,
      bio: bio || null,
      profile_picture,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      location: location || null
    });
  }

  async updateProfile(profileId, data, file, host) {
    const profile = await this.getProfileById(profileId);
    if (!profile) throw { status: 404, message: 'Profile not found' };

    const { name, bio, date_of_birth, gender, location } = data;

    if (gender && !ALLOWED_GENDERS.includes(gender)) throw { status: 400, message: `gender must be one of: ${ALLOWED_GENDERS.join(', ')}` };
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      if (dob > new Date()) throw { status: 400, message: 'date_of_birth cannot be in the future' };
      const age = calculateAge(dob);
      if (age < MIN_AGE) throw { status: 400, message: `User must be at least ${MIN_AGE} years old` };
    }

    if (file) profile.profile_picture = `${host}/uploads/profile_pictures/${file.filename}`;
    if (name !== undefined) profile.name = name;
    if (bio !== undefined) profile.bio = bio;
    if (date_of_birth !== undefined) profile.date_of_birth = date_of_birth;
    if (gender !== undefined) profile.gender = gender;
    if (location !== undefined) profile.location = location;

    await profile.save();
    return profile;
  }

  async deleteProfile(profileId) {
    const profile = await this.getProfileById(profileId);
    if (!profile) throw { status: 404, message: 'Profile not found' };
    await profile.destroy();
    return true;
  }
}

module.exports = new ProfileService();
