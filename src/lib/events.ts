/** Shared event types and formatting for /events, the home strip and admin. */

export type EventFormat = 'in_person' | 'virtual' | 'hybrid';

export interface PublicEvent {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  format: EventFormat;
  location: string | null;
  registrationUrl: string | null;
  hostName: string | null;
  tier?: 'standard' | 'featured';
}

export const FORMAT_LABELS: Record<EventFormat, string> = {
  in_person: 'In person',
  virtual: 'Virtual',
  hybrid: 'In person + virtual',
};

/** "Thu, Oct 16 · 6:00 PM – 8:00 PM CDT" in the viewer's own time zone. */
export function formatEventWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  const time = (d: Date, zone: boolean) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...(zone ? { timeZoneName: 'short' } : {}) });
  if (!end) return `${day} · ${time(start, true)}`;
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${day} · ${time(start, false)} – ${time(end, true)}`;
  const endDay = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} ${time(start, false)} – ${endDay} ${time(end, true)}`;
}

/** Month + day badge parts, e.g. { month: 'OCT', day: '16' }. */
export function dateBadge(startsAt: string): { month: string; day: string } {
  const d = new Date(startsAt);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  };
}
