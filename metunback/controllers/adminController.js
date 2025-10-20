// controllers/adminController.js
const { User, University } = require('../models');

// 📊 Główne dane panelu admina
exports.getDashboardData = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'name', 'surname', 'email', 'role']
    });

    const universities = await University.findAll({
      attributes: ['university_id', 'university_name']
    });

    const stats = {
      users: users.length,
      universities: universities.length,
      verified: users.filter(u => u.role === 'verified').length, // placeholder
      groups: 0 // tu możesz dodać liczenie grup jak będziesz miał model Group
    };

    res.json({ stats, users, universities });
  } catch (error) {
    console.error('❌ Błąd adminController.getDashboardData:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};
