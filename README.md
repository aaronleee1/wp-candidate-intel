# West Point Candidate Intelligence Tool
### Recruitment Gap Analysis Platform — MVP1

---

## Overview

The West Point Candidate Intelligence Tool is a browser-based geospatial analysis platform designed to support United States Military Academy admissions officers and field force recruiters in identifying high-potential recruiting areas that are currently underrepresented in the West Point applicant pool.

The tool integrates four independent data sources — national high school enrollment, Army JROTC program locations, Boy Scouts of America council data, and a user-supplied West Point applicant file — to produce a ranked, map-based view of ZIP codes where recruiting investment is most likely to yield qualified candidates.

No installation is required. The application runs entirely in a web browser by opening `index.html`.

---

## Strategic Purpose

Traditional recruiting efforts often concentrate in areas where West Point already has strong name recognition and applicant history. This tool takes the inverse approach: it systematically surfaces areas where the pipeline signals are strong — high school enrollment, JROTC programs, BSA participation — but West Point visibility is low or nonexistent.

The output is a prioritized list of ZIP codes, ranked by recruiting opportunity, that can directly inform field force assignments, alumni outreach targeting, and regional admissions strategy.

---

## Data Sources

| Layer | Source | Coverage |
|---|---|---|
| High Schools | NCES Education Data API (2022) | ~130,000 public and private high schools nationwide |
| JROTC Programs | Army JROTC School Report (April 2024) | All active Army JROTC program locations |
| BSA Councils | Boy Scouts of America Scouting API | Council headquarters locations nationwide |
| WP Applicants | Recruiter-supplied CSV upload | Historical West Point applicant records by ZIP code |

All data processing occurs locally in the browser. Uploaded applicant files are never transmitted to any external server.

---

## Gap Analysis Methodology

### What Constitutes a "Gap"

A recruiting gap exists when a geographic area demonstrates strong indicators of candidate potential but produces few or zero West Point applicants. The algorithm evaluates every ZIP code present in the JROTC, BSA, or NCES datasets and assigns a gap score based on the following factors.

### Scoring Formula

**Step 1 — Representation Ratio**

For each ZIP code, the tool calculates how many West Point applicant records exist per 1,000 enrolled high school students:

```
Representation Ratio = WP Records / (Enrollment / 1,000)
```

A ZIP with 2,000 enrolled students and 4 WP applicants has a ratio of 2.0. A ZIP with 2,000 students and zero applicants has a ratio of 0.

If enrollment data is unavailable for a ZIP (i.e., NCES data does not cover it), a conservative default of 500 students is assumed.

**Step 2 — Pipeline Signal Multipliers**

Areas with established military or civic leadership pipelines receive score multipliers, reflecting that JROTC participants and Eagle Scouts are disproportionately strong West Point candidates:

| Signal | Multiplier |
|---|---|
| 1–2 JROTC programs in ZIP | ×1.5 |
| 3 or more JROTC programs in ZIP | ×1.5 × 1.2 = ×1.8 |
| BSA Council presence | ×1.2 |
| Both JROTC and BSA | Multipliers stack |

**Step 3 — Athletic Signal Modifier**

West Point places significant emphasis on athletic ability. ZIPs where existing applicants have little or no recorded athletic data receive an additional gap signal, reflecting that the athletic pipeline from that area has not been tapped:

| Condition | Modifier |
|---|---|
| No WP applicants from ZIP | +2 (maximum signal) |
| Existing applicants, but fewer than 10% have sports data | +1 |
| Existing applicants with adequate athletic data | +0 |

**Step 4 — Final Gap Score**

```
If zero WP records:   Gap Score = 999 + (Multiplier × 10) + (Athletic Modifier × 5)
If some WP records:   Gap Score = (Multiplier + Athletic Modifier) / Representation Ratio
```

ZIPs with zero West Point records receive a base score of 999 or higher, placing them at the top of the priority list regardless of other factors. This reflects the admissions office priority of establishing a presence in completely uncharted areas before refining performance in partially-engaged ones.

