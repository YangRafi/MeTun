const userUniversityService = require('../services/userUniversityService');
const { UserUniversity, GroupMember, Group, Discipline } = require('../models');
const { addUserToDisciplineGroup } = require('../util/groupUtils');

// 🔹 Mock modeli Sequelize
jest.mock('../models', () => ({
  UserUniversity: {
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  GroupMember: { destroy: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Group: { findOne: jest.fn(), create: jest.fn() },
  Discipline: { findByPk: jest.fn() }
}));

// 🔹 Mock funkcji pomocniczej
jest.mock('../util/groupUtils', () => ({
  addUserToDisciplineGroup: jest.fn()
}));

describe('UserUniversityService - jednostkowe', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  test('getUserUniversities powinno zwrócić dane użytkownika', async () => {
    const mockData = [
      { 
        id: 1,
        University: { university_name: 'Test Uni' },
        Faculty: { faculty_name: 'Test Faculty' },
        Discipline: { name: 'Test Discipline' },
        faculty_id: 1,
        discipline_id: 1,
        status: 'pending',
        join_date: new Date(),
        expiry_date: null,
        trial: false,
        trial_start_date: null,
        trial_end_date: null,
        save: jest.fn()
      }
    ];

    UserUniversity.findAll.mockResolvedValue(mockData);

    const result = await userUniversityService.getUserUniversities(1, null);

    expect(result).toHaveLength(1);
    expect(result[0].university_name).toBe('Test Uni');
    expect(UserUniversity.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1 } })
    );
  });

  // ----------------------------------------------------------------
  test('addUserUniversity powinno utworzyć nową aplikację', async () => {
    UserUniversity.count.mockResolvedValue(0);
    const mockRecord = { id: 1, status: 'pending' };
    UserUniversity.create.mockResolvedValue(mockRecord);

    const result = await userUniversityService.addUserUniversity(
      1,
      { universityId: 1, facultyId: 1, disciplineId: 1 },
      null
    );

    expect(result).toEqual(mockRecord);
    expect(UserUniversity.create).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  test('addUserUniversity powinno rzucić LIMIT_REACHED', async () => {
    UserUniversity.count.mockResolvedValue(2);

    await expect(
      userUniversityService.addUserUniversity(1, {}, null)
    ).rejects.toThrow('LIMIT_REACHED');
  });

  // ----------------------------------------------------------------
  test('activateTrial powinno ustawić trial i dodać do grupy', async () => {
    const user = { user_id: 1, has_trial: false, save: jest.fn() };

    const mockRecord = {
      id: 1,
      user_id: 1,
      status: 'pending',
      trial: false,
      discipline_id: 1,
      save: jest.fn()
    };

    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.activateTrial(user, 1);

    expect(result.trial).toBe(true);
    expect(user.has_trial).toBe(true);
    expect(addUserToDisciplineGroup).toHaveBeenCalledWith(1, 1, true);
  });

  // ----------------------------------------------------------------
  test('updateDocument powinno zaktualizować url dokumentu', async () => {
    const mockRecord = {
      id: 1,
      user_id: 1,
      document_url: null,
      status: 'pending',
      save: jest.fn()
    };

    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const url = 'http://host/file.pdf';
    const result = await userUniversityService.updateDocument(1, 1, url);

    expect(result).toBe(url);
    expect(mockRecord.document_url).toBe(url);
    expect(mockRecord.save).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  test('deleteUserUniversity powinno usunąć rekord', async () => {
    const mockRecord = {
      id: 1,
      user_id: 1,
      destroy: jest.fn()
    };

    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.deleteUserUniversity(1, 1);

    expect(result).toBe(true);
    expect(mockRecord.destroy).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  test('updateStatus powinno zmienić status i utworzyć grupę', async () => {
    const mockRecord = { 
      id: 1,
      status: 'pending',
      discipline_id: 1,
      user_id: 1,
      save: jest.fn()
    };

    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue(null);
    Discipline.findByPk.mockResolvedValue({ name: 'Test Discipline' });
    Group.create.mockResolvedValue({ group_id: 1 });
    GroupMember.create.mockResolvedValue({});

    const result = await userUniversityService.updateStatus(1, 'approved');

    expect(result).toBe(true);
    expect(mockRecord.status).toBe('approved');
    expect(mockRecord.save).toHaveBeenCalled();
  });

});
