// ─── HELP & FEEDBACK ─────────────────────────────────────────────────────────

// ── Configure the feedback recipient email here ──────────────────────────────
const FEEDBACK_EMAIL = '';   // e.g. 'recruiter@westpoint.edu' — leave blank to copy to clipboard only


// ════════════════════════════════════════════════════════════════════════════
//  HELP MODAL
// ════════════════════════════════════════════════════════════════════════════

const HELP_STEPS = [
  {
    title: 'Overview',
    content: `
      <h2>West Point Candidate Intelligence</h2>
      <p>This platform supports U.S. Military Academy recruiting efforts by aggregating and visualizing multiple public data sources on an interactive national map. It is designed to help recruiters identify geographic areas with high candidate potential that are currently underrepresented in the West Point applicant pipeline.</p>
      <p>Data layers are loaded on demand, applicant records are processed locally in the browser, and Gap Analysis is computed in real time from the active datasets.</p>
      <div class="help-tip">Use the numbered sections in the left navigation to access any topic directly.</div>
    `,
  },
  {
    title: 'Data Sources',
    content: `
      <h2>Data Sources</h2>
      <p>All layers are sourced from publicly available APIs and datasets. No data is transmitted to or stored on a private server.</p>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#4dabf7">&#9632; Health Data</div>
        <div class="help-source-detail">
          <b>Source:</b> CDC PLACES — ZIP Code Tabulation Area (ZCTA) level health estimates<br>
          <b>Currency:</b> Most recent CDC PLACES release (~30,000 ZIP codes nationwide)<br>
          <b>Coverage:</b> Community health indicators including physical inactivity, obesity, smoking prevalence, diabetes, blood pressure, mental health, and insurance coverage<br>
          <b>Use:</b> Identifies communities with health profiles favorable to physically demanding service; incorporated into Gap Analysis scoring
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#51cf66">&#9632; JROTC Programs</div>
        <div class="help-source-detail">
          <b>Source:</b> U.S. Army JROTC official program roster (<a href="https://usarmyjrotc.army.mil" target="_blank" rel="noopener" style="color:#51cf66">usarmyjrotc.army.mil</a>)<br>
          <b>Currency:</b> April 2024 roster (bundled spreadsheet)<br>
          <b>Coverage:</b> All active Army JROTC programs, including school name, ZIP code, brigade assignment, and program type
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#ffa94d">&#9632; BSA Councils</div>
        <div class="help-source-detail">
          <b>Source:</b> Boy Scouts of America public API (<a href="https://www.scouting.org" target="_blank" rel="noopener" style="color:#ffa94d">api.scouting.org</a>)<br>
          <b>Currency:</b> Live — reflects current council headquarters locations<br>
          <b>Coverage:</b> All BSA council headquarters across the United States
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#c0828d">&#9632; WP Applicants</div>
        <div class="help-source-detail">
          <b>Source:</b> Recruiter-uploaded CSV file<br>
          <b>Privacy:</b> All processing occurs locally within the browser session; no applicant data is transmitted externally
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#8876c9">&#9632; Gap Analysis</div>
        <div class="help-source-detail">
          <b>Source:</b> Derived locally from the active data layers — no external computation<br>
          <b>Method:</b> Scores ZIP codes by representation deficit relative to pipeline strength and community health indicators
        </div>
      </div>
    `,
  },
  {
    title: 'Loading Data Layers',
    content: `
      <h2>Loading Data Layers</h2>
      <p>All available data layers are accessible from the toolbar at the top of the map. Each layer is loaded independently and can be toggled without reloading the underlying data.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Select a layer button — the button will animate while data is being retrieved.</span></li>
        <li><span class="step-n">2</span><span>Once loaded, the button remains highlighted and the record count is displayed alongside it.</span></li>
        <li><span class="step-n">3</span><span>Click the button again to hide the layer from the map without discarding the data.</span></li>
      </ul>
      <p><span class="help-tag">Health Data</span> — CDC PLACES health estimates by ZIP code, displayed as a blue density heatmap. Health metrics are visible in the info panel for each area.</p>
      <p><span class="help-tag">JROTC</span> — Army JROTC program locations, displayed as sage-green markers.</p>
      <p><span class="help-tag">BSA Councils</span> — Boy Scouts of America council headquarters, displayed as tan markers.</p>
      <div class="help-tip">Health Data geocodes ZIP codes on first load, which may take several minutes for uncached ZIPs. All results are cached locally for 24 hours.</div>
    `,
  },
  {
    title: 'Uploading WP Applicants',
    content: `
      <h2>Uploading Applicant Data</h2>
      <p>Gap Analysis requires a West Point applicant dataset uploaded as a CSV file. This file is processed entirely within the browser and is never transmitted to an external server.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Click the <span class="help-tag">WP Applicants</span> button in the toolbar.</span></li>
        <li><span class="step-n">2</span><span>Select <b>Upload CSV</b> and choose the appropriate file.</span></li>
        <li><span class="step-n">3</span><span>Column headers are detected automatically. Recognized fields include ZIP code, applicant status, submission status, offer status, and athletic data.</span></li>
        <li><span class="step-n">4</span><span>An orange heatmap will render on the map reflecting applicant density by ZIP code.</span></li>
      </ul>
      <div class="help-tip">Applicant data is processed locally and is not retained between sessions unless cached explicitly.</div>
      <p>Supported column headers include: <code style="color:#fb923c">zip</code>, <code style="color:#fb923c">status</code>, <code style="color:#fb923c">submitted</code>, <code style="color:#fb923c">offered</code>. Column names are matched with flexible pattern recognition.</p>
    `,
  },
  {
    title: 'Gap Analysis',
    content: `
      <h2>Gap Analysis</h2>
      <p>Gap Analysis identifies ZIP codes where West Point's recruiting pipeline is absent or proportionally underrepresented relative to the area's candidate potential.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Ensure at least one pipeline layer is active: Health Data, JROTC, or BSA Councils.</span></li>
        <li><span class="step-n">2</span><span>Upload your WP Applicants CSV.</span></li>
        <li><span class="step-n">3</span><span>Activate <span class="help-tag">Gap Analysis</span> — a purple heatmap will render over priority areas.</span></li>
      </ul>

      <p>Two classifications are applied:</p>
      <p><span style="color:#ff3333;font-weight:600">Not on Radar</span> — Areas with zero WP applicant records despite measurable pipeline indicators.</p>
      <p><span style="color:#cc66ff;font-weight:600">Underrepresented</span> — Areas with some WP records, but fewer than expected given their pipeline strength.</p>

      <h2 style="margin-top:14px">Scoring Methodology</h2>

      <p><b>Unrepresented ZIP</b> (zero WP records):</p>
      <p><code style="color:#c084fc">Score = 999 + (M × 10) + (A × 5)</code></p>

      <p style="margin-top:10px"><b>Underrepresented ZIP</b> (some WP records):</p>
      <p><code style="color:#c084fc">Score = (M + A) / (wpCount / 0.5)</code></p>

      <p style="margin-top:12px"><b>M — Composite Multiplier</b> = pipeline multiplier × health multiplier</p>
      <p>Pipeline multiplier starts at 1.0. JROTC presence adds ×1.5; three or more JROTC programs add a further ×1.2; a BSA Council adds ×1.2. The health multiplier is derived from CDC PLACES data — physical inactivity deviation from the 25% national average contributes ±0.25, obesity deviation from 31% contributes ±0.15. The combined health factor is clamped to [0.6, 1.4].</p>

      <p style="margin-top:10px"><b>A — Athletic Modifier</b></p>
      <p>+2 if no existing applicants have sports data; +1 if fewer than 10% do; +0 otherwise. Reflects the likelihood of athletically competitive candidates in areas with no prior athletic signal.</p>

      <p style="margin-top:10px"><b>Representation ratio</b> = wpCount ÷ 0.5, normalized against an assumed 500-student cohort baseline per ZIP.</p>

      <div class="help-tip">Open the <b>GAP LIST</b> panel on the left edge of the map to view a ranked list of priority areas, filterable by status and WP admissions region.</div>
    `,
  },
  {
    title: 'Info Panel',
    content: `
      <h2>Info Panel</h2>
      <p>Selecting any marker or heatmap region on the map opens the Info Panel on the right side of the screen. The panel displays all available data for the selected ZIP code, organized by active layer.</p>
      <p>Sections displayed depend on which layers are currently active:</p>
      <ul class="help-steps-list">
        <li><span class="step-n">&#9632;</span><span><b>Health Data</b> — CDC PLACES community health metrics, including physical inactivity, obesity, smoking, diabetes, and insurance coverage rates.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>JROTC</b> — Program names and brigade assignments for all JROTC units in the ZIP.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>BSA</b> — Council name, council number, and headquarters address.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>WP Applicants</b> — Submission rate, offer rate, athletic data coverage, status breakdown by category, and lead source distribution.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>Gap Analysis</b> — Classification, gap score, pipeline signals, health multiplier, and score components.</span></li>
      </ul>
      <div class="help-tip">Close the panel using the × button. The map viewport adjusts automatically.</div>
    `,
  },
  {
    title: 'Gap List Panel',
    content: `
      <h2>Gap List Panel</h2>
      <p>The <b>GAP LIST</b> tab along the left edge of the map provides a ranked list of the highest-priority gap areas identified by the current analysis.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Gap Analysis must be active for the list to populate.</span></li>
        <li><span class="step-n">2</span><span>Click any entry to navigate the map to that location and open its Info Panel.</span></li>
        <li><span class="step-n">3</span><span>Use the <b>Filter</b> buttons to display all gaps, only <i>Not on Radar</i> areas, or only <i>Underrepresented</i> areas.</span></li>
        <li><span class="step-n">4</span><span>Use the <b>Region</b> dropdown to restrict results to a specific WP admissions region.</span></li>
        <li><span class="step-n">5</span><span>Adjust the <b>Top N per Region</b> field to control the number of results returned per region.</span></li>
      </ul>
    `,
  },
  {
    title: 'Custom Layers',
    content: `
      <h2>Adding Custom Data Layers</h2>
      <p>Any publicly accessible JSON API can be connected as an additional map layer. No programming is required.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Click <span class="help-tag">+ Add Layer</span> in the toolbar.</span></li>
        <li><span class="step-n">2</span><span>Assign a name and display color to the layer.</span></li>
        <li><span class="step-n">3</span><span>Paste the API endpoint URL, then click <b>Detect Fields</b> to automatically enumerate the available data fields.</span></li>
        <li><span class="step-n">4</span><span>Specify whether the API returns geographic coordinates (latitude/longitude) or ZIP codes for location mapping.</span></li>
        <li><span class="step-n">5</span><span>Select the fields to display in the Info Panel when a record is selected.</span></li>
        <li><span class="step-n">6</span><span>Click <b>Add to Map</b> — the layer will load immediately and be persisted for future sessions.</span></li>
      </ul>
      <div class="help-tip">Custom layers are stored in the browser and will reload automatically in subsequent sessions. Click the × adjacent to the layer button to remove it.</div>
    `,
  },
];

