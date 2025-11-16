const chatService = require('../services/chatService');

exports.getPrivateChats = async (req, res) => {
  try {
    const chats = await chatService.getPrivateChats(req.user.userId);
    res.json(chats);
  } catch (err) {
    console.error("❌ Błąd getPrivateChats:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupChats = async (req, res) => {
  try {
    const chats = await chatService.getGroupChats(req.user.userId);
    res.json(chats);
  } catch (err) {
    console.error("❌ Błąd getGroupChats:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.user.userId, req.params.chatType, req.params.chatId);
    res.json(messages);
  } catch (err) {
    console.error("❌ Błąd getMessages:", err);
    res.status(err.message === "Access denied" || err.message === "Invalid chat type" ? 403 : 500)
       .json({ error: err.message });
  }
};
