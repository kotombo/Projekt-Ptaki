const express = require('express');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer();
app.use(cors());

// 🔑 Wstaw swój token tutaj (jeśli masz):
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjo5MTA0NzcxLCJleHAiOjE3NDQxNDUzOTR9.6PZp-K6_pz1zF_RSo9tkEuBrssWVTl99NzGUmv3tWaUcWlwGKfSxE35aolgm9Fj5cEeoIcM_s5rIuW5-tttkgw'; // np. 'Bearer eyJ0eXAiOiJK...'

// Możesz też ustawić własną nazwę aplikacji (zalecane przez iNaturalist):
const USER_AGENT = 'kotombo/1.0 (kotomboo@gmail.com)';

app.post('/api/identify', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;

    const form = new FormData();
    form.append('image', imageBuffer, 'bird.jpg');

    const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
      method: 'POST',
      headers: {
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : undefined,
        'User-Agent': USER_AGENT
      },
      body: form,
    });

    const data = await response.json();
    console.log("🔥 Odpowiedź z API:");
    console.dir(data, { depth: null });

    res.json(data);
  } catch (error) {
    console.error('Błąd podczas rozpoznawania ptaka:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas rozpoznawania zdjęcia.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Serwer działa na http://localhost:${PORT}`));

