// ─── HELP & FEEDBACK ─────────────────────────────────────────────────────────

// ── Configure the feedback recipient email here ──────────────────────────────
const FEEDBACK_EMAIL = '';   // e.g. 'recruiter@westpoint.edu' — leave blank to copy to clipboard only


// ════════════════════════════════════════════════════════════════════════════
//  HELP MODAL
// ════════════════════════════════════════════════════════════════════════════

const HELP_STEPS = [
  {
    title: 'Welcome',
    content: `
      <h2>Welcome to West Point Candidate Intelligence</h2>
      <p>This tool helps you identify high-potential recruiting areas across the United States by overlaying multiple data sources on an interactive map.</p>
      <p>Use the layer buttons in the toolbar to load data, upload your applicant CSV, then run Gap Analysis to find ZIP codes that are underrepresented in West Point's pipeline.</p>
      <div class="help-tip">Use the numbered sections on the left to jump to any topic.</div>
    `,
  },
  {
    title: 'Data Sources',
    content: `
      <h2>Where the Data Comes From</h2>
      <p>Every layer pulls from a live, public data source — no data is stored on a private server.</p>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#4dabf7">&#9632; High Schools</div>
        <div class="help-source-detail">
          <b>Source:</b> <a href="https://www.openstreetmap.org" target="_blank" rel="noopener" style="color:#4dabf7">OpenStreetMap</a> via the Overpass API<br>
          <b>Currency:</b> Continuously updated by a global community of contributors<br>
          <b>Coverage:</b> US schools tagged as secondary-level — includes name, address, phone, and website where contributors have added them<br>
          <b>Limitation:</b> Coverage varies; schools not yet tagged in OSM will not appear
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#51cf66">&#9632; JROTC Programs</div>
        <div class="help-source-detail">
          <b>Source:</b> U.S. Army JROTC (<a href="https://usarmyjrotc.army.mil" target="_blank" rel="noopener" style="color:#51cf66">usarmyjrotc.army.mil</a>)<br>
          <b>Currency:</b> April 2024 official program roster (bundled spreadsheet)<br>
          <b>Coverage:</b> All active Army JROTC programs with school name, ZIP, brigade, and program type
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#ffa94d">&#9632; BSA Councils</div>
        <div class="help-source-detail">
          <b>Source:</b> Boy Scouts of America (<a href="https://www.scouting.org" target="_blank" rel="noopener" style="color:#ffa94d">api.scouting.org</a>)<br>
          <b>Currency:</b> Live API — reflects current council locations<br>
          <b>Coverage:</b> All BSA council headquarters discovered by probing ZIP codes nationwide
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#c0828d">&#9632; WP Applicants</div>
        <div class="help-source-detail">
          <b>Source:</b> Your uploaded CSV file<br>
          <b>Privacy:</b> Processed entirely in your browser — never sent to any external server
        </div>
      </div>

      <div class="help-source-block">
        <div class="help-source-name" style="color:#8876c9">&#9632; Gap Analysis</div>
        <div class="help-source-detail">
          <b>Source:</b> Computed locally from the layers above — no external API<br>
          <b>Method:</b> Scores ZIP codes by WP representation relative to pipeline signals (JROTC/BSA presence)
        </div>
      </div>
    `,
  },
  {
    title: 'Loading Data Layers',
    content: `
      <h2>Loading Data Layers</h2>
      <p>The toolbar at the top shows all available data layers. Click any button to load and display that layer on the map.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Click a layer button — it will pulse while loading.</span></li>
        <li><span class="step-n">2</span><span>Once loaded, the button stays highlighted and the record count appears next to it.</span></li>
        <li><span class="step-n">3</span><span>Click the button again to hide that layer without losing the data.</span></li>
      </ul>
      <p><span class="help-tag">High Schools</span> — US high schools from OpenStreetMap. Shown as a blue heatmap. Includes phone and website links in the info panel where available.</p>
      <p><span class="help-tag">JROTC</span> — Army JROTC program locations. Shown as sage-green dots.</p>
      <p><span class="help-tag">BSA Councils</span> — Boy Scouts of America council headquarters. Shown as tan dots.</p>
      <div class="help-tip">High Schools loads from OpenStreetMap and may take 15–60 seconds. All other layers load in a few seconds. Data is not cached between sessions.</div>
    `,
  },
  {
    title: 'Uploading WP Applicants',
    content: `
      <h2>Uploading Your WP Applicants CSV</h2>
      <p>To unlock Gap Analysis, you need to upload your West Point applicant data as a CSV file.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Click the <span class="help-tag">WP Applicants</span> button in the toolbar.</span></li>
        <li><span class="step-n">2</span><span>Click <b>Upload CSV</b> and select your file.</span></li>
        <li><span class="step-n">3</span><span>The tool auto-detects columns for ZIP code, name, status, submitted, offered, sports, and more.</span></li>
        <li><span class="step-n">4</span><span>An orange heatmap will appear showing applicant density by ZIP code.</span></li>
      </ul>
      <div class="help-tip">Your CSV file is processed entirely in your browser — no data is uploaded to any server.</div>
      <p>Expected columns include: <code style="color:#fb923c">zip</code>, <code style="color:#fb923c">status</code>, <code style="color:#fb923c">submitted</code>, <code style="color:#fb923c">offered</code>. Column names are matched flexibly.</p>
    `,
  },
  {
    title: 'Gap Analysis',
    content: `
      <h2>Running Gap Analysis</h2>
      <p>Gap Analysis finds ZIP codes with high candidate potential that are underrepresented in your applicant pipeline.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Load at least one of: High Schools, JROTC, or BSA Councils.</span></li>
        <li><span class="step-n">2</span><span>Upload your WP Applicants CSV.</span></li>
        <li><span class="step-n">3</span><span>Click <span class="help-tag">Gap Analysis</span> — a purple heatmap appears.</span></li>
      </ul>
      <p>Two types of gaps are identified:</p>
      <p><span style="color:#ff3333;font-weight:600">Not on Radar</span> — ZIP codes with zero WP records but significant pipeline signals.</p>
      <p><span style="color:#cc66ff;font-weight:600">Underrepresented</span> — ZIP codes with some WP records but fewer than expected given their pipeline signals.</p>

      <h2 style="margin-top:14px">How the Score is Calculated</h2>
      <p>Each ZIP code receives a <b>Gap Score</b> — higher means higher recruiting priority.</p>

      <p style="margin-top:8px"><b>Step 1 — Pipeline Multiplier</b></p>
      <p>Starts at 1.0. Boosted by presence of youth pipeline programs:</p>
      <ul class="help-steps-list">
        <li><span class="step-n">×</span><span>JROTC program present → <b>×1.5</b></span></li>
        <li><span class="step-n">×</span><span>3+ JROTC programs → additional <b>×1.2</b></span></li>
        <li><span class="step-n">×</span><span>BSA Council present → <b>×1.2</b></span></li>
      </ul>

      <p style="margin-top:8px"><b>Step 2 — Health Multiplier</b> <span style="color:#aaa;font-size:0.8rem">(from CDC PLACES)</span></p>
      <p>Adjusts for community fitness — areas with lower physical inactivity and obesity rates have a larger pool of physically eligible candidates:</p>
      <ul class="help-steps-list">
        <li><span class="step-n">↑</span><span>Physical inactivity below 25% national avg → boost up to <b>×1.25</b></span></li>
        <li><span class="step-n">↓</span><span>Physical inactivity above 25% → reduction down to <b>×0.75</b></span></li>
        <li><span class="step-n">↑</span><span>Obesity below 31% national avg → boost up to <b>×1.15</b></span></li>
        <li><span class="step-n">↓</span><span>Obesity above 31% → reduction down to <b>×0.85</b></span></li>
      </ul>
      <p>Combined health multiplier is capped between <b>0.6×</b> and <b>1.4×</b>.</p>

      <p style="margin-top:8px"><b>Step 3 — Athletic Modifier</b></p>
      <p>Added based on sports participation in existing WP applicant records: <b>+2</b> if no athletes, <b>+1</b> if &lt;10% athletes, <b>+0</b> otherwise.</p>

      <p style="margin-top:8px"><b>Final Score</b></p>
      <p>If zero WP records: <code style="color:#c084fc">999 + (multiplier × 10) + (athleticMod × 5)</code></p>
      <p>If some WP records: <code style="color:#c084fc">(multiplier + athleticMod) / repRatio</code></p>
      <p style="color:#aaa;font-size:0.8rem">repRatio = WP applicant count ÷ 0.5 (assumed 500-student cohort baseline)</p>

      <div class="help-tip">Open the <b>GAP LIST</b> tab on the left edge of the map to see a ranked list of top gap areas filtered by region.</div>
    `,
  },
  {
    title: 'The Info Panel',
    content: `
      <h2>Reading the Info Panel</h2>
      <p>Click any dot or heatmap area on the map to open the info panel on the right side. It shows all available data for that ZIP code.</p>
      <p>Depending on which layers are active, you will see sections for:</p>
      <ul class="help-steps-list">
        <li><span class="step-n">&#9632;</span><span><b>High Schools</b> — school names, addresses, phone numbers, and website links (where available in OpenStreetMap).</span></li>
        <li><span class="step-n">&#9632;</span><span><b>JROTC</b> — program names and brigade assignments.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>BSA</b> — council name, number, and HQ address.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>WP Applicants</b> — submission rate, offer rate, sports data, status breakdown.</span></li>
        <li><span class="step-n">&#9632;</span><span><b>Gap Score</b> — status, score multiplier, pipeline signals.</span></li>
      </ul>
      <div class="help-tip">Close the panel with the × button. The map resizes automatically.</div>
    `,
  },
  {
    title: 'Gap List Panel',
    content: `
      <h2>Using the Gap List</h2>
      <p>The <b>GAP LIST</b> tab on the left edge of the map opens a ranked list of the highest-priority gap areas.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Enable Gap Analysis first — the list only populates when the layer is active.</span></li>
        <li><span class="step-n">2</span><span>Click any item in the list to fly the map to that ZIP code and open its info panel.</span></li>
        <li><span class="step-n">3</span><span>Use the <b>Filter</b> buttons to show all gaps, only "Not on Radar", or only "Underrepresented".</span></li>
        <li><span class="step-n">4</span><span>Filter by <b>Region</b> using the dropdown to focus on a specific WP admissions region.</span></li>
        <li><span class="step-n">5</span><span>Adjust <b>Top N per region</b> to control how many results show per region.</span></li>
      </ul>
    `,
  },
  {
    title: 'Adding Custom Layers',
    content: `
      <h2>Adding Your Own Data Source</h2>
      <p>You can connect any public JSON API as a new map layer — no coding required.</p>
      <ul class="help-steps-list">
        <li><span class="step-n">1</span><span>Click <span class="help-tag">+ Add Layer</span> in the toolbar.</span></li>
        <li><span class="step-n">2</span><span>Enter a name and pick a color for the layer.</span></li>
        <li><span class="step-n">3</span><span>Paste the API URL, then click <b>Detect Fields</b> to automatically discover the available field names.</span></li>
        <li><span class="step-n">4</span><span>Choose whether the API has lat/lng coordinates or ZIP codes for location.</span></li>
        <li><span class="step-n">5</span><span>Select which fields to show in the info panel when someone clicks a dot.</span></li>
        <li><span class="step-n">6</span><span>Click <b>Add to Map</b> — the layer loads immediately and is saved for future sessions.</span></li>
      </ul>
      <div class="help-tip">Custom layers are saved in your browser and will reappear the next time you open this page. Click the × next to the button to remove a layer.</div>
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
