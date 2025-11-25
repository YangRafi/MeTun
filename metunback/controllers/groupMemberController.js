const groupMemberService = require('../services/groupMemberService');

exports.getMembersByGroup = async (req, res) => {
  try {
    const members = await groupMemberService.getMembersByGroup(req.params.groupId);
    res.json(members);
  } catch (err) {
    console.error("❌ Error fetching group members:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const newMember = await groupMemberService.addMember(req.params.groupId, req.body);
    res.status(201).json(newMember);
  } catch (err) {
    console.error("❌ Error adding member:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {

    const { groupId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const updated = await groupMemberService.updateMember(req.params.groupId, req.params.userId, req.body.role);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating member:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    await groupMemberService.removeMember(req.params.groupId, req.params.userId);
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("❌ Error removing member:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    await groupMemberService.leaveGroup(req.params.groupId, req.user.userId);
    res.json({ message: "Pomyślnie opuściłeś grupę." });
  } catch (err) {
    console.error("❌ Error leaving group:", err);
    res.status(500).json({ error: err.message });
  }
};
