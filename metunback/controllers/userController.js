const userService = require('../services/userService');

exports.getAllUsers = async (req, res) => {
  try {
    res.json(await userService.getAllUsers());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.params.id, req.body.currentPassword, req.body.newPassword);
    res.json({ message: "Password changed" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    res.json(await userService.updateUser(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    await userService.deleteMe(req.user.userId);
    res.json({ message: "Account deleted" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    res.json(await userService.getStats(req.user.userId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const user = await userService.changeEmail(req.user.userId, req.body.email);
    res.json({ message: "Email changed", user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    await userService.changeUserRole(req.params.id, req.body.role);
    res.json({ message: "Role updated" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const until = await userService.banUser(req.params.id, req.body.days);
    res.json({ message: `User banned until ${until.toISOString()}` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    await userService.unbanUser(req.params.id);
    res.json({ message: "User unbanned" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
