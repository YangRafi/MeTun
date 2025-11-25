const { User, GroupJoinRequest, GroupMember, Group, Profile } = require('../models');

class GroupRequestService {
    async getAllRequests() {
      return GroupJoinRequest.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id', 'name', 'surname', 'email'],
            include: [{ model: Profile, as: 'userProfile', attributes: ['profile_id', 'name', 'bio', 'profile_picture'] }]
          },
          {
            model: User,
            as: 'sender',
            attributes: ['user_id', 'name', 'surname', 'email']
          },
          {
            model: Group,
            as: 'group',
            attributes: ['group_id', 'group_name', 'creator_user_id']
          }
        ],
        order: [['created_at', 'DESC']]
      });
    }

  // 🔹 Wysłanie prośby o dołączenie
  async requestJoin(userId, groupId) {
    const existingMember = await GroupMember.findOne({
      where: { group_id: groupId, user_id: userId }
    });
    if (existingMember) throw new Error("Już jesteś członkiem tej grupy");

    const existingRequest = await GroupJoinRequest.findOne({
      where: { group_id: groupId, user_id: userId }
    });
    if (existingRequest) throw new Error("Prośba już wysłana, bądź też została odrzucona.");

    const newReq = await GroupJoinRequest.create({
      group_id: groupId,
      sender_id: userId,
      user_id: userId,
      type: "request",
      status: "pending"
    });

    return newReq;
  }

  // 🔹 Zaproszenie użytkownika
  async inviteUser(senderId, groupId, userId) {
    const existing = await GroupJoinRequest.findOne({
      where: { group_id: groupId, user_id: userId, status: 'pending', type: 'invite' }
    });
    if (existing) throw new Error("Użytkownik już został zaproszony");

    const invite = await GroupJoinRequest.create({
      group_id: groupId,
      sender_id: senderId,
      user_id: userId,
      type: "invite",
      status: "pending"
    });

    return invite;
  }

  // 🔹 Pobranie prośb o dołączenie (dla admina)
  async getJoinRequests(adminId) {
    return GroupJoinRequest.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'surname', 'email'],
          include: [{ model: Profile, as: 'userProfile', attributes: ['profile_id', 'name', 'bio', 'profile_picture'] }]
        },
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'name', 'surname', 'email']
        },
        {
          model: Group,
          as: 'group',
          where: { creator_user_id: adminId },
          attributes: ['group_id', 'group_name']
        }
      ]
    });
  }

  // 🔹 Pobranie zaproszeń dla konkretnej grupy
  async getGroupInvites(groupId) {
    return GroupJoinRequest.findAll({
      where: { group_id: groupId, type: 'invite', status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'surname'] },
        { model: User, as: 'sender', attributes: ['user_id', 'name', 'surname'] }
      ]
    });
  }

  // 🔹 Akceptacja / odrzucenie
  async respondToRequest(requestId, action) {
    const request = await GroupJoinRequest.findByPk(requestId);
    if (!request) throw new Error("Nie znaleziono prośby");

    // 🔹 jeśli request jest już zaakceptowany, nie pozwalamy go zmienić
    if (request.status === 'accepted') {
      throw new Error("Request został już zaakceptowany i nie może być zmieniony");
    }

    if (action === 'accept') {
      await GroupMember.create({ group_id: request.group_id, user_id: request.user_id });
      request.status = 'accepted';
    } else if (action === 'rejected') {
      request.status = 'rejected';
    } else {
      throw new Error("Nieprawidłowa akcja");
    }

    await request.save();
    return true;
  }


  // 🔹 Pobranie wszystkich requestów dla zalogowanego użytkownika
  async getPendingRequestsForUser(userId) {
    return GroupJoinRequest.findAll({
      where: { user_id: userId, status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'surname'] },
        { model: User, as: 'sender', attributes: ['user_id', 'name', 'surname'] },
        { model: Group, as: 'group', attributes: ['group_id', 'group_name'] }
      ]
    });
  }

  // 🔹 Usuwanie zaproszenia
  async deleteInvite(requestId) {
    const invite = await GroupJoinRequest.findOne({
      where: { request_id: requestId, type: 'invite', status: 'pending' }
    });
    if (!invite) throw new Error("Nie znaleziono zaproszenia");

    await invite.destroy();
    return true;
  }

  // 🔹 Usuwanie prośby o dołączenie (request)
  async deleteRequest(requestId, userId, isAdmin) {
    const req = await GroupJoinRequest.findOne({
      where: { request_id: requestId, type: 'request' }
    });

    if (!req) throw new Error("Nie znaleziono prośby");

    // tylko autor może usunąć swoją prośbę
    if (req.user_id !== userId && !isAdmin) throw new Error("Brak uprawnień");

    await req.destroy();
    return true;
  }
}

module.exports = new GroupRequestService();
