const express = require('express');
const http = require('http');
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
const adminRoutes = require('./routes/admin');
const userUniversityRoutes = require('./routes/userUniversityRoutes');

// Sockety
const { initSocket } = require('./util/socket');

sequelize.authenticate()
  .then(() => console.log("✅ Połączono z bazą"))
  .catch(err => console.error("❌ Błąd połączenia:", err));

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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
app.use('/api/admin', adminRoutes);
app.use('/api/userUniversity', userUniversityRoutes);


// Obsługa 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Tworzenie serwera HTTP i inicjalizacja socketów
const server = http.createServer(app);
initSocket(server);

sequelize.sync().then(() => {
  server.listen(3000, () => {
    console.log('🚀 Server i Socket.io działają na http://localhost:3000');
  });
});
