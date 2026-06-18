/**
 * Tour system unit tests — covers TourProvider state logic and useTour hook.
 * Uses @testing-library/react to render in a JSDOM environment.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import TourProvider, { TOUR_STORAGE_KEY, TOUR_STEPS, useTourContext } from '../TourProvider';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../store/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: { profile: { role: string } | null }) => unknown) =>
    selector({ profile: { role: 'owner' } }),
  ),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(TourProvider, null, children);
}

// ---------------------------------------------------------------------------
// TOUR_STEPS constant
// ---------------------------------------------------------------------------

describe('TOUR_STEPS', () => {
  it('has 6 steps', () => {
    expect(TOUR_STEPS).toHaveLength(6);
  });

  it('starts with sidebar-nav', () => {
    expect(TOUR_STEPS[0].id).toBe('sidebar-nav');
  });

  it('ends with settings-nav', () => {
    expect(TOUR_STEPS[5].id).toBe('settings-nav');
  });

  it('includes all required anchor ids', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(ids).toContain('dashboard-stats');
    expect(ids).toContain('products-nav');
    expect(ids).toContain('inventory-nav');
    expect(ids).toContain('cashier-nav');
  });
});

// ---------------------------------------------------------------------------
// TourProvider state
// ---------------------------------------------------------------------------

describe('TourProvider — initial state', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts inactive', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    expect(result.current.active).toBe(false);
  });

  it('exposes correct totalSteps', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    expect(result.current.totalSteps).toBe(TOUR_STEPS.length);
  });

  it('starts at step 0', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    expect(result.current.currentStep).toBe(0);
  });
});

describe('TourProvider — step navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('startTour activates the tour for owners', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    expect(result.current.active).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('next() increments step', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it('previous() decrements step and does not go below 0', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.previous();
    });
    expect(result.current.currentStep).toBe(0);
    act(() => {
      result.current.previous();
    });
    expect(result.current.currentStep).toBe(0);
  });

  it('next() past last step shows completion (currentStep >= totalSteps)', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      act(() => {
        result.current.next();
      });
    }
    expect(result.current.currentStep).toBeGreaterThanOrEqual(TOUR_STEPS.length);
  });
});

describe('TourProvider — persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('skip() writes storage key and deactivates tour', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    act(() => {
      result.current.skip();
    });
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');
    expect(result.current.active).toBe(false);
  });

  it('complete() writes storage key and deactivates tour', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    act(() => {
      result.current.complete();
    });
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');
    expect(result.current.active).toBe(false);
  });

  it('resets step to 0 after completion', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.complete();
    });
    expect(result.current.currentStep).toBe(0);
  });
});

describe('TourProvider — anchor registration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('registerAnchor stores an element', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    const el = document.createElement('div');
    act(() => {
      result.current.registerAnchor('sidebar-nav', el);
    });
    expect(result.current.anchors.current.get('sidebar-nav')).toBe(el);
  });

  it('registerAnchor removes element when called with null', () => {
    const { result } = renderHook(() => useTourContext(), { wrapper });
    const el = document.createElement('div');
    act(() => {
      result.current.registerAnchor('sidebar-nav', el);
    });
    act(() => {
      result.current.registerAnchor('sidebar-nav', null);
    });
    expect(result.current.anchors.current.has('sidebar-nav')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Non-owner guard
// ---------------------------------------------------------------------------

describe('TourProvider — non-owner guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('startTour is a no-op for non-owners', async () => {
    const { useAuthStore } = await import('../../../store/auth.store');
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { profile: { role: string } | null }) => unknown) =>
        selector({ profile: { role: 'staff' } }),
    );

    const { result } = renderHook(() => useTourContext(), { wrapper });
    act(() => {
      result.current.startTour();
    });
    expect(result.current.active).toBe(false);
  });
});
