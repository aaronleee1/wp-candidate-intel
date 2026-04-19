// --- COUNTY GEOMETRY + CHOROPLETH HELPERS -----------------------------------

let countyGeoJSON = null;
let countyMetaByFips = null;

async function ensureCountyGeoJSON() {
  if (countyGeoJSON) return countyGeoJSON;
  const res = await fetchWithTimeout(LOCAL_COUNTIES_FILE, 15000);
  if (!res.ok) throw new Error('Unable to load county boundaries.');
  countyGeoJSON = await res.json();
  countyMetaByFips = {};
  for (const f of countyGeoJSON.features || []) {
    countyMetaByFips[f.id] = {
      name: f.properties?.NAME || 'County',
      state: f.properties?.STATE || ''
    };
  }
  return countyGeoJSON;
}

function getCountyMeta(fips) {
  return (countyMetaByFips && countyMetaByFips[fips]) || { name: 'County', state: '' };
}

function colorForRatio(baseColor, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  const opacity = 0.22 + r * 0.55;
  return { color: baseColor, fillColor: baseColor, fillOpacity: opacity };
}

function buildCountyLayer(metricByFips, opts) {
  const {
    baseColor,
    label,
    countyDetails = {},
    onCountyClick,
    showTooltip = false,
    minFillOpacity = 0.12,
    maxFillOpacity = 0.38,
    baseWeight = 0.8,
    hoverWeight = 1.1,
    hoverOpacityBoost = 0.1,
    strokeOpacity = 0.75
  } = opts;

  const values = Object.values(metricByFips);
  const maxVal = values.length ? Math.max(...values) : 1;

  return L.geoJSON(countyGeoJSON, {
    pane: 'countyPane',
    filter: feature => {
      const fips = feature.id;
      return !!metricByFips[fips];
    },
    style: feature => {
      const fips = feature.id;
      const v = metricByFips[fips] || 0;
      const ratio = Math.min(v / maxVal, 1);
      const fillOpacity = minFillOpacity + (maxFillOpacity - minFillOpacity) * ratio;
      return {
        color: baseColor,
        weight: baseWeight,
        opacity: strokeOpacity,
        fillColor: baseColor,
        fillOpacity
      };
    },
    onEachFeature: (feature, layer) => {
      const fips = feature.id;
      const v = metricByFips[fips] || 0;
      if (!v) return;

      const d = countyDetails[fips] || {};
      const countyName = feature.properties?.NAME || 'County';
      const stateCode = feature.properties?.STATE || '';
      const extra = d.extra ? `<br>${d.extra}` : '';

      if (showTooltip) {
        layer.bindTooltip(
          `<b>${countyName} County</b> (${stateCode})<br>${label}: <b>${v.toLocaleString()}</b>${extra}<br><i>Click for details</i>`,
          { sticky: true }
        );
      }

      layer.on('mouseover', function() {
        this.setStyle({ weight: hoverWeight, fillOpacity: Math.min((this.options.fillOpacity || minFillOpacity) + hoverOpacityBoost, 0.55) });
      });
      layer.on('mouseout', function() {
        this.setStyle({ weight: baseWeight, opacity: strokeOpacity });
      });

      if (onCountyClick) {
        layer.on('click', () => onCountyClick(fips, d, feature));
      }
    }
  });
}
