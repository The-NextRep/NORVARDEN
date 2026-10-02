/**
 * Shared admin navigation — a gold-underlined tab row shown on every /admin page.
 */
import { Link, useLocation } from 'react-router';
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareWarning,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { adminTheme as t, eyebrowStyle } from './theme';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/companies', label: 'Verification queue', icon: ClipboardCheck },
  { to: '/admin/company-list', label: 'Companies', icon: Building2 },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: AlertTriangle },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquareWarning },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
];

function isActive(pathname: string, to: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return to === '/admin' ? path === '/admin' : path === to || path.startsWith(to + '/');
}

export default function AdminNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Admin"
      className="px-4 md:px-12 lg:px-16"
      style={{ background: t.panel, borderBottom: `1px solid ${t.line}` }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <span
          className="hidden lg:inline font-barlow-condensed uppercase shrink-0"
          style={{ ...eyebrowStyle, fontSize: '9px', color: t.gold }}
        >
          REP | IV · Admin
        </span>
        <ul className="flex items-stretch gap-1 overflow-x-auto -mb-px" style={{ scrollbarWidth: 'none' }}>
          {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = isActive(pathname, to);
            return (
              <li key={to} className="shrink-0">
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase px-3 py-4 transition-colors hover:opacity-100"
                  style={{
                    ...eyebrowStyle,
                    letterSpacing: '0.2em',
                    color: active ? t.gold : t.ice60,
                    borderBottom: `2px solid ${active ? t.gold : 'transparent'}`,
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