(function _initHelp() {
  // ── Inject modal ────────────────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'hf-overlay';
  modal.innerHTML = `
    <div class="hf-dialog" role="dialog" aria-modal="true">
      <div class="hf-header">
        <span class="hf-title">How to Use This Tool</span>
        <button class="hf-close" id="help-close">&times;</button>
      </div>
      <div class="help-body">
        <nav class="help-nav" id="help-nav"></nav>
        <div class="help-content" id="help-content"></div>
      </div>
      <div class="hf-footer">
        <div class="help-footer-nav">
          <button class="hf-btn" id="help-prev">&#8592; Back</button>
          <span class="help-progress" id="help-progress"></span>
          <button class="hf-btn" id="help-next">Next &#8594;</button>
        </div>
        <button class="hf-btn" id="help-done">Done</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Build nav + content panels
  const nav     = document.getElementById('help-nav');
  const content = document.getElementById('help-content');
  HELP_STEPS.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'help-nav-item';
    item.dataset.step = i;
    item.innerHTML = `<span class="help-nav-num">${i + 1}</span>${step.title}`;
    item.onclick = () => _goToStep(i);
    nav.appendChild(item);

    const panel = document.createElement('div');
    panel.className = 'help-step';
    panel.dataset.step = i;
    panel.innerHTML = step.content;
    content.appendChild(panel);
  });

  let _currentStep = 0;

  function _goToStep(i) {
    i = Math.max(0, Math.min(HELP_STEPS.length - 1, i));
    _currentStep = i;
    document.querySelectorAll('.help-nav-item').forEach(el =>
      el.classList.toggle('active', +el.dataset.step === i));
    document.querySelectorAll('.help-step').forEach(el =>
      el.classList.toggle('active', +el.dataset.step === i));
    document.getElementById('help-progress').textContent = `${i + 1} / ${HELP_STEPS.length}`;
    document.getElementById('help-prev').disabled = i === 0;
    document.getElementById('help-next').disabled = i === HELP_STEPS.length - 1;
    document.getElementById('help-content').scrollTop = 0;
  }

  function _open(startStep = 0) {
    modal.classList.add('open');
    _goToStep(startStep);
  }
  function _close() { modal.classList.remove('open'); }

  document.getElementById('help-close').onclick = _close;
  document.getElementById('help-done').onclick   = _close;
  document.getElementById('help-prev').onclick   = () => _goToStep(_currentStep - 1);
  document.getElementById('help-next').onclick   = () => _goToStep(_currentStep + 1);
  modal.addEventListener('click', e => { if (e.target === modal) _close(); });

  window.openHelpModal = _open;
})();


// ════════════════════════════════════════════════════════════════════════════
//  FEEDBACK MODAL
// ════════════════════════════════════════════════════════════════════════════

(function _initFeedback() {
  // ── Inject modal ────────────────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.id = 'feedback-modal';
  modal.className = 'hf-overlay';
  modal.innerHTML = `
    <div class="hf-dialog" role="dialog" aria-modal="true">
      <div class="hf-header">
        <span class="hf-title">Share Feedback</span>
        <button class="hf-close" id="fb-close">&times;</button>
      </div>

      <div class="feedback-body" id="fb-form-body">
        <div class="fb-field">
          <label for="fb-name">Your Name <span class="fb-optional">(optional)</span></label>
          <input type="text" id="fb-name" placeholder="e.g. Capt. Smith">
        </div>
        <div class="fb-field">
          <label for="fb-type">Type of Feedback</label>
          <select id="fb-type">
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report — something isn't working</option>
            <option value="feature">Feature Request — something I'd like added</option>
            <option value="data">Data Issue — wrong or missing data</option>
            <option value="ux">Usability — the tool is hard to use in some way</option>
          </select>
        </div>
        <div class="fb-field">
          <label for="fb-msg">Feedback <span style="color:#ef4444">*</span></label>
          <textarea id="fb-msg" placeholder="Describe what you noticed, what you'd like to see changed, or what would make this tool more useful for your work…"></textarea>
        </div>
      </div>

      <div class="fb-success" id="fb-success">
        <div class="fb-success-icon">&#10003;</div>
        <div class="fb-success-msg">Feedback recorded!</div>
        <div class="fb-success-sub" id="fb-success-sub"></div>
      </div>

      <div class="hf-footer">
        <button class="hf-btn" id="fb-cancel">Cancel</button>
        <button class="hf-btn hf-btn-primary" id="fb-submit">Submit Feedback</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  function _open() {
    // Reset form
    document.getElementById('fb-name').value = '';
    document.getElementById('fb-msg').value  = '';
    document.getElementById('fb-type').value = 'general';
    document.getElementById('fb-form-body').style.display  = '';
    document.getElementById('fb-success').classList.remove('show');
    document.getElementById('fb-submit').disabled = false;
    document.getElementById('fb-submit').textContent = 'Submit Feedback';
    modal.classList.add('open');
    setTimeout(() => document.getElementById('fb-msg').focus(), 60);
  }
  function _close() { modal.classList.remove('open'); }

  document.getElementById('fb-close').onclick  = _close;
  document.getElementById('fb-cancel').onclick = _close;
  modal.addEventListener('click', e => { if (e.target === modal) _close(); });

  document.getElementById('fb-submit').onclick = function () {
    const msg = document.getElementById('fb-msg').value.trim();
    if (!msg) {
      document.getElementById('fb-msg').focus();
      document.getElementById('fb-msg').style.borderColor = '#ef4444';
      setTimeout(() => document.getElementById('fb-msg').style.borderColor = '', 1500);
      return;
    }

    const name = document.getElementById('fb-name').value.trim();
    const type = document.getElementById('fb-type');
    const typeLabel = type.options[type.selectedIndex].text;

    // Save to localStorage log
    const log = JSON.parse(localStorage.getItem('wpFeedbackLog') || '[]');
    log.push({ ts: new Date().toISOString(), name, type: type.value, typeLabel, msg });
    localStorage.setItem('wpFeedbackLog', JSON.stringify(log));

    // Build a formatted text block
    const body = [
      `Type: ${typeLabel}`,
      name ? `From: ${name}` : null,
      `Date: ${new Date().toLocaleString()}`,
      '',
      msg,
    ].filter(l => l !== null).join('\n');

    let subMsg = 'Your feedback has been saved locally.';

    if (FEEDBACK_EMAIL) {
      const subject = encodeURIComponent(`[WP Intel] Feedback: ${typeLabel}`);
      const emailBody = encodeURIComponent(body);
      window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${emailBody}`, '_blank');
      subMsg = `Your email client is opening to send this to ${FEEDBACK_EMAIL}.`;
    } else {
      // Copy to clipboard as a fallback
      navigator.clipboard?.writeText(body).catch(() => {});
      subMsg = 'Feedback saved. You can also copy it from the clipboard.';
    }

    document.getElementById('fb-form-body').style.display = 'none';
    document.getElementById('fb-success-sub').textContent = subMsg;
    document.getElementById('fb-success').classList.add('show');
    document.getElementById('fb-submit').disabled = true;

    // Auto-close after 3 s
    setTimeout(_close, 3000);
  };

  window.openFeedbackModal = _open;
})();


// ════════════════════════════════════════════════════════════════════════════
//  INJECT HEADER BUTTONS
// ════════════════════════════════════════════════════════════════════════════

(function _injectButtons() {
  const header = document.getElementById('header');
  if (!header) return;

  const wrap = document.createElement('div');
  wrap.id = 'header-actions';

  const helpBtn = document.createElement('button');
  helpBtn.className = 'hdr-btn hdr-help';
  helpBtn.title = 'How to use this tool';
  helpBtn.innerHTML = '? Help';
  helpBtn.onclick = () => openHelpModal(0);

  const fbBtn = document.createElement('button');
  fbBtn.className = 'hdr-btn hdr-feedback';
  fbBtn.title = 'Share feedback or report an issue';
  fbBtn.innerHTML = '&#9998; Feedback';
  fbBtn.onclick = () => openFeedbackModal();

  wrap.append(helpBtn, fbBtn);
  header.appendChild(wrap);
})();