### Gap Classification

| Classification | Criteria | Map Color |
|---|---|---|
| **Not on Radar** | Zero West Point applicant records from this ZIP | Red |
| **Underrepresented** | Some applicant records exist, but the representation ratio is low relative to enrollment and pipeline signals | Purple |

---

## Regional Structure

Gap results are organized by the five West Point admissions regions. By default, the tool surfaces the top 20 scoring ZIP codes per region, ensuring geographic balance in the output rather than over-indexing on a single high-density area.

| Region | States |
|---|---|
| Northeast | ME, NH, VT, MA, RI, CT, NY, NJ, PA, DE, MD, DC |
| Southeast | VA, WV, NC, SC, GA, FL, AL, MS, TN, KY, AR, LA |
| Great Lakes | OH, MI, IN, IL, WI, MN, IA, MO, ND, SD, NE, KS |
| Southwest | TX, OK, NM, AZ, CO, UT, NV |
| Far West | CA, OR, WA, AK, HI, ID, MT, WY |

The recruiter can filter results to a specific region or congressional district using the controls in the Gap List panel.

---

## How to Use the Tool

### Setup (First Time Only)

#### Step 1: Install Git

Git is a tool that downloads the project files to your computer.

**On Mac:**
1. Visit https://git-scm.com/download/mac
2. Download the installer and run it
3. Follow the installation steps

**On Windows:**
1. Visit https://git-scm.com/download/win
2. Download the installer and run it
3. Follow the installation steps (accept all default options)

#### Step 2: Install VS Code (Optional but Recommended)

VS Code is a text editor that makes it easy to view and work with the project files. You don't *need* it, but it's helpful.

1. Visit https://code.visualstudio.com
2. Click the download button for your computer (Mac or Windows)
3. Run the installer and follow the steps

#### Step 3: Download the Project

Open your terminal or command prompt and run this command:

**Mac:** Open Spotlight (Cmd+Space), type "Terminal", and press Enter

**Windows:** Press the Windows key, type "Command Prompt" or "PowerShell", and press Enter

Then copy and paste this entire command and press Enter:

```bash
git clone https://github.com/your-username/wp-candidate-intel.git
cd wp-candidate-intel
```

This downloads all the project files to your computer.

#### Step 4: Start the Web Server

The app runs in your web browser. To do that, we need to start a simple web server.

While still in the terminal, copy and paste this command and press Enter:

```bash
python3 -m http.server 8000
```

You should see a message that looks like:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

This means the server is running. **Leave this terminal window open** — don't close it.

#### Step 5: Open the App in Your Browser

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Type this into the address bar and press Enter:
   ```
   http://localhost:8000
   ```
3. You should see a map. The app is now running!

---

### Using the Tool (Once Setup is Complete)

#### 1. Load Data Layers

Click the layer buttons in the top navigation bar to load each dataset. Layers can be toggled on or off independently. The High Schools, JROTC, and BSA layers load automatically on startup.

| Button | What It Loads |
|---|---|
| **High Schools** | NCES school density heatmap (blue) |
| **JROTC** | Individual Army JROTC program locations (green dots) |
| **BSA Councils** | Boy Scout council headquarters (tan dots) |
| **WP Applicants** | Historical applicant heatmap from uploaded CSV (amber/orange) |
| **Gap Analysis** | Scored recruiting gap map (purple/red, requires CSV) |

#### 2. Upload the West Point Applicant CSV

Click **Upload CSV** within the WP Applicants button and select the applicant data file. The tool expects the following columns (matched case-insensitively):

| Column | Description |
|---|---|
| `zip` | 5-digit applicant ZIP code |
| `person status` | Current applicant status |
| `person list source` | Lead source or referral channel |
| `submitted` | Application submitted — `Yes` / `No` |
| `offered` | Admission offered — `Yes` / `No` |
| `state district` | State legislative district |
| `sport 1`, `sport 2`, … | Athletic participation (any column containing "sport") |

