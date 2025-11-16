const universityService = require('../services/universityService');
const University = require('../models/University');
const { Op, Sequelize } = require('sequelize');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models/University', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));

// -----------------------------
// TESTY UNIVERSITY SERVICE
// -----------------------------
describe('UniversityService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // GET ALL
  // --------------------------
  test('getAll bez query zwraca wszystkie uczelnie', async () => {
    University.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await universityService.getAll();

    expect(result.length).toBe(2);
    expect(University.findAll).toHaveBeenCalledWith();
  });

  test('getAll z query filtruje uczelnie', async () => {
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

  // --------------------------
  // GET BY ID
  // --------------------------
  test('getById zwraca uczelnię', async () => {
    University.findByPk.mockResolvedValue({ id: 1 });

    const result = await universityService.getById(1);

    expect(result).toEqual({ id: 1 });
    expect(University.findByPk).toHaveBeenCalledWith(1);
  });

  // --------------------------
  // CREATE
  // --------------------------
  test('create dodaje nową uczelnię', async () => {
    const data = { university_name: 'Test Uni' };
    University.create.mockResolvedValue({ id: 1, ...data });

    const result = await universityService.create(data);

    expect(result.id).toBe(1);
    expect(University.create).toHaveBeenCalledWith(data);
  });

  // --------------------------
  // UPDATE
  // --------------------------
  test('update aktualizuje uczelnię', async () => {
    const uniMock = { update: jest.fn().mockResolvedValue({ id: 1, university_name: 'Updated' }) };
    University.findByPk.mockResolvedValue(uniMock);

    const result = await universityService.update(1, { university_name: 'Updated' });

    expect(result.university_name).toBe('Updated');
    expect(uniMock.update).toHaveBeenCalledWith({ university_name: 'Updated' });
  });

  test('update zwraca null jeśli uczelnia nie istnieje', async () => {
    University.findByPk.mockResolvedValue(null);

    const result = await universityService.update(1, { university_name: 'Updated' });

    expect(result).toBeNull();
  });

  // --------------------------
  // REMOVE
  // --------------------------
  test('remove usuwa uczelnię', async () => {
    const uniMock = { destroy: jest.fn() };
    University.findByPk.mockResolvedValue(uniMock);

    const result = await universityService.remove(1);

    expect(result).toBe(true);
    expect(uniMock.destroy).toHaveBeenCalled();
  });

  test('remove zwraca null jeśli uczelnia nie istnieje', async () => {
    University.findByPk.mockResolvedValue(null);

    const result = await universityService.remove(1);

    expect(result).toBeNull();
  });
});
