/**
 * NORVARDEN logo: two angled pillars with a gold path rising between them,
 * plus the wordmark. `size` is the wordmark letter height in px.
 * Colors are tuned for the dark navy site; `onLight` uses the original
 * navy/charcoal pillars for light backgrounds.
 */
interface BrandMarkProps {
  size?: number;
  className?: string;
  tagline?: boolean;
  onLight?: boolean;
  /** Show only the pillar mark. */
  markOnly?: boolean;
}

export function LogoMark({ height, onLight = false }: { height: number; onLight?: boolean }) {
  const left = onLight ? '#132032' : '#D3D8DE';
  const right = onLight ? '#3C3E41' : '#8C939C';
  return (
    <svg viewBox="0 0 100 92" height={height} width={(height * 100) / 92} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nv-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E3CFAE" />
          <stop offset="1" stopColor="#B8996A" />
        </linearGradient>
      </defs>
      {/* left pillar: top slants down toward the centre */}
      <polygon points="8,0 40,18 40,92 8,92" fill={left} />
      {/* right pillar mirrors it */}
      <polygon points="92,0 60,18 60,92 92,92" fill={right} />
      {/* the way forward */}
      <polygon points="50,60 61,92 39,92" fill="url(#nv-gold)" />
    </svg>
  );
}

export default function BrandMark({ size = 18, className, tagline = false, onLight = false, markOnly = false }: BrandMarkProps) {
  const word = onLight ? '#132032' : 'hsl(var(--hero-white))';
  if (markOnly) return <LogoMark height={size * 1.6} onLight={onLight} />;
  return (
    <span
      role="img"
      aria-label={tagline ? 'NORVARDEN — Another Way Forward' : 'NORVARDEN'}
      className={`inline-flex w-fit self-start items-center select-none ${className ?? ''}`}
      style={{ gap: `${size * 0.6}px` }}
    >
      <LogoMark height={size * (tagline ? 2.4 : 1.45)} onLight={onLight} />
      <span aria-hidden="true" className="flex flex-col" style={{ gap: `${size * 0.35}px` }}>
        <span
          style={{
            fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 600,
            fontSize: `${size}px`,
            letterSpacing: '0.32em',
            lineHeight: 1,
            color: word,
          }}
        >
          NORVARDEN
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 500,
              fontSize: `${Math.max(10, size * 0.32)}px`,
              letterSpacing: '0.34em',
              color: 'hsl(var(--hero-gold))',
              lineHeight: 1,
            }}
          >
            ANOTHER WAY FORWARD
          </span>
        )}
      </span>
    </span>
  );
}
