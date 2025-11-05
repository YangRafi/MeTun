const Report = require('../models/Report');
const { User } = require('../models');

exports.createReport = async (req, res) => {
  try {
    const senderId = req.user.userId; // z tokenu/auth
    const { subject, message, targetUserId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Temat i treść wiadomości są wymagane.' });
    }

    const newReport = await Report.create({
      subject,
      message,
      senderId: senderId, 
      target_user_id: targetUserId || null,
    });

    res.status(201).json({ message: 'Raport wysłany!', report: newReport });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
};

