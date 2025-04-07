# 🐦 Bird Identifier

Aplikacja webowa do rozpoznawania gatunków ptaków na podstawie zdjęcia.  
Wykorzystuje publiczne API serwisu [iNaturalist](https://api.inaturalist.org/v1/docs).

## ✨ Funkcje

- 🔍 Wysyłanie zdjęcia i analiza z wykorzystaniem AI
- 📊 Sortowanie wyników według trafności (`vision_score`)
- 🌗 Tryb jasny / ciemny z pamięcią ustawień (localStorage)
- 🌐 Obsługa języków: polski / angielski (również zapamiętywana)
- 🖼️ Miniatury rozpoznanych ptaków i linki do Wikipedii


## 🧱 Struktura projektu
bird-identifier/ 
├── index.html ← strona główna (rozpoznawanie) 
├── authors.html ← podstrona z autorami 
├── style.css ← wspólny plik stylów 
├── script.js ← logika frontendowa ├── server.js ← backend (Node.js + Express)


## 🚀 Jak uruchomić projekt lokalnie

1. **Zainstaluj zależności (Node.js wymagany):**

```bash

npm install


```

2 Uruchom backend:

```bash

npm init -y
npm install express multer node-fetch form-data cors
node server.js


```

3 Otwórz frontend:

Po prostu otwórz plik index.html w przeglądarce.
(Backend działa domyślnie na http://localhost:3001)

## 🛠️ Wymagania
Node.js (v14+)

Przeglądarka obsługująca JS + fetch + localStorage

## 👥 Autorzy
Mateusz Rutkowski

Konrad Typa

ChatGPT – wsparcie programistyczne, UX i optymalizacja

## 📄 Licencja
MIT – używaj, modyfikuj, rozwijaj!


