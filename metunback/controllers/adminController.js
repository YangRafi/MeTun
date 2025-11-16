const adminService = require('../services/adminService');

exports.getDashboardData = async (req, res) => {
  try {
    const data = await adminService.getDashboardData();
    res.json(data);
  } catch (err) {
    console.error('❌ Błąd admin dashboard:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};
