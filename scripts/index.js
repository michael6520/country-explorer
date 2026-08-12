const PEXELS_API_KEY = 'GD96mCJ27DLJCfiXZ9zXLvLnv8d5wxZCvxuHmjdkQZ0c4wrGNxXxKbcZ'

let allCountries = [];
let selectedRegion = localStorage.getItem('selectedRegion') || null;
let savedOnly = localStorage.getItem('savedOnly') === 'true';

fetch('https://countries.dev/countries?fields=name,region,capital,flag,population,area,currencies,languages,borders,independent,alpha3Code')
  .then(res => res.json())
  .then(data => {
    allCountries = data.filter(country => country.independent);
    setupSearch()
    setupRegionDropdown(allCountries);
    setupReloadButton();
    setupSurpriseButton();
    setupSavedToggle();
    renderRandomCards();
  })
  .catch(err => console.error('Failed to fetch countries:', err));

function setupSearch() {
  const input = document.querySelector('.toolbar__search input');
  input.addEventListener('input', applyFilters);
}

function setupRegionDropdown(countries) {
  const regions = [...new Set(countries.map(c => c.region))].sort();
  const menu = document.querySelector('.dropdown-menu');
  const btn = document.querySelector('.dropdown-btn');

  const allOption = `<li data-region="">All Regions</li>`;
  const regionOptions = regions.map(region =>
    `<li data-region="${region}">${region}</li>`
  ).join('');
  menu.innerHTML = allOption + regionOptions;

  btn.childNodes[0].textContent = (selectedRegion || 'Region') + ' ';

  btn.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LI') return;
    selectedRegion = e.target.dataset.region || null;

    if (selectedRegion) {
      localStorage.setItem('selectedRegion', selectedRegion);
    } else {
      localStorage.removeItem('selectedRegion');
    }

    btn.childNodes[0].textContent = (selectedRegion || 'Region') + ' ';
    menu.hidden = true;
    applyFilters();
  });
}


function setupReloadButton() {
  const btn = document.querySelector('.reload-btn');

  btn.addEventListener('click', () => {
    renderRandomCards();
  });
}

function setupSurpriseButton() {
  const btn = document.querySelector('.surprise-btn');

  btn.addEventListener('click', () => {
    const randomOne = getRandomCountries(allCountries, 1)[0];
    window.location.href = `detail.html?country=${randomOne.alpha3Code}`;
  });
}

function applyFilters() {
  const query = document.querySelector('.toolbar__search input').value.trim().toLowerCase();
  const reloadBtn = document.querySelector('.reload-btn');
  const pool = getFilteredPool();

  if (query === '') {
    reloadBtn.hidden = savedOnly;
    renderRandomCards();
  } else {
    reloadBtn.hidden = true;
    const matches = pool.filter(c => c.name.toLowerCase().includes(query));
    renderCountryCards(matches);
  }
}

function renderRandomCards() {
  const pool = getFilteredPool();
  const randomEight = getRandomCountries(pool, 8);
  renderCountryCards(randomEight);
}

function getRandomCountries(countries, count) {
  const shuffled = [...countries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function renderCountryCards(countries) {
  const container = document.querySelector('.country-grid');
  container.innerHTML = '';

  countries.forEach(country => {
    const card = document.createElement('a');
    card.className = 'country-card';
    card.href = `detail.html?country=${country.alpha3Code}`;
    card.innerHTML = `
      <span class="country-card__flag">${country.flag}</span>
      <span class="country-card__name">${country.name}</span>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `detail.html?country=${country.alpha3Code}`;
    });

    container.appendChild(card);

    getCountryImage(country.name).then(url => {
      if (url) {
        card.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('${url}')`;
      }
    });
  });
}

function getImageCache() {
  return JSON.parse(localStorage.getItem('pexelsImageCache')) || {};
}

function setImageCache(cache) {
  localStorage.setItem('pexelsImageCache', JSON.stringify(cache));
}

async function getCountryImage(countryName) {
  const cache = getImageCache();

  if (cache[countryName] !== undefined) {
    return cache[countryName];
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(countryName + ' landscape')}&per_page=1`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const url = data.photos?.[0]?.src?.large ?? null;

    cache[countryName] = url;
    setImageCache(cache);
    return url;
  } catch (err) {
    console.error(`Failed to fetch image for ${countryName}:`, err);
    return null;
  }
}

function getFilteredPool() {
  let pool = selectedRegion
    ? allCountries.filter(c => c.region === selectedRegion)
    : allCountries;

  if (savedOnly) {
    const saved = JSON.parse(localStorage.getItem('savedCountries')) || [];
    pool = pool.filter(c => saved.includes(c.alpha3Code));
  }

  return pool;
}

function setupSavedToggle() {
  const btn = document.querySelector('.saved-btn');

  btn.classList.toggle('saved-btn--active', savedOnly);

  btn.addEventListener('click', () => {
    savedOnly = !savedOnly;
    localStorage.setItem('savedOnly', savedOnly);
    btn.classList.toggle('saved-btn--active', savedOnly);
    applyFilters();
  });
}