import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTourContext } from './TourProvider';

const TOOLTIP_W = 300;
const TOOLTIP_GAP = 16;
const SPOTLIGHT_PAD = 8;
const SCREEN_PAD = 12;

interface TooltipPos {
  top: number;
  left: number;
}

function calcPos(anchor: DOMRect, tooltipHeight: number): TooltipPos {
  const vW = window.innerWidth;
  const vH = window.innerHeight;

  // Prefer right
  if (anchor.right + TOOLTIP_GAP + TOOLTIP_W <= vW - SCREEN_PAD) {
    return {
      left: anchor.right + TOOLTIP_GAP,
      top: Math.max(SCREEN_PAD, Math.min(anchor.top, vH - tooltipHeight - SCREEN_PAD)),
    };
  }
  // Try left
  if (anchor.left - TOOLTIP_GAP - TOOLTIP_W >= SCREEN_PAD) {
    return {
      left: anchor.left - TOOLTIP_GAP - TOOLTIP_W,
      top: Math.max(SCREEN_PAD, Math.min(anchor.top, vH - tooltipHeight - SCREEN_PAD)),
    };
  }
  // Fall back to bottom-centered
  return {
    left: Math.max(
      SCREEN_PAD,
      Math.min(anchor.left + anchor.width / 2 - TOOLTIP_W / 2, vW - TOOLTIP_W - SCREEN_PAD),
    ),
    top: Math.min(anchor.bottom + TOOLTIP_GAP, vH - tooltipHeight - SCREEN_PAD),
  };
}

// ---------------------------------------------------------------------------
// Step card
// ---------------------------------------------------------------------------

interface StepCardProps {
  message: string;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function StepCard({
  message,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
}: StepCardProps) {
  return (
    <div
      className="rounded-[12px] p-5"
      style={{
        background: '#1a1a1a',
        color: '#ffffff',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        width: TOOLTIP_W,
      }}
    >
      {/* Progress dots + skip */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 items-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-200"
              style={{
                width: i === stepIndex ? 20 : 6,
                background: i === stepIndex ? '#6366F1' : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="text-[11px] font-medium leading-none px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          aria-label="Skip tour"
        >
          Skip
        </button>
      </div>

      {/* Message */}
      <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.88)' }}>
        {message}
      </p>

      {/* Step counter */}
      <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {stepIndex + 1} / {totalSteps}
      </p>

      {/* Nav buttons */}
      <div className="flex items-center gap-2">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            aria-label="Previous step"
          >
            <ChevronLeft size={14} />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 h-8 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center justify-center gap-1 text-white"
          style={{ background: '#6366F1' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#5558E8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
          aria-label={isLast ? 'Finish tour' : 'Next step'}
        >
          {isLast ? 'Finish' : 'Next'}
          {!isLast && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion card
// ---------------------------------------------------------------------------

function CompletionCard({ onComplete }: { onComplete: () => void }) {
  return (
    <div
      className="rounded-[12px] p-6"
      style={{
        background: '#1a1a1a',
        color: '#ffffff',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        width: TOOLTIP_W,
        textAlign: 'center',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(99,102,241,0.15)' }}
      >
        <CheckCircle2 size={24} style={{ color: '#6366F1' }} />
      </div>
      <h3
        className="text-[17px] font-bold mb-2"
        style={{ color: '#ffffff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        You&apos;re all set!
      </h3>
      <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
        Your store is ready. Start by creating products and setting inventory.
      </p>
      <button
        onClick={onComplete}
        className="w-full h-10 rounded-lg text-[13px] font-semibold text-white transition-colors"
        style={{ background: '#6366F1' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#5558E8')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
        aria-label="Start using Legacya POS"
      >
        Start Using Legacya POS
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tooltip
// ---------------------------------------------------------------------------

export default function TourTooltip() {
  const { currentStep, totalSteps, steps, anchors, next, previous, skip, complete } =
    useTourContext();

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isCompletion = currentStep >= totalSteps;
  const isLast = currentStep === totalSteps - 1;

  // Update anchor rect on step change and window resize
  useEffect(() => {
    if (isCompletion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnchorRect(null);
      setPos(null);
      return;
    }
    const step = steps[currentStep];
    const update = () => {
      const el = anchors.current.get(step.id);
      setAnchorRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [currentStep, steps, anchors, isCompletion]);

  // Recalculate position when anchor rect changes
  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;
    const h = tooltipRef.current.offsetHeight || 160;
    setPos(calcPos(anchorRect, h));
  }, [anchorRect]);

  // Fade-in animation trigger (also resets on step change)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [currentStep]);

  // Keyboard: ESC = skip, Enter = next/complete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skip();
        return;
      }
      if (e.key === 'Enter') {
        if (isCompletion) complete();
        else next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [skip, next, complete, isCompletion]);

  // Focus trap within tooltip
  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [currentStep, isCompletion]);

  const spotlight = anchorRect
    ? {
        left: anchorRect.left - SPOTLIGHT_PAD,
        top: anchorRect.top - SPOTLIGHT_PAD,
        width: anchorRect.width + SPOTLIGHT_PAD * 2,
        height: anchorRect.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  return (
    <>
      {/* ── Click blocker (blocks all background interaction) ── */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 1000 }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-hidden="true"
      />

      {/* ── Spotlight (box-shadow creates both ring and backdrop) ── */}
      {!isCompletion && spotlight ? (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 1001,
            borderRadius: '12px',
            left: spotlight.left,
            top: spotlight.top,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: [
              '0 0 0 2px rgba(99,102,241,0.85)',
              '0 0 0 5px rgba(99,102,241,0.18)',
              '0 0 0 9999px rgba(0,0,0,0.60)',
            ].join(', '),
            transition: 'left 200ms ease, top 200ms ease, width 200ms ease, height 200ms ease',
          }}
          aria-hidden="true"
        />
      ) : (
        // Full-screen dim for completion / missing anchor
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1001, background: 'rgba(0,0,0,0.60)' }}
          aria-hidden="true"
        />
      )}

      {/* ── Tooltip ── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          isCompletion ? 'Tour complete' : `Tour step ${currentStep + 1} of ${totalSteps}`
        }
        style={{
          position: 'fixed',
          zIndex: 1002,
          transition: 'opacity 200ms ease, transform 200ms ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          ...(isCompletion
            ? {
                top: '50%',
                left: '50%',
                transform: visible ? 'translate(-50%,-50%)' : 'translate(-50%,-44%)',
              }
            : pos
              ? { top: pos.top, left: pos.left }
              : { pointerEvents: 'none', opacity: 0 }),
        }}
      >
        {isCompletion ? (
          <CompletionCard onComplete={complete} />
        ) : (
          <StepCard
            key={currentStep}
            message={steps[currentStep]?.message ?? ''}
            stepIndex={currentStep}
            totalSteps={totalSteps}
            isFirst={currentStep === 0}
            isLast={isLast}
            onNext={next}
            onPrev={previous}
            onSkip={skip}
          />
        )}
      </div>
    </>
  );
}
