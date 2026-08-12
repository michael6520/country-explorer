const PEXELS_API_KEY = 'GD96mCJ27DLJCfiXZ9zXLvLnv8d5wxZCvxuHmjdkQZ0c4wrGNxXxKbcZ';

const params = new URLSearchParams(window.location.search);
const code = params.get('country');

fetch(`https://countries.dev/alpha/${code}?fields=name,region,capital,flag,population,area,currencies,languages,borders,alpha3Code`)
  .then(res => res.json())
  .then(data => {
    renderCountryDetail(data);
    renderBorders(data.borders);
    setupSaveButton(data);
    renderGalleryImages(data.name);
  })
  .catch(err => console.error('Failed to fetch country:', err));

function renderCountryDetail(country) {
  document.querySelector('.detail__name').textContent = country.name;
  document.querySelector('.detail__meta').textContent = `${country.region} · ${country.capital}`;

  const statValues = document.querySelectorAll('.stat-row dd');
  statValues[0].textContent = country.population.toLocaleString();
  statValues[1].textContent = `${country.area.toLocaleString()} km²`;
  statValues[2].textContent = country.languages.map(lang => lang.name).join(', ');
  statValues[3].textContent = country.currencies.map(cur => `${cur.name} (${cur.symbol})`).join(', ');
}

function renderBorders(borderCodes) {
  const container = document.querySelector('.detail__borders');

  if (borderCodes === undefined) {
    container.textContent = 'Borders: No data available';
    return;
  }

  const borderFetches = borderCodes.map(code =>
    fetch(`https://countries.dev/alpha/${code}?fields=name,alpha3Code,independent`).then(res => res.json())
  );

  Promise.all(borderFetches)
    .then(neighbors => {
      const sovereignNeighbors = neighbors.filter(n => n.independent);

      if (sovereignNeighbors.length === 0) {
        container.textContent = 'Borders: none (no sovereign neighbors)';
        return;
      }

      container.innerHTML = 'Borders: ' + sovereignNeighbors
        .map(n => `<a href="detail.html?country=${n.alpha3Code}">${n.name}</a>`)
        .join(', ');
    })
    .catch(err => console.error('Failed to fetch border countries:', err));
}

function getImageCache() {
  return JSON.parse(localStorage.getItem('pexelsImageCache')) || {};
}

function setImageCache(cache) {
  localStorage.setItem('pexelsImageCache', JSON.stringify(cache));
}

function getThumbCache() {
  return JSON.parse(localStorage.getItem('pexelsThumbCache')) || {};
}

function setThumbCache(cache) {
  localStorage.setItem('pexelsThumbCache', JSON.stringify(cache));
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

async function getCountryThumbnails(countryName) {
  const cache = getThumbCache();

  if (cache[countryName] !== undefined) {
    return cache[countryName];
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(countryName + ' landscape')}&per_page=4`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const urls = (data.photos ?? []).slice(1, 4).map(p => p.src.medium);

    cache[countryName] = urls;
    setThumbCache(cache);
    return urls;
  } catch (err) {
    console.error(`Failed to fetch thumbnails for ${countryName}:`, err);
    return [];
  }
}

async function renderGalleryImages(countryName) {
  const mainEl = document.querySelector('.gallery-main');
  const thumbEls = document.querySelectorAll('.gallery-thumb');

  const mainUrl = await getCountryImage(countryName);
  if (mainUrl) {
    mainEl.style.backgroundImage = `url('${mainUrl}')`;
    mainEl.textContent = '';
  }

  const thumbUrls = await getCountryThumbnails(countryName);
  thumbEls.forEach((thumb, i) => {
    if (thumbUrls[i]) {
      thumb.style.backgroundImage = `url('${thumbUrls[i]}')`;
    }
  });
}

function isSaved(code) {
  const saved = JSON.parse(localStorage.getItem('savedCountries')) || [];
  return saved.includes(code);
}

function toggleSaved(code) {
  let saved = JSON.parse(localStorage.getItem('savedCountries')) || [];

  if (saved.includes(code)) {
    saved = saved.filter(c => c !== code);
  } else {
    saved.push(code);
  }

  localStorage.setItem('savedCountries', JSON.stringify(saved));
  return saved.includes(code);
}

function setupSaveButton(country) {
  const btn = document.querySelector('.save-btn');

  updateSaveButtonUI(btn, isSaved(country.alpha3Code));

  btn.addEventListener('click', () => {
    const nowSaved = toggleSaved(country.alpha3Code);
    updateSaveButtonUI(btn, nowSaved);
  });
}

function updateSaveButtonUI(btn, saved) {
  btn.classList.toggle('save-btn--active', saved);
  btn.textContent = saved ? 'Saved' : 'Save';
}