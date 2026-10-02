/**
 * /resources — Career tools for members, open to everyone to browse.
 * Links to the résumé builder, interview tips and saved jobs.
 */
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { FileText, GraduationCap, Bookmark, ShieldCheck, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';

const siteUrl = 'https://jobs.the-nextrep.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

const TOOLS = [
  {
    href: '/resume-builder',
    icon: FileText,
    title: 'Résumé builder',
    body: 'Turn your playing, coaching or service record into a résumé hiring managers understand. Fill in guided sections and download it.',
    membersOnly: true,
  },
  {
    href: '/interview-tips',
    icon: GraduationCap,
    title: 'Interview tips',
    body: 'How to tell your story, answer the common questions with the STAR method, and walk in prepared with a day-of checklist.',
    membersOnly: false,
  },
  {
    href: '/saved-jobs',
    icon: Bookmark,
    title: 'Saved jobs',
    body: 'Keep the roles you like in one place and come back to them any time.',
    membersOnly: true,
  },
  {
    href: '/trust',
    icon: ShieldCheck,
    title: 'How we verify companies',
    body: 'Every employer is checked before they can post or contact you. See what we review and how to spot a scam.',
    membersOnly: false,
  },
];

export default function ResourcesPage() {
  const { user } = useCurrentUser();
  const signedIn = !!user;

  return (
    <>
      <Helmet>
        <title>Career Resources — REP | IV</title>
        <meta name="description" content="Free career tools for pro athletes, coaches and veterans: résumé builder, interview tips, saved jobs and how we verify employers." />
        <link rel="canonical" href={`${siteUrl}/resources`} />
        <meta property="og:title" content="Career Resources — REP | IV" />
        <meta property="og:url" content={`${siteUrl}/resources`} />
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-5xl mx-auto">
          <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
            Resources
          </p>
          <h1 className="font-bodoni mb-4" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 400, lineHeight: 1.08, color: white }}>
            Tools for your <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>next rep.</em>
          </h1>
          <p className="font-barlow mb-12 max-w-xl" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
            Free for athletes, coaches and veterans. Get your résumé ready, prepare for interviews, and keep track of the roles you want.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLS.map(({ href, icon: Icon, title, body, membersOnly }) => (
              <Link
                key={href}
                to={href}
                className="group flex flex-col gap-3 p-6 rounded-sm transition-colors"
                style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.16)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon size={22} style={{ color: gold }} aria-hidden="true" />
                  {membersOnly && !signedIn && (
                    <span className="font-barlow-condensed uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: ice60 }}>
                      Free account
                    </span>
                  )}
                </div>
                <h2 className="font-bodoni" style={{ fontSize: '24px', fontWeight: 400, color: white, lineHeight: 1.2 }}>{title}</h2>
                <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>{body}</p>
                <span className="inline-flex items-center gap-1 mt-auto font-barlow-condensed uppercase transition-opacity group-hover:opacity-80" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
                  Open <ChevronRight size={12} />
                </span>
              </Link>
            ))}
          </div>

          {!signedIn && (
            <p className="font-barlow mt-10" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
              The résumé builder and saved jobs need a free member account.{' '}
              <Link to="/signup" style={{ color: gold }}>Join free</Link>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
