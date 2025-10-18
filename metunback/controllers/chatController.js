const { User, UserMatch, Profile, Message, Group, GroupMember } = require('../models');
const { Op } = require('sequelize');

// 🔹 Prywatne czaty
exports.getPrivateChats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const matches = await UserMatch.findAll({
      where: { match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] },
      include: [
        { model: Profile, as: 'user1', attributes: ['user_id','name','profile_picture'] },
        { model: Profile, as: 'user2', attributes: ['user_id','name','profile_picture'] }
      ]
    });

    const chats = await Promise.all(matches.map(async m => {
      const otherUser = m.user_id_1 === userId ? m.user2 : m.user1;

      const lastMessage = await Message.findOne({
        where: { match_id: m.match_id },
        order: [['timestamp','DESC']]
      });

      return {
        id: m.match_id,
        type: 'private',
        name: otherUser.name,
        profile_picture: otherUser.profile_picture,
        lastMessage: lastMessage?.content || '',
        lastMessageTimestamp: lastMessage?.timestamp || null
      };
    }));

    chats.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    res.json(chats);

  } catch(err) {
    console.error("❌ Błąd getPrivateChats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Grupowe czaty
exports.getGroupChats = async (req,res) => {
  const userId = req.user.userId;

  try {
    const groups = await Group.findAll({
      include: [{
        model: User,
        as: 'members',
        where: { user_id: userId },
        attributes: []
      }]
    });

    const chats = await Promise.all(groups.map(async g => {
      const lastMessage = await Message.findOne({
        where: { group_id: g.group_id },
        order: [['timestamp','DESC']]
      });

      return {
        id: g.group_id,
        type: 'group',
        name: g.name,
        profile_picture: null,
        lastMessage: lastMessage?.content || '',
        lastMessageTimestamp: lastMessage?.timestamp || null
      };
    }));

    chats.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    res.json(chats);

  } catch(err) {
    console.error("❌ Błąd getGroupChats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Pobieranie wiadomości
exports.getMessages = async (req, res) => {
  const userId = req.user.userId;
  const { chatType, chatId } = req.params; // 'private' lub 'group' + id z URL
  const { matchId, groupId } = req.body;   // opcjonalnie z body

  try {
    let messages;

    if (chatType === 'private') {
      const realMatchId = matchId || chatId;

      const match = await UserMatch.findOne({
        where: { match_id: realMatchId, match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] }
      });
      if (!match) return res.status(403).json({ error: "Access denied" });

      messages = await Message.findAll({
        where: { match_id: realMatchId },
        order: [['timestamp', 'ASC']]
      });

    } else if (chatType === 'group') {
      const realGroupId = groupId || chatId;

      const membership = await GroupMember.findOne({
        where: { group_id: realGroupId, user_id: userId }
      });
      if (!membership) return res.status(403).json({ error: "Access denied" });

      messages = await Message.findAll({
        where: { group_id: realGroupId },
        order: [['timestamp', 'ASC']]
      });

    } else {
      return res.status(400).json({ error: "Invalid chat type" });
    }

    res.json(messages);

  } catch (err) {
    console.error("❌ Błąd getMessages:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// 🔹 Wysyłanie wiadomości
exports.sendMessage = async (req, res) => {
  const userId = req.user.userId;
  const { chatType, chatId } = req.params; // 'private' lub 'group' + id matcha/grupy
  const { content, matchId, groupId } = req.body; // pobieramy z body

  try {
    let message;

    if (chatType === 'private') {
      // jeśli matchId jest w body, używamy go, inaczej chatId z URL
      const realMatchId = matchId || chatId;

      const match = await UserMatch.findOne({
        where: { match_id: realMatchId, match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] }
      });
      if (!match) return res.status(403).json({ error: "Access denied" });

      message = await Message.create({
        match_id: realMatchId,
        sender_id: userId,
        content
      });

    } else if (chatType === 'group') {
      const realGroupId = groupId || chatId;

      const membership = await GroupMember.findOne({
        where: { group_id: realGroupId, user_id: userId }
      });
      if (!membership) return res.status(403).json({ error: "Access denied" });

      message = await Message.create({
        group_id: realGroupId,
        sender_id: userId,
        content
      });

    } else return res.status(400).json({ error: "Invalid chat type" });

    res.json(message);

  } catch (err) {
    console.error("❌ Błąd sendMessage:", err);
    res.status(500).json({ error: "Server error" });
  }
};

