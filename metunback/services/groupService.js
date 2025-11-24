const { Op } = require("sequelize");
const { Group, User, Discipline, Faculty, UserUniversity, GroupMember } = require("../models");

class GroupService {
  // GET all groups with optional filters
  async getAllGroups(filters = {}) {
    const { university_id, faculty_id, discipline_id } = filters;
    const where = {};

    if (discipline_id) {
      where.discipline_id = discipline_id;
    } else if (faculty_id) {
      const disciplines = await Discipline.findAll({
        where: { faculty_id },
        attributes: ['discipline_id']
      });
      where.discipline_id = { [Op.in]: disciplines.map(d => d.discipline_id) };
    } else if (university_id) {
      const faculties = await Faculty.findAll({
        where: { university_id },
        attributes: ['faculty_id']
      });
      const disciplines = await Discipline.findAll({
        where: { faculty_id: { [Op.in]: faculties.map(f => f.faculty_id) } },
        attributes: ['discipline_id']
      });
      where.discipline_id = { [Op.in]: disciplines.map(d => d.discipline_id) };
    }

    return Group.findAll({
      where,
      include: [{ model: Discipline, as: 'discipline', attributes: ['name'] }]
    });
  }

  // GET groups created by user
  async getGroupsByCreator(userId) {
    return Group.findAll({
      where: { creator_user_id: userId },
      include: [{ model: Discipline, as: 'discipline', attributes: ['name'] }]
    });
  }

  // GET groups where user is a member
  async getMyGroups(userId) {
    const groupMembers = await GroupMember.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Group,
          as: 'group',
          include: [
            { model: User, as: 'creator', attributes: ['user_id', 'name', 'surname', 'email'] },
            { model: Discipline, as: 'discipline', attributes: ['discipline_id', 'name'] },
            {
              model: GroupMember,
              as: 'groupMembers',
              include: [{ model: User, as: 'user', attributes: ['user_id', 'name', 'surname', 'email'] }]
            }
          ]
        }
      ]
    });

    return groupMembers.map(gm => {
      const group = gm.group.toJSON();
      group.role = gm.role || 'member';
      return group;
    });
  }

  // GET group by ID
  async getGroupById(groupId) {
    const group = await Group.findByPk(groupId, {
      include: [{ model: Discipline, as: 'discipline', attributes: ['name'] }]
    });
    if (!group) throw new Error("Group not found");
    return group;
  }

  // CREATE group with checks
  async createGroup({ group_name, discipline_id, creator_user_id }) {

    const user = await User.findByPk(creator_user_id);

    if (user.role !== 'admin'){
    const existingGroupsCount = await Group.count({ where: { creator_user_id } });
    if (existingGroupsCount >= 2) throw new Error("Możesz utworzyć maksymalnie 2 grupy");

    const approved = await UserUniversity.findOne({
      where: { user_id: creator_user_id, discipline_id, status: 'approved' }
    });
    if (!approved) throw new Error("Nie możesz tworzyć grupy dla tego kierunku");
}
const newGroup = await Group.create({ group_name, discipline_id, creator_user_id });

    await GroupMember.create({
      group_id: newGroup.group_id,
      user_id: creator_user_id,
      role: 'admin'
    });

    return newGroup;
  }

  // UPDATE group
  async updateGroup(groupId, data) {
    const group = await Group.findByPk(groupId);
    if (!group) throw new Error("Group not found");
    await group.update(data);
    return group;
  }

  // DELETE group
  async deleteGroup(groupId, userId) {
    const group = await Group.findByPk(groupId);
    if (!group) throw new Error("Grupa nie istnieje");
    if (group.creator_user_id !== userId) throw new Error("Nie masz uprawnień do usunięcia tej grupy");

    await Group.destroy({ where: { group_id: groupId } });
    return true;
  }
}

module.exports = new GroupService();
