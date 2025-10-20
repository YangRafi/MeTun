const { Server } = require('socket.io');
const { Message, Profile } = require('../models');

const userSockets = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Użytkownik połączony:', socket.id);

    // 🔹 Rejestracja użytkownika
    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`✅ Zarejestrowano użytkownika ${userId}`);
    });

    // 🔹 Wysyłanie wiadomości
    socket.on('send_message', async (data) => {
      const { matchId, senderId, receiverId, content } = data;
      try {
        // Zapis wiadomości
        const msg = await Message.create({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          timestamp: new Date()
        });

        // Pobranie danych nadawcy
        const senderProfile = await Profile.findOne({
          where: { user_id: senderId },
          attributes: ['user_id', 'profile_picture']
        });

        const fullMsg = {
          message_id: msg.message_id,
          matchId,
          senderId,
          receiverId,
          content,
          timestamp: msg.timestamp,
          senderAvatar: senderProfile?.profile_picture || null
        };

        // Nadawca dostaje potwierdzenie
        io.to(socket.id).emit('message_sent', fullMsg);

        // Odbiorca dostaje wiadomość
        const receiverSocket = userSockets.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('receive_message', fullMsg);
        }

      } catch (err) {
        console.error('❌ Błąd zapisu wiadomości:', err);
      }
    });

    // 🔹 Typing indicator
    socket.on('user_typing', ({ chatId, userId, receiverId }) => {
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_typing', { chatId, userId });
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, sockId] of userSockets.entries()) {
        if (sockId === socket.id) userSockets.delete(userId);
      }
      console.log('🔴 Użytkownik rozłączony:', socket.id);
    });
  });

  return io;
}

module.exports = { initSocket, userSockets };
