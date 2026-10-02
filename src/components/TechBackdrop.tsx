/**
 * Hero backdrop: a fine blueprint grid fading into navy, the logo's two
 * pillars drawn large on the right, and a gold "way forward" beam rising
 * between them. Purely decorative (aria-hidden); the beam's slow pulse stops
 * for people who prefer reduced motion.
 */
export default function TechBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes nv-beam { 0%, 100% { opacity: .55 } 50% { opacity: .9 } }
        @keyframes nv-scan { from { transform: translateY(-100%) } to { transform: translateY(100%) } }
        .nv-beam { animation: nv-beam 6s ease-in-out infinite; }
        .nv-scan { animation: nv-scan 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .nv-beam, .nv-scan { animation: none; } }
      `}</style>

      {/* base: deep navy with a soft glow behind the pillars */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 60% at 72% 55%, hsl(36 40% 66% / 0.16), transparent 70%),' +
            'radial-gradient(ellipse 70% 80% at 20% 0%, hsl(212 50% 22% / 0.55), transparent 70%),' +
            'linear-gradient(180deg, hsl(216 45% 10%) 0%, hsl(216 48% 7%) 100%)',
        }}
      />

      {/* blueprint grid, faded toward the edges */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(hsl(210 30% 80% / 0.07) 1px, transparent 1px),' +
            'linear-gradient(90deg, hsl(210 30% 80% / 0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 60% 45%, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 60% 45%, black 30%, transparent 85%)',
        }}
      />

      {/* slow horizontal scan line */}
      <div className="absolute inset-x-0 top-0 h-full nv-scan" style={{ opacity: 0.5 }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, hsl(36 40% 66% / 0.45), transparent)' }} />
      </div>

      {/* oversized pillars + beam, right side (hidden on small screens behind the text) */}
      <svg
        className="absolute hidden md:block"
        style={{ right: '-2%', bottom: '-6%', height: '92%', opacity: 0.9 }}
        viewBox="0 0 100 92"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="nv-pillar-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(212 35% 30%)" stopOpacity="0.85" />
            <stop offset="1" stopColor="hsl(214 40% 16%)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="nv-pillar-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(214 12% 34%)" stopOpacity="0.8" />
            <stop offset="1" stopColor="hsl(214 20% 16%)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="nv-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#E3CFAE" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#C6AC86" stopOpacity="0.35" />
            <stop offset="1" stopColor="#C6AC86" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="8,0 40,18 40,92 8,92" fill="url(#nv-pillar-l)" stroke="hsl(210 30% 80% / 0.18)" strokeWidth="0.3" />
        <polygon points="92,0 60,18 60,92 92,92" fill="url(#nv-pillar-r)" stroke="hsl(210 30% 80% / 0.14)" strokeWidth="0.3" />
        {/* light rising up the gap between the pillars */}
        <polygon className="nv-beam" points="47,0 53,0 61,92 39,92" fill="url(#nv-beam)" opacity="0.6" />
        <polygon points="50,60 61,92 39,92" fill="#C6AC86" />
      </svg>

      {/* readability: darken behind the text column */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, hsl(216 45% 10% / 0.92) 0%, hsl(216 45% 10% / 0.6) 45%, transparent 75%)' }}
      />
    </div>
  );
}
