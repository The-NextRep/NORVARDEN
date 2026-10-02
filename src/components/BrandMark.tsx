/**
 * REP | IV logo: "REP" in gold, "IV" on a solid gold block, joined in one
 * gold-outlined badge. `size` is the letter height in px.
 */
interface BrandMarkProps {
  size?: number;
  className?: string;
}

const goldFace = 'linear-gradient(175deg, hsl(44 80% 82%), hsl(var(--hero-gold)) 42%, hsl(var(--hero-gold-mid)))';

export default function BrandMark({ size = 18, className }: BrandMarkProps) {
  const pad = '0.18em 0.32em 0.14em';
  return (
    <span
      role="img"
      aria-label="REP | IV"
      className={`inline-flex w-fit self-start items-stretch font-bodoni select-none ${className ?? ''}`}
      style={{
        fontSize: `${size}px`,
        fontWeight: 600,
        lineHeight: 1,
        border: `${size >= 40 ? 2 : 1.5}px solid hsl(var(--hero-gold))`,
        borderRadius: '2px',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          padding: pad,
          letterSpacing: '0.08em',
          background: goldFace,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        REP
      </span>
      <span
        aria-hidden="true"
        style={{ padding: pad, letterSpacing: '0.04em', background: goldFace, color: 'hsl(var(--hero-navy))' }}
      >
        IV
      </span>
    </span>
  );
}
