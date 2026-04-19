// ═══════════════════════════════════════════════════════════════════════════════
//
//  CUSTOM DATA LAYERS  —  Add new data sources here
//
//  HOW TO ADD A NEW DATA SOURCE (no coding required):
//
//  1. Copy one of the example blocks below (the ones wrapped in /* ... */)
//  2. Paste it inside the CUSTOM_LAYERS = [ ... ] array
//  3. Fill in your values following the guide comments
//  4. Save this file and reload the page — the new layer button appears automatically!
//
//  TIPS:
//  • "field" values must exactly match the field names returned by your API
//    (check your API's response in a browser to see the field names)
//  • Use https://jsonformatter.org to preview your API response if unsure
//  • You can add as many layers as you like — just separate each block with a comma
//
// ═══════════════════════════════════════════════════════════════════════════════

const CUSTOM_LAYERS = [

  // ─── EXAMPLE A: JSON API with latitude/longitude fields ────────────────────
  //
  // Use this when your API already gives you lat/lng coordinates.
  //
  /*
  {
    id: "fire_stations",           // Unique ID — no spaces, use underscores
    label: "Fire Stations",        // Text on the toolbar button
    color: "#ff4500",              // Dot/button color — any hex color (#rrggbb)

    source: {
      type: "json",                // Always "json" for web APIs
      url: "https://api.example.gov/fire-stations",

      // OPTIONAL — only needed if your records are nested inside a key.
      // Example: if the API returns { "data": [ {...}, {...} ] }, set: dataPath: "data"
      // If the API returns an array directly [ {...}, {...} ], leave this out.
      dataPath: "data",
    },

    location: {
      type: "latlng",              // Use "latlng" when the API has lat & lng columns
      latField: "latitude",        // Exact name of the latitude field in the API
      lngField: "longitude",       // Exact name of the longitude field in the API
    },

    visualization: "circles",      // "circles" = individual dots  |  "heat" = heatmap glow

    // Fields shown in the info panel when someone clicks a marker.
    // "label" = what the user sees, "field" = exact field name from the API.
    popup: [
      { label: "Station Name", field: "name"    },
      { label: "City",         field: "city"    },
      { label: "State",        field: "state"   },
      { label: "Address",      field: "address" },
    ],
  },
  */


  // ─── EXAMPLE B: JSON API — location via ZIP code (no lat/lng in API) ───────
  //
  // Use this when your API only has ZIP codes.
  // The map will automatically look up the coordinates.
  //
  /*
  {
    id: "colleges",
    label: "Colleges",
    color: "#a855f7",

    source: {
      type: "json",
      url: "https://api.example.edu/colleges",
      dataPath: "results",         // Remove this line if API returns an array directly
    },

    location: {
      type: "zip",                 // Use "zip" when there's no lat/lng — just a ZIP code
      zipField: "zip_code",        // Exact name of the ZIP code field in the API
    },

    visualization: "circles",

    popup: [
      { label: "College Name", field: "institution_name"  },
      { label: "City",         field: "city"              },
      { label: "State",        field: "state_abbr"        },
      { label: "Enrollment",   field: "total_enrollment"  },
    ],
  },
  */


  // ─── ADD YOUR LAYERS BELOW THIS LINE ───────────────────────────────────────
  //
  // Copy one of the examples above, paste it here, and fill in your values.
  //
  // Remember: separate multiple layers with a comma, like this:
  //
  //   { id: "layer_one", ... },
  //   { id: "layer_two", ... },
  //

];
