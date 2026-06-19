import { useTourContext } from '../components/tour/TourProvider';

export interface TourControls {
  /** Whether the tour overlay is currently active */
  active: boolean;
  /** 0-based index of the current step */
  currentStep: number;
  /** Total number of tour steps (not counting the completion screen) */
  totalSteps: number;
  /** Register a DOM element as an anchor for a given step id */
  registerAnchor: (id: string, el: HTMLElement | null) => void;
  /** Advance to the next step (or completion screen after the last step) */
  next: () => void;
  /** Go back to the previous step */
  previous: () => void;
  /** Skip the tour — writes completion key to localStorage, never auto-triggers again */
  skip: () => void;
  /** Complete the tour — writes completion key to localStorage, closes tour */
  complete: () => void;
  /** Manually start the tour (owner role only; no-op for other roles) */
  startTour: () => void;
}

/**
 * Access the onboarding tour controls from any component inside TourProvider.
 *
 * Components use `registerAnchor` to tell the tour where to position each step:
 *   const { registerAnchor } = useTour();
 *   <div ref={(el) => registerAnchor('products-nav', el)} />
 */
export function useTour(): TourControls {
  const ctx = useTourContext();
  return {
    active: ctx.active,
    currentStep: ctx.currentStep,
    totalSteps: ctx.totalSteps,
    registerAnchor: ctx.registerAnchor,
    next: ctx.next,
    previous: ctx.previous,
    skip: ctx.skip,
    complete: ctx.complete,
    startTour: ctx.startTour,
  };
}
