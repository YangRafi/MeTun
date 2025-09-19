const Group = require('../models/Group');

// GET all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll();
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
