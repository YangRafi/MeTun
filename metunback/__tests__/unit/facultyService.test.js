const FacultyService = require('../../services/facultyService');
const Faculty = require('../../models/Faculty');

jest.mock('../models/Faculty', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));

describe('FacultyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getAllFaculties returns all faculties', async () => {
    const mockFaculties = [{ faculty_id: 1, faculty_name: 'Math' }];
    Faculty.findAll.mockResolvedValue(mockFaculties);

    const result = await FacultyService.getAllFaculties();
    expect(Faculty.findAll).toHaveBeenCalledWith({
      where: {},
      order: [['faculty_name', 'ASC']]
    });
    expect(result).toEqual(mockFaculties);
  });

  test('getAllFaculties filters by universityId', async () => {
    const mockFaculties = [{ faculty_id: 2, faculty_name: 'Physics' }];
    Faculty.findAll.mockResolvedValue(mockFaculties);

    const result = await FacultyService.getAllFaculties(1);
    expect(Faculty.findAll).toHaveBeenCalledWith({
      where: { university_id: 1 },
      order: [['faculty_name', 'ASC']]
    });
    expect(result).toEqual(mockFaculties);
  });

  test('getFacultyById returns a faculty', async () => {
    const mockFaculty = { faculty_id: 1, faculty_name: 'Math' };
    Faculty.findByPk.mockResolvedValue(mockFaculty);

    const result = await FacultyService.getFacultyById(1);
    expect(Faculty.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockFaculty);
  });

  test('getFacultyById throws an error if faculty does not exist', async () => {
    Faculty.findByPk.mockResolvedValue(null);
    await expect(FacultyService.getFacultyById(1)).rejects.toThrow('Faculty not found');
  });

  test('createFaculty creates a new faculty', async () => {
    const mockFaculty = { faculty_id: 1, faculty_name: 'Chemistry', university_id: 2 };
    Faculty.create.mockResolvedValue(mockFaculty);

    const result = await FacultyService.createFaculty({
      faculty_name: 'Chemistry',
      university_id: 2
    });

    expect(Faculty.create).toHaveBeenCalledWith({
      faculty_name: 'Chemistry',
      university_id: 2
    });
    expect(result).toEqual(mockFaculty);
  });

  test('updateFaculty updates a faculty', async () => {
    const mockFaculty = { update: jest.fn().mockResolvedValue(true) };
    Faculty.findByPk.mockResolvedValue(mockFaculty);

    const result = await FacultyService.updateFaculty(1, {
      faculty_name: 'Biology'
    });

    expect(Faculty.findByPk).toHaveBeenCalledWith(1);
    expect(mockFaculty.update).toHaveBeenCalledWith({
      faculty_name: 'Biology'
    });
    expect(result).toEqual(mockFaculty);
  });

  test('updateFaculty throws an error if faculty does not exist', async () => {
    Faculty.findByPk.mockResolvedValue(null);
    await expect(
      FacultyService.updateFaculty(1, { faculty_name: 'Biology' })
    ).rejects.toThrow('Faculty not found');
  });

  test('deleteFaculty deletes a faculty', async () => {
    const mockFaculty = { destroy: jest.fn().mockResolvedValue(true) };
    Faculty.findByPk.mockResolvedValue(mockFaculty);

    const result = await FacultyService.deleteFaculty(1);
    expect(Faculty.findByPk).toHaveBeenCalledWith(1);
    expect(mockFaculty.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('deleteFaculty throws an error if faculty does not exist', async () => {
    Faculty.findByPk.mockResolvedValue(null);
    await expect(FacultyService.deleteFaculty(1)).rejects.toThrow('Faculty not found');
  });
});
