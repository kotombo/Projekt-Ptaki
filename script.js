document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('upload-form');
    const spinner = document.getElementById('loading-spinner');
    const resultBox = document.getElementById('api-response');
  
 
    // 3. Tryb jasny/ciemny z localStorage
    const themeBtn = document.getElementById('toggle-theme');

    function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    }

    function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    themeBtn?.addEventListener('click', toggleTheme);

    // Ustaw domyślny motyw z localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

  
    // 8. Przełącznik języka
    const langSelect = document.getElementById('language-select');
    langSelect?.addEventListener('change', (e) => {
      const lang = e.target.value;
      const text = {
        pl: {
          title: 'Wgraj zdjęcie ptaka, aby rozpocząć identyfikację',
          button: 'Zidentyfikuj',
          loading: '⏳ Przetwarzanie zdjęcia...',
          error: 'Nie udało się rozpoznać ptaka.'
        },
        en: {
          title: 'Upload a bird photo to start identification',
          button: 'Identify',
          loading: '⏳ Processing image...',
          error: 'Bird could not be identified.'
        }
      };
  
      document.querySelector('#home h2').textContent = text[lang].title;
      document.querySelector('#upload-form button').textContent = text[lang].button;
      spinner.textContent = text[lang].loading;
      resultBox.setAttribute('data-error', text[lang].error);
    });
  
    if (!form) return;
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      spinner.classList.remove('hidden');
      resultBox.innerHTML = '';
  
      const fileInput = document.getElementById('bird-photo');
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
  
      try {
        const response = await fetch('http://localhost:3001/api/identify', {
          method: 'POST',
          body: formData
        });
  
        const result = await response.json();
        spinner.classList.add('hidden');
  
        if (result.results && result.results.length > 0) {
          // 5. Sortowanie według score malejąco
          const sorted = result.results.sort((a, b) => {
            const aScore = a.vision_score || a.combined_score || 0;
            const bScore = b.vision_score || b.combined_score || 0;
            return bScore - aScore;
          });
  
          const listItems = sorted.map((r) => {
            const rawScore = r.vision_score || r.combined_score;
            const percentText = typeof rawScore === 'number' ? `${Math.round(rawScore)}%` : 'Brak danych';
          
            const name = r.taxon.name;
            const photoUrl = r.taxon.default_photo?.medium_url || '';
            const wikiUrl = r.taxon.wikipedia_url || '#';
          
            const nameLink = wikiUrl !== '#' 
              ? `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer">${name}</a>` 
              : name;
          
            const image = photoUrl
              ? `<img src="${photoUrl}" alt="${name}" class="result-image" />`
              : '';
          
            return `<li>${image}<div class="result-info">${nameLink} (${percentText})</div></li>`;
          }).join('');
          
          resultBox.innerHTML = `<ol>${listItems}</ol>`;
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
  
  
  
  