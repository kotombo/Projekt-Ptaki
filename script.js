// Główna funkcja uruchamiana po załadowaniu strony
document.addEventListener('DOMContentLoaded', function () {
  // Formularz do przesyłania jednego zdjęcia
  const form = document.getElementById('upload-form');
  const spinner = document.getElementById('loading-spinner');
  const resultBox = document.getElementById('api-response');


  // Obsługa przełącznika języka PL/EN
  const langSelect = document.getElementById('language-select');
  langSelect?.addEventListener('change', (e) => {
    const lang = e.target.value;
    const text = {
      pl: { title: 'Wgraj zdjęcie ptaka, aby rozpocząć identyfikację', button: 'Zidentyfikuj', loading: 'Przetwarzanie zdjęcia...', error: 'Nie udało się rozpoznać ptaka.', download: 'Pobierz notatnik' },
      en: { title: 'Upload a bird photo to start identification', button: 'Identify', loading: 'Processing image...', error: 'Bird could not be identified.', download: 'Download notebook' }
    };
    document.querySelector('#home h2').textContent = text[lang].title;
    document.querySelector('#upload-form button').textContent = text[lang].button;
    spinner.textContent = text[lang].loading;
    resultBox.setAttribute('data-error', text[lang].error);
    downloadBtn.textContent = text[lang].download;
  });

  // Przycisk pobierania pliku tekstowego z wynikami
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Pobierz notatnik';
  downloadBtn.style.marginTop = '1em';
  downloadBtn.addEventListener('click', () => {
    const single = localStorage.getItem('notatnik_single') || '';
    const batch = localStorage.getItem('notatnik_batch') || '';
    const combined = single + batch;
    if (!combined.trim()) return;

    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notatnik.txt';
    a.click();
    URL.revokeObjectURL(url);
    localStorage.removeItem('notatnik_single');
    localStorage.removeItem('notatnik_batch');
  });
  resultBox.parentElement.appendChild(downloadBtn);

  if (!form) return;

  // Obsługa wysyłki zdjęcia do API po kliknięciu „Zidentyfikuj”
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    spinner.classList.remove('hidden');
    resultBox.innerHTML = '';

    const fileInput = document.getElementById('bird-photo');
    const formData = new FormData();
    const selectedFile = fileInput.files[0];
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/api/identify', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      spinner.classList.add('hidden');

      if (result.results && result.results.length > 0) {
        const sorted = result.results.sort((a, b) => {
          const aScore = a.vision_score || a.combined_score || 0;
          const bScore = b.vision_score || b.combined_score || 0;
          return bScore - aScore;
        });

        // Formatowanie wyników
        const listItems = sorted.map((r) => {
          const rawScore = r.vision_score || r.combined_score;
          const percentText = typeof rawScore === 'number' ? `${Math.round(rawScore)}%` : 'Brak danych';
          const name = r.taxon.name;
          const photoUrl = r.taxon.default_photo?.medium_url || '';
          const wikiUrl = r.taxon.wikipedia_url || '#';
          const engName = r.taxon.preferred_common_name || r.taxon.name || 'brak'
          const latinName = r.taxon.name || 'brak'
          

          const nameLink = wikiUrl !== '#' 
            ? `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer">${engName}</a>` 
            : engName;

          const image = photoUrl
            ? `<img src="${photoUrl}" alt="${engName}" class="result-image" />`
            : '';

          return `<li>${image}<div class="result-info">${nameLink} "${name}" (${percentText})</div></li>`;
        }).join('');

        resultBox.innerHTML = `<ol>${listItems}</ol>`;

        // Zapis najlepszego wyniku do localStorage
        const best = sorted[0];
        const fullName = selectedFile.name || 'brak_nazwy';
        const fileName = fullName.replace(/\.[^/.]+$/, '');
        const engName = best.taxon.preferred_common_name || best.taxon.name || 'brak';
        const latinName = best.taxon.name || 'brak';
        const score = Math.round(best.vision_score || best.combined_score || 0);
        const line = `${fileName};${engName};${latinName};${score}\n`;

        const prev = localStorage.getItem('notatnik_single') || '';
        localStorage.setItem('notatnik_single', prev + line);

      } else {
        resultBox.textContent = resultBox.getAttribute('data-error') || 'Nie udało się rozpoznać ptaka.';
      }

    } catch (err) {
      spinner.classList.add('hidden');
      resultBox.textContent = '❌ Błąd połączenia z serwerem.';
      console.error("Błąd:", err);
    }
  });
});

// Obsługa widgetu opinii
const feedbackToggle = document.createElement('button');
feedbackToggle.id = 'feedback-toggle';
feedbackToggle.textContent = 'Zostaw opinię';

const feedbackForm = document.createElement('div');
feedbackForm.id = 'feedback-form';
feedbackForm.classList.add('hidden');

const feedbackTextarea = document.createElement('textarea');
feedbackTextarea.id = 'feedback-text';
feedbackTextarea.placeholder = 'Twoja opinia...';

// Sekcja gwiazdek + przycisk w jednej linii
const starsRow = document.createElement('div');
starsRow.className = 'stars-row';

const starsGroup = document.createElement('div');
starsGroup.className = 'stars-group';

// dodajemy gwiazdki od 5 do 1
for (let i = 5; i >= 1; i--) {
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = 'stars';
  input.id = `star${i}`;
  input.value = i;

  const label = document.createElement('label');
  label.htmlFor = `star${i}`;
  label.textContent = '★';

  starsGroup.appendChild(input);
  starsGroup.appendChild(label);
}


const feedbackSubmit = document.createElement('button');
feedbackSubmit.id = 'feedback-submit';
feedbackSubmit.textContent = 'Wyślij';

starsRow.appendChild(starsGroup);
starsRow.appendChild(feedbackSubmit);

feedbackForm.appendChild(feedbackTextarea);
feedbackForm.appendChild(starsRow);

const feedbackWidget = document.createElement('div');
feedbackWidget.id = 'feedback-widget';
feedbackWidget.appendChild(feedbackToggle);
feedbackWidget.appendChild(feedbackForm);

document.body.appendChild(feedbackWidget);

feedbackToggle.addEventListener('click', () => {
  feedbackForm.classList.toggle('hidden');
});

feedbackSubmit.addEventListener('click', async () => {
  const text = feedbackTextarea.value.trim();
  const stars = document.querySelector('input[name="stars"]:checked')?.value;

  if (!text || !stars) {
    alert('Uzupełnij opinię i liczbę gwiazdek.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, stars })
    });

    if (response.ok) {
      alert('Dziękujemy za opinię!');
      feedbackTextarea.value = '';
      feedbackForm.classList.add('hidden');
      document.querySelector(`input[name="stars"]:checked`).checked = false;
    } else {
      alert('Błąd podczas zapisu opinii.');
    }
  } catch (err) {
    console.error('Błąd:', err);
    alert('Błąd połączenia z serwerem.');
  }
});
