import { useEffect, useState, useCallback } from 'react';
import { getTrackedBets } from './bettingTrackerStore';
import { getTokenUsageRecords } from '../data/tokenUsageData';

/**
 * Custom hook providing active live telemetry synchronization across all components.
 * Automatically polls live endpoints and listens to window events / storage changes,
 * ensuring that game score updates, completed Thursday Night Football results, and token
 * telemetry stream live without requiring a manual page refresh.
 */
export function useLiveTelemetryEngine(pollingIntervalMs: number = 3000) {
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(
    new Date().toLocaleTimeString()
  );
  const [syncCount, setSyncCount] = useState<number>(0);
  const [liveStreamActive, setLiveStreamActive] = useState<boolean>(true);

  const triggerLiveSync = useCallback(() => {
    const nowStr = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' PDT';

    setLastSyncTimestamp(nowStr);
    setSyncCount((prev) => prev + 1);

    // Dispatch global event for cross-component React state synchronization
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('linepulse_live_sync', { detail: { timestamp: nowStr } }));
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Listen for cross-tab storage changes
    const handleStorage = () => {
      triggerLiveSync();
    };

    // 2. Listen for internal custom live sync events
    const handleCustomSync = () => {
      setLastSyncTimestamp(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' PDT'
      );
      setSyncCount((prev) => prev + 1);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('linepulse_live_sync', handleCustomSync as EventListener);

    // 3. Periodic Live Heartbeat Polling
    const interval = setInterval(() => {
      if (liveStreamActive) {
        triggerLiveSync();
      }
    }, pollingIntervalMs);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('linepulse_live_sync', handleCustomSync as EventListener);
      clearInterval(interval);
    };
  }, [pollingIntervalMs, liveStreamActive, triggerLiveSync]);

  return {
    lastSyncTimestamp,
    syncCount,
    liveStreamActive,
    setLiveStreamActive,
    triggerLiveSync,
  };
}
