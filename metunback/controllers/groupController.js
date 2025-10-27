const { Op } = require("sequelize");
const { Group, Discipline, Faculty, UserUniversity, GroupMember } = require("../models");

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
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    await group.destroy();
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting group:", err);
    res.status(500).json({ error: "Server error while deleting group" });
  }
};
