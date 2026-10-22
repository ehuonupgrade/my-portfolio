import { describe, it, expect } from 'vitest';
import { validateRationaleRosterAlignment } from './rosterAlignmentValidator';

describe('validateRationaleRosterAlignment', () => {
  it('should return valid when a player belongs to one of the teams', () => {
    const text = 'Jalen Hurts threw a great pass today.';
    const result = validateRationaleRosterAlignment(text, 'Philadelphia Eagles', 'Dallas Cowboys');

    expect(result.hasMismatch).toBe(false);
    expect(result.mismatchesDetected.length).toBe(0);
    expect(result.sanitizedText).toBe(text);
  });

  it('should identify a mismatch when a player does not belong to either team', () => {
    const text = 'Jalen Hurts threw a great pass today.';
    const result = validateRationaleRosterAlignment(text, 'Kansas City Chiefs', 'Baltimore Ravens');

    expect(result.hasMismatch).toBe(true);
    expect(result.mismatchesDetected.length).toBe(1);

    const mismatch = result.mismatchesDetected[0];
    expect(mismatch.player).toBe('Jalen Hurts');
    expect(mismatch.mentionedTeam).toBe('Kansas City Chiefs / Baltimore Ravens');
    expect(mismatch.actualCurrentTeam).toBe('Philadelphia Eagles');

    // The invalid player name should be replaced with generic team defense
    expect(result.sanitizedText).toContain('Kansas City Chiefs defense');
    expect(result.sanitizedText).not.toContain('Jalen Hurts');
  });

  it('should correctly handle multiple players, some valid, some invalid', () => {
    const text = 'Patrick Mahomes and Jalen Hurts had a shootout.';
    const result = validateRationaleRosterAlignment(text, 'Kansas City Chiefs', 'Baltimore Ravens');

    expect(result.hasMismatch).toBe(true);
    expect(result.mismatchesDetected.length).toBe(1);

    const mismatch = result.mismatchesDetected[0];
    expect(mismatch.player).toBe('Jalen Hurts');
    expect(mismatch.mentionedTeam).toBe('Kansas City Chiefs / Baltimore Ravens');

    // Mahomes is valid, Hurts is invalid
    expect(result.sanitizedText).toContain('Patrick Mahomes');
    expect(result.sanitizedText).toContain('Kansas City Chiefs defense');
    expect(result.sanitizedText).not.toContain('Jalen Hurts');
  });

  it('should handle partial or abbreviated team names case insensitively', () => {
    const text = 'Baker Mayfield had a good game.';
    // Player is Baker Mayfield (Tampa Bay Buccaneers)
    const result = validateRationaleRosterAlignment(text, 'buccaneers', 'falcons');

    expect(result.hasMismatch).toBe(false);
    expect(result.mismatchesDetected.length).toBe(0);
    expect(result.sanitizedText).toBe(text);
  });
});
