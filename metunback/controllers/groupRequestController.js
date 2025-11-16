const { User, GroupJoinRequest, GroupMember, Group, Profile } = require('../models');

// 🔹 Wysłanie prośby o dołączenie
exports.requestJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.body;

    const existingMember = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId }
    });
    if (existingMember)
      return res.status(400).json({ message: "Już jesteś członkiem tej grupy" });

    const existingRequest = await GroupJoinRequest.findOne({
      where: { group_id: groupId, user_id: userId, status: 'pending' }
    });
    if (existingRequest)
      return res.status(400).json({ message: "Prośba już wysłana" });

    const newReq = await GroupJoinRequest.create({
      group_id: groupId,
      sender_id: userId,
      user_id: userId,
      type: "request",
      status: "pending"
    });

    res.json(newReq);
  } catch (err) {
    console.error("❌ Błąd wysyłania prośby:", err);
    res.status(500).json({ error: "Nie udało się wysłać prośby" });
  }
};

// 🔹 Zaproszenie użytkownika do grupy
exports.inviteUser = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { groupId, userId } = req.body;

    const existing = await GroupJoinRequest.findOne({
      where: { group_id: groupId, user_id: userId, status: 'pending', type: 'invite' }
    });

    if (existing)
      return res.status(400).json({ message: "Użytkownik już został zaproszony" });

    const invite = await GroupJoinRequest.create({
      group_id: groupId,
      sender_id: senderId,   // ⬅️ Osoba zapraszająca
      user_id: userId,       // ⬅️ Osoba zaproszona
      type: "invite",
      status: "pending"
    });

    res.json(invite);
  } catch (err) {
    console.error("❌ Błąd zapraszania użytkownika:", err);
    res.status(500).json({ error: "Nie udało się wysłać zaproszenia" });
  }
};

// 🔹 Pobierz prośby o dołączenie (dla admina)
exports.getJoinRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await GroupJoinRequest.findAll({
      where: { status: 'pending' }, // ⬅️ to filtruje tylko pending
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'email'],
          include: [{
            model: Profile,
            as: 'userProfile',
            attributes: ['profile_id', 'name', 'bio', 'profile_picture']
          }]
        },
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'name', 'surname', 'email']
        },
        {
          model: Group,
          as: 'group',
          where: { creator_user_id: userId },
          attributes: ['group_id', 'group_name']
        }
      ]
    });

    res.json({ requests });
  } catch (err) {
    console.error("❌ Error fetching join requests:", err);
    res.status(500).json({ message: "Failed to fetch join requests" });
  }
};

// 🔹 Pobierz zaproszenia (dla konkretnej grupy)
exports.getGroupInvites = async (req, res) => {
  try {
    const { groupId } = req.params;

    const invites = await GroupJoinRequest.findAll({
      where: { group_id: groupId, type: 'invite', status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'surname'] },
        { model: User, as: 'sender', attributes: ['user_id', 'name', 'surname'] }
      ]
    });

    res.json({ invites });
  } catch (err) {
    console.error("❌ Błąd pobierania zaproszeń:", err);
    res.status(500).json({ error: "Nie udało się pobrać zaproszeń" });
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

// 🔹 Wszystkie dotyczące zalogowanego
exports.getPendingRequestsForUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await GroupJoinRequest.findAll({
      where: {
        user_id: userId,
        status: 'pending'
      },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'surname'] },
        { model: User, as: 'sender', attributes: ['user_id', 'name', 'surname'] },
        { model: Group, as: 'group', attributes: ['group_id', 'group_name'] }
      ]
    });

    res.json({ requests });
  } catch (err) {
    console.error("❌ Błąd pobierania requestów dla użytkownika:", err);
    res.status(500).json({ error: "Nie udało się pobrać requestów" });
  }
};

// 🔹 Usuń zaproszenie (invite)
exports.deleteInvite = async (req, res) => {
  try {
    const { requestId } = req.params;

    const invite = await GroupJoinRequest.findOne({
      where: { request_id: requestId, type: 'invite', status: 'pending' }
    });

    if (!invite) return res.status(404).json({ error: "Nie znaleziono zaproszenia" });

    await invite.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd usuwania zaproszenia:", err);
    res.status(500).json({ error: "Nie udało się usunąć zaproszenia" });
  }
};


