const reportService = require('../services/reportService');
const Report = require('../models/Report');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models/Report', () => ({
  create: jest.fn()
}));

// -----------------------------
// TESTY REPORT SERVICE
// -----------------------------
describe('ReportService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // CREATE REPORT
  // --------------------------
  test('createReport tworzy nowy raport z reportedUserId', async () => {
    const data = { subject: 'Spam', message: 'This is spam', senderId: 1, reportedUserId: 2 };
    const createdReport = { id: 1, ...data };

    Report.create.mockResolvedValue(createdReport);

    const result = await reportService.createReport(data);

    expect(result).toEqual(createdReport);
    expect(Report.create).toHaveBeenCalledWith(data);
  });

  test('createReport tworzy nowy raport bez reportedUserId', async () => {
    const data = { subject: 'Spam', message: 'This is spam', senderId: 1 };
    const expectedData = { ...data, reportedUserId: null };
    const createdReport = { id: 1, ...expectedData };

    Report.create.mockResolvedValue(createdReport);

    const result = await reportService.createReport(data);

    expect(result).toEqual(createdReport);
    expect(Report.create).toHaveBeenCalledWith(expectedData);
  });
});
