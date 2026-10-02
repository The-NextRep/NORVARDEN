/**
 * Two scrolling ticker rows along the bottom of the hero: big outlined
 * statements drifting left, and in-demand roles drifting right. Decorative
 * (the same words are given once to screen readers), with a pause button
 * (WCAG 2.2.2) and no motion at all for people who prefer reduced motion.
 */
import { Pause, Play } from 'lucide-react';

const STATEMENTS = ['Talent has no limits', 'Another way forward', 'Built for every mind', 'Accessible by design', 'Your skills lead'];
const ROLES = [
  'Software engineer', 'Data analyst', 'UX designer', 'Cybersecurity', 'Accessibility specialist', 'Product manager',
  'Cloud engineer', 'QA tester', 'AI trainer', 'Customer success', 'Technical writer', 'IT support',
];

function Row({ items, sep, reverse, seconds, big, paused }: {
  items: string[]; sep: string; reverse?: boolean; seconds: number; big?: boolean; paused: boolean;
}) {
  // Two identical copies side by side; the track slides by exactly one copy.
  const copy = (k: string) => (
    <div key={k} className="flex shrink-0 items-center">
      {items.map((t) => (
        <span key={t} className="flex items-center whitespace-nowrap">
          <span className={big ? 'nv-mq-big' : 'nv-mq-small'}>{t}</span>
          <span className="nv-mq-sep">{sep}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="nv-mq-mask overflow-hidden">
      <div
        className={`nv-mq-track flex w-max ${reverse ? 'nv-mq-rev' : ''}`}
        style={{ animationDuration: `${seconds}s`, animationPlayState: paused ? 'paused' : 'running' }}
      >
        {copy('a')}
        {copy('b')}
      </div>
    </div>
  );
}

export default function HeroMarquee({ paused, onTogglePause }: { paused: boolean; onTogglePause: () => void }) {
  return (
    <div className="relative z-10 w-full">
      <style>{`
        @keyframes nv-mq { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .nv-mq-track { animation: nv-mq linear infinite; }
        .nv-mq-rev { animation-direction: reverse; }
        .nv-mq-mask {
          mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
        }
        .nv-mq-big {
          font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif; font-weight: 700;
          font-size: clamp(2rem, 4.6vw, 3.9rem); letter-spacing: -0.01em; text-transform: uppercase; line-height: 1.15;
          color: transparent; -webkit-text-stroke: 1px hsl(var(--hero-gold) / 0.7);
        }
        .nv-mq-small {
          font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: hsl(var(--hero-ice) / 0.75);
        }
        .nv-mq-sep { margin: 0 1.6rem; color: hsl(var(--hero-gold)); font-size: 1rem; }
        @media (prefers-reduced-motion: reduce) { .nv-mq-track { animation: none; } }
      `}</style>

      <p className="sr-only">{STATEMENTS.join('. ')}. Roles on NORVARDEN include {ROLES.join(', ')}.</p>

      <div aria-hidden="true" className="flex flex-col gap-3">
        <Row items={STATEMENTS} sep="✦" seconds={60} big paused={paused} />
        <div style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.18)', borderBottom: '1px solid hsl(var(--hero-gold) / 0.18)', background: 'hsl(var(--hero-navy) / 0.55)' }} className="py-3">
          <Row items={ROLES} sep="//" reverse seconds={45} paused={paused} />
        </div>
      </div>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={paused ? 'Play moving text' : 'Pause moving text'}
        className="absolute right-4 md:right-8 -top-10 flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid hsl(var(--hero-gold) / 0.45)', background: 'hsl(var(--hero-navy) / 0.6)', color: 'hsl(var(--hero-gold))' }}
      >
        {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
      </button>
    </div>
  );
}
