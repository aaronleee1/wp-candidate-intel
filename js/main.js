// ─── AUTO LOAD ON STARTUP ─────────────────────────────────────────────────────

(async () => {
  for (const id of ['nces', 'jrotc', 'bsa']) {
    activeLoad = id;
    setBtnState(id, 'loading');
    try {
      await loadLayer(id);
      layers[id].loaded  = true;
      layers[id].visible = true;
      renderLayer(id);
    } catch (err) {
      console.error(`Auto-load failed for ${id}:`, err);
      setBtnState(id, 'error');
      updateLoading(`⚠ ${id.toUpperCase()} failed to load — click the button to retry`);
      await sleep(2000);
    }
    activeLoad = null;
    hideLoading();
    setBtnState(id);
    refreshLegend();
  }
})();

// ─── CSV FILE UPLOAD ─────────────────────────────────────────────────────────

document.getElementById('csvFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  if (activeLoad) { alert('Please wait for the current layer to finish loading.'); return; }
  try {
    await loadCSVFile(file);
  } catch (err) {
    alert('Error loading CSV: ' + err.message);
    hideLoading();
  }
});
