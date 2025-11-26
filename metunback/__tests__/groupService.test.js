const groupService = require('../services/groupService');
const { Group, User, Discipline, Faculty, UserUniversity, GroupMember } = require('../models');
const { Op } = require('sequelize');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models', () => ({
  Group: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  GroupMember: {
    findAll: jest.fn(),
    create: jest.fn()
  },
  User: {
    findByPk: jest.fn() // <- poprawione
  },
  Discipline: jest.fn(),
  Faculty: jest.fn(),
  UserUniversity: {
    findOne: jest.fn()
  }
}));

describe('GroupService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // getAllGroups
  // --------------------------
  test('getAllGroups zwraca puste gdy brak grup', async () => {
    Group.findAll.mockResolvedValue([]);
    const result = await groupService.getAllGroups();
    expect(result).toEqual([]);
    expect(Group.findAll).toHaveBeenCalled();
  });

  test('getAllGroups filtruje po discipline_id', async () => {
    Group.findAll.mockResolvedValue([{ group_id: 1 }]);
    const result = await groupService.getAllGroups({ discipline_id: 2 });
    expect(result).toEqual([{ group_id: 1 }]);
    expect(Group.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { discipline_id: 2 }
    }));
  });

  // --------------------------
  // getGroupsByCreator
  // --------------------------
  test('getGroupsByCreator zwraca grupy dla twórcy', async () => {
    Group.findAll.mockResolvedValue([{ group_id: 1 }]);
    const result = await groupService.getGroupsByCreator(1);
    expect(result).toEqual([{ group_id: 1 }]);
    expect(Group.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { creator_user_id: 1 }
    }));
  });

  // --------------------------
  // getMyGroups
  // --------------------------
  test('getMyGroups zwraca grupy użytkownika', async () => {
    const gmMock = {
      group: {
        toJSON: () => ({ group_id: 1 }),
      },
      role: 'member'
    };
    GroupMember.findAll.mockResolvedValue([gmMock]);
    const result = await groupService.getMyGroups(1);
    expect(result).toEqual([{ group_id: 1, role: 'member' }]);
  });

  // --------------------------
  // getGroupById
  // --------------------------
  test('getGroupById zwraca grupę', async () => {
    const groupMock = { group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);
    const result = await groupService.getGroupById(1);
    expect(result).toEqual(groupMock);
  });

  test('getGroupById rzuca błąd gdy brak grupy', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.getGroupById(1)).rejects.toThrow('Group not found');
  });

  // --------------------------
  // createGroup
  // --------------------------
  test('createGroup tworzy grupę', async () => {
    Group.count.mockResolvedValue(0);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' }); // <- mock użytkownika
    UserUniversity.findOne.mockResolvedValue({});
    const newGroup = { group_id: 1 };
    Group.create.mockResolvedValue(newGroup);
    GroupMember.create.mockResolvedValue({});

    const result = await groupService.createGroup({ group_name: 'Test', discipline_id: 1, creator_user_id: 1 });
    expect(result).toEqual(newGroup);
    expect(Group.create).toHaveBeenCalledWith(expect.objectContaining({ group_name: 'Test' }));
  });

  test('createGroup rzuca błąd jeśli użytkownik ma 2 grupy', async () => {
    Group.count.mockResolvedValue(2);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' });
    await expect(groupService.createGroup({ group_name: 'Test', discipline_id: 1, creator_user_id: 1 }))
      .rejects.toThrow('Możesz utworzyć maksymalnie 2 grupy');
  });

  test('createGroup rzuca błąd jeśli brak zatwierdzonego kierunku', async () => {
    Group.count.mockResolvedValue(0);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' });
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(groupService.createGroup({ group_name: 'Test', discipline_id: 1, creator_user_id: 1 }))
      .rejects.toThrow('Nie możesz tworzyć grupy dla tego kierunku');
  });

  // --------------------------
  // updateGroup
  // --------------------------
  test('updateGroup aktualizuje grupę', async () => {
    const groupMock = { update: jest.fn(), group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);
    const result = await groupService.updateGroup(1, { group_name: 'New' });
    expect(groupMock.update).toHaveBeenCalledWith({ group_name: 'New' });
    expect(result).toEqual(groupMock);
  });

  test('updateGroup rzuca błąd gdy brak grupy', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.updateGroup(1, {})).rejects.toThrow('Group not found');
  });

  // --------------------------
  // deleteGroup
  // --------------------------
  test('deleteGroup usuwa grupę', async () => {
    const groupMock = { creator_user_id: 1, group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);
    Group.destroy.mockResolvedValue(true);

    const result = await groupService.deleteGroup(1, 1);
    expect(result).toBe(true);
    expect(Group.destroy).toHaveBeenCalledWith({ where: { group_id: 1 } });
  });

  test('deleteGroup rzuca błąd jeśli brak grupy', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.deleteGroup(1, 1)).rejects.toThrow('Grupa nie istnieje');
  });

  test('deleteGroup rzuca błąd jeśli użytkownik nie jest twórcą', async () => {
    const groupMock = { creator_user_id: 2, group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);
    await expect(groupService.deleteGroup(1, 1)).rejects.toThrow('Nie masz uprawnień do usunięcia tej grupy');
  });
});
