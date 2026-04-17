const ChatService = require('../services/chatService');
const { UserMatch, Profile, Message, Group, User } = require('../models');
const { Op } = require('sequelize');

jest.mock('../models', () => ({
  UserMatch: { findAll: jest.fn(), findOne: jest.fn() },
  Profile: { findOne: jest.fn() },
  Message: { findOne: jest.fn(), findAll: jest.fn() },
  Group: { findAll: jest.fn(), findOne: jest.fn() },
  User: jest.fn()
}));

describe('ChatService', () => {
  afterEach(() => jest.clearAllMocks());

  test('getPrivateChats returns a list of private chats', async () => {
    const mockMatches = [
      {
        match_id: 1,
        user_id_1: 1,
        user_id_2: 2,
        match_active: true,
        user1: { user_id: 1, name: 'Alice', profile_picture: null },
        user2: { user_id: 2, name: 'Bob', profile_picture: null }
      }
    ];
    UserMatch.findAll.mockResolvedValue(mockMatches);
    Message.findOne.mockResolvedValue({ content: 'Hi', timestamp: 100 });

    const result = await ChatService.getPrivateChats(1);
    expect(UserMatch.findAll).toHaveBeenCalled();
    expect(result[0]).toEqual(expect.objectContaining({
      id: 1,
      type: 'private',
      user_id: 2,
      name: 'Bob',
      lastMessage: 'Hi'
    }));
  });

  test('getGroupChats returns a list of group chats', async () => {
    const mockGroups = [
      {
        group_id: 1,
        group_name: 'Group A',
        profile_picture: null,
        members: [{ user_id: 1, name: 'Alice' }]
      }
    ];
    Group.findAll.mockResolvedValue(mockGroups);
    Message.findOne.mockResolvedValue({ content: 'Hello', timestamp: 200 });

    const result = await ChatService.getGroupChats(1);
    expect(Group.findAll).toHaveBeenCalled();
    expect(result[0]).toEqual(expect.objectContaining({
      id: 1,
      type: 'group',
      name: 'Group A',
      lastMessage: 'Hello'
    }));
  });

  test('getMessages returns private messages', async () => {
    const matchMock = {
      match_id: 1,
      user_id_1: 1,
      user_id_2: 2,
      match_active: true,
      user1: { user_id: 1, profile_picture: 'pic1' },
      user2: { user_id: 2, profile_picture: 'pic2' }
    };
    const messagesMock = [
      { message_id: 1, sender_id: 1, receiver_id: 2, content: 'Hello', timestamp: 100 },
      { message_id: 2, sender_id: 2, receiver_id: 1, content: 'Hi', timestamp: 200 }
    ];
    UserMatch.findOne.mockResolvedValue(matchMock);
    Message.findAll.mockResolvedValue(messagesMock);

    const result = await ChatService.getMessages(1, 'private', 1);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(expect.objectContaining({ senderAvatar: 'pic1', content: 'Hello' }));
    expect(result[1]).toEqual(expect.objectContaining({ senderAvatar: 'pic2', content: 'Hi' }));
  });

  test('getMessages throws an error for private chat when access is denied', async () => {
    UserMatch.findOne.mockResolvedValue(null);
    await expect(ChatService.getMessages(1, 'private', 1)).rejects.toThrow('Access denied');
  });

  test('getMessages returns group messages', async () => {
    const groupMock = { 
      group_id: 1, 
      members: [{ user_id: 1 }],
      group_name: 'Group A'
    };
    const messagesMock = [
      { message_id: 1, sender_id: 2, content: 'Hello', timestamp: 100 }
    ];
    const profileMock = { profile_picture: 'pic2' };

    Group.findOne.mockResolvedValue(groupMock);
    Message.findAll.mockResolvedValue(messagesMock);
    Profile.findOne.mockResolvedValue(profileMock);

    const result = await ChatService.getMessages(1, 'group', 1);
    expect(result[0]).toEqual(expect.objectContaining({ senderAvatar: 'pic2', content: 'Hello' }));
  });

  test('getMessages throws an error for group chat when user is not a member', async () => {
    Group.findOne.mockResolvedValue(null);
    await expect(ChatService.getMessages(1, 'group', 1)).rejects.toThrow('Access denied');
  });

  test('getMessages throws an error for invalid chat type', async () => {
    await expect(ChatService.getMessages(1, 'invalid', 1)).rejects.toThrow('Invalid chat type');
  });
});
