import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, X, ChevronDown, User, Briefcase, Settings, LogOut, LayoutDashboard, Building2, MessageSquare, Shield, FileText, GraduationCap, Bookmark, Users, CalendarDays } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from '@/lib/auth/auth-client';
import { useCurrentUser, clearCurrentUser } from '@/lib/auth/use-current-user';
import BrandMark from '@/components/BrandMark';

// ─────────────────────────────────────────────────────────────────────────────
// Header — transparent on hero, solid navy on scroll.
// Auth-aware: shows Log in / Join free when logged out; role-based dashboard
// link + dropdown menu when logged in.
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/jobs',          label: 'Jobs' },
  { href: '/athletes',      label: 'Athletes' },
  { href: '/coaches',       label: 'Coaches' },
  { href: '/veterans',      label: 'Veterans' },
  { href: '/resources',     label: 'Resources' },
  { href: '/events',        label: 'Events' },
  { href: '/for-companies', label: 'For Companies' },
];

// ── Tokens ──────────────────────────────────────────────────────────────────
const navy       = 'hsl(var(--hero-navy))';
const gold       = 'hsl(var(--hero-gold))';
const white      = 'hsl(var(--hero-white))';
const ice60      = 'hsl(var(--hero-ice-60))';
const goldBorder = '1px solid hsl(var(--hero-gold))';
const skyBorder  = '1px solid hsl(var(--hero-sky-border))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';

// Shared nav link style
function navStyle(active: boolean) {
  return {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: active ? gold : white,
    transition: 'color 0.2s',
  };
}

// ── User dropdown menu ───────────────────────────────────────────────────────
interface DropdownProps {
  dashboardHref: string;
  dashboardLabel: string;
  isEmployer: boolean;
  isAdmin: boolean;
  onClose: () => void;
}

