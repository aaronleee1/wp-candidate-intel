// ─── LAYER TOGGLE HANDLER ────────────────────────────────────────────────────

async function handleLayerToggle(id) {
  if (activeLoad) return;
  const L = layers[id];

  if (!L.loaded) {
    activeLoad = id;
    setBtnState(id, 'loading');
    try {
      await loadLayer(id);
      L.loaded = true;
      L.visible = true;
      renderLayer(id);
    } catch (err) {
      console.error(id, err);
      alert(`Failed to load ${id.toUpperCase()} data:\n${err.message}`);
      setBtnState(id, 'error');
      activeLoad = null;
      hideLoading();
      return;
    }
    activeLoad = null;
    hideLoading();
  } else {
    L.visible = !L.visible;
    L.visible ? showOnMap(id) : hideFromMap(id);
  }

  setBtnState(id);
  refreshLegend();
}

function setBtnState(id, override) {
  const btn = document.getElementById(`btn-${id}`);
  const L   = layers[id];
  btn.classList.remove('active', 'loading');

  if (override === 'loading') { btn.classList.add('loading'); return; }
  if (override === 'error')   { btn.classList.add('error'); btn.title = 'Failed to load — click to retry'; return; }

  btn.classList.remove('error');
  btn.title = '';
  if (L.loaded && L.visible) btn.classList.add('active');
}

function toggleCSVIfLoaded() {
  if (!layers.csv.loaded) return;
  layers.csv.visible = !layers.csv.visible;
  layers.csv.visible ? showOnMap('csv') : hideFromMap('csv');
  setBtnState('csv');
  refreshLegend();
}

// ─── LOAD DISPATCHER ─────────────────────────────────────────────────────────

async function loadLayer(id) {
  if (id === 'nces')  return loadNCES();
  if (id === 'jrotc') return loadJROTC();
  if (id === 'bsa')   return loadBSA();
}

// ─── RENDER DISPATCHER ───────────────────────────────────────────────────────

function renderLayer(id) {
  if (id === 'nces')  renderNCES();
  if (id === 'jrotc') renderJROTC();
  if (id === 'bsa')   renderBSA();
  if (id === 'csv')   renderCSV();
}

// ─── MAP SHOW / HIDE ─────────────────────────────────────────────────────────

function showOnMap(id) {
  const L = layers[id];
  if (L.heat    && !map.hasLayer(L.heat))    map.addLayer(L.heat);
  if (L.circles && !map.hasLayer(L.circles)) map.addLayer(L.circles);
}

function hideFromMap(id) {
  const L = layers[id];
  if (L.heat    && map.hasLayer(L.heat))    map.removeLayer(L.heat);
  if (L.circles && map.hasLayer(L.circles)) map.removeLayer(L.circles);
}

function toggleGapLayer() {
  if (!layers.csv.loaded) {
    alert('Upload the WP applicant CSV first, then enable Gap Analysis.');
    return;
  }
  if (layers.gap.visible) {
    layers.gap.visible = false;
    if (layers.gap.heat    && map.hasLayer(layers.gap.heat))    map.removeLayer(layers.gap.heat);
    if (layers.gap.circles && map.hasLayer(layers.gap.circles)) map.removeLayer(layers.gap.circles);
    document.getElementById('btn-gap').classList.remove('active');
  } else {
    layers.gap.visible = true;
    computeAndRenderGap();
    document.getElementById('btn-gap').classList.add('active');
  }
  refreshLegend();
}
