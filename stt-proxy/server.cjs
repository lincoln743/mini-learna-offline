require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'tmp') });

app.use(cors());

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/stt/transcribe', upload.single('audio'), async (req, res) => {
  let uploadedPath = null;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY não configurada.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de áudio não enviado.' });
    }

    uploadedPath = req.file.path;

    const form = new FormData();
    form.append('file', fs.createReadStream(uploadedPath), {
      filename: req.file.originalname || 'recording.m4a',
      contentType: req.file.mimetype || 'audio/m4a',
    });
    form.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
    form.append('response_format', 'json');

    const apiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: data.error?.message || 'Erro no provedor STT.',
        raw: data,
      });
    }

    return res.json({
      text: (data.text || '').trim(),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro interno no proxy STT.',
    });
  } finally {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, '0.0.0.0', () => {
  console.log(`STT proxy rodando em http://0.0.0.0:${port}`);
});
