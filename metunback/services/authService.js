const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserUniversity = require('../models/UserUniversity');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '7d';

// helper: sprawdzenie czy użytkownik jest zweryfikowany
const checkIsVerified = async (userId) => {
  const userUnis = await UserUniversity.findAll({ where: { user_id: userId } });
  return userUnis.some(u => u.trial || u.status === 'approved');
};

// helper: sprawdzenie bana
const handleBan = async (user) => {
  if (!user.is_banned) return;
  const now = new Date();
  if (user.banned_until && user.banned_until > now) {
    throw new Error(`Twoje konto jest zbanowane do ${user.banned_until.toISOString()}`);
  } else {
    user.is_banned = false;
    user.banned_until = null;
    await user.save();
  }
};

// ✅ register
const signup = async ({ name, surname, email, password }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ name, surname, email, password: hashedPassword });
  return newUser;
};

// ✅ login
const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  await handleBan(user);
  const isVerified = await checkIsVerified(user.user_id);

  const accessToken = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

  return { user, isVerified, accessToken, refreshToken };
};

// ✅ refresh token
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token');
  const payload = jwt.verify(refreshToken, JWT_SECRET);

  const user = await User.findByPk(payload.userId);
  if (!user) throw new Error('User not found');

  await handleBan(user);
  const isVerified = await checkIsVerified(user.user_id);

  const newAccessToken = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
  return { user, isVerified, accessToken: newAccessToken };
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  checkIsVerified,
  handleBan
};
