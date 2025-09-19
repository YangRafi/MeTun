const User = require('../models/User');
const bcrypt = require('bcryptjs'); // do hashowania haseł

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // ukryj hasło
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

    // check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword
    });

    // don't return password
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
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error" });
  }
};