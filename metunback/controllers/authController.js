const authService = require('../services/authService');

// ✅ REGISTER
exports.signup = async (req, res) => {
  try {
    const newUser = await authService.signup(req.body);
    res.status(201).json({ message: "User registered successfully", userId: newUser.user_id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { user, isVerified, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: "Login successful", isVerified, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
};

// ✅ REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { user, isVerified, accessToken } = await authService.refreshAccessToken(req.cookies.refresh_token);
    res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.json({ message: "Access token refreshed", accessToken, isVerified, user: { userId: user.user_id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
};

// ✅ CHECK
exports.check = (req, res) => res.json({ authenticated: true, user: req.user });

// ✅ ME
exports.me = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user_id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: "Logout successful" });
};
