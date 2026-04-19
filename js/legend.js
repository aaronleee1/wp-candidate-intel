// ─── LEGEND ──────────────────────────────────────────────────────────────────

const legendCtrl = L.control({ position: 'bottomright' });
legendCtrl.onAdd = () => {
  const div = L.DomUtil.create('div', 'legend');
  div.id = 'map-legend';
  refreshLegend(div);
  return div;
};
legendCtrl.addTo(map);

function refreshLegend(div) {
  div = div || document.getElementById('map-legend');
  if (!div) return;

  const active = [
    { id: 'nces',  label: 'High Schools (NCES)', color: '#78a7c7', heat: true  },
    { id: 'jrotc', label: 'JROTC Programs',       color: '#7ea98e', heat: false },
    { id: 'bsa',   label: 'BSA Councils',         color: '#c2a072', heat: false },
    { id: 'csv',   label: 'WP Applicants',        color: '#c0828d', heat: true  },
    { id: 'gap',   label: 'Gap: Underrepresented', color: '#8876c9', heat: false }
  ].filter(l => layers[l.id].visible);

  if (!active.length) {
    div.innerHTML = '<div class="legend-title">No active layers</div>';
    return;
  }

  let html = '<div class="legend-title">Active Layers</div>';
  for (const l of active) {
    if (l.id === 'gap') {
      html += `<div class="legend-item" style="margin-bottom:3px"><span class="legend-dot" style="background:#8876c9"></span><span>Gap Analysis</span></div>`;
      html += `<div class="legend-grad" style="background:linear-gradient(to right,#382b6b,#5d4e98,#8876c9,#c4a267,#be7966);width:140px"></div>`;
      html += `<div class="legend-ends"><span>Underrep.</span><span>Not on radar</span></div>`;
    } else {
      html += `<div class="legend-item"><span class="legend-dot" style="background:${l.color}"></span><span>${l.label}</span></div>`;
      if (l.heat) {
        html += `<div class="legend-grad" style="background:linear-gradient(to right,blue,cyan,lime,yellow,${l.color});width:140px"></div>
                 <div class="legend-ends"><span>Low</span><span>High</span></div>`;
      }
    }
  }
  div.innerHTML = html;
}
