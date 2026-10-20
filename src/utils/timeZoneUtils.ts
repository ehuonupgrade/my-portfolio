/**
 * TIME ZONE & LOCAL TIME UTILITIES
 * Automatically detects the user's browser timezone and formats game kickoff times,
 * timestamps, and date references into the user's local browser time.
 */

/**
 * Returns the short timezone abbreviation for the user's browser (e.g. "PDT", "CDT", "EDT", "BST", "GMT")
 */
export function getUserTimeZoneAbbr(): string {
  if (typeof window === 'undefined') return 'Local';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : 'Local';
  } catch {
    return 'Local';
  }
}

/**
 * Formats the current time with the user's local timezone abbreviation (e.g. "1:15:30 PM PDT")
 */
export function formatCurrentTimeWithZone(): string {
  if (typeof window === 'undefined') return new Date().toLocaleTimeString();
  return `${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })} ${getUserTimeZoneAbbr()}`;
}

/**
 * Parses any date/time string (e.g. ISO string "2026-10-23T00:15Z", "Thursday, Oct 22 · 8:15 PM EDT", etc.)
 * and converts it into the user's local browser timezone.
 */
export function formatToLocalUserTime(timeInput: string | Date | number | undefined | null): string {
  if (!timeInput) return '';

  const tzAbbr = getUserTimeZoneAbbr();

  let dateObj: Date | null = null;
  if (timeInput instanceof Date) {
    dateObj = timeInput;
  } else if (typeof timeInput === 'number') {
    dateObj = new Date(timeInput);
  } else if (typeof timeInput === 'string') {
    const inputStr = timeInput.trim();

    // Check if string is already status detail like "Final", "Final/OT", "Halftime", "3rd 4:12"
    if (
      /^(final|final\/ot|in progress|halftime|\d(st|nd|rd|th)\s+\d{1,2}:\d{2})/i.test(inputStr) &&
      !inputStr.includes('T') &&
      !/\d{4}/.test(inputStr)
    ) {
      return inputStr;
    }

    // Check if string contains "Played"
    if (inputStr.toLowerCase().startsWith('played')) {
      return inputStr
        .replace(/\s*\(\d{1,2}:\d{2}\s*(AM|PM)\s*PDT\)/gi, '')
        .replace(/\s*\(\d{1,2}:\d{2}\s*(AM|PM)\s*EDT\)/gi, '')
        .replace(/\s*EDT/gi, ` ${tzAbbr}`)
        .replace(/\s*EST/gi, ` ${tzAbbr}`)
        .replace(/\s*PDT/gi, ` ${tzAbbr}`)
        .replace(/\s*PST/gi, ` ${tzAbbr}`);
    }

    // Try standard ISO or parseable format (e.g., 2026-10-23T00:15Z)
    if (inputStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(inputStr)) {
      const parsed = Date.parse(inputStr);
      if (!isNaN(parsed)) {
        dateObj = new Date(parsed);
      }
    } else {
      // Clean parentheticals like "(10:00 AM PDT)" or "(TNF)" or "(MNF)"
      const cleaned = inputStr
        .replace(/\([^\)]*PDT[^\)]*\)/gi, '')
        .replace(/\([^\)]*EDT[^\)]*\)/gi, '')
        .replace(/\([^\)]*TNF[^\)]*\)/gi, '')
        .replace(/\([^\)]*MNF[^\)]*\)/gi, '')
        .replace(/\([^\)]*SNF[^\)]*\)/gi, '')
        .replace(/\([^\)]*\)/gi, '')
        .trim();

      const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      const dateMatch = cleaned.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);

      if (timeMatch && dateMatch) {
        const month = dateMatch[1];
        const day = dateMatch[2];
        const year = new Date().getFullYear();
        const hour = timeMatch[1];
        const min = timeMatch[2];
        const ampm = timeMatch[3];
        // Parse as Eastern Time base since NFL official schedule defaults to ET
        const etStr = `${month} ${day}, ${year} ${hour}:${min} ${ampm} EDT`;
        const p = Date.parse(etStr);
        if (!isNaN(p)) {
          dateObj = new Date(p);
        }
      } else {
        const parsed = Date.parse(inputStr);
        if (!isNaN(parsed)) {
          dateObj = new Date(parsed);
        }
      }
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateObj);
    const dayNum = dateObj.getDate();
    const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${dayName}, ${monthName} ${dayNum} · ${timeStr} ${tzAbbr}`;
  }

  // Fallback: replace EDT/EST/PDT/PST with user's detected local timezone
  return String(timeInput)
    .replace(/\s*\(\d{1,2}:\d{2}\s*(AM|PM)\s*PDT\)/gi, '')
    .replace(/\s*EDT/gi, ` ${tzAbbr}`)
    .replace(/\s*EST/gi, ` ${tzAbbr}`)
    .replace(/\s*PDT/gi, ` ${tzAbbr}`)
    .replace(/\s*PST/gi, ` ${tzAbbr}`);
}

