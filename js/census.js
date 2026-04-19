// ─── CENSUS ACS YOUTH POPULATION LAYER (2024 5-Year Estimates) ───────────────
// Variables: B01001_006E male 15-17, B01001_007E male 18-19,
//            B01001_030E female 15-17, B01001_031E female 18-19

async function loadCensus() {
  showLoading('Connecting to US Census ACS 2024...');

  const vars = 'B01001_006E,B01001_007E,B01001_030E,B01001_031E';
  const url  = `${CENSUS_ACS_API}?get=NAME,${vars}&for=zip%20code%20tabulation%20area:*`;

  let res = null;
  for (const attempt of [url,
                         CORS_PROXY  + url,
                         CORS_PROXY2 + encodeURIComponent(url)]) {
    try {
      res = await fetchWithTimeout(attempt, 40000);
      if (res.ok) break;
    } catch { res = null; }
  }
  if (!res || !res.ok) throw new Error('Could not reach the Census ACS 2024 API. Check your internet connection.');

  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('Unexpected response from Census ACS API.');

  const header = raw[0];
  const iM15  = header.indexOf('B01001_006E');
  const iM18  = header.indexOf('B01001_007E');
  const iF15  = header.indexOf('B01001_030E');
  const iF18  = header.indexOf('B01001_031E');
  const iZip  = header.indexOf('zip code tabulation area');

  updateLoading('Matching youth population to locations...');

  // ── Build ZIP → coords from every available source ────────────────────────
  const zipCoords = {};

  // 1. NCES schools (centroid per ZIP — most comprehensive if loaded)
  if (layers.nces.data && layers.nces.data.length) {
    const acc = {};
    for (const s of layers.nces.data) {
      if (!s.zip) continue;
      if (!acc[s.zip]) acc[s.zip] = { latSum: 0, lngSum: 0, n: 0, city: s.city, state: s.state };
      acc[s.zip].latSum += s.lat;
      acc[s.zip].lngSum += s.lng;
      acc[s.zip].n++;
    }
    for (const [z, a] of Object.entries(acc)) {
      zipCoords[z] = { lat: a.latSum / a.n, lng: a.lngSum / a.n, city: a.city, state: a.state };
    }
  }

  // 2. JROTC schools
  if (layers.jrotc.data) {
    for (const s of layers.jrotc.data) {
      if (!s.zip || zipCoords[s.zip]) continue;
      if (isValidCoord(s.lat, s.lng))
        zipCoords[s.zip] = { lat: s.lat, lng: s.lng, city: s.city || '', state: s.state || '' };
    }
  }

  // 3. BSA councils
  if (layers.bsa.data) {
    for (const c of layers.bsa.data) {
      if (!c.zip || zipCoords[c.zip]) continue;
      if (isValidCoord(c.lat, c.lng))
        zipCoords[c.zip] = { lat: c.lat, lng: c.lng, city: c.city || '', state: c.state || '' };
    }
  }

  // 4. Geocoding cache from localStorage
  try {
    const cache = JSON.parse(localStorage.getItem('wpZipGeo_v2')) || {};
    for (const [z, c] of Object.entries(cache)) {
      if (!zipCoords[z] && isValidCoord(c.lat, c.lng)) zipCoords[z] = c;
    }
  } catch {}

  // ── Parse ACS rows ────────────────────────────────────────────────────────
  const records = [];
  for (let i = 1; i < raw.length; i++) {
    const row  = raw[i];
    const zip  = normalizeZip(row[iZip]);
    if (!zip) continue;

    const m15  = Math.max(0, parseInt(row[iM15], 10) || 0);
    const m18  = Math.max(0, parseInt(row[iM18], 10) || 0);
    const f15  = Math.max(0, parseInt(row[iF15], 10) || 0);
    const f18  = Math.max(0, parseInt(row[iF18], 10) || 0);
    const youth = m15 + m18 + f15 + f18;
    if (youth <= 0) continue;

    const coords = zipCoords[zip];
    if (!coords) continue;

    records.push({
      zip,
      lat:         coords.lat,
      lng:         coords.lng,
      city:        coords.city  || '',
      state:       coords.state || '',
      youth,
      male15_17:   m15,
      male18_19:   m18,
      female15_17: f15,
      female18_19: f18
    });
  }

  layers.census.data = records;
  document.getElementById('stat-census').textContent = `(${records.length.toLocaleString()})`;
  console.log(`Census: ${raw.length - 1} ZCTAs from API, ${Object.keys(zipCoords).length} coords available, ${records.length} matched`);
}

function renderCensus() {
  const data = layers.census.data;
  if (!data || !data.length) {
    console.warn('Census: no data to render', layers.census);
    return;
  }
  console.log(`Census: rendering ${data.length} ZIP records`);

  if (layers.census.heat && map.hasLayer(layers.census.heat)) {
    map.removeLayer(layers.census.heat);
  }
  layers.census.heat = null;

  // Log scale so rural/suburban areas aren't invisible next to dense metros
  const logMax = Math.log1p(Math.max(...data.map(r => r.youth)));

  layers.census.heat = L.heatLayer(
    data.map(r => [r.lat, r.lng, Math.log1p(r.youth) / logMax]),
    {
      radius: 12, blur: 15, maxZoom: 12, max: 1.0,
      gradient: {
        0.0: 'rgba(0,0,0,0)',
        0.3: 'rgba(146,64,14,0.4)',
        0.6: 'rgba(217,119,6,0.65)',
        1.0: 'rgba(253,224,71,0.85)'
      }
    }
  );

  if (layers.census.visible) showOnMap('census');
}
