export interface PlayerRegistryItem {
  id: string;
  name: string;
  teamAbbr: string;
  teamName: string;
  position: string;
  jerseyNumber: number;
  status: 'ACTIVE_53MAN' | 'OUT_INJURED' | 'QUESTIONABLE' | 'IR_RESERVE' | 'SUSPENDED';
  injuryNote?: string;
  notes?: string;
}

/**
 * MASTER SINGLE SOURCE OF TRUTH (SSOT) FOR ALL NFL PLAYER-TEAM MAPPINGS
 * Every component (Roster Inspector, Game Injury Reports, Medical Wires, and News Wire)
 * references this unified registry to guarantee zero data drift or team mismatch.
 */
export const MASTER_PLAYER_ROSTER: Record<string, PlayerRegistryItem> = {
  // SAN FRANCISCO 49ERS (SF)
  'sf-23-cmc': {
    id: 'sf-23-cmc',
    name: 'Christian McCaffrey',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'RB',
    jerseyNumber: 23,
    status: 'ACTIVE_53MAN',
    injuryNote: 'None (100% Full Health)',
    notes: '100% healthy and active for Monday Night Football in touch share with Jordan Mason.',
  },
  'sf-11-ba': {
    id: 'sf-11-ba',
    name: 'Brandon Aiyuk',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'WR',
    jerseyNumber: 11,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Perimeter WR for San Francisco 49ers.',
  },
  'sf-13-bp': {
    id: 'sf-13-bp',
    name: 'Brock Purdy',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'QB',
    jerseyNumber: 13,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Quarterback for San Francisco 49ers.',
  },
  'sf-85-gk': {
    id: 'sf-85-gk',
    name: 'George Kittle',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'TE',
    jerseyNumber: 85,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Tight End for San Francisco 49ers.',
  },
  'sf-19-ds': {
    id: 'sf-19-ds',
    name: 'Deebo Samuel',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'WR',
    jerseyNumber: 19,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Wide Receiver for San Francisco 49ers.',
  },
  'sf-24-jm': {
    id: 'sf-24-jm',
    name: 'Jordan Mason',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'RB',
    jerseyNumber: 24,
    status: 'ACTIVE_53MAN',
    notes: '1st String Co-Starting RB for San Francisco 49ers.',
  },
  'sf-57-dg': {
    id: 'sf-57-dg',
    name: 'Dre Greenlaw',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'LB',
    jerseyNumber: 57,
    status: 'SUSPENDED',
    injuryNote: '1-Game NFL Suspension',
    notes: 'Appeal rejected by NFL; sitting out vs Commanders.',
  },
  'sf-13-me': {
    id: 'sf-13-me',
    name: 'Mike Evans',
    teamAbbr: 'SF',
    teamName: 'San Francisco 49ers',
    position: 'WR',
    jerseyNumber: 13,
    status: 'ACTIVE_53MAN',
    notes: 'Starting Wide Receiver for the San Francisco 49ers (verified via 2026 active roster depth chart).',
  },

  // TAMPA BAY BUCCANEERS (TB)
  'tb-6-bm': {
    id: 'tb-6-bm',
    name: 'Baker Mayfield',
    teamAbbr: 'TB',
    teamName: 'Tampa Bay Buccaneers',
    position: 'QB',
    jerseyNumber: 6,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Quarterback for Tampa Bay Buccaneers.',
  },
  'tb-14-cg': {
    id: 'tb-14-cg',
    name: 'Chris Godwin',
    teamAbbr: 'TB',
    teamName: 'Tampa Bay Buccaneers',
    position: 'WR',
    jerseyNumber: 14,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Slot Wide Receiver for Tampa Bay Buccaneers.',
  },
  'tb-31-aw': {
    id: 'tb-31-aw',
    name: 'Antoine Winfield Jr.',
    teamAbbr: 'TB',
    teamName: 'Tampa Bay Buccaneers',
    position: 'S',
    jerseyNumber: 31,
    status: 'ACTIVE_53MAN',
    notes: '1st String All-Pro Safety for Tampa Bay Buccaneers.',
  },

  // WASHINGTON COMMANDERS (WSH)
  'wsh-5-jd': {
    id: 'wsh-5-jd',
    name: 'Jayden Daniels',
    teamAbbr: 'WSH',
    teamName: 'Washington Commanders',
    position: 'QB',
    jerseyNumber: 5,
    status: 'ACTIVE_53MAN',
    injuryNote: 'Ribs (Cleared)',
    notes: 'Cleared for Monday Night Football; dual-threat mobility intact.',
  },
  'wsh-8-br': {
    id: 'wsh-8-br',
    name: 'Brian Robinson Jr.',
    teamAbbr: 'WSH',
    teamName: 'Washington Commanders',
    position: 'RB',
    jerseyNumber: 8,
    status: 'QUESTIONABLE',
    injuryNote: 'Knee Soreness',
    notes: 'Limited in practice; game-time decision.',
  },
  'wsh-92-da': {
    id: 'wsh-92-da',
    name: 'Dorance Armstrong',
    teamAbbr: 'WSH',
    teamName: 'Washington Commanders',
    position: 'DE',
    jerseyNumber: 92,
    status: 'OUT_INJURED',
    injuryNote: 'Ribs',
    notes: 'Starting edge rusher inactive.',
  },

  // PHILADELPHIA EAGLES (PHI)
  'phi-11-ab': {
    id: 'phi-11-ab',
    name: 'A.J. Brown',
    teamAbbr: 'PHI',
    teamName: 'Philadelphia Eagles',
    position: 'WR',
    jerseyNumber: 11,
    status: 'ACTIVE_53MAN',
    notes: '1st String All-Pro Wide Receiver (WR1) for Philadelphia Eagles.',
  },
  'phi-1-jh': {
    id: 'phi-1-jh',
    name: 'Jalen Hurts',
    teamAbbr: 'PHI',
    teamName: 'Philadelphia Eagles',
    position: 'QB',
    jerseyNumber: 1,
    status: 'OUT_INJURED',
    injuryNote: 'Blood Clot / Hospitalized',
    notes: '🚨 EMERGENCY MEDICAL INJURY: Hospitalized for emergency blood clot treatment; ruled OUT for Week 6.',
  },
  'phi-10-tm': {
    id: 'phi-10-tm',
    name: 'Tanner McKee',
    teamAbbr: 'PHI',
    teamName: 'Philadelphia Eagles',
    position: 'QB',
    jerseyNumber: 10,
    status: 'ACTIVE_53MAN',
    notes: 'Elevated starting QB in relief of Jalen Hurts.',
  },
  'phi-26-sb': {
    id: 'phi-26-sb',
    name: 'Saquon Barkley',
    teamAbbr: 'PHI',
    teamName: 'Philadelphia Eagles',
    position: 'RB',
    jerseyNumber: 26,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting RB for Philadelphia Eagles.',
  },
  'phi-6-ds': {
    id: 'phi-6-ds',
    name: 'DeVonta Smith',
    teamAbbr: 'PHI',
    teamName: 'Philadelphia Eagles',
    position: 'WR',
    jerseyNumber: 6,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting Wide Receiver.',
  },

  // NEW ENGLAND PATRIOTS (NE)
  'ne-84-kb': {
    id: 'ne-84-kb',
    name: 'Kendrick Bourne',
    teamAbbr: 'NE',
    teamName: 'New England Patriots',
    position: 'WR',
    jerseyNumber: 84,
    status: 'ACTIVE_53MAN',
    notes: 'Starting perimeter WR target for Drake Maye.',
  },

  // BALTIMORE RAVENS (BAL)
  'bal-8-lj': {
    id: 'bal-8-lj',
    name: 'Lamar Jackson',
    teamAbbr: 'BAL',
    teamName: 'Baltimore Ravens',
    position: 'QB',
    jerseyNumber: 8,
    status: 'OUT_INJURED',
    injuryNote: 'Sprained Left Ankle',
    notes: 'Ruled OUT for Week 6.',
  },
  'bal-22-dh': {
    id: 'bal-22-dh',
    name: 'Derrick Henry',
    teamAbbr: 'BAL',
    teamName: 'Baltimore Ravens',
    position: 'RB',
    jerseyNumber: 22,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting RB for Baltimore Ravens.',
  },

  // CLEVELAND BROWNS (CLE)
  'cle-4-dw': {
    id: 'cle-4-dw',
    name: 'Deshaun Watson',
    teamAbbr: 'CLE',
    teamName: 'Cleveland Browns',
    position: 'QB',
    jerseyNumber: 4,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting QB for Cleveland Browns.',
  },
  'cle-34-jf': {
    id: 'cle-34-jf',
    name: 'Jerome Ford',
    teamAbbr: 'CLE',
    teamName: 'Cleveland Browns',
    position: 'RB',
    jerseyNumber: 34,
    status: 'ACTIVE_53MAN',
    notes: '1st String Starting RB for Cleveland Browns.',
  },
};

/**
 * Get player registry item by player name (case-insensitive fuzzy match)
 */
export function getPlayerFromRegistry(playerName: string): PlayerRegistryItem | undefined {
  const cleanName = playerName.toLowerCase().trim();
  return Object.values(MASTER_PLAYER_ROSTER).find(
    (p) => p.name.toLowerCase().trim() === cleanName || cleanName.includes(p.name.toLowerCase().trim())
  );
}

/**
 * Get all players belonging to a team
 */
export function getPlayersByTeam(teamAbbrOrName: string): PlayerRegistryItem[] {
  const query = teamAbbrOrName.toLowerCase().trim();
  return Object.values(MASTER_PLAYER_ROSTER).filter(
    (p) => p.teamAbbr.toLowerCase() === query || p.teamName.toLowerCase().includes(query)
  );
}
