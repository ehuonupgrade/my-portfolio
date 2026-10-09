/**
 * Geographic utility for South Bay & Peninsula Zip Codes.
 * Used for dynamic distance recalculation, location name resolution,
 * and radius filtering.
 */

export interface ZipLocationInfo {
  zip: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const DEFAULT_ZIP = '95131';

export const BAY_AREA_ZIP_DIRECTORY: Record<string, ZipLocationInfo> = {
  // North San Jose & Milpitas (Immediate vicinity of 95131)
  '95131': { zip: '95131', name: 'North San Jose / Berryessa', city: 'San Jose', lat: 37.3881, lng: -121.8988 },
  '95132': { zip: '95132', name: 'Berryessa Foothills / Piedmont', city: 'San Jose', lat: 37.4048, lng: -121.8488 },
  '95133': { zip: '95133', name: 'North Capitol / Berryessa South', city: 'San Jose', lat: 37.3752, lng: -121.8596 },
  '95134': { zip: '95134', name: 'River Oaks / Alviso / Cisco Way', city: 'San Jose', lat: 37.4168, lng: -121.9442 },
  '95035': { zip: '95035', name: 'Milpitas / Great Mall / Calaveras', city: 'Milpitas', lat: 37.4323, lng: -121.8996 },

  // Santa Clara & North
  '95054': { zip: '95054', name: 'Santa Clara (North / Great America)', city: 'Santa Clara', lat: 37.3941, lng: -121.9680 },
  '95050': { zip: '95050', name: 'Santa Clara (Central / Univ)', city: 'Santa Clara', lat: 37.3541, lng: -121.9552 },
  '95051': { zip: '95051', name: 'Santa Clara (West / Lawrence)', city: 'Santa Clara', lat: 37.3524, lng: -121.9902 },

  // San Jose Central, Downtown & Surrounds
  '95112': { zip: '95112', name: 'San Jose (Downtown / Japantown)', city: 'San Jose', lat: 37.3486, lng: -121.8844 },
  '95110': { zip: '95110', name: 'San Jose (Guadalupe / CDM Museum)', city: 'San Jose', lat: 37.3361, lng: -121.8998 },
  '95126': { zip: '95126', name: 'San Jose (The Alameda / Midtown)', city: 'San Jose', lat: 37.3262, lng: -121.9126 },
  '95128': { zip: '95128', name: 'San Jose (Rose Garden / Valley Fair)', city: 'San Jose', lat: 37.3204, lng: -121.9366 },
  '95026': { zip: '95026', name: 'San Jose (Race St / Mid-town)', city: 'San Jose', lat: 37.3210, lng: -121.9050 },
  '95125': { zip: '95125', name: 'San Jose (Willow Glen / Lincoln Ave)', city: 'San Jose', lat: 37.2965, lng: -121.8950 },
  '95117': { zip: '95117', name: 'San Jose (Westgate / Saratoga Ave)', city: 'San Jose', lat: 37.3010, lng: -121.9780 },
  '95124': { zip: '95124', name: 'San Jose (Cambrian Park / Camden)', city: 'San Jose', lat: 37.2600, lng: -121.9350 },
  '95118': { zip: '95118', name: 'San Jose (South Cambrian / Blossom Hill)', city: 'San Jose', lat: 37.2580, lng: -121.9050 },
  '95120': { zip: '95120', name: 'San Jose (Almaden Valley)', city: 'San Jose', lat: 37.2140, lng: -121.8540 },
  '95123': { zip: '95123', name: 'San Jose (Santa Teresa / Blossom Hill)', city: 'San Jose', lat: 37.2450, lng: -121.8350 },
  '95111': { zip: '95111', name: 'San Jose (Edenvale / Tully)', city: 'San Jose', lat: 37.2798, lng: -121.8360 },
  '95129': { zip: '95129', name: 'San Jose (West / Cupertino Border)', city: 'San Jose', lat: 37.3070, lng: -122.0000 },

  // West Valley (Campbell, Cupertino, Saratoga, Los Gatos)
  '95008': { zip: '95008', name: 'Campbell (Downtown & CC)', city: 'Campbell', lat: 37.2872, lng: -121.9453 },
  '95014': { zip: '95014', name: 'Cupertino (Main St / Apple Park)', city: 'Cupertino', lat: 37.3230, lng: -122.0322 },
  '95070': { zip: '95070', name: 'Saratoga', city: 'Saratoga', lat: 37.2638, lng: -122.0230 },
  '95030': { zip: '95030', name: 'Los Gatos (Downtown)', city: 'Los Gatos', lat: 37.2358, lng: -121.9624 },
  '95032': { zip: '95032', name: 'Los Gatos (East / Highway 85)', city: 'Los Gatos', lat: 37.2400, lng: -121.9400 },

  // Sunnyvale & Mountain View
  '94086': { zip: '94086', name: 'Sunnyvale (Downtown / Murphy Ave)', city: 'Sunnyvale', lat: 37.3718, lng: -122.0298 },
  '94087': { zip: '94087', name: 'Sunnyvale (South / Homestead)', city: 'Sunnyvale', lat: 37.3480, lng: -122.0370 },
  '94089': { zip: '94089', name: 'Sunnyvale (North / Moffett)', city: 'Sunnyvale', lat: 37.4140, lng: -122.0163 },
  '94085': { zip: '94085', name: 'Sunnyvale (East / Central Expwy)', city: 'Sunnyvale', lat: 37.3870, lng: -122.0160 },
  '94041': { zip: '94041', name: 'Mountain View (Downtown / Castro)', city: 'Mountain View', lat: 37.3900, lng: -122.0800 },
  '94040': { zip: '94040', name: 'Mountain View (South / El Camino)', city: 'Mountain View', lat: 37.3800, lng: -122.0950 },
  '94043': { zip: '94043', name: 'Mountain View (Shoreline / Googleplex)', city: 'Mountain View', lat: 37.4100, lng: -122.0700 },

  // Palo Alto & Mid-Peninsula
  '94301': { zip: '94301', name: 'Palo Alto (Downtown / University Ave)', city: 'Palo Alto', lat: 37.4443, lng: -122.1598 },
  '94303': { zip: '94303', name: 'Palo Alto (East / Baylands)', city: 'Palo Alto', lat: 37.4470, lng: -122.1190 },
  '94306': { zip: '94306', name: 'Palo Alto (South / California Ave)', city: 'Palo Alto', lat: 37.4170, lng: -122.1300 },
  '94025': { zip: '94025', name: 'Menlo Park (Downtown / Santa Cruz Ave)', city: 'Menlo Park', lat: 37.4538, lng: -122.1822 },
  '94061': { zip: '94061', name: 'Redwood City (Woodside Rd)', city: 'Redwood City', lat: 37.4640, lng: -122.2410 },
  '94063': { zip: '94063', name: 'Redwood City (Harbor / Bay)', city: 'Redwood City', lat: 37.4852, lng: -122.2364 },
  '94065': { zip: '94065', name: 'Redwood Shores', city: 'Redwood City', lat: 37.5300, lng: -122.2500 },
  '94401': { zip: '94401', name: 'San Mateo (Downtown)', city: 'San Mateo', lat: 37.5750, lng: -122.3250 },
  '94402': { zip: '94402', name: 'San Mateo (Hillsdale)', city: 'San Mateo', lat: 37.5350, lng: -122.3200 },
  '94403': { zip: '94403', name: 'San Mateo (South)', city: 'San Mateo', lat: 37.5270, lng: -122.2980 },
  '94404': { zip: '94404', name: 'Foster City', city: 'Foster City', lat: 37.5580, lng: -122.2700 },
  '94010': { zip: '94010', name: 'Burlingame / Hillsborough', city: 'Burlingame', lat: 37.5779, lng: -122.3639 },

  // East Bay (Fremont, Newark, Union City)
  '94538': { zip: '94538', name: 'Fremont (Central / Auto Mall)', city: 'Fremont', lat: 37.5312, lng: -121.9760 },
  '94539': { zip: '94539', name: 'Fremont (Mission San Jose)', city: 'Fremont', lat: 37.5300, lng: -121.9200 },
  '94536': { zip: '94536', name: 'Fremont (Niles / Centerville)', city: 'Fremont', lat: 37.5700, lng: -121.9900 },
  '94555': { zip: '94555', name: 'Fremont (Ardenwood / North)', city: 'Fremont', lat: 37.5600, lng: -122.0400 },
  '94560': { zip: '94560', name: 'Newark', city: 'Newark', lat: 37.5297, lng: -122.0399 },
  '94587': { zip: '94587', name: 'Union City', city: 'Union City', lat: 37.5934, lng: -122.0438 },
};

/** Quick-switch presets for nearby Bay Area towns */
export const POPULAR_NEARBY_ZIPS = [
  { zip: '95131', label: '95131 (Home Base ★)', city: 'North San Jose' },
  { zip: '95035', label: '95035', city: 'Milpitas' },
  { zip: '95054', label: '95054', city: 'Santa Clara' },
  { zip: '95125', label: '95125', city: 'Willow Glen' },
  { zip: '95008', label: '95008', city: 'Campbell' },
  { zip: '94086', label: '94086', city: 'Sunnyvale' },
  { zip: '94041', label: '94041', city: 'Mountain View' },
  { zip: '94538', label: '94538', city: 'Fremont' },
  { zip: '94063', label: '94063', city: 'Redwood City' },
];

/**
 * Returns human-readable location info for a zip code.
 */
export function getZipLocationInfo(zip: string): {
  zip: string;
  name: string;
  city: string;
  isKnown: boolean;
} {
  const cleanZip = zip.trim().slice(0, 5);
  const found = BAY_AREA_ZIP_DIRECTORY[cleanZip];
  if (found) {
    return {
      zip: found.zip,
      name: found.name,
      city: found.city,
      isKnown: true,
    };
  }

  // Graceful fallback for unknown California/US zip codes
  return {
    zip: cleanZip,
    name: `Custom Zip Code (${cleanZip})`,
    city: 'San Francisco Bay Area',
    isKnown: false,
  };
}

/**
 * Haversine distance in miles between two coordinates.
 */
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Dynamically calculates driving distance in miles from the user's active zip code
 * to an activity facility's zip code, preserving the curated distance when origin is 95131.
 */
export function calculateDynamicDistance(
  userOriginZip: string,
  facilityZip: string,
  facilityCuratedMilesFrom95131: number
): number {
  const cleanOrigin = userOriginZip.trim().slice(0, 5);
  const cleanFacility = facilityZip.trim().slice(0, 5);

  // If user is at default 95131, return exact curated road driving distance
  if (cleanOrigin === DEFAULT_ZIP) {
    return facilityCuratedMilesFrom95131;
  }

  // If both origin and facility zip codes are in our directory
  const originCoord = BAY_AREA_ZIP_DIRECTORY[cleanOrigin];
  const facilityCoord = BAY_AREA_ZIP_DIRECTORY[cleanFacility];

  if (originCoord && facilityCoord) {
    // If same zip code, standard intra-zip driving distance is ~0.8 to 1.5 miles
    if (cleanOrigin === cleanFacility) {
      return 1.2;
    }

    const greatCircle = haversineMiles(
      originCoord.lat,
      originCoord.lng,
      facilityCoord.lat,
      facilityCoord.lng
    );

    // Apply standard urban road detour factor (~1.22x)
    const drivingEst = greatCircle * 1.22;
    return Math.max(0.5, Math.round(drivingEst * 10) / 10);
  }

  // Fallback: estimate difference relative to 95131 center
  if (originCoord) {
    const centerDist = haversineMiles(
      originCoord.lat,
      originCoord.lng,
      BAY_AREA_ZIP_DIRECTORY[DEFAULT_ZIP].lat,
      BAY_AREA_ZIP_DIRECTORY[DEFAULT_ZIP].lng
    );
    const est = Math.abs(facilityCuratedMilesFrom95131 + (centerDist > 0 ? (centerDist * 0.7) : 0));
    return Math.max(0.8, Math.round(est * 10) / 10);
  }

  return facilityCuratedMilesFrom95131;
}
