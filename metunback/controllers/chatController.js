// controllers/chatController.js
const { Message, UserMatch, Profile } = require('../models');
const { Op } = require('sequelize');

// Pobranie wiadomości dla danego matcha
exports.getMessages = async (req, res) => {
  const userId = req.user.userId;
  const { matchId } = req.params;

  try {
    // Sprawdzenie czy user jest uczestnikiem matcha
    const match = await UserMatch.findOne({
      where: {
        match_id: matchId,
        match_active: true,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }]
      }
    });

    if (!match) return res.status(403).json({ error: "Access denied" });

    const messages = await Message.findAll({
      where: { match_id: matchId },
      order: [['timestamp', 'ASC']]
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ Błąd getMessages:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Lista czatów (czyli aktywne matche użytkownika)
exports.getUserChats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const matches = await UserMatch.findAll({
      where: {
        match_active: true,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }]
      },
      include: [
        {
          model: Profile,
          as: 'user1',
          attributes: ['user_id', 'name', 'profile_picture']
        },
        {
          model: Profile,
          as: 'user2',
          attributes: ['user_id', 'name', 'profile_picture']
        }
      ]
    });

    const chats = matches.map(m => {
      const otherUser =
        m.user_id_1 === userId ? m.user2 : m.user1;

      return {
        id: m.match_id,
        name: otherUser.name,
        profile_picture: otherUser.profile_picture,
        user_id: otherUser.user_id
      };
    });

    res.json(chats);
  } catch (err) {
    console.error("❌ Błąd getUserChats:", err);
    res.status(500).json({ error: "Server error" });
  }
};
