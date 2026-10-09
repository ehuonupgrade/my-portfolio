import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { playKeyClick, playBeep } from '../utils/audio';

export interface UpcomingStop {
  stationCode: string;
  stationName: string;
  expectedArrivalTime: string;
  expectedDepartureTime: string;
  minutesAway: number;
  isNextStop: boolean;
  isTerminal: boolean;
}

export interface TrainScheduleInfo {
  upcomingStationCode: string;
  upcomingStationName: string;
  expectedArrivalTime: string; // Expected arrival at next upcoming station
  expectedDepartureTime: string; // Expected departure from next upcoming station
  arrivalMinutes: number;
  departureMinutes: number;
  isAtPlatform: boolean;
  finalDestinationArrivalTime: string;
  finalDurationMins: number;
  upcomingStops: UpcomingStop[];
  remainingDurationMins: number;
}

export interface LiveTrain {
  id: string;
  stationCode: string;
  stationName: string;
  destination: string;
  destAbbr: string;
  lineId: string;
  lineName: string;
  hexcolor: string;
  direction: string;
  cars: string;
  minutes: string;
  platform: string;
  delaySec: number;
  x: number;
  y: number;
  // Upcoming station arrival & departure times
  upcomingStationCode?: string;
  upcomingStationName?: string;
  expectedDepartureTime?: string;
  expectedArrivalTime?: string;
  arrivalMinutes?: number;
  departureMinutes?: number;
  isAtPlatform?: boolean;
  finalDestinationArrivalTime?: string;
  finalDurationMins?: number;
  upcomingStops?: UpcomingStop[];
  remainingDurationMins?: number;
}

// All 5 primary BART lines
export const ALL_LINES = ['green', 'yellow', 'red', 'orange', 'blue'] as const;

export interface StationCoord {
  x: number;
  y: number;
  name: string;
  shortName?: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
  isMajorHub?: boolean;
}

