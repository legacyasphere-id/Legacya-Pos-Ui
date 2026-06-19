import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import TourTooltip from './TourTooltip';

export const TOUR_STORAGE_KEY = 'legacya_pos_tour_completed';

export interface TourStep {
  id: string;
  message: string;
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'sidebar-nav', message: "Welcome to Legacya POS. Here's your navigation." },
  { id: 'dashboard-stats', message: 'Your store at a glance — sales, inventory, transactions.' },
  { id: 'products-nav', message: 'Start here: add your product categories and products.' },
  { id: 'inventory-nav', message: 'Set stock levels and track every movement.' },
  { id: 'cashier-nav', message: 'Run transactions from the Cashier screen.' },
  { id: 'settings-nav', message: 'Configure your store name, tax rate, and receipt.' },
];

export interface TourContextValue {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  steps: TourStep[];
  anchors: React.MutableRefObject<Map<string, HTMLElement>>;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
  startTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTourContext must be used within TourProvider');
  return ctx;
}

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile) as { role?: string } | null;
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const anchors = useRef<Map<string, HTMLElement>>(new Map());
  const autoStarted = useRef(false);

  const isOwner = profile?.role === 'owner';

  // Auto-start on first visit for owners only
  useEffect(() => {
    if (!profile) return;
    if (!isOwner) return;
    if (autoStarted.current) return;
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    autoStarted.current = true;
    // Delay to let sidebar nav items mount and register anchors
    const timer = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(timer);
  }, [profile, isOwner]);

  const registerAnchor = useCallback((id: string, el: HTMLElement | null) => {
    if (el) anchors.current.set(id, el);
    else anchors.current.delete(id);
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => s + 1);
  }, []);

  const previous = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => finish(), [finish]);
  const complete = useCallback(() => finish(), [finish]);

  const startTour = useCallback(() => {
    if (!isOwner) return;
    setCurrentStep(0);
    setActive(true);
  }, [isOwner]);

  const value: TourContextValue = {
    active,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    steps: TOUR_STEPS,
    anchors,
    registerAnchor,
    next,
    previous,
    skip,
    complete,
    startTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && <TourTooltip />}
    </TourContext.Provider>
  );
}
