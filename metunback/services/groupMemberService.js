const { GroupMember, User, Profile, Group } = require('../models');

class GroupMemberService {
  // GET all members of a group with profile info
  async getMembersByGroup(groupId) {
    return GroupMember.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'surname', 'email'],
          include: [
            {
              model: Profile,
              attributes: ['profile_id', 'name', 'profile_picture']
            }
          ]
        }
      ]
    });
  }

  // ADD member to group
  async addMember(groupId, { user_id, role, join_date }) {
    return GroupMember.create({
      group_id: groupId,
      user_id,
      role,
      join_date: join_date || undefined
    });
  }

  // UPDATE member role
  async updateMember(groupId, userId, role) {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId }
    });

    if (!member) throw new Error("Group member not found");

    return member.update({ role });
  }

  // REMOVE member from group
  async removeMember(groupId, userId) {
    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId }
    });

    if (!member) throw new Error("Group member not found");

    await member.destroy();
    return true;
  }

  // LEAVE group
  async leaveGroup(groupId, userId) {
    const group = await Group.findByPk(groupId);
    if (!group) throw new Error("Grupa nie istnieje");

    if (group.creator_user_id === userId) {
      throw new Error("Nie możesz opuścić grupy, którą sam założyłeś");
    }

    const member = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId }
    });

    if (!member) throw new Error("Nie należysz do tej grupy");

    await member.destroy();
    return true;
  }
}

module.exports = new GroupMemberService();
