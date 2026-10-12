/**
 * Global Multi-User Traffic & Project Attention Tracker
 * Communicates with the backend server (/api/traffic) so that views, dwell time,
 * and visits from ALL users and devices across the web are aggregated into one shared total.
 */

export interface ProjectTrafficMetrics {
  id: string;
  name: string;
  category: string;
  path: string;
  viewCount: number;
  totalDwellSeconds: number;
  lastVisitedAt: string | null;
  mobileViews: number;
  desktopViews: number;
}

export interface SiteTrafficSummary {
  totalPageViews: number;
  totalSessions: number;
  firstTrackedAt: string;
  lastActiveAt: string;
  projects: Record<string, ProjectTrafficMetrics>;
  pageViewsByRoute: Record<string, number>;
}

const SESSION_FLAG_KEY = 'global_traffic_session_recorded';

export async function fetchGlobalTrafficSummary(): Promise<SiteTrafficSummary> {
  const fallback: SiteTrafficSummary = {
    totalPageViews: 0,
    totalSessions: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    projects: {},
    pageViewsByRoute: {},
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const res = await fetch('/api/traffic').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Graceful offline fallback
  }

  return fallback;
}

export async function recordPageView(route: string, projectId: string | null = null): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const isMobile = window.innerWidth < 768;
    const isNewSession = !sessionStorage.getItem(SESSION_FLAG_KEY);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
    }

    const res = await fetch('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        projectId,
        isMobile,
        isNewSession,
      }),
    }).catch(() => null);

    if (res && res.ok) {
      window.dispatchEvent(new Event('site_traffic_updated'));
    }
  } catch {
    // Non-blocking telemetry
  }
}

export async function recordDwellTime(projectId: string, seconds: number): Promise<void> {
  if (typeof window === 'undefined' || seconds <= 1) return;

  try {
    const res = await fetch('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        dwellSeconds: Math.round(seconds),
      }),
    }).catch(() => null);

    if (res && res.ok) {
      window.dispatchEvent(new Event('site_traffic_updated'));
    }
  } catch {
    // Non-blocking telemetry
  }
}

export async function resetTrafficData(): Promise<void> {
  try {
    await fetch('/api/traffic/reset', { method: 'POST' }).catch(() => null);
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    window.dispatchEvent(new Event('site_traffic_updated'));
  } catch {
    // Non-blocking telemetry
  }
}
