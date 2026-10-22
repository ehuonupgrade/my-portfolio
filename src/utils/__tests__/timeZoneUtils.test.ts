import { describe, it, expect } from 'bun:test';
import { formatToLocalUserTime, getUserTimeZoneAbbr } from '../timeZoneUtils';

describe('timeZoneUtils', () => {
  describe('formatToLocalUserTime', () => {
    it('should return empty string for null, undefined, or empty string input', () => {
      expect(formatToLocalUserTime(null)).toBe('');
      expect(formatToLocalUserTime(undefined)).toBe('');
      expect(formatToLocalUserTime('')).toBe('');
    });

    it('should handle garbage or invalid strings gracefully by applying timezone fallback', () => {
      const tzAbbr = getUserTimeZoneAbbr();

      // Some garbage string
      expect(formatToLocalUserTime('some random garbage text')).toBe('some random garbage text');

      // Fallback regex replacement checks
      expect(formatToLocalUserTime('game at 12:00 PM EDT')).toBe(`game at 12:00 PM ${tzAbbr}`);
      expect(formatToLocalUserTime('game at 12:00 PM EST')).toBe(`game at 12:00 PM ${tzAbbr}`);
      expect(formatToLocalUserTime('game at 12:00 PM PDT')).toBe(`game at 12:00 PM ${tzAbbr}`);
      expect(formatToLocalUserTime('game at 12:00 PM PST')).toBe(`game at 12:00 PM ${tzAbbr}`);

      // Also removes parenthetical PDT specific strings based on code logic
      expect(formatToLocalUserTime('Played (10:00 AM PDT)')).toBe('Played');
    });

    it('should correctly format a valid Date object', () => {
      const date = new Date('2026-10-23T00:15:00Z');
      const formatted = formatToLocalUserTime(date);
      // Validating it returns a string with some expected components.
      // Since it depends on the local timezone where tests run, we check for presence of tzAbbr
      const tzAbbr = getUserTimeZoneAbbr();
      expect(formatted).toContain(tzAbbr);
      expect(formatted).toContain('·');
    });

    it('should correctly format a timestamp (number)', () => {
      const date = new Date('2026-10-23T00:15:00Z');
      const timestamp = date.getTime();
      const formatted = formatToLocalUserTime(timestamp);

      const tzAbbr = getUserTimeZoneAbbr();
      expect(formatted).toContain(tzAbbr);
      expect(formatted).toContain('·');
    });

    it('should return early for status detail strings', () => {
      expect(formatToLocalUserTime('Final')).toBe('Final');
      expect(formatToLocalUserTime('Final/OT')).toBe('Final/OT');
      expect(formatToLocalUserTime('Halftime')).toBe('Halftime');
      expect(formatToLocalUserTime('3rd 4:12')).toBe('3rd 4:12');
      expect(formatToLocalUserTime('In Progress')).toBe('In Progress');
    });
  });
});