function UserDropdown({ dashboardHref, dashboardLabel, isEmployer, isAdmin, onClose }: DropdownProps) {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut();
    } catch {
      // ignore
    }
    clearCurrentUser();
    onClose();
    navigate('/');
  }

  const menuItems = [
    {
      href:  dashboardHref,
      label: dashboardLabel,
      icon:  <LayoutDashboard size={13} />,
    },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: <Shield size={13} /> }] : []),
    {
      href:  '/profile/edit',
      label: 'Profile',
      icon:  <User size={13} />,
    },
    ...(isEmployer
      ? [
          { href: '/company/jobs',       label: 'Post a Job', icon: <Briefcase size={13} /> },
          { href: '/company/candidates', label: 'Candidates', icon: <Users size={13} /> },
          { href: '/company/events',     label: 'My Events',  icon: <CalendarDays size={13} /> },
        ]
      : isAdmin ? [] : [
          { href: '/saved-jobs',     label: 'Saved Jobs',     icon: <Bookmark size={13} /> },
          { href: '/resume-builder', label: 'Résumé Builder', icon: <FileText size={13} /> },
          { href: '/interview-tips', label: 'Interview Tips', icon: <GraduationCap size={13} /> },
        ]
    ),
    {
      href:  '/settings',
      label: 'Settings',
      icon:  <Settings size={13} />,
    },
  ];

  return (
    <div
      className="absolute right-0 top-full mt-2 w-52 py-1 z-50"
      style={{
        background: navy,
        border: goldBorder35,
        borderRadius: '3px',
        boxShadow: '0 8px 32px hsl(var(--hero-navy) / 0.8)',
      }}
      role="menu"
    >
      {menuItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 transition-colors"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: white,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = gold; (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--hero-gold) / 0.07)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = white; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
          role="menuitem"
        >
          <span style={{ color: ice60 }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}

      {/* Divider */}
      <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.18)', margin: '4px 0' }} aria-hidden="true" />

      {/* Log out */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors disabled:opacity-50"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: white,
          background: 'transparent',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--destructive))'; (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--destructive) / 0.07)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = white; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        role="menuitem"
      >
        <LogOut size={13} style={{ color: ice60 }} />
        {loading ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

// ── Main header ──────────────────────────────────────────────────────────────
export default function Header() {
  const location                        = useLocation();
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  const { isPending, isAuthenticated, user } = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count when authenticated
  const fetchUnread = useCallback(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    void fetch('/api/messages/unread', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : { unread: 0 })
      .then((d: { unread?: number }) => setUnreadCount(d.unread ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnread();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const isActive = (href: string) => location.pathname === href;

  // Role-based dashboard destination
  const isEmployer = user?.memberType === 'employer';
  const isAdmin    = user?.isAdmin ?? false;
  const dashboardHref  = isAdmin ? '/admin/companies' : isEmployer ? '/company/dashboard' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin' : isEmployer ? 'Company dashboard' : 'My dashboard';

  // Display name for the trigger button (first name or email prefix)
  const displayName = user?.name
    ? user.name.split(' ')[0]
    : user?.email?.split('@')[0] ?? '';

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? navy : 'transparent',
          borderBottom: scrolled ? skyBorder : 'none',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-16">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center leading-none shrink-0">
            <BrandMark size={18} />
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────────────── */}
          <nav className={`hidden ${isAuthenticated ? '2xl:flex' : 'xl:flex'} items-center gap-7`} aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                style={navStyle(isActive(item.href))}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = gold; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive(item.href) ? gold : white; }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop right ─────────────────────────────────────────────── */}
          <div className={`hidden ${isAuthenticated ? '2xl:flex' : 'xl:flex'} items-center gap-5 shrink-0`}>

            {/* Loading skeleton — invisible placeholder to prevent layout shift */}
            {isPending && (
              <div className="flex items-center gap-5">
                <div style={{ width: '48px', height: '12px', borderRadius: '2px', background: 'hsl(var(--hero-white) / 0.08)' }} />
                <div style={{ width: '80px', height: '34px', borderRadius: '2px', background: 'hsl(var(--hero-white) / 0.08)' }} />
              </div>
            )}

            {/* Logged out */}
            {!isPending && !isAuthenticated && (
              <>
                <Link
                  to="/login"
                  style={navStyle(isActive('/login'))}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = gold; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive('/login') ? gold : white; }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="font-barlow-condensed uppercase inline-flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em',
                    padding: '9px 20px', borderRadius: '2px',
                    color: gold, border: '1px solid hsl(var(--hero-gold) / 0.70)',
                    background: 'transparent', outlineColor: gold,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'hsl(var(--hero-gold) / 0.10)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                >
                  Join
                </Link>
              </>
            )}

            {/* Logged in */}
            {!isPending && isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                {/* Messages link with unread badge */}
                <Link
                  to="/messages"
                  className="relative inline-flex items-center gap-1.5 mr-3 transition-opacity hover:opacity-80"
                  style={navStyle(isActive('/messages'))}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = gold; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive('/messages') ? gold : white; }}
                  aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <MessageSquare size={13} className="inline -mt-0.5" />
                  Messages
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 flex items-center justify-center font-barlow-condensed"
                      style={{ minWidth: '16px', height: '16px', borderRadius: '8px', background: gold, color: navy, fontSize: '9px', fontWeight: 700, padding: '0 4px', lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard quick-link */}
                <Link
                  to={dashboardHref}
                  style={navStyle(isActive(dashboardHref))}
                  className="mr-1"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = gold; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive(dashboardHref) ? gold : white; }}
                >
                  {isEmployer ? (
                    <Building2 size={13} className="inline mr-1.5 -mt-0.5" />
                  ) : (
                    <LayoutDashboard size={13} className="inline mr-1.5 -mt-0.5" />
                  )}
                  {dashboardLabel}
                </Link>

                {/* Avatar / name trigger */}
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 ml-4 transition-opacity hover:opacity-80"
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  aria-label="Account menu"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: white,
                  }}
                >
                  {/* Avatar circle */}
                  <span
                    className="inline-flex items-center justify-center font-bodoni"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: goldBorder35,
                      background: 'hsl(var(--hero-gold) / 0.12)',
                      fontSize: '12px',
                      fontWeight: 400,
                      color: gold,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{displayName}</span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: ice60,
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <UserDropdown
                    dashboardHref={dashboardHref}
                    dashboardLabel={dashboardLabel}
                    isEmployer={isEmployer}
                    isAdmin={isAdmin}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────────── */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={`${isAuthenticated ? '2xl:hidden' : 'xl:hidden'} p-2 rounded-sm transition-colors`}
            style={{ color: white }}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Mobile menu ───────────────────────────────────────────────────── */}
        {mobileOpen && (
          <MobileMenu
            navItems={NAV_ITEMS}
            isActive={isActive}
            isPending={isPending}
            isAuthenticated={isAuthenticated}
            user={user}
            dashboardHref={dashboardHref}
            dashboardLabel={dashboardLabel}
            isEmployer={isEmployer}
            isAdmin={isAdmin}
            navy={navy}
            gold={gold}
            white={white}
            ice60={ice60}
            goldBorder={goldBorder}
            onClose={() => setMobileOpen(false)}
          />
        )}
      </header>

      {/* Spacer on non-homepage routes */}
      {location.pathname !== '/' && (
        <div className="h-16" aria-hidden="true" style={{ background: navy }} />
      )}
    </>
  );
}

// ── Mobile menu (extracted to keep Header readable) ──────────────────────────
interface MobileMenuProps {
  navItems: typeof NAV_ITEMS;
  isActive: (href: string) => boolean;
  isPending: boolean;
  isAuthenticated: boolean;
  user: { name: string | null; email: string; memberType: string | null; isAdmin: boolean } | null;
  dashboardHref: string;
  dashboardLabel: string;
  isEmployer: boolean;
  isAdmin: boolean;
  navy: string; gold: string; white: string; ice60: string; goldBorder: string;
  onClose: () => void;
}

