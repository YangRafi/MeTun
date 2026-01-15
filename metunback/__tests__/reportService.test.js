const reportService = require('../services/reportService');
const Report = require('../models/Report');

jest.mock('../models/Report', () => ({
  create: jest.fn()
}));

describe('ReportService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createReport creates a new report with reportedUserId', async () => {
    const data = { subject: 'Spam', message: 'This is spam', senderId: 1, reportedUserId: 2 };
    const createdReport = { id: 1, ...data };

    Report.create.mockResolvedValue(createdReport);

    const result = await reportService.createReport(data);

    expect(result).toEqual(createdReport);
    expect(Report.create).toHaveBeenCalledWith(data);
  });

  test('createReport creates a new report without reportedUserId', async () => {
    const data = { subject: 'Spam', message: 'This is spam', senderId: 1 };
    const expectedData = { ...data, reportedUserId: null };
    const createdReport = { id: 1, ...expectedData };

    Report.create.mockResolvedValue(createdReport);

    const result = await reportService.createReport(data);

    expect(result).toEqual(createdReport);
    expect(Report.create).toHaveBeenCalledWith(expectedData);
  });
});
