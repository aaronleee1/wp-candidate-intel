// ─── CSV LAYER (WEST POINT APPLICANTS) ───────────────────────────────────────

function splitCSVRow(line) {
  const fields = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1, val = '';
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2; }
        else if (line[j] === '"') { j++; break; }
        else { val += line[j++]; }
      }
      fields.push(val);
      i = j + 1;
    } else {
      const end = line.indexOf(',', i);
      const j = end === -1 ? line.length : end;
      fields.push(line.slice(i, j));
      i = j + 1;
    }
  }
  return fields;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');

  // Detect column positions from header row
  const hdrs = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  const ci = key => hdrs.findIndex(h => h.includes(key));

  const STATUS_COL    = ci('person status');
  const SOURCE_COL    = ci('person list source');
  const SUBMITTED_COL = ci('submitted');
  const OFFERED_COL   = ci('offered');
  const ZIP_COL       = ci('zip');
  const DISTRICT_COL  = ci('state district');
  const EXTRA_COL     = ci('extracurricular');
  // Sport columns — grab all that include 'sport'
  const SPORT_COLS    = hdrs.reduce((acc, h, i) => { if (h.includes('sport')) acc.push(i); return acc; }, []);

  const zipData = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i]);
    const zip  = ZIP_COL >= 0 && cols[ZIP_COL] ? cols[ZIP_COL].trim().replace(/"/g, '') : '';
    if (!zip || !/^\d{5}$/.test(zip)) continue;
    if (!zipData[zip]) zipData[zip] = { count: 0, rows: [] };
    zipData[zip].count++;

    const sports = SPORT_COLS.map(c => (cols[c] || '').trim().replace(/"/g, '')).filter(Boolean);

    zipData[zip].rows.push({
      status:    (STATUS_COL    >= 0 ? cols[STATUS_COL]    || '' : '').trim().replace(/"/g, ''),
      source:    (SOURCE_COL    >= 0 ? cols[SOURCE_COL]    || '' : '').trim().replace(/"/g, ''),
      submitted: (SUBMITTED_COL >= 0 ? cols[SUBMITTED_COL] || '' : '').trim().replace(/"/g, ''),
      offered:   (OFFERED_COL   >= 0 ? cols[OFFERED_COL]   || '' : '').trim().replace(/"/g, ''),
      district:  (DISTRICT_COL  >= 0 ? cols[DISTRICT_COL]  || '' : '').trim().replace(/"/g, ''),
      extra:     (EXTRA_COL     >= 0 ? cols[EXTRA_COL]     || '' : '').trim().replace(/"/g, ''),
      sports
    });
  }
  return zipData;
}

async function loadCSVFile(file) {
  showLoading('Parsing West Point applicant data...');
  const text = await file.text();
  const zipData = parseCSV(text);
  const zips = Object.keys(zipData);

  if (!zips.length) {
    hideLoading();
    alert('No valid zip codes found in this CSV file.');
    return;
  }

  updateLoading(`Found ${zips.length} zip codes. Geocoding...`);
  const geoData = await geocodeMany(zips, (done, total) => {
    updateLoading(`Geocoding applicant locations... ${done}/${total}`);
  });

  layers.csv.data = { zipData, geoData };
  layers.csv.loaded  = true;
  layers.csv.visible = true;

  renderCSV();
  setBtnState('csv');
  refreshLegend();
  hideLoading();

  // Update count in layer button
  const total = Object.values(zipData).reduce((a, d) => a + d.count, 0);
  document.getElementById('stat-csv').textContent = total.toLocaleString();

  // Show upload label swap
  document.querySelector('#btn-csv .csv-label').textContent = 'Change CSV';

  // Auto-recompute gap if it was already visible
  if (layers.gap.visible) computeAndRenderGap();
}

function renderCSV() {
  if (layers.csv.heat) { map.removeLayer(layers.csv.heat); layers.csv.heat = null; }

  const { zipData, geoData } = layers.csv.data;
  const maxCount = Math.max(...Object.values(zipData).map(d => d.count));
  const heatPts  = [];

  for (const [zip, data] of Object.entries(zipData)) {
    const geo = geoData[zip];
    if (!geo) continue;
    heatPts.push([geo.lat, geo.lng, data.count / maxCount]);
  }

  layers.csv.heat = L.heatLayer(heatPts, {
    radius: 14, blur: 12, maxZoom: 10, max: 1.0,
    gradient: {
      0.0:  'rgba(0,0,0,0)',
      0.3:  'rgba(124,45,18,0.45)',
      0.6:  'rgba(234,88,12,0.6)',
      0.85: 'rgba(251,191,36,0.7)',
      1.0:  'rgba(254,240,138,0.8)'
    }
  });

  if (layers.csv.visible) showOnMap('csv');
}
