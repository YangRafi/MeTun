const { User, GroupJoinRequest, GroupMember, Group, Profile } = require('../models');

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
    const userId = req.user.userId; // <-- małe 'u'

    // Pobieramy grupy, które stworzył użytkownik
    const requests = await GroupJoinRequest.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'email'],
          include: [
            {
              model: Profile,
              as: 'userProfile', // <-- zgodnie z aliasem w modelach
              attributes: ['profile_id', 'name', 'bio', 'profile_picture']
            }
          ]
        },
        {
          model: Group,
          as: 'group',
          where: { creator_user_id: userId }, // <-- tu userId jest już poprawnie przekazane
          attributes: ['group_id', 'group_name']
        }
      ]
    });

    res.json({ requests });
  } catch (err) {
    console.error('❌ Error fetching join requests:', err);
    res.status(500).json({ message: 'Failed to fetch join requests', error: err.message });
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
