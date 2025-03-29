const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Veritabanı bağlantısı
const sequelize = new Sequelize({
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false, // Veritabanı sorgularını loglama
});

// Veritabanı bağlantısını doğrulama
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

module.exports = sequelize;
