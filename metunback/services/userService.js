const { User, UserMatch, GroupMember, UserUniversity, Message } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { getIo, userSockets } = require('../util/socket');

class UserService {

  // -----------------------
  // GETTERS
  // -----------------------
  async getAllUsers() {
    return User.findAll({
      attributes: { exclude: ['password'] }
    });
  }

  async getUserById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
  }

  // -----------------------
  // CREATE USER
  // -----------------------
  async createUser(data) {
    const { name, surname, email, password } = data;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword
    });

    const { password: _, ...safeUser } = newUser.toJSON();
    return safeUser;
  }

  // -----------------------
  // CHANGE PASSWORD
  // -----------------------
  async changePassword(id, currentPassword, newPassword) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Wrong current password");

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return true;
  }

  // -----------------------
  // UPDATE USER DATA
  // -----------------------
  async updateUser(id, data) {
    const { name, surname, email, password } = data;

    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) throw new Error("Email already in use");
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (surname !== undefined) user.surname = surname;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();
    const { password: _, ...safeUser } = user.toJSON();

    return safeUser;
  }

  // -----------------------
  // DELETE USER
  // -----------------------
  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.destroy();

    // 🔥 socket event
    const io = getIo();
    const socket = userSockets.get(Number(id));
    if (io && socket) io.to(socket).emit('account_deleted');

    return true;
  }

  // Delete own account
  async deleteMe(id) {
    return this.deleteUser(id);
  }

  // -----------------------
  // STATS
  // -----------------------
  async getStats(userId) {
    const matchesCount = await UserMatch.count({
      where: {
        match_active: true,
        [Op.or]: [
          { user_id_1: userId },
          { user_id_2: userId }
        ]
      }
    });

    const groupsCount = await GroupMember.count({
      where: { user_id: userId }
    });

    const universitiesCount = await UserUniversity.count({
      where: { user_id: userId, status: 'approved' }
    });

    const messagesCount = await Message.count({
      where: { sender_id: userId }
    });

    const user = await User.findByPk(userId);

    return {
      matchesCount,
      groupsCount,
      universitiesCount,
      messagesCount,
      hasTrial: user.has_trial
    };
  }

  // -----------------------
  // CHANGE EMAIL
  // -----------------------
  async changeEmail(userId, newEmail) {
    if (!newEmail) throw new Error("Email is required");

    const existing = await User.findOne({ where: { email: newEmail } });
    if (existing) throw new Error("Email already in use");

    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    user.email = newEmail;
    await user.save();

    const { password, ...safeUser } = user.toJSON();
    return safeUser;
  }

  // -----------------------
  // CHANGE ROLE
  // -----------------------
  async changeUserRole(id, role) {
    if (!['user', 'admin'].includes(role)) throw new Error("Invalid role");

    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    user.role = role;
    await user.save();

    const io = getIo();
    const socket = userSockets.get(Number(id));
    if (io && socket) io.to(socket).emit('role_changed', { role });

    return true;
  }

  // -----------------------
  // BAN / UNBAN
  // -----------------------
  async banUser(id, days) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    const until = new Date(Date.now() + (days || 1) * 86400000);

    user.is_banned = true;
    user.banned_until = until;
    await user.save();

    const io = getIo();
    const socket = userSockets.get(Number(id));
    if (io && socket) io.to(socket).emit('user_banned', { until });

    return until;
  }

  async unbanUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    user.is_banned = false;
    user.banned_until = null;
    await user.save();

    const io = getIo();
    const socket = userSockets.get(Number(id));
    if (io && socket) io.to(socket).emit('user_unbanned');

    return true;
  }
}

module.exports = new UserService();
