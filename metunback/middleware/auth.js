const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticate = async (req, res, next) => {
  let token = req.cookies.access_token;

  const verifyUser = async (decoded) => {
    const user = await User.findByPk(decoded.userId);
    if (!user) throw new Error("User not found");
    await authService.handleBan(user);
    const isVerified = await authService.checkIsVerified(user.user_id);
    req.user = { userId: user.user_id, name: user.name, email: user.email, role: user.role, isVerified };
  };

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await verifyUser(decoded);
    next();
  } catch (err) {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      await verifyUser(payload);

      const newAccessToken = jwt.sign({ userId: req.user.userId, email: req.user.email, role: req.user.role }, JWT_SECRET, { expiresIn: "15m" });
      res.cookie('access_token', newAccessToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: "Brak uprawnień" });
};
