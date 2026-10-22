import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordDwellTime } from './trafficTracker';

describe('recordDwellTime', () => {
  let originalFetch: typeof global.fetch;
  let originalWindow: typeof global.window;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalWindow = global.window;

    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    // Mock window to bypass the typeof window === 'undefined' check
    (global as any).window = {
      dispatchEvent: vi.fn(),
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (global as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  it('should return early if window is undefined', async () => {
    (global as any).window = undefined;
    await recordDwellTime('proj1', 5);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return early if seconds is 1 or less', async () => {
    await recordDwellTime('proj1', 1);
    await recordDwellTime('proj1', 0);
    await recordDwellTime('proj1', -5);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should round the seconds and send them in the fetch payload when seconds > 1', async () => {
    await recordDwellTime('proj1', 1.4);
    expect(global.fetch).toHaveBeenCalledWith('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'proj1',
        dwellSeconds: 1, // Math.round(1.4)
      }),
    });

    await recordDwellTime('proj2', 1.5);
    expect(global.fetch).toHaveBeenCalledWith('/api/traffic/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'proj2',
        dwellSeconds: 2, // Math.round(1.5)
      }),
    });
  });

  it('should dispatch site_traffic_updated event on successful fetch', async () => {
    const dispatchEventMock = vi.fn();
    (global as any).window = { dispatchEvent: dispatchEventMock };
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await recordDwellTime('proj3', 5);

    expect(global.fetch).toHaveBeenCalled();
    // It's hard to assert the exact Event instance, but we can check if it was called
    expect(dispatchEventMock).toHaveBeenCalled();
  });
});
