// ─── BSA LAYER ───────────────────────────────────────────────────────────────

async function loadBSA() {
  showLoading('Discovering BSA councils...');

  // Prefer local bundled data to avoid browser CORS/proxy instability.
  try {
    const localRes = await fetchWithTimeout(LOCAL_BSA_FILE, 12000);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length) {
        layers.bsa.data = localData.filter(c => c && c.lat && c.lng);
        document.getElementById('stat-bsa').textContent = layers.bsa.data.length.toLocaleString();
        return;
      }
    }
  } catch { /* fall back to live discovery */ }

  const seeds = [...new Set(BSA_SEED_ZIPS)];
  const councils = {}; // keyed by councilNumber
  let done = 0;
  const BATCH = 10;

  for (let i = 0; i < seeds.length; i += BATCH) {
    const batch = seeds.slice(i, i + BATCH);

    await Promise.all(batch.map(async zip => {
      const directUrl = `${BSA_API}/${zip}/council`;
      const corsProxy1 = CORS_PROXY + encodeURIComponent(directUrl);
      const corsProxy2 = CORS_PROXY2 + encodeURIComponent(directUrl);

      let data = null;
      for (const url of [directUrl, corsProxy2, corsProxy1]) {
        try {
          const res = await fetchWithTimeout(url, 8000);
          if (!res.ok) continue;
          const candidate = await res.json();
          if (candidate && candidate.councilNumber) {
            data = candidate;
            break;
          }
        } catch { /* try next */ }
      }

      if (data && data.councilNumber && !councils[data.councilNumber]) {
        const a = data.primaryAddress || {};
        const rawZip = String(a.zipCode || data.zipCode || zip || '').replace(/[^0-9]/g, '').substring(0, 5);
        councils[data.councilNumber] = {
          number:  data.councilNumber,
          name:    data.councilName || `Council ${data.councilNumber}`,
          zip:     rawZip.padStart(5, '0') || '',
          city:    a.city  || '',
          state:   a.state || '',
          address: a.address1 || ''
        };
      }
    }));

    done += batch.length;
    updateLoading(
      `Discovering BSA councils... ${Object.keys(councils).length} found (${done}/${seeds.length} zips checked)`
    );
    await sleep(100);
  }

  if (!Object.keys(councils).length) {
    throw new Error('No BSA councils discovered. The Scouting API may be unavailable.');
  }

  const councilList = Object.values(councils).filter(c => c.zip && /^\d{5}$/.test(c.zip));
  const uniqueZips  = [...new Set(councilList.map(c => c.zip))];

  updateLoading(`Geocoding ${councilList.length} council locations...`);
  const geoData = await geocodeMany(uniqueZips, (done, total) => {
    updateLoading(`Geocoding BSA councils... ${done}/${total}`);
  });

  for (const c of councilList) {
    const g = geoData[c.zip];
    if (g) { c.lat = g.lat; c.lng = g.lng; if (!c.city) c.city = g.city; }
  }

  layers.bsa.data = councilList.filter(c => c.lat && c.lng);
  document.getElementById('stat-bsa').textContent = layers.bsa.data.length.toLocaleString();
}

function renderBSA() {
  if (layers.bsa.circles) { map.removeLayer(layers.bsa.circles); layers.bsa.circles = null; }

  const councils = layers.bsa.data;
  if (!councils || !councils.length) return;

  const markers = councils.map(c => {
    const m = L.circleMarker([c.lat, c.lng], {
      radius: 4,
      color: '#c2a072',
      fillColor: '#c2a072',
      fillOpacity: 0.8,
      weight: 1
    });
    m.bindTooltip(`<b>${c.name}</b><br>${c.city}${c.state ? ', ' + c.state : ''}`, { sticky: true });
    m.on('click', () => openSidebar(c.zip, c.city, c.state, c));
    return m;
  });

  layers.bsa.circles = L.layerGroup(markers);
  if (layers.bsa.visible) showOnMap('bsa');
}
