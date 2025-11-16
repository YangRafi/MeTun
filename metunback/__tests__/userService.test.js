const userService = require('../services/userService');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models', () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  UserMatch: { count: jest.fn() },
  GroupMember: { count: jest.fn() },
  UserUniversity: { count: jest.fn() },
  Message: { count: jest.fn() }
}));

// -----------------------------
// MOCK SOCKET
// -----------------------------

jest.mock('../util/socket', () => {
const  mockEmit = jest.fn();
const  mockTo = jest.fn().mockReturnValue({ emit: mockEmit });

  return {
    getIo: jest.fn(() => ({
      to: mockTo
    })),
    userSockets: new Map(),
    __mockEmit: mockEmit, // do użycia w testach
    __mockTo: mockTo
  };
});

const { User, UserMatch, GroupMember, UserUniversity, Message } = require('../models');
const { getIo, userSockets, __mockEmit, __mockTo } = require('../util/socket');

// -----------------------------
// MOCK BCRYPT
// -----------------------------
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// -----------------------------
// TESTY USER SERVICE
// -----------------------------
describe('UserService', () => {

  afterEach(() => {
    jest.clearAllMocks();
    userSockets.clear();
  });

  // --------------------------
  // GET ALL USERS
  // --------------------------
  test('getAllUsers zwraca listę użytkowników', async () => {
    User.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await userService.getAllUsers();

    expect(result.length).toBe(2);
    expect(User.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.any(Object)
      })
    );
  });

  // --------------------------
  // GET USER BY ID
  // --------------------------
  test('getUserById zwraca użytkownika', async () => {
    User.findByPk.mockResolvedValue({ id: 1 });

    const result = await userService.getUserById(1);

    expect(result).toEqual({ id: 1 });
    expect(User.findByPk).toHaveBeenCalled();
  });

  // --------------------------
  // CREATE USER
  // --------------------------
  test('createUser tworzy nowego użytkownika', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed123");
    User.create.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      toJSON: () => ({ id: 1, email: 'test@test.com' })
    });

    const data = { name: 'Test', surname: 'User', email: 'test@test.com', password: '123' };

    const result = await userService.createUser(data);

    expect(result.id).toBe(1);
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(User.create).toHaveBeenCalled();
  });

  test('createUser rzuca błąd jeśli email istnieje', async () => {
    User.findOne.mockResolvedValue({ id: 1 });

    await expect(
      userService.createUser({ email: 'x', password: 'y' })
    ).rejects.toThrow("Email already in use");
  });

  // --------------------------
  // CHANGE PASSWORD
  // --------------------------
  test('changePassword zmienia hasło', async () => {
    const userMock = { password: 'old', save: jest.fn() };

    User.findByPk.mockResolvedValue(userMock);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("newhash");

    const result = await userService.changePassword(1, 'oldPass', 'newPass');

    expect(result).toBe(true);
    expect(userMock.password).toBe("newhash");
  });

  test('changePassword rzuca błąd przy złym haśle', async () => {
    bcrypt.compare.mockResolvedValue(false);
    User.findByPk.mockResolvedValue({ password: 'old' });

    await expect(
      userService.changePassword(1, 'zle', 'nowe')
    ).rejects.toThrow("Wrong current password");
  });

  // --------------------------
  // UPDATE USER
  // --------------------------
  test('updateUser poprawnie aktualizuje dane', async () => {
    const userMock = {
      email: 'old@mail.com',
      toJSON: () => ({ id: 1, email: 'new@mail.com' }),
      save: jest.fn()
    };

    User.findByPk.mockResolvedValue(userMock);
    User.findOne.mockResolvedValue(null);

    const result = await userService.updateUser(1, { email: 'new@mail.com' });

    expect(result.email).toBe('new@mail.com');
    expect(userMock.save).toHaveBeenCalled();
  });

  // --------------------------
  // DELETE USER
  // --------------------------
  test('deleteUser usuwa użytkownika i wysyła event socketowy', async () => {
    const destroyMock = jest.fn();
    User.findByPk.mockResolvedValue({ destroy: destroyMock });

    const mockSocketId = "abc123";
    userSockets.set(1, mockSocketId);

    const result = await userService.deleteUser(1);

    expect(result).toBe(true);
    expect(destroyMock).toHaveBeenCalled();
    expect(__mockTo).toHaveBeenCalledWith(mockSocketId);
    expect(__mockEmit).toHaveBeenCalled();
  });

  // --------------------------
  // STATS
  // --------------------------
  test('getStats zwraca statystyki', async () => {
    UserMatch.count.mockResolvedValue(2);
    GroupMember.count.mockResolvedValue(3);
    UserUniversity.count.mockResolvedValue(1);
    Message.count.mockResolvedValue(10);
    User.findByPk.mockResolvedValue({ has_trial: true });

    const stats = await userService.getStats(1);

    expect(stats).toEqual({
      matchesCount: 2,
      groupsCount: 3,
      universitiesCount: 1,
      messagesCount: 10,
      hasTrial: true
    });
  });

  // --------------------------
  // CHANGE EMAIL
  // --------------------------
  test('changeEmail działa poprawnie', async () => {
    const userMock = {
      email: 'old@mail.com',
      toJSON: () => ({ id: 1, email: 'new@mail.com' }),
      save: jest.fn()
    };

    User.findOne.mockResolvedValue(null);
    User.findByPk.mockResolvedValue(userMock);

    const result = await userService.changeEmail(1, 'new@mail.com');

    expect(result.email).toBe('new@mail.com');
    expect(userMock.save).toHaveBeenCalled();
  });

  // --------------------------
  // CHANGE USER ROLE
  // --------------------------
  test('changeUserRole zmienia rolę i wysyła socket', async () => {
    const userMock = { role: 'user', save: jest.fn() };
    User.findByPk.mockResolvedValue(userMock);

    const mockSocket = "s1";
    userSockets.set(1, mockSocket);

    const result = await userService.changeUserRole(1, 'admin');

    expect(result).toBe(true);
    expect(userMock.role).toBe('admin');
    expect(__mockTo).toHaveBeenCalledWith(mockSocket);
    expect(__mockEmit).toHaveBeenCalled();
  });

  // --------------------------
  // BAN / UNBAN
  // --------------------------
  test('banUser ustawia ban i wysyła event', async () => {
    const userMock = { save: jest.fn() };
    User.findByPk.mockResolvedValue(userMock);

    const socket = "socket123";
    userSockets.set(1, socket);

    await userService.banUser(1, 1);

    expect(userMock.is_banned).toBe(true);
    expect(__mockTo).toHaveBeenCalledWith(socket);
    expect(__mockEmit).toHaveBeenCalled();
  });

  test('unbanUser działa poprawnie', async () => {
    const userMock = { save: jest.fn() };
    User.findByPk.mockResolvedValue(userMock);

    const socket = "sX";
    userSockets.set(1, socket);

    const result = await userService.unbanUser(1);

    expect(result).toBe(true);
    expect(__mockTo).toHaveBeenCalledWith(socket);
    expect(__mockEmit).toHaveBeenCalled();
  });
});
