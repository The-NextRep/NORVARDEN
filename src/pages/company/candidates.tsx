/**
 * /company/candidates — Employer candidate search.
 * Lists athletes, coaches and veterans (restricted view: no contact details).
 * Clicking a card opens /profile/:userId, where the company can request to connect.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router';
import { MapPin, Search, Shield, ChevronRight } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';

const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

type Connection = 'none' | 'pending' | 'accepted' | 'unavailable';

interface Candidate {
  userId: string;
  memberType: 'athlete' | 'coach' | 'veteran';
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  city: string | null;
  state: string | null;
  photoUrl: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected' | null;
  connection: Connection;
}

const TYPE_LABELS: Record<Candidate['memberType'], string> = {
  athlete: 'Athlete',
  coach: 'Coach',
  veteran: 'Veteran',
};

const CONNECTION_LABELS: Record<Connection, string | null> = {
  none: null,
  pending: 'Request sent',
  accepted: 'Connected',
  unavailable: 'Not available',
};

const labelStyle = { fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em' } as const;

function CandidateCard({ c }: { c: Candidate }) {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Member';
  const place = [c.city, c.state].filter(Boolean).join(', ');
  const conn = CONNECTION_LABELS[c.connection];
  return (
    <Link
      to={`/profile/${c.userId}`}
      className="flex gap-4 p-5 rounded-sm transition-colors hover:brightness-110"
      style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.14)' }}
    >
      <div
        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-bodoni"
        style={{ background: 'hsl(var(--hero-gold) / 0.12)', color: gold, fontSize: '20px' }}
      >
        {c.photoUrl ? <img src={c.photoUrl} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-barlow-condensed uppercase" style={{ ...labelStyle, color: gold }}>{TYPE_LABELS[c.memberType]}</span>
          {c.verificationStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ ...labelStyle, color: ice60 }}>
              <Shield size={10} /> Verified
            </span>
          )}
          {conn && (
            <span className="font-barlow-condensed uppercase" style={{ ...labelStyle, color: ice60 }}>· {conn}</span>
          )}
        </div>
        <p className="font-bodoni truncate" style={{ fontSize: '20px', color: white, lineHeight: 1.2 }}>{name}</p>
        {c.headline && (
          <p className="font-barlow truncate" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>{c.headline}</p>
        )}
        {place && (
          <p className="font-barlow inline-flex items-center gap-1 mt-1" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
            <MapPin size={12} /> {place}
          </p>
        )}
      </div>
      <ChevronRight size={16} className="self-center shrink-0" style={{ color: ice60 }} />
    </Link>
  );
}

function CandidatesInner() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [q, setQ]           = useState('');
  const [type, setType]     = useState('');
  const [applied, setApplied] = useState({ q: '', type: '' });
  const [page, setPage]     = useState(1);
  const [items, setItems]   = useState<Candidate[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<{ message: string; code?: string } | null>(null);

  useEffect(() => {
    if (user && user.memberType !== 'employer' && !user.isAdmin) {
      void navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const load = useCallback(async (nextPage: number, filters: { q: string; type: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (filters.q) params.set('q', filters.q);
      if (filters.type) params.set('type', filters.type);
      const res = await fetch(`/api/company/candidates?${params}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({})) as { candidates?: Candidate[]; hasMore?: boolean; error?: string; code?: string };
      if (!res.ok) {
        setError({ message: data.error ?? 'Could not load candidates.', code: data.code });
        setItems([]);
        return;
      }
      setItems((prev) => nextPage === 1 ? (data.candidates ?? []) : [...prev, ...(data.candidates ?? [])]);
      setHasMore(!!data.hasMore);
      setPage(nextPage);
    } catch {
      setError({ message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, applied); }, [load, applied]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setApplied({ q: q.trim(), type });
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-12 lg:px-16" style={{ background: navy }}>
      <Helmet>
        <title>Candidates — REP | IV</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <p className="font-barlow-condensed uppercase mb-3" style={{ ...labelStyle, color: gold }}>Employer</p>
        <h1 className="font-bodoni mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: white, lineHeight: 1.1 }}>
          Browse <em style={{ color: gold, fontStyle: 'italic' }}>candidates.</em>
        </h1>
        <p className="font-barlow mb-8 max-w-xl" style={{ fontSize: '15px', fontWeight: 300, color: ice60, lineHeight: 1.7 }}>
          Athletes, coaches and veterans on REP | IV. Open a profile and request to connect — contact details
          and résumés are shared only after the member accepts.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 flex items-center gap-2 px-4 rounded-sm" style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.2)' }}>
            <Search size={14} style={{ color: ice60 }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, sport, skill, city, MOS…"
              aria-label="Search candidates"
              className="flex-1 bg-transparent outline-none font-barlow py-3"
              style={{ color: white, fontSize: '15px' }}
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Member type"
            className="font-barlow px-4 py-3 rounded-sm"
            style={{ background: navyMid, color: white, border: '1px solid hsl(var(--hero-gold) / 0.2)', fontSize: '15px' }}
          >
            <option value="">All members</option>
            <option value="athlete">Athletes</option>
            <option value="coach">Coaches</option>
            <option value="veteran">Veterans</option>
          </select>
          <button
            type="submit"
            className="font-barlow-condensed uppercase px-6 py-3 rounded-sm transition-opacity hover:opacity-90"
            style={{ ...labelStyle, background: gold, color: navy }}
          >
            Search
          </button>
        </form>

        {error ? (
          <div className="p-6 rounded-sm" style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.2)' }}>
            <p className="font-barlow mb-3" style={{ fontSize: '15px', color: white }}>{error.message}</p>
            {error.code && (
              <Link to="/company/account" className="font-barlow-condensed uppercase" style={{ ...labelStyle, color: gold }}>
                Check verification status →
              </Link>
            )}
          </div>
        ) : items.length === 0 && !loading ? (
          <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
            No candidates match your search yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((c) => <CandidateCard key={c.userId} c={c} />)}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => void load(page + 1, applied)}
              className="font-barlow-condensed uppercase px-6 py-3 rounded-sm"
              style={{ ...labelStyle, color: gold, border: '1px solid hsl(var(--hero-gold) / 0.35)', background: 'transparent' }}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CompanyCandidatesPage() {
  return (
    <AuthGuard>
      <CandidatesInner />
    </AuthGuard>
  );
}