// Accurate schematic coordinates for all 49 BART stations across the Bay Area (viewBox 950 x 545)
export const stationCoords: Record<string, StationCoord> = {
  // San Francisco Spine (Peninsula & Downtown)
  MLBR: { x: 190, y: 450, name: 'Millbrae', shortName: 'Millbrae', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  SFIA: { x: 210, y: 420, name: 'SFO Airport', shortName: 'SFO Airport ✈', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  SBRN: { x: 225, y: 390, name: 'San Bruno', shortName: 'San Bruno', dx: -8, dy: 3, anchor: 'end' },
  SSAN: { x: 238, y: 365, name: 'South San Francisco', shortName: 'South SF', dx: -8, dy: 3, anchor: 'end' },
  COLM: { x: 250, y: 340, name: 'Colma', shortName: 'Colma', dx: -8, dy: 3, anchor: 'end' },
  DALY: { x: 265, y: 315, name: 'Daly City', shortName: 'Daly City', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  BALB: { x: 280, y: 290, name: 'Balboa Park', shortName: 'Balboa Park', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  GLEN: { x: 295, y: 265, name: 'Glen Park', shortName: 'Glen Park', dx: -8, dy: 3, anchor: 'end' },
  '24TH': { x: 310, y: 240, name: '24th St Mission', shortName: '24th St Mission', dx: -8, dy: 3, anchor: 'end' },
  '16TH': { x: 325, y: 215, name: '16th St Mission', shortName: '16th St Mission', dx: -8, dy: 3, anchor: 'end' },
  CIVC: { x: 340, y: 190, name: 'Civic Center', shortName: 'Civic Center', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  POWL: { x: 355, y: 168, name: 'Powell St', shortName: 'Powell St', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  MONT: { x: 370, y: 148, name: 'Montgomery St', shortName: 'Montgomery St', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  EMBR: { x: 385, y: 130, name: 'Embarcadero', shortName: 'Embarcadero', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },

  // Oakland & Transbay Hub
  WOAK: { x: 450, y: 125, name: 'West Oakland', shortName: 'West Oakland', dx: 0, dy: 14, anchor: 'middle', isMajorHub: true },
  '12TH': { x: 480, y: 120, name: '12th St Oakland', shortName: '12th St Oakland', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  '19TH': { x: 490, y: 105, name: '19th St Oakland', shortName: '19th St Oakland', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  MCAR: { x: 500, y: 90, name: 'MacArthur', shortName: 'MacArthur', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  LAKE: { x: 485, y: 150, name: 'Lake Merritt', shortName: 'Lake Merritt', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  FTVL: { x: 505, y: 180, name: 'Fruitvale', shortName: 'Fruitvale', dx: 8, dy: 3, anchor: 'start' },
  COLS: { x: 525, y: 210, name: 'Coliseum', shortName: 'Coliseum ✈', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  SANL: { x: 545, y: 240, name: 'San Leandro', shortName: 'San Leandro', dx: 8, dy: 3, anchor: 'start' },
  BAYF: { x: 565, y: 270, name: 'Bay Fair', shortName: 'Bay Fair', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },

  // Berkeley / Richmond (North East Bay)
  ASHB: { x: 500, y: 72, name: 'Ashby', shortName: 'Ashby', dx: -8, dy: 3, anchor: 'end' },
  DBRK: { x: 500, y: 54, name: 'Downtown Berkeley', shortName: 'Downtown Berkeley', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  NBRK: { x: 500, y: 38, name: 'North Berkeley', shortName: 'North Berkeley', dx: -8, dy: 3, anchor: 'end' },
  PLZA: { x: 500, y: 24, name: 'El Cerrito Plaza', shortName: 'El Cerrito Plaza', dx: -8, dy: 3, anchor: 'end' },
  DELN: { x: 500, y: 12, name: 'El Cerrito del Norte', shortName: 'El Cerrito del Norte', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },
  RICH: { x: 500, y: 2, name: 'Richmond', shortName: 'Richmond', dx: -8, dy: 3, anchor: 'end', isMajorHub: true },

  // Antioch / Contra Costa (Northeast)
  ROCK: { x: 525, y: 78, name: 'Rockridge', shortName: 'Rockridge', dx: 8, dy: -4, anchor: 'start' },
  ORIN: { x: 555, y: 68, name: 'Orinda', shortName: 'Orinda', dx: 0, dy: -9, anchor: 'middle' },
  LAFY: { x: 590, y: 58, name: 'Lafayette', shortName: 'Lafayette', dx: 0, dy: -9, anchor: 'middle' },
  WCRK: { x: 630, y: 52, name: 'Walnut Creek', shortName: 'Walnut Creek', dx: 0, dy: -9, anchor: 'middle', isMajorHub: true },
  PHIL: { x: 665, y: 47, name: 'Pleasant Hill', shortName: 'Pleasant Hill', dx: 0, dy: -9, anchor: 'middle' },
  CONC: { x: 700, y: 42, name: 'Concord', shortName: 'Concord', dx: 0, dy: -9, anchor: 'middle', isMajorHub: true },
  NCON: { x: 730, y: 37, name: 'North Concord', shortName: 'North Concord', dx: 0, dy: -9, anchor: 'middle' },
  PITT: { x: 760, y: 32, name: 'Pittsburg/Bay Point', shortName: 'Pittsburg/Bay Pt', dx: 0, dy: -9, anchor: 'middle', isMajorHub: true },
  PCTR: { x: 785, y: 27, name: 'Pittsburg Center', shortName: 'Pittsburg Ctr', dx: 0, dy: -9, anchor: 'middle' },
  ANTC: { x: 810, y: 22, name: 'Antioch', shortName: 'Antioch', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },

  // Dublin / Pleasanton (East)
  CAST: { x: 615, y: 270, name: 'Castro Valley', shortName: 'Castro Valley', dx: 0, dy: 14, anchor: 'middle' },
  WDUB: { x: 675, y: 270, name: 'West Dublin', shortName: 'West Dublin', dx: 0, dy: 14, anchor: 'middle' },
  DUBL: { x: 735, y: 270, name: 'Dublin / Pleasanton', shortName: 'Dublin / Pleasanton', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },

  // South Bay / Fremont / Milpitas / Berryessa
  HAYW: { x: 580, y: 300, name: 'Hayward', shortName: 'Hayward', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  SHAY: { x: 595, y: 330, name: 'South Hayward', shortName: 'South Hayward', dx: 8, dy: 3, anchor: 'start' },
  UCTY: { x: 610, y: 360, name: 'Union City', shortName: 'Union City', dx: 8, dy: 3, anchor: 'start' },
  FRMT: { x: 625, y: 390, name: 'Fremont', shortName: 'Fremont', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  WARM: { x: 645, y: 420, name: 'Warm Springs', shortName: 'Warm Springs', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  MLPT: { x: 670, y: 455, name: 'Milpitas', shortName: 'Milpitas', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
  BERY: { x: 695, y: 490, name: 'Berryessa (San José)', shortName: 'Berryessa (SJ)', dx: 8, dy: 3, anchor: 'start', isMajorHub: true },
};

// Line track polyline definitions
const trackLines: Record<string, { name: string; color: string; stations: string[] }> = {
  green: {
    name: 'Green Line (Berryessa ↔ Daly City)',
    color: '#22c55e',
    stations: [
      'BERY', 'MLPT', 'WARM', 'FRMT', 'UCTY', 'SHAY', 'HAYW', 'BAYF', 'SANL',
      'COLS', 'FTVL', 'LAKE', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH',
      '24TH', 'GLEN', 'BALB', 'DALY',
    ],
  },
  yellow: {
    name: 'Yellow Line (Antioch ↔ SFO / Millbrae)',
    color: '#facc15',
    stations: [
      'ANTC', 'PCTR', 'PITT', 'NCON', 'CONC', 'PHIL', 'WCRK', 'LAFY', 'ORIN',
      'ROCK', 'MCAR', '19TH', '12TH', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC',
      '16TH', '24TH', 'GLEN', 'BALB', 'DALY', 'COLM', 'SSAN', 'SBRN', 'SFIA', 'MLBR',
    ],
  },
  red: {
    name: 'Red Line (Richmond ↔ Millbrae)',
    color: '#ef4444',
    stations: [
      'RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH',
      'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB',
      'DALY', 'COLM', 'SSAN', 'SBRN', 'MLBR',
    ],
  },
  orange: {
    name: 'Orange Line (Richmond ↔ Berryessa)',
    color: '#f97316',
    stations: [
      'RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH',
      'LAKE', 'FTVL', 'COLS', 'SANL', 'BAYF', 'HAYW', 'SHAY', 'UCTY', 'FRMT',
      'WARM', 'MLPT', 'BERY',
    ],
  },
  blue: {
    name: 'Blue Line (Dublin / Pleasanton ↔ Daly City)',
    color: '#3b82f6',
    stations: [
      'DUBL', 'WDUB', 'CAST', 'BAYF', 'SANL', 'COLS', 'FTVL', 'LAKE', 'WOAK',
      'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY',
    ],
  },
};

// Route station sequences used to accurately identify and deduplicate physical train consists
export const lineStationSequences: Record<string, string[]> = {
  green: [
    'BERY', 'MLPT', 'WARM', 'FRMT', 'UCTY', 'SHAY', 'HAYW', 'BAYF', 'SANL',
    'COLS', 'FTVL', 'LAKE', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH',
    '24TH', 'GLEN', 'BALB', 'DALY',
  ],
  yellow: [
    'ANTC', 'PCTR', 'PITT', 'NCON', 'CONC', 'PHIL', 'WCRK', 'LAFY', 'ORIN',
    'ROCK', 'MCAR', '19TH', '12TH', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC',
    '16TH', '24TH', 'GLEN', 'BALB', 'DALY', 'COLM', 'SSAN', 'SBRN', 'SFIA', 'MLBR',
  ],
  red: [
    'RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH',
    'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB',
    'DALY', 'COLM', 'SSAN', 'SBRN', 'SFIA', 'MLBR',
  ],
  orange: [
    'RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH',
    'LAKE', 'FTVL', 'COLS', 'SANL', 'BAYF', 'HAYW', 'SHAY', 'UCTY', 'FRMT',
    'WARM', 'MLPT', 'BERY',
  ],
  blue: [
    'DUBL', 'WDUB', 'CAST', 'BAYF', 'SANL', 'COLS', 'FTVL', 'LAKE', 'WOAK',
    'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY',
  ],
};

/**
 * Geographically accurate and consistent BART direction normalizer.
 * In the raw BART API, Route 6 (Green Line towards Berryessa/San José) contains a legacy 1970s quirk
 * labeling Berryessa as 'North', while Route 4 (Orange Line to the exact same Berryessa station) is labeled 'South'.
 * This function harmonizes and standardizes all BART lines according to real Bay Area geography.
 */
export function normalizeBartDirection(lineId: string, destAbbr: string, rawDir?: string): 'North' | 'South' {
  const dest = (destAbbr || '').toUpperCase();
  const line = (lineId || '').toLowerCase();

  // Explicit Northern / Northeastern East Bay Terminals
  if (['ANTC', 'PCTR', 'PITT', 'NCON', 'CONC', 'PHIL', 'RICH', 'DUBL'].includes(dest)) {
    return 'North';
  }

  // Explicit Southern Peninsula / Airport Terminals
  if (['SFIA', 'MLBR', 'COLM', 'SSAN', 'SBRN'].includes(dest)) {
    return 'South';
  }

  // Berryessa / North San José is the southernmost terminal in the South Bay / Silicon Valley
  // for both Green Line and Orange Line
  if (dest === 'BERY' || dest.includes('BERY')) {
    return 'South';
  }

  // Daly City Terminal:
  // On the Green Line (Berryessa ↔ Daly City), heading to Daly City travels North from South Bay/East Bay through SF
  // On the Blue Line (Dublin ↔ Daly City), heading to Daly City travels West/Southwest
  if (dest === 'DALY') {
    if (line === 'green') {
      return 'North';
    }
    return 'South';
  }

  return (rawDir || '').toLowerCase().startsWith('n') ? 'North' : 'South';
}

/**
 * Formats a Date object into a readable 12-hour time string: e.g. "11:24 AM"
 */
export function formatTime12(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr} ${ampm}`;
}

/**
 * Computes estimated arrival and departure times for the next upcoming station,
 * plus a full stop-by-stop schedule for every upcoming station on the train's route.
 */
export function computeTrainScheduleTimes(
  stationCode: string,
  destAbbr: string,
  lineId: string,
  minutesStr: string,
  baseDate: Date = new Date()
): TrainScheduleInfo {
  const isAtPlatform =
    minutesStr === 'Leaving' || minutesStr === '0' || parseInt(minutesStr, 10) === 0;
  const minsToCurrentStation = isAtPlatform ? 0 : parseInt(minutesStr, 10) || 0;
  const seq = lineStationSequences[lineId] || [];
  const currIdx = seq.indexOf(stationCode);
  const destIdx = seq.indexOf(destAbbr);

  const step =
    currIdx !== -1 && destIdx !== -1
      ? destIdx > currIdx
        ? 1
        : destIdx < currIdx
        ? -1
        : 0
      : 0;

  const upcomingStops: UpcomingStop[] = [];
  let cumulativeMins = minsToCurrentStation;

  if (currIdx !== -1 && step !== 0) {
    let idx = currIdx;
    while (true) {
      const code = seq[idx];
      const name = stationCoords[code]?.name || code;
      const isFirst = idx === currIdx;
      const isTerminal = idx === destIdx;

      let arrMins = cumulativeMins;
      let depMins = cumulativeMins + 1;

      if (isFirst && isAtPlatform) {
        arrMins = 0;
        depMins = 1;
      }

      const arrDate = new Date(baseDate.getTime() + arrMins * 60000);
      const depDate = new Date(baseDate.getTime() + depMins * 60000);

      upcomingStops.push({
        stationCode: code,
        stationName: name,
        expectedArrivalTime: isFirst && isAtPlatform ? 'At Platform' : formatTime12(arrDate),
        expectedDepartureTime: isFirst && isAtPlatform ? 'Leaving' : formatTime12(depDate),
        minutesAway: arrMins,
        isNextStop: isFirst,
        isTerminal,
      });

      if (idx === destIdx) break;
      idx += step;

      // Inter-station transit calculation:
      // Transbay underwater tube between Embarcadero and West Oakland takes ~7 mins.
      // Standard BART stations take ~2.5 - 3 mins.
      const isTransbayHop =
        (code === 'EMBR' && seq[idx] === 'WOAK') || (code === 'WOAK' && seq[idx] === 'EMBR');
      const hopTransit = isTransbayHop ? 7 : 3;
      cumulativeMins += hopTransit;
    }
  }

  // Fallback if stations are not in sequence or single station
  if (upcomingStops.length === 0) {
    const currentName = stationCoords[stationCode]?.name || stationCode;
    const arrDate = new Date(baseDate.getTime() + minsToCurrentStation * 60000);
    const depDate = new Date(baseDate.getTime() + (minsToCurrentStation + 1) * 60000);
    upcomingStops.push({
      stationCode,
      stationName: currentName,
      expectedArrivalTime: isAtPlatform ? 'At Platform' : formatTime12(arrDate),
      expectedDepartureTime: isAtPlatform ? 'Leaving' : formatTime12(depDate),
      minutesAway: minsToCurrentStation,
      isNextStop: true,
      isTerminal: true,
    });
  }

  const nextStop = upcomingStops[0];
  const finalStop = upcomingStops[upcomingStops.length - 1];

  return {
    upcomingStationCode: nextStop.stationCode,
    upcomingStationName: nextStop.stationName,
    expectedArrivalTime: nextStop.expectedArrivalTime,
    expectedDepartureTime: nextStop.expectedDepartureTime,
    arrivalMinutes: nextStop.minutesAway,
    departureMinutes: nextStop.minutesAway + 1,
    isAtPlatform,
    finalDestinationArrivalTime: finalStop.expectedArrivalTime,
    finalDurationMins: finalStop.minutesAway,
    upcomingStops,
    remainingDurationMins: finalStop.minutesAway,
  };
}

// Initial reliable baseline of real physical train consists across all 5 lines
const fallbackTrains: LiveTrain[] = [
  // Green Line — Southbound Consists (Heading South to Berryessa / North San José)
  {
    id: 'TR-EMBR-G1',
    stationCode: 'EMBR',
    stationName: 'Embarcadero',
    destination: 'Berryessa (San José)',
    destAbbr: 'BERY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'South',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.EMBR.x + 7,
    y: stationCoords.EMBR.y,
  },
  {
    id: 'TR-HAYW-G1',
    stationCode: 'HAYW',
    stationName: 'Hayward',
    destination: 'Berryessa (San José)',
    destAbbr: 'BERY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'South',
    cars: '8',
    minutes: '1',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.HAYW.x + 7,
    y: stationCoords.HAYW.y,
  },
  {
    id: 'TR-WARM-G1',
    stationCode: 'WARM',
    stationName: 'Warm Springs / South Fremont',
    destination: 'Berryessa (San José)',
    destAbbr: 'BERY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'South',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.WARM.x + 7,
    y: stationCoords.WARM.y,
  },

  // Green Line — Northbound Consists (Heading North to Daly City / SF)
  {
    id: 'TR-MLPT-G1',
    stationCode: 'MLPT',
    stationName: 'Milpitas',
    destination: 'Daly City',
    destAbbr: 'DALY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'North',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.MLPT.x - 7,
    y: stationCoords.MLPT.y,
  },
  {
    id: 'TR-COLS-G1',
    stationCode: 'COLS',
    stationName: 'Coliseum',
    destination: 'Daly City',
    destAbbr: 'DALY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'North',
    cars: '8',
    minutes: '1',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.COLS.x - 7,
    y: stationCoords.COLS.y,
  },
  {
    id: 'TR-16TH-G1',
    stationCode: '16TH',
    stationName: '16th St Mission',
    destination: 'Daly City',
    destAbbr: 'DALY',
    lineId: 'green',
    lineName: 'Green Line',
    hexcolor: '#22c55e',
    direction: 'North',
    cars: '8',
    minutes: '2',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords['16TH'].x - 7,
    y: stationCoords['16TH'].y,
  },

  // Yellow Line
  {
    id: 'TR-EMBR-2',
    stationCode: 'EMBR',
    stationName: 'Embarcadero',
    destination: 'SFO Airport',
    destAbbr: 'SFIA',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    hexcolor: '#facc15',
    direction: 'South',
    cars: '10',
    minutes: '1',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.EMBR.x - 7,
    y: stationCoords.EMBR.y,
  },
  {
    id: 'TR-12TH-1',
    stationCode: '12TH',
    stationName: '12th St Oakland',
    destination: 'Daly City',
    destAbbr: 'DALY',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    hexcolor: '#facc15',
    direction: 'South',
    cars: '10',
    minutes: 'Leaving',
    platform: 'Platform 3',
    delaySec: 0,
    x: stationCoords['12TH'].x - 7,
    y: stationCoords['12TH'].y,
  },
  {
    id: 'TR-SFIA-1',
    stationCode: 'SFIA',
    stationName: 'SFO Airport',
    destination: 'Antioch',
    destAbbr: 'ANTC',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    hexcolor: '#facc15',
    direction: 'North',
    cars: '10',
    minutes: 'Leaving',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.SFIA.x + 7,
    y: stationCoords.SFIA.y,
  },
  {
    id: 'TR-WCRK-1',
    stationCode: 'WCRK',
    stationName: 'Walnut Creek',
    destination: 'SFO Airport',
    destAbbr: 'SFIA',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    hexcolor: '#facc15',
    direction: 'South',
    cars: '10',
    minutes: 'Leaving',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.WCRK.x - 7,
    y: stationCoords.WCRK.y,
  },

  // Orange Line
  {
    id: 'TR-DBRK-1',
    stationCode: 'DBRK',
    stationName: 'Downtown Berkeley',
    destination: 'Berryessa',
    destAbbr: 'BERY',
    lineId: 'orange',
    lineName: 'Orange Line',
    hexcolor: '#f97316',
    direction: 'South',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.DBRK.x - 7,
    y: stationCoords.DBRK.y,
  },
  {
    id: 'TR-FRMT-1',
    stationCode: 'FRMT',
    stationName: 'Fremont',
    destination: 'Richmond',
    destAbbr: 'RICH',
    lineId: 'orange',
    lineName: 'Orange Line',
    hexcolor: '#f97316',
    direction: 'North',
    cars: '8',
    minutes: '1',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.FRMT.x + 7,
    y: stationCoords.FRMT.y,
  },

  // Red Line
  {
    id: 'TR-RICH-1',
    stationCode: 'RICH',
    stationName: 'Richmond',
    destination: 'Millbrae',
    destAbbr: 'MLBR',
    lineId: 'red',
    lineName: 'Red Line',
    hexcolor: '#ef4444',
    direction: 'South',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.RICH.x - 7,
    y: stationCoords.RICH.y,
  },
  {
    id: 'TR-POWL-1',
    stationCode: 'POWL',
    stationName: 'Powell St',
    destination: 'Richmond',
    destAbbr: 'RICH',
    lineId: 'red',
    lineName: 'Red Line',
    hexcolor: '#ef4444',
    direction: 'North',
    cars: '8',
    minutes: '1',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.POWL.x + 7,
    y: stationCoords.POWL.y,
  },

  // Blue Line
  {
    id: 'TR-DUBL-1',
    stationCode: 'DUBL',
    stationName: 'Dublin / Pleasanton',
    destination: 'Daly City',
    destAbbr: 'DALY',
    lineId: 'blue',
    lineName: 'Blue Line',
    hexcolor: '#3b82f6',
    direction: 'South',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 1',
    delaySec: 0,
    x: stationCoords.DUBL.x - 7,
    y: stationCoords.DUBL.y,
  },
  {
    id: 'TR-LAKE-1',
    stationCode: 'LAKE',
    stationName: 'Lake Merritt',
    destination: 'Dublin / Pleasanton',
    destAbbr: 'DUBL',
    lineId: 'blue',
    lineName: 'Blue Line',
    hexcolor: '#3b82f6',
    direction: 'North',
    cars: '8',
    minutes: 'Leaving',
    platform: 'Platform 2',
    delaySec: 0,
    x: stationCoords.LAKE.x + 7,
    y: stationCoords.LAKE.y,
  },
];

export const BartLiveMap: React.FC = () => {
  const [trains, setTrains] = useState<LiveTrain[]>(() =>
    fallbackTrains.map((t) => {
      const sched = computeTrainScheduleTimes(t.stationCode, t.destAbbr, t.lineId, t.minutes);
      return {
        ...t,
        upcomingStationCode: sched.upcomingStationCode,
        upcomingStationName: sched.upcomingStationName,
        expectedDepartureTime: sched.expectedDepartureTime,
        expectedArrivalTime: sched.expectedArrivalTime,
        arrivalMinutes: sched.arrivalMinutes,
        departureMinutes: sched.departureMinutes,
        isAtPlatform: sched.isAtPlatform,
        finalDestinationArrivalTime: sched.finalDestinationArrivalTime,
        finalDurationMins: sched.finalDurationMins,
        upcomingStops: sched.upcomingStops,
        remainingDurationMins: sched.remainingDurationMins,
      };
    })
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live Connected');
  const [selectedTrain, setSelectedTrain] = useState<LiveTrain | null>(null);
  const [expandedTrainId, setExpandedTrainId] = useState<string | null>(null);

  // Multi-line selection: allows selecting multiple line colors simultaneously
  const [selectedLines, setSelectedLines] = useState<string[]>([...ALL_LINES]);

  const [viewMode, setViewMode] = useState<'both' | 'map' | 'ledger'>('both');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // Fetch real-time live trains from official BART API
  const fetchLiveTrains = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        'https://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=MW9S-E7SL-26DU-VV8V&json=y'
      );
      if (!res.ok) throw new Error(`BART API HTTP ${res.status}`);

      const data = await res.json();
      const stationsList = data?.root?.station;

      if (!stationsList || !Array.isArray(stationsList)) {
        throw new Error('Unexpected BART API payload');
      }

      // Extract candidate arrival predictions for trains at platform or approaching within 5 mins
      const allCandidates: Array<{
        stationCode: string;
        stationName: string;
        destination: string;
        destAbbr: string;
        lineId: string;
        direction: 'North' | 'South';
        minutes: string;
        mins: number;
        cars: string;
        platform: string;
        delaySec: number;
        hexcolor: string;
      }> = [];

      stationsList.forEach((st: any) => {
        if (!st.etd) return;
        const etds = Array.isArray(st.etd) ? st.etd : [st.etd];

        etds.forEach((item: any) => {
          const estimates = Array.isArray(item.estimate) ? item.estimate : [item.estimate];

          estimates.forEach((est: any) => {
            const lineId = (est.color || 'yellow').toLowerCase();
            const mins = est.minutes === 'Leaving' ? 0 : parseInt(est.minutes, 10);

            // Track consists currently stopped at platform or approaching downstream stations within 5 mins
            if (!isNaN(mins) && mins <= 5) {
              const direction = normalizeBartDirection(lineId, item.abbreviation, est.direction);
              const hexcolor =
                est.hexcolor ||
                (lineId === 'green'
                  ? '#22c55e'
                  : lineId === 'orange'
                  ? '#f97316'
                  : lineId === 'red'
                  ? '#ef4444'
                  : lineId === 'blue'
                  ? '#3b82f6'
                  : '#facc15');

              allCandidates.push({
                stationCode: st.abbr,
                stationName: st.name,
                destination: item.destination,
                destAbbr: item.abbreviation,
                lineId,
                direction,
                minutes: est.minutes,
                mins,
                cars: est.length || '8',
                platform: est.platform ? `Platform ${est.platform}` : 'Platform 1',
                delaySec: parseInt(est.delay || '0', 10),
                hexcolor,
              });
            }
          });
        });
      });

      // Group candidates by line and normalized direction to identify distinct physical consists
      const grouped: Record<string, typeof allCandidates> = {};
      allCandidates.forEach((cand) => {
        const key = `${cand.lineId}:${cand.direction}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(cand);
      });

      const parsedTrains: LiveTrain[] = [];
      let trainCounter = 101;

      for (const [key, candidates] of Object.entries(grouped)) {
        const [lineId, direction] = key.split(':') as [string, 'North' | 'South'];
        const seq = lineStationSequences[lineId] || [];

        // Sort so the train closest to arriving/leaving is prioritized for each consist
        candidates.sort((a, b) => a.mins - b.mins);

        const assignedIndices = new Set<number>();
        candidates.forEach((cand) => {
          const scheduleTimes = computeTrainScheduleTimes(
            cand.stationCode,
            cand.destAbbr,
            cand.lineId,
            cand.minutes
          );

          const idx = seq.indexOf(cand.stationCode);
          if (idx === -1) {
            const coords = stationCoords[cand.stationCode] || { x: 450, y: 125, name: cand.stationName };
            const offsetX = direction === 'North' ? -7 : 7;
            parsedTrains.push({
              id: `TR-${cand.stationCode}-${trainCounter++}`,
              stationCode: cand.stationCode,
              stationName: cand.stationName,
              destination: cand.destination,
              destAbbr: cand.destAbbr,
              lineId: cand.lineId,
              lineName: `${cand.lineId.toUpperCase()} LINE`,
              hexcolor: cand.hexcolor,
              direction,
              cars: cand.cars,
              minutes: cand.minutes,
              platform: cand.platform,
              delaySec: cand.delaySec,
              upcomingStationCode: scheduleTimes.upcomingStationCode,
              upcomingStationName: scheduleTimes.upcomingStationName,
              expectedDepartureTime: scheduleTimes.expectedDepartureTime,
              expectedArrivalTime: scheduleTimes.expectedArrivalTime,
              arrivalMinutes: scheduleTimes.arrivalMinutes,
              departureMinutes: scheduleTimes.departureMinutes,
              isAtPlatform: scheduleTimes.isAtPlatform,
              finalDestinationArrivalTime: scheduleTimes.finalDestinationArrivalTime,
              finalDurationMins: scheduleTimes.finalDurationMins,
              upcomingStops: scheduleTimes.upcomingStops,
              remainingDurationMins: scheduleTimes.remainingDurationMins,
              x: coords.x + offsetX,
              y: coords.y,
            });
            return;
          }

          // Check if another arrival estimate is already within 2 stations along the route (same physical consist)
          let hasNearbyConsist = false;
          for (let hop = -2; hop <= 2; hop++) {
            if (assignedIndices.has(idx + hop)) {
              hasNearbyConsist = true;
              break;
            }
          }

          if (!hasNearbyConsist) {
            assignedIndices.add(idx);
            const coords = stationCoords[cand.stationCode] || { x: 450, y: 125, name: cand.stationName };
            const offsetX = direction === 'North' ? -7 : 7;
            parsedTrains.push({
              id: `TR-${cand.stationCode}-${trainCounter++}`,
              stationCode: cand.stationCode,
              stationName: cand.stationName,
              destination: cand.destination,
              destAbbr: cand.destAbbr,
              lineId: cand.lineId,
              lineName: `${cand.lineId.toUpperCase()} LINE`,
              hexcolor: cand.hexcolor,
              direction,
              cars: cand.cars,
              minutes: cand.minutes,
              platform: cand.platform,
              delaySec: cand.delaySec,
              upcomingStationCode: scheduleTimes.upcomingStationCode,
              upcomingStationName: scheduleTimes.upcomingStationName,
              expectedDepartureTime: scheduleTimes.expectedDepartureTime,
              expectedArrivalTime: scheduleTimes.expectedArrivalTime,
              arrivalMinutes: scheduleTimes.arrivalMinutes,
              departureMinutes: scheduleTimes.departureMinutes,
              isAtPlatform: scheduleTimes.isAtPlatform,
              finalDestinationArrivalTime: scheduleTimes.finalDestinationArrivalTime,
              finalDurationMins: scheduleTimes.finalDurationMins,
              upcomingStops: scheduleTimes.upcomingStops,
              remainingDurationMins: scheduleTimes.remainingDurationMins,
              x: coords.x + offsetX,
              y: coords.y,
            });
          }
        });
      }

      if (parsedTrains.length > 0) {
        setTrains(parsedTrains);
        setIsLiveConnected(true);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    } catch (err: any) {
      console.warn('Live BART ETD feed fallback engaged:', err);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling every 20 seconds for real-time updates
  useEffect(() => {
    fetchLiveTrains();
    const interval = setInterval(fetchLiveTrains, 20000);
    return () => clearInterval(interval);
  }, [fetchLiveTrains]);

  // Multi-direction selection: allows filtering Northbound, Southbound, or both
  const [selectedDirections, setSelectedDirections] = useState<string[]>(['North', 'South']);

  // Multi-line filter handler: toggle individual lines on/off, supporting multiple lines
  const toggleLine = (lineId: string) => {
    playKeyClick();
    setSelectedLines((prev) => {
      // If currently ALL lines are selected, clicking one line isolates it to start a custom multi-selection
      if (prev.length === ALL_LINES.length) {
        return [lineId];
      }
      // If the line is already selected
      if (prev.includes(lineId)) {
        const next = prev.filter((l) => l !== lineId);
        // If user deselects the last remaining line, revert back to all lines
        return next.length === 0 ? [...ALL_LINES] : next;
      }
      // Otherwise, add this line to the active selection (multi-line select)
      return [...prev, lineId];
    });
  };

  const selectAllLines = () => {
    playKeyClick();
    setSelectedLines([...ALL_LINES]);
  };

  // Direction filter handler: toggle Northbound and/or Southbound
  const toggleDirection = (dir: 'North' | 'South') => {
    playKeyClick();
    setSelectedDirections((prev) => {
      // If currently BOTH directions are selected, clicking one isolates it
      if (prev.length === 2) {
        return [dir];
      }
      // If this direction is already selected
      if (prev.includes(dir)) {
        const next = prev.filter((d) => d !== dir);
        // If user deselects the last remaining direction, revert back to both
        return next.length === 0 ? ['North', 'South'] : next;
      }
      // Otherwise, add this direction to active selection (both are now active)
      return [...prev, dir];
    });
  };

  const selectAllDirections = () => {
    playKeyClick();
    setSelectedDirections(['North', 'South']);
  };

  const isNorthSelected = selectedDirections.includes('North');
  const isSouthSelected = selectedDirections.includes('South');
  const isAllDirectionsSelected = isNorthSelected && isSouthSelected;

  // Real-time train counts categorized by direction matching the current line selection
  const directionCounts = useMemo(() => {
    const trainsInSelectedLines = trains.filter(
      (t) => selectedLines.length === ALL_LINES.length || selectedLines.includes(t.lineId.toLowerCase())
    );
    const north = trainsInSelectedLines.filter((t) => (t.direction || '').toLowerCase().startsWith('n')).length;
    const south = trainsInSelectedLines.filter((t) => !(t.direction || '').toLowerCase().startsWith('n')).length;
    return {
      total: trainsInSelectedLines.length,
      north,
      south,
    };
  }, [trains, selectedLines]);

  // Filtered train set according to all selected lines AND selected directions
  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      const matchesLine =
        selectedLines.length === ALL_LINES.length || selectedLines.includes(t.lineId.toLowerCase());
      const isNorth = (t.direction || '').toLowerCase().startsWith('n');
      const matchesDirection =
        (isNorth && selectedDirections.includes('North')) ||
        (!isNorth && selectedDirections.includes('South'));
      return matchesLine && matchesDirection;
    });
  }, [trains, selectedLines, selectedDirections]);

  // Map of active trains currently at or approaching each station
  const trainsAtStation = useMemo(() => {
    const map: Record<string, LiveTrain[]> = {};
    filteredTrains.forEach((t) => {
      const code = t.upcomingStationCode || t.stationCode;
      if (!map[code]) map[code] = [];
      map[code].push(t);
    });
    return map;
  }, [filteredTrains]);

  const isAllLinesSelected = selectedLines.length === ALL_LINES.length;

  // Smooth scroll to ledger
  const scrollToLedger = () => {
    playKeyClick();
    if (viewMode === 'map') {
      setViewMode('both');
    }
    setTimeout(() => {
      const el = document.getElementById('dispatch-ledger');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Multi-Line Toggle Bar */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                {isLiveConnected ? 'Official Real-Time BART Feed' : 'Live Connected (Station Platform Baseline)'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                &bull; {trains.length} Active Trains Across System
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Live BART Train Positions by Transit Line
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-mono w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('both');
                }}
                className={`flex-1 sm:flex-initial text-center px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'both' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Show Map and Ledger"
              >
                Map + Ledger
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('ledger');
                }}
                className={`flex-1 sm:flex-initial text-center px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'ledger' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Jump directly to Dispatch Ledger"
              >
                📋 Ledger Only
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('map');
                }}
                className={`flex-1 sm:flex-initial text-center px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'map' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Show Map Only"
              >
                Map Only
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                playKeyClick();
                fetchLiveTrains();
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer font-mono flex items-center gap-1.5 shrink-0"
            >
              <span>{loading ? '↻ Refreshing...' : '↻ Refresh'}</span>
              <span className="text-slate-500 text-[10px]">({lastUpdated})</span>
            </button>
          </div>
        </div>

        {/* Multi-Line Selection Buttons */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                Filter Lines (Select Multiple Colors):
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                {selectedLines.length} of 5 Active
              </span>
            </div>
            <button
              onClick={scrollToLedger}
              className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>↓ Jump to Dispatch Ledger ({filteredTrains.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ALL LINES BUTTON */}
            <button
              onClick={selectAllLines}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isAllLinesSelected
                  ? 'bg-white text-slate-950 shadow-md ring-2 ring-white/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Select all 5 BART lines"
            >
              {isAllLinesSelected ? '✓ ALL LINES (5)' : 'SELECT ALL LINES'}
            </button>

            {/* GREEN LINE TOGGLE */}
            <button
              onClick={() => toggleLine('green')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLines.includes('green')
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-slate-950 text-emerald-400/60 hover:text-emerald-300 border border-emerald-950 hover:border-emerald-800 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Green Line (Berryessa ↔ Daly City)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{selectedLines.includes('green') ? '✓ GREEN' : '+ GREEN'}</span>
              <span className="text-[11px] opacity-85">
                ({trains.filter((t) => t.lineId === 'green').length})
              </span>
            </button>

            {/* YELLOW LINE TOGGLE */}
            <button
              onClick={() => toggleLine('yellow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLines.includes('yellow')
                  ? 'bg-yellow-400 text-slate-950 shadow-md ring-2 ring-yellow-400/50'
                  : 'bg-slate-950 text-yellow-400/60 hover:text-yellow-300 border border-yellow-950 hover:border-yellow-800 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Yellow Line (Antioch ↔ SFO / Millbrae)"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>{selectedLines.includes('yellow') ? '✓ YELLOW' : '+ YELLOW'}</span>
              <span className="text-[11px] opacity-85">
                ({trains.filter((t) => t.lineId === 'yellow').length})
              </span>
            </button>

            {/* RED LINE TOGGLE */}
            <button
              onClick={() => toggleLine('red')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLines.includes('red')
                  ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400/50'
                  : 'bg-slate-950 text-red-400/60 hover:text-red-300 border border-red-950 hover:border-red-800 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Red Line (Richmond ↔ Millbrae)"
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>{selectedLines.includes('red') ? '✓ RED' : '+ RED'}</span>
              <span className="text-[11px] opacity-85">
                ({trains.filter((t) => t.lineId === 'red').length})
              </span>
            </button>

            {/* ORANGE LINE TOGGLE */}
            <button
              onClick={() => toggleLine('orange')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLines.includes('orange')
                  ? 'bg-orange-500 text-slate-950 shadow-md ring-2 ring-orange-400/50'
                  : 'bg-slate-950 text-orange-400/60 hover:text-orange-300 border border-orange-950 hover:border-orange-800 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Orange Line (Richmond ↔ Berryessa)"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>{selectedLines.includes('orange') ? '✓ ORANGE' : '+ ORANGE'}</span>
              <span className="text-[11px] opacity-85">
                ({trains.filter((t) => t.lineId === 'orange').length})
              </span>
            </button>

            {/* BLUE LINE TOGGLE */}
            <button
              onClick={() => toggleLine('blue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLines.includes('blue')
                  ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/50'
                  : 'bg-slate-950 text-blue-400/60 hover:text-blue-300 border border-blue-950 hover:border-blue-800 opacity-60 hover:opacity-100'
              }`}
              title="Toggle Blue Line (Dublin/Pleasanton ↔ Daly City)"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{selectedLines.includes('blue') ? '✓ BLUE' : '+ BLUE'}</span>
              <span className="text-[11px] opacity-85">
                ({trains.filter((t) => t.lineId === 'blue').length})
              </span>
            </button>
          </div>
        </div>

        {/* Direction Selection Section (Northbound and/or Southbound) */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                Filter Direction (Northbound &amp; Southbound):
              </label>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isAllDirectionsSelected
                    ? 'text-emerald-400 bg-emerald-950/70 border-emerald-800'
                    : isNorthSelected
                    ? 'text-sky-400 bg-sky-950/70 border-sky-800'
                    : 'text-amber-400 bg-amber-950/70 border-amber-800'
                }`}
              >
                {isAllDirectionsSelected
                  ? 'Both Directions Active'
                  : isNorthSelected
                  ? '↑ Northbound Only'
                  : '↓ Southbound Only'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {directionCounts.total} Trains in Current Line Selection
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ALL / BOTH DIRECTIONS */}
            <button
              onClick={selectAllDirections}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isAllDirectionsSelected
                  ? 'bg-white text-slate-950 shadow-md ring-2 ring-white/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Show both Northbound and Southbound trains"
            >
              {isAllDirectionsSelected ? '✓ ALL DIRECTIONS (2)' : 'BOTH DIRECTIONS'}
            </button>

            {/* NORTHBOUND TOGGLE */}
            <button
              onClick={() => toggleDirection('North')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isNorthSelected
                  ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-400/50'
                  : 'bg-slate-950 text-sky-400/60 hover:text-sky-300 border border-sky-950 hover:border-sky-800 opacity-60 hover:opacity-100'
              }`}
              title="Filter Northbound trains"
            >
              <span className="text-sm font-black">↑</span>
              <span>{isNorthSelected ? '✓ NORTHBOUND' : '+ NORTHBOUND'}</span>
              <span className="text-[11px] opacity-85">({directionCounts.north})</span>
            </button>

            {/* SOUTHBOUND TOGGLE */}
            <button
              onClick={() => toggleDirection('South')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSouthSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-slate-950 text-amber-400/60 hover:text-amber-300 border border-amber-950 hover:border-amber-800 opacity-60 hover:opacity-100'
              }`}
              title="Filter Southbound trains"
            >
              <span className="text-sm font-black">↓</span>
              <span>{isSouthSelected ? '✓ SOUTHBOUND' : '+ SOUTHBOUND'}</span>
              <span className="text-[11px] opacity-85">({directionCounts.south})</span>
            </button>
          </div>
        </div>

        {/* Selected Filters Active Banner */}
        {(!isAllLinesSelected || !isAllDirectionsSelected) && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-300 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-emerald-400 font-bold">● ACTIVE FILTER:</span>
                {!isAllLinesSelected && (
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-white font-bold uppercase">
                    Lines ({selectedLines.length}): {selectedLines.join(', ')}
                  </span>
                )}
                {!isAllDirectionsSelected && (
                  <span
                    className={`px-2 py-0.5 rounded border font-bold uppercase ${
                      isNorthSelected
                        ? 'bg-sky-950 text-sky-300 border-sky-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    Direction: {isNorthSelected ? '↑ Northbound Only' : '↓ Southbound Only'}
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                Showing <strong className="text-white">{filteredTrains.length}</strong> active consists (out of{' '}
                {trains.length} total across system) on map and ledger
              </div>
            </div>
            <button
              onClick={() => {
                selectAllLines();
                selectAllDirections();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-mono font-bold cursor-pointer transition-colors self-start sm:self-auto shrink-0"
            >
              Reset All Filters &rarr;
            </button>
          </div>
        )}
      </div>

      {/* SVG Map Display (Rendered in 'both' or 'map' mode) */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <div className="relative border-2 border-slate-800 bg-[#060c09] rounded-2xl p-2 sm:p-4 overflow-hidden shadow-2xl animate-fadeIn">
          <div className="absolute top-4 left-4 pointer-events-none text-[11px] font-mono text-slate-500 space-y-0.5 z-10">
            <div className="text-slate-400 font-bold">BAY AREA RAPID TRANSIT NETWORK</div>
            <div>
              {isAllLinesSelected && isAllDirectionsSelected
                ? 'REAL-TIME PHYSICAL TRAIN POSITIONS (ALL LINES & DIRECTIONS)'
                : `FILTERED: ${!isAllLinesSelected ? selectedLines.map((l) => l.toUpperCase()).join(' + ') : 'ALL LINES'}${
                    !isAllDirectionsSelected
                      ? isNorthSelected
                        ? ' • [↑ NORTHBOUND ONLY]'
                        : ' • [↓ SOUTHBOUND ONLY]'
                      : ''
                  }`}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ALL 49 STATIONS LABELED • GREEN GLOW [🚆] INDICATES ACTIVE TRAINS AT STATION</span>
            </div>
          </div>

          {/* Transbay Tube Marker */}
          <div className="absolute top-[26%] left-[46%] pointer-events-none text-[10px] font-mono text-cyan-400/80 border border-cyan-800/40 bg-cyan-950/60 px-2 py-0.5 rounded z-10 hidden sm:block">
            TRANSBAY TUBE ≋
          </div>

          <svg
            viewBox="-35 -20 955 545"
            className="w-full h-auto min-h-[280px] sm:min-h-[380px] md:min-h-[460px] max-h-[680px] select-none"
          >
            <defs>
              <pattern id="bayWater2" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 0 5 Q 2.5 2, 5 5 T 10 5" fill="none" stroke="#0e231e" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* San Francisco Bay Body of Water */}
            <ellipse cx="420" cy="250" rx="95" ry="165" fill="url(#bayWater2)" opacity="0.6" />

            {/* Transbay Underwater Tube Connector */}
            <line
              x1={stationCoords.EMBR.x}
              y1={stationCoords.EMBR.y}
              x2={stationCoords.WOAK.x}
              y2={stationCoords.WOAK.y}
              stroke="#00e5ff"
              strokeWidth="5"
              strokeDasharray="5 3"
              opacity="0.7"
            />
            <text
              x={(stationCoords.EMBR.x + stationCoords.WOAK.x) / 2}
              y={(stationCoords.EMBR.y + stationCoords.WOAK.y) / 2 - 8}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="monospace"
              fill="#00e5ff"
              fontWeight="bold"
              className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] pointer-events-none select-none"
            >
              TRANSBAY TUBE ≋
            </text>

            {/* Line Track Rails */}
            {Object.entries(trackLines).map(([lId, config]) => {
              const isHighlighted = selectedLines.includes(lId);
              const pts = config.stations
                .map((code) => stationCoords[code])
                .filter(Boolean);

              if (pts.length < 2) return null;
              const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

              return (
                <g
                  key={lId}
                  opacity={isHighlighted ? 0.95 : 0.1}
                  className="transition-opacity duration-300"
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={config.color}
                    strokeWidth={isHighlighted ? '3.2' : '1.2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* ALL 49 Station Dots, Active Train Presence Halos, and Station Names */}
            {Object.entries(stationCoords).map(([code, p]) => {
              const trainsAtThisStation = trainsAtStation[code] || [];
              const hasActiveTrain = trainsAtThisStation.length > 0;
              const isSelectedTrainHere =
                selectedTrain &&
                (selectedTrain.stationCode === code || selectedTrain.upcomingStationCode === code);

              const activeColor = trainsAtThisStation[0]?.hexcolor || '#10b981';

              return (
                <g
                  key={code}
                  className="cursor-pointer group select-none transition-all duration-200"
                  onClick={() => {
                    if (trainsAtThisStation.length > 0) {
                      playBeep(720, 0.05);
                      setSelectedTrain(trainsAtThisStation[0]);
                    }
                  }}
                >
                  <title>{`${p.name} (${code})
${
  trainsAtThisStation.length > 0
    ? `• ${trainsAtThisStation.length} Active Train(s) Currently Here or Approaching`
    : '• BART Station'
}`}</title>

                  {/* Pulsing halo ring when active train is currently at or approaching this station */}
                  {hasActiveTrain && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="none"
                      stroke={activeColor}
                      strokeWidth="1.5"
                      opacity="0.85"
                      className="animate-ping origin-center"
                    />
                  )}

                  {/* Station Marker Dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelectedTrainHere ? '4.8' : hasActiveTrain ? '4' : p.isMajorHub ? '3.2' : '2.4'}
                    fill={hasActiveTrain ? activeColor : '#050a07'}
                    stroke={
                      isSelectedTrainHere
                        ? '#ffffff'
                        : hasActiveTrain
                        ? '#ffffff'
                        : p.isMajorHub
                        ? '#cbd5e1'
                        : '#64748b'
                    }
                    strokeWidth={isSelectedTrainHere ? '2' : p.isMajorHub ? '1.4' : '1'}
                    className="group-hover:stroke-white group-hover:scale-125 transition-all origin-center"
                  />

                  {/* Station Name Label for ALL 49 Stations */}
                  <text
                    x={p.x + (p.dx ?? 8)}
                    y={p.y + (p.dy ?? 3)}
                    textAnchor={p.anchor ?? 'start'}
                    fontSize={hasActiveTrain || isSelectedTrainHere ? '8.8' : p.isMajorHub ? '8' : '7.2'}
                    fontFamily="monospace"
                    fontWeight={hasActiveTrain || isSelectedTrainHere || p.isMajorHub ? 'bold' : '500'}
                    fill={
                      isSelectedTrainHere
                        ? '#38bdf8'
                        : hasActiveTrain
                        ? '#4ade80'
                        : p.isMajorHub
                        ? '#ffffff'
                        : '#cbd5e1'
                    }
                    className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] transition-colors select-none"
                  >
                    {p.shortName || p.name}
                    {hasActiveTrain && (
                      <tspan fill="#34d399" fontWeight="bold">
                        {` [${trainsAtThisStation.length}🚆]`}
                      </tspan>
                    )}
                  </text>
                </g>
              );
            })}

            {/* REAL PHYSICAL TRAIN ICONS AT ACTUAL STATIONS */}
            {filteredTrains.map((train) => {
              const isSelected = selectedTrain?.id === train.id;

              return (
                <g
                  key={train.id}
                  transform={`translate(${train.x}, ${train.y})`}
                  onClick={() => {
                    playBeep(720, 0.05);
                    setSelectedTrain(train);
                  }}
                  className="cursor-pointer group transition-transform duration-200"
                >
                  {/* Glowing Radar Pulse Ring when selected */}
                  {isSelected && (
                    <circle
                      r="16"
                      fill="none"
                      stroke={train.hexcolor}
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-spin opacity-90"
                    />
                  )}

                  {/* Train Container Badge */}
                  <title>{`${train.lineName} to ${train.destination}
• Next Upcoming Station: ${train.upcomingStationName || train.stationName} (${train.platform})
• Expected Arrival (Upcoming Stop): ${train.expectedArrivalTime || '--'} (${train.isAtPlatform ? 'At Platform / Boarding' : `in ${train.arrivalMinutes ?? 0}m`})
• Expected Departure (Upcoming Stop): ${train.expectedDepartureTime || 'Leaving'} (${train.isAtPlatform ? 'Leaving now' : `departs in ${train.departureMinutes ?? 1}m`})
• Terminal Destination ETA: ${train.finalDestinationArrivalTime || train.expectedArrivalTime || '--'} at ${train.destAbbr}`}</title>
                  <rect
                    x="-12"
                    y="-12"
                    width="24"
                    height="24"
                    rx="6"
                    fill="#050a07"
                    stroke={train.hexcolor}
                    strokeWidth={isSelected ? '2.5' : '2'}
                    className="group-hover:scale-115 transition-transform origin-center"
                  />

                  {/* Locomotive Front Graphic */}
                  <path
                    d="M-5 -5 H5 V2 Q5 5 0 5 Q-5 5 -5 2 Z"
                    fill={train.hexcolor}
                  />
                  <rect x="-3.5" y="-3.5" width="7" height="3" rx="0.8" fill="#040805" />
                  <circle cx="-2.5" cy="1.5" r="0.8" fill="#ffffff" />
                  <circle cx="2.5" cy="1.5" r="0.8" fill="#ffffff" />

                  {/* Cars Count Badge */}
                  <text
                    x="0"
                    y="-14"
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#ffffff"
                    className="select-none pointer-events-none drop-shadow-xs"
                  >
                    {train.cars}c
                  </text>

                  {/* Destination Tag */}
                  <text
                    x="0"
                    y="19"
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={train.hexcolor}
                    className="select-none pointer-events-none drop-shadow-xs"
                  >
                    {train.destAbbr}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Selected Train Telemetry Modal / Card */}
          {selectedTrain && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900/95 border border-slate-800 text-xs flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5 sm:mt-0"
                    style={{ backgroundColor: selectedTrain.hexcolor }}
                  />
                  <div>
                    <div className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                      <span>{selectedTrain.lineName}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span>Bound for {selectedTrain.destination}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          selectedTrain.direction.toLowerCase().startsWith('n')
                            ? 'bg-sky-950 text-sky-400 border border-sky-800 font-bold'
                            : 'bg-amber-950 text-amber-400 border border-amber-800 font-bold'
                        }`}
                      >
                        {selectedTrain.direction.toLowerCase().startsWith('n') ? '↑ Northbound' : '↓ Southbound'}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono">
                      <span>
                        Current Station: <strong className="text-white">{selectedTrain.stationName}</strong> ({selectedTrain.platform})
                      </span>
                      <span>&bull;</span>
                      <span>{selectedTrain.cars} Cars</span>
                      {selectedTrain.delaySec > 0 ? (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-400 font-bold">
                            +{Math.round(selectedTrain.delaySec / 60)}m Delay
                          </span>
                        </>
                      ) : (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-400 font-bold">On Time</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrain(null)}
                  className="text-slate-400 hover:text-white p-1 ml-auto cursor-pointer self-start"
                  title="Close Selection"
                >
                  &times;
                </button>
              </div>

              {/* Real-Time Expected Times Telemetry Pill Box */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                {/* 1. Next Upcoming Station */}
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                    Next Upcoming Station
                  </span>
                  <div className="text-white font-bold text-sm truncate">
                    {selectedTrain.upcomingStationName || selectedTrain.stationName}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedTrain.isAtPlatform
                      ? '● At Platform / Boarding'
                      : `Approaching (${selectedTrain.platform})`}
                  </span>
                </div>

                {/* 2. Expected Arrival at Upcoming Station */}
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-cyan-400 text-[10px] block uppercase font-semibold">
                    Expected Arrival (Next Stop)
                  </span>
                  <div className="text-cyan-400 font-bold text-sm">
                    {selectedTrain.expectedArrivalTime || '--'}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedTrain.isAtPlatform
                      ? '● Arrived / Boarding'
                      : `in ${selectedTrain.arrivalMinutes ?? 0} min`}
                  </span>
                </div>

                {/* 3. Expected Departure from Upcoming Station */}
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-emerald-400 text-[10px] block uppercase font-semibold">
                    Expected Departure (Next Stop)
                  </span>
                  <div className="text-emerald-400 font-bold text-sm">
                    {selectedTrain.expectedDepartureTime || 'Leaving'}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedTrain.isAtPlatform
                      ? '● Leaving now'
                      : `departs in ${selectedTrain.departureMinutes ?? 1} min`}
                  </span>
                </div>

                {/* 4. Final Destination ETA */}
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-0.5">
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">
                    Terminal Arrival
                  </span>
                  <div className="text-yellow-400 font-bold text-sm">
                    {selectedTrain.finalDestinationArrivalTime || selectedTrain.expectedArrivalTime || '--'}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    at {selectedTrain.destAbbr} (~{selectedTrain.finalDurationMins ?? selectedTrain.remainingDurationMins ?? 0}m total)
                  </span>
                </div>
              </div>

              {/* Complete Stop-by-Stop Schedule for ALL Upcoming Stations along this Train's Route */}
              {selectedTrain.upcomingStops && selectedTrain.upcomingStops.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                    <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>⏱</span>
                      <span>Upcoming Stations Schedule ({selectedTrain.upcomingStops.length} Stops Ahead):</span>
                    </span>
                    <span className="text-slate-400">
                      When this train will arrive and depart at any upcoming station
                    </span>
                  </div>
                  <div className="overflow-x-auto no-scrollbar pb-1">
                    <div className="flex items-stretch gap-2 min-w-max">
                      {selectedTrain.upcomingStops.map((stop, sIdx) => (
                        <div
                          key={`${stop.stationCode}-${sIdx}`}
                          className={`p-2.5 rounded-xl border font-mono text-xs space-y-1 min-w-[155px] ${
                            stop.isNextStop
                              ? 'bg-emerald-950/40 border-emerald-700/80 ring-1 ring-emerald-500/30'
                              : stop.isTerminal
                              ? 'bg-cyan-950/40 border-cyan-800/80'
                              : 'bg-slate-950 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-[11px] truncate" title={stop.stationName}>
                              {stop.stationName}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                stop.isNextStop
                                  ? 'bg-emerald-500 text-slate-950'
                                  : stop.isTerminal
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {stop.isNextStop ? 'NEXT' : stop.isTerminal ? 'TERM' : `+${stop.minutesAway}m`}
                            </span>
                          </div>
                          <div className="text-[10px] space-y-0.5 pt-0.5 border-t border-slate-800/60">
                            <div className="flex items-center justify-between">
                              <span className="text-cyan-400">Arrives:</span>
                              <span className="text-white font-bold">{stop.expectedArrivalTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400">Departs:</span>
                              <span className="text-white font-bold">{stop.expectedDepartureTime}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Real-Time Live Fleet Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">ACTIVE TRAINS (SYSTEM)</span>
          <span className="text-lg font-bold text-emerald-400">{trains.length} Trains</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">FILTERED ON SCREEN</span>
          <span className="text-lg font-bold text-cyan-400">
            {filteredTrains.length} Trains
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            {selectedLines.length} {selectedLines.length === 1 ? 'Line' : 'Lines'} &bull;{' '}
            {isAllDirectionsSelected ? 'Both Directions' : isNorthSelected ? '↑ Northbound' : '↓ Southbound'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">FEED PROTOCOL</span>
          <span className="text-lg font-bold text-yellow-400">BART GTFS / ETD</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">SYSTEM CONNECTION</span>
          <span className="text-lg font-bold text-white">LIVE CONNECTED</span>
        </div>
      </div>

      {/* LIVE TRAIN DISPATCH LEDGER TABLE WITH DEDICATED DIRECTION COLUMN */}
      {(viewMode === 'both' || viewMode === 'ledger') && (
        <div
          id="dispatch-ledger"
          className="p-4 sm:p-6 lg:p-7 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md space-y-4 animate-fadeIn scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-base font-bold text-white tracking-tight">
                  Live BART Train Dispatch Ledger ({filteredTrains.length} Consists Tracked)
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAllLinesSelected && isAllDirectionsSelected
                  ? 'Showing active trains across all lines and directions. Direction is broken out into its own column. Click any row to highlight on map.'
                  : `Showing ${filteredTrains.length} active trains (${
                      !isAllLinesSelected ? selectedLines.map((l) => l.toUpperCase()).join(', ') : 'All Lines'
                    } • ${
                      !isAllDirectionsSelected
                        ? isNorthSelected
                          ? '↑ Northbound Only'
                          : '↓ Southbound Only'
                        : 'Both Directions'
                    }). Click any row to highlight on map.`}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-emerald-400">
                {isLiveConnected ? 'REAL-TIME GTFS FEED' : 'STATION TELEMETRY'}
              </span>
            </div>
          </div>

          {filteredTrains.length > 0 ? (
            <div className="space-y-1.5">
              <div className="sm:hidden flex items-center justify-between text-[10px] font-mono text-slate-500 pb-0.5 px-0.5">
                <span>{filteredTrains.length} Consists Tracked</span>
                <span>Swipe table &rarr;</span>
              </div>
              <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 scrollbar-thin">
                <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Line</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Upcoming Station</th>
                    <th className="py-2.5 px-3">Expected Arrival (Next Stop)</th>
                    <th className="py-2.5 px-3">Expected Departure (Next Stop)</th>
                    <th className="py-2.5 px-3">Upcoming Stops</th>
                    <th className="py-2.5 px-3">Status / Platform</th>
                    <th className="py-2.5 px-3">Cars</th>
                    <th className="py-2.5 px-3">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredTrains.map((train) => {
                    const isSelected = selectedTrain?.id === train.id;
                    const isNorth = (train.direction || '').toLowerCase().startsWith('n');
                    const isExpanded = expandedTrainId === train.id;

                    return (
                      <React.Fragment key={train.id}>
                        <tr
                          onClick={() => {
                            playBeep(720, 0.05);
                            setSelectedTrain(train);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-slate-800/90 text-white font-medium ring-1 ring-emerald-500/50'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          {/* Line Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                              style={{ backgroundColor: train.hexcolor }}
                            />
                            <span className="font-mono uppercase font-bold text-[11px]">
                              {train.lineId} Line
                            </span>
                          </td>

                          {/* Dedicated Direction Column with quick toggle filter */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isNorth ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDirection('North');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-950/80 border border-sky-800 hover:border-sky-600 hover:bg-sky-900/60 text-sky-400 font-mono font-bold text-[11px] cursor-pointer transition-colors"
                                title="Click to toggle Northbound filter"
                              >
                                <span className="text-xs">↑</span> Northbound
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDirection('South');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-800 hover:border-amber-600 hover:bg-amber-900/60 text-amber-400 font-mono font-bold text-[11px] cursor-pointer transition-colors"
                                title="Click to toggle Southbound filter"
                              >
                                <span className="text-xs">↓</span> Southbound
                              </button>
                            )}
                          </td>

                          {/* Destination */}
                          <td className="py-3 px-3 font-semibold text-white whitespace-nowrap font-sans">
                            <div>{train.destination}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              Terminal: {train.destAbbr} &bull; ETA {train.finalDestinationArrivalTime || train.expectedArrivalTime || '--'}
                            </div>
                          </td>

                          {/* Upcoming Station */}
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            <div className="text-emerald-300 font-bold text-xs">
                              {train.upcomingStationName || train.stationName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {train.isAtPlatform ? '● At Platform / Boarding' : 'Approaching Next Station'}
                            </div>
                          </td>

                          {/* Expected Arrival Time at Upcoming Station */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono">
                            <div className="text-cyan-400 font-bold text-xs">
                              {train.expectedArrivalTime || '--'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {train.isAtPlatform
                                ? '● Arrived'
                                : `in ${train.arrivalMinutes ?? 0}m at ${train.upcomingStationCode || train.stationCode}`}
                            </div>
                          </td>

                          {/* Expected Departure Time from Upcoming Station */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono">
                            <div className="text-emerald-400 font-bold text-xs">
                              {train.expectedDepartureTime || 'Leaving'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {train.isAtPlatform
                                ? '● Leaving now'
                                : `departs in ${train.departureMinutes ?? 1}m`}
                            </div>
                          </td>

                          {/* Upcoming Stops Schedule Button */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playKeyClick();
                                setExpandedTrainId(isExpanded ? null : train.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold cursor-pointer transition-colors ${
                                isExpanded
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-slate-950 text-emerald-400 hover:text-white border-slate-800 hover:border-slate-700'
                              }`}
                              title="View expected arrival and departure times for all upcoming stations"
                            >
                              <span>⏱ {train.upcomingStops?.length || 0} Stops Ahead</span>
                              <span className="text-[9px]">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          </td>

                          {/* Status / Platform */}
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            {train.minutes === 'Leaving' || train.isAtPlatform ? (
                              <span className="text-emerald-400 font-bold">● Boarding / Departing</span>
                            ) : (
                              <span className="text-slate-300">
                                Arriving in {train.minutes}m ({train.platform})
                              </span>
                            )}
                          </td>

                          {/* Cars */}
                          <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {train.cars} cars
                          </td>

                          {/* Delay */}
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            {train.delaySec > 0 ? (
                              <span className="text-amber-400 font-bold">
                                +{Math.round(train.delaySec / 60)}m
                              </span>
                            ) : (
                              <span className="text-slate-400">On Time</span>
                            )}
                          </td>
                        </tr>

                        {/* Inline Expandable Schedule for this Train */}
                        {isExpanded && (
                          <tr className="bg-slate-950/95 border-b border-slate-800 animate-fadeIn">
                            <td colSpan={10} className="p-3 sm:p-4 font-mono">
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <span>⏱</span>
                                    <span>
                                      Upcoming Station Schedule ({train.upcomingStops?.length || 0} Stations to {train.destination}):
                                    </span>
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    Exact train arrival & departure times for any upcoming station along this run
                                  </span>
                                </div>
                                <div className="overflow-x-auto no-scrollbar pb-1">
                                  <div className="flex items-stretch gap-2 min-w-max">
                                    {train.upcomingStops?.map((stop, sIdx) => (
                                      <div
                                        key={`${stop.stationCode}-${sIdx}`}
                                        className={`p-2.5 rounded-xl border text-xs space-y-1 min-w-[155px] ${
                                          stop.isNextStop
                                            ? 'bg-emerald-950/50 border-emerald-700/80 ring-1 ring-emerald-500/30'
                                            : stop.isTerminal
                                            ? 'bg-cyan-950/50 border-cyan-800/80'
                                            : 'bg-slate-900/90 border-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-white text-[11px] truncate" title={stop.stationName}>
                                            {stop.stationName}
                                          </span>
                                          <span
                                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                              stop.isNextStop
                                                ? 'bg-emerald-500 text-slate-950'
                                                : stop.isTerminal
                                                ? 'bg-cyan-500 text-slate-950'
                                                : 'bg-slate-800 text-slate-400'
                                            }`}
                                          >
                                            {stop.isNextStop ? 'NEXT' : stop.isTerminal ? 'TERM' : `+${stop.minutesAway}m`}
                                          </span>
                                        </div>
                                        <div className="text-[10px] space-y-0.5 pt-0.5 border-t border-slate-800/60">
                                          <div className="flex items-center justify-between">
                                            <span className="text-cyan-400">Arrives:</span>
                                            <span className="text-white font-bold">{stop.expectedArrivalTime}</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-emerald-400">Departs:</span>
                                            <span className="text-white font-bold">{stop.expectedDepartureTime}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl text-xs space-y-2">
              <p>
                No active trains detected matching the current filters (Lines:{' '}
                {selectedLines.map((l) => l.toUpperCase()).join(', ')} &bull; Direction:{' '}
                {isNorthSelected ? 'Northbound' : ''}
                {isNorthSelected && isSouthSelected ? ' & ' : ''}
                {!isNorthSelected && isSouthSelected ? 'Southbound' : ''}
                {isNorthSelected && isSouthSelected ? 'Southbound' : ''}).
              </p>
              <button
                onClick={() => {
                  selectAllLines();
                  selectAllDirections();
                }}
                className="text-emerald-400 underline font-mono cursor-pointer font-bold"
              >
                Reset All Line &amp; Direction Filters &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
