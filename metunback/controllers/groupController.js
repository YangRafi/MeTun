const { Op, Sequelize } = require("sequelize");
const { Group, Discipline, Faculty } = require("../models");

exports.getAllGroups = async (req, res) => {
  try {
    const { university_id, faculty_id, discipline_id } = req.query;

    const where = {};
    if (discipline_id) {
      where.discipline_id = discipline_id;
    } else if (faculty_id) {
      // wszystkie grupy w dyscyplinach danego wydziału
      const disciplines = await Discipline.findAll({ where: { faculty_id }, attributes: ['discipline_id'] });
      where.discipline_id = { [Op.in]: disciplines.map(d => d.discipline_id) };
    } else if (university_id) {
      // wszystkie grupy w dyscyplinach wydziałów danej uczelni
      const faculties = await Faculty.findAll({ where: { university_id }, attributes: ['faculty_id'] });
      const disciplines = await Discipline.findAll({
        where: { faculty_id: { [Op.in]: faculties.map(f => f.faculty_id) } },
        attributes: ['discipline_id']
      });
      where.discipline_id = { [Op.in]: disciplines.map(d => d.discipline_id) };
    }

    const groups = await Group.findAll({
      where,
      include: [
        { model: Discipline, as: 'discipline', attributes: ['name'] },
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
    const group = await Group.findByPk(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    console.error("❌ Error fetching group:", err);
    res.status(500).json({ error: "Server error while fetching group" });
  }
};

// CREATE new group
exports.createGroup = async (req, res) => {
  try {
    const { group_name, creator_user_id, discipline_id } = req.body;
    const newGroup = await Group.create({ group_name, creator_user_id, discipline_id });
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
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    const { group_name, creator_user_id, discipline_id } = req.body;
    await group.update({ group_name, creator_user_id, discipline_id });
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
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    await group.destroy();
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting group:", err);
    res.status(500).json({ error: "Server error while deleting group" });
  }
};
