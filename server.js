// server.js - Serwer obsługujący żądania do API iNaturalist

const express = require('express');
const multer = require('multer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs'); // Moduł do operacji na plikach (obecnie nieużywany, może zostać usunięty)

const app = express();
const upload = multer();
app.use(cors());

// Token API iNaturalist – wymagany do autoryzacji (należy go trzymać w .env w prawdziwej aplikacji)
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjo5MTEzMTgxLCJleHAiOjE3NDQ3NDIxMjF9.qIzSOYduvD_KeK1N01I7YqZ_szZ1eBP_qyXIDWQ232tivZx9xbjFkU_hF5kzeH7FfpgApqHejTJ8jrFNwlbpJA';

// Nagłówek User-Agent zgodny z wymaganiami iNaturalist
const USER_AGENT = 'kornad/1.0 (loll70760@gmail.com)';

// Endpoint obsługujący przesłane zdjęcie i przesyłający je do iNaturalist
app.post('/api/identify', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer; // Bufor obrazu z formularza

    // Przygotowanie formularza do wysyłki
    const form = new FormData();
    form.append('image', imageBuffer, 'bird.jpg');

    // Wywołanie zewnętrznego API iNaturalist
    const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
      method: 'POST',
      headers: {
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : undefined,
        'User-Agent': USER_AGENT
      },
      body: form,
    });

    const data = await response.json();

    // (opcjonalne) Sortowanie wyników wg trafności
    const sortedResults = data.results.sort((a, b) => {
      const aScore = a.vision_score || a.combined_score || 0;
      const bScore = b.vision_score || b.combined_score || 0;
      return bScore - aScore;
    });

    // Wysłanie danych do klienta (frontend)
    res.json(data);
  } catch (error) {
    console.error('Błąd podczas rozpoznawania ptaka:', error);
  }
});

// Uruchomienie serwera na porcie 3001
const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Serwer działa na http://localhost:${PORT}`));
