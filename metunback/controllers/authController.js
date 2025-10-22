const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES = "15m"; // krótki czas życia
const JWT_REFRESH_EXPIRES = "7d"; // dłuższy czas życia

// REGISTER
exports.signup = async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, surname, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully", userId: newUser.user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while signing up" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid email or password" });

    // ✅ access token
    const accessToken = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES }
    );

    // ✅ refresh token
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES }
    );

    // ustaw cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while logging in" });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.cookies;
    if (!refresh_token) return res.status(401).json({ error: "No refresh token" });

    const payload = jwt.verify(refresh_token, JWT_SECRET);
    const user = await User.findByPk(payload.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newAccessToken = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES }
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// CHECK
exports.check = (req, res) => {
  res.json({ authenticated: true, user: req.user });
};

// ME
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['user_id', 'name', 'surname', 'email', 'role']
    });
    if (!user) return res.status(404).json({ error: "User not found" });
     const response = {
      user_id: user.user_id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      isVerified: req.user.isVerified
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: "Logout successful" });
};
