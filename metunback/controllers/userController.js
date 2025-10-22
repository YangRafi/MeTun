const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { getIo, userSockets } = require('../util/socket'); // ✅ import socketów

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// CREATE user
exports.createUser = async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword
    });

    const { password: _, ...safeUser } = newUser.toJSON();
    res.status(201).json(safeUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, surname, email, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: "Email already in use" });
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (surname !== undefined) user.surname = surname;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    const { password: _, ...safeUser } = user.toJSON();
    res.json(safeUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.destroy();

    // 🔥 powiadom użytkownika, jeśli był zalogowany
    const io = getIo();
    const userSocket = userSockets.get(Number(id));
    if (io && userSocket) {
      io.to(userSocket).emit('account_deleted');
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// CHANGE user role
exports.changeUserRole = async (req, res) => {
  try {
    const id = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = role;
    await user.save();

    // 🔥 wysyłamy event socketowy do użytkownika
    const io = getIo();
    const userSocket = userSockets.get(Number(id));
    if (io && userSocket) {
      io.to(userSocket).emit('role_changed', { role });
      console.log(`📢 Wysłano event 'role_changed' do user ${id}`);
    }

    res.json({ message: `User role changed to ${role}` });
  } catch (err) {
    console.error("Error changing role:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// BAN user
exports.banUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { days } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const untilDate = new Date(Date.now() + (days || 1) * 24 * 60 * 60 * 1000);

    user.is_banned = true;       // ✅ tutaj jest snake_case
    user.banned_until = untilDate; // ✅ tutaj też

    await user.save();

    // 🔥 wyślij info o banie
    const io = getIo();
    const userSocket = userSockets.get(Number(id));
    if (io && userSocket) {
      io.to(userSocket).emit('user_banned', { until: untilDate });
      console.log(`🚫 Wysłano event 'user_banned' do user ${id}`);
    }

    res.json({ message: `User banned until ${untilDate.toISOString()}` });
  } catch (err) {
    console.error("Error banning user:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// UNBAN user
exports.unbanUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);

    if (!user) return res.status(404).json({ error: "User not found" });

    user.is_banned = false;
    user.banned_until = null;
    await user.save();

    // 🔥 powiadom odbanowanego
    const io = getIo();
    const userSocket = userSockets.get(Number(id));
    if (io && userSocket) {
      io.to(userSocket).emit('user_unbanned');
      console.log(`✅ Wysłano event 'user_unbanned' do user ${id}`);
    }

    res.json({ message: "User unbanned" });
  } catch (err) {
    console.error("Error unbanning user:", err);
    res.status(500).json({ error: "Server error" });
  }
};
