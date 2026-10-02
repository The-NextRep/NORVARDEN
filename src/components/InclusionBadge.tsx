import { Link } from 'react-router';
import { HeartHandshake } from 'lucide-react';
import { isInclusionCertified } from '@/lib/inclusion-course';

/**
 * "Inclusion Certified" — shown for 12 months after someone at the company
 * passes the NORVARDEN inclusion course. Renders nothing otherwise.
 */
export function InclusionBadge({ certifiedAt, size = 'sm', asLink = true }: {
  certifiedAt: string | null | undefined;
  size?: 'sm' | 'md';
  /** false inside clickable cards, where a nested link isn't allowed */
  asLink?: boolean;
}) {
  if (!isInclusionCertified(certifiedAt)) return null;
  const props = {
    className: 'inline-flex items-center gap-1 font-barlow-condensed uppercase hover:underline underline-offset-4',
    style: { fontSize: size === 'md' ? '12px' : '11px', fontWeight: 600, letterSpacing: '0.18em', color: 'hsl(var(--hero-gold))' },
    title: "Inclusion Certified: this employer's team completed NORVARDEN's disability inclusion course",
  };
  const inner = (
    <>
      <HeartHandshake size={size === 'md' ? 13 : 11} strokeWidth={2.25} aria-hidden="true" />
      <span>Inclusion Certified</span>
    </>
  );
  return asLink ? <Link to="/inclusion-course" {...props}>{inner}</Link> : <span {...props}>{inner}</span>;
}
