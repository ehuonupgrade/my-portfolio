import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('playKeyClick', () => {
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;

  beforeEach(() => {
    vi.resetModules();
    originalAudioContext = window.AudioContext;
    originalWebkitAudioContext = (window as any).webkitAudioContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
  });

  it('should ignore errors when creating audio context', async () => {
    class MockAudioContext {
      constructor() {
        throw new Error('Audio policy error');
      }
    }

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = undefined;

    const { playKeyClick, setAudioEnabled } = await import('../audio');
    setAudioEnabled(true);
    expect(() => playKeyClick()).not.toThrow();
  });

  it('should ignore errors during oscillator creation/manipulation', async () => {
    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() {
        throw new Error('Some oscillator error');
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
      resume() {
        return Promise.resolve();
      }
    }

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = undefined;

    const { playKeyClick, setAudioEnabled } = await import('../audio');
    setAudioEnabled(true);
    expect(() => playKeyClick()).not.toThrow();
  });

  it('should handle missing AudioContext gracefully', async () => {
    window.AudioContext = undefined as any;
    (window as any).webkitAudioContext = undefined;

    const { playKeyClick, setAudioEnabled } = await import('../audio');
    setAudioEnabled(true);
    expect(() => playKeyClick()).not.toThrow();
  });

  it('should not play sound if audio is disabled', async () => {
    class MockAudioContext {
      constructor() {
        throw new Error('Should not be called');
      }
    }
    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = undefined;

    const { playKeyClick, setAudioEnabled } = await import('../audio');
    setAudioEnabled(false);
    expect(() => playKeyClick()).not.toThrow();
  });
});
