const universityService = require('../../services/universityService');
const University = require('../../models/University');
const { Op, Sequelize } = require('sequelize');

jest.mock('../models/University', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));

describe('UniversityService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getAll returns all universities when no query is provided', async () => {
    University.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await universityService.getAll();

    expect(result.length).toBe(2);
    expect(University.findAll).toHaveBeenCalledWith();
  });

  test('getAll filters universities when query is provided', async () => {
    University.findAll.mockResolvedValue([{ id: 1 }]);
    const query = 'Test';

    const result = await universityService.getAll(query);

    expect(result.length).toBe(1);
    expect(University.findAll).toHaveBeenCalledWith({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('university_name')),
        { [Op.like]: 'test%' }
      ),
      limit: 10
    });
  });

  test('getById returns a university', async () => {
    University.findByPk.mockResolvedValue({ id: 1 });

    const result = await universityService.getById(1);

    expect(result).toEqual({ id: 1 });
    expect(University.findByPk).toHaveBeenCalledWith(1);
  });

  test('create adds a new university', async () => {
    const data = { university_name: 'Test Uni' };
    University.create.mockResolvedValue({ id: 1, ...data });

    const result = await universityService.create(data);

    expect(result.id).toBe(1);
    expect(University.create).toHaveBeenCalledWith(data);
  });

  test('update updates an existing university', async () => {
    const uniMock = { update: jest.fn().mockResolvedValue({ id: 1, university_name: 'Updated' }) };
    University.findByPk.mockResolvedValue(uniMock);

    const result = await universityService.update(1, { university_name: 'Updated' });

    expect(result.university_name).toBe('Updated');
    expect(uniMock.update).toHaveBeenCalledWith({ university_name: 'Updated' });
  });

  test('update returns null if university does not exist', async () => {
    University.findByPk.mockResolvedValue(null);

    const result = await universityService.update(1, { university_name: 'Updated' });

    expect(result).toBeNull();
  });

  test('remove deletes the university', async () => {
    const uniMock = { destroy: jest.fn() };
    University.findByPk.mockResolvedValue(uniMock);

    const result = await universityService.remove(1);

    expect(result).toBe(true);
    expect(uniMock.destroy).toHaveBeenCalled();
  });

  test('remove returns null if university does not exist', async () => {
    University.findByPk.mockResolvedValue(null);

    const result = await universityService.remove(1);

    expect(result).toBeNull();
  });
});
