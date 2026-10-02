/**
 * Home-page strip with the next three published events. Renders nothing when
 * there are no upcoming events.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { EventCard } from '@/pages/events';
import type { PublicEvent } from '@/lib/events';

export default function UpcomingEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { upcoming?: PublicEvent[] } | null) => setEvents([...(d?.upcoming ?? [])].sort((a, b) => Number(b.tier === 'featured') - Number(a.tier === 'featured')).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="px-6 md:px-12 lg:px-16 py-16 max-w-7xl mx-auto" aria-labelledby="home-events">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 id="home-events" className="font-bodoni" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 400, color: 'hsl(var(--hero-white))' }}>
          Upcoming <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>events.</em>
        </h2>
        <Link to="/events" className="font-barlow-condensed uppercase inline-flex items-center gap-1 shrink-0" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: 'hsl(var(--hero-gold))' }}>
          All events <ChevronRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {events.map((ev) => <EventCard key={ev.id} ev={ev} />)}
      </div>
    </section>
  );
}
