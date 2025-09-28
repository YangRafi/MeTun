const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, surname, email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: 'Email i hasło są wymagane' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email już istnieje' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, surname, email, password: hashedPassword });

    const { password: _, ...safeUser } = newUser.toJSON();
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Niepoprawne hasło' });

    const token = jwt.sign({ id: user.id }, 'TWOJ_SECRET_KEY', { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
