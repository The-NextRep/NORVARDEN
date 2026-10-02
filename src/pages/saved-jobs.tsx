import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Bookmark, BookmarkX, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';

const navy   = 'hsl(var(--hero-navy))';
const gold   = 'hsl(var(--hero-gold))';
const white  = 'hsl(var(--hero-white))';
const ice    = 'hsl(var(--hero-ice))';
const faded  = 'hsl(var(--hero-ice) / 0.75)';
const line   = '1px solid hsl(var(--hero-gold) / 0.28)';

interface SavedJob {
  id: number;
  title: string;
  companyName: string;
  location: string | null;
  isRemote: boolean | null;
  jobType: string;
  payRangeMin: number | null;
  payRangeMax: number | null;
  applicationDeadline: string | null;
  savedAt: string | null;
  available: boolean;
}

const JOB_TYPES: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship', skillbridge: 'SkillBridge',
};

function pay(min: number | null, max: number | null) {
  const f = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `From ${f(min)}`;
  if (max) return `Up to ${f(max)}`;
  return null;
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}

export default function SavedJobsPage() {
  const { user, isPending } = useCurrentUser();
  const [jobs, setJobs] = useState<SavedJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmployer = user?.memberType === 'employer';

  useEffect(() => {
    if (!user || isEmployer) return;
    fetch('/api/saved-jobs', { credentials: 'include' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({})) as { jobs?: SavedJob[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? 'Could not load saved roles.');
        setJobs(d.jobs ?? []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load saved roles.'));
  }, [user, isEmployer]);

  async function remove(id: number) {
    const before = jobs;
    setJobs((j) => (j ?? []).filter((x) => x.id !== id));
    const r = await fetch(`/api/saved-jobs/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => null);
    if (!r || !r.ok) { setJobs(before); setError('Could not remove that role. Please try again.'); }
  }

  const signedOut = !user && !isPending && jobs === null;

  return (
    <>
      <Helmet>
        <title>Saved Jobs — REP | IV</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main style={{ background: navy, color: white, minHeight: '70vh' }}>
        <section className="px-5 md:px-12 pt-20 pb-10 mx-auto" style={{ maxWidth: '1000px' }}>
          <p className="font-barlow-condensed uppercase mb-4" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.34em', color: gold }}>
            Your shortlist
          </p>
          <h1 className="font-bodoni mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 400, lineHeight: 1.05 }}>
            Saved jobs
          </h1>
          <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.7, color: faded, maxWidth: '60ch' }}>
            Roles you&rsquo;ve bookmarked on the board. Open one to see the full details.
          </p>
        </section>

        <section className="px-5 md:px-12 pb-24 mx-auto" style={{ maxWidth: '1000px' }}>
          {error && <p role="alert" className="font-barlow mb-6" style={{ fontSize: '15px', color: 'hsl(0 85% 75%)' }}>{error}</p>}

          {signedOut && (
            <p className="font-barlow" style={{ fontSize: '16px', color: faded }}>
              Please <Link to="/login?next=/saved-jobs" style={{ color: gold }}>sign in</Link> to see your saved roles.
            </p>
          )}

          {isEmployer && (
            <p className="font-barlow" style={{ fontSize: '16px', color: faded }}>
              Saved jobs are for athletes, coaches and veterans. Manage your postings under{' '}
              <Link to="/company/jobs" style={{ color: gold }}>Post a Job</Link>.
            </p>
          )}

          {user && !isEmployer && jobs === null && !error && (
            <div className="py-16 flex justify-center">
              <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: `${gold} transparent transparent transparent` }} />
            </div>
          )}

          {jobs && jobs.length === 0 && (
            <div className="text-center py-16 px-6" style={{ border: line, borderRadius: '3px', background: 'hsl(var(--hero-panel-bg))' }}>
              <Bookmark size={28} style={{ color: gold, margin: '0 auto 16px' }} aria-hidden="true" />
              <h2 className="font-bodoni mb-3" style={{ fontSize: '1.8rem', fontWeight: 400 }}>No saved roles yet</h2>
              <p className="font-barlow mb-7" style={{ fontSize: '16px', fontWeight: 300, color: faded }}>
                Tap the bookmark on any role to keep it here.
              </p>
              <Link to="/jobs" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2"
                style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', padding: '15px 32px', borderRadius: '3px', color: navy }}>
                Browse open roles <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {jobs && jobs.length > 0 && (
            <ul className="flex flex-col gap-4">
              {jobs.map((j) => {
                const p = pay(j.payRangeMin, j.payRangeMax);
                return (
                  <li key={j.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6"
                    style={{ border: line, borderRadius: '3px', background: 'hsl(var(--hero-panel-bg))', opacity: j.available ? 1 : 0.7 }}>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bodoni mb-1" style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.15 }}>{j.title}</h2>
                      <p className="font-barlow mb-2" style={{ fontSize: '15px', fontWeight: 300, color: ice }}>{j.companyName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-barlow" style={{ fontSize: '13px', color: faded }}>
                        {(j.location || j.isRemote) && <span className="inline-flex items-center gap-1"><MapPin size={12} />{j.isRemote ? 'Remote' : j.location}</span>}
                        <span>{JOB_TYPES[j.jobType] ?? j.jobType}</span>
                        {p && <span style={{ color: gold }}>{p}</span>}
                        {j.savedAt && <span className="inline-flex items-center gap-1"><Clock size={12} />Saved {fmtDate(j.savedAt)}</span>}
                        {j.applicationDeadline && <span>Due {fmtDate(j.applicationDeadline)}</span>}
                      </div>
                      {!j.available && (
                        <p className="font-barlow mt-2" style={{ fontSize: '13px', fontStyle: 'italic', color: faded }}>This role is no longer open.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {j.available && (
                        <Link to={`/jobs?job=${j.id}`} className="font-barlow-condensed uppercase inline-flex items-center gap-1.5"
                          style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.24em', padding: '11px 18px', borderRadius: '3px', border: '1px solid hsl(var(--hero-gold) / 0.7)', color: gold }}>
                          View role <ChevronRight size={12} />
                        </Link>
                      )}
                      <button type="button" onClick={() => remove(j.id)} aria-label={`Remove ${j.title} from saved roles`}
                        className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                        style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', padding: '11px 12px', color: faded }}>
                        <BookmarkX size={14} /> Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
