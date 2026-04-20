// ─── HIGH SCHOOLS LAYER (CDC PLACES — Physical Inactivity by ZIP) ────────────
// Temporary replacement while Urban Institute Education Data API is down.
// Uses CDC PLACES 2023 ZIP-level data, measureid=LPA (leisure-time physical inactivity).

const NCES_CACHE_KEY = 'wp_intel_nces_v3';
const NCES_CACHE_TTL = 24 * 60 * 60 * 1000;

const CDC_PLACES_URL = 'https://data.cdc.gov/resource/cwsq-ngmh.json';

async function loadNCES() {
  try {
    const raw = localStorage.getItem(NCES_CACHE_KEY);
    if (raw) {
      const { ts, schools } = JSON.parse(raw);
      if (Date.now() - ts < NCES_CACHE_TTL) {
        layers.nces.data = schools;
        document.getElementById('stat-nces').textContent = `(${schools.length.toLocaleString()})`;
        return;
      }
    }
  } catch {}

  showLoading('Loading CDC PLACES health data...');

  const params = new URLSearchParams({
    measureid: 'LPA',
    '$select': 'locationid,locationname,data_value,geolocation',
    '$limit':  '50000',
    '$offset': '0'
  });

  let res;
  const url = `${CDC_PLACES_URL}?${params}`;
  try {
    res = await fetchWithTimeout(url, 60000);
  } catch (e) {
    throw new Error(`CDC PLACES request failed: ${e.message}`);
  }
  if (!res.ok) throw new Error(`CDC PLACES API returned HTTP ${res.status}`);

  updateLoading('Parsing CDC PLACES data...');
  const data = await res.json();

  const schools = [];
  for (const r of data) {
    const geo = r.geolocation;
    if (!geo) continue;

    // Socrata returns Point as {latitude, longitude} strings or GeoJSON {coordinates:[lng,lat]}
    let lat, lng;
    if (geo.latitude !== undefined) {
      lat = parseFloat(geo.latitude);
      lng = parseFloat(geo.longitude);
    } else if (geo.coordinates) {
      lng = parseFloat(geo.coordinates[0]);
      lat = parseFloat(geo.coordinates[1]);
    } else continue;

    if (!isValidCoord(lat, lng)) continue;

    schools.push({
      id:             r.locationid,
      name:           `ZIP ${r.locationid}`,
      lat, lng,
      zip:            normalizeZip(r.locationid || ''),
      city:           r.locationname || '',
      state:          '',
      street:         '',
      phone:          '',
      website:        '',
      operator:       '',
      enrollment:     0,
      teachers:       0,
      district:       '',
      type:           'Public',
      locale:         '',
      titleIEligible: false,
      magnet:         false,
      charter:        false,
      virtual:        false,
      bie:            false,
      freeLunch:      parseFloat(r.data_value) || 0,
      congressDist:   '',
      stateLegLower:  '',
      stateLegUpper:  '',
      countyCode:     '',
      cbsa:           ''
    });
  }

  try {
    localStorage.setItem(NCES_CACHE_KEY, JSON.stringify({ ts: Date.now(), schools }));
  } catch {}

  layers.nces.data = schools;
  document.getElementById('stat-nces').textContent = `(${schools.length.toLocaleString()})`;
}

function ncesLocale(code) {
  if (!code || code < 0) return 'Unknown';
  if (code <= 13) return 'City';
  if (code <= 23) return 'Suburban';
  if (code <= 33) return 'Town';
  return 'Rural';
}

function renderNCES() {
  const schools = layers.nces.data;
  if (!schools || !schools.length) return;

  if (layers.nces.heat && map.hasLayer(layers.nces.heat)) {
    map.removeLayer(layers.nces.heat);
  }
  layers.nces.heat = null;

  layers.nces.heat = L.heatLayer(
    schools.map(s => [s.lat, s.lng, 0.6]),
    { radius: 8, blur: 10, maxZoom: 12,
      gradient: {
        0.0: 'rgba(0,0,0,0)',
        0.4: 'rgba(24,100,171,0.2)',
        0.7: 'rgba(77,171,247,0.3)',
        1.0: 'rgba(165,243,252,0.4)'
      } }
  );

  if (layers.nces.visible) showOnMap('nces');
}
