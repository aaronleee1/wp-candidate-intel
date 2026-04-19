// ─── HIGH SCHOOLS LAYER (OpenStreetMap via Overpass API) ─────────────────────

async function loadNCES() {
  showLoading('Querying OpenStreetMap for US high schools...');

  // Indexed tag filters only — regex queries cause 504 timeouts on nationwide bbox.
  // school:level=secondary and isced:level use inverted indexes (fast).
  const bbox   = '(24,-125,50,-66)'; // continental US
  const bboxAK = '(51,-180,72,-129)';
  const bboxHI = '(18,-161,23,-154)';
  const query = `[out:json][timeout:90];
(
  node["amenity"="school"]["school:level"="secondary"]${bbox};
  node["amenity"="school"]["isced:level"="3"]${bbox};
  way["amenity"="school"]["school:level"="secondary"]${bbox};
  way["amenity"="school"]["isced:level"="3"]${bbox};
  node["amenity"="school"]["school:level"="secondary"]${bboxAK};
  way["amenity"="school"]["school:level"="secondary"]${bboxAK};
  node["amenity"="school"]["school:level"="secondary"]${bboxHI};
  way["amenity"="school"]["school:level"="secondary"]${bboxHI};
);
out center tags;`;

  const postOpts = {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'data=' + encodeURIComponent(query)
  };

  let res = null;
  const mirrors = [
    OVERPASS_API,
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter'
  ];
  for (const url of mirrors) {
    updateLoading(`Querying OpenStreetMap${url !== OVERPASS_API ? ' (mirror)' : ''}...`);
    try {
      res = await fetchWithTimeout(url, 100000, postOpts);
      if (res.ok) break;
    } catch { res = null; }
  }
  if (!res || !res.ok) throw new Error('Could not reach the Overpass API. Check your internet connection.');

  updateLoading('Parsing high school data...');
  const data = await res.json();

  const seen    = new Set();
  const schools = [];

  for (const el of (data.elements || [])) {
    if (seen.has(el.id)) { continue; } seen.add(el.id);

    const lat = parseFloat(el.type === 'node' ? el.lat : el.center?.lat);
    const lng = parseFloat(el.type === 'node' ? el.lon : el.center?.lon);
    if (!isValidCoord(lat, lng)) continue;

    const t   = el.tags || {};
    const zip = normalizeZip(t['addr:postcode'] || '');

    schools.push({
      id:       el.id,
      name:     t.name || 'Unknown School',
      lat, lng,
      zip,
      city:     t['addr:city']  || t['addr:town'] || t['addr:hamlet'] || '',
      state:    osmState(t['addr:state'] || ''),
      street:   [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
      phone:    t.phone         || t['contact:phone']   || '',
      website:  t.website       || t['contact:website'] || t.url || '',
      operator: t.operator      || t['school:authority'] || '',
      // fields kept for gap/sidebar compatibility
      enrollment:     0,
      teachers:       0,
      district:       t.operator || '',
      type:           osmSchoolType(t),
      locale:         '',
      titleIEligible: false,
      magnet:         false,
      charter:        (t['school:type'] || '').toLowerCase().includes('charter'),
      virtual:        false,
      bie:            false,
      freeLunch:      0,
      congressDist:   '',
      stateLegLower:  '',
      stateLegUpper:  '',
      countyCode:     '',
      cbsa:           ''
    });
  }

  layers.nces.data = schools;
  document.getElementById('stat-nces').textContent = `(${schools.length.toLocaleString()})`;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function osmSchoolType(tags) {
  const op = (tags['operator:type'] || '').toLowerCase();
  const st = (tags['school:type']   || '').toLowerCase();
  if (st.includes('charter'))  return 'Charter';
  if (op === 'private')        return 'Private';
  return 'Public';
}

function osmState(raw) {
  if (!raw) return '';
  const s = raw.trim();
  if (s.length === 2) return s.toUpperCase();
  const map = {
    'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
    'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
    'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
    'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
    'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
    'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
    'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
    'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI',
    'South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT',
    'Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV',
    'Wisconsin':'WI','Wyoming':'WY','District of Columbia':'DC'
  };
  return map[s] || s.substring(0, 2).toUpperCase();
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
