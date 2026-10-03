/**
 * Full-screen hero photos: each image fills the screen, slowly drifts and
 * zooms, then cross-fades to the next. Purely decorative (aria-hidden).
 * Pauses on the pause button (WCAG 2.2.2) and shows a still first photo for
 * people who prefer reduced motion. With no photos it renders nothing, and
 * the TechBackdrop behind it shows instead.
 */
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

// Files live in public/images/hero/. Order = slideshow order.
const HERO_PHOTOS: string[] = [
  '/images/hero/rise.jpg',
  '/images/hero/network.jpg',
  '/images/hero/chip.jpg',
  '/images/hero/signal.jpg',
  '/images/hero/globe.jpg',
  '/images/hero/city.jpg',
];

const SLIDE_MS = 7000;

export default function HeroSlideshow({ photos = HERO_PHOTOS }: { photos?: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (paused || reduced || photos.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % photos.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, reduced, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes nv-drift { from { transform: scale(1.06) translateX(1.5%) } to { transform: scale(1.16) translateX(-1.5%) } }
        .nv-slide { transition: opacity 1.6s ease-in-out; }
        .nv-slide.on .nv-slide-img { animation: nv-drift ${SLIDE_MS + 1600}ms linear forwards; }
        @media (prefers-reduced-motion: reduce) { .nv-slide { transition: none } .nv-slide.on .nv-slide-img { animation: none } }
      `}</style>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {photos.map((src, i) => (
          <div key={src} className={`nv-slide absolute inset-0 ${i === active ? 'on' : ''}`} style={{ opacity: i === active ? 1 : 0 }}>
            <img
              src={src}
              alt=""
              className="nv-slide-img absolute inset-0 w-full h-full object-cover object-[72%_center]"
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          </div>
        ))}
        {/* Navy wash + tech grid so white text always reads well */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, hsl(216 45% 8% / 0.92) 0%, hsl(216 45% 8% / 0.7) 45%, hsl(216 45% 8% / 0.35) 100%),' +
              'linear-gradient(0deg, hsl(216 45% 8% / 0.85) 0%, transparent 35%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(hsl(210 30% 80% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 80% / 0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>
      {photos.length > 1 && !reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play background slideshow' : 'Pause background slideshow'}
          className="absolute z-20 right-4 md:right-8 bottom-6 flex items-center justify-center transition-opacity hover:opacity-80"
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid hsl(var(--hero-gold) / 0.5)', background: 'hsl(var(--hero-navy) / 0.6)', color: 'hsl(var(--hero-gold))' }}
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
