const adminService = require('../../services/adminService');
const { User, University, UserUniversity, Group } = require('../../models');

jest.mock('../models', () => ({
  User: { count: jest.fn(), findAll: jest.fn() },
  University: { count: jest.fn(), findAll: jest.fn() },
  UserUniversity: { count: jest.fn() },
  Group: { count: jest.fn() }
}));

describe('AdminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboardData returns correct statistics and lists', async () => {
    User.count.mockResolvedValue(10);
    UserUniversity.count.mockResolvedValue(7);
    University.count.mockResolvedValue(3);
    Group.count.mockResolvedValue(5);

    const mockUsers = [
      { user_id: 1, name: 'Jan', surname: 'Kowalski', email: 'jan@test.com', role: 'user' },
      { user_id: 2, name: 'Anna', surname: 'Nowak', email: 'anna@test.com', role: 'admin' }
    ];
    User.findAll.mockResolvedValue(mockUsers);

    const mockUniversities = [
      { university_id: 1, university_name: 'Politechnika Białostocka' },
      { university_id: 2, university_name: 'Uniwersytet Warszawski' }
    ];
    University.findAll.mockResolvedValue(mockUniversities);

    const result = await adminService.getDashboardData();

    expect(result.stats).toEqual({
      users: 10,
      verified: 7,
      universities: 3,
      groups: 5
    });
    expect(result.users).toEqual(mockUsers);
    expect(result.universities).toEqual(mockUniversities);

    expect(User.count).toHaveBeenCalled();
    expect(UserUniversity.count).toHaveBeenCalledWith({ where: { status: 'approved' } });
    expect(University.count).toHaveBeenCalled();
    expect(Group.count).toHaveBeenCalled();
    expect(User.findAll).toHaveBeenCalledWith({
      attributes: ['user_id', 'name', 'surname', 'email', 'role'],
      order: [['user_id', 'ASC']]
    });
    expect(University.findAll).toHaveBeenCalledWith({
      attributes: ['university_id', 'university_name'],
      order: [['university_name', 'ASC']]
    });
  });

  test('getDashboardData obsługuje błąd', async () => {
    User.count.mockRejectedValue(new Error('DB error'));
    await expect(adminService.getDashboardData()).rejects.toThrow('DB error');
  });
});
