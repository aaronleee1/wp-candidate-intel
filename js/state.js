// ─── LAYER STATE ──────────────────────────────────────────────────────────────

const layers = {
  nces:  { loaded: false, visible: false, heat: null, circles: null, data: null, color: '#78a7c7' },
  jrotc: { loaded: false, visible: false, circles: null, data: null, color: '#7ea98e' },
  bsa:   { loaded: false, visible: false, circles: null, data: null, color: '#c2a072' },
  csv:   { loaded: false, visible: false, heat: null, data: null, color: '#c0828d' },
  gap:   { visible: false, heat: null, circles: null, data: null, topZips: null, color: '#8876c9' }
};

let activeLoad = null; // prevents concurrent loads

// ─── MAP INIT ────────────────────────────────────────────────────────────────

const map = L.map('map', { center: [39.5, -98.35], zoom: 4 });

// Custom panes: lower z = further back
map.createPane('ncesPane');       map.getPane('ncesPane').style.zIndex       = 350;
map.createPane('jrotcPane');      map.getPane('jrotcPane').style.zIndex      = 420;
map.createPane('bsaPane');        map.getPane('bsaPane').style.zIndex        = 430;
map.createPane('csvPane');        map.getPane('csvPane').style.zIndex        = 440;
map.createPane('gapPane'); map.getPane('gapPane').style.zIndex = 450;
map.getPane('gapPane').style.mixBlendMode = 'screen';

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CARTO',
  subdomains: 'abcd', maxZoom: 19
}).addTo(map);
