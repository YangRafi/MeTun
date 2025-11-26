const groupRequestService = require('../services/groupRequestService');

// -----------------------------
// MOCK MODELI
// -----------------------------
jest.mock('../models', () => ({
  User: jest.fn(),
  Profile: jest.fn(),
  Group: jest.fn(),
  GroupMember: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn()
  },
  GroupJoinRequest: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

// Bezpośredni import zmockowanych modeli
const models = require('../models');
const { GroupJoinRequest, GroupMember } = models;

describe('GroupRequestService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------
  // requestJoin
  // --------------------------
  test('requestJoin tworzy nową prośbę', async () => {
    GroupMember.findOne.mockResolvedValue(null);
    GroupJoinRequest.findOne.mockResolvedValue(null);
    const mockReq = { request_id: 1 };
    GroupJoinRequest.create.mockResolvedValue(mockReq);

    const result = await groupRequestService.requestJoin(1, 2);
    expect(result).toEqual(mockReq);
    expect(GroupJoinRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      group_id: 2,
      sender_id: 1,
      user_id: 1,
      type: 'request',
      status: 'pending'
    }));
  });

  test('requestJoin rzuca błąd jeśli użytkownik jest członkiem', async () => {
    GroupMember.findOne.mockResolvedValue({});
    await expect(groupRequestService.requestJoin(1, 2))
      .rejects.toThrow('Już jesteś członkiem tej grupy');
  });

  test('requestJoin rzuca błąd jeśli prośba już istnieje', async () => {
    GroupMember.findOne.mockResolvedValue(null);
    GroupJoinRequest.findOne.mockResolvedValue({});
    await expect(groupRequestService.requestJoin(1, 2))
      .rejects.toThrow('Prośba już wysłana');
  });

  // --------------------------
  // inviteUser
  // --------------------------
  test('inviteUser tworzy zaproszenie', async () => {
    GroupJoinRequest.findOne.mockResolvedValue(null);
    const mockInvite = { request_id: 1 };
    GroupJoinRequest.create.mockResolvedValue(mockInvite);

    const result = await groupRequestService.inviteUser(1, 2, 3);
    expect(result).toEqual(mockInvite);
    expect(GroupJoinRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      group_id: 2,
      sender_id: 1,
      user_id: 3,
      type: 'invite',
      status: 'pending'
    }));
  });

  test('inviteUser rzuca błąd jeśli już wysłano zaproszenie', async () => {
    GroupJoinRequest.findOne.mockResolvedValue({});
    await expect(groupRequestService.inviteUser(1, 2, 3))
      .rejects.toThrow('Użytkownik już został zaproszony');
  });

  // --------------------------
  // respondToRequest
  // --------------------------
  test('respondToRequest akceptuje prośbę', async () => {
    const requestMock = { request_id: 1, group_id: 2, user_id: 3, save: jest.fn(), status: 'pending' };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);
    GroupMember.create.mockResolvedValue({});

    const result = await groupRequestService.respondToRequest(1, 'accept');
    expect(result).toBe(true);
    expect(GroupMember.create).toHaveBeenCalledWith({ group_id: 2, user_id: 3 });
    expect(requestMock.status).toBe('accepted');
    expect(requestMock.save).toHaveBeenCalled();
  });

  test('respondToRequest odrzuca prośbę', async () => {
    const requestMock = { request_id: 1, save: jest.fn(), status: 'pending' };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);

    const result = await groupRequestService.respondToRequest(1, 'rejected');
    expect(result).toBe(true);
    expect(requestMock.status).toBe('rejected');
    expect(requestMock.save).toHaveBeenCalled();
  });

  test('respondToRequest rzuca błąd jeśli brak prośby', async () => {
    GroupJoinRequest.findByPk.mockResolvedValue(null);
    await expect(groupRequestService.respondToRequest(1, 'accept'))
      .rejects.toThrow('Nie znaleziono prośby');
  });

  test('respondToRequest rzuca błąd dla niepoprawnej akcji', async () => {
    const requestMock = { request_id: 1, save: jest.fn(), status: 'pending' };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);
    await expect(groupRequestService.respondToRequest(1, 'invalid'))
      .rejects.toThrow('Nieprawidłowa akcja');
  });

  // --------------------------
  // deleteInvite
  // --------------------------
  test('deleteInvite usuwa zaproszenie', async () => {
    const inviteMock = { destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(inviteMock);

    const result = await groupRequestService.deleteInvite(1);
    expect(result).toBe(true);
    expect(inviteMock.destroy).toHaveBeenCalled();
  });

  test('deleteInvite rzuca błąd jeśli brak zaproszenia', async () => {
    GroupJoinRequest.findOne.mockResolvedValue(null);
    await expect(groupRequestService.deleteInvite(1))
      .rejects.toThrow('Nie znaleziono zaproszenia');
  });

  // --------------------------
  // getJoinRequests
  // --------------------------
  test('getJoinRequests zwraca listę requestów', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);
    const result = await groupRequestService.getJoinRequests(1);
    expect(result).toEqual(mockList);
  });

  // --------------------------
  // getGroupInvites
  // --------------------------
  test('getGroupInvites zwraca zaproszenia dla grupy', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);
    const result = await groupRequestService.getGroupInvites(2);
    expect(result).toEqual(mockList);
  });

  // --------------------------
  // getPendingRequestsForUser
  // --------------------------
  test('getPendingRequestsForUser zwraca pending requests', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);
    const result = await groupRequestService.getPendingRequestsForUser(3);
    expect(result).toEqual(mockList);
  });

  // --------------------------
  // getAllRequests
  // --------------------------
  test('getAllRequests zwraca wszystkie requesty', async () => {
    const mockList = [{ request_id: 1 }, { request_id: 2 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);

    const result = await groupRequestService.getAllRequests();
    expect(result).toEqual(mockList);
    expect(GroupJoinRequest.findAll).toHaveBeenCalled();
  });

  // --------------------------
  // deleteRequest
  // --------------------------
  test('deleteRequest usuwa request gdy user jest autorem', async () => {
    const reqMock = { user_id: 1, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    const result = await groupRequestService.deleteRequest(1, 1, false);
    expect(result).toBe(true);
    expect(reqMock.destroy).toHaveBeenCalled();
  });

  test('deleteRequest usuwa request gdy user jest adminem', async () => {
    const reqMock = { user_id: 2, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    const result = await groupRequestService.deleteRequest(1, 1, true);
    expect(result).toBe(true);
    expect(reqMock.destroy).toHaveBeenCalled();
  });

  test('deleteRequest rzuca błąd jeśli request nie istnieje', async () => {
    GroupJoinRequest.findOne.mockResolvedValue(null);
    await expect(groupRequestService.deleteRequest(1, 1, true))
      .rejects.toThrow('Nie znaleziono prośby');
  });

  test('deleteRequest rzuca błąd jeśli user nie ma uprawnień', async () => {
    const reqMock = { user_id: 2, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    await expect(groupRequestService.deleteRequest(1, 1, false))
      .rejects.toThrow('Brak uprawnień');
  });

  // --------------------------
  // respondToRequest - już zaakceptowany
  // --------------------------
  test('respondToRequest rzuca błąd jeśli request już zaakceptowany', async () => {
    const requestMock = { request_id: 1, status: 'accepted', save: jest.fn() };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);

    await expect(groupRequestService.respondToRequest(1, 'accept'))
      .rejects.toThrow('Request został już zaakceptowany i nie może być zmieniony');
  });
});