function MobileMenu({
  navItems, isActive, isPending, isAuthenticated, user,
  dashboardHref, dashboardLabel, isEmployer, isAdmin,
  navy, gold, white, ice60, goldBorder, onClose,
}: MobileMenuProps) {
  const navigate  = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try { await signOut(); } catch { /* ignore */ }
    clearCurrentUser();
    onClose();
    navigate('/');
  }

  const linkStyle = (active: boolean) => ({
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: active ? gold : white,
  });

  const displayName = user?.name
    ? user.name.split(' ')[0]
    : user?.email?.split('@')[0] ?? '';

  return (
    <div
      className={`${isAuthenticated ? '2xl:hidden' : 'xl:hidden'} px-6 pb-6 pt-2 flex flex-col gap-1`}
      style={{ background: navy, borderTop: goldBorder }}
    >
      {/* Main nav */}
      <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="py-3 px-2"
            style={linkStyle(isActive(item.href))}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Auth section */}
      <div
        className="flex flex-col gap-1 mt-4 pt-4"
        style={{ borderTop: '1px solid hsl(var(--hero-border-top))' }}
      >
        {/* Loading */}
        {isPending && (
          <div style={{ height: '44px', borderRadius: '2px', background: 'hsl(var(--hero-white) / 0.06)' }} />
        )}

        {/* Logged out */}
        {!isPending && !isAuthenticated && (
          <>
            <Link to="/login" className="py-3 px-2" style={linkStyle(isActive('/login'))}>
              Sign in
            </Link>
            <Link
              to="/signup"
              className="font-barlow-condensed uppercase text-center inline-flex items-center justify-center transition-colors mt-1"
              style={{
                fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em',
                padding: '14px 0', borderRadius: '2px',
                color: gold, border: '1px solid hsl(var(--hero-gold) / 0.70)',
                background: 'transparent',
              }}
            >
              Join
            </Link>
          </>
        )}

        {/* Logged in */}
        {!isPending && isAuthenticated && (
          <>
            {/* User identity row */}
            <div
              className="flex items-center gap-3 px-2 py-3 mb-1"
              style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)' }}
            >
              <span
                className="inline-flex items-center justify-center font-bodoni shrink-0"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid hsl(var(--hero-gold) / 0.35)',
                  background: 'hsl(var(--hero-gold) / 0.12)',
                  fontSize: '14px', fontWeight: 400, color: gold,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                {user?.name && (
                  <span
                    className="font-barlow-condensed uppercase truncate"
                    style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.20em', color: white }}
                  >
                    {user.name}
                  </span>
                )}
                <span
                  className="font-barlow truncate"
                  style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}
                >
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Dashboard */}
            <Link
              to={dashboardHref}
              className="flex items-center gap-3 py-3 px-2"
              style={linkStyle(isActive(dashboardHref))}
            >
              {isEmployer
                ? <Building2 size={13} style={{ color: ice60 }} />
                : <LayoutDashboard size={13} style={{ color: ice60 }} />
              }
              {dashboardLabel}
            </Link>

            {/* Admin (admins only) */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/admin'))}>
                <Shield size={13} style={{ color: ice60 }} />
                Admin
              </Link>
            )}

            {/* Messages */}
            <Link to="/messages" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/messages'))}>
              <MessageSquare size={13} style={{ color: ice60 }} />
              Messages
            </Link>

            {/* Profile */}
            <Link to="/profile/edit" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/profile/edit'))}>
              <User size={13} style={{ color: ice60 }} />
              Profile
            </Link>

            {/* Post a job (employers only) */}
            {isEmployer && (
              <Link to="/company/jobs" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/company/jobs'))}>
                <Briefcase size={13} style={{ color: ice60 }} />
                Post a Job
              </Link>
            )}
            {isEmployer && (
              <Link to="/company/events" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/company/events'))}>
                <CalendarDays size={13} style={{ color: ice60 }} />
                My Events
              </Link>
            )}
            {isEmployer && (
              <Link to="/company/candidates" className="flex items-center gap-3 py-3 px-2" style={linkStyle(isActive('/company/candidates'))}>
                <Users size={13} style={{ color: ice60 }} />
                Candidates
              </Link>
            )}

            {/* Settings */}
            <Link to="/settings" className="flex items-center gap-3 py-3 px-2" style={linkStyle(false)}>
              <Settings size={13} style={{ color: ice60 }} />
              Settings
            </Link>

            {/* Log out */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 py-3 px-2 w-full text-left mt-1 disabled:opacity-50"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em',
                textTransform: 'uppercase', color: 'hsl(var(--destructive))',
                background: 'transparent',
                borderTop: '1px solid hsl(var(--hero-gold) / 0.15)',
                paddingTop: '16px',
              }}
            >
              <LogOut size={13} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
