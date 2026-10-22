import { describe, it, expect } from 'vitest';
import { validateNFLScheduleGrid, OFFICIAL_NFL_WEEK6_SCHEDULE_GRID } from './nflScheduleValidator';

describe('validateNFLScheduleGrid', () => {
  it('should validate an empty schedule', () => {
    const result = validateNFLScheduleGrid([]);
    expect(result.isValidSchedule).toBe(true);
    expect(result.duplicateTeamsFound).toEqual([]);
    expect(result.mismatchedGames).toEqual([]);
    expect(result.validatedGamesCount).toBe(0);
  });

  it('should validate a partially correct schedule without duplicates or mismatches', () => {
    const validGame = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID[0];
    const games = [{
      homeTeam: { abbr: validGame.homeTeamAbbr, name: validGame.homeTeamName },
      awayTeam: { abbr: validGame.awayTeamAbbr, name: validGame.awayTeamName }
    }];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(true);
    expect(result.duplicateTeamsFound).toEqual([]);
    expect(result.mismatchedGames).toEqual([]);
    expect(result.validatedGamesCount).toBe(1);
  });

  it('should validate the full official schedule', () => {
    const games = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID.map(game => ({
      homeTeam: { abbr: game.homeTeamAbbr, name: game.homeTeamName },
      awayTeam: { abbr: game.awayTeamAbbr, name: game.awayTeamName }
    }));
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(true);
    expect(result.duplicateTeamsFound).toEqual([]);
    expect(result.mismatchedGames).toEqual([]);
    expect(result.validatedGamesCount).toBe(OFFICIAL_NFL_WEEK6_SCHEDULE_GRID.length);
  });

  it('should detect duplicate teams in the schedule', () => {
    const validGame = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID[0];
    const games = [
      {
        homeTeam: { abbr: validGame.homeTeamAbbr, name: validGame.homeTeamName },
        awayTeam: { abbr: validGame.awayTeamAbbr, name: validGame.awayTeamName }
      },
      {
        homeTeam: { abbr: validGame.homeTeamAbbr, name: 'Another Team Name' },
        awayTeam: { abbr: 'IND', name: 'Indianapolis Colts' }
      }
    ];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(false);
    expect(result.duplicateTeamsFound).toContain(validGame.homeTeamAbbr);
    expect(result.validatedGamesCount).toBe(2);
  });

  it('should detect mismatched games not in the official grid', () => {
    const games = [
      {
        homeTeam: { abbr: 'NE', name: 'New England Patriots' },
        awayTeam: { abbr: 'MIA', name: 'Miami Dolphins' }
      }
    ];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(false);
    expect(result.mismatchedGames).toContain('MIA vs NE');
    expect(result.validatedGamesCount).toBe(1);
  });

  it('should detect both duplicates and mismatched games simultaneously', () => {
    const validGame = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID[0];
    const games = [
      {
        homeTeam: { abbr: validGame.homeTeamAbbr, name: validGame.homeTeamName },
        awayTeam: { abbr: validGame.awayTeamAbbr, name: validGame.awayTeamName }
      },
      {
        homeTeam: { abbr: validGame.homeTeamAbbr, name: validGame.homeTeamName },
        awayTeam: { abbr: 'MIA', name: 'Miami Dolphins' }
      }
    ];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(false);
    expect(result.duplicateTeamsFound).toContain(validGame.homeTeamAbbr);
    expect(result.mismatchedGames).toContain(`MIA vs ${validGame.homeTeamAbbr}`);
    expect(result.validatedGamesCount).toBe(2);
  });

  it('should validate regardless of team abbr casing', () => {
    const validGame = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID[0];
    const games = [{
      homeTeam: { abbr: validGame.homeTeamAbbr.toLowerCase(), name: validGame.homeTeamName },
      awayTeam: { abbr: validGame.awayTeamAbbr.toLowerCase(), name: validGame.awayTeamName }
    }];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(true);
    expect(result.duplicateTeamsFound).toEqual([]);
    expect(result.mismatchedGames).toEqual([]);
    expect(result.validatedGamesCount).toBe(1);
  });

  it('should validate teams played in opposite order (away vs home)', () => {
    const validGame = OFFICIAL_NFL_WEEK6_SCHEDULE_GRID[0];
    const games = [{
      homeTeam: { abbr: validGame.awayTeamAbbr, name: validGame.awayTeamName }, // away team as home
      awayTeam: { abbr: validGame.homeTeamAbbr, name: validGame.homeTeamName }  // home team as away
    }];
    const result = validateNFLScheduleGrid(games);
    expect(result.isValidSchedule).toBe(true);
    expect(result.duplicateTeamsFound).toEqual([]);
    expect(result.mismatchedGames).toEqual([]);
    expect(result.validatedGamesCount).toBe(1);
  });
});
