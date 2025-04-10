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
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjo5MTA0NzcxLCJleHAiOjE3NDQzNzEyMDN9.aqPtlVP830WIqPJOJbuJCe12pUz-zyRWDr4t5SGFFdhm7QgNkuOSpm6m9w4sNq1XcXgljK4ty-3PZw-PhQyGKg';

// Nagłówek User-Agent zgodny z wymaganiami iNaturalist
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
    
    // Sortowanie wyników według punktacji malejąco
    
    const sortedResults = data.results.sort((a, b) => {
      const aScore = a.vision_score || a.combined_score || 0;
      const bScore = b.vision_score || b.combined_score || 0;
      return bScore - aScore;
    });

    // Pobranie ptaka z najwyższą punktacją
    const bestResult = sortedResults[0];
    const bestBirdName = bestResult.taxon.name;
    const bestBirdScore = bestResult.vision_score || bestResult.combined_score;

    // Przygotowanie treści do zapisania w pliku
    const resultText = `${bestBirdName}, ${Math.round(bestBirdScore)}%\n`;

    // Zapisanie wyniku do pliku .txt
    fs.appendFile('bird_identification_result.txt', resultText, (err) => {
      if (err) {
        console.error('Błąd podczas zapisywania pliku:', err);
        return res.status(500).json({ error: 'Błąd podczas zapisywania pliku z wynikiem.' });
      }
      console.log('Wynik zapisano do pliku bird_identification_result.txt');
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

