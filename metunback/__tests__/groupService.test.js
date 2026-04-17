const groupService = require('../services/groupService');
const { Group, User, Discipline, Faculty, UserUniversity, GroupMember } = require('../models');
const { Op } = require('sequelize');

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
    findByPk: jest.fn()
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

  test('getAllGroups returns empty array when no groups exist', async () => {
    Group.findAll.mockResolvedValue([]);
    const result = await groupService.getAllGroups();
    expect(result).toEqual([]);
    expect(Group.findAll).toHaveBeenCalled();
  });

  test('getAllGroups filters by discipline_id', async () => {
    Group.findAll.mockResolvedValue([{ group_id: 1 }]);
    const result = await groupService.getAllGroups({ discipline_id: 2 });
    expect(result).toEqual([{ group_id: 1 }]);
    expect(Group.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { discipline_id: 2 }
    }));
  });

  test('getGroupsByCreator returns groups created by the user', async () => {
    Group.findAll.mockResolvedValue([{ group_id: 1 }]);
    const result = await groupService.getGroupsByCreator(1);
    expect(result).toEqual([{ group_id: 1 }]);
    expect(Group.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { creator_user_id: 1 }
    }));
  });

  test('getMyGroups returns groups of the user', async () => {
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

  test('getGroupById returns a group', async () => {
    const groupMock = { group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);

    const result = await groupService.getGroupById(1);
    expect(result).toEqual(groupMock);
  });

  test('getGroupById throws an error when group does not exist', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.getGroupById(1)).rejects.toThrow('Group not found');
  });

  test('createGroup creates a group', async () => {
    Group.count.mockResolvedValue(0);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' });
    UserUniversity.findOne.mockResolvedValue({});
    const newGroup = { group_id: 1 };
    Group.create.mockResolvedValue(newGroup);
    GroupMember.create.mockResolvedValue({});

    const result = await groupService.createGroup({
      group_name: 'Test',
      discipline_id: 1,
      creator_user_id: 1
    });

    expect(result).toEqual(newGroup);
    expect(Group.create).toHaveBeenCalledWith(
      expect.objectContaining({ group_name: 'Test' })
    );
  });

  test('createGroup throws an error if user already has 2 groups', async () => {
    Group.count.mockResolvedValue(2);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' });

    await expect(
      groupService.createGroup({ group_name: 'Test', discipline_id: 1, creator_user_id: 1 })
    ).rejects.toThrow('Możesz utworzyć maksymalnie 2 grupy');
  });

  test('createGroup throws an error if user has no approved discipline', async () => {
    Group.count.mockResolvedValue(0);
    User.findByPk.mockResolvedValue({ user_id: 1, role: 'student' });
    UserUniversity.findOne.mockResolvedValue(null);

    await expect(
      groupService.createGroup({ group_name: 'Test', discipline_id: 1, creator_user_id: 1 })
    ).rejects.toThrow('Nie możesz tworzyć grupy dla tego kierunku');
  });

  test('updateGroup updates a group', async () => {
    const groupMock = { update: jest.fn(), group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);

    const result = await groupService.updateGroup(1, { group_name: 'New' });
    expect(groupMock.update).toHaveBeenCalledWith({ group_name: 'New' });
    expect(result).toEqual(groupMock);
  });

  test('updateGroup throws an error when group does not exist', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.updateGroup(1, {})).rejects.toThrow('Group not found');
  });

  test('deleteGroup deletes a group', async () => {
    const groupMock = { creator_user_id: 1, group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);
    Group.destroy.mockResolvedValue(true);

    const result = await groupService.deleteGroup(1, 1);
    expect(result).toBe(true);
    expect(Group.destroy).toHaveBeenCalledWith({ where: { group_id: 1 } });
  });

  test('deleteGroup throws an error if group does not exist', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(groupService.deleteGroup(1, 1))
      .rejects.toThrow('Grupa nie istnieje');
  });

  test('deleteGroup throws an error if user is not the creator', async () => {
    const groupMock = { creator_user_id: 2, group_id: 1 };
    Group.findByPk.mockResolvedValue(groupMock);

    await expect(groupService.deleteGroup(1, 1))
      .rejects.toThrow('Nie masz uprawnień do usunięcia tej grupy');
  });
});
