// ─── GAP ANALYSIS ────────────────────────────────────────────────────────────

function getGapPerRegion() {
  const el = document.getElementById('gap-top-n');
  const v  = parseInt(el?.value, 10);
  return (isNaN(v) || v < 1) ? 20 : v;
}

function zipPassesGapFilter(z) {
  if (gapFilter === 'blind' && z.wpCount !== 0) return false;
  if (gapFilter === 'under' && z.wpCount === 0) return false;
  if (activeRegion   !== 'all' && z.wpRegion    !== activeRegion)   return false;
  return true;
}

function renderGapMapFromControls() {
  if (!layers.gap.visible || !layers.gap.data) return;

  if (layers.gap.heat    && map.hasLayer(layers.gap.heat))    map.removeLayer(layers.gap.heat);
  if (layers.gap.circles && map.hasLayer(layers.gap.circles)) map.removeLayer(layers.gap.circles);
  layers.gap.heat    = null;
  layers.gap.circles = null;

  const perRegion = getGapPerRegion();

  // Take top N per region from the pre-sorted scored list
  const regionBuckets = {};
  for (const z of layers.gap.data) {
    if (!zipPassesGapFilter(z)) continue;
    const r = z.wpRegion || 'Other';
    if (!regionBuckets[r]) regionBuckets[r] = [];
    if (regionBuckets[r].length < perRegion) regionBuckets[r].push(z);
  }

  // Flatten and re-sort by score for display and rendering
  const topZips = Object.values(regionBuckets)
    .flat()
    .sort((a, b) => b.baseGap - a.baseGap);

  layers.gap.topZips = topZips.map((z, i) => ({ rank: i + 1, ...z }));

  const validScores = layers.gap.data.filter(z => z.baseGap < 999).map(z => z.baseGap);
  const maxScore = validScores.length ? Math.max(...validScores) : 1;

  // Heatmap
  const heatPoints = topZips.map(z => {
    const intensity = z.wpCount === 0 ? 1.0 : Math.min(z.baseGap / maxScore, 1.0);
    return [z.lat, z.lng, intensity];
  });

  layers.gap.heat = L.heatLayer(heatPoints, {
    radius: 16, blur: 18, maxZoom: 10, max: 1.0,
    gradient: {
      0.0:  'rgba(0,0,0,0)',
      0.3:  'rgba(99,65,180,0.55)',
      0.6:  'rgba(155,120,230,0.75)',
      0.85: 'rgba(220,160,80,0.88)',
      1.0:  'rgba(240,100,80,1.0)'
    }
  });

  // ZIP-level circle markers sized by gap score
  const markers = topZips.map(z => {
    const isBlind = z.wpCount === 0;
    const color   = isBlind ? '#be7966' : '#8876c9';
    const ratio   = z.baseGap < 999 ? Math.min(z.baseGap / maxScore, 1) : 1;
    const radius  = isBlind ? 5 : 3 + Math.round(ratio * 3);

    const m = L.circleMarker([z.lat, z.lng], {
      radius,
      color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2
    });

    const scoreLabel = z.baseGap < 999 ? z.baseGap.toFixed(1) : '999+';
    m.bindTooltip(
      `<b>${z.city}, ${z.state}</b><br>` +
      `${isBlind ? '⚠ Not on radar' : 'Underrepresented'} · Score: ${scoreLabel}<br>` +
      `${z.wpCount} WP records`,
      { sticky: true }
    );
    m.on('click', () => openSidebar(z.zip, z.city, z.state));
    return m;
  });

  layers.gap.circles = L.layerGroup(markers);

  map.addLayer(layers.gap.heat);
  map.addLayer(layers.gap.circles);
}

