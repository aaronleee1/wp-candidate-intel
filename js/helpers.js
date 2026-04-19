// ─── HELPERS ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showLoading(msg) {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('loadingMsg').textContent = msg;
}

function updateLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg;
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function isValidCoord(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number'
    && !isNaN(lat) && !isNaN(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
    && !(lat === 0 && lng === 0)
    && lat !== -1 && lng !== -1;
}

function normalizeZip(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(typeof val === 'number' ? Math.round(val) : val)
    .replace(/[^0-9]/g, '').substring(0, 5);
  return s ? s.padStart(5, '0') : '';
}

async function fetchWithTimeout(url, ms = 7000, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, ...options });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}
