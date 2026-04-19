// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CORS_PROXY  = 'https://corsproxy.io/?';
const CORS_PROXY2 = 'https://api.allorigins.win/raw?url=';
const JROTC_URL   = 'https://usarmyjrotc.army.mil/wp-content/uploads/2023/04/School_Report-as-of-4-5-24.xlsx';
const BSA_API     = 'https://api.scouting.org/organizations/v2/zip';
const OVERPASS_API   = 'https://overpass-api.de/api/interpreter';
const ZIP_API     = 'https://api.zippopotam.us/us';
const LOCAL_JROTC_FILE = 'data/jrotc.xlsx';
const LOCAL_BSA_FILE   = 'data/bsa-councils.json';
const LOCAL_COUNTIES_FILE = 'data/us-counties.geojson';
const FCC_COUNTY_API = 'https://geo.fcc.gov/api/census/area';

// ~130 well-distributed zip codes to seed BSA council discovery
// WP Admissions Regions by state abbreviation.
// NOTE: Verify exact state assignments with West Point admissions sponsor contact.
const WP_REGIONS = {
  // Northeast Region
  'ME':'Northeast', 'NH':'Northeast', 'VT':'Northeast', 'MA':'Northeast',
  'RI':'Northeast', 'CT':'Northeast', 'NY':'Northeast', 'NJ':'Northeast',
  'PA':'Northeast', 'DE':'Northeast', 'MD':'Northeast', 'DC':'Northeast',

  // Southeast Region
  'VA':'Southeast', 'WV':'Southeast', 'NC':'Southeast', 'SC':'Southeast',
  'GA':'Southeast', 'FL':'Southeast', 'AL':'Southeast', 'MS':'Southeast',
  'TN':'Southeast', 'KY':'Southeast', 'AR':'Southeast', 'LA':'Southeast',

  // Great Lakes Region
  'OH':'Great Lakes', 'MI':'Great Lakes', 'IN':'Great Lakes', 'IL':'Great Lakes',
  'WI':'Great Lakes', 'MN':'Great Lakes', 'IA':'Great Lakes', 'MO':'Great Lakes',
  'ND':'Great Lakes', 'SD':'Great Lakes', 'NE':'Great Lakes', 'KS':'Great Lakes',

  // Southwest Region
  'TX':'Southwest', 'OK':'Southwest', 'NM':'Southwest', 'AZ':'Southwest',
  'CO':'Southwest', 'UT':'Southwest', 'NV':'Southwest',

  // Far West Region
  'CA':'Far West', 'OR':'Far West', 'WA':'Far West',
  'AK':'Far West', 'HI':'Far West', 'ID':'Far West',
  'MT':'Far West', 'WY':'Far West',
};

const BSA_SEED_ZIPS = [
  // State capitals
  '36104','99801','85007','72201','80203','06103','19901','32301','30334','96813',
  '83702','62701','46204','50319','66612','40601','70801','04330','21401','02108',
  '48933','55155','39201','65101','59601','68509','89701','03301','08608','87501',
  '12224','27601','58501','43215','73105','97301','17120','02903','29201','57501',
  '37243','78701','84114','05602','23219','98504','25305','53702','82002',
  // Extra coverage for large / multi-council states
  '90001','94102','95814','92101','93401',        // CA
  '77001','75201','78201','76102','79401','78401', // TX
  '10001','14604','13201','12601',                 // NY
  '33101','32201','33601','32801','32501',         // FL
  '44114','45202','44701',                         // OH
  '19102','15219','18501',                         // PA
  '60601','61801',                                 // IL
  '48201','49503',                                 // MI
  '30301','31401',                                 // GA
  '28201','27401',                                 // NC
  '35233','35801',                                 // AL
  '85251','86001',                                 // AZ
  '80521','81001',                                 // CO
  '06510',                                         // CT
  '47401',                                         // IN
  '52401',                                         // IA
  '67201',                                         // KS
  '71101',                                         // LA
  '01601',                                         // MA
  '56301',                                         // MN
  '38701',                                         // MS
  '64108',                                         // MO
  '59801',                                         // MT
  '89501',                                         // NV
  '07101','07701',                                 // NJ
  '74103',                                         // OK
  '97401',                                         // OR
  '37402','38101',                                 // TN
  '84403',                                         // UT
  '22601',                                         // VA
  '99201',                                         // WA
  '54601'                                          // WI
];
