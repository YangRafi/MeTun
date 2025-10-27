const { GroupJoinRequest, GroupMember, Group, Profile } = require('../models');

// 🔹 Wysłanie prośby o dołączenie
exports.requestJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.body;

    const existingMember = await GroupMember.findOne({ where: { group_id: groupId, user_id: userId } });
    if (existingMember) return res.status(400).json({ message: "Już jesteś członkiem tej grupy" });

    const existingRequest = await GroupJoinRequest.findOne({ where: { group_id: groupId, user_id: userId, status: 'pending' } });
    if (existingRequest) return res.status(400).json({ message: "Prośba już wysłana" });

    const newReq = await GroupJoinRequest.create({ group_id: groupId, user_id: userId });
    res.json(newReq);
  } catch (err) {
    console.error("❌ Błąd wysyłania prośby:", err);
    res.status(500).json({ error: "Nie udało się wysłać prośby" });
  }
};

// 🔹 Pobierz prośby o dołączenie (dla admina)
exports.getJoinRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const adminGroups = await Group.findAll({ where: { creator_user_id: userId } });
    const adminGroupIds = adminGroups.map(g => g.group_id);

    const requests = await GroupJoinRequest.findAll({
      where: { group_id: adminGroupIds, status: 'pending' },
      include: [
        { model: Group, as: 'group', attributes: ['group_name'] },
        { model: Profile, as: 'user', attributes: ['name', 'surname', 'profile_picture'] }
      ]
    });

    res.json(requests);
  } catch (err) {
    console.error("❌ Błąd pobierania próśb:", err);
    res.status(500).json({ error: "Nie udało się pobrać próśb" });
  }
};

// 🔹 Akceptacja / odrzucenie prośby
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action = 'accept' | 'reject'
    const request = await GroupJoinRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: "Nie znaleziono prośby" });

    if (action === 'accept') {
      await GroupMember.create({ group_id: request.group_id, user_id: request.user_id });
      request.status = 'accepted';
    } else {
      request.status = 'rejected';
    }

    await request.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd akceptacji prośby:", err);
    res.status(500).json({ error: "Nie udało się zaktualizować prośby" });
  }
};
