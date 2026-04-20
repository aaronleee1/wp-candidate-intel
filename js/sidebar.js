// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
// Unified: shows all active layers' data for the clicked zip

function openSidebar(zip, city, state, bsaCouncil) {
  let html = `<h2 style="color:#eee;margin-bottom:2px">ZIP ${zip}</h2>
              <div class="sub-loc">${city}${state ? ', ' + state : ''}</div>`;

  // ── High Schools (OSM) section ────────────────────────────────────────────
  if (layers.nces.visible && layers.nces.data) {
    const group = layers.nces.data.filter(s => s.zip === zip);
    if (group.length) {
      html += `
      <div class="sb-section">
        <h3 style="color:#4dabf7">&#9632; Health Data (${group.length})</h3>
        <ul class="school-list">
          ${[...group].sort((a,b) => a.name.localeCompare(b.name)).map(s => {
            const addr    = [s.street, s.city, s.state].filter(Boolean).join(', ');
            const phone   = s.phone   ? `<a href="tel:${s.phone.replace(/\s/g,'')}" style="color:#4dabf7">${s.phone}</a>` : null;
            const website = s.website && /^https?:\/\//i.test(s.website)
              ? `<a href="${s.website}" target="_blank" rel="noopener" style="color:#4dabf7">Website ↗</a>`
              : s.website
              ? `<a href="https://${s.website}" target="_blank" rel="noopener" style="color:#4dabf7">Website ↗</a>`
              : null;
            const meta    = [s.operator || null, addr || null].filter(Boolean);
            const contact = [phone, website].filter(Boolean);
            return `<li>
              <b>${s.name}</b>
              ${s.type && s.type !== 'Public' ? `<span class="meta"> · ${s.type}</span>` : ''}
              ${s.locale ? `<span class="meta"> · ${s.locale}</span>` : ''}
              ${meta.length    ? `<div class="meta">${meta.join(' &middot; ')}</div>` : ''}
              ${contact.length ? `<div class="meta">${contact.join(' &middot; ')}</div>` : ''}
            </li>`;
          }).join('')}
        </ul>
        ${(() => {
          const health = group[0]?.health || {};
          const rows = (window.NCES_HEALTH_MEASURES || [])
            .filter(m => health[m.id] != null)
            .map(m => `<div class="stat-row"><span class="lbl">${m.label}</span><span class="val">${health[m.id].toFixed(1)}%</span></div>`)
            .join('');
          return rows ? `<div style="margin-top:8px"><div class="meta" style="margin-bottom:4px;color:#aaa">Community Health (ZIP ${group[0].zip})</div>${rows}</div>` : '';
        })()}
      </div>`;
    }
  }

  // ── JROTC section ─────────────────────────────────────────────────────────
  if (layers.jrotc.visible && layers.jrotc.data) {
    const group = layers.jrotc.data.filter(s => s.zip === zip);
    if (group.length) {
      const bdes = [...new Set(group.map(s => s.bde).filter(Boolean))];
      html += `
      <div class="sb-section">
        <h3 style="color:#51cf66">&#9632; Army JROTC (${group.length} program${group.length>1?'s':''})</h3>
        ${bdes.length ? `<div class="stat-row"><span class="lbl">Brigade(s)</span><span class="val">${bdes.join(', ')}</span></div>` : ''}
        <ul class="school-list" style="margin-top:6px">
          ${[...group].sort((a,b)=>a.name.localeCompare(b.name)).map(s => `
            <li><b>${s.name}</b>
              <div class="meta">${[s.bde?'BDE '+s.bde:null, s.type, s.addr].filter(Boolean).join(' &middot; ')}</div>
            </li>`).join('')}
        </ul>
      </div>`;
    }
  }

  // ── BSA section ───────────────────────────────────────────────────────────
  if (layers.bsa.visible && layers.bsa.data) {
    // Show the council that was clicked (if passed), or any council whose zip matches
    const councils = bsaCouncil
      ? [bsaCouncil]
      : layers.bsa.data.filter(c => c.zip === zip);
    if (councils.length) {
      html += councils.map(c => `
      <div class="sb-section">
        <h3 style="color:#ffa94d">&#9632; BSA Council</h3>
        <div class="stat-row"><span class="lbl">Council Name</span><span class="val" style="text-align:right;max-width:190px;font-size:0.75rem">${c.name}</span></div>
        <div class="stat-row"><span class="lbl">Council #</span><span class="val">${c.number}</span></div>
        <div class="stat-row"><span class="lbl">HQ City</span><span class="val">${c.city||'—'}${c.state?', '+c.state:''}</span></div>
        ${c.address ? `<div class="stat-row"><span class="lbl">Address</span><span class="val" style="text-align:right;max-width:190px;font-size:0.75rem">${c.address}</span></div>` : ''}
      </div>`).join('');
    }
  }

  // ── WP Applicants section ─────────────────────────────────────────────────
  if (layers.csv.visible && layers.csv.data) {
    const entry = layers.csv.data.zipData[zip];
    if (entry) {
      const rows  = entry.rows;
      const total = rows.length;
      const subY  = rows.filter(r => r.submitted === 'Yes').length;
      const offY  = rows.filter(r => r.offered   === 'Yes').length;

      const stCounts  = {};
      const srcCounts = {};
      rows.forEach(r => {
        stCounts[r.status]              = (stCounts[r.status]              || 0) + 1;
        srcCounts[r.source||'N/A']      = (srcCounts[r.source||'N/A']      || 0) + 1;
      });

      // Sports breakdown
      const withSports = rows.filter(r => r.sports && r.sports.length > 0).length;
      const allSports  = rows.flatMap(r => r.sports || []);
      const sportCounts = {};
      allSports.forEach(s => { sportCounts[s] = (sportCounts[s] || 0) + 1; });

      html += `
      <div class="sb-section">
        <h3 style="color:#c0828d">&#9632; WP Applicants</h3>
        <div class="stat-row"><span class="lbl">Total on Radar</span><span class="val">${total}</span></div>
        <div class="stat-row"><span class="lbl">Submitted</span><span class="val">${subY} (${pct(subY,total)}%)</span></div>
        <div class="stat-row"><span class="lbl">Offered Admission</span><span class="val">${offY} (${pct(offY,total)}%)</span></div>
        <div class="stat-row"><span class="lbl">Offer Rate</span><span class="val">${subY?pct(offY,subY):0}%</span></div>
        <div class="stat-row"><span class="lbl">Have Athletic Data</span><span class="val">${withSports} (${pct(withSports,total)}%)</span></div>
      </div>
      <div class="sb-section">
        <h3 style="color:#c0828d">Status Breakdown</h3>
        ${Object.entries(stCounts).sort((a,b)=>b[1]-a[1]).map(([s,n])=>barRow(s,n,total,'#c0828d')).join('')}
      </div>
      <div class="sb-section">
        <h3 style="color:#c0828d">Lead Source</h3>
        ${Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]).map(([s,n])=>barRow(s,n,total,'#c0828d')).join('')}
      </div>
      ${Object.keys(sportCounts).length ? `
      <div class="sb-section">
        <h3 style="color:#c0828d">Sports</h3>
        ${Object.entries(sportCounts).sort((a,b)=>b[1]-a[1]).map(([s,n])=>barRow(s,n,withSports,'#c0828d')).join('')}
      </div>` : ''}`;
    }
  }

  // ── Gap Analysis section ──────────────────────────────────────────────────
  if (layers.gap.visible && layers.gap.data) {
    const gz = layers.gap.data.find(z => z.zip === zip);
    if (gz) {
      const isBlind   = gz.wpCount === 0;
      const signals   = [];
      if (gz.jrotcCount) signals.push(`${gz.jrotcCount} JROTC program${gz.jrotcCount>1?'s':''}`);
      if (gz.hasBSA)     signals.push('BSA Council present');
      if (gz.enrollment) signals.push(`${gz.enrollment.toLocaleString()} enrolled`);

      const athLabel = gz.athleticMod === 2 ? 'No athletic data' : gz.athleticMod === 1 ? 'Low athletic data (<10%)' : 'Athletic data present';
      const gapColor = isBlind ? '#ff3333' : '#cc66ff';

      html += `
      <div class="sb-section">
        <h3 style="color:${gapColor}">&#9632; Gap Analysis</h3>
        <div class="stat-row"><span class="lbl">Status</span><span class="val" style="color:${gapColor}">${isBlind ? '⚠ Not on WP radar' : 'Underrepresented'}</span></div>
        <div class="stat-row"><span class="lbl">WP Records</span><span class="val">${gz.wpCount}</span></div>
        <div class="stat-row"><span class="lbl">Pipeline Signals</span><span class="val" style="text-align:right;max-width:190px;font-size:0.75rem">${signals.join(', ') || 'None'}</span></div>
        <div class="stat-row"><span class="lbl">Athletic Signal</span><span class="val" style="font-size:0.75rem">${athLabel}</span></div>
        <div class="stat-row"><span class="lbl">Score Multiplier</span><span class="val">${gz.multiplier.toFixed(2)}×</span></div>
        ${gz.healthMult != null ? `
        <div class="stat-row"><span class="lbl">Health Multiplier</span><span class="val" style="color:${gz.healthMult >= 1 ? '#51cf66' : '#ff6b6b'}">${gz.healthMult.toFixed(2)}× ${gz.healthMult >= 1.05 ? '↑ fit pool' : gz.healthMult <= 0.95 ? '↓ unfit pool' : ''}</span></div>
        ${gz.health?.LPA     != null ? `<div class="stat-row"><span class="lbl" style="padding-left:12px">Physically Inactive</span><span class="val">${gz.health.LPA.toFixed(1)}%</span></div>` : ''}
        ${gz.health?.OBESITY != null ? `<div class="stat-row"><span class="lbl" style="padding-left:12px">Obesity</span><span class="val">${gz.health.OBESITY.toFixed(1)}%</span></div>` : ''}
        ` : ''}
      </div>`;
    }
  }

  // Fallback if nothing matched
  if (!layers.nces.visible && !layers.jrotc.visible && !layers.bsa.visible && !layers.csv.visible && !layers.gap.visible) {
    html += `<p class="sb-note" style="margin-top:12px">Enable a layer to see data for this area.</p>`;
  }

  document.getElementById('sidebar-content').innerHTML = html;
  document.getElementById('sidebar').classList.add('open');
  setTimeout(() => map.invalidateSize(), 300);
}

