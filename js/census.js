// ─── CENSUS POPULATION ESTIMATES LAYER (2023 PEP, Ages 15-19 by County) ──────
// AGE=4 → 15-19 age group in the PEP characteristic/agegroups endpoint

const CENSUS_PEP_URL = 'https://api.census.gov/data/2023/pep/characteristic/agegroups';

async function loadCensus() {
  showLoading('Loading Census teen population estimates...');

  // ── 1. County centroids from GeoJSON ────────────────────────────────────────
  await ensureCountyGeoJSON();
  const centroids = {};
  for (const f of (countyGeoJSON?.features || [])) {
    const c = _geojsonCentroid(f.geometry);
    if (c) centroids[f.id] = c;
  }

  // ── 2. Fetch teen population (15–19) for every county ───────────────────────
  updateLoading('Fetching Census population estimates...');
  const url = `${CENSUS_PEP_URL}?get=NAME,POP,AGE&AGE=4&for=county:*`;

  let res = null;
  for (const attempt of [url, CORS_PROXY + encodeURIComponent(url), CORS_PROXY2 + encodeURIComponent(url)]) {
    try {
      res = await fetchWithTimeout(attempt, 40000);
      if (res.ok) break;
    } catch { res = null; }
  }
  if (!res || !res.ok) throw new Error('Could not reach the Census Population Estimates API.');

  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('Unexpected response from Census PEP API.');

  const header  = raw[0];
  const iPop    = header.indexOf('POP');
  const iState  = header.indexOf('state');
  const iCounty = header.indexOf('county');
  const iName   = header.indexOf('NAME');

  // ── 3. Build records ─────────────────────────────────────────────────────────
  updateLoading('Matching population to counties...');
  const records = [];

  for (let i = 1; i < raw.length; i++) {
    const row  = raw[i];
    const fips = (row[iState] || '').padStart(2, '0') + (row[iCounty] || '').padStart(3, '0');
    const pop  = Math.max(0, parseInt(row[iPop], 10) || 0);
    if (!pop) continue;

    const center = centroids[fips];
    if (!center) continue;

    const nameParts = (row[iName] || '').split(',');
    records.push({
      fips,
      lat:    center.lat,
      lng:    center.lng,
      county: nameParts[0]?.trim() || '',
      state:  nameParts[1]?.trim() || '',
      youth:  pop
    });
  }

  layers.census.data = records;
  document.getElementById('stat-census').textContent = `(${records.length.toLocaleString()})`;
  console.log(`Census PEP: ${raw.length - 1} counties from API, ${records.length} matched to centroids`);
}

function renderCensus() {
  const data = layers.census.data;
  if (!data || !data.length) {
    console.warn('Census: no data to render');
    return;
  }

  if (layers.census.heat && map.hasLayer(layers.census.heat)) {
    map.removeLayer(layers.census.heat);
  }
  layers.census.heat = null;

  const logMax = Math.log1p(Math.max(...data.map(r => r.youth)));

  layers.census.heat = L.heatLayer(
    data.map(r => [r.lat, r.lng, Math.log1p(r.youth) / logMax]),
    {
      radius: 22, blur: 18, maxZoom: 12, max: 1.0,
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function _geojsonCentroid(geometry) {
  let ring;
  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    // Use the largest polygon by vertex count
    ring = geometry.coordinates.reduce((a, b) => a[0].length >= b[0].length ? a : b)[0];
  } else {
    return null;
  }
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return isValidCoord(lat, lng) ? { lat, lng } : null;
}
