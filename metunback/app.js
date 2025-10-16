const express = require('express');
const sequelize = require('./util/database');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const universityRoutes = require('./routes/universityRoutes.js');
const disciplineRoutes = require('./routes/disciplineRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupMemberRoutes = require('./routes/groupMemberRoutes');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');


sequelize.authenticate()
  .then(() => console.log("✅ Połączono z bazą"))
  .catch(err => console.error("❌ Błąd połączenia:", err));

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// middleware do JSON
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/universities', universityRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-members', groupMemberRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/uploads', express.static('uploads'));

// obsługa 404 jako JSON
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

sequelize
  .sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch(err => {
    console.error(err);
  });
