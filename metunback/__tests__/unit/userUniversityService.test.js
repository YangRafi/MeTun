const fs = require('fs');
const userUniversityService = require('../../services/userUniversityService');
const { UserUniversity, GroupMember, Group, Discipline } = require('../../models');
const { addUserToDisciplineGroup } = require('../../util/groupUtils');

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

describe('UserUniversityService — unit tests', () => {

  afterEach(() => jest.clearAllMocks());

  test('getUserUniversities should return correct data', async () => {
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

  test('addUserUniversity creates a new record', async () => {
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

  test('addUserUniversity throws LIMIT_REACHED error', async () => {
    UserUniversity.count.mockResolvedValue(2);

    await expect(
      userUniversityService.addUserUniversity(1, {}, null)
    ).rejects.toThrow('LIMIT_REACHED');
  });

  test('activateTrial sets trial and adds user to group', async () => {
    const user = { user_id: 1, has_trial: false, save: jest.fn() };
    const mockRecord = { id: 1, user_id: 1, status: 'pending', trial: false, discipline_id: 11, save: jest.fn() };

    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.activateTrial(user, 1);

    expect(result.trial).toBe(true);
    expect(user.has_trial).toBe(true);
    expect(addUserToDisciplineGroup).toHaveBeenCalledWith(1, 11, true);
  });

  test('updateDocument updates document_url', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: null, status: 'pending', save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const url = 'http://host/new.pdf';
    const result = await userUniversityService.updateDocument(1, 1, url);

    expect(result).toBe(url);
    expect(mockRecord.document_url).toBe(url);
    expect(mockRecord.save).toHaveBeenCalled();
  });

  test('deleteUserUniversity removes the record', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: null, destroy: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.deleteUserUniversity(1, 1);

    expect(result).toBe(true);
    expect(mockRecord.destroy).toHaveBeenCalled();
  });

  test('updateStatus creates a group if it does not exist', async () => {
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

  test('getUserUniversities sets expired status and removes from group when trial has expired', async () => {
    const mockRecord = { id: 1, University: {}, Faculty: {}, Discipline: {}, trial: true, trial_end_date: new Date('2000-01-01'), expiry_date: null, status: 'pending', save: jest.fn() };
    UserUniversity.findAll.mockResolvedValue([mockRecord]);
    GroupMember.destroy.mockResolvedValue(1);

    const result = await userUniversityService.getUserUniversities(10);

    expect(result[0].status).toBe('expired');
    expect(mockRecord.save).toHaveBeenCalled();
    expect(GroupMember.destroy).toHaveBeenCalled();
  });

  test('updateDocument removes old file if it exists', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: 'http://example.com/old.pdf', status: 'rejected', save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.updateDocument(1, 1, 'http://new.pdf');

    expect(fs.unlink).toHaveBeenCalled();
    expect(mockRecord.status).toBe('pending');
    expect(result).toBe('http://new.pdf');
  });

  test('deleteUserUniversity removes file if document exists', async () => {
    const mockRecord = { id: 1, user_id: 1, document_url: 'http://example.com/doc.pdf', destroy: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    const result = await userUniversityService.deleteUserUniversity(1, 1);

    expect(fs.unlink).toHaveBeenCalled();
    expect(mockRecord.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('activateTrial throws TRIAL_ALREADY_USED error', async () => {
    const user = { user_id: 1, has_trial: true };
    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('TRIAL_ALREADY_USED');
  });

  test('activateTrial throws NOT_FOUND error when record does not exist', async () => {
    const user = { user_id: 1, has_trial: false };
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.activateTrial(user, 99))
      .rejects.toThrow('NOT_FOUND');
  });

  test('updateStatus does not add user if already in group', async () => {
    const mockRecord = { id: 1, user_id: 5, status: 'pending', discipline_id: 99, save: jest.fn() };
    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue({ group_id: 123 });
    GroupMember.findOne.mockResolvedValue({});

    const result = await userUniversityService.updateStatus(1, 'approved');

    expect(GroupMember.create).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('getUserUniversities sets expired status for non-trial record', async () => {
    const mockRecord = {
      id: 2,
      University: {},
      Faculty: {},
      Discipline: {},
      trial: false,
      expiry_date: new Date('2000-01-01'),
      status: 'approved',
      save: jest.fn()
    };
    UserUniversity.findAll.mockResolvedValue([mockRecord]);
    GroupMember.destroy.mockResolvedValue(1);

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

  test('updateDocument throws NOT_FOUND error if record does not exist', async () => {
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.updateDocument(1, 1, 'url'))
      .rejects.toThrow('NOT_FOUND');
  });

  test('deleteUserUniversity throws NOT_FOUND error if record does not exist', async () => {
    UserUniversity.findOne.mockResolvedValue(null);
    await expect(userUniversityService.deleteUserUniversity(1, 1))
      .rejects.toThrow('NOT_FOUND');
  });

  test('activateTrial throws INVALID_STATUS error when status is not pending', async () => {
    const user = { user_id: 1, has_trial: false };
    const mockRecord = { status: 'approved', trial: false, save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('INVALID_STATUS');
  });

  test('activateTrial throws ALREADY_HAS_TRIAL error when record.trial is true', async () => {
    const user = { user_id: 1, has_trial: false };
    const mockRecord = { status: 'pending', trial: true, save: jest.fn() };
    UserUniversity.findOne.mockResolvedValue(mockRecord);

    await expect(userUniversityService.activateTrial(user, 1))
      .rejects.toThrow('ALREADY_HAS_TRIAL');
  });

  test('updateStatus throws NOT_FOUND error if record does not exist', async () => {
    UserUniversity.findByPk.mockResolvedValue(null);
    await expect(userUniversityService.updateStatus(1, 'approved'))
      .rejects.toThrow('NOT_FOUND');
  });

  test('updateStatus creates only group when group does not exist and Discipline is null', async () => {
    const mockRecord = { id: 1, user_id: 1, status: 'pending', discipline_id: 99, save: jest.fn() };
    UserUniversity.findByPk.mockResolvedValue(mockRecord);
    Group.findOne.mockResolvedValue(null);
    Discipline.findByPk.mockResolvedValue(null);
    Group.create.mockResolvedValue({ group_id: 1 });

    const result = await userUniversityService.updateStatus(1, 'approved');
    expect(result).toBe(true);
    expect(Group.create).toHaveBeenCalled();
  });

  test('getAllApplications calls UserUniversity.findAll', async () => {
    UserUniversity.findAll.mockResolvedValue([]);
    const result = await userUniversityService.getAllApplications();
    expect(UserUniversity.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('getApplication calls UserUniversity.findByPk', async () => {
    UserUniversity.findByPk.mockResolvedValue({ id: 1 });
    const result = await userUniversityService.getApplication(1);
    expect(UserUniversity.findByPk).toHaveBeenCalledWith(1);
    expect(result.id).toBe(1);
  });

});
