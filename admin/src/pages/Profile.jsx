import { useAuth } from '../context/AuthContext.jsx';
import { adminBrand as brand } from '../theme/brand.js';

const PERMISSION_LABELS = {
  'dashboard.view': 'View dashboard',
  'assessments.view': 'View assessments',
  'sessions.view': 'View sessions',
  'contacts.view': 'View contacts',
  'questions.view': 'View questions',
  'questions.create': 'Create questions',
  'questions.edit': 'Edit questions',
  'questions.delete': 'Delete questions',
  'domains.view': 'View domains',
  'domains.manage': 'Manage domains',
  'results.manage': 'Manage results',
  'stages.manage': 'Manage stages',
  'admins.view': 'View admins',
  'admins.create': 'Create admins',
  'admins.manage': 'Manage admins',
  'audit.view': 'View audit log',
};

export default function Profile() {
  const { admin } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-mist">Profile</h1>
      <p className="mt-1 text-sm text-mist-muted">Your account details and access</p>

      <div className="mt-6 card">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold uppercase text-ink-950" style={{ background: brand.accent }}>
            {admin.name?.charAt(0)}
          </span>
          <div>
            <p className="font-display text-xl font-semibold text-mist">{admin.name}</p>
            <p className="text-sm text-mist-muted">{admin.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-mist-muted">Role</p>
            <p className="mt-1 text-sm font-semibold text-mist">
              {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-mist-muted">Status</p>
            <p className={`mt-1 text-sm font-semibold ${admin.active ? 'text-green-700' : 'text-red-700'}`}>
              {admin.active ? 'Active' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-mist-muted">Member Since</p>
            <p className="mt-1 text-sm text-mist">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="mb-4 font-display text-xs uppercase tracking-[0.18em] text-mist-muted">Your Permissions</h2>
        {admin.role === 'SUPER_ADMIN' ? (
          <p className="text-sm text-mist">Super Admins have full access to the system.</p>
        ) : (admin.permissions || []).length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(admin.permissions || []).map((p) => (
              <li key={p} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-mist">
                <span className="text-green-700">✓</span>
                {PERMISSION_LABELS[p] || p}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-red-700">This account has no permissions assigned yet. Contact a Super Admin.</p>
        )}
      </div>
    </div>
  );
}