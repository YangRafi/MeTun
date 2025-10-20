const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1h";

// REGISTER (signup)
exports.signup = async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      surname,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.user_id });
  } catch (err) {
    console.error("❌ Error in signup:", err);
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

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email,
        role: user.role  // dodajemy rolę
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ustawienie HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000 // 1h w ms
    });

    res.json({ message: "Login successful" }); // token nie jest wysyłany w body
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while logging in" });
  }
};

// CHECK
exports.check = (req, res) => {
  res.json({
    authenticated: true,
    user: req.user, // to co decode zwróciło z JWT
  });
};

// ME
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['user_id', 'name', 'surname', 'email', 'role']
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ Error in /me:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });
  res.json({ message: "Logout successful" });
};