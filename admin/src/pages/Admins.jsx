import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { adminBrand as brand } from '../theme/brand.js';

const ALL_PERMISSIONS = [
  'dashboard.view',
  'assessments.view',
  'sessions.view',
  'contacts.view',
  'questions.view',
  'questions.create',
  'questions.edit',
  'questions.delete',
  'domains.view',
  'domains.manage',
  'results.manage',
  'stages.manage',
  'admins.view',
  'admins.create',
  'admins.manage',
  'audit.view',
];

const DEFAULT_PERMS = [
  'dashboard.view',
  'assessments.view',
  'sessions.view',
  'contacts.view',
  'questions.view',
  'domains.view',
];

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

function PermissionPicker({ value, onChange }) {
  const toggle = (p) =>
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ALL_PERMISSIONS.map((p) => (
        <label key={p} className="flex cursor-pointer items-center gap-2 text-sm text-mist">
          <input type="checkbox" checked={value.includes(p)} onChange={() => toggle(p)} className="accent-brand-accent" />
          <span className="font-mono text-xs">{p}</span>
        </label>
      ))}
    </div>
  );
}

function AdminForm({ initial, onCancel, onSaved }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    active: initial?.active ?? true,
    permissions: initial?.permissions?.length ? initial.permissions : [...DEFAULT_PERMS],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (isEdit) {
        await api.updateAdmin(`/admin/admins/${initial.id}`, {
          name: form.name.trim(),
          password: form.password.trim() || undefined,
        });
        await api.setAdminPermissions(`/admin/admins/${initial.id}/permissions`, {
          permissions: form.permissions,
        });
      } else {
        await api.createAdmin('/admin/admins', {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password.trim(),
          active: form.active,
          permissions: form.permissions,
        });
      }
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Name</label>
          <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            required={!isEdit}
            disabled={isEdit}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
            Password {isEdit && <span className="normal-case text-mist-muted/80">(blank to keep)</span>}
          </label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
            required={!isEdit}
            minLength={8}
          />
        </div>
        {!isEdit && (
          <label className="flex items-center gap-2 text-sm text-mist self-end pb-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set({ active: e.target.checked })}
              className="accent-brand-accent"
            />
            Account active
          </label>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-mist-muted">Permissions</label>
        <PermissionPicker value={form.permissions} onChange={(v) => set({ permissions: v })} />
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Admin'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function AdminRow({ a, isSelf, onChanged, notify }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const toggleActive = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.setAdminStatus(`/admin/admins/${a.id}/status`, { active: !a.active });
      notify('Status updated');
      onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!window.confirm(`Delete admin "${a.name}"? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.deleteAdmin(`/admin/admins/${a.id}`);
      notify('Admin deleted');
      onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const safe = a.permissions?.length === 0 && a.role !== 'SUPER_ADMIN';

  return (
    <tr className={`border-b border-slate-200 last:border-0 ${isSelf ? 'bg-brand-accent/5' : 'hover:bg-slate-50'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-ink-950" style={{ background: brand.accent }}>
            {a.name?.charAt(0)}
          </span>
          <div>
            <p className="font-medium text-mist">{a.name}{isSelf && <span className="ml-2 text-xs text-mist-muted">(you)</span>}</p>
            <p className="text-xs text-mist-muted">{a.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`badge ${a.role === 'SUPER_ADMIN' ? 'bg-brand-accent/15 text-brand-accentText' : 'bg-slate-200 text-mist'}`}>
          {a.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`badge ${a.active ? 'bg-green-400/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
          {a.active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-mist-muted">{fmtDate(a.lastLoginAt)}</td>
      <td className="px-4 py-3">
        {safe ? (
          <span className="badge bg-red-500/15 text-red-700">No permissions</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(a.permissions || []).map((p) => (
              <span key={p} className="badge bg-slate-100 text-mist-muted">{p.split('.')[0]}</span>
            ))}
            {a.role === 'SUPER_ADMIN' && <span className="badge bg-slate-100 text-mist-muted">all</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={toggleActive} disabled={busy || isSelf} className="btn-ghost px-3 py-1 text-xs disabled:opacity-40" title={isSelf ? 'You cannot disable yourself' : ''}>
            {a.active ? 'Disable' : 'Enable'}
          </button>
          {!isSelf && (
            <button onClick={del} disabled={busy} className="btn-danger disabled:opacity-50">Delete</button>
          )}
        </div>
        {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
      </td>
    </tr>
  );
}

export default function Admins() {
  const { admin: me } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.admins();
      setAdmins(data.admins || []);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const onSaved = async () => {
    setShowForm(false);
    setEditing(null);
    await load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Admin Accounts</h1>
          <p className="mt-1 text-sm text-mist-muted">Create and manage administrator access</p>
        </div>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
            + New Admin
          </button>
        )}
      </div>

      {(notice || err) && (
        <p className={`mt-4 text-sm ${err ? 'text-red-700' : 'text-green-700'}`}>{err || notice}</p>
      )}

      {showForm && (
        <div className="mt-6">
          <AdminForm initial={editing} onCancel={() => { setShowForm(false); setEditing(null); }} onSaved={onSaved} />
        </div>
      )}

      <div className="mt-6 card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.15em] text-mist-muted">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <AdminRow key={a.id} a={a} isSelf={a.id === me.id} onChanged={load} notify={notify} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}