const profileService = require('../services/profileService');
const Profile = require('../models/Profile');
const User = require('../models/User');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models/Profile', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../models/User', () => ({
  findByPk: jest.fn()
}));

// -----------------------------
// TESTY PROFILE SERVICE
// -----------------------------
describe('ProfileService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // GET ALL PROFILES
  // --------------------------
  test('getAllProfiles zwraca listę profili', async () => {
    Profile.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await profileService.getAllProfiles();
    expect(result.length).toBe(2);
    expect(Profile.findAll).toHaveBeenCalled();
  });

  // --------------------------
  // GET PROFILE BY ID
  // --------------------------
  test('getProfileById zwraca profil', async () => {
    Profile.findByPk.mockResolvedValue({ id: 1 });
    const result = await profileService.getProfileById(1);
    expect(result).toEqual({ id: 1 });
    expect(Profile.findByPk).toHaveBeenCalledWith(1);
  });

  // --------------------------
  // GET PROFILE BY USER ID
  // --------------------------
  test('getProfileByUserId zwraca profil', async () => {
    Profile.findOne.mockResolvedValue({ id: 1, user_id: 1 });
    const result = await profileService.getProfileByUserId(1);
    expect(result).toEqual({ id: 1, user_id: 1 });
    expect(Profile.findOne).toHaveBeenCalledWith({ where: { user_id: 1 } });
  });

  // --------------------------
  // CHECK USER PROFILE
  // --------------------------
  test('checkUserProfile zwraca true jeśli profil istnieje', async () => {
    profileService.getProfileByUserId = jest.fn().mockResolvedValue({ id: 1 });
    const result = await profileService.checkUserProfile(1);
    expect(result).toBe(true);
  });

  test('checkUserProfile zwraca false jeśli profil nie istnieje', async () => {
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);
    const result = await profileService.checkUserProfile(1);
    expect(result).toBe(false);
  });

  // --------------------------
  // CREATE PROFILE
  // --------------------------
  test('createProfile tworzy nowy profil', async () => {
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

  test('createProfile rzuca błąd przy braku user_id', async () => {
    await expect(profileService.createProfile({ name: 'Test' }, null, null))
      .rejects.toMatchObject({ status: 400 });
  });

  test('createProfile rzuca błąd jeśli profil już istnieje', async () => {
    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue({ id: 1 });

    await expect(profileService.createProfile({ user_id: 1, name: 'Test' }, null, null))
      .rejects.toMatchObject({ status: 400, message: 'Profile already exists for this user' });
  });

  // --------------------------
  // UPDATE PROFILE
  // --------------------------
  test('updateProfile aktualizuje profil', async () => {
    const profileMock = { id: 1, save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const data = { name: 'Updated' };
    const result = await profileService.updateProfile(1, data, null, null);

    expect(result).toEqual(profileMock);
    expect(profileMock.name).toBe('Updated');
    expect(profileMock.save).toHaveBeenCalled();
  });

  test('updateProfile rzuca błąd jeśli profil nie istnieje', async () => {
    profileService.getProfileById = jest.fn().mockResolvedValue(null);
    await expect(profileService.updateProfile(1, {}, null, null))
      .rejects.toMatchObject({ status: 404 });
  });

  // --------------------------
  // DELETE PROFILE
  // --------------------------
  test('deleteProfile usuwa profil', async () => {
    const profileMock = { destroy: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const result = await profileService.deleteProfile(1);
    expect(result).toBe(true);
    expect(profileMock.destroy).toHaveBeenCalled();
  });

  test('deleteProfile rzuca błąd jeśli profil nie istnieje', async () => {
    profileService.getProfileById = jest.fn().mockResolvedValue(null);
    await expect(profileService.deleteProfile(1))
      .rejects.toMatchObject({ status: 404 });
  });

  // --------------------------
  // CREATE PROFILE - dodatkowe walidacje
  // --------------------------
  test('createProfile rzuca błąd przy niepoprawnym gender', async () => {
    const data = { user_id: 1, name: 'Test', gender: 'invalid' };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('gender must be one of') });
  });

  test('createProfile rzuca błąd gdy date_of_birth w przyszłości', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test', date_of_birth: futureDate.toISOString() };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'date_of_birth cannot be in the future' });
  });

  test('createProfile rzuca błąd gdy wiek < MIN_AGE', async () => {
    const youngDate = new Date();
    youngDate.setFullYear(youngDate.getFullYear() - 10); // 10 lat

    User.findByPk.mockResolvedValue({ id: 1 });
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test', date_of_birth: youngDate.toISOString() };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('User must be at least') });
  });

  test('createProfile rzuca błąd jeśli użytkownik nie istnieje', async () => {
    User.findByPk.mockResolvedValue(null);
    profileService.getProfileByUserId = jest.fn().mockResolvedValue(null);

    const data = { user_id: 1, name: 'Test' };
    await expect(profileService.createProfile(data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'Invalid user_id' });
  });

  // --------------------------
  // UPDATE PROFILE - dodatkowe walidacje
  // --------------------------
  test('updateProfile rzuca błąd przy niepoprawnym gender', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const data = { gender: 'invalid' };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('gender must be one of') });
  });

  test('updateProfile rzuca błąd gdy date_of_birth w przyszłości', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const data = { date_of_birth: futureDate.toISOString() };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: 'date_of_birth cannot be in the future' });
  });

  test('updateProfile rzuca błąd gdy wiek < MIN_AGE', async () => {
    const profileMock = { save: jest.fn() };
    profileService.getProfileById = jest.fn().mockResolvedValue(profileMock);

    const youngDate = new Date();
    youngDate.setFullYear(youngDate.getFullYear() - 10);

    const data = { date_of_birth: youngDate.toISOString() };
    await expect(profileService.updateProfile(1, data, null, null))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('User must be at least') });
  });

  test('updateProfile aktualizuje profil z plikiem i wszystkimi polami', async () => {
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
