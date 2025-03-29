const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');
const verifyAdminToken = require('../middlewares/verifyAdminToken');




router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔐 Tüm kullanıcıları getir (sadece admin erişebilir)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'firma_adi',
        'email',
        'is_verified',
        'is_active',
        'plan',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(users);
  } catch (err) {
    console.error('ADMIN /users error:', err);
    res.status(500).json({ error: 'Kullanıcılar alınamadı' });
  }
});

module.exports = router;
