const express = require('express');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');  // Zaimportowanie modułu fs

const app = express();
const upload = multer();
app.use(cors());

// 🔑 Wstaw swój token tutaj (jeśli masz):
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjo5MTEzMTgxLCJleHAiOjE3NDQzMDU5Njh9.JxK9EdMEP02SCCAyPcxWu-d3-nLB-VbcHTFiO0GgAvKSH0mYI8D6_KdXBFQfQrZfXRDok_Z5RxW0jH9bV9IF_w';

// Możesz też ustawić własną nazwę aplikacji (zalecane przez iNaturalist):
const USER_AGENT = 'kornad/1.0 (loll70760@gmail.com)';

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
    
    // Sortowanie wyników według punktacji malejąco
    const sortedResults = data.results.sort((a, b) => {
      const aScore = a.vision_score || a.combined_score || 0;
      const bScore = b.vision_score || b.combined_score || 0;
      return bScore - aScore;
    });




    // Zwrócenie odpowiedzi na frontend
    res.json(data);
  } catch (error) {
    console.error('Błąd podczas rozpoznawania ptaka:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas rozpoznawania zdjęcia.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Serwer działa na http://localhost:${PORT}`));

