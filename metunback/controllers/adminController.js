const { User, University, UserUniversity, Group } = require('../models')

exports.getDashboardData = async (req, res) => {
  try {
    // 🔸 Statystyki systemu
    const usersCount = await User.count()
    const verifiedCount = await UserUniversity.count({ where: { status: 'approved' } })
    const universitiesCount = await University.count()
    const groupsCount = await Group.count()

    // 🔸 Użytkownicy
    const users = await User.findAll({
      attributes: ['user_id', 'name', 'surname', 'email', 'role'],
      order: [['user_id', 'ASC']]
    })

    // 🔸 Uczelnie
    const universities = await University.findAll({
      attributes: ['university_id', 'university_name'],
      order: [['university_name', 'ASC']]
    })

    res.json({
      stats: {
        users: usersCount,
        verified: verifiedCount,
        universities: universitiesCount,
        groups: groupsCount
      },
      users,
      universities
    })
  } catch (err) {
    console.error('❌ Błąd admin dashboard:', err)
    res.status(500).json({ error: 'Błąd serwera' })
  }
}
