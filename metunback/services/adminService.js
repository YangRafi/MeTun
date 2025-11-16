const { User, University, UserUniversity, Group } = require('../models');

class AdminService {
  async getDashboardData() {
    // 🔸 Statystyki systemu
    const [usersCount, verifiedCount, universitiesCount, groupsCount] = await Promise.all([
      User.count(),
      UserUniversity.count({ where: { status: 'approved' } }),
      University.count(),
      Group.count()
    ]);

    // 🔸 Użytkownicy
    const users = await User.findAll({
      attributes: ['user_id', 'name', 'surname', 'email', 'role'],
      order: [['user_id', 'ASC']]
    });

    // 🔸 Uczelnie
    const universities = await University.findAll({
      attributes: ['university_id', 'university_name'],
      order: [['university_name', 'ASC']]
    });

    return {
      stats: {
        users: usersCount,
        verified: verifiedCount,
        universities: universitiesCount,
        groups: groupsCount
      },
      users,
      universities
    };
  }
}

module.exports = new AdminService();
