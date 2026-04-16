const GroupMemberService = require('../../services/groupMemberService');
const { GroupMember, User, Profile, Group } = require('../../models');

jest.mock('../models', () => ({
  GroupMember: {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  User: jest.fn(),
  Profile: jest.fn(),
  Group: {
    findByPk: jest.fn()
  }
}));

describe('GroupMemberService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getMembersByGroup returns group members', async () => {
    const mockMembers = [{ user_id: 1 }];
    GroupMember.findAll.mockResolvedValue(mockMembers);

    const result = await GroupMemberService.getMembersByGroup(1);
    expect(GroupMember.findAll).toHaveBeenCalledWith({
      where: { group_id: 1 },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'email'],
          include: [
            {
              model: Profile,
              as: 'userProfile',
              attributes: ['profile_id', 'name', 'profile_picture']
            }
          ]
        }
      ]
    });
    expect(result).toEqual(mockMembers);
  });

  test('addMember adds a member to the group', async () => {
    const mockMember = { user_id: 2 };
    GroupMember.create.mockResolvedValue(mockMember);

    const result = await GroupMemberService.addMember(1, { user_id: 2, role: 'member' });
    expect(GroupMember.create).toHaveBeenCalledWith({
      group_id: 1,
      user_id: 2,
      role: 'member',
      join_date: undefined
    });
    expect(result).toEqual(mockMember);
  });

  test('updateMember updates member role', async () => {
    const mockMember = { update: jest.fn().mockResolvedValue({ role: 'admin' }) };
    GroupMember.findOne.mockResolvedValue(mockMember);

    const result = await GroupMemberService.updateMember(1, 2, 'admin');
    expect(GroupMember.findOne).toHaveBeenCalledWith({ where: { group_id: 1, user_id: 2 } });
    expect(mockMember.update).toHaveBeenCalledWith({ role: 'admin' });
    expect(result).toEqual({ role: 'admin' });
  });

  test('updateMember throws an error if member does not exist', async () => {
    GroupMember.findOne.mockResolvedValue(null);
    await expect(
      GroupMemberService.updateMember(1, 2, 'admin')
    ).rejects.toThrow('Group member not found');
  });

  test('removeMember removes a member from the group', async () => {
    const mockMember = { destroy: jest.fn().mockResolvedValue(true) };
    GroupMember.findOne.mockResolvedValue(mockMember);

    const result = await GroupMemberService.removeMember(1, 2);
    expect(GroupMember.findOne).toHaveBeenCalledWith({ where: { group_id: 1, user_id: 2 } });
    expect(mockMember.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('removeMember throws an error if member does not exist', async () => {
    GroupMember.findOne.mockResolvedValue(null);
    await expect(
      GroupMemberService.removeMember(1, 2)
    ).rejects.toThrow('Group member not found');
  });

  test('leaveGroup removes a member from the group', async () => {
    const mockMember = { destroy: jest.fn().mockResolvedValue(true) };
    Group.findByPk.mockResolvedValue({ creator_user_id: 2 });
    GroupMember.findOne.mockResolvedValue(mockMember);

    const result = await GroupMemberService.leaveGroup(1, 3);
    expect(Group.findByPk).toHaveBeenCalledWith(1);
    expect(GroupMember.findOne).toHaveBeenCalledWith({ where: { group_id: 1, user_id: 3 } });
    expect(mockMember.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('leaveGroup throws an error if group does not exist', async () => {
    Group.findByPk.mockResolvedValue(null);
    await expect(
      GroupMemberService.leaveGroup(1, 1)
    ).rejects.toThrow('Grupa nie istnieje');
  });

  test('leaveGroup throws an error if user is the group creator', async () => {
    Group.findByPk.mockResolvedValue({ creator_user_id: 1 });
    await expect(
      GroupMemberService.leaveGroup(1, 1)
    ).rejects.toThrow('Nie możesz opuścić grupy, którą sam założyłeś');
  });

  test('leaveGroup throws an error if user is not a group member', async () => {
    Group.findByPk.mockResolvedValue({ creator_user_id: 2 });
    GroupMember.findOne.mockResolvedValue(null);
    await expect(
      GroupMemberService.leaveGroup(1, 3)
    ).rejects.toThrow('Nie należysz do tej grupy');
  });
});
