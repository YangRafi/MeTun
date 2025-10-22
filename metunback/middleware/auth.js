const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserUniversity = require('../models/UserUniversity');
const JWT_SECRET = process.env.JWT_SECRET;

// helper do sprawdzenia isVerified
const checkIsVerified = async (userId) => {
  const userUnis = await UserUniversity.findAll({ where: { user_id: userId } });
  return userUnis.some(u => u.trial || u.status === 'approved');
};

exports.authenticate = async (req, res, next) => {
  let token = req.cookies.access_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const handleUser = async (user) => {
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Sprawdzenie bana
    if (user.is_banned) {
      const now = new Date();
      if (user.banned_until && user.banned_until > now) {
        return res.status(403).json({ 
          error: `Twoje konto jest zbanowane do ${user.banned_until.toISOString()}` 
        });
      } else {
        user.is_banned = false;
        user.banned_until = null;
        await user.save();
      }
    }

    const isVerified = await checkIsVerified(user.user_id);

    console.log(`[AUTH] User: ${user.email}, role: ${user.role}, isVerified: ${isVerified}`);

    req.user = { 
      userId: user.user_id, 
      email: user.email, 
      role: user.role, 
      isVerified 
    };
  };

  try {
    // próbujemy zweryfikować access token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    await handleUser(user);
    return next();
  } catch (err) {
    // jeśli access token wygasł, próbujemy odświeżyć
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      const user = await User.findByPk(payload.userId);

      await handleUser(user);

      // generujemy nowy access token
      const newAccessToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      });

      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  }
};

// middleware admina
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: "Brak uprawnień" });
};
