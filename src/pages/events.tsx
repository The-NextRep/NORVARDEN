/**
 * /events — public list of upcoming and past events. Open to everyone,
 * including companies without a plan.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CalendarDays, MapPin, Video, ExternalLink } from 'lucide-react';
import { FORMAT_LABELS, dateBadge, formatEventWhen, type PublicEvent } from '@/lib/events';

const siteUrl = 'https://www.norvarden.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const border  = '1px solid hsl(var(--hero-gold) / 0.16)';
const eyebrow = { fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: gold } as const;

export function EventCard({ ev, past = false }: { ev: PublicEvent; past?: boolean }) {
  const badge = dateBadge(ev.startsAt);
  const Icon = ev.format === 'virtual' ? Video : MapPin;
  return (
    <article className="flex gap-5 p-5 md:p-6 rounded-sm" style={{ background: navyMid, border, opacity: past ? 0.75 : 1 }}>
      <div
        className="shrink-0 w-16 h-16 flex flex-col items-center justify-center rounded-sm"
        style={{ border: `1px solid ${gold}`, background: 'hsl(var(--hero-gold) / 0.06)' }}
        aria-hidden="true"
      >
        <span className="font-barlow-condensed" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', color: gold }}>{badge.month}</span>
        <span className="font-bodoni" style={{ fontSize: '26px', lineHeight: 1, color: white }}>{badge.day}</span>
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        {ev.tier === 'featured' && !past && (
          <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.28em', color: gold }}>Featured</span>
        )}
        <h3 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.25 }}>{ev.title}</h3>
        <p className="font-barlow inline-flex items-center gap-2" style={{ fontSize: '14px', color: 'hsl(var(--hero-ice) / 0.85)' }}>
          <CalendarDays size={14} style={{ color: gold, flexShrink: 0 }} /> {formatEventWhen(ev.startsAt, ev.endsAt)}
        </p>
        <p className="font-barlow inline-flex items-center gap-2" style={{ fontSize: '14px', color: ice60 }}>
          <Icon size={14} style={{ color: gold, flexShrink: 0 }} />
          {FORMAT_LABELS[ev.format]}{ev.location ? ` · ${ev.location}` : ''}
        </p>
        {ev.hostName && (
          <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.24em', color: ice60 }}>
            Hosted by {ev.hostName}
          </p>
        )}
        {ev.description && (
          <p className="font-barlow mt-1" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60, whiteSpace: 'pre-line' }}>
            {ev.description}
          </p>
        )}
        {!past && ev.registrationUrl && (
          <a
            href={ev.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 self-start mt-2 transition-opacity hover:opacity-90"
            style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', padding: '12px 24px', borderRadius: '2px', color: navy }}
          >
            Register <ExternalLink size={11} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function EventsPage() {
  const [data, setData] = useState<{ upcoming: PublicEvent[]; past: PublicEvent[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { upcoming: PublicEvent[]; past: PublicEvent[] }) => setData(d))
      .catch(() => setError(true));
  }, []);

  return (
    <>
      <Helmet>
        <title>Events — NORVARDEN</title>
        <meta name="description" content="Career events, hiring sessions and workshops for people with disabilities." />
        <link rel="canonical" href={`${siteUrl}/events`} />
        <meta property="og:title" content="Events — NORVARDEN" />
        <meta property="og:url" content={`${siteUrl}/events`} />
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          <header className="flex flex-col gap-4">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>Events</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 400, lineHeight: 1.08, color: white }}>
              Show up. <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>Get seen.</em>
            </h1>
            <p className="font-barlow max-w-xl" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
              Hiring sessions, workshops and networking events for people with disabilities, with verified companies in the room.
            </p>
          </header>

          {error ? (
            <p className="font-barlow" style={{ fontSize: '15px', color: ice60 }}>Events couldn’t load right now. Please refresh the page.</p>
          ) : !data ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
            </div>
          ) : (
            <>
              <section className="flex flex-col gap-4" aria-labelledby="upcoming">
                <h2 id="upcoming" className="font-barlow-condensed uppercase" style={eyebrow}>Upcoming</h2>
                {data.upcoming.length === 0 ? (
                  <div className="p-8 rounded-sm text-center" style={{ background: navyMid, border }}>
                    <p className="font-bodoni mb-2" style={{ fontSize: '22px', color: white }}>New events are on the way.</p>
                    <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
                      <Link to="/signup" style={{ color: gold }}>Join free</Link> and we’ll let you know when the next one is announced.
                    </p>
                  </div>
                ) : (
                  data.upcoming.map((ev) => <EventCard key={ev.id} ev={ev} />)
                )}
              </section>

              {data.past.length > 0 && (
                <section className="flex flex-col gap-4" aria-labelledby="past">
                  <h2 id="past" className="font-barlow-condensed uppercase" style={eyebrow}>Past events</h2>
                  {data.past.map((ev) => <EventCard key={ev.id} ev={ev} past />)}
                </section>
              )}
            </>
          )}

          <section className="p-6 md:p-8 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ border }}>
            <div>
              <p className="font-bodoni" style={{ fontSize: '22px', color: white }}>Want to host a career event?</p>
              <p className="font-barlow mt-1" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
                Verified companies can list events for people with disabilities. Standard listings from $750, included with Scout and Partner plans.
              </p>
            </div>
            <Link
              to="/company/events"
              className="font-barlow-condensed uppercase self-start md:self-auto whitespace-nowrap"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '12px 22px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold }}
            >
              List your event
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
