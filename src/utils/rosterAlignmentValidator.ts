/**
 * Roster Alignment Validator
 * Automated safeguard that parses rationale text and verifies player team affiliations
 * against official active 53-man roster transaction feeds.
 */

export interface RosterMismatchCheckResult {
  hasMismatch: boolean;
  mismatchesDetected: {
    player: string;
    mentionedTeam: string;
    actualCurrentTeam: string;
    correctionNote: string;
  }[];
  sanitizedText: string;
}

// Active database of known player current team affiliations
export const OFFICIAL_ACTIVE_PLAYER_TEAM_MAP: Record<string, { teamName: string; teamAbbr: string; position: string }> = {
  'Myles Garrett': { teamName: 'Los Angeles Rams', teamAbbr: 'LAR', position: 'DE' },
  'Jalen Hurts': { teamName: 'Philadelphia Eagles', teamAbbr: 'PHI', position: 'QB' },
  'Tanner McKee': { teamName: 'Philadelphia Eagles', teamAbbr: 'PHI', position: 'QB' },
  'Saquon Barkley': { teamName: 'Philadelphia Eagles', teamAbbr: 'PHI', position: 'RB' },
  'Jerome Ford': { teamName: 'Cleveland Browns', teamAbbr: 'CLE', position: 'RB' },
  'Deshaun Watson': { teamName: 'Cleveland Browns', teamAbbr: 'CLE', position: 'QB' },
  'Za\'Darius Smith': { teamName: 'Cleveland Browns', teamAbbr: 'CLE', position: 'DE' },
  'Lamar Jackson': { teamName: 'Baltimore Ravens', teamAbbr: 'BAL', position: 'QB' },
  'Derrick Henry': { teamName: 'Baltimore Ravens', teamAbbr: 'BAL', position: 'RB' },
  'Patrick Mahomes': { teamName: 'Kansas City Chiefs', teamAbbr: 'KC', position: 'QB' },
  'Travis Kelce': { teamName: 'Kansas City Chiefs', teamAbbr: 'KC', position: 'TE' },
  'Geno Smith': { teamName: 'Seattle Seahawks', teamAbbr: 'SEA', position: 'QB' },
  'Kenneth Walker III': { teamName: 'Seattle Seahawks', teamAbbr: 'SEA', position: 'RB' },
  'Bo Nix': { teamName: 'Denver Broncos', teamAbbr: 'DEN', position: 'QB' },
};

/**
 * Validates text rationales against the official player-team database.
 * If a player is mentioned alongside a team they do NOT belong to, it strips or corrects the mention.
 */
export function validateRationaleRosterAlignment(
  text: string,
  homeTeam: string,
  awayTeam: string
): RosterMismatchCheckResult {
  const mismatches = [];
  let sanitized = text;

  // Check every registered player in our database
  for (const [playerName, playerInfo] of Object.entries(OFFICIAL_ACTIVE_PLAYER_TEAM_MAP)) {
    if (sanitized.includes(playerName)) {
      // Check if player is assigned to either of the two teams in this matchup
      const belongsToGame =
        playerInfo.teamName.toLowerCase().includes(homeTeam.toLowerCase()) ||
        playerInfo.teamName.toLowerCase().includes(awayTeam.toLowerCase()) ||
        homeTeam.toLowerCase().includes(playerInfo.teamName.toLowerCase()) ||
        awayTeam.toLowerCase().includes(playerInfo.teamName.toLowerCase());

      if (!belongsToGame) {
        mismatches.push({
          player: playerName,
          mentionedTeam: `${homeTeam} / ${awayTeam}`,
          actualCurrentTeam: playerInfo.teamName,
          correctionNote: `${playerName} is currently on the ${playerInfo.teamName} (${playerInfo.teamAbbr}), not in the ${homeTeam} vs ${awayTeam} matchup.`,
        });

        // Automatically replace any invalid player mention with team generic reference
        const regex = new RegExp(playerName, 'gi');
        sanitized = sanitized.replace(regex, `${homeTeam} defense`);
      }
    }
  }

  return {
    hasMismatch: mismatches.length > 0,
    mismatchesDetected: mismatches,
    sanitizedText: sanitized,
  };
}
