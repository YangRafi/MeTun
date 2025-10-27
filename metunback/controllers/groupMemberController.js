const GroupMember = require('../models/GroupMember');
const User = require('../models/User');
const Profile = require('../models/Profile');

// GET all members of a group with profile info
exports.getMembersByGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const members = await GroupMember.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'surname', 'email'], // <-- zostaw tylko kolumny które istnieją
          include: [
            {
              model: Profile,
              attributes: ['profile_id', 'name', 'profile_picture'] // usuń 'surname'
            }
          ]
        }
      ]
    });
    res.json(members);
  } catch (e) {
    console.error("❌ Error fetching group members:", e);
    res.status(500).json({ error: "Błąd serwera" });
  }
};

// ADD member to group
exports.addMember = async (req, res) => {
  try {
    const { user_id, role, join_date } = req.body;

    const newMember = await GroupMember.create({
      group_id: req.params.groupId,
      user_id,
      role,
      join_date: join_date || undefined
    });

    res.status(201).json(newMember);
  } catch (err) {
    console.error("❌ Error adding member:", err);
    res.status(500).json({ error: "Server error while adding member" });
  }
};

// UPDATE member role
exports.updateMember = async (req, res) => {
  try {
    const { role } = req.body;
    const member = await GroupMember.findOne({
      where: { group_id: req.params.groupId, user_id: req.params.userId }
    });

    if (!member) {
      return res.status(404).json({ error: "Group member not found" });
    }

    await member.update({ role });
    res.json(member);
  } catch (err) {
    console.error("❌ Error updating member:", err);
    res.status(500).json({ error: "Server error while updating member" });
  }
};

// REMOVE member from group
exports.removeMember = async (req, res) => {
  try {
    const member = await GroupMember.findOne({
      where: { group_id: req.params.groupId, user_id: req.params.userId }
    });

    if (!member) {
      return res.status(404).json({ error: "Group member not found" });
    }

    await member.destroy();
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("❌ Error removing member:", err);
    res.status(500).json({ error: "Server error while removing member" });
  }
};
