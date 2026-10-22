import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as timeZoneUtils from './timeZoneUtils';

describe('timeZoneUtils', () => {
  const originalWindow = global.window;
  const OriginalDateTimeFormat = Intl.DateTimeFormat;

  afterEach(() => {
    global.window = originalWindow;
    global.Intl.DateTimeFormat = OriginalDateTimeFormat;
    vi.restoreAllMocks();
  });

  describe('getUserTimeZoneAbbr', () => {
    it('returns "Local" when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(timeZoneUtils.getUserTimeZoneAbbr()).toBe('Local');
    });

    it('returns abbreviation from Intl.DateTimeFormat', () => {
      global.window = {} as Window & typeof globalThis;

      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'timeZoneName', value: 'PST' }
      ]);
      // @ts-ignore
      global.Intl.DateTimeFormat = function() {
          return { formatToParts: mockFormatToParts };
      };

      expect(timeZoneUtils.getUserTimeZoneAbbr()).toBe('PST');
    });

    it('returns "Local" when timeZoneName is not found', () => {
      global.window = {} as Window & typeof globalThis;

      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'day', value: '1' }
      ]);
      // @ts-ignore
      global.Intl.DateTimeFormat = function() {
          return { formatToParts: mockFormatToParts };
      };

      expect(timeZoneUtils.getUserTimeZoneAbbr()).toBe('Local');
    });

    it('returns "Local" when an error is thrown', () => {
      global.window = {} as Window & typeof globalThis;
      const mockFormatToParts = vi.fn().mockImplementation(() => {
        throw new Error('Test Error');
      });
      // @ts-ignore
      global.Intl.DateTimeFormat = function() {
          return { formatToParts: mockFormatToParts };
      };

      expect(timeZoneUtils.getUserTimeZoneAbbr()).toBe('Local');
    });
  });

  describe('formatCurrentTimeWithZone', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 0, 1, 13, 15, 30));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns localeTimeString without timezone when window is undefined', () => {
      // @ts-ignore
      delete global.window;
      expect(timeZoneUtils.formatCurrentTimeWithZone()).toBe(new Date().toLocaleTimeString());
    });

    it('returns formatted string with timeZoneAbbr', () => {
      global.window = {} as Window & typeof globalThis;

      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'timeZoneName', value: 'EST' }
      ]);
      // @ts-ignore
      global.Intl.DateTimeFormat = function(locale, options) {
          if (options && options.timeZoneName === 'short') {
              return { formatToParts: mockFormatToParts };
          }
          return new OriginalDateTimeFormat(locale, options);
      };

      const result = timeZoneUtils.formatCurrentTimeWithZone();
      expect(result).toContain('EST');
      expect(result).toMatch(/EST$/);
    });
  });

  describe('formatToLocalUserTime', () => {
    beforeEach(() => {
      global.window = {} as Window & typeof globalThis;

      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'timeZoneName', value: 'MST' }
      ]);
      // @ts-ignore
      global.Intl.DateTimeFormat = function(locale, options) {
          if (options && options.timeZoneName === 'short') {
              return { formatToParts: mockFormatToParts };
          }
          return new OriginalDateTimeFormat(locale, options);
      };
    });

    it('returns empty string for falsy inputs', () => {
      expect(timeZoneUtils.formatToLocalUserTime(undefined)).toBe('');
      expect(timeZoneUtils.formatToLocalUserTime(null)).toBe('');
      expect(timeZoneUtils.formatToLocalUserTime('')).toBe('');
    });

    it('handles Date object input', () => {
       const d = new Date(2024, 0, 1, 14, 0);
       const result = timeZoneUtils.formatToLocalUserTime(d);
       expect(result).toContain('Jan 1');
       expect(typeof result).toBe('string');
    });

    it('handles number input', () => {
       const num = new Date(2024, 0, 1, 14, 0).getTime();
       const result = timeZoneUtils.formatToLocalUserTime(num);
       expect(result).toContain('Jan 1');
       expect(typeof result).toBe('string');
    });

    it('returns string as-is for game status details without "T" and 4-digit year', () => {
      expect(timeZoneUtils.formatToLocalUserTime('Final')).toBe('Final');
      expect(timeZoneUtils.formatToLocalUserTime('Final/OT')).toBe('Final/OT');
      expect(timeZoneUtils.formatToLocalUserTime('Halftime')).toBe('Halftime');
      expect(timeZoneUtils.formatToLocalUserTime('3rd 4:12')).toBe('3rd 4:12');
    });

    it('handles string starting with "Played" and replaces tz', () => {
      const input = 'Played (10:00 AM EDT)';
      const result = timeZoneUtils.formatToLocalUserTime(input);
      expect(result).toBe('Played');
    });

    it('handles string starting with "Played" and replaces standalone EDT', () => {
        const input = 'Played EDT';
        const result = timeZoneUtils.formatToLocalUserTime(input);
        expect(result).toBe('Played MST');
    });

    it('handles standard ISO string', () => {
       const isoStr = '2026-10-23T10:15Z';
       const result = timeZoneUtils.formatToLocalUserTime(isoStr);
       expect(typeof result).toBe('string');
       expect(result.length).toBeGreaterThan(0);
    });

    it('handles formatted NFL schedule string with cleaned parentheticals', () => {
        const input = 'Thursday, Oct 22 · 8:15 PM EDT (TNF)';
        const result = timeZoneUtils.formatToLocalUserTime(input);
        expect(typeof result).toBe('string');
        expect(result).toContain('Oct 22');
    });

    it('handles fallback replacement', () => {
       const input = 'Random String EDT';
       const result = timeZoneUtils.formatToLocalUserTime(input);
       expect(result).toBe('Random String MST');
    });
  });
});
