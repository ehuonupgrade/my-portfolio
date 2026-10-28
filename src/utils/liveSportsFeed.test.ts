import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveNewsWithFallback } from './liveSportsFeed';

describe('fetchLiveNewsWithFallback', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should use primary endpoint when successful', async () => {
    const mockArticles = [{ id: '1', headline: 'Test Article Primary' }];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/edgedetect/live/news') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            source: 'Primary API',
            articles: mockArticles,
            lastSyncedAt: '2023-10-27T00:00:00.000Z'
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL: ' + url));
    });

    const result = await fetchLiveNewsWithFallback();

    expect(global.fetch).toHaveBeenCalledWith('/api/edgedetect/live/news');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      success: true,
      source: 'Primary API',
      articles: mockArticles,
      lastSyncedAt: '2023-10-27T00:00:00.000Z'
    });
  });

  it('should fall back to secondary endpoint if primary endpoint fetch fails', async () => {
    const mockArticles = [{ id: '1', headline: 'Test Article Secondary' }];

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/edgedetect/live/news') {
        return Promise.reject(new Error('Network error on primary'));
      }
      if (url === '/api/linepulse/live/news') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            source: 'Secondary API',
            articles: mockArticles,
            lastSyncedAt: '2023-10-27T00:00:00.000Z'
          })
        });
      }
      return Promise.reject(new Error('Unexpected URL: ' + url));
    });

    const result = await fetchLiveNewsWithFallback();

    expect(global.fetch).toHaveBeenCalledWith('/api/edgedetect/live/news');
    expect(global.fetch).toHaveBeenCalledWith('/api/linepulse/live/news');

    expect(result).toEqual({
      success: true,
      source: 'Secondary API',
      articles: mockArticles,
      lastSyncedAt: '2023-10-27T00:00:00.000Z'
    });
  });
});
