const { Server } = require('socket.io');
const { Message, Profile } = require('../models');

const userSockets = new Map();
let ioInstance = null;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  });

  ioInstance = io;

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
        const msg = await Message.create({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          timestamp: new Date()
        });

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

        io.to(socket.id).emit('message_sent', fullMsg);

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

    // 🔹 Usuwanie matcha (np. po kliknięciu "usuń match")
    socket.on('delete_match', ({ matchId, userId, receiverId }) => {
      console.log(`❌ Usunięto match ${matchId} przez ${userId}`);
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('match_removed', { matchId });
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

// 🔹 Emitowanie eventu z zewnątrz (np. z kontrolera matchów)
function emitNewMatch(userId1, userId2, matchData) {
  const io = getIo();
  if (!io) return;

  const socket1 = userSockets.get(userId1);
  const socket2 = userSockets.get(userId2);

  console.log(`💞 Wysyłanie new_match do ${userId1} i ${userId2}`);

  if (socket1) io.to(socket1).emit('new_match', matchData);
  if (socket2) io.to(socket2).emit('new_match', matchData);
}

function getIo() {
  return ioInstance;
}

module.exports = { initSocket, getIo, userSockets, emitNewMatch };
