const { UserMatch, Profile, Message, Group, User } = require('../models');
const { Op } = require('sequelize');

class ChatService {
  // Pobranie prywatnych czatów
  async getPrivateChats(userId) {
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

    return chats.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
  }

  // Pobranie czatów grupowych
  async getGroupChats(userId) {
    const groups = await Group.findAll({
      include: [{
        model: User,
        as: 'members',
        where: { user_id: userId },
        attributes: ['user_id', 'name', 'surname', 'email'],
        through: { attributes: [] }
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

    return chats.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
  }

  // Pobranie wiadomości
  async getMessages(userId, chatType, chatId) {
    if (chatType === 'private') {
      const match = await UserMatch.findOne({
        where: { match_id: chatId, match_active: true, [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }] },
        include: [
          { model: Profile, as: 'user1', attributes: ['user_id','profile_picture'] },
          { model: Profile, as: 'user2', attributes: ['user_id','profile_picture'] }
        ]
      });
      if (!match) throw new Error("Access denied");

      const messages = await Message.findAll({
        where: { match_id: chatId },
        order: [['timestamp', 'ASC']]
      });

      return messages.map(m => {
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
      if (!membership) throw new Error("Access denied");

      const messages = await Message.findAll({
        where: { group_id: chatId },
        order: [['timestamp', 'ASC']]
      });

      return Promise.all(messages.map(async m => {
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
      throw new Error("Invalid chat type");
    }
  }
}

module.exports = new ChatService();