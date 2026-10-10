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
  try {
    const res = await fetch('/api/traffic');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to fetch global traffic data from server', err);
  }

  return {
    totalPageViews: 0,
    totalSessions: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    projects: {},
    pageViewsByRoute: {},
  };
}

export async function recordPageView(route: string, projectId: string | null = null): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const isMobile = window.innerWidth < 768;
    const isNewSession = !sessionStorage.getItem(SESSION_FLAG_KEY);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
    }

    await fetch('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        projectId,
        isMobile,
        isNewSession,
      }),
    });

    window.dispatchEvent(new Event('site_traffic_updated'));
  } catch (err) {
    console.error('Failed to record global page view', err);
  }
}

export async function recordDwellTime(projectId: string, seconds: number): Promise<void> {
  if (typeof window === 'undefined' || seconds <= 1) return;

  try {
    await fetch('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        dwellSeconds: Math.round(seconds),
      }),
    });

    window.dispatchEvent(new Event('site_traffic_updated'));
  } catch (err) {
    console.error('Failed to record dwell time', err);
  }
}

export async function resetTrafficData(): Promise<void> {
  try {
    await fetch('/api/traffic/reset', { method: 'POST' });
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    window.dispatchEvent(new Event('site_traffic_updated'));
  } catch (err) {
    console.error('Failed to reset global traffic data', err);
  }
}
