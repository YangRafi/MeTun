const userService = require('../../services/userService');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');


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



jest.mock('../util/socket', () => {
const  mockEmit = jest.fn();
const  mockTo = jest.fn().mockReturnValue({ emit: mockEmit });

  return {
    getIo: jest.fn(() => ({
      to: mockTo
    })),
    userSockets: new Map(),
    __mockEmit: mockEmit,
    __mockTo: mockTo
  };
});

const { User, UserMatch, GroupMember, UserUniversity, Message } = require('../../models');
const { getIo, userSockets, __mockEmit, __mockTo } = require('../../util/socket');

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('UserService', () => {

  afterEach(() => {
    jest.clearAllMocks();
    userSockets.clear();
  });

  test('getAllUsers returns a list of users', async () => {
    User.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await userService.getAllUsers();

    expect(result.length).toBe(2);
    expect(User.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.any(Object)
      })
    );
  });

  test('getUserById returns a user', async () => {
    User.findByPk.mockResolvedValue({ id: 1 });

    const result = await userService.getUserById(1);

    expect(result).toEqual({ id: 1 });
    expect(User.findByPk).toHaveBeenCalled();
  });

  test('createUser creates a new user', async () => {
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

  test('createUser throws error if email exists', async () => {
    User.findOne.mockResolvedValue({ id: 1 });

    await expect(
      userService.createUser({ email: 'x', password: 'y' })
    ).rejects.toThrow("Email already in use");
  });

  test('changePassword changes password', async () => {
    const userMock = { password: 'old', save: jest.fn() };

    User.findByPk.mockResolvedValue(userMock);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("newhash");

    const result = await userService.changePassword(1, 'oldPass', 'newPass');

    expect(result).toBe(true);
    expect(userMock.password).toBe("newhash");
  });

  test('changePassword throws error with wrong password', async () => {
    bcrypt.compare.mockResolvedValue(false);
    User.findByPk.mockResolvedValue({ password: 'old' });

    await expect(
      userService.changePassword(1, 'zle', 'nowe')
    ).rejects.toThrow("Wrong current password");
  });

  test('updateUser correctly updates data', async () => {
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

  test('deleteUser deletes user and sends socket event', async () => {
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

  test('getStats returns statistics', async () => {
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

  test('changeEmail works correctly', async () => {
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

  test('changeUserRole changes the role and sends a socket', async () => {
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

  test('banUser sets a ban and sends an event', async () => {
    const userMock = { save: jest.fn() };
    User.findByPk.mockResolvedValue(userMock);

    const socket = "socket123";
    userSockets.set(1, socket);

    await userService.banUser(1, 1);

    expect(userMock.is_banned).toBe(true);
    expect(__mockTo).toHaveBeenCalledWith(socket);
    expect(__mockEmit).toHaveBeenCalled();
  });

  test('unbanUser works correctly', async () => {
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
