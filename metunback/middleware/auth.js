const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticate = async (req, res, next) => {
  let token = req.cookies.access_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // próbujemy zweryfikować access token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // jeśli access token wygasł, próbujemy odświeżyć
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      const user = await User.findByPk(payload.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // generujemy nowy access token
      const newAccessToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      // ustawiamy cookie
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      });

      req.user = { userId: user.user_id, email: user.email, role: user.role };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  }
};

// middleware admina nie zmieniamy, bo teraz req.user.role będzie aktualna
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: "Brak uprawnień" });
};
