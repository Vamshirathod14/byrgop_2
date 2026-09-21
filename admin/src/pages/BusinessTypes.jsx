import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';

const empty = { name: '', key: '', description: '', sortOrder: 0, active: true };

function BusinessTypeForm({ initial, nextSortOrder, onCancel, onSaved }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          description: initial.description || '',
          sortOrder: initial.sortOrder ?? 0,
          active: initial.active,
        }
      : { ...empty, sortOrder: nextSortOrder }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (isEdit) await api.updateBusinessType(`/admin/business-types/${initial._id}`, payload);
      else await api.createBusinessType('/admin/business-types', payload);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Business type name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Service Based"
            required
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2.5 text-sm text-mist">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
            Active
          </label>
          <div className="ml-auto w-24">
            <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Order</label>
            <input
              className="input"
              type="number"
              value={form.sortOrder}
              onChange={(e) => set({ sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Description</label>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create business type'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function BusinessTypes() {
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setTypes(await api.businessTypes());
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (t) => {
    setBusyId(t._id);
    try {
      await api.updateBusinessType(`/admin/business-types/${t._id}`, { active: !t.active });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete business type "${t.name}"?`)) return;
    setBusyId(t._id);
    try {
      await api.deleteBusinessType(`/admin/business-types/${t._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Business Types</h1>
          <p className="mt-1 text-sm text-mist-muted">
            The main business categories users choose first — every domain belongs to exactly one type
            (Business Type → Domain → Questions)
          </p>
        </div>
        {!showCreate && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New business type
          </button>
        )}
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-6">
          <BusinessTypeForm
            nextSortOrder={types.length + 1}
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {[...types]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
          .map((t) => (
            <div key={t._id} className="card">
              {editing?._id === t._id ? (
                <BusinessTypeForm
                  initial={t}
                  onCancel={() => setEditing(null)}
                  onSaved={async () => {
                    setEditing(null);
                    await load();
                  }}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-mist">{t.name}</h2>
                      <span className={`badge shrink-0 ${t.active ? 'bg-green-400/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="badge bg-slate-50 font-mono text-[10px] text-mist-muted">{t.key}</span>
                    </div>
                    {t.description && <p className="mt-1 text-xs text-mist-muted">{t.description}</p>}
                    <p className="mt-1 text-[11px] text-mist-muted/80">
                      order #{t.sortOrder} ·{' '}
                      <button
                        className="underline decoration-dotted underline-offset-2 hover:text-mist"
                        onClick={() => window.alert(`Open Admin → KY Domains to manage the domains under "${t.name}".`)}
                      >
                        {t.domainCount} domain{t.domainCount === 1 ? '' : 's'}
                      </button>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(t)}>
                      Edit
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busyId === t._id} onClick={() => toggleActive(t)}>
                      {t.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-danger" disabled={busyId === t._id} onClick={() => remove(t)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {types.length === 0 && !showCreate && !err && (
        <p className="mt-10 text-center text-sm text-mist-muted">
          No business types yet. The three defaults are created automatically when the first assessment runs.
        </p>
      )}
    </div>
  );
}
