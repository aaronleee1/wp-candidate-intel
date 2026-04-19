// ─── ZIP GEOCODING ───────────────────────────────────────────────────────────

const ZIP_CACHE_KEY = 'wpZipGeo_v2';
const COUNTY_CACHE_KEY = 'wpZipCounty_v1';
let localZipCounty = null;

async function loadLocalZipCounty() {
  if (localZipCounty) return localZipCounty;
  try {
    const res = await fetchWithTimeout('data/zip-county.json', 12000);
    if (!res.ok) return (localZipCounty = {});
    localZipCounty = await res.json();
    return localZipCounty;
  } catch {
    localZipCounty = {};
    return localZipCounty;
  }
}

function loadZipCache() {
  try { return JSON.parse(localStorage.getItem(ZIP_CACHE_KEY)) || {}; } catch { return {}; }
}

function saveZipCache(c) {
  try { localStorage.setItem(ZIP_CACHE_KEY, JSON.stringify(c)); } catch {}
}

function loadCountyCache() {
  try { return JSON.parse(localStorage.getItem(COUNTY_CACHE_KEY)) || {}; } catch { return {}; }
}

function saveCountyCache(c) {
  try { localStorage.setItem(COUNTY_CACHE_KEY, JSON.stringify(c)); } catch {}
}

async function geocodeSingle(zip) {
  try {
    const res = await fetchWithTimeout(`${ZIP_API}/${zip}`, 5000);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      lat:   parseFloat(d.places[0].latitude),
      lng:   parseFloat(d.places[0].longitude),
      city:  d.places[0]['place name'],
      state: d.places[0]['state abbreviation']
    };
  } catch { return null; }
}

async function geocodeMany(zips, onProgress) {
  const cache = loadZipCache();
  const results = {};
  const toFetch = [];

  for (const z of zips) {
    if (cache[z]) results[z] = cache[z];
    else toFetch.push(z);
  }

  let done = zips.length - toFetch.length;

  for (let i = 0; i < toFetch.length; i += 20) {
    const batch = toFetch.slice(i, i + 20);
    const settled = await Promise.all(batch.map(z => geocodeSingle(z).then(loc => ({ z, loc }))));
    settled.forEach(({ z, loc }) => {
      if (loc) { results[z] = loc; cache[z] = loc; }
    });
    done += batch.length;
    if (onProgress) onProgress(done, zips.length);
    if (i + 20 < toFetch.length) await sleep(50);
  }

  saveZipCache(cache);
  return results;
}

async function countyFipsFromLatLng(lat, lng) {
  try {
    const url = `${FCC_COUNTY_API}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json`;
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return '';
    const d = await res.json();
    return d?.results?.[0]?.county_fips || '';
  } catch {
    return '';
  }
}

async function countyFipsForZips(geoByZip, onProgress) {
  const local = await loadLocalZipCounty();
  const cache = loadCountyCache();
  const out = {};
  const missing = [];
  const zips = Object.keys(geoByZip || {});

  for (const zip of zips) {
    if (local[zip]) { out[zip] = local[zip]; continue; }
    if (cache[zip]) out[zip] = cache[zip];
    else missing.push(zip);
  }

  let done = zips.length - missing.length;
  for (let i = 0; i < missing.length; i += 20) {
    const batch = missing.slice(i, i + 20);
    const settled = await Promise.all(batch.map(async zip => {
      const g = geoByZip[zip];
      if (!g) return { zip, fips: '' };
      const fips = await countyFipsFromLatLng(g.lat, g.lng);
      return { zip, fips };
    }));

    for (const { zip, fips } of settled) {
      if (fips) {
        out[zip] = fips;
        cache[zip] = fips;
      }
    }

    done += batch.length;
    if (onProgress) onProgress(done, zips.length);
    if (i + 20 < missing.length) await sleep(50);
  }

  saveCountyCache(cache);
  return out;
}
