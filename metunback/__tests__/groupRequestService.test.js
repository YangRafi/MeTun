const groupRequestService = require('../services/groupRequestService');

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

const models = require('../models');
const { GroupJoinRequest, GroupMember } = models;

describe('GroupRequestService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('requestJoin creates a new join request', async () => {
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

  test('requestJoin throws an error if user is already a member', async () => {
    GroupMember.findOne.mockResolvedValue({});
    await expect(groupRequestService.requestJoin(1, 2))
      .rejects.toThrow('Już jesteś członkiem tej grupy');
  });

  test('requestJoin throws an error if request already exists', async () => {
    GroupMember.findOne.mockResolvedValue(null);
    GroupJoinRequest.findOne.mockResolvedValue({});
    await expect(groupRequestService.requestJoin(1, 2))
      .rejects.toThrow('Prośba już wysłana');
  });

  test('inviteUser creates an invitation', async () => {
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

  test('inviteUser throws an error if invitation already exists', async () => {
    GroupJoinRequest.findOne.mockResolvedValue({});
    await expect(groupRequestService.inviteUser(1, 2, 3))
      .rejects.toThrow('Użytkownik już został zaproszony');
  });

  test('respondToRequest accepts a join request', async () => {
    const requestMock = {
      request_id: 1,
      group_id: 2,
      user_id: 3,
      save: jest.fn(),
      status: 'pending'
    };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);
    GroupMember.create.mockResolvedValue({});

    const result = await groupRequestService.respondToRequest(1, 'accept');
    expect(result).toBe(true);
    expect(GroupMember.create).toHaveBeenCalledWith({ group_id: 2, user_id: 3 });
    expect(requestMock.status).toBe('accepted');
    expect(requestMock.save).toHaveBeenCalled();
  });

  test('respondToRequest rejects a join request', async () => {
    const requestMock = { request_id: 1, save: jest.fn(), status: 'pending' };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);

    const result = await groupRequestService.respondToRequest(1, 'rejected');
    expect(result).toBe(true);
    expect(requestMock.status).toBe('rejected');
    expect(requestMock.save).toHaveBeenCalled();
  });

  test('respondToRequest throws an error if request does not exist', async () => {
    GroupJoinRequest.findByPk.mockResolvedValue(null);
    await expect(groupRequestService.respondToRequest(1, 'accept'))
      .rejects.toThrow('Nie znaleziono prośby');
  });

  test('respondToRequest throws an error for invalid action', async () => {
    const requestMock = { request_id: 1, save: jest.fn(), status: 'pending' };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);
    await expect(groupRequestService.respondToRequest(1, 'invalid'))
      .rejects.toThrow('Nieprawidłowa akcja');
  });

  test('deleteInvite deletes an invitation', async () => {
    const inviteMock = { destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(inviteMock);

    const result = await groupRequestService.deleteInvite(1);
    expect(result).toBe(true);
    expect(inviteMock.destroy).toHaveBeenCalled();
  });

  test('deleteInvite throws an error if invitation does not exist', async () => {
    GroupJoinRequest.findOne.mockResolvedValue(null);
    await expect(groupRequestService.deleteInvite(1))
      .rejects.toThrow('Nie znaleziono zaproszenia');
  });

  test('getJoinRequests returns a list of join requests', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);

    const result = await groupRequestService.getJoinRequests(1);
    expect(result).toEqual(mockList);
  });

  test('getGroupInvites returns invitations for a group', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);

    const result = await groupRequestService.getGroupInvites(2);
    expect(result).toEqual(mockList);
  });

  test('getPendingRequestsForUser returns pending requests', async () => {
    const mockList = [{ request_id: 1 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);

    const result = await groupRequestService.getPendingRequestsForUser(3);
    expect(result).toEqual(mockList);
  });

  test('getAllRequests returns all requests', async () => {
    const mockList = [{ request_id: 1 }, { request_id: 2 }];
    GroupJoinRequest.findAll.mockResolvedValue(mockList);

    const result = await groupRequestService.getAllRequests();
    expect(result).toEqual(mockList);
    expect(GroupJoinRequest.findAll).toHaveBeenCalled();
  });

  test('deleteRequest deletes request when user is the author', async () => {
    const reqMock = { user_id: 1, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    const result = await groupRequestService.deleteRequest(1, 1, false);
    expect(result).toBe(true);
    expect(reqMock.destroy).toHaveBeenCalled();
  });

  test('deleteRequest deletes request when user is an admin', async () => {
    const reqMock = { user_id: 2, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    const result = await groupRequestService.deleteRequest(1, 1, true);
    expect(result).toBe(true);
    expect(reqMock.destroy).toHaveBeenCalled();
  });

  test('deleteRequest throws an error if request does not exist', async () => {
    GroupJoinRequest.findOne.mockResolvedValue(null);
    await expect(groupRequestService.deleteRequest(1, 1, true))
      .rejects.toThrow('Nie znaleziono prośby');
  });

  test('deleteRequest throws an error if user has no permissions', async () => {
    const reqMock = { user_id: 2, destroy: jest.fn() };
    GroupJoinRequest.findOne.mockResolvedValue(reqMock);

    await expect(groupRequestService.deleteRequest(1, 1, false))
      .rejects.toThrow('Brak uprawnień');
  });

  test('respondToRequest throws an error if request has already been accepted', async () => {
    const requestMock = { request_id: 1, status: 'accepted', save: jest.fn() };
    GroupJoinRequest.findByPk.mockResolvedValue(requestMock);

    await expect(groupRequestService.respondToRequest(1, 'accept'))
      .rejects.toThrow('Request został już zaakceptowany i nie może być zmieniony');
  });
});
