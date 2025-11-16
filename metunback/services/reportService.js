const Report = require('../models/Report');

class ReportService {
  async createReport({ subject, message, senderId, reportedUserId }) {
    return await Report.create({
      subject,
      message,
      senderId,
      reportedUserId: reportedUserId || null
    });
  }
}

module.exports = new ReportService();
