// ─── LEFT PANEL ──────────────────────────────────────────────────────────────

let leftPanelOpen = false;
let gapFilter    = 'all';
let activeRegion = 'all';

function toggleLeftPanel() {
  leftPanelOpen = !leftPanelOpen;
  document.getElementById('left-panel').classList.toggle('open', leftPanelOpen);
  document.getElementById('left-panel-tab').textContent = leftPanelOpen ? '◀ CLOSE' : 'GAP LIST';
  setTimeout(() => map.invalidateSize(), 300);
}

function populateGapFilters(scored) {
  const regionSel = document.getElementById('gap-region');
  const regions   = [...new Set(scored.map(z => z.wpRegion).filter(Boolean))].sort();

  const prev = activeRegion !== 'all' && regions.includes(activeRegion) ? activeRegion : 'all';
  regionSel.innerHTML = '<option value="all">All Regions</option>';
  regions.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    if (o === prev) opt.selected = true;
    regionSel.appendChild(opt);
  });
}

function renderLeftPanel() {
  const data    = layers.gap.data;
  const topZips = layers.gap.topZips || [];
  const list    = document.getElementById('left-panel-list');

  if (!data || !data.length) {
    list.innerHTML = '<div id="left-panel-empty">No gap data computed yet.</div>';
    return;
  }

  if (!topZips.length) {
    list.innerHTML = '<div id="left-panel-empty">No results for this filter.</div>';
    return;
  }

  list.innerHTML = topZips.map((z, i) => {
    const isBlind = z.wpCount === 0;
    const color   = isBlind ? '#be7966' : '#8876c9';
    const label   = isBlind ? 'Not on Radar' : 'Underrepresented';
    const signals = [];
    if (z.jrotcCount) signals.push(`${z.jrotcCount} JROTC`);
    if (z.hasBSA)     signals.push('BSA');
    signals.push(`${z.wpCount} WP records`);

    return `<div class="gap-item" onclick="flyToGap('${z.zip}', ${z.lat}, ${z.lng}, '${z.city.replace(/'/g,"\\'")}', '${z.state}')">
      <div class="gap-item-rank">#${i + 1}</div>
      <div class="gap-item-loc">${z.city}, ${z.state} <span style="color:#52525b;font-weight:400">${z.zip}</span></div>
      <span class="gap-item-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${label}</span>
      <div class="gap-item-meta">${signals.join(' · ')}</div>
    </div>`;
  }).join('');
}

function flyToGap(zip, lat, lng, city, state) {
  map.flyTo([lat, lng], 10, { duration: 1.2 });
  openSidebar(zip, city, state);
  document.getElementById('sidebar').classList.add('open');
  setTimeout(() => map.invalidateSize(), 300);
}

// Status filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gapFilter = btn.dataset.filter;
    renderGapMapFromControls();
    renderLeftPanel();
  });
});

// Region dropdown
document.getElementById('gap-region').addEventListener('change', e => {
  activeRegion = e.target.value;
  renderGapMapFromControls();
  renderLeftPanel();
});

// Per-region input
document.getElementById('gap-top-n').addEventListener('change', () => {
  renderGapMapFromControls();
  renderLeftPanel();
});
