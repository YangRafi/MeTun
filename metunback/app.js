const express = require('express');
const http = require('http'); // <-- potrzebne dla socket.io
const { Server } = require('socket.io');
const sequelize = require('./util/database');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ROUTES
const universityRoutes = require('./routes/universityRoutes.js');
const disciplineRoutes = require('./routes/disciplineRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupMemberRoutes = require('./routes/groupMemberRoutes');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const chatRoutes = require('./routes/chatRoutes');

// MODELE (jeśli będziesz korzystać w socketach)
const { Message } = require('./models'); // dodasz później

sequelize.authenticate()
  .then(() => console.log("✅ Połączono z bazą"))
  .catch(err => console.error("❌ Błąd połączenia:", err));

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api/universities', universityRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-members', groupMemberRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chats', chatRoutes);


app.use('/uploads', express.static('uploads'));

// Obsługa 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// --- ⬇️ TWORZYMY SERWER HTTP NA BAZIE APP
const server = http.createServer(app);

// --- ⬇️ KONFIGURACJA SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

// --- MAPA SOCKETÓW
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Użytkownik połączony:', socket.id);

  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`✅ Zarejestrowano użytkownika ${userId}`);
  });

  socket.on('send_message', async (data) => {
    const { matchId, senderId, receiverId, content } = data;

    try {
      const msg = await Message.create({
        match_id: matchId,
        sender_id: senderId,
        content
      });

      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('receive_message', msg);
      }

      io.to(socket.id).emit('message_sent', msg);
    } catch (err) {
      console.error("❌ Błąd zapisu wiadomości:", err);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) userSockets.delete(userId);
    }
    console.log('🔴 Użytkownik rozłączony:', socket.id);
  });
});

// --- ⬇️ URUCHOMIENIE SERWERA (EXPRESS + SOCKET.IO)
sequelize.sync().then(() => {
  server.listen(3000, () => {
    console.log('🚀 Server i Socket.io działają na http://localhost:3000');
  });
});