function barRow(label, n, total, color) {
  const p = total ? Math.round(n / total * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-lbl"><span>${label}</span><span>${n} (${p}%)</span></div>
    <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color}"></div></div>
  </div>`;
}

function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

// Map-level click: find nearest school ZIP centroid and open sidebar
map.on('click', e => {
  if (!layers.nces.visible || !layers.nces.data) return;
  const { lat, lng } = e.latlng;
  let nearest = null, minDist = Infinity;
  const zipCentroids = {};
  for (const s of layers.nces.data) {
    if (!s.zip) continue;
    if (!zipCentroids[s.zip]) zipCentroids[s.zip] = { lat: 0, lng: 0, n: 0, city: s.city, state: s.state };
    zipCentroids[s.zip].lat += s.lat;
    zipCentroids[s.zip].lng += s.lng;
    zipCentroids[s.zip].n++;
  }
  for (const [zip, c] of Object.entries(zipCentroids)) {
    const clat = c.lat / c.n, clng = c.lng / c.n;
    const d = Math.hypot(clat - lat, clng - lng);
    if (d < minDist && d < 0.15) { minDist = d; nearest = { zip, city: c.city, state: c.state }; }
  }
  if (nearest) openSidebar(nearest.zip, nearest.city, nearest.state);
});

document.getElementById('sidebar-close').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  setTimeout(() => map.invalidateSize(), 300);
});
