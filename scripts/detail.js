const params = new URLSearchParams(window.location.search);
const code = params.get('country');

fetch(`https://countries.dev/alpha/${code}?fields=name,region,capital,flag,population,area,currencies,languages,borders,alpha3Code`)
  .then(res => res.json())
  .then(data => {
    renderCountryDetail(data);
    renderBorders(data.borders);
    setupSaveButton(data)
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
    container.textContent = 'Neighboring countries: information unavailable';
    return;
  }

  if (borderCodes.length === 0) {
    container.textContent = 'Borders: none (island nation)';
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