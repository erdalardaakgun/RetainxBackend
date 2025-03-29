const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

// Multer ayarı – geçici upload klasörü
const upload = multer({ dest: 'uploads/' });

/**
 * 🔹 Tekli tahmin – JSON ile prediction
 * POST /api/ai/get-churn-prediction
 */
router.post('/get-churn-prediction', async (req, res) => {
  try {
    const flaskRes = await axios.post(
      'http://localhost:5000/predict',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(flaskRes.data);
  } catch (error) {
    console.error('🔥 Tekli tahmin hatası:', error.message);
    res.status(500).json({
      error: 'Tekli tahmin yapılamadı',
      detail: error.message
    });
  }
});

/**
 * 🔹 Çoklu tahmin – CSV upload
 * POST /api/ai/bulk-upload
 */
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // CSV dosyasını Flask'a yollamak için FormData oluştur
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const flaskRes = await axios.post(
      'http://localhost:5000/bulk-predict',
      form,
      {
        headers: form.getHeaders(),
        responseType: 'arraybuffer' // CSV binary veri
      }
    );

    // Flask'tan dönen CSV response'u direkt client'a döndür
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=retainx_churn_output.csv'
    });

    res.send(flaskRes.data);

    // Dosya sil (optional)
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('🔥 CSV tahmin hatası:', error.message);
    res.status(500).json({
      error: 'Toplu tahmin yapılamadı',
      detail: error.message
    });
  }
});

module.exports = router;
