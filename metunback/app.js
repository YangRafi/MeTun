const express = require('express');
const sequelize = require('./util/database');

const universityRoutes = require('./routes/universityRoutes.js');
const disciplineRoutes = require('./routes/disciplineRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupMemberRoutes = require('./routes/groupMemberRoutes');

sequelize.authenticate()
  .then(() => console.log("✅ Połączono z bazą"))
  .catch(err => console.error("❌ Błąd połączenia:", err));

const app = express();

// middleware do JSON
app.use(express.json());

// twoje routy API
app.use('/api/universities', universityRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-members', groupMemberRoutes);

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
