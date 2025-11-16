const reportService = require('../services/reportService');

exports.createReport = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { subject, message, reportedUserId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        error: 'Temat i treść wiadomości są wymagane.'
      });
    }

    const report = await reportService.createReport({
      subject,
      message,
      senderId,
      reportedUserId
    });

    res.status(201).json({
      message: 'Raport został wysłany.',
      report
    });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
};
