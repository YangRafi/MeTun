const Report = require('../models/Report');
const User = require('../models/User');

class ReportService {
  // Tworzenie nowego raportu
  async createReport({ subject, message, senderId, reportedUserId }) {
    return await Report.create({
      subject,
      message,
      senderId,
      reportedUserId: reportedUserId || null,
      status: 'pending'
    });
  }

  // Pobranie wszystkich raportów wraz z danymi użytkowników
  async getAllReports() {
    return await Report.findAll({
      include: [
        { model: User, as: 'sender', attributes: ['id','name','email'] },
        { model: User, as: 'reportedUser', attributes: ['id','name','email'] }
      ]
    });
  }

  // Aktualizacja statusu i/lub odpowiedzi raportu
  async updateReport(id, { status, response }) {
    const report = await Report.findByPk(id);
    if (!report) throw new Error('Raport nie istnieje');

    if (status) report.status = status;
    if (response) report.response = response;

    await report.save();
    return report;
  }
}

module.exports = new ReportService();
