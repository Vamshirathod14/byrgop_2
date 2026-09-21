import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { adminBrand as brand } from '../theme/brand.js';
import { CATEGORY_DISPLAY_LABELS, categoryDisplayName } from '../utils/categories.js';

const empty = { key: 'strategic', name: '', description: '', color: brand.palette.yellow[500], sortOrder: 1, active: true };

function CategoryForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (initial?._id) await api.updateCategory(`/admin/categories/${initial._id}`, payload);
      else await api.createCategory('/admin/categories', payload);
      onSaved();
    } catch (err) {
      setErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Key</label>
          <select
            className="input"
            value={form.key}
            onChange={(e) => set({ key: e.target.value })}
            disabled={!!initial?._id}
          >
            {Object.entries(CATEGORY_DISPLAY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Sort order</label>
          <input
            type="number"
            className="input"
            value={form.sortOrder}
            onChange={(e) => set({ sortOrder: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">Name</label>
        <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
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
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-mist-muted">
          Color (used in the result chart)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color}
            onChange={(e) => set({ color: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-slate-200 bg-transparent"
          />
          <input
            className="input"
            value={form.color}
            onChange={(e) => set({ color: e.target.value })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-mist">
        <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
        Active
      </label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create category'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setCats(await api.categories());
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${categoryDisplayName(c.key, c.name)}"? This may break related questions/results.`)) return;
    try {
      await api.deleteCategory(`/admin/categories/${c._id}`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist">Categories</h1>
          <p className="mt-1 text-sm text-mist-muted">The three assessment dimensions.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : '+ New category'}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      {showCreate && (
        <div className="mt-5">
          <CategoryForm
            onCancel={() => setShowCreate(false)}
            onSaved={async () => {
              setShowCreate(false);
              await load();
            }}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {cats.map((c) => (
          <div key={c._id} className="card">
            {editing?._id === c._id ? (
              <CategoryForm
                initial={c}
                onCancel={() => setEditing(null)}
                onSaved={async () => {
                  setEditing(null);
                  await load();
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ background: c.color }} />
                  <h2 className="font-display text-xl font-semibold text-mist">{categoryDisplayName(c.key, c.name)}</h2>
                  <span className={`badge ${c.active ? 'bg-green-400/15 text-green-700' : 'bg-red-400/15 text-red-700'}`}>
                    {c.active ? 'active' : 'inactive'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-mist-muted">{c.description}</p>
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(c)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(c)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
