// ─── HIGH SCHOOLS LAYER (CDC PLACES — health metrics by ZIP, US only) ─────────

const NCES_CACHE_KEY = 'wp_intel_nces_v12';
const NCES_CACHE_TTL = 24 * 60 * 60 * 1000;

const CDC_PLACES_URL = 'https://data.cdc.gov/resource/qnzd-25i4.json'; // ZCTA (ZIP) level

const CDC_MEASURES = [
  { id: 'LPA',      label: 'Physically Inactive (%)'  },
  { id: 'OBESITY',  label: 'Obesity (%)'              },
  { id: 'CSMOKING', label: 'Current Smokers (%)'      },
  { id: 'DIABETES', label: 'Diabetes (%)'             },
  { id: 'BPHIGH',   label: 'High Blood Pressure (%)'  },
  { id: 'MHLTH',    label: 'Poor Mental Health (%)'   },
  { id: 'PHLTH',    label: 'Poor Physical Health (%)' },
  { id: 'ACCESS2',  label: 'No Health Insurance (%)'  },
  { id: 'SLEEP',    label: 'Sleep < 7 Hours (%)'      },
  { id: 'BINGE',    label: 'Binge Drinking (%)'       },
];

// US state abbreviations — used to filter out non-US territories
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
]);

async function loadNCES() {
  try {
    const raw = localStorage.getItem(NCES_CACHE_KEY);
    if (raw) {
      const { ts, schools } = JSON.parse(raw);
      if (Date.now() - ts < NCES_CACHE_TTL || !navigator.onLine) {
        layers.nces.data = schools;
        document.getElementById('stat-nces').textContent = `(${schools.length.toLocaleString()})`;
        return;
      }
    }
  } catch {}

  showLoading('Loading CDC PLACES health data...');

  // ── Fetch all measures, build zip → {measureId: value} map ─────────────────
  const zipHealth   = {};  // zip → { LPA: 25.3, stateabbr: 'CA', geolocation: {...} }
  const zipMeta     = {};  // zip → { stateabbr, locationname, geolocation }

  for (let i = 0; i < CDC_MEASURES.length; i++) {
    const m = CDC_MEASURES[i];
    updateLoading(`Fetching health data: ${m.label} (${i + 1}/${CDC_MEASURES.length})…`);

    const params = new URLSearchParams({
      measureid: m.id,
      '$select':  'locationid,locationname,data_value,geolocation',
      '$limit':   '50000'
    });

    try {
      const res = await fetchWithTimeout(`${CDC_PLACES_URL}?${params}`, 20000);
      if (!res.ok) { console.warn(`CDC ${m.id} HTTP ${res.status}`); continue; }
      const rows = await res.json();

      for (const r of rows) {
        const zip = r.locationid;
        if (!zip || zip.length !== 5) continue;

        if (!zipHealth[zip]) zipHealth[zip] = {};
        zipHealth[zip][m.id] = parseFloat(r.data_value) ?? null;

        if (!zipMeta[zip] && r.geolocation) {
          zipMeta[zip] = { locationname: r.locationname || zip, geolocation: r.geolocation };
        }
      }
    } catch (e) {
      console.warn(`CDC ${m.id} failed: ${e.message}`);
    }
  }

  // ── Build school records from ZIP metadata + health values ──────────────────
  updateLoading('Building ZIP health records...');
  const schools = [];

  for (const [zip, meta] of Object.entries(zipMeta)) {
    const geo = meta.geolocation;
    let lat, lng;
    if (geo.latitude  !== undefined) { lat = parseFloat(geo.latitude);      lng = parseFloat(geo.longitude); }
    else if (geo.coordinates)        { lng = parseFloat(geo.coordinates[0]); lat = parseFloat(geo.coordinates[1]); }
    else continue;

    if (!isValidCoord(lat, lng)) continue;

    schools.push({
      id:     zip,
      name:   meta.locationname,
      lat, lng,
      zip,
      city:   meta.locationname || '',
      state:  '',
      health: zipHealth[zip]    || {},
      // compatibility fields
      street: '', phone: '', website: '', district: '',
      type: 'Public', locale: '', charter: false, magnet: false,
      enrollment: 0, teachers: 0, freeLunch: 0,
      titleIEligible: false, virtual: false, bie: false,
      congressDist: '', stateLegLower: '', stateLegUpper: '',
      countyCode: '', cbsa: ''
    });
  }

  try {
    localStorage.setItem(NCES_CACHE_KEY, JSON.stringify({ ts: Date.now(), schools }));
  } catch {}

  layers.nces.data = schools;
  document.getElementById('stat-nces').textContent = `(${schools.length.toLocaleString()})`;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

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

  if (layers.nces.heat && map.hasLayer(layers.nces.heat)) map.removeLayer(layers.nces.heat);
  layers.nces.heat = null;

  // Weight heatmap by physical inactivity rate — higher = more intense dot
  const maxLPA = Math.max(...schools.map(s => s.health?.LPA || 0));

  layers.nces.heat = L.heatLayer(
    schools.map(s => [s.lat, s.lng, maxLPA ? (s.health?.LPA || 0) / maxLPA : 0.6]),
    { radius: 10, blur: 12, maxZoom: 12,
      gradient: {
        0.0: 'rgba(0,0,0,0)',
        0.4: 'rgba(24,100,171,0.2)',
        0.7: 'rgba(77,171,247,0.3)',
        1.0: 'rgba(165,243,252,0.4)'
      }
    }
  );

  if (layers.nces.visible) showOnMap('nces');
}

window.NCES_HEALTH_MEASURES = CDC_MEASURES;