function computeAndRenderGap() {
  if (layers.gap.heat    && map.hasLayer(layers.gap.heat))    map.removeLayer(layers.gap.heat);
  if (layers.gap.circles && map.hasLayer(layers.gap.circles)) map.removeLayer(layers.gap.circles);
  layers.gap.heat    = null;
  layers.gap.circles = null;

  const csvData  = layers.csv.data;
  const ncesData = layers.nces.data;
  if (!csvData) return;

  // Build zip → centroid + health data from NCES/CDC layer
  const ncesZip = {};
  if (ncesData) {
    for (const s of ncesData) {
      if (!s.zip) continue;
      if (!ncesZip[s.zip]) ncesZip[s.zip] = { lat: 0, lng: 0, n: 0, city: s.city, state: s.state, health: s.health || {} };
      ncesZip[s.zip].lat += s.lat;
      ncesZip[s.zip].lng += s.lng;
      ncesZip[s.zip].n++;
    }
    for (const z of Object.values(ncesZip)) { z.lat /= z.n; z.lng /= z.n; }
  }

  // Enrich city/state from geocode cache (CDC locationname is just the ZIP code)
  const geoCache = loadZipCache();
  for (const [zip, z] of Object.entries(ncesZip)) {
    const g = geoCache[zip];
    if (g?.city) { z.city = g.city; z.state = g.state || z.state; }
  }

  // Build zip → JROTC city lookup (geocoded real names)
  const jrotcZip = {};
  if (layers.jrotc.data) {
    for (const s of layers.jrotc.data) {
      jrotcZip[s.zip] = (jrotcZip[s.zip] || 0) + 1;
    }
  }

  // Build zip → BSA council presence
  const bsaZip = {};
  if (layers.bsa.data) {
    for (const c of layers.bsa.data) {
      bsaZip[c.zip] = c;
    }
  }

  // Collect all candidate zips: union of NCES, JROTC, and BSA
  const allZips = new Set([
    ...Object.keys(ncesZip),
    ...Object.keys(jrotcZip),
    ...Object.keys(bsaZip)
  ]);

  // Score each zip
  const scored = [];
  for (const zip of allZips) {
    const nces       = ncesZip[zip];
    const wpEntry    = csvData.zipData[zip];
    const wpCount    = wpEntry ? wpEntry.count : 0;
    const jrotcCount = jrotcZip[zip] || 0;
    const hasBSA     = !!bsaZip[zip];

    // Skip if no geographic data at all
    let lat, lng, city, state;
    if (nces) {
      lat = nces.lat; lng = nces.lng; city = nces.city; state = nces.state;
      // Prefer JROTC's geocoded city if NCES city still looks like a ZIP
      if (jrotcCount && layers.jrotc.data) {
        const js = layers.jrotc.data.find(s => s.zip === zip);
        if (js?.city && /^\d{5}$/.test(city)) { city = js.city; state = js.state || state; }
      }
    } else if (jrotcCount && layers.jrotc.data) {
      const s = layers.jrotc.data.find(s => s.zip === zip);
      if (!s || !s.lat) continue;
      lat = s.lat; lng = s.lng; city = s.city; state = s.state;
    } else if (hasBSA) {
      const c = bsaZip[zip];
      if (!c.lat) continue;
      lat = c.lat; lng = c.lng; city = c.city; state = c.state;
    } else continue;

    // Representation ratio: WP records per 500-student assumed cohort
    const repRatio = wpCount / 0.5;

    // Multipliers for pipeline signals
    let multiplier = 1.0;
    if (jrotcCount >= 1) multiplier *= 1.5;
    if (jrotcCount >= 3) multiplier *= 1.2;
    if (hasBSA)          multiplier *= 1.2;

    // Health multiplier — lower inactivity/obesity = more physically eligible candidates
    // National averages: LPA ~25%, OBESITY ~31%
    const health = nces?.health || {};
    let healthMult = 1.0;
    if (health.LPA     != null) healthMult *= Math.max(0.75, Math.min(1.25, 1 + (25 - health.LPA)     / 100));
    if (health.OBESITY != null) healthMult *= Math.max(0.85, Math.min(1.15, 1 + (31 - health.OBESITY) / 100));
    healthMult = Math.max(0.6, Math.min(1.4, healthMult));
    multiplier *= healthMult;

    // Athletic gap
    let athleticMod = 0;
    if (wpEntry && wpEntry.rows.length > 0) {
      const withSports = wpEntry.rows.filter(r => r.sports && r.sports.length > 0).length;
      const sportPct   = withSports / wpEntry.rows.length;
      if (sportPct === 0)      athleticMod = 2;
      else if (sportPct < 0.1) athleticMod = 1;
    } else {
      athleticMod = 2;
    }

    // Gap score: higher = bigger gap
    const baseGap = wpCount === 0
      ? 999 + multiplier * 10 + athleticMod * 5
      : (multiplier + athleticMod) / repRatio;

    const wpRegion = WP_REGIONS[state] || 'Other';
    scored.push({ zip, lat, lng, city, state, baseGap, wpCount, jrotcCount, hasBSA, athleticMod, multiplier, healthMult, health, wpRegion });
  }

  scored.sort((a, b) => b.baseGap - a.baseGap);
  layers.gap.data = scored;
  document.getElementById('stat-gap').textContent = scored.length.toLocaleString();

  populateGapFilters(scored);
  renderGapMapFromControls();
  renderLeftPanel();
}
