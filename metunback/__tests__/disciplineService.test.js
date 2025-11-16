const DisciplineService = require('../services/disciplineService');
const Discipline = require('../models/Discipline');

jest.mock('../models/Discipline', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));

describe('DisciplineService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // getAllDisciplines
  // --------------------------
  test('getAllDisciplines zwraca wszystkie dyscypliny', async () => {
    const mockDisciplines = [{ discipline_id: 1, name: 'Math' }];
    Discipline.findAll.mockResolvedValue(mockDisciplines);

    const result = await DisciplineService.getAllDisciplines();
    expect(Discipline.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockDisciplines);
  });

  // --------------------------
  // getDisciplinesByFaculty
  // --------------------------
  test('getDisciplinesByFaculty zwraca dyscypliny dla wydziału', async () => {
    const mockDisciplines = [{ discipline_id: 2, name: 'Physics' }];
    Discipline.findAll.mockResolvedValue(mockDisciplines);

    const result = await DisciplineService.getDisciplinesByFaculty(1);
    expect(Discipline.findAll).toHaveBeenCalledWith({
      where: { faculty_id: 1 },
      attributes: ['discipline_id', 'name']
    });
    expect(result).toEqual(mockDisciplines);
  });

  test('getDisciplinesByFaculty rzuca błąd jeśli brak facultyId', async () => {
    await expect(DisciplineService.getDisciplinesByFaculty()).rejects.toThrow('facultyId is required');
  });

  // --------------------------
  // getDisciplineById
  // --------------------------
  test('getDisciplineById zwraca dyscyplinę', async () => {
    const mockDiscipline = { discipline_id: 1, name: 'Math' };
    Discipline.findByPk.mockResolvedValue(mockDiscipline);

    const result = await DisciplineService.getDisciplineById(1);
    expect(Discipline.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockDiscipline);
  });

  test('getDisciplineById rzuca błąd jeśli brak dyscypliny', async () => {
    Discipline.findByPk.mockResolvedValue(null);
    await expect(DisciplineService.getDisciplineById(1)).rejects.toThrow('Discipline not found');
  });

  // --------------------------
  // createDiscipline
  // --------------------------
  test('createDiscipline tworzy nową dyscyplinę', async () => {
    const mockDiscipline = { discipline_id: 1, name: 'Chemistry', faculty_id: 2 };
    Discipline.create.mockResolvedValue(mockDiscipline);

    const result = await DisciplineService.createDiscipline({ name: 'Chemistry', faculty_id: 2 });
    expect(Discipline.create).toHaveBeenCalledWith({ name: 'Chemistry', faculty_id: 2 });
    expect(result).toEqual(mockDiscipline);
  });

  // --------------------------
  // updateDiscipline
  // --------------------------
  test('updateDiscipline aktualizuje dyscyplinę', async () => {
    const mockDiscipline = { 
      discipline_id: 1, 
      name: 'Math', 
      faculty_id: 1, 
      save: jest.fn().mockResolvedValue(true) 
    };
    Discipline.findByPk.mockResolvedValue(mockDiscipline);

    const result = await DisciplineService.updateDiscipline(1, { name: 'Advanced Math', faculty_id: 2 });
    expect(Discipline.findByPk).toHaveBeenCalledWith(1);
    expect(mockDiscipline.save).toHaveBeenCalled();
    expect(mockDiscipline.name).toBe('Advanced Math');
    expect(mockDiscipline.faculty_id).toBe(2);
    expect(result).toEqual(mockDiscipline);
  });

  test('updateDiscipline rzuca błąd jeśli brak dyscypliny', async () => {
    Discipline.findByPk.mockResolvedValue(null);
    await expect(DisciplineService.updateDiscipline(1, { name: 'Physics' })).rejects.toThrow('Discipline not found');
  });

  // --------------------------
  // deleteDiscipline
  // --------------------------
  test('deleteDiscipline usuwa dyscyplinę', async () => {
    const mockDiscipline = { destroy: jest.fn().mockResolvedValue(true) };
    Discipline.findByPk.mockResolvedValue(mockDiscipline);

    const result = await DisciplineService.deleteDiscipline(1);
    expect(Discipline.findByPk).toHaveBeenCalledWith(1);
    expect(mockDiscipline.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('deleteDiscipline rzuca błąd jeśli brak dyscypliny', async () => {
    Discipline.findByPk.mockResolvedValue(null);
    await expect(DisciplineService.deleteDiscipline(1)).rejects.toThrow('Discipline not found');
  });
});
