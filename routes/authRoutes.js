const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'ret@inx_secret_key_2025';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// REGISTER
router.post('/register', async (req, res) => {
    const {
        firma_adi, email, password,
        vergi_no, telefon, adres, yetkili_kisi
    } = req.body;

    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email zaten kayıtlı' });

        const password_hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            firma_adi,
            email,
            password_hash,
            vergi_no,
            telefon,
            adres,
            yetkili_kisi
        });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '1d'
        });

        res.status(201).json({
            message: 'Kayıt başarılı',
            user: {
                id: user.id,
                email: user.email,
                firma_adi: user.firma_adi,
                is_verified: user.is_verified
            },
            token
        });
    } catch (err) {
        console.error('REGISTER ERROR:', err);
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Şifre hatalı' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'E-posta doğrulaması yapılmamış.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                email: user.email,
                firma_adi: user.firma_adi
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
    }
});

router.post('/send-code', async (req, res) => {
    try {
      // 🛡️ Token'dan email al
      const authHeader = req.headers.authorization
      if (!authHeader) return res.status(401).json({ error: 'Token eksik' })
  
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      const email = decoded.email
  
      const user = await User.findOne({ where: { email } })
      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
  
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await user.update({ verification_code: code })
  
      await transporter.sendMail({
        from: '"RetainX" <noreply@retainx.com>',
        to: email,
        subject: 'E-posta Doğrulama Kodunuz',
        html: `<p>Merhaba,</p><p>Doğrulama kodunuz: <strong>${code}</strong></p>`
      })
  
      res.json({ message: 'Kod gönderildi' })
    } catch (err) {
      console.error('SEND-CODE ERROR:', err)
      res.status(500).json({ error: 'Kod gönderilemedi' })
    }
  })

router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    if (user.verification_code === code) {
        await user.update({ is_verified: true, verification_code: null });
        return res.json({ message: '✅ E-posta doğrulandı.' });
    }

    res.status(400).json({ error: 'Kod hatalı' });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await user.update({ password_reset_code: resetCode });

    await transporter.sendMail({
        from: '"RetainX" <noreply@retainx.com>',
        to: email,
        subject: 'Şifre Sıfırlama Kodu',
        html: `<p>Merhaba,</p><p>Şifre sıfırlama kodunuz: <strong>${resetCode}</strong></p>`
    });

    res.json({ message: 'Şifre sıfırlama kodu gönderildi' });
});

router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı yok' });

    if (user.password_reset_code === code) {
        return res.json({ message: 'Kod doğru. Şifre sıfırlanabilir.' });
    }

    res.status(400).json({ error: 'Kod hatalı' });
});

router.post('/reset-password', async (req, res) => {
    const { email, newPassword, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    if (user.password_reset_code !== code) {
        return res.status(400).json({ error: 'Kod hatalı' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await user.update({
        password_hash,
        password_reset_code: null // kodu sıfırla
    });

    res.json({ message: 'Şifre başarıyla sıfırlandı.' });
});


module.exports = router;