**Don't have your own data yet?** Download this [sample CSV file](https://docs.google.com/spreadsheets/d/1w4xO-px8cY67mnueNFs37diY4uh04QwT/edit?usp=drive_link&ouid=110601371280485910617&rtpof=true&sd=true) to test the tool. Open it in Google Sheets or Excel, download it as a CSV file, and upload it to the tool to see how the gap analysis works.

#### 3. Enable Gap Analysis

Once the applicant CSV is loaded, click **Gap Analysis**. The map will display scored ZIP codes as circles — larger and redder circles represent higher-priority recruiting targets.

#### 4. Review the Gap List

Click the **GAP LIST** tab on the left edge of the map to open the ranked panel. This panel lists the top-scoring ZIP codes per region in priority order, showing the city, state, ZIP code, gap classification, pipeline signals present, and applicant count.

Use the filter controls to narrow results:
- **All / Not on Radar / Underrepresented** — filter by gap classification
- **Region** — restrict to one of the five West Point admissions regions
- **District** — restrict to a specific congressional district
- **Top N per region** — adjust how many ZIPs per region are shown (default: 20)

#### 5. Inspect a Location

Click any dot on the map or any entry in the Gap List to open the detail sidebar. The sidebar provides a full breakdown of all available data for that ZIP code, including school names and enrollment figures, JROTC program details, BSA council information, WP applicant statistics, and the computed gap score.

---

### Stopping the App

When you're done using the app, go back to the terminal window (the one running the web server) and press **Ctrl+C** (on both Mac and Windows). This stops the server. The next time you want to use the app, just repeat Step 4 above.

---

## Interpreting Results

**High priority targets** are ZIP codes that are:
- Not on Radar (zero WP records), AND
- Have one or more JROTC programs, AND
- Have significant high school enrollment

These represent areas where the recruiting infrastructure already exists — students are participating in military leadership programs — but West Point has no established presence.

**Secondary targets** are Underrepresented ZIPs where some applicant history exists but the representation ratio is well below what the enrollment and pipeline signals would predict. These areas may have had sporadic outreach but have not been systematically cultivated.

**Congressional district filter** is particularly useful for coordinating with congressional nominee processes, allowing the recruiter to view gap areas within a specific representative's district.

---

## File Reference

```
MVP1/
├── index.html                  # Application entry point
├── css/styles.css              # Stylesheet
├── js/
│   ├── constants.js            # API endpoints, WP region definitions
│   ├── state.js                # Map and layer state
│   ├── main.js                 # Startup sequence
│   ├── helpers.js              # Utility functions
│   ├── geocoding.js            # ZIP code geocoding
│   ├── counties.js             # County geometry utilities
│   ├── layer-handlers.js       # Layer toggle logic
│   ├── nces.js                 # High school data
│   ├── jrotc.js                # JROTC program data
│   ├── bsa.js                  # BSA council data
│   ├── csv.js                  # WP applicant CSV processing
│   ├── gap.js                  # Gap scoring algorithm
│   ├── sidebar.js              # Location detail panel
│   ├── left-panel.js           # Gap list panel
│   └── legend.js               # Map legend
├── data/
│   ├── jrotc.xlsx              # Bundled JROTC school roster (April 2024)
│   ├── bsa-councils.json       # Pre-cached BSA council locations
│   ├── zip-county.json         # ZIP-to-county mapping
│   └── us-counties.geojson     # County boundary geometry
└── js/lib/
    └── xlsx.full.min.js        # SheetJS library (local copy)
```

---

## Technical Notes

- The NCES High Schools layer requires an active internet connection and may take 60–90 seconds to fully load due to the volume of records (~130,000 schools paginated across multiple API requests).
- JROTC and BSA data are pre-cached locally and load within seconds.
- Overseas Army JROTC programs (APO ZIP codes) and programs in U.S. territories are excluded from the map due to geocoding limitations of the ZIP lookup service, but are present in the underlying spreadsheet data.
- The West Point admissions region assignments in `js/constants.js` should be verified against the current official regional boundaries maintained by the USMA Admissions office.
