const reportService = require('../services/reportService');

// Tworzenie raportu przez użytkownika
exports.createReport = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { subject, message, reportedUserId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Temat i treść wiadomości są wymagane.' });
    }

    const report = await reportService.createReport({ subject, message, senderId, reportedUserId });

    res.status(201).json({ message: 'Raport został wysłany.', report });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
};

// Pobranie raportów dla panelu admina (pogrupowane wg statusu)
exports.getReports = async (req, res) => {
  try {
    const reports = await reportService.getAllReports();

    const grouped = {
      pending: reports.filter(r => r.status === 'pending'),
      resolved: reports.filter(r => r.status === 'resolved'),
      closed:   reports.filter(r => r.status === 'closed'),
    };

    res.json(grouped);
  } catch (err) {
    console.error('Błąd pobierania raportów:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
};

// Aktualizacja statusu raportu i opcjonalnej odpowiedzi
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const updatedReport = await reportService.updateReport(id, { status, response });

    res.json({ message: 'Raport zaktualizowany.', report: updatedReport });
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
};
