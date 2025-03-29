const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const adminRoutes = require('./routes/adminRoutes');
const Admin = require('./models/admin');
const bcrypt = require('bcrypt');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Modern JSON parse

// Rotalar
app.use('/api/admin', adminRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);


// Sync ve server başlat
sequelize.sync({ alter: true }).then(async () => {
  // Admin kayıtlı değilse ekle
  const existing = await Admin.findOne({ where: { username: 'admin' } });
  if (!existing) {
    const hashed = await bcrypt.hash('3!xR#9qL^8mZ@1wP', 12);
    await Admin.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hashed
    });
    console.log('✅ Admin kullanıcısı oluşturuldu');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  });
});
