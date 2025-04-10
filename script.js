// Główna funkcja uruchamiana po załadowaniu strony
document.addEventListener('DOMContentLoaded', function () {
  // Formularz do przesyłania jednego zdjęcia
  const form = document.getElementById('upload-form');
  const spinner = document.getElementById('loading-spinner');
  const resultBox = document.getElementById('api-response');

  // Przełącznik trybu jasny/ciemny
  const themeBtn = document.getElementById('toggle-theme');
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  // Funkcja do zmiany trybu i zapisania go w localStorage
  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  themeBtn?.addEventListener('click', toggleTheme);
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

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
        localStorage.setItem('notatnik_single', line);

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
