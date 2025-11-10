const { Op } = require("sequelize");
const { Group, User, Discipline, Faculty, UserUniversity, GroupMember } = require("../models");

// GET all groups with optional filters
exports.getAllGroups = async (req, res) => {
  try {
    const { university_id, faculty_id, discipline_id } = req.query;

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

    const groups = await Group.findAll({
      where,
      include: [
        { model: Discipline, as: 'discipline', attributes: ['name'] }
      ]
    });

    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching groups:", err);
    res.status(500).json({ error: "Server error while fetching groups" });
  }
};

// GET groups created by current user
exports.getGroupsByCreator = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await Group.findAll({
      where: { creator_user_id: userId },
      include: [
        { model: Discipline, as: 'discipline', attributes: ['name'] }
      ]
    });

    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching user's created groups:", err);
    res.status(500).json({ error: "Server error while fetching created groups" });
  }
};

// GET groups where current user is a member
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

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

    // Wyrzucamy same grupy (nie GroupMember)
    const myGroups = groupMembers.map(gm => {
      const group = gm.group.toJSON();
      // Opcjonalnie dodajemy rolę aktualnego użytkownika
      const memberData = gm.toJSON();
      group.role = memberData.role || 'member';
      return group;
    });

    res.json(myGroups); // ← zwracamy od razu tablicę
  } catch (err) {
    console.error("❌ Error fetching user's groups:", err);
    res.status(500).json({ message: "Failed to fetch user groups", error: err.message });
  }
};

// GET group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{ model: Discipline, as: 'discipline', attributes: ['name'] }]
    });
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("❌ Error fetching group:", err);
    res.status(500).json({ error: "Server error while fetching group" });
  }
};

// CREATE new group with approved UserUniversity check
exports.createGroup = async (req, res) => {
  try {
    const { group_name, discipline_id } = req.body;
    const creator_user_id = req.user.userId; // zakładamy auth middleware

    // Sprawdź, czy user ma approved UserUniversity dla wybranego discipline
    const approved = await UserUniversity.findOne({
      where: {
        user_id: creator_user_id,
        discipline_id,
        status: 'approved'
      }
    });

    if (!approved) {
      return res.status(403).json({ error: "Nie możesz tworzyć grupy dla tego kierunku" });
    }

    // Utwórz grupę
    const newGroup = await Group.create({ group_name, creator_user_id, discipline_id });

    // Dodaj twórcę grupy jako GroupMember z rolą admin
    await GroupMember.create({
      group_id: newGroup.group_id,
      user_id: creator_user_id,
      role: 'admin'
    });

    res.status(201).json(newGroup);
  } catch (err) {
    console.error("❌ Error creating group:", err);
    res.status(500).json({ error: "Server error while creating group" });
  }
};

// UPDATE group
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const { group_name, discipline_id } = req.body;

    // opcjonalnie możesz też walidować update pod kątem approved status użytkownika
    await group.update({ group_name, discipline_id });
    res.json(group);
  } catch (err) {
    console.error("❌ Error updating group:", err);
    res.status(500).json({ error: "Server error while updating group" });
  }
};

// DELETE group
exports.deleteGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id; // <-- zmienione z req.params.groupId

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Grupa nie istnieje." });
    }

    if (group.creator_user_id !== userId) {
      return res.status(403).json({ error: "Nie masz uprawnień do usunięcia tej grupy." });
    }

    await Group.destroy({ where: { group_id: groupId } });
    res.json({ message: "Grupa została usunięta." });
  } catch (err) {
    console.error("❌ Błąd przy usuwaniu grupy:", err);
    res.status(500).json({ error: "Błąd serwera podczas usuwania grupy." });
  }
};