const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ret@inx_secret_key_2025';

function verifyUserToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: 'Token eksik' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Artık req.user.id erişilebilir
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token geçersiz' });
  }
}

module.exports = verifyUserToken;
