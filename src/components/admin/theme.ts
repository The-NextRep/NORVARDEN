/**
 * Admin palette — the same navy/gold editorial tokens the public pages use.
 * `--hero-navy-mid` is referenced by older admin pages but not defined in
 * globals.css, so every use here carries a fallback.
 */
export const adminTheme = {
  navy: 'hsl(var(--hero-navy))',
  navyMid: 'hsl(var(--hero-navy-mid, 218 52% 13%))',
  panel: 'hsl(var(--hero-panel-bg))',
  gold: 'hsl(var(--hero-gold))',
  goldDark: 'hsl(var(--hero-gold-dark))',
  white: 'hsl(var(--hero-white))',
  ice: 'hsl(var(--hero-ice))',
  ice60: 'hsl(var(--hero-ice-60))',
  ice40: 'hsl(214 60% 93% / 0.4)',
  line: 'hsl(40 60% 66% / 0.15)',
  lineStrong: 'hsl(40 60% 66% / 0.3)',
  goldWash: 'hsl(40 60% 66% / 0.1)',
  danger: 'hsl(var(--destructive))',
  dangerWash: 'hsl(var(--destructive) / 0.15)',
  success: 'hsl(152 55% 58%)',
  successWash: 'hsl(152 55% 58% / 0.12)',
  info: 'hsl(var(--hero-sky))',
  infoWash: 'hsl(214 100% 73% / 0.12)',
} as const;

export const eyebrowStyle = {
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.28em',
} as const;
