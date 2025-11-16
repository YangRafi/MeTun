const groupService = require('../services/groupService');

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await groupService.getAllGroups(req.query);
    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching groups:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupsByCreator = async (req, res) => {
  try {
    const groups = await groupService.getGroupsByCreator(req.user.userId);
    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching user's created groups:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await groupService.getMyGroups(req.user.userId);
    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching user's groups:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id);
    res.json(group);
  } catch (err) {
    console.error("❌ Error fetching group:", err);
    res.status(404).json({ error: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const newGroup = await groupService.createGroup({ 
      ...req.body, 
      creator_user_id: req.user.userId 
    });
    res.status(201).json(newGroup);
  } catch (err) {
    console.error("❌ Error creating group:", err);
    res.status(403).json({ error: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await groupService.updateGroup(req.params.id, req.body);
    res.json(group);
  } catch (err) {
    console.error("❌ Error updating group:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id, req.user.userId);
    res.json({ message: "Grupa została usunięta." });
  } catch (err) {
    console.error("❌ Błąd przy usuwaniu grupy:", err);
    res.status(403).json({ error: err.message });
  }
};
