const matchService = require('../services/matchService');
const { UserMatch, Profile, UserUniversity, University, Faculty, Discipline, User } = require('../models');
const { emitNewMatch, getIo } = require('../util/socket');
const { Op } = require('sequelize');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models', () => ({
  UserMatch: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Profile: { findAll: jest.fn() },
  UserUniversity: jest.fn(),
  University: jest.fn(),
  Faculty: jest.fn(),
  Discipline: jest.fn(),
  User: jest.fn()
}));

jest.mock('../util/socket', () => ({
  emitNewMatch: jest.fn(),
  getIo: jest.fn()
}));

describe('MatchService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // GET POTENTIAL MATCHES
  // --------------------------
  test('getPotentialMatches filtruje profile', async () => {
    const userId = 1;
    const filters = { gender: 'female' };
    const profileMock = {
      user_id: 2,
      name: 'Alice',
      date_of_birth: new Date('2000-01-01'),
      gender: 'female',
      bio: 'bio',
      profile_picture: null,
      images: [],
      User: {
        UserUniversities: [
          { status: 'approved', trial: false, University: { university_name: 'Uni' }, Faculty: { faculty_name: 'F' }, Discipline: { name: 'D' } }
        ]
      }
    };
    Profile.findAll.mockResolvedValue([profileMock]);
    UserMatch.findAll.mockResolvedValue([]);

    const result = await matchService.getPotentialMatches(userId, filters);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  // --------------------------
  // VOTE USER - nowy match
  // --------------------------
  test('voteUser tworzy nowy match jeśli nie istnieje', async () => {
    UserMatch.findOne.mockResolvedValue(null);
    UserMatch.create.mockResolvedValue({});

    const result = await matchService.voteUser(1, 2, true);

    expect(result).toEqual({ matchActive: false, matchJustActivated: false });
    expect(UserMatch.create).toHaveBeenCalled();
  });

  // --------------------------
  // VOTE USER - aktualizacja match
  // --------------------------
  test('voteUser aktywuje match jeśli obie osoby polubiły się', async () => {
    const matchMock = {
      user_id_1: 1,
      user_id_2: 2,
      user_1_like: true,
      user_2_like: true,
      match_active: false,
      match_date: new Date(),
      save: jest.fn()
    };
    UserMatch.findOne.mockResolvedValue(matchMock);

    const result = await matchService.voteUser(2, 1, true);

    expect(result.matchActive).toBe(true);
    expect(result.matchJustActivated).toBe(true);
    expect(matchMock.save).toHaveBeenCalled();
    expect(emitNewMatch).toHaveBeenCalledWith(1, 2, expect.any(Object));
  });

  // --------------------------
  // UNLIKE USER
  // --------------------------
  test('unlikeUser ustawia match_active na false i emituje socket', async () => {
    const matchMock = {
      match_id: 123,
      user_id_1: 1,
      user_id_2: 2,
      user_1_like: true,
      user_2_like: true,
      match_active: true,
      destroy: jest.fn(), // <- dodane, aby test nie padał
    };
    UserMatch.findOne.mockResolvedValue(matchMock);

    const emitMock = jest.fn();
    const toMock = jest.fn(() => ({ emit: emitMock }));
    getIo.mockReturnValue({ to: toMock });

    const result = await matchService.unlikeUser(1, 123);

    expect(matchMock.destroy).toHaveBeenCalled();
    expect(toMock).toHaveBeenCalledWith(2);
    expect(emitMock).toHaveBeenCalledWith('match_removed', { matchId: 123 });
    expect(result).toEqual({ success: true });
  });

  test('unlikeUser rzuca błąd jeśli match nie istnieje', async () => {
    UserMatch.findOne.mockResolvedValue(null);
    await expect(matchService.unlikeUser(1, 123)).rejects.toMatchObject({ status: 404 });
  });
});
