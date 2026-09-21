import { useState } from 'react';
import { useAuth, hasPermission } from '../context/AuthContext.jsx';
import { adminBrand } from '../theme/brand.js';

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        active
          ? 'bg-brand-accent/15 font-semibold text-brand-accentText'
          : 'text-mist-muted hover:bg-slate-100 hover:text-mist'
      }`}
    >
      <span className="w-4 text-base leading-none">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-muted/80">
      {children}
    </p>
  );
}

const accent = adminBrand.accent;

export default function Layout({ active, onNavigate, children }) {
  const { admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!admin) return null;
  const isSuper = admin.role === 'SUPER_ADMIN';
  const can = (perm) => hasPermission(admin, perm);

  const mainNav = [
    { key: 'dashboard', label: 'Overview', icon: '◈', show: can('dashboard.view') },
    { key: 'analytics', label: 'Analytics', icon: '◔', show: can('dashboard.view') },
    { key: 'assessments', label: 'Assessments', icon: '▤', show: can('sessions.view') },
    { key: 'kySessions', label: 'KY Submissions', icon: '✦', show: can('contacts.view') },
    { key: 'contacts', label: 'Contacts', icon: '✆', show: can('contacts.view') },
    { key: 'websiteContacts', label: 'Website Contacts', icon: '✉', show: can('contacts.view') },
    { key: 'businessTypes', label: 'KY Business Types', icon: '⬢', show: can('domains.view') },
    { key: 'domains', label: 'KY Domains', icon: '❖', show: can('domains.view') },
    { key: 'onboardingQuestions', label: 'Onboarding Questions', icon: '≡', show: can('questions.view') },
    { key: 'kyQuestions', label: 'KY Questions', icon: '❋', show: can('questions.view') },
    { key: 'kyResultCategories', label: 'KY Result Categories', icon: '⬡', show: can('results.manage') },
    { key: 'categories', label: 'Onboarding Categories', icon: '▤', show: can('domains.view') },
    { key: 'results', label: 'Results', icon: '◎', show: can('results.manage') },
    { key: 'stages', label: 'Stages', icon: '▣', show: can('stages.manage') },
  ];

  const adminNav = [
    { key: 'admins', label: 'Admins', icon: '👤', show: isSuper && can('admins.view') },
    { key: 'activity', label: 'Activity Log', icon: '◷', show: can('audit.view') },
    { key: 'profile', label: 'Profile', icon: '🛡', show: true },
  ];

  const buildNav = (items) =>
    items.filter((n) => n.show).map((n) => (
      <NavItem
        key={n.key}
        icon={n.icon}
        label={n.label}
        active={active === n.key}
        onClick={() => {
          onNavigate(n.key);
          setMobileOpen(false);
        }}
      />
    ));

  const profileBlock = (
    <div className="relative">
      <button
        onClick={() => setProfileOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-slate-300"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-ink-950"
          style={{ background: accent }}
        >
          {admin.name?.charAt(0) || 'A'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-mist">{admin.name}</span>
          <span className="block text-[10px] uppercase tracking-[0.15em] text-mist-muted">
            {isSuper ? 'Super Admin' : 'Admin'}
          </span>
        </span>
        <span className="text-mist-muted">▾</span>
      </button>
      {profileOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-ink-800 py-1 shadow-xl">
          <button
            onClick={() => {
              onNavigate('profile');
              setProfileOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-mist transition-colors hover:bg-slate-100"
          >
            Profile
          </button>
          <button
            onClick={() => {
              setProfileOpen(false);
              logout();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-700 transition-colors hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const brand = (
    <>
      <img src="/byrgop-logo.png" alt="BYRGOP" className="w-auto object-contain" style={{ height: 32 }} />
      <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-mist-muted">Admin Console</p>
    </>
  );

  const sidebarInner = (
    <>
      <div className="mb-8 px-2">
        <img src="/byrgop-logo.png" alt="BYRGOP" className="w-auto object-contain" style={{ height: 32 }} />
        <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-mist-muted">Admin Console</p>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <SectionLabel>Main</SectionLabel>
        {buildNav(mainNav)}
        <SectionLabel>Management</SectionLabel>
        {buildNav(adminNav)}
      </nav>
      <div className="mt-4">{profileBlock}</div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-ink-900 px-4 py-3 lg:hidden">
        <img src="/byrgop-logo.png" alt="BYRGOP" className="w-auto object-contain" style={{ height: 24 }} />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-mist"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-ink-850 px-4 py-6 lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            {brand}
            <button onClick={() => setMobileOpen(false)} className="text-mist-muted">✕</button>
          </div>
          <div className="mt-4">{profileBlock}</div>
          <div className="mt-6">{buildNav([...mainNav, ...adminNav])}</div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-ink-850 px-4 py-6 lg:flex">
        {sidebarInner}
      </aside>

      <main className="flex-1 px-4 pt-16 pb-8 lg:ml-64 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}