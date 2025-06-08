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
const API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjo5MTA0NzcxLCJleHAiOjE3NDk0ODg4MTN9.uKRwpmzREaqmJ2YHP2uGVB5m1YLIVjs02QU24vGQh_aStI0MoJiyWf1NVLag-b1whlhHiI1TDdh8d_fksOmSkQ';

// Nagłówek User-Agent zgodny z wymaganiami iNaturalist kotomba
const USER_AGENT = 'kotombo/1.0 (kotomboo@gmail.com)';

// Nagłówek User-Agent zgodny z wymaganiami iNaturalist kornada
// const USER_AGENT = 'kornad/1.0 (loll70760@gmail.com)';


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
const path = require('path');

// Endpoint do zapisu opinii do pliku feedback.txt
app.use(express.json());
app.post('/api/feedback', (req, res) => {
  const { text, stars } = req.body;
  if (!text || !stars) return res.status(400).send('Brak danych');

  const entry = `[${new Date().toISOString()}] ${stars}⭐ - ${text}\n`;
  const filePath = path.join(__dirname, 'feedback.txt');
  
  fs.appendFile(filePath, entry, (err) => {
    if (err) {
      console.error('Błąd zapisu opinii:', err);
      return res.status(500).send('Błąd serwera');
    }
    res.status(200).send('Opinia zapisana');
  });
});


// Endpoint do pobierania anegdoty z Hugging Face
app.post('/api/anegdota', async (req, res) => {
  const { birdName } = req.body;
  if (!birdName) return res.status(400).send('Brak nazwy ptaka');

  try {
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', {

      method: 'POST',
      headers: {
        'Authorization': 'Twoj token', 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `Write exactly 3 informative and natural-sounding sentences in Polish as a fun fact or interesting anecdote about the bird species "${birdName}". The tone should be friendly and 
        educational. Do not include the prompt, any explanations in the output and do not use "example:" ,only the three Polish sentences.`,

        parameters: { max_new_tokens: 300, temperature: 0.7, do_sample: true }
      })
    });

    const json = await hfResponse.json();
    console.log('HF RESPONSE:', json);
    const raw = json[0]?.generated_text || '';
const output = raw.replace(`Write exactly 3 informative and natural-sounding sentences in Polish as a fun fact or interesting anecdote about the bird species "${birdName}". The tone should be friendly and 
        educational. Do not include the prompt, any explanations in the output and do not use "example:" ,only the three Polish sentences.`, '').trim();

    res.json({ anecdote: output });

  } catch (err) {
    console.error('Błąd pobierania anegdoty:', err);
    res.status(500).send('Błąd serwera przy pobieraniu anegdoty');
  }
});



// Uruchomienie serwera na porcie 3001
const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Serwer działa na http://localhost:${PORT}`));
