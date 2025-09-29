const jwt = require('jsonwebtoken');
const JWT_SECRET = "supersecretkey";

exports.authenticate = (req, res, next) => {
  const token = req.cookies.token; // odczytujemy token z cookie
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};