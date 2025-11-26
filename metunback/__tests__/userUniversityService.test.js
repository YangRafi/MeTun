const fs = require('fs'); // 🔹 dodany import
const userUniversityService = require('../services/userUniversityService');
const { UserUniversity, GroupMember, Group, Discipline } = require('../models');
const { addUserToDisciplineGroup } = require('../util/groupUtils');

// 🔹 Mock utils
jest.mock('fs', () => ({ unlink: jest.fn() }));
jest.mock('path', () => ({
  join: jest.fn(() => '/mock/path'),
  basename: jest.fn(() => 'file.pdf')
}));
jest.mock('../util/groupUtils', () => ({
  addUserToDisciplineGroup: jest.fn()
}));
jest.mock('../util/dateUtils', () => ({
  getNextExpiryDate: jest.fn(() => new Date('2030-01-01'))
}));

// 🔹 Mock modeli Sequelize
jest.mock('../models', () => ({
  UserUniversity: {
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  GroupMember: {
    destroy: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  Group: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Discipline: {
    findByPk: jest.fn()
  }
}));

describe('UserUniversityService — testy jednostkowe', () => {

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------
  test('getUserUniversities powinno zwrócić poprawne dane', async () => {
    const mockRecord = {
      id: 1,
      University: { university_name: 'Uni' },
      Faculty: { faculty_name: 'Faculty' },
      Discipline: { name: 'IT' },
      faculty_id: 2,
      discipline_id: 3,
      status: 'pending',
      join_date: new Date(),
      expiry_date: null,
      trial: false,
      trial_start_date: null,
      trial_end_date: null,
      save: jest.fn()
    };

    UserUniversity.findAll.mockResolvedValue([mockRecord]);

    const result = await userUniversityService.getUserUniversities(1, null);

    expect(result).toHaveLength(1);
    expect(result[0].university_name).toBe('Uni');
    expect(UserUniversity.findAll).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('addUserUniversity tworzy nowy rekord', async () => {
    UserUniversity.count.mockResolvedValue(0);
    UserUniversity.create.mockResolvedValue({ id: 1 });

    const result = await userUniversityService.addUserUniversity(
      1,
      { universityId: 1, facultyId: 1, disciplineId: 1 },
      null
    );

    expect(result.id).toBe(1);
    expect(UserUniversity.create).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('addUserUniversity rzuca LIMIT_REACHED', async () => {
    UserUniversity.count.mockResolvedValue(2);

    await expect(
      userUniversityService.addUserUniversity(1, {}, null)
    ).rejects.toThrow('LIMIT_REACHED');
  });

  // -------------------------------------------------------
  test('activateTrial ustawia trial i dodaje do grupy', async () => {
    const user = { user_id: 1, has_trial: false, save: jest.fn() };
    const mockRecord = { id: 1, user_id: 1, status: 'pending', trial: false, discipline_id: 11, save: jest.fn() };

    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.activateTrial(user, 1);

    expect(result.trial).toBe(true);
    expect(user.has_trial).toBe(true);
    expect(addUserToDisciplineGroup).toHaveBeenCalledWith(1, 11, true);
  });

  // -------------------------------------------------------
  test('updateDocument aktualizuje document_url', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: null, status: 'pending', save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const url = 'http://host/new.pdf';
    const result = await userUniversityService.updateDocument(1, 1, url);

    expect(result).toBe(url);
    expect(mockRecord.document_url).toBe(url);
    expect(mockRecord.save).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('deleteUserUniversity usuwa rekord', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: null, destroy: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.deleteUserUniversity(1, 1);

    expect(result).toBe(true);
    expect(mockRecord.destroy).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('updateStatus tworzy grupę gdy jej nie ma', async () => {
    const mockRecord = { id: 1, user_id: 5, status: 'pending', discipline_id: 99, save: jest.fn() };
    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue(null);
    Discipline.findByPk.mockResolvedValue({ name: 'Informatyka' });
    Group.create.mockResolvedValue({ group_id: 123 });

    const result = await userUniversityService.updateStatus(1, 'approved');

    expect(result).toBe(true);
    expect(mockRecord.status).toBe('approved');
    expect(mockRecord.save).toHaveBeenCalled();
    expect(Group.create).toHaveBeenCalled();
    expect(GroupMember.create).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('getUserUniversities ustawia expired i usuwa z grupy gdy trial wygasł', async () => {
    const mockRecord = { id: 1, University: {}, Faculty: {}, Discipline: {}, trial: true, trial_end_date: new Date('2000-01-01'), expiry_date: null, status: 'pending', save: jest.fn() };
    UserUniversity.findAll.mockResolvedValue([mockRecord]);
    GroupMember.destroy.mockResolvedValue(1);

    const result = await userUniversityService.getUserUniversities(10);

    expect(result[0].status).toBe('expired');
    expect(mockRecord.save).toHaveBeenCalled();
    expect(GroupMember.destroy).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  test('updateDocument usuwa stary plik jeśli istnieje', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: 'http://example.com/old.pdf', status: 'rejected', save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.updateDocument(1, 1, 'http://new.pdf');

    expect(fs.unlink).toHaveBeenCalled();
    expect(mockRecord.status).toBe('pending');
    expect(result).toBe('http://new.pdf');
  });

  test('deleteUserUniversity usuwa plik jeśli istnieje dokument', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: 'http://example.com/doc.pdf', destroy: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.deleteUserUniversity(1, 1);

    expect(fs.unlink).toHaveBeenCalled();
    expect(mockRecord.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('activateTrial rzuca błąd TRIAL_ALREADY_USED', async () => {
    const user = { user_id: 1, has_trial: true };
    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('TRIAL_ALREADY_USED');
  });

  test('activateTrial rzuca błąd NOT_FOUND gdy brak rekordu', async () => {
    const user = { user_id: 1, has_trial: false };
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.activateTrial(user, 99))
      .rejects.toThrow('NOT_FOUND');
  });

  test('updateStatus nie dodaje usera gdy jest w grupie', async () => {
    const mockRecord = { id: 1, user_id: 5, status: 'pending', discipline_id: 99, save: jest.fn() };
    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue({ group_id: 123 });
    GroupMember.findOne.mockResolvedValue({}); // user already in group

    const result = await userUniversityService.updateStatus(1, 'approved');

    expect(GroupMember.create).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('getUserUniversities ustawia expired dla normalnego rekordu (nie trial)', async () => {
    const mockRecord = {
      id: 2,
      University: {},
      Faculty: {},
      Discipline: {},
      trial: false,
      expiry_date: new Date('2000-01-01'), // w przeszłości
      status: 'approved',
      save: jest.fn()
    };
    UserUniversity.findAll.mockResolvedValue([mockRecord]);
    GroupMember.destroy.mockResolvedValue(1);

    // Wymuszenie nowej daty "teraz" na późniejszą niż expiry_date
    const RealDate = Date;
    global.Date = class extends RealDate {
      constructor() {
        super();
        return new RealDate('2030-01-01');
      }
    };

    const result = await userUniversityService.getUserUniversities(10);

    expect(result[0].status).toBe('expired');
    expect(mockRecord.save).toHaveBeenCalled();
    expect(GroupMember.destroy).toHaveBeenCalled();

    global.Date = RealDate;
  });

  test('updateDocument rzuca NOT_FOUND jeśli brak rekordu', async () => {
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.updateDocument(1, 1, 'url'))
      .rejects.toThrow('NOT_FOUND');
  });

  test('deleteUserUniversity rzuca NOT_FOUND jeśli brak rekordu', async () => {
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.deleteUserUniversity(1, 1))
      .rejects.toThrow('NOT_FOUND');
  });

  test('activateTrial rzuca INVALID_STATUS gdy status nie pending', async () => {
    const user = { user_id: 1, has_trial: false };
    const mockRecord = { status: 'approved', trial: false, save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('INVALID_STATUS');
  });

  test('activateTrial rzuca ALREADY_HAS_TRIAL gdy record.trial true', async () => {
    const user = { user_id: 1, has_trial: false };
    const mockRecord = { status: 'pending', trial: true, save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('ALREADY_HAS_TRIAL');
  });

  test('updateStatus rzuca NOT_FOUND jeśli brak rekordu', async () => {
    UserUniversity.findByPk.mockResolvedValue(null);
    await expect(userUniversityService.updateStatus(1, 'approved'))
      .rejects.toThrow('NOT_FOUND');
  });

  test('updateStatus tworzy tylko grupę gdy group nie istnieje i Discipline zwraca null', async () => {
    const mockRecord = { id: 1, user_id: 1, status: 'pending', discipline_id: 99, save: jest.fn() };
    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue(null);
    Discipline.findByPk.mockResolvedValue(null);
    Group.create.mockResolvedValue({ group_id: 1 });

    const result = await userUniversityService.updateStatus(1, 'approved');
    expect(result).toBe(true);
    expect(Group.create).toHaveBeenCalled();
  });


    test('getAllApplications wywołuje UserUniversity.findAll', async () => {
      UserUniversity.findAll.mockResolvedValue([]);
      const result = await userUniversityService.getAllApplications();
      expect(UserUniversity.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    test('getApplication wywołuje UserUniversity.findByPk', async () => {
      UserUniversity.findByPk.mockResolvedValue({ id: 1 });
      const result = await userUniversityService.getApplication(1);
      expect(UserUniversity.findByPk).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

  });
