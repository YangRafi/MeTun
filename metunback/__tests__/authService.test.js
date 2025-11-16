const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserUniversity = require('../models/UserUniversity');

jest.mock('../models/User');
jest.mock('../models/UserUniversity');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('authService', () => {
  afterEach(() => jest.clearAllMocks());

  // --------------------------
  // signup
  // --------------------------
  test('signup tworzy nowego użytkownika', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    const mockUser = { user_id: 1, name: 'Alice', email: 'alice@test.com' };
    User.create.mockResolvedValue(mockUser);

    const result = await authService.signup({ name: 'Alice', surname: 'Smith', email: 'alice@test.com', password: 'pass' });
    expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashedPassword' }));
    expect(result).toEqual(mockUser);
  });

  test('signup rzuca błąd jeśli email istnieje', async () => {
    User.findOne.mockResolvedValue({ user_id: 1 });
    await expect(authService.signup({ name: 'Alice', surname: 'Smith', email: 'alice@test.com', password: 'pass' }))
      .rejects.toThrow('User already exists');
  });

  // --------------------------
  // login
  // --------------------------
  test('login zwraca tokeny i informacje o użytkowniku', async () => {
    const mockUser = { user_id: 1, email: 'a@test.com', password: 'hashed', role: 'user', is_banned: false };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    UserUniversity.findAll.mockResolvedValue([{ status: 'approved' }]);
    jwt.sign.mockReturnValue('token');

    const result = await authService.login({ email: 'a@test.com', password: 'pass' });
    expect(result).toHaveProperty('user', mockUser);
    expect(result).toHaveProperty('isVerified', true);
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
  });

  test('login rzuca błąd przy niepoprawnym emailu', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.login({ email: 'x@test.com', password: 'pass' }))
      .rejects.toThrow('Invalid email or password');
  });

  test('login rzuca błąd przy złym haśle', async () => {
    const mockUser = { password: 'hashed' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.login({ email: 'a@test.com', password: 'pass' }))
      .rejects.toThrow('Invalid email or password');
  });

  test('login rzuca błąd jeśli użytkownik jest zbanowany', async () => {
    const bannedUser = { user_id: 1, email: 'a@test.com', password: 'hashed', is_banned: true, banned_until: new Date(Date.now() + 1000) };
    User.findOne.mockResolvedValue(bannedUser);
    bcrypt.compare.mockResolvedValue(true);
    await expect(authService.login({ email: 'a@test.com', password: 'pass' }))
      .rejects.toThrow(/Twoje konto jest zbanowane do/);
  });

  // --------------------------
  // refreshAccessToken
  // --------------------------
  test('refreshAccessToken zwraca nowy access token', async () => {
    const mockUser = { user_id: 1, email: 'a@test.com', role: 'user', is_banned: false };
    jwt.verify.mockReturnValue({ userId: 1 });
    User.findByPk.mockResolvedValue(mockUser);
    UserUniversity.findAll.mockResolvedValue([{ status: 'approved' }]);
    jwt.sign.mockReturnValue('newToken');

    const result = await authService.refreshAccessToken('refreshToken');
    expect(result.accessToken).toBe('newToken');
    expect(result.user).toBe(mockUser);
  });

  test('refreshAccessToken rzuca błąd przy braku tokenu', async () => {
    await expect(authService.refreshAccessToken(null)).rejects.toThrow('No refresh token');
  });

  test('refreshAccessToken rzuca błąd jeśli użytkownik nie istnieje', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    User.findByPk.mockResolvedValue(null);
    await expect(authService.refreshAccessToken('token')).rejects.toThrow('User not found');
  });

  // --------------------------
  // checkIsVerified
  // --------------------------
  test('checkIsVerified zwraca true jeśli status approved', async () => {
    UserUniversity.findAll.mockResolvedValue([{ status: 'approved' }]);
    const result = await authService.checkIsVerified(1);
    expect(result).toBe(true);
  });

  test('checkIsVerified zwraca false jeśli brak approval', async () => {
    UserUniversity.findAll.mockResolvedValue([{ status: 'pending' }]);
    const result = await authService.checkIsVerified(1);
    expect(result).toBe(false);
  });

  // --------------------------
  // handleBan
  // --------------------------
  test('handleBan nie rzuca jeśli użytkownik nie jest zbanowany', async () => {
    const user = { is_banned: false };
    await expect(authService.handleBan(user)).resolves.toBeUndefined();
  });

  test('handleBan odblokowuje użytkownika jeśli ban wygasł', async () => {
    const user = { is_banned: true, banned_until: new Date(Date.now() - 1000), save: jest.fn() };
    await authService.handleBan(user);
    expect(user.is_banned).toBe(false);
    expect(user.banned_until).toBeNull();
    expect(user.save).toHaveBeenCalled();
  });

  test('handleBan rzuca błąd jeśli ban aktywny', async () => {
    const future = new Date(Date.now() + 1000);
    const user = { is_banned: true, banned_until: future };
    await expect(authService.handleBan(user)).rejects.toThrow(/Twoje konto jest zbanowane do/);
  });
});
