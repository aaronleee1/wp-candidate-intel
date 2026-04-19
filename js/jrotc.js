// ─── JROTC LAYER ─────────────────────────────────────────────────────────────

async function loadJROTC() {
  showLoading('Fetching Army JROTC school list...');

  let arrayBuffer;
  const localUrl = LOCAL_JROTC_FILE;
  const direct = JROTC_URL;
  const proxied = CORS_PROXY + encodeURIComponent(JROTC_URL);
  const proxied2 = CORS_PROXY2 + encodeURIComponent(JROTC_URL);

  // Use bundled local file first; network fallbacks are only for refresh/recovery.
  for (const url of [localUrl, direct, proxied2, proxied]) {
    try {
      const res = await fetchWithTimeout(url, 25000);
      if (!res.ok) continue;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) continue; // likely proxy error payload
      arrayBuffer = await res.arrayBuffer();
      break;
    } catch { /* try next */ }
  }

  if (!arrayBuffer) throw new Error('Unable to fetch the JROTC spreadsheet (local and remote sources failed).');

  updateLoading('Parsing JROTC spreadsheet...');
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rows.length < 2) throw new Error('JROTC spreadsheet appears to be empty.');

  // Find the actual header row (skip title/metadata rows at the top)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map(h => String(h).toLowerCase().trim());
    if (cells.some(c => c.includes('zip')) && cells.some(c => c.includes('school'))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx < 0) throw new Error(`Could not find header row in JROTC spreadsheet.\nFirst row: ${rows[0].join(', ')}`);

  const hdrs = rows[headerRowIdx].map(h => String(h).toLowerCase().trim());
  const col  = (...terms) => hdrs.findIndex(h => terms.some(t => h.includes(t)));

  const zipCol  = col('zip');
  const nameCol = col('school name', 'school');
  const cityCol = col('city');
  const stateCol= col('state');
  const bdeCol  = col('bde', 'brigade');
  const typeCol = col('program type', 'program');
  const addrCol = col('street', 'address');

  if (zipCol < 0 || nameCol < 0) {
    throw new Error(`Could not find required columns in the JROTC spreadsheet.\nHeaders found: ${hdrs.join(', ')}`);
  }

  const schools = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const zip = normalizeZip(r[zipCol]);
    if (!zip) continue;
    schools.push({
      zip,
      name:  String(r[nameCol] || '').trim(),
      city:  String(cityCol  >= 0 ? r[cityCol]  : '').trim(),
      state: String(stateCol >= 0 ? r[stateCol] : '').trim(),
      bde:   String(bdeCol   >= 0 ? r[bdeCol]   : '').trim(),
      type:  String(typeCol  >= 0 ? r[typeCol]  : '').trim(),
      addr:  String(addrCol  >= 0 ? r[addrCol]  : '').trim()
    });
  }

  if (!schools.length) throw new Error('No valid JROTC school records found.');

  updateLoading(`Found ${schools.length} JROTC schools. Geocoding...`);

  const uniqueZips = [...new Set(schools.map(s => s.zip))];
  const geoData = await geocodeMany(uniqueZips, (done, total) => {
    updateLoading(`Geocoding JROTC locations... ${done}/${total}`);
  });

  for (const s of schools) {
    const g = geoData[s.zip];
    if (g) { s.lat = g.lat; s.lng = g.lng; if (!s.city) s.city = g.city; if (!s.state) s.state = g.state; }
  }

  layers.jrotc.data = schools.filter(s => s.lat && s.lng);
  document.getElementById('stat-jrotc').textContent = layers.jrotc.data.length.toLocaleString();
}

function renderJROTC() {
  if (layers.jrotc.circles) { map.removeLayer(layers.jrotc.circles); layers.jrotc.circles = null; }

  const schools = layers.jrotc.data;
  if (!schools || !schools.length) return;

  const markers = schools.map(s => {
    const m = L.circleMarker([s.lat, s.lng], {
      radius: 3,
      color: '#7ea98e',
      fillColor: '#7ea98e',
      fillOpacity: 0.85,
      weight: 1
    });
    m.bindTooltip(`<b>${s.name}</b><br>${s.city}, ${s.state}`, { sticky: true });
    m.on('click', () => openSidebar(s.zip, s.city, s.state));
    return m;
  });

  layers.jrotc.circles = L.layerGroup(markers);
  if (layers.jrotc.visible) showOnMap('jrotc');
}
