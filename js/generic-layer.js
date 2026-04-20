// ─── GENERIC LAYER ENGINE + ADD LAYER UI ────────────────────────────────────
// Handles all custom data layers:
//  • Reads from layers.config.js  (file-based config for advanced users)
//  • Reads from localStorage       (layers added via the UI)
//  • Provides "+ Add Layer" button and modal form in the toolbar

(function () {

  // ── Storage helpers ──────────────────────────────────────────────────────────
  const STORAGE_KEY = 'wpPluginLayers_v1';

  function _storageLoad() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function _storageSave(cfgArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfgArray));
  }

  function _storageDel(id) {
    const saved = _storageLoad().filter(c => c.id !== id);
    _storageSave(saved);
  }


  // ── Build the full list of configs: file + stored ────────────────────────────
  const _fileCfgs   = window.CUSTOM_LAYERS || [];
  const _savedCfgs  = _storageLoad();
  const _fileIds    = new Set(_fileCfgs.map(c => c.id));

  // File-based configs take priority; stored configs fill in anything not in the file
  const _allCfgs = [
    ..._fileCfgs,
    ..._savedCfgs.filter(c => !_fileIds.has(c.id)),
  ];


  // ── Register + button for each config ────────────────────────────────────────
  const BASE_PANE_Z = 460;

  _allCfgs.forEach((cfg, i) => _registerLayer(cfg, BASE_PANE_Z + i));

  function _registerLayer(cfg, zIndex) {
    if (!cfg.id || !cfg.label || !cfg.source || !cfg.location) {
      console.error('[CustomLayer] Skipping invalid config:', cfg);
      return false;
    }
    layers[cfg.id] = {
      loaded: false, visible: false,
      heat: null, circles: null, data: null,
      color: cfg.color || '#888',
    };
    const paneName = `plugin_${cfg.id}_pane`;
    map.createPane(paneName);
    map.getPane(paneName).style.zIndex = zIndex;
    cfg._paneName = paneName;
    return true;
  }


  // ── Inject toolbar buttons ────────────────────────────────────────────────────
  const controls = document.getElementById('layer-controls');

  _allCfgs.forEach(cfg => {
    if (layers[cfg.id]) _injectButton(cfg);
  });

  // "+ Add Layer" button — always present
  const addBtn = document.createElement('div');
  addBtn.id = 'btn-add-layer';
  addBtn.title = 'Add a new data layer from any JSON API';
  addBtn.onclick = openAddLayerModal;
  addBtn.innerHTML = `<span style="font-size:1rem;line-height:1">+</span> Add Layer`;
  controls.appendChild(addBtn);

  function _injectButton(cfg) {
    // Don't duplicate
    if (document.getElementById(`btn-${cfg.id}`)) return;

    const isStored = !_fileIds.has(cfg.id);
    const btn = document.createElement('div');
    btn.className = 'layer-btn';
    btn.id = `btn-${cfg.id}`;
    btn.style.setProperty('--lc', cfg.color || '#888');
    btn.innerHTML =
      `<span class="layer-dot" style="background:${cfg.color || '#888'}"></span>` +
      `${_esc(cfg.label)}` +
      `<span class="layer-count" id="stat-${cfg.id}"></span>` +
      (isStored
        ? `<span class="layer-btn-del" title="Remove this layer" data-del="${cfg.id}">×</span>`
        : '');

    btn.addEventListener('click', e => {
      // If the × was clicked, remove rather than toggle
      if (e.target.dataset.del) { _removeLayer(e.target.dataset.del); return; }
      handleLayerToggle(cfg.id);
    });

    // Insert before the "+ Add Layer" button
    controls.insertBefore(btn, addBtn);
  }

  function _removeLayer(id) {
    if (!confirm(`Remove the "${layers[id] ? id : id}" layer?`)) return;
    hideFromMap(id);
    delete layers[id];
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.remove();
    _storageDel(id);
    refreshLegend();
  }


  // ── Patch load / render / openSidebar dispatchers ────────────────────────────
  const _origLoad        = loadLayer;
  const _origRender      = renderLayer;
  const _origOpenSidebar = openSidebar;

  window.loadLayer = async function (id) {
    const cfg = _allCfgs.find(c => c.id === id) || _storageLoad().find(c => c.id === id);
    if (cfg) return _loadGenericLayer(cfg);
    return _origLoad(id);
  };

  window.renderLayer = function (id) {
    const cfg = _allCfgs.find(c => c.id === id) || _storageLoad().find(c => c.id === id);
    if (cfg) { _renderGenericLayer(cfg); return; }
    _origRender(id);
  };

  window.openSidebar = function (zip, city, state, bsaCouncil) {
    _origOpenSidebar(zip, city, state, bsaCouncil);
    _appendPluginSidebar(zip, null);
  };


  // ── Sidebar: append plugin sections ─────────────────────────────────────────

  function _appendPluginSidebar(zip, pinnedPoint) {
    const content = document.getElementById('sidebar-content');
    if (!content) return;

    _allCfgs.forEach(cfg => {
      if (!layers[cfg.id]?.visible || !layers[cfg.id]?.data) return;
      if (pinnedPoint?.cfg.id === cfg.id) {
        _appendSection(content, cfg, pinnedPoint.point); return;
      }
      if (zip) {
        const match = layers[cfg.id].data.points.find(p => p.zip === zip);
        if (match) _appendSection(content, cfg, match);
      }
    });
  }

  function _appendSection(container, cfg, point) {
    const rec = point._rec;
    const fields = (cfg.popup || [])
      .map(({ label, field }) => {
        const v = rec[field];
        return v != null
          ? `<div class="stat-row"><span class="lbl">${_esc(label)}</span>` +
            `<span class="val">${_esc(String(v))}</span></div>`
          : '';
      }).join('');

    const sec = document.createElement('div');
    sec.className = 'sb-section';
    sec.innerHTML =
      `<h3 style="color:${cfg.color || '#aaa'}">&#9632; ${_esc(cfg.label)}</h3>` +
      (fields || '<p style="color:#777;font-size:0.8rem">No info fields configured.</p>');
    container.appendChild(sec);
  }


  // ── Load a generic layer (fetch + geocode) ────────────────────────────────────

  async function _loadGenericLayer(cfg) {
    showLoading(`Loading ${cfg.label}…`);

    const resp = await _fetchWithProxies(cfg.source.url);
    let raw = await resp.json();

    if (cfg.source.dataPath) {
      raw = cfg.source.dataPath.split('.').reduce((o, k) => o && o[k], raw);
    }
    // ArcGIS REST: unwrap features[].attributes so field names are top-level
    if (Array.isArray(raw) && raw[0]?.attributes && typeof raw[0].attributes === 'object') {
      raw = raw.map(f => f.attributes);
    }
    if (!Array.isArray(raw)) {
      throw new Error(
        `API did not return an array of records.\n` +
        `If the records are nested, set the "Data Path" field (e.g. "results").\n` +
        `Got: ${JSON.stringify(raw).slice(0, 200)}`
      );
    }

    updateLoading(`Processing ${raw.length.toLocaleString()} ${cfg.label} records…`);
    let points = [];

    if (cfg.location.type === 'latlng') {
      const { latField, lngField } = cfg.location;
      raw.forEach(rec => {
        const lat = parseFloat(rec[latField]);
        const lng = parseFloat(rec[lngField]);
        if (isValidCoord(lat, lng)) points.push({ lat, lng, _rec: rec });
      });
      if (points.length === 0 && raw.length > 0) {
        const sample = raw[0];
        const available = Object.keys(sample).join(', ');
        const gotLat = sample[latField], gotLng = sample[lngField];
        throw new Error(
          `No valid coordinates found.\n` +
          `Lat field "${latField}" = ${JSON.stringify(gotLat)}, Lng field "${lngField}" = ${JSON.stringify(gotLng)}.\n` +
          `Available fields: ${available}`
        );
      }

    } else if (cfg.location.type === 'zip') {
      const { zipField } = cfg.location;
      const zips = [...new Set(raw.map(r => normalizeZip(r[zipField])).filter(Boolean))];
      updateLoading(`Geocoding ${zips.length} ZIP codes for ${cfg.label}…`);
      const geoMap = await geocodeMany(zips);
      raw.forEach(rec => {
        const zip = normalizeZip(rec[zipField]);
        const geo = geoMap[zip];
        if (geo) points.push({ lat: geo.lat, lng: geo.lng, zip, _rec: rec });
      });

    } else {
      throw new Error(`Unknown location type "${cfg.location.type}". Use "latlng" or "zip".`);
    }

    layers[cfg.id].data = { points };
    const el = document.getElementById(`stat-${cfg.id}`);
    if (el) el.textContent = `(${points.length.toLocaleString()})`;
  }


  // ── Render a generic layer onto the map ──────────────────────────────────────

  function _renderGenericLayer(cfg) {
    const L = layers[cfg.id];
    if (!L?.data?.points?.length) return;
    const { points } = L.data;
    const color = cfg.color || '#888';

    if (cfg.visualization === 'heat') {
      L.heat = window.L.heatLayer(
        points.map(p => [p.lat, p.lng, 1]),
        { radius: 18, blur: 22, pane: cfg._paneName }
      );
      map.addLayer(L.heat);
    } else {
      const group = window.L.layerGroup([], { pane: cfg._paneName });
      points.forEach(p => {
        const circle = window.L.circleMarker([p.lat, p.lng], {
          radius: 4, color, fillColor: color,
          fillOpacity: 0.85, weight: 1, pane: cfg._paneName,
        });
        if (cfg.popup?.length) {
          const tip = cfg.popup.slice(0, 3)
            .map(({ label, field }) => {
              const v = p._rec[field];
              return v != null ? `<b>${_esc(label)}:</b> ${_esc(String(v))}` : null;
            }).filter(Boolean).join('<br>');
          if (tip) circle.bindTooltip(tip, { sticky: true, className: 'wp-tooltip' });
        }
        circle.on('click', () => {
          // Use zip if available (for sidebar matching); otherwise open with empty zip
          const zip   = p.zip || '';
          const city  = _pickField(p._rec, ['city',  'City',  'CITY'])  || '';
          const state = _pickField(p._rec, ['state', 'State', 'STATE', 'state_abbr']) || '';
          _origOpenSidebar(zip, city, state, null);
          _appendPluginSidebar(zip, { cfg, point: p });
        });
        group.addLayer(circle);
      });
      L.circles = group;
      map.addLayer(group);
    }
  }


  // ════════════════════════════════════════════════════════════════════════════
  //  ADD LAYER MODAL
  // ════════════════════════════════════════════════════════════════════════════

  // Tracks which popup-row input was last focused (for inserting detected field names)
  let _lastFieldInput = null;

  // Inject the modal HTML into the page
  (function _injectModal() {
    const el = document.createElement('div');
    el.id  = 'al-modal';
    el.className = 'al-overlay';
    el.innerHTML = `
      <div class="al-dialog" role="dialog" aria-modal="true" aria-labelledby="al-title">
        <div class="al-header">
          <span class="al-title" id="al-title">Add New Data Layer</span>
          <button class="al-close" id="al-close" title="Close">&times;</button>
        </div>
        <div class="al-body">

          <div class="al-row">
            <div class="al-field" style="flex:3">
              <label for="al-name">Layer Name</label>
              <input type="text" id="al-name" placeholder="e.g. Fire Stations">
            </div>
            <div class="al-field" style="flex:1">
              <label for="al-color">Color</label>
              <input type="color" id="al-color" value="#60a5fa">
            </div>
          </div>

          <div class="al-field">
            <label for="al-url">API URL</label>
            <div class="al-url-row">
              <input type="text" id="al-url" placeholder="https://api.example.com/data">
              <button class="al-btn-sm" id="al-detect">Detect Fields</button>
            </div>
            <p class="al-help">Paste the full URL of the API that returns your data as JSON.</p>
          </div>

          <div id="al-hint" class="al-hint" style="display:none">
            <div class="al-hint-title">Available fields — click one to insert it into the focused input:</div>
            <div class="al-hint-chips" id="al-chips"></div>
          </div>

          <div class="al-field">
            <label for="al-datapath">Data Path <span class="al-optional">(optional)</span></label>
            <input type="text" id="al-datapath" placeholder='e.g. results'>
            <p class="al-help">
              Only fill this in if your records are inside a nested key.<br>
              Example: if the API returns <code style="color:#60a5fa">{"results":[…]}</code>, type <code style="color:#60a5fa">results</code>.
            </p>
          </div>

          <div class="al-field">
            <label>Location</label>
            <div class="al-radio-group">
              <label class="al-radio">
                <input type="radio" name="al-loc" id="al-loc-latlng" value="latlng" checked>
                Records have latitude &amp; longitude fields
              </label>
              <label class="al-radio">
                <input type="radio" name="al-loc" id="al-loc-zip" value="zip">
                Records only have a ZIP code field
              </label>
            </div>
          </div>

          <div id="al-latlng-section" class="al-row">
            <div class="al-field">
              <label for="al-lat">Latitude Field</label>
              <input type="text" id="al-lat" placeholder="latitude">
            </div>
            <div class="al-field">
              <label for="al-lng">Longitude Field</label>
              <input type="text" id="al-lng" placeholder="longitude">
            </div>
          </div>

          <div id="al-zip-section" class="al-field" style="display:none">
            <label for="al-zip">ZIP Code Field</label>
            <input type="text" id="al-zip" placeholder="zip_code">
          </div>

          <div class="al-field">
            <label>Map Style</label>
            <div class="al-radio-group al-inline">
              <label class="al-radio">
                <input type="radio" name="al-viz" value="circles" checked> Dots
              </label>
              <label class="al-radio">
                <input type="radio" name="al-viz" value="heat"> Heatmap
              </label>
            </div>
          </div>

          <div class="al-field">
            <label>Info Panel Fields <span class="al-optional">(shown when clicking a dot)</span></label>
            <div class="al-popup-header">
              <span>Display label</span>
              <span>Field name from API</span>
              <span style="flex:0;width:32px"></span>
            </div>
            <div id="al-popup-rows"></div>
            <button class="al-btn-sm" id="al-add-row" style="margin-top:2px">+ Add Field</button>
          </div>

          <div id="al-error" class="al-error" style="display:none"></div>

        </div>
        <div class="al-footer">
          <button class="al-btn al-btn-ghost" id="al-cancel">Cancel</button>
          <button class="al-btn al-btn-primary" id="al-submit">Add to Map</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    // Wire up events
    document.getElementById('al-close').onclick  = _closeModal;
    document.getElementById('al-cancel').onclick = _closeModal;
    document.getElementById('al-submit').onclick = _handleSubmit;
    document.getElementById('al-add-row').onclick = () => _addPopupRow('', '');
    document.getElementById('al-detect').onclick  = _detectFields;

    // Location type toggle
    document.getElementById('al-loc-latlng').onchange = _updateLocFields;
    document.getElementById('al-loc-zip').onchange     = _updateLocFields;

    // Close on backdrop click
    el.addEventListener('click', e => { if (e.target === el) _closeModal(); });
  })();

  function openAddLayerModal() {
    // Reset the form
    document.getElementById('al-name').value     = '';
    document.getElementById('al-url').value      = '';
    document.getElementById('al-datapath').value = '';
    document.getElementById('al-lat').value      = 'latitude';
    document.getElementById('al-lng').value      = 'longitude';
    document.getElementById('al-zip').value      = '';
    document.getElementById('al-color').value    = _randomColor();
    document.getElementById('al-loc-latlng').checked = true;
    document.querySelector('input[name="al-viz"][value="circles"]').checked = true;
    document.getElementById('al-hint').style.display  = 'none';
    document.getElementById('al-error').style.display = 'none';
    _updateLocFields();

    // Start with two empty popup rows
    const rows = document.getElementById('al-popup-rows');
    rows.innerHTML = '';
    _addPopupRow('Name',  'name');
    _addPopupRow('City',  'city');
    _addPopupRow('State', 'state');

    document.getElementById('al-modal').classList.add('open');
    setTimeout(() => document.getElementById('al-name').focus(), 50);
  }
  window.openAddLayerModal = openAddLayerModal;

  function _closeModal() {
    document.getElementById('al-modal').classList.remove('open');
  }

  function _updateLocFields() {
    const isZip = document.getElementById('al-loc-zip').checked;
    document.getElementById('al-latlng-section').style.display = isZip ? 'none'  : '';
    document.getElementById('al-zip-section').style.display    = isZip ? ''      : 'none';
  }

  // Add a popup field row (label input + field-name input + delete button)
  function _addPopupRow(label, field) {
    const row = document.createElement('div');
    row.className = 'al-popup-row';

    const lIn = document.createElement('input');
    lIn.type = 'text'; lIn.value = label; lIn.placeholder = 'Display label';
    lIn.onfocus = () => { _lastFieldInput = null; }; // label col does not accept chip inserts

    const fIn = document.createElement('input');
    fIn.type = 'text'; fIn.value = field; fIn.placeholder = 'field_name';
    fIn.onfocus = () => { _lastFieldInput = fIn; };
    fIn.onblur  = () => { setTimeout(() => { if (_lastFieldInput === fIn) _lastFieldInput = null; }, 200); };

    const del = document.createElement('button');
    del.className = 'al-row-del'; del.type = 'button'; del.textContent = '×';
    del.title = 'Remove this field';
    del.onclick = () => row.remove();

    row.append(lIn, fIn, del);
    document.getElementById('al-popup-rows').appendChild(row);
    return fIn; // return field input so callers can focus it
  }

  // Fetch the API and show detected field names as clickable chips
  async function _detectFields() {
    const url = document.getElementById('al-url').value.trim();
    if (!url) { _showError('Enter an API URL first.'); return; }
    _showError('');

    const btn = document.getElementById('al-detect');
    const orig = btn.textContent;
    btn.textContent = 'Loading…';
    btn.disabled = true;

    try {
      const resp = await _fetchWithProxies(url);
      let data = await resp.json();

      // Walk dataPath if already set
      const dpInput = document.getElementById('al-datapath');
      let dp = dpInput.value.trim();
      if (dp) data = dp.split('.').reduce((o, k) => o && o[k], data);

      // If not an array, auto-detect the first key whose value is a non-empty array
      if (!Array.isArray(data) && data && typeof data === 'object') {
        const arrayKey = Object.keys(data).find(k => Array.isArray(data[k]) && data[k].length > 0);
        if (arrayKey) {
          dp = arrayKey;
          dpInput.value = arrayKey;
          data = data[arrayKey];
        }
      }

      // ArcGIS REST: features[].attributes — unwrap one level deeper
      if (Array.isArray(data) && data[0]?.attributes && typeof data[0].attributes === 'object') {
        data = data.map(f => f.attributes);
      }

      const first = Array.isArray(data) ? data[0] : data;
      if (!first || typeof first !== 'object') {
        _showError('Could not read field names — check the URL and Data Path.'); return;
      }

      const keys = Object.keys(first);
      const chips = document.getElementById('al-chips');
      chips.innerHTML = '';
      keys.forEach(k => {
        const chip = document.createElement('button');
        chip.type = 'button'; chip.className = 'al-chip'; chip.textContent = k;
        chip.title = `Sample value: ${JSON.stringify(first[k]).slice(0, 60)}`;
        chip.onclick = () => {
          const label = k.replace(/[_\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const fIn = _addPopupRow(label, k);
          fIn.focus();
        };
        chips.appendChild(chip);
      });
      document.getElementById('al-hint').style.display = '';
    } catch (err) {
      _showError(`Could not reach API: ${err.message}`);
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
  }

  // Validate and add the layer
  async function _handleSubmit() {
    _showError('');

    const name  = document.getElementById('al-name').value.trim();
    const url   = document.getElementById('al-url').value.trim();
    const color = document.getElementById('al-color').value;
    const dp    = document.getElementById('al-datapath').value.trim();
    const viz   = document.querySelector('input[name="al-viz"]:checked')?.value || 'circles';
    const locType = document.getElementById('al-loc-zip').checked ? 'zip' : 'latlng';

    // Validation
    if (!name) { _showError('Please enter a Layer Name.'); return; }
    if (!url)  { _showError('Please enter an API URL.'); return; }
    if (!url.startsWith('http')) { _showError('API URL must start with http:// or https://'); return; }

    let location;
    if (locType === 'latlng') {
      const lat = document.getElementById('al-lat').value.trim();
      const lng = document.getElementById('al-lng').value.trim();
      if (!lat || !lng) { _showError('Enter both Latitude and Longitude field names.'); return; }
      location = { type: 'latlng', latField: lat, lngField: lng };
    } else {
      const zip = document.getElementById('al-zip').value.trim();
      if (!zip) { _showError('Enter the ZIP Code field name.'); return; }
      location = { type: 'zip', zipField: zip };
    }

    // Collect popup rows (skip empty pairs)
    const popup = [];
    document.querySelectorAll('#al-popup-rows .al-popup-row').forEach(row => {
      const [lIn, fIn] = row.querySelectorAll('input');
      const label = lIn.value.trim(), field = fIn.value.trim();
      if (label && field) popup.push({ label, field });
    });

    // Build a stable unique ID from the name
    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
                          + '_' + Date.now().toString(36);

    const cfg = {
      id, label: name, color,
      source:        { type: 'json', url, ...(dp ? { dataPath: dp } : {}) },
      location,
      visualization: viz,
      popup,
      _fromStorage:  true,
    };

    // Save, register, inject button
    const saved = _storageLoad();
    saved.push(cfg);
    _storageSave(saved);

    const nextZ = BASE_PANE_Z + _allCfgs.length;
    if (!_registerLayer(cfg, nextZ)) { _showError('Failed to register layer. Check the config.'); return; }
    _allCfgs.push(cfg);
    _injectButton(cfg);

    _closeModal();

    // Immediately load and show the layer
    try {
      const btn = document.getElementById(`btn-${id}`);
      if (btn) btn.classList.add('loading');
      activeLoad = id;
      await _loadGenericLayer(cfg);
      layers[id].loaded  = true;
      layers[id].visible = true;
      _renderGenericLayer(cfg);
      activeLoad = null;
      hideLoading();
      if (btn) { btn.classList.remove('loading'); btn.classList.add('active'); }
      refreshLegend();
    } catch (err) {
      activeLoad = null;
      hideLoading();
      // Show error back in modal
      openAddLayerModal();
      document.getElementById('al-name').value  = name;
      document.getElementById('al-url').value   = url;
      document.getElementById('al-color').value = color;
      _showError(`Failed to load data: ${err.message}`);
      // Clean up the partially-added layer
      _storageDel(id);
      _allCfgs.splice(_allCfgs.indexOf(cfg), 1);
      delete layers[id];
      document.getElementById(`btn-${id}`)?.remove();
    }
  }

  function _showError(msg) {
    const el = document.getElementById('al-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
  }


  // ── Shared fetch helper (CORS proxy fallback) ────────────────────────────────

  async function _fetchWithProxies(url) {
    try {
      const r = await fetchWithTimeout(url, 15000);
      if (r.ok) return r;
    } catch (_) {}
    try {
      const r = await fetchWithTimeout(CORS_PROXY + encodeURIComponent(url), 15000);
      if (r.ok) return r;
    } catch (_) {}
    const r = await fetchWithTimeout(CORS_PROXY2 + encodeURIComponent(url), 15000);
    if (!r.ok) throw new Error(`All fetch attempts failed (last status: ${r.status})`);
    return r;
  }


  // ── Misc helpers ─────────────────────────────────────────────────────────────

  function _pickField(rec, keys) {
    for (const k of keys) if (rec[k] != null) return rec[k];
    return null;
  }

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _randomColor() {
    const palette = ['#60a5fa','#34d399','#f472b6','#fb923c','#a78bfa','#facc15','#22d3ee'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

})();
