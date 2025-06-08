// Główna funkcja uruchamiana po załadowaniu strony
document.addEventListener('DOMContentLoaded', function () {
  // Formularz do przesyłania jednego zdjęcia
  const form = document.getElementById('upload-form');
  const spinner = document.getElementById('loading-spinner');
  const resultBox = document.getElementById('api-response');

  const toggle = document.getElementById('extended-analysis-toggle');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const analysisContent = document.getElementById('modal-content');

  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

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
        const best = sorted[0];
        const engName = best.taxon.preferred_common_name || best.taxon.name || '—';
        const latinName = best.taxon.name || '—';
        const description = best.taxon.wikipedia_summary || 'Brak opisu.';

        // Jeśli przełącznik aktywny, pokaż modal rozszerzonej analizy
				if (toggle.checked && best) {
				// helper rekurencyjny do renderowania pól
				// helper rekurencyjny z ograniczeniem głębokości i pomijaniem tablic
				function renderFields(obj, path = []) {
				    let html = '';
				    for (const [key, val] of Object.entries(obj)) {
				        const fullKey = [...path, key].join('.');
				        // jeśli to tablica
				        if (Array.isArray(val)) {
				            // sprawdź czy zawiera same prymitywy
				            const allPrimitive = val.every(item => item === null || ['string','number','boolean'].includes(typeof item));
				            if (allPrimitive) {
				                // wyrenderuj jako lista wartości
				                html += `<p><strong>${fullKey}:</strong> [${val.join(', ')}]</p>`;
				            } else {
				                // dalej pomijamy głęboki render zagnieżdżonych obiektów
				                html += `<p><strong>${fullKey}:</strong> [array, ${val.length} elementów]</p>`;
				            }
				            continue;
				        }
				        // obiekt - rekurencja
				        if (val !== null && typeof val === 'object') {
				            html += `<h4 style="margin-top:1em">${fullKey}</h4>`;
				            html += renderFields(val, [...path, key]);
				        } else {
				            // prymitywna wartość
				            const safeVal = (val === undefined || val === null || val === '')
				              ? '—'
				              : String(val);
				            html += `<p><strong>${fullKey}:</strong> ${safeVal}</p>`;
				        }
				    }
				    return html;
				}


				    // renderujemy TYLKO obiekt best
				    const fullHtml = renderFields(best);

				    analysisContent.innerHTML = `
				        <div style="max-height:60vh; overflow:auto; padding-right:1em">
				            ${fullHtml}
				        </div>
				    `;
				    modal.classList.remove('hidden');
				}
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
        const fullName = selectedFile.name || 'brak_nazwy';
        const fileName = fullName.replace(/\.[^/.]+$/, '');
        const score = Math.round(best.vision_score || best.combined_score || 0);
        const timestamp = new Date().toISOString();
        const line = `${timestamp};${fileName};${engName};${latinName};${score}\n`;

        const prev = localStorage.getItem('notatnik_single') || '';
        localStorage.setItem('notatnik_single', line + prev);

        // Anegdota: pobierz z backendu
const anecdoteBox = document.createElement('div');
anecdoteBox.id = 'anecdote-box';
anecdoteBox.classList.add('anecdote');
anecdoteBox.textContent = 'Pobieranie anegdoty...';
resultBox.appendChild(anecdoteBox);

try {
  const anecdoteRes = await fetch('http://localhost:3001/api/anegdota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birdName: engName })
  });

  const anecdoteData = await anecdoteRes.json();
 anecdoteBox.innerHTML = anecdoteData.anecdote
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => `<p>${line}</p>`)
  .join('');
} catch (err) {
  anecdoteBox.textContent = 'Nie udało się pobrać anegdoty.';
}


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

// Tryb jasny/ciemny
// funkcja do przełączenia motywu
  function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark')) {
      body.classList.remove('dark');
      body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.remove('light');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else if (savedTheme === 'light') {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      // Opcjonalnie: ustaw domyślny motyw, np. light
      document.body.classList.add('light');
    }
  });
