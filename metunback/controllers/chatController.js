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
        user_id: otherUser.user_id,
        name: otherUser.name,
        profile_picture: otherUser.profile_picture || null,
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
        as: 'members',        // <-- tutaj alias zdefiniowany w relacjach
        where: { user_id: userId },
        attributes: ['user_id', 'name', 'surname', 'email'],
        through: { attributes: [] } // nie pobieramy kolumn z GroupMember
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
        name: g.group_name,
        profile_picture: g.profile_picture || null,
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
  const { chatType, chatId } = req.params;

  try {
    let messages;

    if (chatType === 'private') {
      const match = await UserMatch.findOne({
        where: { match_id: chatId, match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] },
        include: [
          { model: Profile, as: 'user1', attributes: ['user_id','profile_picture'] },
          { model: Profile, as: 'user2', attributes: ['user_id','profile_picture'] }
        ]
      });
      if (!match) return res.status(403).json({ error: "Access denied" });

      messages = await Message.findAll({
        where: { match_id: chatId },
        order: [['timestamp', 'ASC']]
      });

      messages = messages.map(m => {
        const senderProfile = m.sender_id === match.user_id_1 ? match.user1 : match.user2;
        return {
          message_id: m.message_id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          content: m.content,
          timestamp: m.timestamp,
          senderAvatar: senderProfile.profile_picture || null
        };
      });

    } else if (chatType === 'group') {
      const membership = await Group.findOne({
        where: { group_id: chatId },
        include: [{
          model: User,
          as: 'members',
          where: { user_id: userId },
          attributes: ['user_id'],
          through: { attributes: [] }
        }]
      });
      if (!membership) return res.status(403).json({ error: "Access denied" });

      messages = await Message.findAll({
        where: { group_id: chatId },
        order: [['timestamp', 'ASC']]
      });

      messages = await Promise.all(messages.map(async m => {
        const sender = await Profile.findOne({ where: { user_id: m.sender_id } });
        return {
          message_id: m.message_id,
          senderId: m.sender_id,
          receiverId: null,
          content: m.content,
          timestamp: m.timestamp,
          senderAvatar: sender?.profile_picture || null
        };
      }));

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
// exports.sendMessage = async (req, res) => {
//   const userId = req.user.userId;
//   const { chatType, chatId } = req.params;
//   const { content } = req.body;

//   try {
//     let message;

//     if (chatType === 'private') {
//       const match = await UserMatch.findOne({
//         where: { match_id: chatId, match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] }
//       });
//       if (!match) return res.status(403).json({ error: "Access denied" });

//       message = await Message.create({
//         match_id: chatId,
//         sender_id: userId,
//         content
//       });

//     } else if (chatType === 'group') {
//       const membership = await GroupMember.findOne({ where: { group_id: chatId, user_id: userId } });
//       if (!membership) return res.status(403).json({ error: "Access denied" });

//       message = await Message.create({
//         group_id: chatId,
//         sender_id: userId,
//         content
//       });

//     } else return res.status(400).json({ error: "Invalid chat type" });

//     res.json(message);

//   } catch (err) {
//     console.error("❌ Błąd sendMessage:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };