const { Server } = require('socket.io');
const { Message, Profile, GroupMember } = require('../models'); // ⬅️ upewnij się, że masz model GroupMember

const userSockets = new Map();
let ioInstance = null;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('🟢 Użytkownik połączony:', socket.id);

    // 🔹 Rejestracja użytkownika
    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`✅ Zarejestrowano użytkownika ${userId}`);
    });

    // 🔹 Wysyłanie wiadomości (prywatne lub grupowe)
    socket.on('send_message', async (data) => {
      const { matchId, groupId, senderId, receiverId, content } = data;

      try {
        // Zapis wiadomości do bazy
        const msg = await Message.create({
          match_id: matchId || null,
          group_id: groupId || null,
          sender_id: senderId,
          content,
          timestamp: new Date(),
        });

        // Pobranie avatara nadawcy
        const senderProfile = await Profile.findOne({
          where: { user_id: senderId },
          attributes: ['profile_picture'],
        });

        const fullMsg = {
          message_id: msg.message_id,
          matchId,
          groupId,
          senderId,
          receiverId,
          content,
          timestamp: msg.timestamp,
          senderAvatar: senderProfile?.profile_picture || null,
        };

        // 💬 Wysyłanie wiadomości
        io.to(socket.id).emit('message_sent', fullMsg);

        if (groupId) {
          // 🔹 Grupowy czat — wysyłamy do wszystkich członków grupy
          const members = await GroupMember.findAll({
            where: { group_id: groupId },
            attributes: ['user_id'],
          });

          for (const member of members) {
            const socketId = userSockets.get(member.user_id);
            if (socketId && member.user_id !== senderId) {
              io.to(socketId).emit('receive_message', fullMsg);
            }
          }
        } else if (receiverId) {
          // 🔹 Prywatny czat
          const receiverSocket = userSockets.get(receiverId);
          if (receiverSocket) io.to(receiverSocket).emit('receive_message', fullMsg);
        }
      } catch (err) {
        console.error('❌ Błąd zapisu wiadomości:', err);
      }
    });

    // 🔹 Typing indicator
    socket.on('user_typing', ({ chatId, userId, receiverId, groupId }) => {
      if (groupId) {
        // Typing w grupie
        GroupMember.findAll({
          where: { group_id: groupId },
          attributes: ['user_id'],
        }).then((members) => {
          for (const m of members) {
            const sock = userSockets.get(m.user_id);
            if (sock && m.user_id !== userId) {
              io.to(sock).emit('user_typing', { chatId: groupId, userId }); // ✅ zawsze chatId
            }
          }
        });
      } else if (receiverId) {
        // Typing prywatny
        const receiverSocket = userSockets.get(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit('user_typing', { chatId, userId }); // ✅ ujednolicone
      }
    });

    // 🔹 Usuwanie matcha
    socket.on('delete_match', ({ matchId, userId, receiverId }) => {
      console.log(`❌ Usunięto match ${matchId} przez ${userId}`);
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit('match_removed', { matchId });
    });

    // 🔹 Rozłączenie użytkownika
    socket.on('disconnect', () => {
      for (const [userId, sockId] of userSockets.entries()) {
        if (sockId === socket.id) userSockets.delete(userId);
      }
      console.log('🔴 Użytkownik rozłączony:', socket.id);
    });
  });

  return io;
}

// 🔹 Emitowanie eventu new_match
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
