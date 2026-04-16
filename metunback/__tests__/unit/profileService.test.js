const profileService = require('../../services/profileService');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

jest.mock('../models/Profile', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../models/User', () => ({
  findByPk: jest.fn()
}));

describe('ProfileService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getAllProfiles returns a list of profiles', async () => {
    Profile.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await profileService.getAllProfiles();
    expect(result.length).toBe(2);
    expect(Profile.findAll).toHaveBeenCalled();
  });

  test('getProfileById returns a profile', async () => {
    Profile.findByPk.mockResolvedValue({ id: 1 });
    const result = await profileService.getProfileById(1);
    expect(result).toEqual({ id: 1 });
    expect(Profile.findByPk).toHaveBeenCalledWith(1);
  });

  test('getProfileByUserId returns a profile', async () => {
    Profile.findOne.mockResolvedValue({ id: 1, user_id: 1 });
    const result = await profileService.getProfileByUserId(1);
    expect(result).toEqual({ id: 1, user_id: 1 });
    expect(Profile.findOne).toHaveBeenCalledWith({ where: { user_id: 1 } });
  });

  test('checkUserProfile returns true if profile exists', async () => {
    profileService.getProfileByUserId = jest.fn().mockResolvedValue({ id: 1 });
    const result = await profileService.checkUserProfile(1);
    expect(result).toBe(true);
  });

  test('checkUserProfile returns false if profile does not exist', async () => {
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);
    const result = await profileService.checkUserProfile(1);
    expect(result).toBe(false);
  });

  test('createProfile creates a new profile', async () => {
    const user = { id: 1 };
    User.findByPk.mockResolvedValue(user);
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test' };
    const file = { filename: 'pic.jpg' };
    const host = 'http://localhost';

    const createdProfile = { id: 1, ...data };
    Profile.create.mockResolvedValue(createdProfile);

    const result = await profileService.createProfile(data, file, host);

    expect(result).toEqual(createdProfile);
    expect(Profile.create).toHaveBeenCalledWith({
      ...data,
      bio: null,
      profile_picture: 'http://localhost/uploads/profile_pictures/pic.jpg',
      date_of_birth: null,
      gender: null,
      location: null
    });
  });

  test('createProfile throws an error when user_id is missing', async () => {
    await expect(profileService.createProfile({ name: 'Test' }, null, null))
      .rejects.toMatchObject({ status: 400 });
  });

  test('createProfile throws an error if profile already exists', async () => {
    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue({ id: 1 });

    await expect(profileService.createProfile({ user_id: 1, name: 'Test' }, null, null))
      .rejects.toMatchObject({ status: 400, message: 'Profile already exists for this user' });
  });

  test('updateProfile updates the profile', async () => {
    const profileMock = { id: 1, save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const data = { name: 'Updated' };
    const result = await profileService.updateProfile(1, data, null, null);

    expect(result).toEqual(profileMock);
    expect(profileMock.name).toBe('Updated');
    expect(profileMock.save).toHaveBeenCalled();
  });

  test('updateProfile throws an error if profile does not exist', async () => {
    profileService.getProfileById = jest.fn().mockResolvedValue(null);
    await expect(profileService.updateProfile(1, {}, null, null))
      .rejects.toMatchObject({ status: 404 });
  });

  test('deleteProfile deletes the profile', async () => {
    const profileMock = { destroy: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const result = await profileService.deleteProfile(1);
    expect(result).toBe(true);
    expect(profileMock.destroy).toHaveBeenCalled();
  });

  test('deleteProfile throws an error if profile does not exist', async () => {
    profileService.getProfileById = jest.fn().mockResolvedValue(null);
    await expect(profileService.deleteProfile(1))
      .rejects.toMatchObject({ status: 404 });
  });

  test('createProfile throws an error for invalid gender', async () => {
    const data = { user_id: 1, name: 'Test', gender: 'invalid' };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('gender must be one of') });
  });

  test('createProfile throws an error when date_of_birth is in the future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test', date_of_birth: futureDate.toISOString() };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'date_of_birth cannot be in the future' });
  });

  test('createProfile throws an error when age is below MIN_AGE', async () => {
    const youngDate = new Date();
    youngDate.setFullYear(youngDate.getFullYear() - 10);

    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test', date_of_birth: youngDate.toISOString() };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('User must be at least') });
  });

  test('createProfile throws an error if user does not exist', async () => {
    User.findByPk.mockResolvedValue(null);
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test' };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'Invalid user_id' });
  });

  test('updateProfile throws an error for invalid gender', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const data = { gender: 'invalid' };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('gender must be one of') });
  });

  test('updateProfile throws an error when date_of_birth is in the future', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const data = { date_of_birth: futureDate.toISOString() };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'date_of_birth cannot be in the future' });
  });

  test('updateProfile throws an error when age is below MIN_AGE', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const youngDate = new Date();
    youngDate.setFullYear(youngDate.getFullYear() - 10);

    const data = { date_of_birth: youngDate.toISOString() };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('User must be at least') });
  });

  test('updateProfile updates profile with file and all fields', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const file = { filename: 'pic.jpg' };
    const host = 'http://localhost';
    const data = {
      name: 'NewName',
      bio: 'Bio',
      date_of_birth: '2000-01-01',
      gender: 'male',
      location: 'City'
    };

    const result = await profileService.updateProfile(1, data, file, host);

    expect(result).toBe(profileMock);
    expect(profileMock.name).toBe('NewName');
    expect(profileMock.bio).toBe('Bio');
    expect(profileMock.date_of_birth).toBe('2000-01-01');
    expect(profileMock.gender).toBe('male');
    expect(profileMock.location).toBe('City');
    expect(profileMock.profile_picture).toBe('http://localhost/uploads/profile_pictures/pic.jpg');
    expect(profileMock.save).toHaveBeenCalled();
  });

});
